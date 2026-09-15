"""OMEGA R227 unified computational fabric.

Address Field x Woven Packet x Closure Graph x Evolution Operator x Temporal State
x Evidence Class x Scar Vector x Proof DAG x Authority State.
All semantics are computational/proof semantics; no physical-dimension claim or
implicit Canon mutation is granted here.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
import json, math
from typing import Any, Mapping, Sequence

SCHEMA = "OMEGA_UNIFIED_COMPUTATIONAL_FABRIC_R227"
CONSUMERS = ("GENESIS", "FORECAST", "SAR", "OPTICAL", "RENDER", "SOVEREIGN", "AI_SAI", "INTERFACE")

class EvidenceClass(str, Enum):
    MEASURED="MEASURED"; RETURNED="RETURNED"; DERIVED="DERIVED"; PREDICTED="PREDICTED"; SIMULATED="SIMULATED"; ASSUMED="ASSUMED"
class AuthorityState(str, Enum):
    CANDIDATE="CANDIDATE"; SOURCE_PROVEN="SOURCE_PROVEN"; MERGED="MERGED"; DEPLOYED="DEPLOYED"; LIVE_VERIFIED="LIVE_VERIFIED"; CANON="CANON"
class ClosureState(str, Enum):
    OPEN="OPEN"; READY="READY"; EXECUTING="EXECUTING"; RETURNED="RETURNED"; COMPARING="COMPARING"; PROVEN="PROVEN"; FALSIFIED="FALSIFIED"; HELD="HELD"; ESCALATED="ESCALATED"; TURNED="TURNED"; STALE="STALE"

AUTHORITY_ORDER={x:i for i,x in enumerate(AuthorityState)}

def _digest(value: Any) -> str:
    return sha256(json.dumps(value,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()

def _finite_nonnegative(x: float, name: str) -> None:
    if not math.isfinite(x) or x < 0: raise ValueError(f"{name} must be finite and nonnegative")

@dataclass(frozen=True)
class ScarVector:
    identity: float=0.0; model: float=0.0; transport: float=0.0; closure: float=0.0; authority: float=0.0; temporal: float=0.0
    def __post_init__(self):
        for k,v in self.__dict__.items(): _finite_nonnegative(v,k)
    @property
    def magnitude(self)->float: return max(self.__dict__.values())

@dataclass(frozen=True)
class TemporalState:
    observed_at: float
    returned_at: float
    valid_for: float
    def __post_init__(self):
        for n,v in self.__dict__.items(): _finite_nonnegative(v,n)
        if self.returned_at < self.observed_at: raise ValueError("return cannot precede observation")
    @property
    def stale(self)->bool: return (self.returned_at-self.observed_at) > self.valid_for

@dataclass(frozen=True)
class WovenPacket:
    address_key: str; closure_address: str; field_receipt: str; state: tuple[float,...]
    motion: tuple[float,...]=(); continuity: float=0.0; future_plasticity: float=0.0; contradiction: float=0.0; burden: float=0.0
    scar: ScarVector=ScarVector(); history: tuple[str,...]=(); provenance: tuple[str,...]=()
    evidence_class: EvidenceClass=EvidenceClass.DERIVED; authority: AuthorityState=AuthorityState.CANDIDATE
    temporal: TemporalState=TemporalState(0.0,0.0,0.0)
    parent_proofs: tuple[str,...]=()
    @property
    def packet_sha256(self)->str: return _digest(self.__dict__)

@dataclass(frozen=True)
class OperatorDescriptor:
    namespace:str; name:str; version:str; law:str; input_schema:str=SCHEMA; output_schema:str=SCHEMA
    changes_assumption: str="NONE"
    @property
    def operator_id(self)->str: return _digest(self.__dict__)

@dataclass(frozen=True)
class ProofLedgerEntry:
    packet_sha256:str; closure_address:str; operator_id:str; before_digest:str; after_digest:str; residual:float; decision:str
    evidence_class:EvidenceClass; authority:AuthorityState; scar:ScarVector; parent_proofs:tuple[str,...]=(); evidence:tuple[str,...]=()
    candidate_only:bool=True; canonical_mutation:bool=False
    @property
    def receipt_sha256(self)->str: return _digest(self.__dict__)

@dataclass(frozen=True)
class FabricReceipt:
    consumer:str; packet_sha256:str; operator_id:str; proof_receipt:str; output_digest:str; next_closure_address:str; closure_state:ClosureState
    evidence_class:EvidenceClass; authority:AuthorityState; status:str="CANDIDATE_PROVENANCE_BOUND"; canonical_mutation:bool=False
    @property
    def receipt_sha256(self)->str: return _digest(self.__dict__)

@dataclass(frozen=True)
class ClosureNode:
    closure_address:str; dependencies:tuple[str,...]=(); state:ClosureState=ClosureState.OPEN
    contradiction:float=0.0; burden:float=0.0; future_plasticity:float=0.0; information_gain:float=0.0; cost:float=1.0; scar:ScarVector=ScarVector()
    def __post_init__(self):
        for n in ("contradiction","burden","future_plasticity","information_gain","cost"): _finite_nonnegative(getattr(self,n),n)
        if self.cost == 0: raise ValueError("cost must be positive")
    def utility(self)->float:
        # Explicit scheduler heuristic, not a physical law.
        return (1+self.contradiction+self.scar.magnitude)*(1+self.future_plasticity)*(1+self.information_gain)/(self.cost*(1+self.burden))

class ClosureGraph:
    def __init__(self,nodes:Sequence[ClosureNode]): self.nodes={n.closure_address:n for n in nodes}
    def ready(self)->tuple[ClosureNode,...]:
        proven={a for a,n in self.nodes.items() if n.state==ClosureState.PROVEN}
        xs=[n for n in self.nodes.values() if n.state in (ClosureState.OPEN,ClosureState.READY,ClosureState.HELD) and set(n.dependencies)<=proven]
        return tuple(sorted(xs,key=lambda n:(-n.utility(),n.closure_address)))

class UnifiedComputationalFabric:
    def __init__(self,consumers:Sequence[str]=CONSUMERS):
        self.consumers=tuple(dict.fromkeys(str(x).upper() for x in consumers))
        if not self.consumers: raise ValueError("at least one consumer is required")

    def bind(self,*,consumer:str,packet:WovenPacket,operator:OperatorDescriptor,output:Any,residual:float,decision:str,next_closure_address:str,evidence:Sequence[str]=(),required_authority:AuthorityState=AuthorityState.CANDIDATE)->tuple[ProofLedgerEntry,FabricReceipt]:
        consumer=consumer.upper(); _finite_nonnegative(residual,"residual")
        if consumer not in self.consumers: raise ValueError(f"unregistered fabric consumer: {consumer}")
        if not packet.address_key or not packet.closure_address or not packet.field_receipt: raise ValueError("address, closure, and field proof are mandatory")
        if not next_closure_address: raise ValueError("next closure address is mandatory")
        if AUTHORITY_ORDER[packet.authority] < AUTHORITY_ORDER[required_authority]: raise PermissionError("insufficient proof/authority state")
        closure_state=ClosureState.STALE if packet.temporal.stale else (ClosureState.PROVEN if residual==0 else ClosureState.RETURNED)
        before=_digest({"state":packet.state,"motion":packet.motion,"history":packet.history,"temporal":packet.temporal})
        after=_digest(output)
        proof=ProofLedgerEntry(packet.packet_sha256,packet.closure_address,operator.operator_id,before,after,float(residual),str(decision),packet.evidence_class,packet.authority,packet.scar,packet.parent_proofs,tuple(evidence))
        receipt=FabricReceipt(consumer,packet.packet_sha256,operator.operator_id,proof.receipt_sha256,after,next_closure_address,closure_state,packet.evidence_class,packet.authority)
        return proof,receipt

    def manifest(self)->Mapping[str,Any]:
        body={"schema":SCHEMA,"equation":"ADDRESS_FIELD x WOVEN_PACKET x CLOSURE_GRAPH x OPERATOR_LAW x TEMPORAL_STATE x EVIDENCE_CLASS x SCAR_VECTOR x PROOF_DAG x AUTHORITY_STATE","consumers":self.consumers,"loop":"OBSERVE->DISTINGUISH->ADDRESS->SELECT_CLOSURE->ADMIT_OPERATOR->TRANSFORM->RETURN->COMPARE->CLASSIFY_RESIDUAL->PROVE/FALSIFY->COMPRESS/TURN/ESCALATE->READDRESS","candidate_only":True,"canonical_mutation":False,"physical_dimension_claim":False}
        return {**body,"receipt_sha256":_digest(body)}
