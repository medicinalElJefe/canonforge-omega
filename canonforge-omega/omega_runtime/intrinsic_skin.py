from __future__ import annotations

from dataclasses import dataclass, field, asdict
from hashlib import sha256
from math import isfinite, sqrt
from typing import Any, Callable, Mapping, Sequence
import json

from .state import Address20736, StateEnvelope
from .atlas import atlas_neighbors

SKINS = (12, 144, 1728, 20736, 248832)
SCHEMA = "OMEGA_INTRINSIC_SKIN_COMPUTE_R223"
BOUNDARY = (
    "R223 treats 12/144/1728/20736/248832 as computational address-resolution skins. "
    "They are not asserted to be literal physical dimensions. Cross-skin operators are explicit, "
    "coarse-to-fine expansion preserves uncertainty, and candidate learning has no canonical mutation authority."
)


def _finite(value: float, name: str) -> float:
    value = float(value)
    if not isfinite(value): raise ValueError(f"{name} must be finite")
    return value


def _digest(value: Any) -> str:
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


@dataclass(frozen=True, slots=True)
class OmegaAddr:
    address: Address20736
    skin: int
    frame: str
    evolution: float
    orientation: int = 0
    history_path: str = ""
    path_address: str = ""
    closure_address: str = ""

    def __post_init__(self) -> None:
        if self.skin not in SKINS: raise ValueError(f"skin must be one of {SKINS}")
        if not str(self.frame).strip(): raise ValueError("frame is required")
        _finite(self.evolution, "evolution")
        if self.orientation not in (-1, 0, 1): raise ValueError("orientation must be -1, 0, or 1")

    @property
    def key(self) -> str:
        return _digest((self.address.as_tuple(), self.skin, self.frame, self.evolution, self.orientation,
                        self.history_path, self.path_address, self.closure_address))

    def with_path(self, path: "PathAddress", closure: str = "") -> "OmegaAddr":
        return OmegaAddr(self.address, self.skin, self.frame, self.evolution, self.orientation,
                         self.history_path, path.key, closure)


@dataclass(frozen=True, slots=True)
class PathStep:
    source: str
    target: str
    operator: str
    transform_digest: str = ""
    residual: float = 0.0

    def __post_init__(self) -> None:
        if not self.source or not self.target or not self.operator: raise ValueError("path step requires source, target, operator")
        if _finite(self.residual, "residual") < 0: raise ValueError("residual must be non-negative")


@dataclass(frozen=True, slots=True)
class PathAddress:
    start: str
    steps: tuple[PathStep, ...]
    skin: int
    frame: str
    orientation: int = 0

    def __post_init__(self) -> None:
        if not self.start or not self.steps: raise ValueError("path requires start and at least one step")
        if self.skin not in SKINS: raise ValueError(self.skin)
        if self.orientation not in (-1, 0, 1): raise ValueError("orientation must be -1, 0, or 1")
        cursor = self.start
        for step in self.steps:
            if step.source != cursor: raise ValueError("path is discontinuous")
            cursor = step.target

    @property
    def end(self) -> str: return self.steps[-1].target

    @property
    def key(self) -> str:
        return _digest((self.start, tuple(asdict(s) for s in self.steps), self.skin, self.frame, self.orientation))


@dataclass(frozen=True, slots=True)
class ClosureAddress:
    path: PathAddress
    equivalence: str
    return_residual: float
    invariant_residual: float
    scar: float
    contradiction: float
    status: str = "OPEN"

    def __post_init__(self) -> None:
        if not self.equivalence.strip(): raise ValueError("closure equivalence is required")
        for n, v in (("return_residual",self.return_residual),("invariant_residual",self.invariant_residual),
                     ("scar",self.scar),("contradiction",self.contradiction)):
            if _finite(v,n) < 0: raise ValueError(f"{n} must be non-negative")
        if self.status not in ("OPEN","EXACT","EQUIVALENT","APPROXIMATE","PROJECTED","FAILED"):
            raise ValueError("invalid closure status")

    @property
    def key(self) -> str:
        return _digest((self.path.key,self.equivalence,self.return_residual,self.invariant_residual,
                        self.scar,self.contradiction,self.status))


@dataclass(frozen=True, slots=True)
class ProofObligation:
    obligation_id: str
    claim: str
    closure: ClosureAddress
    priority: float = 0.0
    dependencies: tuple[str, ...] = ()
    evidence: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.obligation_id or not self.claim: raise ValueError("proof obligation requires id and claim")
        if _finite(self.priority,"priority") < 0: raise ValueError("priority must be non-negative")

    @property
    def closure_address(self) -> str: return self.closure.key

    @property
    def resolved(self) -> bool: return self.closure.status in ("EXACT","EQUIVALENT")


class ClosureNavigator:
    """Selects unresolved proof-addresses; it never mutates Canon."""
    def unresolved(self, obligations: Sequence[ProofObligation]) -> tuple[ProofObligation, ...]:
        return tuple(o for o in obligations if not o.resolved)

    def next(self, obligations: Sequence[ProofObligation], resolved_ids: Sequence[str] = ()) -> ProofObligation | None:
        resolved = set(resolved_ids)
        candidates = [o for o in self.unresolved(obligations) if all(d in resolved for d in o.dependencies)]
        if not candidates: return None
        # Highest priority, then greatest unresolved contradiction/scar, then deterministic address.
        return sorted(candidates, key=lambda o: (-o.priority, -o.closure.contradiction, -o.closure.scar, o.closure_address))[0]

    def route(self, obligation: ProofObligation, epsilon: float) -> str:
        eps = _finite(epsilon,"epsilon")
        c = obligation.closure
        if obligation.resolved: return "CLOSED"
        if c.return_residual > eps or c.contradiction > eps: return "ESCALATE" if c.path.skin != SKINS[-1] else "TURN"
        if c.status in ("APPROXIMATE","PROJECTED"): return "PROVE_EQUIVALENCE"
        return "INVESTIGATE"


@dataclass(frozen=True, slots=True)
class SkinState:
    coord: OmegaAddr
    variables: Mapping[str, Any]
    geometry: Mapping[str, Any] = field(default_factory=dict)
    motion: Mapping[str, Any] = field(default_factory=dict)
    invariants: Mapping[str, Any] = field(default_factory=dict)
    residuals: Mapping[str, float] = field(default_factory=dict)
    evidence_class: str = "DERIVED"
    canonical_mutation: bool = False


@dataclass(frozen=True, slots=True)
class SkinDecision:
    current_skin: int; decision: str; next_skin: int; state_residual: float; cross_skin_q: float
    marginal_gain: float; burden: float; reason: str; canonical_mutation: bool = False


class SkinRegistry:
    def __init__(self) -> None:
        self._projectors: dict[int, Callable[..., Mapping[str, Any]]] = {}
        self._translators: dict[tuple[int, int], Callable[[Mapping[str, Any]], Mapping[str, Any]]] = {}
    def register_projector(self, skin:int, fn:Callable[...,Mapping[str,Any]]) -> None:
        if skin not in SKINS: raise ValueError(skin)
        self._projectors[skin]=fn
    def register_translator(self, source:int, target:int, fn:Callable[[Mapping[str,Any]],Mapping[str,Any]]) -> None:
        if source not in SKINS or target not in SKINS or source==target: raise ValueError((source,target))
        self._translators[(source,target)]=fn
    def project(self,envelope:StateEnvelope,coord:OmegaAddr)->SkinState:
        fn=self._projectors.get(coord.skin)
        if fn is None: raise KeyError(f"no projector registered for skin {coord.skin}")
        return SkinState(coord=coord,variables=dict(fn(envelope=envelope,coord=coord)))
    def translate(self,state:SkinState,target_skin:int)->Mapping[str,Any]:
        fn=self._translators.get((state.coord.skin,target_skin))
        if fn is None: raise KeyError(f"no translator registered for {state.coord.skin}->{target_skin}")
        return dict(fn(state.variables))


def numeric_residual(left:Sequence[float],right:Sequence[float])->float:
    if len(left)!=len(right): raise ValueError("residual vectors must have equal length")
    return sqrt(sum((_finite(a,"left")-_finite(b,"right"))**2 for a,b in zip(left,right)))

def cross_skin_q(projected:Sequence[float],native:Sequence[float])->float: return numeric_residual(projected,native)

def decide_resolution(skin:int,*,state_residual:float,cross_skin_contradiction:float,epsilon:float,marginal_gain:float,gain_floor:float,burden:float=0.0)->SkinDecision:
    if skin not in SKINS: raise ValueError(skin)
    residual=_finite(state_residual,"state_residual"); q=_finite(cross_skin_contradiction,"cross_skin_contradiction")
    eps=_finite(epsilon,"epsilon"); gain=_finite(marginal_gain,"marginal_gain"); floor=_finite(gain_floor,"gain_floor"); load=_finite(burden,"burden")
    if min(residual,q,eps,gain,floor,load)<0: raise ValueError("resolution metrics must be non-negative")
    i=SKINS.index(skin)
    if residual>eps or q>eps:
        if i<len(SKINS)-1: return SkinDecision(skin,"ESCALATE",SKINS[i+1],residual,q,gain,load,"unresolved residual/contradiction")
        return SkinDecision(skin,"TURN",skin,residual,q,gain,load,"resolution ceiling reached; change frame/model/operator")
    if gain<floor and i>0: return SkinDecision(skin,"PRUNE",SKINS[i-1],residual,q,gain,load,"finer skin adds insufficient marginal information")
    return SkinDecision(skin,"STAY",skin,residual,q,gain,load,"current skin is sufficient")


def canonical_20736_skin(envelope:StateEnvelope,*,frame:str="canonical",evolution:float=0.0,orientation:int=0,history_path:str="")->SkinState:
    coord=OmegaAddr(envelope.address,20736,frame,evolution,orientation,history_path)
    m=envelope.metrics; motion=envelope.motion; neighbors=atlas_neighbors(envelope.address.index)
    variables={"address":envelope.address.as_tuple(),"address_index":envelope.address.index,"continuity":m.continuity,
               "future_plasticity":m.future_plasticity,"burden":m.burden,"contradiction":m.contradiction,
               "proof_scar":m.proof_scar,"shell_depth":m.shell_depth,"branch_pressure":m.branch_pressure}
    geometry={"neighbors":neighbors,"degree":len(neighbors),"topology":"OMEGA_REFERENCE_1_PLUS_6"}
    return SkinState(coord,variables,geometry,asdict(motion),{"canonical_digest":envelope.digest,"address_key":coord.key})


def skin_manifest()->dict[str,Any]:
    body={"schema":SCHEMA,"skins":list(SKINS),
          "coordinate":["address","skin","frame","evolution","orientation","history_path","path_address","closure_address"],
          "address_kinds":["state","path","closure","proof_obligation"],
          "edge_families":["relation","skin","time/evolution","path","closure/dependency"],
          "decisions":["STAY","TURN","ESCALATE","PRUNE"],
          "closure_status":["OPEN","EXACT","EQUIVALENT","APPROXIMATE","PROJECTED","FAILED"],
          "learning_loop":["OBSERVE","ADDRESS","SELECT_UNRESOLVED_CLOSURE","TRAVERSE","PROJECT","RELATE","GEOMETRY","MOTION","PREDICT","COMPARE","RETURN","RESIDUAL","CROSS_SKIN","LEARN_CANDIDATE","REPLAY","FALSIFY","PROVE_CLOSURE","PROMOTE"],
          "physical_dimension_claim":False,"canonical_mutation":False,"boundary":BOUNDARY}
    return {**body,"receipt_sha256":_digest(body)}
