from pathlib import Path

from omega_runtime.successor_gate import (
    SUCCESSOR_METRIC_WEIGHTS_R183,
    evaluate_successor_r183,
)
from omega_runtime.warp_candidate import build_candidate_capsule

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src"
RUNTIME = WORKER / "runtimeEntryR169.ts"
TS_GATE = WORKER / "swarm" / "successorGateR183.ts"


def strict_source_status() -> dict:
    total = 12
    invariant = {
        "schema": "OMEGA_WARP_COMPLETION_INVARIANT_R177",
        "integrityRevision": "R177",
        "strict": True,
        "expectedCells": total,
        "accountedCells": total,
        "delta": 0,
        "allShardsAccounted": True,
        "invalidShardCount": 0,
        "invalidShards": [],
    }
    receipt = {
        "schema": "OMEGA_WARP_EXECUTION_RECEIPT_R176",
        "revision": "R176",
        "integrityRevision": "R177",
        "warpId": "warp_r183_fixture",
        "profile": "PULSE",
        "purpose": "BUILD",
        "status": "COMPLETE",
        "shardCount": 1,
        "totalCells": total,
        "completedCells": total,
        "failedCells": 0,
        "strictCompletionInvariant": True,
        "completionInvariant": invariant,
        "childMissionHashes": ["c" * 64],
        "resultMerkleRoot": "a" * 64,
        "proofState": "RETURNED_NOT_ADMITTED",
        "authority": "WARP_EXECUTION_RECEIPT_NOT_CANON",
        "canonicalMutation": False,
        "nativeExecutionClaim": False,
        "performanceGuaranteeClaim": False,
        "physicalDimensionClaim": False,
        "truthBoundary": "software execution receipt fixture",
        "receiptSha256": "b" * 64,
    }
    return {
        "ok": True,
        "schema": "OMEGA_WARP_STATUS_R176",
        "revision": "R176",
        "integrityRevision": "R177",
        "warpId": receipt["warpId"],
        "profile": receipt["profile"],
        "purpose": receipt["purpose"],
        "state": "COMPLETE",
        "totalCells": total,
        "completedCells": total,
        "failedCells": 0,
        "shardCount": 1,
        "progress": 100,
        "completionInvariant": invariant,
        "resultMerkleRoot": receipt["resultMerkleRoot"],
        "receipt": receipt,
        "canonicalMutation": False,
    }


def metrics(value: float) -> dict:
    return {key: value for key in SUCCESSOR_METRIC_WEIGHTS_R183}


def verification() -> dict:
    return {
        "stages": [
            {"kind": kind, "state": "VERIFIED", "evidenceSha256": char * 64}
            for kind, char in [
                ("run_tests", "1"),
                ("build_vite", "2"),
                ("wrangler_dry_run", "3"),
                ("verify_candidate", "4"),
            ]
        ]
    }


def connections(**overrides: bool) -> dict:
    base = {
        "canonicalEdge": True,
        "swarm": True,
        "genesisMachine": True,
        "opticalMachine": True,
        "sovereignHost": True,
        "sai": True,
    }
    base.update(overrides)
    return base


def payload(predecessor_metrics: dict, successor_metrics: dict, predecessor_caps=None, successor_caps=None, connection_state=None) -> dict:
    candidate = build_candidate_capsule(strict_source_status(), "Produce a measurable additive successor without flattening admitted capability.")
    return {
        "candidate": candidate,
        "predecessor": {
            "canonicalGitSha": "a" * 40,
            "capabilities": predecessor_caps or ["SWARM", "SAI", "VISUAL", "SOVEREIGN"],
            "metrics": predecessor_metrics,
        },
        "successor": {
            "capabilities": successor_caps or ["SWARM", "SAI", "VISUAL", "SOVEREIGN", "SUCCESSOR_GATE"],
            "metrics": successor_metrics,
            "verification": verification(),
            "connections": connection_state or connections(),
        },
    }


def test_r183_superior_successor_emits_hash_bound_promotion_packet_without_self_promotion():
    result = evaluate_successor_r183(payload(metrics(0.80), metrics(0.86)))
    assert result["state"] == "SUPERIOR_SUCCESSOR_READY_FOR_RELEASE"
    assert result["superior"] is True
    assert result["promotionReady"] is True
    assert result["scores"]["delta"] > 0
    assert result["capabilities"]["preserved"] is True
    assert result["capabilities"]["gained"] == ["SUCCESSOR_GATE"]
    packet = result["promotionPacket"]
    assert packet["authority"] == "PROMOTION_CANDIDATE_PACKET_NOT_RELEASE_AUTHORITY"
    assert packet["nextAction"] == "OPEN_RELEASE_PR_THEN_RUN_CANONICAL_VERIFY_DEPLOY_AND_POST_DEPLOY_PROOFS"
    assert len(packet["packetSha256"]) == 64
    assert packet["canonicalMutation"] is False
    assert packet["githubMutationAuthorized"] is False
    assert packet["deploymentAuthorized"] is False
    assert packet["promotionAuthorized"] is False
    assert result["continuation"] is None


def test_r183_hard_regression_becomes_scar_and_small_continuity_mission_instead_of_stop():
    before = metrics(0.85)
    after = metrics(0.90)
    after["correctness"] = 0.40
    result = evaluate_successor_r183(payload(before, after))
    assert result["state"] == "NOT_YET_SUPERIOR_CONTINUE"
    assert result["promotionReady"] is False
    assert result["promotionPacket"] is None
    assert any(row["metric"] == "correctness" and row["hard"] for row in result["regressions"])
    assert result["scarPacket"]["carryForward"] is True
    assert len(result["scarPacket"]["packetSha256"]) == 64
    continuation = result["continuation"]
    assert continuation["continueDevelopment"] is True
    assert continuation["nextMission"]["priority"] == "DEVELOPMENT"
    assert continuation["nextMission"]["requestedCells"] == 12
    assert continuation["nextMission"]["providerBudget"] == 0
    assert continuation["nextMission"]["allowFullAuto"] is False


def test_r183_superior_math_still_waits_for_all_connection_proof_while_continuing_development():
    result = evaluate_successor_r183(payload(metrics(0.75), metrics(0.84), connection_state=connections(sovereignHost=False)))
    assert result["superior"] is True
    assert result["promotionReady"] is False
    assert result["state"] == "SUPERIOR_BUT_PROOF_INCOMPLETE_CONTINUE"
    assert "sovereignHost" in result["connections"]["missing"]
    assert result["promotionPacket"] is None
    assert result["continuation"]["continueDevelopment"] is True


def test_r183_rejects_capability_flattening_even_when_weighted_metrics_rise():
    result = evaluate_successor_r183(payload(
        metrics(0.70),
        metrics(0.95),
        predecessor_caps=["SWARM", "SAI", "VISUAL", "SOVEREIGN"],
        successor_caps=["SWARM", "SAI", "SOVEREIGN"],
    ))
    assert result["superior"] is False
    assert result["capabilities"]["lost"] == ["VISUAL"]
    assert any(item.startswith("CAPABILITY_REGRESSION:") for item in result["blockers"])
    assert result["continuation"]["continueDevelopment"] is True


def test_r183_cloud_and_sovereign_contract_share_metric_weights_and_route():
    ts = TS_GATE.read_text(encoding="utf-8")
    runtime = RUNTIME.read_text(encoding="utf-8")
    assert abs(sum(SUCCESSOR_METRIC_WEIGHTS_R183.values()) - 1.0) < 1e-12
    for key, weight in SUCCESSOR_METRIC_WEIGHTS_R183.items():
        assert f"{key}: {weight:.2f}" in ts
    assert 'SUPERIOR_SUCCESSOR_READY_FOR_RELEASE' in ts
    assert 'NOT_YET_SUPERIOR_CONTINUE' in ts
    assert 'CONTINUATION_PROPOSAL_THROUGH_R180_GOVERNOR_NOT_EXECUTION_AUTHORITY' in ts
    assert 'handleSuccessorGateR183' in runtime
    assert '/api/swarm/successor/r183/' in runtime
