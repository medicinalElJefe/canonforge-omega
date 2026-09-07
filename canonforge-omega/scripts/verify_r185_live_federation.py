from __future__ import annotations

import argparse
import concurrent.futures
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

NODE_COUNT = 172
WAVE_COUNT = 15
R185_SCHEMA = "OMEGA_172_CLOUD_FEDERATION_R185"
R185_HEALTH_SCHEMA = "OMEGA_172_CLOUD_HEALTH_R185"
R185_NODE_SCHEMA = "OMEGA_CLOUD_NODE_STATUS_R185"
R181_SCHEMA = "OMEGA_LIVE_ACCEPTANCE_MANIFEST_R181"


def fetch(url: str, *, attempts: int = 5, timeout: float = 30.0) -> tuple[bytes, dict[str, str]]:
    last: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "accept": "application/json,text/html;q=0.9,*/*;q=0.8",
                    "user-agent": "OMEGA-R213-release-proof/1.0",
                    "cache-control": "no-cache",
                },
            )
            with urllib.request.urlopen(request, timeout=timeout) as response:
                if response.status < 200 or response.status >= 300:
                    raise RuntimeError(f"HTTP {response.status} for {url}")
                return response.read(), {k.lower(): v for k, v in response.headers.items()}
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError) as exc:
            last = exc
            if attempt < attempts:
                time.sleep(min(2.0, 0.25 * (2 ** (attempt - 1))))
    raise RuntimeError(f"endpoint failed after {attempts} attempts: {url}: {last}")


def fetch_json(url: str, *, attempts: int = 5, timeout: float = 30.0) -> dict[str, Any]:
    raw, _ = fetch(url, attempts=attempts, timeout=timeout)
    value = json.loads(raw.decode("utf-8"))
    if not isinstance(value, dict):
        raise RuntimeError(f"expected object from {url}")
    return value


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def prove_identity(base: str, expected_sha: str) -> dict[str, Any]:
    value = fetch_json(f"{base}/api/acceptance/r181/manifest")
    require(value.get("ok") is True, f"R181 manifest not ok: {value}")
    require(value.get("schema") == R181_SCHEMA, f"R181 schema mismatch: {value.get('schema')}")
    require(value.get("deploymentIdentityBound") is True, "R181 deployment identity is not bound")
    require(value.get("canonicalGitSha") == expected_sha, f"R181 SHA mismatch: {value.get('canonicalGitSha')} != {expected_sha}")
    return value


def prove_manifest(base: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    manifest = fetch_json(f"{base}/api/clouds/r185/manifest")
    health = fetch_json(f"{base}/api/clouds/r185/health")
    require(manifest.get("ok") is True, f"R185 manifest not ok: {manifest}")
    require(manifest.get("schema") == R185_SCHEMA, f"R185 manifest schema mismatch: {manifest.get('schema')}")
    require(manifest.get("revision") == "R185", f"R185 revision mismatch: {manifest.get('revision')}")
    require(manifest.get("nodeCount") == NODE_COUNT, f"R185 nodeCount mismatch: {manifest.get('nodeCount')}")
    require(manifest.get("allNodesConfigured") is True, "R185 does not report all nodes configured")
    require(manifest.get("durableObjectBindingAvailable") is True, "R185 Durable Object binding unavailable")
    require(health.get("ok") is True, f"R185 health not ok: {health}")
    require(health.get("schema") == R185_HEALTH_SCHEMA, f"R185 health schema mismatch: {health.get('schema')}")
    require(health.get("configuredNodes") == NODE_COUNT, f"R185 configuredNodes mismatch: {health.get('configuredNodes')}")
    require(health.get("independentlyNamedStateNodes") == NODE_COUNT, f"R185 independentlyNamedStateNodes mismatch: {health.get('independentlyNamedStateNodes')}")
    require(health.get("durableObjectBindingAvailable") is True, "R185 health says Durable Object binding unavailable")
    nodes = manifest.get("nodes") or []
    require(isinstance(nodes, list) and len(nodes) == NODE_COUNT, f"R185 manifest node inventory mismatch: {len(nodes) if isinstance(nodes, list) else type(nodes)}")
    public = [((node.get("links") or {}).get("public")) for node in nodes]
    machine = [((node.get("links") or {}).get("machine")) for node in nodes]
    durable = [node.get("durableObjectName") for node in nodes]
    require(None not in public and len(set(public)) == NODE_COUNT, "R185 public links are incomplete or non-unique")
    require(None not in machine and len(set(machine)) == NODE_COUNT, "R185 machine links are incomplete or non-unique")
    require(None not in durable and len(set(durable)) == NODE_COUNT, "R185 Durable Object names are incomplete or non-unique")
    require(len(manifest.get("waves") or []) == WAVE_COUNT, f"R185 wave count mismatch: {len(manifest.get('waves') or [])}")
    return manifest, nodes


def verify_node(node: dict[str, Any]) -> dict[str, Any]:
    ordinal = int(node.get("ordinal"))
    expected_id = f"omega-cloud-{ordinal:03d}"
    require(node.get("id") == expected_id, f"descriptor id mismatch for ordinal {ordinal}: {node.get('id')}")
    links = node.get("links") or {}
    public = str(links.get("public") or "")
    machine = str(links.get("machine") or "")
    require(public and machine, f"node {expected_id} missing advertised links")

    public_raw, public_headers = fetch(public)
    require("text/html" in public_headers.get("content-type", ""), f"node {expected_id} public route is not HTML: {public_headers.get('content-type')}")
    require(expected_id.encode("utf-8") in public_raw, f"node {expected_id} public route does not render its identity")

    status = fetch_json(machine)
    require(status.get("ok") is True, f"node {expected_id} machine status not ok: {status}")
    require(status.get("schema") == R185_NODE_SCHEMA, f"node {expected_id} machine schema mismatch: {status.get('schema')}")
    returned = status.get("node") or {}
    runtime = status.get("runtime") or {}
    require(returned.get("id") == expected_id, f"node {expected_id} returned wrong id: {returned.get('id')}")
    require(returned.get("ordinal") == ordinal, f"node {expected_id} returned wrong ordinal: {returned.get('ordinal')}")
    require((returned.get("links") or {}).get("public") == public, f"node {expected_id} public link changed between manifest and status")
    require((returned.get("links") or {}).get("machine") == machine, f"node {expected_id} machine link changed between manifest and status")
    require(runtime.get("reachable") is True, f"node {expected_id} Durable Object runtime unreachable: {runtime}")
    require(returned.get("separateCloudProviderInstanceClaim") is False, f"node {expected_id} changed provider-instance truth boundary")
    require(returned.get("canonicalMutation") is False, f"node {expected_id} changed Canon mutation boundary")
    return {"ordinal": ordinal, "id": expected_id, "public": public, "machine": machine, "runtimeStatus": runtime.get("status")}


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the deployed OMEGA R185 172-node federation against one exact canonical SHA.")
    parser.add_argument("--base", required=True)
    parser.add_argument("--expected-sha", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--workers", type=int, default=12)
    args = parser.parse_args()

    base = args.base.rstrip("/")
    expected_sha = args.expected_sha.strip().lower()
    require(len(expected_sha) == 40 and all(c in "0123456789abcdef" for c in expected_sha), f"invalid expected SHA: {expected_sha}")
    require(1 <= args.workers <= 24, "workers must be between 1 and 24")
    output = Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)

    prove_identity(base, expected_sha)
    manifest_before, nodes = prove_manifest(base)
    manifest_sha = str(manifest_before.get("manifestSha256") or "")
    require(len(manifest_sha) == 64 and all(c in "0123456789abcdef" for c in manifest_sha.lower()), f"invalid R185 manifestSha256: {manifest_sha}")

    results: list[dict[str, Any]] = []
    failures: list[str] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        future_to_node = {pool.submit(verify_node, node): node for node in nodes}
        for future in concurrent.futures.as_completed(future_to_node):
            node = future_to_node[future]
            ordinal = node.get("ordinal")
            try:
                result = future.result()
                results.append(result)
                print(f"R185_NODE_VERIFIED {result['id']}", flush=True)
            except Exception as exc:
                message = f"ordinal={ordinal} id={node.get('id')} error={exc}"
                failures.append(message)
                print(f"R185_NODE_FAILED {message}", flush=True)

    results.sort(key=lambda row: row["ordinal"])
    (output / "r185-cloud-links.txt").write_text("".join(f"{row['public']}\n" for row in results), encoding="utf-8")
    if failures:
        (output / "r185-failures.txt").write_text("\n".join(failures) + "\n", encoding="utf-8")
        raise RuntimeError(f"R185 federation verification failed for {len(failures)} node(s): {failures[:8]}")
    require(len(results) == NODE_COUNT, f"R185 verified node count mismatch: {len(results)}")

    manifest_after, nodes_after = prove_manifest(base)
    prove_identity(base, expected_sha)
    require(manifest_after.get("manifestSha256") == manifest_sha, "R185 manifest changed during the exhaustive federation sweep")
    require([node.get("id") for node in nodes_after] == [node.get("id") for node in nodes], "R185 node inventory changed during the exhaustive federation sweep")

    receipt = {
        "schema": "OMEGA_LIVE_172_CLOUD_FEDERATION_PROOF_R213",
        "revision": "R213",
        "canonicalGitSha": expected_sha,
        "r185ManifestSha256": manifest_sha,
        "configuredNodes": NODE_COUNT,
        "verifiedPublicRoutes": NODE_COUNT,
        "verifiedMachineRoutes": NODE_COUNT,
        "verifiedDurableObjectRuntimes": NODE_COUNT,
        "boundedConcurrency": args.workers,
        "deploymentIdentityStableAcrossSweep": True,
        "manifestStableAcrossSweep": True,
        "canonicalMutation": False,
        "promotionAuthorizedByReceipt": False,
        "nodes": results,
    }
    (output / "r185-live-federation-r213.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"R213_R185_LIVE_172_FEDERATION_VERIFIED sha={expected_sha} manifest={manifest_sha}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
