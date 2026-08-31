from omega_runtime.convergence import (
    CandidateScore,
    Disposition,
    DonorArtifact,
    EvidenceState,
    build_snapshot,
    disposition_for,
    infer_capabilities,
    pareto_dominates,
    select_pareto_front,
)


def test_infer_capabilities_maps_runtime_behaviors():
    scores = infer_capabilities("omega_runtime/render.py", "proof evidence canvas state continuity")
    assert "visual_runtime" in scores
    assert "proof" in scores
    assert "state" in scores
    assert "relation" in scores


def test_disposition_prunes_cache_and_quarantines_synthetic_truth():
    cache = DonorArtifact("old", "pkg/__pycache__/thing.pyc", "x")
    assert disposition_for(cache) == Disposition.PRUNE

    synthetic = DonorArtifact(
        "old",
        "runtime/live_truth.py",
        "y",
        capabilities={"observation": 0.8},
        contradictions=["synthetic randomized runtime value"],
    )
    assert disposition_for(synthetic) == Disposition.QUARANTINE


def test_verified_capability_beats_unknown_donor():
    verified = DonorArtifact(
        "v6",
        "omega_runtime/proof.py",
        "1",
        evidence=EvidenceState.VERIFIED,
        capabilities={"proof": 0.7},
    )
    unknown = DonorArtifact(
        "archive",
        "proof_engine.py",
        "2",
        evidence=EvidenceState.UNKNOWN,
        capabilities={"proof": 0.8},
    )
    snapshot = build_snapshot([unknown, verified], "v6", "genesis")
    assert snapshot.capability_best["proof"]["donor"] == "v6"
    assert snapshot.policy_digest


def test_pareto_front_rejects_strictly_dominated_candidate():
    strong = CandidateScore("strong", 1, 1, 1, 1, 1, 1, 0.1, 0.1)
    weak = CandidateScore("weak", 0.9, 0.8, 0.8, 0.8, 0.8, 0.8, 0.2, 0.2)
    tradeoff = CandidateScore("tradeoff", 1, 0.7, 0.9, 1.2, 0.8, 0.9, 0.1, 0.1)
    assert pareto_dominates(strong, weak)
    names = {candidate.candidate for candidate in select_pareto_front([strong, weak, tradeoff])}
    assert "weak" not in names
    assert names == {"strong", "tradeoff"}
