from __future__ import annotations
from dataclasses import dataclass
from hashlib import sha256
import json, math
from typing import Callable, Iterable

from .address_state_field import AddressStateField, AddressStateFieldEngine, FieldSample
from .intrinsic_skin import SKINS

SCHEMA="OMEGA_ADDRESSED_EVOLUTION_FABRIC_R225"

def _digest(x)->str:return sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()
def _finite(xs):return all(math.isfinite(float(x)) for x in xs)

@dataclass(frozen=True,slots=True)
class Operator:
 name:str
 transform:Callable[[tuple[float,...]],tuple[float,...]]
 min_coherence:float=0.0
 max_contradiction:float=float("inf")
 cost:float=0.0
 def admissible(self,f:AddressStateField)->bool:
  return bool(self.name) and math.isfinite(self.cost) and self.cost>=0 and f.coherence>=self.min_coherence and f.contradiction<=self.max_contradiction

@dataclass(frozen=True,slots=True)
class EvolutionReceipt:
 address_key:str; skin:int; operator:str; before:tuple[float,...]; after:tuple[float,...]; residual:float; decision:str; next_skin:int; candidate_only:bool; proof_address:str; invariant_digest:str; field_receipt:str; failure:str; receipt_sha256:str

class AddressedEvolutionFabric:
 """Small complete execution cell: address→field→operator→candidate transform→residual→proof→next shell. Never mutates Canon."""
 def __init__(self,field_engine:AddressStateFieldEngine|None=None,epsilon:float=.1):
  if epsilon<0: raise ValueError("epsilon must be nonnegative")
  self.fields=field_engine or AddressStateFieldEngine();self.epsilon=epsilon
 def choose(self,field:AddressStateField,operators:Iterable[Operator])->Operator|None:
  admissible=[o for o in operators if o.admissible(field)]
  return min(admissible,key=lambda o:(o.cost,o.name),default=None)
 def _shell(self,skin:int,residual:float)->tuple[str,int]:
  i=SKINS.index(skin)
  if residual>self.epsilon:return ("TURN",skin) if i==len(SKINS)-1 else ("ESCALATE",SKINS[i+1])
  return ("COMPRESS",SKINS[i-1]) if i>0 and residual<=self.epsilon/4 else ("STAY",skin)
 def execute(self,center:FieldSample,neighborhood:Iterable[FieldSample],operators:Iterable[Operator],previous:FieldSample|None=None)->EvolutionReceipt:
  field=self.fields.compute(center,neighborhood,previous);op=self.choose(field,operators);before=tuple(float(x) for x in field.state_vector);failure=""
  if not _finite(before): raise ValueError("field state must be finite")
  if op is None: after=before;residual=max(field.contradiction,field.geometry_residual);opname="NONE";failure="NO_ADMISSIBLE_OPERATOR"
  else:
   opname=op.name
   try:
    after=tuple(float(x) for x in op.transform(before))
    if len(after)!=len(before):raise ValueError("operator changed state-vector arity")
    if not _finite(after):raise ValueError("operator returned non-finite state")
    residual=(sum((x-y)**2 for x,y in zip(before,after))/max(len(before),1))**.5
   except Exception as exc:
    after=before;residual=max(self.epsilon+1.0,field.contradiction,field.geometry_residual);failure=f"OPERATOR_FAIL_CLOSED:{type(exc).__name__}"
  governing=max(residual,field.contradiction,field.scar,field.geometry_residual);decision,next_skin=self._shell(center.address.skin,governing)
  invariant=_digest({"address":center.address.key,"frame":center.address.frame,"orientation":center.address.orientation,"history":center.address.history_path,"field":field.receipt_sha256})
  proof=_digest({"invariant":invariant,"operator":opname,"before":before,"after":after,"residual":residual,"governing":governing,"decision":decision,"next_skin":next_skin,"failure":failure})
  body={"schema":SCHEMA,"address":center.address.key,"skin":center.address.skin,"operator":opname,"before":before,"after":after,"residual":residual,"decision":decision,"next_skin":next_skin,"candidate_only":True,"proof_address":proof,"invariant_digest":invariant,"field_receipt":field.receipt_sha256,"failure":failure,"canonical_mutation":False}
  return EvolutionReceipt(center.address.key,center.address.skin,opname,before,after,residual,decision,next_skin,True,proof,invariant,field.receipt_sha256,failure,_digest(body))

class EvolutionWorkGraph:
 """Deterministic failure-first proof-space scheduler; candidates never become Canon by scheduling."""
 def prioritize(self,receipts:Iterable[EvolutionReceipt])->tuple[EvolutionReceipt,...]:
  return tuple(sorted(receipts,key=lambda r:(not bool(r.failure),r.decision not in ("ESCALATE","TURN"),-r.residual,r.proof_address)))
 def replay_digest(self,receipts:Iterable[EvolutionReceipt])->str:
  ordered=sorted(r.receipt_sha256 for r in receipts);return _digest({"schema":SCHEMA,"receipts":ordered})
 def closure_digest(self,receipts:Iterable[EvolutionReceipt])->str:
  ordered=sorted((r.proof_address,r.invariant_digest,r.decision,r.next_skin) for r in receipts)
  return _digest({"schema":SCHEMA,"closure":ordered,"canonical_mutation":False})
