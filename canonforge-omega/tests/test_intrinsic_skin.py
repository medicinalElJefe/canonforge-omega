import pytest
from omega_fusion_core.intrinsic_skin import OmegaAddr, SkinRegistry, CanonGate, resolution_decision, vector_residual

def test_address_rejects_unknown_skin():
    with pytest.raises(ValueError): OmegaAddr('a',13,'local',0)

def test_address_orientation_guard():
    with pytest.raises(ValueError): OmegaAddr('a',12,'local',0,2)

def test_vector_residual():
    assert vector_residual([0,0],[3,4]) == 5

def test_resolution_escalates_on_residual():
    assert resolution_decision(144,1.0,0.0,0.1,1.0,0.01) == 'ESCALATE'

def test_resolution_turns_at_ceiling():
    assert resolution_decision(248832,1.0,0.0,0.1,1.0,0.01) == 'TURN'

def test_resolution_prunes_when_gain_is_low():
    assert resolution_decision(1728,0.0,0.0,0.1,0.001,0.01) == 'PRUNE'

def test_canon_gate_requires_all_proofs():
    gate=CanonGate()
    good={k:True for k in gate.REQUIRED}
    assert gate.evaluate(good)=='PROMOTE'
    good['rollback']=False
    assert gate.evaluate(good)=='HOLD'

def test_skin_translation_contract():
    r=SkinRegistry()
    r.register_projector(12,lambda core,rel,hist,frame:[core['x']])
    r.register_translator(144,12,lambda x:[sum(x)/len(x)])
    assert r.project({'x':2},{},{},12,'local') == [2]
    assert r.translate([1,3],144,12) == [2]
