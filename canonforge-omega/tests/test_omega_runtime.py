from omega_runtime import Address20736, EvidenceClass, StateEnvelope, StateMetrics, OmegaRuntime
from omega_runtime.atlas import ping_next, ping_prev, opposite_address, phase_portal
from omega_runtime.mode188 import opposite_pair_axes, simplex_from_axes, gate, Dispatch
from omega_runtime.proof import ProofLedger
from omega_runtime.relativity import ObserverFrame, phase_transform
from omega_runtime.forecast import deterministic_local_forecast
from omega_runtime.bridge import BridgeAction, BridgePlan, BridgeStep


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
