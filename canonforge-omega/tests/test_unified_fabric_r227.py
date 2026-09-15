from omega_runtime.unified_fabric import (
    CONSUMERS, AuthorityState, ClosureGraph, ClosureNode, ClosureState, EvidenceClass,
    OperatorDescriptor, ScarVector, TemporalState, UnifiedComputationalFabric, WovenPacket,
)

def packet(**kw):
    d=dict(address_key="addr-20736-1",closure_address="closure:1",field_receipt="field-proof-1",state=(1.0,2.0),motion=(0.1,-0.1),continuity=0.9,future_plasticity=0.7,contradiction=0.1,burden=0.2,scar=ScarVector(model=.05),history=("observe","address"),provenance=("R223","R224","R225"),evidence_class=EvidenceClass.DERIVED,authority=AuthorityState.CANDIDATE,temporal=TemporalState(10,11,5),parent_proofs=("proof:parent",))
    d.update(kw); return WovenPacket(**d)
def operator(): return OperatorDescriptor("omega","identity-test","1","x -> x")

def test_manifest_registers_all_major_consumers_and_denies_canon_mutation():
    m=UnifiedComputationalFabric().manifest(); assert tuple(m["consumers"])==CONSUMERS; assert not m["canonical_mutation"]; assert not m["physical_dimension_claim"]; assert len(m["receipt_sha256"])==64

def test_same_computation_is_deterministic_and_proof_dag_bound():
    f=UnifiedComputationalFabric(); args=dict(consumer="forecast",packet=packet(),operator=operator(),output={"x":[1,2]},residual=.01,decision="STAY",next_closure_address="closure:2")
    a=f.bind(**args); b=f.bind(**args); assert a==b
    proof,receipt=a; assert receipt.proof_receipt==proof.receipt_sha256; assert proof.parent_proofs==("proof:parent",); assert not proof.canonical_mutation and not receipt.canonical_mutation

def test_operator_identity_binds_law_version_and_changed_assumption():
    xs=[OperatorDescriptor("omega","solve","1","x -> x"),OperatorDescriptor("omega","solve","2","x -> x"),OperatorDescriptor("omega","solve","1","x -> x+1"),OperatorDescriptor("omega","solve","1","x -> x",changes_assumption="frame")]
    assert len({x.operator_id for x in xs})==4

def test_every_declared_surface_consumes_same_protocol():
    f=UnifiedComputationalFabric(); ids=[]
    for c in CONSUMERS:
        proof,r=f.bind(consumer=c,packet=packet(),operator=operator(),output={"surface":c},residual=0,decision="STAY",next_closure_address=f"closure:{c.lower()}")
        assert r.consumer==c and r.packet_sha256==packet().packet_sha256 and r.closure_state==ClosureState.PROVEN; ids.append(r.receipt_sha256)
    assert len(set(ids))==len(CONSUMERS)

def test_unregistered_unaddressed_and_insufficient_authority_fail_closed():
    f=UnifiedComputationalFabric()
    for kwargs,exc in [
      (dict(consumer="shadow",packet=packet()),ValueError),
      (dict(consumer="SAR",packet=packet(address_key="")),ValueError),
      (dict(consumer="SOVEREIGN",packet=packet(),required_authority=AuthorityState.LIVE_VERIFIED),PermissionError)]:
        try: f.bind(operator=operator(),output={},residual=0,decision="STAY",next_closure_address="c",**kwargs)
        except exc: pass
        else: raise AssertionError("unsafe computation admitted")

def test_temporal_staleness_is_not_falsity():
    _,r=UnifiedComputationalFabric().bind(consumer="SAR",packet=packet(temporal=TemporalState(10,20,5)),operator=operator(),output={},residual=0,decision="STAY",next_closure_address="c2")
    assert r.closure_state==ClosureState.STALE

def test_evidence_class_and_authority_survive_proof_transport():
    p=packet(evidence_class=EvidenceClass.MEASURED,authority=AuthorityState.SOURCE_PROVEN)
    proof,r=UnifiedComputationalFabric().bind(consumer="SAR",packet=p,operator=operator(),output={},residual=.2,decision="TURN",next_closure_address="c2",required_authority=AuthorityState.SOURCE_PROVEN)
    assert proof.evidence_class==EvidenceClass.MEASURED and r.authority==AuthorityState.SOURCE_PROVEN

def test_scar_vector_is_structured_and_rejects_negative_components():
    assert ScarVector(transport=.3,temporal=.8).magnitude==.8
    try: ScarVector(authority=-.1)
    except ValueError: pass
    else: raise AssertionError("negative scar admitted")

def test_closure_graph_holds_dependencies_and_schedules_ready_frontier():
    g=ClosureGraph([ClosureNode("base",state=ClosureState.PROVEN),ClosureNode("blocked",dependencies=("missing",),contradiction=9),ClosureNode("a",dependencies=("base",),information_gain=2),ClosureNode("b",dependencies=("base",),information_gain=1)])
    assert [x.closure_address for x in g.ready()]==["a","b"]

def test_nonfinite_residual_fails_closed():
    try: UnifiedComputationalFabric().bind(consumer="FORECAST",packet=packet(),operator=operator(),output={},residual=float("nan"),decision="STAY",next_closure_address="c")
    except ValueError: pass
    else: raise AssertionError("nonfinite residual admitted")
