from omega_runtime import Address20736, EvidenceClass, StateEnvelope, StateMetrics, OmegaRuntime
from omega_runtime.atlas import ping_next, ping_prev, opposite_address, phase_portal
from omega_runtime.mode188 import opposite_pair_axes, simplex_from_axes, gate, Dispatch
from omega_runtime.proof import ProofLedger
from omega_runtime.relativity import ObserverFrame, phase_transform
from omega_runtime.forecast import deterministic_local_forecast
from omega_runtime.bridge import BridgeAction, BridgePlan, BridgeStep
from omega_runtime.relations import RelationalState, unified_coherence, mode188_lens, future_signal, prune_pressure
from omega_runtime.memory import ptf_core, ScarRecord, ContradictionMemory
from omega_runtime.dynamics import MotionParameters, step_motion
from omega_runtime.translation import TranslationOperator, apply_translation
from omega_runtime.scales import Address144, Address1728, project_20736_to_1728, expand_1728, project_1728_to_144
from omega_runtime.state_store import StateStore
from omega_runtime.state import MotionState


def state(parent=None, evidence=EvidenceClass.OBSERVED, continuity=1.0, burden=0.2, contradiction=0.1, idx=0):
    return StateEnvelope(
        address=Address20736.from_index(idx), evidence_class=evidence,
        metrics=StateMetrics(continuity=continuity, burden=burden, contradiction=contradiction, future_plasticity=0.2),
        parent_digest=parent,
    )


def test_20736_roundtrip_all():
    for i in range(20736):
        assert Address20736.from_index(i).index == i


def test_autoping_and_opposite_invariants():
    a = Address20736(1,1,1,1)
    assert ping_prev(ping_next(a)) == a
    assert opposite_address(opposite_address(a)) == a
    assert len(phase_portal(a)) == 144


def test_mode188_and_shell_worked_example():
    axes = opposite_pair_axes([2,5,3,1,4,0])
    assert axes == (1.0,1.0,3.0)
    assert simplex_from_axes(axes) == (0.2,0.2,0.6)
    assert gate(1.0, 0.1, 0.1).dispatch is Dispatch.STAY


def test_single_authority_and_forecast_boundary(tmp_path):
    initial = state()
    ledger = ProofLedger(tmp_path / "proof.jsonl")
    rt = OmegaRuntime(initial, ledger)
    candidate = state(parent=initial.digest, idx=1)
    result = rt.propose(candidate, shell_amplitudes=[2,5,3,1,4,0])
    assert result["accepted"] is True
    assert rt.state.digest == candidate.digest
    forecast = state(parent=candidate.digest, evidence=EvidenceClass.FORECAST, idx=2)
    result2 = rt.propose(forecast)
    assert result2["accepted"] is False
    assert rt.state.digest == candidate.digest
    assert ledger.verify()


def test_observer_transform_roundtrip_phase():
    a = Address20736(3, 5, 7, 9)
    b = phase_transform(a, ObserverFrame(phase_offset=4))
    c = phase_transform(b, ObserverFrame(phase_offset=-4))
    assert c == a


def test_forecast_is_explicitly_forecast():
    s = state()
    f = deterministic_local_forecast(s, 3)
    assert f.evidence_class == "FORECAST"
    assert f.source_digest == s.digest
    assert f.calibrated is False


def test_bridge_rejects_traversal_and_unconfirmed():
    step = BridgeStep(BridgeAction.READ, "../secret")
    try:
        step.validate()
        assert False
    except ValueError:
        pass
    plan = BridgePlan("p1", (BridgeStep(BridgeAction.TEST, "."),), confirmed=False)
    try:
        plan.validate_for_execution()
        assert False
    except PermissionError:
        pass


def test_relational_formula_hooks_remain_distinct():
    r = RelationalState(continuity=0.8, plasticity=0.6, burden=0.2, contradiction=0.1, scar=0.3)
    assert abs(unified_coherence(r) - (0.8 * 0.6 / 0.3)) < 1e-9
    assert abs(mode188_lens(r) - (1.1 / 1.1)) < 1e-9
    assert abs(future_signal(r) - 1.1) < 1e-9
    assert abs(prune_pressure(r) - (-0.5)) < 1e-9


def test_ptf_core_and_scar_memory():
    weights = (0.37, 0.25, 0.18, 0.12, 0.08)
    expected = sum(v * w for v, w in zip((5,4,3,2,1), weights)) / sum(weights)
    assert abs(ptf_core((5,4,3,2,1), weights) - expected) < 1e-12
    mem = ContradictionMemory(weights=weights)
    for value in (1,2,3,4,5):
        mem.push(value)
    assert abs(mem.value - expected) < 1e-12
    assert ScarRecord(impact=2, persistence=0.5, lesson=0.8).magnitude == 0.8


def test_motion_dynamics_ledger_and_constraint():
    s = MotionState(a=1.0, v=2.0, c=1.0, q=0.2, ledger=3.0)
    p = MotionParameters(beta=0.1, omega0=2.0, gamma=0.5, rho_q=0.9, sigma_q=0.1)
    n = step_motion(s, 0.1, p)
    assert n.ledger > s.ledger
    assert abs(n.c - 4.0 * n.a) < 1e-12


def test_translation_stack_is_explicitly_gated():
    op = TranslationOperator("sun", "earth", attenuation=0.5, phase_landing=0.25, ledger_cost=0.1, pattern_retention=0.8)
    admitted = apply_translation(op, 10.0, filter_fn=lambda x: x > 0, transform_fn=lambda x, a, phase: x*a + phase)
    assert admitted.admitted and admitted.value == 5.25
    rejected = apply_translation(op, -1.0, filter_fn=lambda x: x > 0, transform_fn=lambda x, a, phase: x*a + phase)
    assert not rejected.admitted and rejected.value is None


def test_144_1728_20736_projection_roundtrips():
    for i in range(144):
        assert Address144.from_index(i).index == i
    for i in range(1728):
        assert Address1728.from_index(i).index == i
    a = Address20736(7, 8, 9, 10)
    domain, a1728 = project_20736_to_1728(a)
    assert expand_1728(domain, a1728) == a
    phase, a144 = project_1728_to_144(a1728)
    assert phase == 8 and a144 == Address144(9,10)


def test_persistent_state_survives_runtime_restart(tmp_path):
    store = StateStore(tmp_path / "canonical.json")
    ledger = ProofLedger(tmp_path / "proof.jsonl")
    initial = state(idx=0)
    rt = OmegaRuntime(initial, ledger, store)
    candidate = state(parent=rt.state.digest, idx=100)
    assert rt.propose(candidate)["accepted"] is True
    recovered = OmegaRuntime(initial, ProofLedger(tmp_path / "proof.jsonl"), store)
    assert recovered.state.digest == candidate.digest
    assert recovered.state.address.index == 100
