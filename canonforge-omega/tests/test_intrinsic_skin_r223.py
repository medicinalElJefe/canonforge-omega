import pytest
from omega_runtime.intrinsic_skin import (OmegaAddr,PathStep,PathAddress,ClosureAddress,ProofObligation,ClosureNavigator,SKINS,canonical_20736_skin,cross_skin_q,decide_resolution,skin_manifest)
from omega_runtime.state import Address20736,EvidenceClass,MotionState,StateEnvelope,StateMetrics

def envelope():return StateEnvelope(address=Address20736(2,3,4,5),evidence_class=EvidenceClass.DERIVED,metrics=StateMetrics(continuity=.9,burden=.2,contradiction=.1,future_plasticity=.7,proof_scar=.03),motion=MotionState(a=.2,v=.4,c=.6,q=.1,ledger=.05))
def test_r223_coordinate_is_address_skin_frame_motion_history_bound():
 a=OmegaAddr(Address20736(1,2,3,4),20736,"canonical",4.25,1,"p0/p1");b=OmegaAddr(Address20736(1,2,3,4),20736,"canonical",4.25,1,"p0/p1")
 assert a.key==b.key and len(a.key)==64
 with pytest.raises(ValueError):OmegaAddr(a.address,13,"canonical",0)
 with pytest.raises(ValueError):OmegaAddr(a.address,144,"",0)
 with pytest.raises(ValueError):OmegaAddr(a.address,144,"canonical",0,2)
def test_r223_path_and_closure_are_first_class_addresses():
 steps=(PathStep("A","B","TRANSFORM",residual=.02),PathStep("B","A","RETURN",residual=.01));path=PathAddress("A",steps,20736,"canonical",1);closure=ClosureAddress(path,"canonical-equivalence",.01,0,.03,.02,"APPROXIMATE");coord=OmegaAddr(Address20736(1,2,3,4),20736,"canonical",1).with_path(path,closure.key)
 assert path.end=="A" and len(path.key)==64 and len(closure.key)==64 and coord.path_address==path.key and coord.closure_address==closure.key
 with pytest.raises(ValueError):PathAddress("A",(PathStep("B","A","X"),),20736,"canonical")
def test_r223_proof_obligations_navigate_unresolved_closure_space():
 nav=ClosureNavigator();p1=PathAddress("A",(PathStep("A","A","CHECK"),),144,"canonical");p2=PathAddress("B",(PathStep("B","B","CHECK"),),248832,"canonical");closed=ProofObligation("o1","invariant",ClosureAddress(p1,"eq",0,0,0,0,"EXACT"),1);open_=ProofObligation("o2","return",ClosureAddress(p2,"eq",.4,.1,.2,.5,"FAILED"),9,("o1",))
 assert closed.resolved and not open_.resolved and nav.next((open_,closed),("o1",)).obligation_id=="o2" and nav.route(open_,.1)=="TURN" and nav.next((open_,closed),()) is None
def test_r223_canonical_skin_binds_existing_state_geometry_motion_and_invariants():
 state=canonical_20736_skin(envelope(),evolution=7)
 assert state.coord.skin==20736 and state.variables["address"]==(2,3,4,5)
 assert state.geometry["degree"]==4 and len(state.geometry["neighbors"])==4 and state.geometry["topology"]=="OMEGA_CANONICAL_ATLAS_PRIMITIVES"
 assert state.motion["v"]==.4 and len(state.invariants["canonical_digest"])==64 and state.canonical_mutation is False
def test_r223_cross_skin_residual_is_explicit_not_assumed():
 assert cross_skin_q([1,2,3],[1,2,3])==0 and cross_skin_q([0,0],[3,4])==5
 with pytest.raises(ValueError):cross_skin_q([1],[1,2])
def test_r223_adaptive_resolution_escalates_turns_prunes_and_stays():
 assert decide_resolution(144,state_residual=.2,cross_skin_contradiction=0,epsilon=.1,marginal_gain=.5,gain_floor=.01).decision=="ESCALATE"
 assert decide_resolution(248832,state_residual=.2,cross_skin_contradiction=0,epsilon=.1,marginal_gain=.5,gain_floor=.01).decision=="TURN"
 assert decide_resolution(1728,state_residual=.01,cross_skin_contradiction=.01,epsilon=.1,marginal_gain=.001,gain_floor=.01).decision=="PRUNE"
 assert decide_resolution(12,state_residual=.01,cross_skin_contradiction=.01,epsilon=.1,marginal_gain=.5,gain_floor=.01).decision=="STAY"
def test_r223_manifest_preserves_truth_boundary_and_receipt():
 m=skin_manifest();assert m["skins"]==list(SKINS) and m["physical_dimension_claim"] is False and m["canonical_mutation"] is False and len(m["receipt_sha256"])==64
 assert "proof_obligation" in m["address_kinds"] and "SELECT_UNRESOLVED_CLOSURE" in m["learning_loop"] and "PROVE_CLOSURE" in m["learning_loop"]
