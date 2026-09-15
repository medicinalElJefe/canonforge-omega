"""Intrinsic multiresolution compute kernel for OMEGA.

Atlas levels are computational resolution/address lenses, not physical dimensions.
Candidate learning is isolated from canonical promotion.
"""
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Iterable, Optional
import hashlib, json, math

SKINS=(12,144,1728,20736,248832)

def stable_hash(value: Any)->str:
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()

@dataclass(frozen=True)
class OmegaAddr:
    address:str
    skin:int
    frame:str
    t:Any
    orientation:int=0
    history_path:str=""
    def __post_init__(self):
        if self.skin not in SKINS: raise ValueError(f"unsupported skin {self.skin}")
        if self.orientation not in (-1,0,1): raise ValueError("orientation must be -1, 0, or 1")

@dataclass
class NodeState:
    coord:OmegaAddr
    core_state:Dict[str,Any]
    skin_state:Dict[str,Any]
    relations:Dict[str,Any]=field(default_factory=dict)
    geometry:Dict[str,Any]=field(default_factory=dict)
    motion:Dict[str,Any]=field(default_factory=dict)
    history:Dict[str,Any]=field(default_factory=dict)
    provenance:Dict[str,Any]=field(default_factory=dict)
    proof:Dict[str,Any]=field(default_factory=dict)

@dataclass
class RelationEdge:
    source:str; target:str
    delta_state:Dict[str,Any]=field(default_factory=dict)
    delta_geometry:Dict[str,Any]=field(default_factory=dict)
    delta_motion:Dict[str,Any]=field(default_factory=dict)
    delta_phase:Optional[float]=None
    transform:Dict[str,Any]=field(default_factory=dict)

@dataclass
class TrainingCell:
    source:OmegaAddr; target:OmegaAddr
    source_state:Dict[str,Any]; target_state:Dict[str,Any]
    geometry:Dict[str,Any]; motion:Dict[str,Any]
    invariants:Dict[str,Any]; residuals:Dict[str,float]
    provenance:Dict[str,Any]

class SkinRegistry:
    def __init__(self):
        self.projectors:Dict[int,Callable]={}
        self.translators:Dict[tuple[int,int],Callable]={}
    def register_projector(self,skin:int,fn:Callable):
        if skin not in SKINS: raise ValueError(skin)
        self.projectors[skin]=fn
    def register_translator(self,source:int,target:int,fn:Callable):
        if source not in SKINS or target not in SKINS: raise ValueError((source,target))
        self.translators[(source,target)]=fn
    def project(self,core,relations,history,skin:int,frame:str):
        return self.projectors[skin](core,relations,history,frame)
    def translate(self,state,source:int,target:int):
        return self.translators[(source,target)](state)

def vector_residual(a:Iterable[float],b:Iterable[float])->float:
    aa,bb=list(a),list(b)
    if len(aa)!=len(bb): raise ValueError("metric vectors differ in dimensionality")
    return math.sqrt(sum((x-y)**2 for x,y in zip(aa,bb)))

def cross_skin_q(fine_state,coarse_state,translator:Callable,metric:Callable=vector_residual)->float:
    return metric(translator(fine_state),coarse_state)

def resolution_decision(skin:int,residual:float,q:float,eps:float,marginal_gain:float,gain_floor:float)->str:
    if residual>eps or q>eps:
        return "ESCALATE" if skin!=SKINS[-1] else "TURN"
    if marginal_gain<gain_floor and skin!=SKINS[0]: return "PRUNE"
    return "STAY"

class CanonGate:
    REQUIRED=("replay","invariants","cross_skin","provenance","rollback")
    def evaluate(self,checks:Dict[str,bool])->str:
        return "PROMOTE" if all(checks.get(k,False) for k in self.REQUIRED) else "HOLD"

class IntrinsicComputeEngine:
    """Orchestrates addressed skin projection and governed resolution decisions."""
    def __init__(self,registry:SkinRegistry): self.registry=registry
    def materialize(self,coord:OmegaAddr,core:Dict[str,Any],relations=None,history=None)->NodeState:
        relations=relations or {}; history=history or {}
        skin_state=self.registry.project(core,relations,history,coord.skin,coord.frame)
        return NodeState(coord,core,skin_state,relations=relations,history=history)
    def compare_skins(self,fine:NodeState,coarse:NodeState,metric:Callable=vector_residual)->float:
        return cross_skin_q(fine.skin_state,coarse.skin_state,
            lambda x:self.registry.translate(x,fine.coord.skin,coarse.coord.skin),metric)
