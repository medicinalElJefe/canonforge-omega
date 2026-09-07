from pathlib import Path

from omega_runtime.improvement_discovery import (
    DESIGN_OUTPUT_SCHEMA_R184,
    discover_improvement_r184,
)
from omega_runtime.successor_gate import SUCCESSOR_METRIC_WEIGHTS_R183
from omega_runtime.warp_candidate import build_candidate_capsule, canonical_sha256

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src"
TS_DISCOVERY = WORKER / "swarm" / "improvementDiscoveryR184.ts"
RUNTIME = WORKER / "runtimeEntryR169.ts"


def source_status() -> dict:
    invariant = {
        "schema": "OMEGA_WARP_COMPLETION_INVARIANT_R177", "integrityRevision": "R177", "strict": True,
        "expectedCells": 12, "accountedCells": 12, "delta": 0, "allShardsAccounted": True,
        "invalidShardCount": 0, "invalidShards": [],
    }
    receipt = {
        "schema": "OMEGA_WARP_EXECUTION_RECEIPT_R176", "revision": "R176", "integrityRevision": "R177",
        "warpId": "warp_r184_fixture", "profile": "PULSE", "purpose": "BUILD", "status": "COMPLETE",
        "shardCount": 1, "totalCells": 12, "completedCells": 12, "failedCells": 0,
        "strictCompletionInvariant": True, "completionInvariant": invariant,
        "childMissionHashes": ["c" * 64], "resultMerkleRoot": "a" * 64,
        "proofState": "RETURNED_NOT_ADMITTED", "authority": "WARP_EXECUTION_RECEIPT_NOT_CANON",
        "canonicalMutation": False, "nativeExecutionClaim": False, "performanceGuaranteeClaim": False,
        "physicalDimensionClaim": False, "truthBoundary": "fixture", "receiptSha256": "b" * 64,
    }
    return {
        "ok": True, "schema": "OMEGA_WARP_STATUS_R176", "revision": "R176", "integrityRevision": "R177",
        "warpId": receipt["warpId"], "profile": "PULSE", "purpose": "BUILD", "state": "COMPLETE",
        "totalCells": 12, "completedCells": 12, "failedCells": 0, "shardCount": 1, "progress": 100,
        "completionInvariant": invariant, "resultMerkleRoot": "a" * 64, "receipt": receipt,
        "canonicalMutation": False,
    }


def evaluation_payload() -> dict:
    mission = {"exactBuildDevelopment": True, "objective": "Improve OMEGA build performance without flattening admitted capability."}
    candidate = build_candidate_capsule(source_status(), mission["objective"])
    predecessor_sha = "a" * 40
    metrics_before = {key: 0.78 for key in SUCCESSOR_METRIC_WEIGHTS_R183}
    metrics_after = {key: 0.86 for key in SUCCESSOR_METRIC_WEIGHTS_R183}
    stages = [
        {"kind": kind, "state": "VERIFIED", "evidenceSha256": char * 64}
        for kind, char in [("run_tests", "1"), ("build_vite", "2"), ("wrangler_dry_run", "3"), ("verify_candidate", "4")]
    ]
    connections = {key: True for key in ("canonicalEdge", "swarm", "genesisMachine", "opticalMachine", "sovereignHost", "sai")}
    design = {
        "schema": DESIGN_OUTPUT_SCHEMA_R184,
        "sourceBranch": "feature/r184-exact-successor",
        "sourceCommitSha": "d" * 40,
        "predecessorCanonicalGitSha": predecessor_sha,
        "candidateSha256": candidate["capsuleSha256"],
        "missionSha256": canonical_sha256(mission),
        "diffSha256": "5" * 64,
        "artifactSha256": "6" * 64,
        "changedFiles": ["canonforge-omega/runtime.py", "canonforge-omega/tests/test_runtime.py"],
        "evidenceSha256": ["7" * 64, "8" * 64],
        "metricEvidence": {key: "9" * 64 for key in SUCCESSOR_METRIC_WEIGHTS_R183},
        "connectionEvidence": {key: "e" * 64 for key in connections},
        "canonicalMutation": False,
        "githubMutationAuthorized": False,
        "deploymentAuthorized": False,
        "promotionAuthorized": False,
    }
    return {
        "mission": mission,
        "candidate": candidate,
        "predecessor": {"canonicalGitSha": predecessor_sha, "capabilities": ["SWARM", "SAI", "VISUAL", "SOVEREIGN"], "metrics": metrics_before},
        "successor": {"capabilities": ["SWARM", "SAI", "VISUAL", "SOVEREIGN", "R184_DESIGN_OUTPUT"], "metrics": metrics_after, "verification": {"stages": stages}, "connections": connections},
        "designOutput": design,
    }


def test_r184_superior_exact_design_is_discovered_synchronously_as_release_intent():
    payload = evaluation_payload()
    result = discover_improvement_r184(payload)
    assert result["state"] == "DISCOVERED_SUPERIOR_DESIGN_OUTPUT"
    assert result["discoveredSuperiorDesign"] is True
    assert result["designValidation"]["valid"] is True
    assert result["successorEvaluation"]["promotionReady"] is True
    assert result["continuation"] is None
    release = result["releaseIntent"]
    assert release["sourceCommitSha"] == payload["designOutput"]["sourceCommitSha"]
    assert release["predecessorCanonicalGitSha"] == payload["predecessor"]["canonicalGitSha"]
    assert release["diffSha256"] == payload["designOutput"]["diffSha256"]
    assert release["missionSha256"] == canonical_sha256(payload["mission"])
    assert len(release["packetSha256"]) == 64
    assert release["authority"] == "RELEASE_INTENT_NOT_RELEASE_AUTHORITY"
    assert release["canonicalMutation"] is False
    assert release["githubMutationAuthorized"] is False
    assert release["deploymentAuthorized"] is False
    assert release["promotionAuthorized"] is False


def test_r184_mission_identity_mismatch_never_promotes_and_becomes_continuation_work():
    payload = evaluation_payload()
    payload["designOutput"]["missionSha256"] = "f" * 64
    result = discover_improvement_r184(payload)
    assert result["state"] == "CONTINUE_SHAPING"
    assert result["releaseIntent"] is None
    assert "DESIGN_MISSION_HASH_MISMATCH" in result["designValidation"]["blockers"]
    mission = result["continuation"]["nextMission"]
    assert mission["priority"] == "DEVELOPMENT"
    assert mission["requestedCells"] == 12
    assert mission["providerBudget"] == 0
    assert mission["allowFullAuto"] is False


def test_r184_requires_a_real_successor_commit_not_the_predecessor_identity():
    payload = evaluation_payload()
    payload["designOutput"]["sourceCommitSha"] = payload["predecessor"]["canonicalGitSha"]
    result = discover_improvement_r184(payload)
    assert result["state"] == "CONTINUE_SHAPING"
    assert "DESIGN_SOURCE_MUST_DIFFER_FROM_PREDECESSOR" in result["designValidation"]["blockers"]
    assert result["releaseIntent"] is None


def test_r184_cloud_route_and_truth_boundary_are_present():
    ts = TS_DISCOVERY.read_text(encoding="utf-8")
    runtime = RUNTIME.read_text(encoding="utf-8")
    assert 'synchronousDiscoveryOnEvaluationReceipt: true' in ts
    assert 'exactMissionHashRequired: true' in ts
    assert 'allR183MetricEvidenceRequired: true' in ts
    assert 'automaticCanonicalPromotion: false' in ts
    assert 'RELEASE_INTENT_NOT_RELEASE_AUTHORITY' in ts
    assert 'handleImprovementDiscoveryR184' in runtime
    assert '/api/swarm/improvement/r184/' in runtime
