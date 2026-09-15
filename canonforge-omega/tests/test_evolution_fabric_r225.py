import math
import pytest
from omega_runtime.evolution_fabric import AddressedEvolutionFabric,EvolutionWorkGraph,Operator
from omega_runtime.address_state_field import FieldSample
from omega_runtime.intrinsic_skin import OmegaAddr
from omega_runtime.state import Address20736

def s(skin=144,state=(1.,2.),q=.01,scar=0.):return FieldSample(OmegaAddr(Address20736(1,2,3,4),skin,"canonical",0,1,"h"),1,1,q,.01,scar,state=state)
def test_admissible_operator_executes_as_candidate_with_proof_address():
 r=AddressedEvolutionFabric().execute(s(),(),(Operator("identity",lambda x:x,min_coherence=.1),))
 assert r.operator=="identity" and r.candidate_only and len(r.proof_address)==64 and len(r.invariant_digest)==64 and len(r.field_receipt)==64 and len(r.receipt_sha256)==64
def test_high_residual_escalates_shell():
 r=AddressedEvolutionFabric(epsilon=.1).execute(s(144),(),(Operator("shift",lambda x:tuple(v+1 for v in x)),));assert r.decision=="ESCALATE" and r.next_skin==1728
def test_low_residual_compresses_proof_downward():
 r=AddressedEvolutionFabric(epsilon=.1).execute(s(1728),(),(Operator("identity",lambda x:x),));assert r.decision=="COMPRESS" and r.next_skin==144 and r.invariant_digest
def test_resolution_ceiling_turns():
 r=AddressedEvolutionFabric(epsilon=.1).execute(s(248832),(),(Operator("shift",lambda x:tuple(v+1 for v in x)),));assert r.decision=="TURN" and r.next_skin==248832
def test_operator_admission_respects_field_truth():
 r=AddressedEvolutionFabric().execute(s(q=2),(),(Operator("unsafe",lambda x:x,max_contradiction=.1),));assert r.operator=="NONE" and r.failure=="NO_ADMISSIBLE_OPERATOR" and r.candidate_only
def test_operator_exception_fails_closed_and_escalates():
 def boom(_):raise RuntimeError("boom")
 r=AddressedEvolutionFabric(epsilon=.1).execute(s(144),(),(Operator("boom",boom),));assert r.after==r.before and r.failure.startswith("OPERATOR_FAIL_CLOSED") and r.decision=="ESCALATE"
def test_operator_cannot_change_state_arity_or_emit_nonfinite():
 f=AddressedEvolutionFabric(epsilon=.1)
 for op in (Operator("arity",lambda x:x+(3.,)),Operator("nan",lambda x:(math.nan,)*len(x))):
  r=f.execute(s(),(),(op,));assert r.after==r.before and r.failure.startswith("OPERATOR_FAIL_CLOSED")
def test_negative_epsilon_rejected():
 with pytest.raises(ValueError):AddressedEvolutionFabric(epsilon=-1)
def test_work_graph_is_deterministic_failure_first_and_closure_addressed():
 f=AddressedEvolutionFabric(epsilon=.1);a=f.execute(s(144),(),(Operator("i",lambda x:x),));b=f.execute(s(144),(),(Operator("x",lambda x:tuple(v+1 for v in x)),));c=f.execute(s(144),(),());g=EvolutionWorkGraph()
 assert g.prioritize((a,b,c))[0].failure and g.replay_digest((a,b,c))==g.replay_digest((c,b,a)) and g.closure_digest((a,b))==g.closure_digest((b,a))
