from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
from math import sqrt
from typing import Iterable

from .intrinsic_skin import OmegaAddr, SKINS

SCHEMA = "OMEGA_ADDRESS_STATE_FIELD_R224"
EPSILON = 1e-9


def _digest(value) -> str:
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, float(x)))


@dataclass(frozen=True, slots=True)
class FieldSample:
    address: OmegaAddr
    continuity: float
    future_plasticity: float
    contradiction: float
    burden: float
    scar: float = 0.0
    phase: float = 0.0
    state: tuple[float, ...] = ()

    def __post_init__(self):
        for name in ("continuity", "future_plasticity", "contradiction", "burden", "scar"):
            if getattr(self, name) < 0:
                raise ValueError(f"{name} must be non-negative")

    @property
    def coherence(self) -> float:
        return (self.continuity * self.future_plasticity) / (self.contradiction + self.burden + EPSILON)


@dataclass(frozen=True, slots=True)
class AddressStateField:
    center: FieldSample
    samples: tuple[FieldSample, ...]
    weights: tuple[float, ...]
    state_vector: tuple[float, ...]
    motion_vector: tuple[float, ...]
    geometry_residual: float
    continuity: float
    future_plasticity: float
    contradiction: float
    burden: float
    scar: float
    coherence: float
    action: str
    receipt_sha256: str


class AddressStateFieldEngine:
    """Build the observable field at the address's declared computational resolution.

    Higher skins admit a wider relational horizon, but only supplied/proven samples
    participate. Resolution changes computation; it does not assert physical dimensions.
    """

    HORIZON = {12: 1, 144: 2, 1728: 4, 20736: 8, 248832: 12}

    def __init__(self, stay_threshold: float = 0.66, turn_threshold: float = 0.33):
        if not 0 <= turn_threshold <= stay_threshold:
            raise ValueError("thresholds must satisfy 0 <= TURN <= STAY")
        self.stay_threshold = stay_threshold
        self.turn_threshold = turn_threshold

    @staticmethod
    def _distance(a: tuple[float, ...], b: tuple[float, ...]) -> float:
        n = max(len(a), len(b))
        if n == 0:
            return 0.0
        aa = a + (0.0,) * (n - len(a)); bb = b + (0.0,) * (n - len(b))
        return sqrt(sum((x-y)**2 for x, y in zip(aa, bb)) / n)

    def compute(self, center: FieldSample, neighborhood: Iterable[FieldSample] = (), previous: FieldSample | None = None) -> AddressStateField:
        skin = center.address.skin
        if skin not in SKINS:
            raise ValueError("unsupported computational skin")
        candidates = [s for s in neighborhood if s.address.frame == center.address.frame and s.address.skin == skin]
        candidates.sort(key=lambda s: (self._distance(center.state, s.state), s.address.key))
        selected = tuple([center] + candidates[: self.HORIZON[skin]])
        raw = tuple(1.0 / (1.0 + self._distance(center.state, s.state) + s.contradiction + s.scar) for s in selected)
        total = sum(raw) or 1.0
        weights = tuple(w / total for w in raw)
        width = max((len(s.state) for s in selected), default=0)
        state = tuple(sum(w * (s.state[i] if i < len(s.state) else 0.0) for w, s in zip(weights, selected)) for i in range(width))
        if previous is None:
            motion = tuple(0.0 for _ in state)
        else:
            p = previous.state + (0.0,) * (len(state) - len(previous.state))
            motion = tuple(x-y for x, y in zip(state, p))
        continuity = sum(w*s.continuity for w,s in zip(weights, selected))
        plasticity = sum(w*s.future_plasticity for w,s in zip(weights, selected))
        contradiction = sum(w*s.contradiction for w,s in zip(weights, selected))
        burden = sum(w*s.burden for w,s in zip(weights, selected))
        scar = sum(w*s.scar for w,s in zip(weights, selected))
        geometry_residual = sum(w*self._distance(state, s.state) for w,s in zip(weights, selected))
        coherence = (continuity * plasticity) / (contradiction + burden + geometry_residual + scar + EPSILON)
        normalized = coherence / (1.0 + coherence)
        action = "STAY" if normalized >= self.stay_threshold else ("TURN" if normalized >= self.turn_threshold else "ESCALATE")
        body = {"schema":SCHEMA,"center":center.address.key,"skin":skin,"frame":center.address.frame,"sample_addresses":[s.address.key for s in selected],"weights":weights,"state":state,"motion":motion,"geometry_residual":geometry_residual,"CΩ":continuity,"Φ":plasticity,"q":contradiction,"Λ":burden,"scar":scar,"coherence":coherence,"action":action,"physical_dimension_claim":False,"canonical_mutation":False}
        return AddressStateField(center, selected, weights, state, motion, geometry_residual, continuity, plasticity, contradiction, burden, scar, coherence, action, _digest(body))
