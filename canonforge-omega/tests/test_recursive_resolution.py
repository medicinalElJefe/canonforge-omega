import pytest

from omega_fusion_core.intrinsic_skin import NodeState, OmegaAddr, vector_residual
from omega_fusion_core.recursive_resolution import (
    Authority,
    BranchCandidate,
    BranchDisposition,
    BranchResolutionEngine,
    CheckResult,
    Lemma,
    ProofClass,
    PromotionEvidence,
    PromotionLevel,
    RecursivePromotionGate,
    compose_lemmas,
    information_gain,
    intersect_reachable_states,
    normalized_entropy,
    projection_commutation_residual,
)


def _state(address="a"):
    return NodeState(
        coord=OmegaAddr(address, 12, "local", 0),
        core_state={},
        skin_state={},
    )


def test_authority_order_is_strict():
    assert Authority.MEASURED > Authority.DERIVED_STANDARD
    assert Authority.DERIVED_STANDARD > Authority.DERIVED_LENS
    assert Authority.DERIVED_LENS > Authority.HYPOTHESIS


def test_physical_veto_precedes_canon_score():
    branch = BranchCandidate(
        "b",
        None,
        _state(),
        c_omega=100.0,
        phi=100.0,
        contradiction_q=0.0,
        burden_lambda=0.0,
        physical_checks=[
            CheckResult(
                "energy",
                False,
                Authority.DERIVED_STANDARD,
                "violates conservation",
            )
        ],
    )
    result = BranchResolutionEngine().resolve([branch])
    assert result.status == BranchDisposition.INCONSISTENT
    assert branch.disposition == BranchDisposition.REJECTED_PHYSICAL
    assert branch.canon_score() is None
    assert branch.decline_scar[0].startswith("PHYSICAL:")


def test_canon_veto_cannot_rescue_or_replace_physics():
    branch = BranchCandidate(
        "b",
        None,
        _state(),
        physical_checks=[
            CheckResult("physics", True, Authority.DERIVED_STANDARD)
        ],
        canon_checks=[
            CheckResult("proof-boundary", False, Authority.DERIVED_LENS, "not proved")
        ],
    )
    BranchResolutionEngine().admit(branch)
    assert branch.disposition == BranchDisposition.REJECTED_CANON


def test_single_survivor_is_resolved():
    good = BranchCandidate(
        "good",
        None,
        _state("good"),
        physical_checks=[CheckResult("p", True, Authority.DERIVED_STANDARD)],
        canon_checks=[CheckResult("c", True, Authority.DERIVED_LENS)],
    )
    bad = BranchCandidate(
        "bad",
        None,
        _state("bad"),
        physical_checks=[CheckResult("p", False, Authority.DERIVED_STANDARD, "bad")],
    )
    result = BranchResolutionEngine().resolve([bad, good])
    assert result.status == BranchDisposition.RESOLVED
    assert result.survivors[0].branch_id == "good"


def test_reachability_intersection_can_resolve_unique_state():
    forward = ([0.0, 0.0], [5.0, 5.0])
    backward = ([0.1, 0.0], [9.0, 9.0])
    result = intersect_reachable_states(forward, backward, vector_residual, 0.2)
    assert result.status == BranchDisposition.RESOLVED
    assert len(result.matches) == 1
    assert result.matches[0].forward_index == 0
    assert result.matches[0].backward_index == 0


def test_reachability_intersection_reports_inconsistent():
    result = intersect_reachable_states(
        ([0.0, 0.0],),
        ([10.0, 10.0],),
        vector_residual,
        0.1,
    )
    assert result.status == BranchDisposition.INCONSISTENT


def test_lemma_composition_requires_contract_compatibility():
    first = Lemma(
        "first",
        frozenset({"x"}),
        frozenset({"y"}),
        ProofClass.PHYSICAL_INVARIANT,
        Authority.MEASURED,
        True,
    )
    second = Lemma(
        "second",
        frozenset({"z"}),
        frozenset({"w"}),
        ProofClass.PHYSICAL_INVARIANT,
        Authority.MEASURED,
        True,
    )
    with pytest.raises(ValueError):
        compose_lemmas(first, second)


def test_lemma_composition_inherits_weakest_authority_and_proof():
    first = Lemma(
        "first",
        frozenset({"x"}),
        frozenset({"y"}),
        ProofClass.PHYSICAL_INVARIANT,
        Authority.MEASURED,
        True,
    )
    second = Lemma(
        "second",
        frozenset({"y"}),
        frozenset({"z"}),
        ProofClass.STRUCTURAL_ANALOGY,
        Authority.DERIVED_LENS,
        True,
    )
    merged = compose_lemmas(first, second)
    assert merged.input_contract == frozenset({"x"})
    assert merged.output_contract == frozenset({"z"})
    assert merged.proof_class == ProofClass.STRUCTURAL_ANALOGY
    assert merged.authority == Authority.DERIVED_LENS


def test_projection_commutation_residual_detects_preserved_dynamics():
    residual = projection_commutation_residual(
        [1.0, 2.0],
        lambda x: [v + 1.0 for v in x],
        lambda x: [sum(x)],
        lambda x: [x[0] + 2.0],
    )
    assert residual == 0.0


def test_projection_commutation_residual_detects_loss():
    residual = projection_commutation_residual(
        [1.0, 2.0],
        lambda x: [v + 1.0 for v in x],
        lambda x: [sum(x)],
        lambda x: [x[0] + 1.0],
    )
    assert residual == 1.0


def test_recursive_promotion_gate_strengthens_by_level():
    base = PromotionEvidence(
        replay=True,
        invariants=True,
        cross_skin=True,
        provenance=True,
        rollback=True,
    )
    gate = RecursivePromotionGate()
    assert gate.evaluate(PromotionLevel.EDGE, base) == "PROMOTE"
    assert gate.evaluate(PromotionLevel.LEMMA, base) == "HOLD"
    full = PromotionEvidence(
        replay=True,
        invariants=True,
        cross_skin=True,
        provenance=True,
        rollback=True,
        replication=True,
        out_of_sample=True,
        composition=True,
        commutation=True,
        residual_bound=True,
    )
    assert gate.evaluate(PromotionLevel.LENS, full) == "PROMOTE"


def test_information_gain_requires_real_probability_model():
    assert normalized_entropy([0.5, 0.5]) == 1.0
    assert information_gain([0.5, 0.5], [(1.0, [1.0, 0.0])]) == 1.0
    with pytest.raises(ValueError):
        information_gain([0.5, 0.5], [])


def test_resolution_ledger_is_append_only_and_replayable():
    from omega_fusion_core.recursive_resolution import ResolutionLedger

    ledger = ResolutionLedger()
    first = ledger.append("OBSERVE", {"value": 1})
    second = ledger.append("BRANCH", {"id": "b1"})
    assert first.index == 0
    assert second.index == 1
    assert second.previous_digest == first.digest
    assert ledger.verify() is True
    assert ledger.replay_digest() == ledger.canonical_digest


def test_resolution_ledger_preserves_decline_scar():
    from omega_fusion_core.recursive_resolution import ResolutionLedger

    branch = BranchCandidate(
        "bad",
        None,
        _state("bad"),
        physical_checks=[
            CheckResult("energy", False, Authority.DERIVED_STANDARD, "violates conservation")
        ],
    )
    BranchResolutionEngine().admit(branch)
    ledger = ResolutionLedger()
    event = ledger.record_branch(branch)
    assert event.payload["disposition"] == BranchDisposition.REJECTED_PHYSICAL.value
    assert event.payload["scar"][0].startswith("PHYSICAL:")
    assert ledger.verify() is True
