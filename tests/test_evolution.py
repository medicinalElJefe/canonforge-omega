from pathlib import Path

from omega_genesis.evolution import build_snapshot, candidate_decision, load_policy, protected_path_violations


ROOT = Path(__file__).resolve().parents[1]


def test_evolution_policy_is_candidate_only():
    policy = load_policy(ROOT)
    assert policy.source_mutation_mode == "candidate_only"
    assert policy.promotion_mode == "proof_gated"
    assert policy.require_strict_improvement is True


def test_evolution_snapshot_compiles_backlog(tmp_path):
    snapshot = build_snapshot(ROOT, tmp_path)
    assert snapshot["schema"] == "omega.evolution.snapshot.v1"
    assert snapshot["manifest"]["status"] in {"PASS", "FAIL"}
    assert snapshot["provenance"]["status"] == "PASS"
    ids = {row["id"] for row in snapshot["objectives"]}
    assert "EV-004" in ids
    assert "EV-010" in ids
    assert snapshot["quality_vector"]["capability_total"] == 19
    assert any(row["status"] in {"GAP", "BLOCKED_EXTERNAL"} for row in snapshot["backlog"])


def test_candidate_requires_strict_improvement():
    baseline = {"policy_digest": "a" * 64, "quality_vector": {
        "manifest_integrity": 1, "provenance_integrity": 1, "live_core_capabilities": 10,
        "capability_total": 18, "objective_total": 10, "objectives_achieved": 3,
        "weighted_progress": 0.3, "weighted_gap": 0.7,
    }}
    same = {"policy_digest": "a" * 64, "quality_vector": dict(baseline["quality_vector"])}
    assert candidate_decision(baseline, same)["status"] == "QUARANTINE"

    improved = {"policy_digest": "a" * 64, "quality_vector": {**baseline["quality_vector"], "objectives_achieved": 4, "weighted_progress": 0.4, "weighted_gap": 0.6}}
    result = candidate_decision(baseline, improved)
    assert result["status"] == "PROMOTE_CANDIDATE"
    assert result["strict_improvement"] is True


def test_candidate_rejects_regression_even_with_other_gain():
    baseline = {"policy_digest": "a" * 64, "quality_vector": {
        "manifest_integrity": 1, "provenance_integrity": 1, "live_core_capabilities": 10,
        "capability_total": 18, "objective_total": 10, "objectives_achieved": 3,
        "weighted_progress": 0.3, "weighted_gap": 0.7,
    }}
    candidate = {"policy_digest": "a" * 64, "quality_vector": {
        "manifest_integrity": 1, "provenance_integrity": 1, "live_core_capabilities": 9,
        "capability_total": 18, "objective_total": 10, "objectives_achieved": 4,
        "weighted_progress": 0.4, "weighted_gap": 0.6,
    }}
    result = candidate_decision(baseline, candidate)
    assert result["status"] == "QUARANTINE"
    assert "regression:live_core_capabilities" in result["errors"]


def test_candidate_rejects_changed_evolution_policy():
    baseline = {
        "policy_digest": "a" * 64,
        "quality_vector": {
            "manifest_integrity": 1, "provenance_integrity": 1, "live_core_capabilities": 10,
            "capability_total": 18, "objective_total": 10, "objectives_achieved": 3,
            "weighted_progress": 0.3, "weighted_gap": 0.7,
        },
    }
    candidate = {
        "policy_digest": "b" * 64,
        "quality_vector": {
            "manifest_integrity": 1, "provenance_integrity": 1, "live_core_capabilities": 10,
            "capability_total": 18, "objective_total": 10, "objectives_achieved": 4,
            "weighted_progress": 0.4, "weighted_gap": 0.6,
        },
    }
    result = candidate_decision(baseline, candidate)
    assert result["status"] == "QUARANTINE"
    assert "evolution_policy_changed" in result["errors"]


def test_protected_paths_are_baseline_governed():
    policy = load_policy(ROOT)
    violations = protected_path_violations([
        "omega_genesis/learning.py",
        "config/evolution_policy.json",
        ".github/workflows/evolution-candidate.yml",
    ], policy)
    assert violations == [
        ".github/workflows/evolution-candidate.yml",
        "config/evolution_policy.json",
    ]
