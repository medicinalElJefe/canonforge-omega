from __future__ import annotations

import argparse
import json
from hashlib import sha256
from pathlib import Path
import subprocess
from typing import Iterable, List

from omega_runtime.convergence import DonorArtifact, EvidenceState, build_snapshot, infer_capabilities, write_snapshot


DEFAULT_REFS = (
    "omega-v6-full-convergence",
    "omega-genesis-v1-full",
    "omega-v6-fresh-full",
    "omega-genesis-ci-base",
    "omega-autonomy-bootstrap",
    "omega-evolve/adaptive-memory-checkpoints-g1",
    "omega-evolve/ev005-authenticated-hybrid-node-v1",
    "omega-evolve/ev006-responsive-performance-guard-v1",
    "omega-evolve/ev007-adaptive-state-render-v1",
    "omega-evolve/ev008-earth-source-registry-v1",
    "omega-evolve/release-aware-cloud-deploy-g1",
    "omega-evolve/world-reconstruction-v1",
    "omega-governance/self-build-edge-deploy-g1",
)

IGNORED_PARTS = {".git", "node_modules", "__pycache__", ".pytest_cache", ".venv", "dist", "build"}
TEXT_SUFFIXES = {".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".toml", ".yml", ".yaml", ".md", ".html", ".css", ".txt", ".ps1", ".bat", ".cmd"}


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True, stderr=subprocess.STDOUT).strip()


def list_ref_files(ref: str) -> Iterable[tuple[str, str, int]]:
    raw = git("ls-tree", "-rl", ref)
    for line in raw.splitlines():
        if "\t" not in line:
            continue
        meta, path = line.split("\t", 1)
        parts = meta.split()
        if len(parts) < 4 or parts[1] != "blob":
            continue
        blob_sha = parts[2]
        try:
            size = int(parts[3])
        except ValueError:
            size = 0
        if any(part in IGNORED_PARTS for part in Path(path).parts):
            continue
        yield path, blob_sha, size


def hint_for(ref: str, path: str, max_bytes: int = 12000) -> str:
    suffix = Path(path).suffix.lower()
    if suffix not in TEXT_SUFFIXES:
        return ""
    try:
        content = subprocess.check_output(["git", "show", f"{ref}:{path}"], stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return ""
    return content[:max_bytes].decode("utf-8", errors="ignore")


def evidence_for(ref: str, path: str) -> EvidenceState:
    lower = path.lower()
    if "test" in lower or "verify" in lower or ".github/workflows" in lower:
        return EvidenceState.PARTIAL
    if ref == "omega-v6-full-convergence" and any(x in lower for x in ("omega_runtime", "api/", "cloudflare/omega-v6-worker")):
        return EvidenceState.VERIFIED
    if ref == "omega-genesis-v1-full" and any(x in lower for x in ("evolution", "self-build", "cloudflare/omega-genesis-worker")):
        return EvidenceState.PARTIAL
    return EvidenceState.UNKNOWN


def contradiction_hints(path: str, hint: str) -> List[str]:
    lower = f"{path}\n{hint}".lower()
    issues: List[str] = []
    if "random." in lower or "math.random" in lower:
        issues.append("randomized runtime value requires quarantine until proven non-authoritative")
    if "synthetic" in lower and any(word in lower for word in ("truth", "observation", "sensor", "live")):
        issues.append("synthetic/live truth boundary requires review")
    if "shell=true" in lower or "shell = true" in lower:
        issues.append("shell execution primitive requires bounded allow-list review")
    return issues


def inventory_ref(ref: str) -> List[DonorArtifact]:
    artifacts: List[DonorArtifact] = []
    for path, blob_sha, size in list_ref_files(ref):
        hint = hint_for(ref, path)
        capabilities = infer_capabilities(path, hint)
        if not capabilities and size > 1_500_000:
            continue
        artifacts.append(
            DonorArtifact(
                donor=ref,
                path=path,
                digest=blob_sha,
                size=size,
                source_kind="git_branch",
                evidence=evidence_for(ref, path),
                capabilities=capabilities,
                contradictions=contradiction_hints(path, hint),
            )
        )
    return artifacts


def load_sanitized_archive_manifest(path: Path | None) -> List[DonorArtifact]:
    if path is None or not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    artifacts: List[DonorArtifact] = []
    for entry in raw.get("artifacts", []):
        # Never accept connector URLs, account metadata, tokens, or IDs into the public convergence state.
        public_name = str(entry.get("name", "archive-artifact")).strip()[:180]
        family = str(entry.get("family", "drive_archive")).strip()[:120]
        fingerprint = str(entry.get("sha256") or sha256(public_name.encode("utf-8")).hexdigest())
        text_hint = " ".join(str(x) for x in entry.get("capability_hints", []))
        evidence_name = str(entry.get("evidence", "UNKNOWN")).upper()
        try:
            evidence = EvidenceState(evidence_name)
        except ValueError:
            evidence = EvidenceState.UNKNOWN
        artifacts.append(
            DonorArtifact(
                donor=family,
                path=public_name,
                digest=fingerprint,
                size=int(entry.get("size", 0) or 0),
                source_kind="sanitized_archive_manifest",
                evidence=evidence,
                capabilities=infer_capabilities(public_name, text_hint),
                contradictions=[str(x)[:240] for x in entry.get("contradictions", [])],
            )
        )
    return artifacts


def main() -> int:
    parser = argparse.ArgumentParser(description="Build OMEGA governed cross-lineage convergence snapshot")
    parser.add_argument("--canonical-ref", default="omega-v6-full-convergence")
    parser.add_argument("--genesis-ref", default="omega-genesis-v1-full")
    parser.add_argument("--output", default="convergence/latest.json")
    parser.add_argument("--archive-manifest", default="")
    parser.add_argument("--refs", nargs="*", default=list(DEFAULT_REFS))
    args = parser.parse_args()

    available = set(git("for-each-ref", "--format=%(refname:short)", "refs/remotes/origin", "refs/heads").replace("origin/", "").splitlines())
    refs = []
    for ref in args.refs:
        if ref in available and ref not in refs:
            refs.append(ref)
    for required in (args.canonical_ref, args.genesis_ref):
        if required in available and required not in refs:
            refs.insert(0, required)

    artifacts: List[DonorArtifact] = []
    for ref in refs:
        artifacts.extend(inventory_ref(ref))
    archive_path = Path(args.archive_manifest) if args.archive_manifest else None
    artifacts.extend(load_sanitized_archive_manifest(archive_path))

    snapshot = build_snapshot(artifacts, args.canonical_ref, args.genesis_ref)
    write_snapshot(snapshot, Path(args.output))
    print(json.dumps({
        "canonical_ref": args.canonical_ref,
        "genesis_ref": args.genesis_ref,
        "refs_scanned": refs,
        "artifacts": len(snapshot.donors),
        "capabilities": len(snapshot.capability_best),
        "pruned": len(snapshot.pruned),
        "quarantined": len(snapshot.quarantined),
        "unresolved": len(snapshot.unresolved),
        "next_objectives": snapshot.next_objectives[:8],
        "policy_digest": snapshot.policy_digest,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
