from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping

from .successor_gate import REQUIRED_CONNECTIONS_R183, SUCCESSOR_METRIC_WEIGHTS_R183
from .warp_candidate import canonical_sha256, validate_candidate_capsule


EVIDENCE_REVISION_R186 = "R186"
EVIDENCE_JOB_SCHEMA_R186 = "OMEGA_SUCCESSOR_EVIDENCE_JOB_R186"
EVIDENCE_RECEIPT_SCHEMA_R186 = "OMEGA_EXECUTION_DERIVED_SUCCESSOR_EVIDENCE_R186"


CAPABILITY_FILES = {
    "R170_REFERENCE_COMPUTE": "cloudflare/omega-v6-worker/src/compute/computeTruthR170.ts",
    "R172_HETEROGENEOUS_VALIDATION": "cloudflare/omega-v6-worker/src/validation/validationFabricR172.ts",
    "R173_CROSS_RUNTIME_PARITY": "cloudflare/omega-v6-worker/src/validation/crossRuntimeParityR173.ts",
    "R174_FEDERATED_ORGANS": "cloudflare/omega-v6-worker/src/federation/federatedOrganFabricR174.ts",
    "R175_INDEPENDENT_SOLVER": "cloudflare/omega-v6-worker/src/validation/independentSolverR175.ts",
    "R176_WARP_COMPUTE": "cloudflare/omega-v6-worker/src/swarm/warpComputationR176.ts",
    "R178_BUILD_CANDIDATE": "cloudflare/omega-v6-worker/src/swarm/warpBuildCandidateR178.ts",
    "R179_AI_SAI": "cloudflare/omega-v6-worker/src/intelligence/saiAiFusionR179.ts",
    "R180_LOAD_GOVERNOR": "cloudflare/omega-v6-worker/src/swarm/swarmGovernorR180.ts",
    "R181_LIVE_ACCEPTANCE": "cloudflare/omega-v6-worker/src/acceptance/liveAcceptanceR181.ts",
    "R183_SUCCESSOR_GATE": "cloudflare/omega-v6-worker/src/swarm/successorGateR183.ts",
    "R184_IMPROVEMENT_DISCOVERY": "cloudflare/omega-v6-worker/src/swarm/improvementDiscoveryR184.ts",
    "R185_172_CLOUD_FEDERATION": "cloudflare/omega-v6-worker/src/swarm/cloudSwarmR185.ts",
    "SOVEREIGN_SELF_BUILD": "omega_runtime/self_build.py",
    "SOVEREIGN_AGENT": "scripts/omega_sovereign_agent.py",
    "SAI_B059": "omega_runtime/sai_b059.py",
}


def _sha(value: Any) -> str:
    text = value if isinstance(value, str) else json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _exit_ok(value: Mapping[str, Any] | None) -> bool:
    return isinstance(value, Mapping) and int(value.get("exit_code", 1)) == 0


def _elapsed(value: Mapping[str, Any] | None) -> float:
    try:
        return max(0.0, float((value or {}).get("elapsed_seconds", 0.0)))
    except (TypeError, ValueError):
        return 0.0


def capabilities_from_root(root: Path) -> list[str]:
    return sorted(name for name, rel in CAPABILITY_FILES.items() if (root / rel).exists())


def stage_receipts(stage_evidence: Mapping[str, Any]) -> tuple[list[Dict[str, Any]], Dict[str, str]]:
    stages: list[Dict[str, Any]] = []
    hashes: Dict[str, str] = {}
    for kind in ("run_tests", "build_vite", "wrangler_dry_run", "verify_candidate"):
        evidence = stage_evidence.get(kind)
        if not isinstance(evidence, Mapping):
            stages.append({"kind": kind, "state": "MISSING", "evidenceSha256": None})
            continue
        digest = canonical_sha256(dict(evidence))
        hashes[kind] = digest
        stages.append({"kind": kind, "state": "VERIFIED", "evidenceSha256": digest})
    return stages, hashes


def execution_metric_vector(
    *,
    test_result: Mapping[str, Any] | None,
    typecheck_result: Mapping[str, Any] | None,
    dry_run_result: Mapping[str, Any] | None,
    verify_result: Mapping[str, Any] | None,
    capabilities: Iterable[str],
    changed_files: Iterable[str],
    objective: str,
    connections: Mapping[str, bool],
    clean_workspace: bool,
) -> Dict[str, float]:
    tests_ok = _exit_ok(test_result)
    typecheck_ok = _exit_ok(typecheck_result)
    dry_ok = _exit_ok(dry_run_result)
    verify_ok = bool(verify_result)
    caps = list(dict.fromkeys(str(x) for x in capabilities))
    changes = [str(x) for x in changed_files if str(x)]
    proof_passes = sum([tests_ok, typecheck_ok, dry_ok, verify_ok])
    federation = sum(bool(connections.get(k)) for k in ("canonicalEdge", "swarm", "genesisMachine", "opticalMachine")) / 4.0
    total_elapsed = _elapsed(test_result) + _elapsed(typecheck_result) + _elapsed(dry_run_result)
    # Deterministic resource/interaction references; same law is used for predecessor and successor.
    interactive_eff = 1.0 / (1.0 + total_elapsed / 120.0)
    resource_eff = 1.0 / (1.0 + total_elapsed / 300.0)
    return {
        "correctness": 1.0 if tests_ok else 0.0,
        "regressionSafety": sum([tests_ok, typecheck_ok, dry_ok]) / 3.0,
        "missionFit": 1.0 if objective.strip() and changes else 0.0,
        "proofCoverage": proof_passes / 4.0,
        "capabilityCoverage": min(1.0, len(caps) / max(1, len(CAPABILITY_FILES))),
        "interactiveEfficiency": interactive_eff,
        "resourceEfficiency": resource_eff,
        "recoverability": 1.0 if clean_workspace and tests_ok else 0.0,
        "continuity": 1.0 if "R180_LOAD_GOVERNOR" in caps and "R183_SUCCESSOR_GATE" in caps and tests_ok else 0.0,
        "federationConnectivity": federation,
        "sovereignConnectivity": 1.0 if connections.get("sovereignHost") else 0.0,
    }


def predecessor_metric_vector(
    *,
    benchmark: Mapping[str, Any],
    capabilities: Iterable[str],
    connections: Mapping[str, bool],
) -> Dict[str, float]:
    return execution_metric_vector(
        test_result=benchmark.get("tests") if isinstance(benchmark.get("tests"), Mapping) else None,
        typecheck_result=benchmark.get("typecheck") if isinstance(benchmark.get("typecheck"), Mapping) else None,
        dry_run_result=benchmark.get("dryRun") if isinstance(benchmark.get("dryRun"), Mapping) else None,
        verify_result={"predecessor": True} if benchmark.get("verified") is True else None,
        capabilities=capabilities,
        changed_files=[],
        objective="",
        connections=connections,
        clean_workspace=benchmark.get("cleanWorkspace") is True,
    )


def build_execution_evidence_r186(
    *,
    candidate: Mapping[str, Any],
    predecessor_sha: str,
    predecessor_metrics: Mapping[str, Any],
    predecessor_capabilities: Iterable[str],
    successor_sha: str,
    successor_branch: str,
    successor_metrics: Mapping[str, Any],
    successor_capabilities: Iterable[str],
    stage_evidence: Mapping[str, Any],
    connections: Mapping[str, bool],
    connection_receipts: Mapping[str, Any],
    changed_files: Iterable[str],
    diff_text: str,
) -> Dict[str, Any]:
    valid = validate_candidate_capsule(dict(candidate))
    stages, stage_hashes = stage_receipts(stage_evidence)
    changed = list(dict.fromkeys(str(x) for x in changed_files if str(x)))
    diff_sha = _sha(diff_text)
    artifact_core = {
        "sourceCommitSha": successor_sha,
        "candidateSha256": valid["capsuleSha256"],
        "changedFiles": changed,
        "diffSha256": diff_sha,
        "stageEvidence": stage_hashes,
    }
    artifact_sha = canonical_sha256(artifact_core)
    metric_evidence = {
        key: canonical_sha256({
            "metric": key,
            "predecessor": predecessor_metrics.get(key),
            "successor": successor_metrics.get(key),
            "basis": "R186_EXECUTION_DERIVED",
        })
        for key in SUCCESSOR_METRIC_WEIGHTS_R183
    }
    connection_evidence = {
        key: canonical_sha256({
            "connection": key,
            "observed": connections.get(key) is True,
            "receipt": connection_receipts.get(key),
        })
        for key in REQUIRED_CONNECTIONS_R183
        if connections.get(key) is True
    }
    mission = {
        "schema": "OMEGA_EXACT_BUILD_MISSION_R186",
        "revision": EVIDENCE_REVISION_R186,
        "exactBuildDevelopment": True,
        "objective": str(valid.get("objective") or ""),
        "candidateSha256": valid["capsuleSha256"],
        "predecessorCanonicalGitSha": predecessor_sha,
    }
    mission_sha = canonical_sha256(mission)
    design_output = {
        "schema": "OMEGA_IMPROVEMENT_DESIGN_OUTPUT_R184",
        "sourceBranch": successor_branch,
        "sourceCommitSha": successor_sha,
        "predecessorCanonicalGitSha": predecessor_sha,
        "candidateSha256": valid["capsuleSha256"],
        "missionSha256": mission_sha,
        "diffSha256": diff_sha,
        "artifactSha256": artifact_sha,
        "changedFiles": changed,
        "evidenceSha256": list(stage_hashes.values()),
        "metricEvidence": metric_evidence,
        "connectionEvidence": connection_evidence,
        "canonicalMutation": False,
        "githubMutationAuthorized": False,
        "deploymentAuthorized": False,
        "promotionAuthorized": False,
    }
    r183_payload = {
        "candidate": valid,
        "predecessor": {
            "canonicalGitSha": predecessor_sha,
            "metrics": dict(predecessor_metrics),
            "capabilities": list(predecessor_capabilities),
        },
        "successor": {
            "metrics": dict(successor_metrics),
            "capabilities": list(successor_capabilities),
            "verification": {"stages": stages},
            "connections": {key: connections.get(key) is True for key in REQUIRED_CONNECTIONS_R183},
        },
        "mission": mission,
        "designOutput": design_output,
    }
    core = {
        "schema": EVIDENCE_RECEIPT_SCHEMA_R186,
        "revision": EVIDENCE_REVISION_R186,
        "candidateId": valid["candidateId"],
        "candidateSha256": valid["capsuleSha256"],
        "predecessorCanonicalGitSha": predecessor_sha,
        "successorGitSha": successor_sha,
        "successorBranch": successor_branch,
        "predecessorMetrics": dict(predecessor_metrics),
        "successorMetrics": dict(successor_metrics),
        "predecessorCapabilities": list(predecessor_capabilities),
        "successorCapabilities": list(successor_capabilities),
        "verificationStages": stages,
        "connections": {key: connections.get(key) is True for key in REQUIRED_CONNECTIONS_R183},
        "changedFiles": changed,
        "diffSha256": diff_sha,
        "artifactSha256": artifact_sha,
        "metricEvidence": metric_evidence,
        "connectionEvidence": connection_evidence,
        "r183R184Payload": r183_payload,
        "authority": "AUTHENTICATED_EXECUTION_EVIDENCE_NOT_CANON",
        "canonicalMutation": False,
        "promotionAuthorized": False,
    }
    return {**core, "receiptSha256": canonical_sha256(core)}
