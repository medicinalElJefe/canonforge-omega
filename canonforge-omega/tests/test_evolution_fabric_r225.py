from omega_runtime.evolution_fabric import AddressedEvolutionFabric,EvolutionWorkGraph,Operator
from omega_runtime.address_state_field import FieldSample
from omega_runtime.intrinsic_skin import OmegaAddr
from omega_runtime.state import Address20736

def s(skin=144,state=(1.,2.),q=.01,scar=0.):return FieldSample(OmegaAddr(Address20736(1,2,3,4),skin,"canonical",0,1,"h"),1,1,q,.01,scar,state=state)
def test_admissible_operator_executes_as_candidate_with_proof_address():
 f=AddressedEvolutionFabric();r=f.execute(s(),(),(Operator("identity",lambda x:x,min_coherence=.1),))
 assert r.operator=="identity" and r.candidate_only and len(r.proof_address)==64 and len(r.receipt_sha256)==64
def test_high_residual_escalates_shell():
 f=AddressedEvolutionFabric(epsilon=.1);r=f.execute(s(144),(),(Operator("shift",lambda x:tuple(v+1 for v in x)),))
 assert r.decision=="ESCALATE" and r.next_skin==1728
def test_low_residual_compresses_proof_downward():
 f=AddressedEvolutionFabric(epsilon=.1);r=f.execute(s(1728),(),(Operator("identity",lambda x:x),))
 assert r.decision=="COMPRESS" and r.next_skin==144
def test_resolution_ceiling_turns():
 f=AddressedEvolutionFabric(epsilon=.1);r=f.execute(s(248832),(),(Operator("shift",lambda x:tuple(v+1 for v in x)),))
 assert r.decision=="TURN" and r.next_skin==248832
def test_operator_admission_respects_field_truth():
 f=AddressedEvolutionFabric();r=f.execute(s(q=2),(),(Operator("unsafe",lambda x:x,max_contradiction=.1),))
 assert r.operator=="NONE" and r.candidate_only
def test_work_graph_is_deterministic_and_failure_first():
 f=AddressedEvolutionFabric(epsilon=.1);a=f.execute(s(144),(),(Operator("i",lambda x:x),));b=f.execute(s(144),(),(Operator("x",lambda x:tuple(v+1 for v in x)),));g=EvolutionWorkGraph()
 assert g.prioritize((a,b))[0].decision=="ESCALATE" and g.replay_digest((a,b))==g.replay_digest((b,a))
