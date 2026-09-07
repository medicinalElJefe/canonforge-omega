from __future__ import annotations

from pathlib import Path

from omega_runtime.cumulative_capability_r189 import (
    CAPABILITY_ORGANS_R189,
    EXECUTION_REGIMES_R189,
    base_family_ids_r189,
    capability_baseline_hash_r189,
    cumulative_summary_r189,
    required_capability_ids_r189,
    verify_cumulative_artifacts_r189,
)
from omega_runtime.system_manifest import summary as legacy_summary


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def test_r189_preserves_legacy_24_family_manifest_exactly():
    legacy = legacy_summary()
    assert legacy["family_count"] == 24
    assert legacy["complete_manifest"] is True
    assert base_family_ids_r189() == tuple(f"F{i:02d}" for i in range(24))


def test_r189_cumulative_capability_canon_spans_admitted_extensions_through_r188():
    ids = set(required_capability_ids_r189())
    expected = {
        "R85_RUNTIME_RECOVERY",
        "R106_UNIFIED_OPERATIONAL_CORE",
        "R136_R147_CALCULUS_VISUAL_RELATIVITY",
        "R169_SWARM_NAMESPACE",
        "R170_COMPUTATION",
        "R172_VALIDATION_FABRIC",
        "R173_CROSS_RUNTIME",
        "R174_FEDERATED_ORGANS",
        "R175_INDEPENDENT_SOLVER",
        "R176_WARP_COMPUTATION",
        "R178_CANDIDATE_LAB",
        "R179_B059_AI_SAI",
        "R180_LOAD_GOVERNOR",
        "R181_LIVE_ACCEPTANCE",
        "R182_CONTINUITY_DEPLOY_FIRST",
        "R183_SUCCESSOR_SUPERIORITY",
        "R184_IMPROVEMENT_DISCOVERY",
        "R185_172_CLOUD_FEDERATION",
        "R186_EXECUTION_EVIDENCE",
        "R187_BOUNDED_SELF_PATCH",
        "R188_MOTION_TIME",
    }
    assert expected <= ids
    assert len(CAPABILITY_ORGANS_R189) >= 37
    assert len(ids) >= 61


def test_r189_allows_multiple_execution_regimes_without_promoting_r188_to_universal_scheduler():
    assert set(EXECUTION_REGIMES_R189) == {
        "ASYNC_INDEPENDENT",
        "CAUSAL_DAG",
        "BOUNDED_WAVE",
        "SYNCHRONIZED_BARRIER_R188",
        "HETEROGENEOUS_FEDERATED",
    }


def test_r189_protected_artifact_inventory_is_complete_on_candidate_repository():
    proof = verify_cumulative_artifacts_r189(_repo_root())
    assert proof["complete"] is True, proof["missingArtifacts"]
    assert proof["missingArtifacts"] == []
    assert proof["requiredArtifactCount"] == proof["verifiedArtifactCount"]
    assert len(proof["inventorySha256"]) == 64


def test_r189_cumulative_summary_is_hash_bound_and_strictly_additive():
    summary = cumulative_summary_r189(_repo_root())
    assert summary["complete"] is True
    assert summary["baseFamilyCount"] == 24
    assert summary["extensionOrganCount"] >= 37
    assert summary["totalCapabilityGroups"] >= 61
    assert summary["law"]["upgrade"] == "ADD_OR_STRENGTHEN_WITHOUT_OVERWRITING_ADMITTED_CAPABILITY"
    assert summary["law"]["r188Role"] == "SPECIALIZED_SYNCHRONIZED_BARRIER_REGIME_NOT_UNIVERSAL_SCHEDULER"
    assert len(summary["baselineSha256"]) == 64
    assert summary["baselineSha256"] == capability_baseline_hash_r189()
