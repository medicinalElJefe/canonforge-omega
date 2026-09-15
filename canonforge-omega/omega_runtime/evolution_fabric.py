from __future__ import annotations
from dataclasses import dataclass
from hashlib import sha256
import json
from typing import Callable, Iterable, Mapping

from .address_state_field import AddressStateField, AddressStateFieldEngine, FieldSample
from .intrinsic_skin import SKINS

SCHEMA="OMEGA_ADDRESSED_EVOLUTION_FABRIC_R225"


def _digest(x)->str:return sha256(json.dumps(x,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()

@dataclass(frozen=True,slots=True)
class Operator:
 name:str
 transform:Callable[[tuple[float,...]],tuple[float,...]]
 min_coherence:float=0.0
 max_contradiction:float=float("inf")
 cost:float=0.0
 def admissible(self,f:AddressStateField)->bool:return f.coherence>=self.min_coherence and f.contradiction<=self.max_contradiction

@dataclass(frozen=True,slots=True)
class EvolutionReceipt:
 address_key:str; skin:int; operator:str; before:tuple[float,...]; after:tuple[float,...]; residual:float; decision:str; next_skin:int; candidate_only:bool; proof_address:str; receipt_sha256:str

class AddressedEvolutionFabric:
 """Local execution fabric. Candidate transforms are deterministic/proof-carrying and never mutate Canon."""
 def __init__(self,field_engine:AddressStateFieldEngine|None=None,epsilon:float=.1):
  self.fields=field_engine or AddressStateFieldEngine();self.epsilon=epsilon
 def choose(self,field:AddressStateField,operators:Iterable[Operator])->Operator|None:
  admissible=[o for o in operators if o.admissible(field)]
  return min(admissible,key=lambda o:(o.cost,o.name),default=None)
 def _shell(self,skin:int,residual:float)->tuple[str,int]:
  i=SKINS.index(skin)
  if residual>self.epsilon:
   return ("TURN",skin) if i==len(SKINS)-1 else ("ESCALATE",SKINS[i+1])
  return ("COMPRESS",SKINS[i-1]) if i>0 and residual<=self.epsilon/4 else ("STAY",skin)
 def execute(self,center:FieldSample,neighborhood:Iterable[FieldSample],operators:Iterable[Operator],previous:FieldSample|None=None)->EvolutionReceipt:
  field=self.fields.compute(center,neighborhood,previous);op=self.choose(field,operators)
  before=field.state_vector
  if op is None: after=before; residual=max(field.contradiction,field.geometry_residual); opname="NONE"
  else:
   after=tuple(float(x) for x in op.transform(before));opname=op.name
   n=max(len(before),len(after));a=before+(0.,)*(n-len(before));b=after+(0.,)*(n-len(after));residual=(sum((x-y)**2 for x,y in zip(a,b))/max(n,1))**.5
  decision,next_skin=self._shell(center.address.skin,max(residual,field.contradiction,field.scar))
  proof=_digest({"address":center.address.key,"field":field.receipt_sha256,"operator":opname,"before":before,"after":after,"residual":residual,"decision":decision,"next_skin":next_skin})
  body={"schema":SCHEMA,"address":center.address.key,"skin":center.address.skin,"operator":opname,"before":before,"after":after,"residual":residual,"decision":decision,"next_skin":next_skin,"candidate_only":True,"proof_address":proof,"canonical_mutation":False}
  return EvolutionReceipt(center.address.key,center.address.skin,opname,before,after,residual,decision,next_skin,True,proof,_digest(body))

class EvolutionWorkGraph:
 """Prioritizes unresolved execution receipts without converting candidates into Canon."""
 def prioritize(self,receipts:Iterable[EvolutionReceipt])->tuple[EvolutionReceipt,...]:
  return tuple(sorted(receipts,key=lambda r:(r.decision not in ("ESCALATE","TURN"),-r.residual,r.proof_address)))
 def replay_digest(self,receipts:Iterable[EvolutionReceipt])->str:
  ordered=sorted((r.receipt_sha256 for r in receipts));return _digest({"schema":SCHEMA,"receipts":ordered})
