from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import Enum
from hashlib import sha256
import json
import math
from typing import Any, Mapping, Sequence


class EvidenceClass(str, Enum):
    OBSERVED = "OBSERVED"
    IMPORTED = "IMPORTED"
    DERIVED = "DERIVED"
    FORECAST = "FORECAST"
    INFERRED = "INFERRED"
    ASSUMED = "ASSUMED"
    SYMBOLIC = "SYMBOLIC"
    USER_ASSERTED = "USER_ASSERTED"


_EVIDENCE_RANK = {
    EvidenceClass.ASSUMED: 0,
    EvidenceClass.SYMBOLIC: 1,
    EvidenceClass.USER_ASSERTED: 1,
    EvidenceClass.FORECAST: 2,
    EvidenceClass.INFERRED: 2,
    EvidenceClass.DERIVED: 3,
    EvidenceClass.IMPORTED: 4,
    EvidenceClass.OBSERVED: 5,
}


def evidence_rank(value: EvidenceClass | str) -> int:
    return _EVIDENCE_RANK[EvidenceClass(value)]


@dataclass(frozen=True, slots=True)
class Address20736:
    """12 × 12 × 12 × 12 software address lattice."""
    domain: int
    phase: int
    regulation: int
    lens: int

    def __post_init__(self) -> None:
        for name, value in (("domain", self.domain), ("phase", self.phase), ("regulation", self.regulation), ("lens", self.lens)):
            if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 12:
                raise ValueError(f"{name} must be an integer in 1..12")

    @property
    def index0(self) -> int:
        return (((self.domain - 1) * 12 + (self.phase - 1)) * 12 + (self.regulation - 1)) * 12 + (self.lens - 1)

    @property
    def state_id(self) -> int:
        return self.index0 + 1

    @classmethod
    def from_index0(cls, index: int) -> "Address20736":
        if not 0 <= index < 20736:
            raise ValueError("index must be in 0..20735")
        d, rem = divmod(index, 12 ** 3)
        p, rem = divmod(rem, 12 ** 2)
        r, l = divmod(rem, 12)
        return cls(d + 1, p + 1, r + 1, l + 1)

    @classmethod
    def from_state_id(cls, state_id: int) -> "Address20736":
        if not 1 <= state_id <= 20736:
            raise ValueError("state_id must be in 1..20736")
        return cls.from_index0(state_id - 1)

    def as_tuple(self) -> tuple[int, int, int, int]:
        return (self.domain, self.phase, self.regulation, self.lens)


@dataclass(frozen=True, slots=True)
class SourceRef:
    source_id: str
    authority: str
    evidence_class: EvidenceClass
    observed_at: str | None = None
    retrieved_at: str | None = None
    immutable_ref: str | None = None
    checksum: str | None = None
    note: str = ""


@dataclass(frozen=True, slots=True)
class CanonicalMetrics:
    continuity: float = 1.0
    future_plasticity: float = 0.0
    burden: float = 0.0
    contradiction: float = 0.0
    stability: float = 1.0
    scar: float = 0.0
    evidence_strength: float = 1.0
    water_conductance: float = 0.0
    triangulation: float = 0.0
    occupancy: float = 0.0
    proof_scar: float = 0.0
    normalized_mri: float = 0.0

    def __post_init__(self) -> None:
        for name in self.__dataclass_fields__:
            value = getattr(self, name)
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise TypeError(f"{name} must be numeric")
            if not math.isfinite(float(value)):
                raise ValueError(f"{name} must be finite")


@dataclass(frozen=True, slots=True)
class MotionPacket:
    phase: float = 1.0
    velocity: float = 0.0
    acceleration: float = 0.0
    jerk: float = 0.0
    heading_rad: float = 0.0
    face: int = 1
    antipode: int = 7
    transition_progress: float = 0.0

    def __post_init__(self) -> None:
        for name in ("phase", "velocity", "acceleration", "jerk", "heading_rad", "transition_progress"):
            value = getattr(self, name)
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
                raise ValueError(f"{name} must be a finite number")
        for name in ("face", "antipode"):
            value = getattr(self, name)
            if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 12:
                raise ValueError(f"{name} must be an integer in 1..12")


@dataclass(frozen=True, slots=True)
class CanonicalPacket:
    address: Address20736
    metrics: CanonicalMetrics
    evidence_class: EvidenceClass = EvidenceClass.DERIVED
    motion: MotionPacket = field(default_factory=MotionPacket)
    sources: Sequence[SourceRef] = field(default_factory=tuple)
    payload: Mapping[str, Any] = field(default_factory=dict)
    parent_digest: str | None = None
    sequence: int = 0
    observer_id: str = "canonical"
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    schema_version: str = "omega-genesis-state-v1"

    def canonical_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "address": self.address.as_tuple(),
            "metrics": asdict(self.metrics),
            "evidence_class": self.evidence_class.value,
            "motion": asdict(self.motion),
            "sources": [
                {**asdict(s), "evidence_class": s.evidence_class.value} for s in self.sources
            ],
            "payload": dict(self.payload),
            "parent_digest": self.parent_digest,
            "sequence": self.sequence,
            "observer_id": self.observer_id,
            "created_at": self.created_at,
        }

    @property
    def digest(self) -> str:
        raw = json.dumps(self.canonical_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        return sha256(raw.encode("utf-8")).hexdigest()

    def public_dict(self) -> dict[str, Any]:
        d = self.canonical_dict()
        d["digest"] = self.digest
        d["state_id"] = self.address.state_id
        d["index0"] = self.address.index0
        return d
