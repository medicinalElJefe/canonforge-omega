import pytest

from omega_runtime.intrinsic_skin import (
    OmegaAddr, SKINS, canonical_20736_skin, cross_skin_q, decide_resolution, skin_manifest,
)
from omega_runtime.state import Address20736, EvidenceClass, MotionState, StateEnvelope, StateMetrics


def envelope():
    return StateEnvelope(
        address=Address20736(2, 3, 4, 5),
        evidence_class=EvidenceClass.DERIVED,
        metrics=StateMetrics(continuity=.9, burden=.2, contradiction=.1, future_plasticity=.7, proof_scar=.03),
        motion=MotionState(a=.2, v=.4, c=.6, q=.1, ledger=.05),
    )


def test_r223_coordinate_is_address_skin_frame_motion_history_bound():
    a = OmegaAddr(Address20736(1, 2, 3, 4), 20736, "canonical", 4.25, 1, "p0/p1")
    b = OmegaAddr(Address20736(1, 2, 3, 4), 20736, "canonical", 4.25, 1, "p0/p1")
    assert a.key == b.key and len(a.key) == 64
    with pytest.raises(ValueError): OmegaAddr(a.address, 13, "canonical", 0)
    with pytest.raises(ValueError): OmegaAddr(a.address, 144, "", 0)
    with pytest.raises(ValueError): OmegaAddr(a.address, 144, "canonical", 0, 2)


def test_r223_canonical_skin_binds_existing_state_geometry_motion_and_invariants():
    state = canonical_20736_skin(envelope(), evolution=7.0)
    assert state.coord.skin == 20736
    assert state.variables["address"] == (2, 3, 4, 5)
    assert state.geometry["degree"] == 7
    assert len(state.geometry["neighbors"]) == 7
    assert state.motion["v"] == .4
    assert len(state.invariants["canonical_digest"]) == 64
    assert state.canonical_mutation is False


def test_r223_cross_skin_residual_is_explicit_not_assumed():
    assert cross_skin_q([1, 2, 3], [1, 2, 3]) == 0
    assert cross_skin_q([0, 0], [3, 4]) == 5
    with pytest.raises(ValueError): cross_skin_q([1], [1, 2])


def test_r223_adaptive_resolution_escalates_turns_prunes_and_stays():
    assert decide_resolution(144, state_residual=.2, cross_skin_contradiction=0, epsilon=.1, marginal_gain=.5, gain_floor=.01).decision == "ESCALATE"
    assert decide_resolution(248832, state_residual=.2, cross_skin_contradiction=0, epsilon=.1, marginal_gain=.5, gain_floor=.01).decision == "TURN"
    assert decide_resolution(1728, state_residual=.01, cross_skin_contradiction=.01, epsilon=.1, marginal_gain=.001, gain_floor=.01).decision == "PRUNE"
    assert decide_resolution(12, state_residual=.01, cross_skin_contradiction=.01, epsilon=.1, marginal_gain=.5, gain_floor=.01).decision == "STAY"


def test_r223_manifest_preserves_truth_boundary_and_receipt():
    m = skin_manifest()
    assert m["skins"] == list(SKINS)
    assert m["physical_dimension_claim"] is False
    assert m["canonical_mutation"] is False
    assert len(m["receipt_sha256"]) == 64
    assert "LEARN_CANDIDATE" in m["learning_loop"] and "PROVE" in m["learning_loop"]
