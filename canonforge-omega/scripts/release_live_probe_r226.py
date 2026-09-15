#!/usr/bin/env python3
"""R226 bounded live-release probe.

Classifies live admission failures so deterministic identity/provenance mismatches
fail immediately while transport/propagation failures remain retryable. This
module never mutates Canon or production. Validation preserves the cumulative
R217/R211/R205/R204/R181/R201/health truth boundaries from the production gate.
"""
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SCHEMA = "OMEGA_RELEASE_LIVE_PROBE_R226"
ENDPOINTS = {
    "r217": ("/api/system/r217/release-lease", 12),
    "r211_manifest": ("/api/system/r211/manifest", 12),
    "r211_status": ("/api/system/r211/status", 15),
    "r211_earth": ("/api/system/r211/query?domain=earth", 15),
    "r205": ("/api/system/r205/manifest", 12),
    "r204": ("/api/system/r204/manifest", 12),
    "r181": ("/api/acceptance/r181/manifest", 12),
    "r201": ("/api/mission/r201/verify", 12),
    "health": ("/_omega/health", 12),
}
R217_BOUNDARIES = (
    "releaseLeaseIsNotCanonAuthority", "releaseLeaseIsNotPromotionAuthority",
    "releaseLeaseIsNotExecutionAuthority", "releaseLeaseIsNotPhysicalPcProof",
    "workerVersionPlusLeaseIsDeploymentIdentityOnly", "unexpectedLeaseOrVersionBlocksAdmission",
)
R211_BOUNDARIES = (
    "driveSnapshotIsNotLiveDriveTelemetry", "publicSarCatalogIsNotRealTimeRadar",
    "sarMetadataIsNotInSarDeformation", "solverAvailableIsNotSolverExecuted",
    "cloudConfiguredIsNotCloudExecutionProof", "pcOnlineRequiresCurrentAuthenticatedHeartbeat",
    "returnedIsNotVerified", "verifiedReturnIsNotCanonState",
)

class DeterministicMismatch(RuntimeError):
    pass

@dataclass(frozen=True)
class ProbeResult:
    admitted: bool
    classification: str
    attempts: int
    elapsed_seconds: float


def require(condition: bool, classification: str, detail: Any = None) -> None:
    if not condition:
        suffix = "" if detail is None else ":" + json.dumps(detail, sort_keys=True, default=str)
        raise DeterministicMismatch(classification + suffix)


def fetch_json(url: str, timeout: int) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "omega-r226-release-probe"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        if response.status != 200:
            raise urllib.error.HTTPError(url, response.status, "non-200", response.headers, None)
        value = json.loads(response.read().decode("utf-8"))
    if not isinstance(value, dict):
        raise DeterministicMismatch(f"NON_OBJECT_RESPONSE:{url}")
    return value


def validate(p: dict[str, dict[str, Any]], sha: str, lease: str, run_id: str, run_attempt: str) -> None:
    r217 = p["r217"]
    require(
        r217.get("ok") is True
        and r217.get("schema") == "OMEGA_RELEASE_PROVENANCE_R217"
        and r217.get("state") == "DEPLOYMENT_PROVENANCE_BOUND"
        and r217.get("canonicalGitSha") == sha
        and r217.get("releaseLease") == lease
        and str(r217.get("releaseRunId")) == run_id
        and str(r217.get("releaseRunAttempt")) == run_attempt,
        "RELEASE_LEASE_OR_SHA_MISMATCH", r217,
    )
    require(r217.get("authority") == "DEPLOYMENT_PROVENANCE_ONLY_NOT_AUTHORIZATION", "R217_AUTHORITY_MISMATCH")
    rb = r217.get("truthBoundaries") or {}
    require(all(rb.get(key) is True for key in R217_BOUNDARIES), "R217_TRUTH_BOUNDARY_MISMATCH", rb)
    require(r217.get("canonicalMutation") is False and r217.get("promotionAuthorized") is False, "R217_AUTHORITY_INFLATION")

    m = p["r211_manifest"]
    require(m.get("ok") is True and m.get("schema") == "OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R211", "R211_MANIFEST_SCHEMA_MISMATCH", m)
    require(m.get("release") == "r211-operational-provenance-fabric" and m.get("canonicalGitSha") == sha, "R211_MANIFEST_IDENTITY_MISMATCH", m)
    require(re.fullmatch(r"[0-9a-f]{64}", str(m.get("receiptSha256", ""))) is not None, "R211_RECEIPT_INVALID")
    boundaries = m.get("truthBoundaries") or {}
    require(all(boundaries.get(key) is True for key in R211_BOUNDARIES), "R211_TRUTH_BOUNDARY_MISMATCH", boundaries)

    status = p["r211_status"]
    require(status.get("schema") == "OMEGA_OPERATIONAL_PROVENANCE_STATUS_R211" and status.get("canonicalGitSha") == sha and status.get("ok") is True, "R211_STATUS_MISMATCH", status)
    physical = status.get("physicalHost") or {}
    if physical.get("pcOnline"):
        require(physical.get("heartbeatCurrent") is True and physical.get("authenticated") is True, "PHYSICAL_HOST_HEARTBEAT_AUTH_MISMATCH", physical)

    earth = p["r211_earth"]
    require(earth.get("schema") == "OMEGA_OPERATIONAL_PROVENANCE_QUERY_R211" and earth.get("canonicalGitSha") == sha, "R211_EARTH_IDENTITY_MISMATCH", earth)
    earth_sar = [x for x in earth.get("results", []) if isinstance(x, dict) and x.get("id") == "earthSar"]
    require(bool(earth_sar) and earth_sar[0].get("evidenceClass") in ("LIVE_OBSERVED", "UNAVAILABLE"), "EARTH_SAR_EVIDENCE_CLASS_MISMATCH", earth_sar)

    r205, r204, r181, r201, health = p["r205"], p["r204"], p["r181"], p["r201"], p["health"]
    require(r205.get("schema") == "OMEGA_WHOLE_SYSTEM_CONTROL_MANIFEST_R205" and r205.get("canonicalGitSha") == sha, "R205_IDENTITY_MISMATCH", r205)
    require(r204.get("schema") == "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204" and r204.get("canonicalGitSha") == sha, "R204_IDENTITY_MISMATCH", r204)
    require(r181.get("canonicalGitSha") == sha, "R181_IDENTITY_MISMATCH", r181)
    require(r201.get("ok") is True and r201.get("verified") is True and r201.get("failures") == [], "R201_VERIFY_MISMATCH", r201)
    require(health.get("ok") is True, "HEALTH_MISMATCH", health)


def write_result(out: Path, result: ProbeResult) -> None:
    (out / "r226-live-probe.json").write_text(json.dumps({"schema": SCHEMA, **result.__dict__}, sort_keys=True), encoding="utf-8")


def probe(base: str, sha: str, lease: str, run_id: str, run_attempt: str, deadline: int, interval: float, out: Path) -> ProbeResult:
    out.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    attempts = 0
    last_transient = "NONE"
    while time.monotonic() - started < deadline:
        attempts += 1
        try:
            packets: dict[str, dict[str, Any]] = {}
            for name, (path, timeout) in ENDPOINTS.items():
                packets[name] = fetch_json(base.rstrip("/") + path, timeout)
                (out / f"{name}.json").write_text(json.dumps(packets[name], sort_keys=True), encoding="utf-8")
            validate(packets, sha, lease, run_id, run_attempt)
            result = ProbeResult(True, "LIVE_EXACT_IDENTITY_AND_CUMULATIVE_TRUTH_VERIFIED", attempts, time.monotonic() - started)
            write_result(out, result)
            return result
        except DeterministicMismatch as exc:
            result = ProbeResult(False, f"DETERMINISTIC:{exc}", attempts, time.monotonic() - started)
            write_result(out, result)
            return result
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            last_transient = f"{type(exc).__name__}:{exc}"
            (out / "last-transient.txt").write_text(last_transient, encoding="utf-8")
            remaining = deadline - (time.monotonic() - started)
            if remaining <= 0:
                break
            time.sleep(min(interval, max(0.0, remaining)))
    result = ProbeResult(False, f"TRANSIENT_DEADLINE_EXCEEDED:{last_transient}", attempts, time.monotonic() - started)
    write_result(out, result)
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--expected-sha", required=True)
    ap.add_argument("--expected-lease", required=True)
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--run-attempt", required=True)
    ap.add_argument("--deadline-seconds", type=int, default=360)
    ap.add_argument("--retry-interval", type=float, default=3.0)
    ap.add_argument("--output-dir", required=True)
    args = ap.parse_args()
    if not 30 <= args.deadline_seconds <= 600:
        raise SystemExit("deadline must be 30..600 seconds")
    result = probe(args.base, args.expected_sha, args.expected_lease, args.run_id, args.run_attempt, args.deadline_seconds, args.retry_interval, Path(args.output_dir))
    print(json.dumps({"schema": SCHEMA, **result.__dict__}, sort_keys=True))
    return 0 if result.admitted else 1

if __name__ == "__main__":
    raise SystemExit(main())
