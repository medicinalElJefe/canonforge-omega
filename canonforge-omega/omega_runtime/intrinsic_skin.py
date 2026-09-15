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
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
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

    def __post_init__(self) -> None:
        if self.skin not in SKINS:
            raise ValueError(f"skin must be one of {SKINS}")
        if not str(self.frame).strip():
            raise ValueError("frame is required")
        _finite(self.evolution, "evolution")
        if self.orientation not in (-1, 0, 1):
            raise ValueError("orientation must be -1, 0, or 1")

    @property
    def key(self) -> str:
        return _digest((self.address.as_tuple(), self.skin, self.frame, self.evolution, self.orientation, self.history_path))


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
    current_skin: int
    decision: str
    next_skin: int
    state_residual: float
    cross_skin_q: float
    marginal_gain: float
    burden: float
    reason: str
    canonical_mutation: bool = False


class SkinRegistry:
    def __init__(self) -> None:
        self._projectors: dict[int, Callable[..., Mapping[str, Any]]] = {}
        self._translators: dict[tuple[int, int], Callable[[Mapping[str, Any]], Mapping[str, Any]]] = {}

    def register_projector(self, skin: int, fn: Callable[..., Mapping[str, Any]]) -> None:
        if skin not in SKINS:
            raise ValueError(skin)
        self._projectors[skin] = fn

    def register_translator(self, source: int, target: int, fn: Callable[[Mapping[str, Any]], Mapping[str, Any]]) -> None:
        if source not in SKINS or target not in SKINS or source == target:
            raise ValueError((source, target))
        self._translators[(source, target)] = fn

    def project(self, envelope: StateEnvelope, coord: OmegaAddr) -> SkinState:
        fn = self._projectors.get(coord.skin)
        if fn is None:
            raise KeyError(f"no projector registered for skin {coord.skin}")
        variables = dict(fn(envelope=envelope, coord=coord))
        return SkinState(coord=coord, variables=variables)

    def translate(self, state: SkinState, target_skin: int) -> Mapping[str, Any]:
        fn = self._translators.get((state.coord.skin, target_skin))
        if fn is None:
            raise KeyError(f"no translator registered for {state.coord.skin}->{target_skin}")
        return dict(fn(state.variables))


def numeric_residual(left: Sequence[float], right: Sequence[float]) -> float:
    if len(left) != len(right):
        raise ValueError("residual vectors must have equal length")
    return sqrt(sum((_finite(a, "left") - _finite(b, "right")) ** 2 for a, b in zip(left, right)))


def cross_skin_q(projected: Sequence[float], native: Sequence[float]) -> float:
    return numeric_residual(projected, native)


def decide_resolution(
    skin: int,
    *,
    state_residual: float,
    cross_skin_contradiction: float,
    epsilon: float,
    marginal_gain: float,
    gain_floor: float,
    burden: float = 0.0,
) -> SkinDecision:
    if skin not in SKINS:
        raise ValueError(skin)
    residual = _finite(state_residual, "state_residual")
    q = _finite(cross_skin_contradiction, "cross_skin_contradiction")
    eps = _finite(epsilon, "epsilon")
    gain = _finite(marginal_gain, "marginal_gain")
    floor = _finite(gain_floor, "gain_floor")
    load = _finite(burden, "burden")
    if min(residual, q, eps, gain, floor, load) < 0:
        raise ValueError("resolution metrics must be non-negative")
    i = SKINS.index(skin)
    if residual > eps or q > eps:
        if i < len(SKINS) - 1:
            return SkinDecision(skin, "ESCALATE", SKINS[i + 1], residual, q, gain, load, "unresolved residual/contradiction")
        return SkinDecision(skin, "TURN", skin, residual, q, gain, load, "resolution ceiling reached; change frame/model/operator")
    if gain < floor and i > 0:
        return SkinDecision(skin, "PRUNE", SKINS[i - 1], residual, q, gain, load, "finer skin adds insufficient marginal information")
    return SkinDecision(skin, "STAY", skin, residual, q, gain, load, "current skin is sufficient")


def canonical_20736_skin(envelope: StateEnvelope, *, frame: str = "canonical", evolution: float = 0.0, orientation: int = 0, history_path: str = "") -> SkinState:
    coord = OmegaAddr(envelope.address, 20736, frame, evolution, orientation, history_path)
    m = envelope.metrics
    motion = envelope.motion
    neighbors = atlas_neighbors(envelope.address.index)
    variables = {
        "address": envelope.address.as_tuple(),
        "address_index": envelope.address.index,
        "continuity": m.continuity,
        "future_plasticity": m.future_plasticity,
        "burden": m.burden,
        "contradiction": m.contradiction,
        "proof_scar": m.proof_scar,
        "shell_depth": m.shell_depth,
        "branch_pressure": m.branch_pressure,
    }
    geometry = {"neighbors": neighbors, "degree": len(neighbors), "topology": "OMEGA_REFERENCE_1_PLUS_6"}
    motion_map = asdict(motion)
    invariants = {"canonical_digest": envelope.digest, "address_key": coord.key}
    return SkinState(coord, variables, geometry, motion_map, invariants)


def skin_manifest() -> dict[str, Any]:
    body = {
        "schema": SCHEMA,
        "skins": list(SKINS),
        "coordinate": ["address", "skin", "frame", "evolution", "orientation", "history_path"],
        "edge_families": ["relation", "skin", "time/evolution"],
        "decisions": ["STAY", "TURN", "ESCALATE", "PRUNE"],
        "learning_loop": ["OBSERVE", "ADDRESS", "PROJECT", "RELATE", "GEOMETRY", "MOTION", "PREDICT", "COMPARE", "RESIDUAL", "CROSS_SKIN", "LEARN_CANDIDATE", "REPLAY", "FALSIFY", "PROVE", "PROMOTE"],
        "physical_dimension_claim": False,
        "canonical_mutation": False,
        "boundary": BOUNDARY,
    }
    return {**body, "receipt_sha256": _digest(body)}
