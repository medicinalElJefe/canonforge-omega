from __future__ import annotations

from dataclasses import dataclass, field, asdict
from enum import Enum
from hashlib import sha256
import json
from datetime import datetime, timezone
from typing import Any, Mapping


class EvidenceClass(str, Enum):
    OBSERVED = "OBSERVED"
    IMPORTED = "IMPORTED"
    DERIVED = "DERIVED"
    FORECAST = "FORECAST"
    SYMBOLIC = "SYMBOLIC"
    USER_ASSERTED = "USER_ASSERTED"


@dataclass(frozen=True, slots=True)
class Address20736:
    domain: int
    phase: int
    regulation: int
    layer: int

    def __post_init__(self) -> None:
        for name, value in (("domain", self.domain), ("phase", self.phase), ("regulation", self.regulation), ("layer", self.layer)):
            if not 1 <= value <= 12:
                raise ValueError(f"{name} must be in 1..12")

    @property
    def index(self) -> int:
        return (((self.domain - 1) * 12 + (self.phase - 1)) * 12 + (self.regulation - 1)) * 12 + (self.layer - 1)

    @classmethod
    def from_index(cls, index: int) -> "Address20736":
        if not 0 <= index < 20736:
            raise ValueError("index must be in 0..20735")
        d, rem = divmod(index, 12 ** 3)
        p, rem = divmod(rem, 12 ** 2)
        r, l = divmod(rem, 12)
        return cls(d + 1, p + 1, r + 1, l + 1)

    def as_tuple(self) -> tuple[int, int, int, int]:
        return (self.domain, self.phase, self.regulation, self.layer)


@dataclass(frozen=True, slots=True)
class MotionState:
    a: float = 0.0
    v: float = 0.0
    c: float = 0.0
    q: float = 0.0
    ledger: float = 0.0


@dataclass(frozen=True, slots=True)
class StateMetrics:
    continuity: float
    burden: float
    contradiction: float
    future_plasticity: float = 0.0
    proof_scar: float = 0.0
    shell_depth: int = 0
    branch_pressure: float = 0.0

    def __post_init__(self) -> None:
        for name in ("continuity", "burden", "contradiction", "future_plasticity", "proof_scar", "branch_pressure"):
            value = getattr(self, name)
            if not isinstance(value, (int, float)):
                raise TypeError(f"{name} must be numeric")
        if self.shell_depth < 0:
            raise ValueError("shell_depth must be >= 0")


@dataclass(frozen=True, slots=True)
class StateEnvelope:
    address: Address20736
    evidence_class: EvidenceClass
    metrics: StateMetrics
    motion: MotionState = field(default_factory=MotionState)
    payload: Mapping[str, Any] = field(default_factory=dict)
    source_id: str = "runtime"
    observer_id: str = "canonical"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    parent_digest: str | None = None
    schema_version: str = "omega-state-v1"

    def canonical_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "address": self.address.as_tuple(),
            "evidence_class": self.evidence_class.value,
            "metrics": asdict(self.metrics),
            "motion": asdict(self.motion),
            "payload": dict(self.payload),
            "source_id": self.source_id,
            "observer_id": self.observer_id,
            "timestamp": self.timestamp,
            "parent_digest": self.parent_digest,
        }

    @property
    def digest(self) -> str:
        raw = json.dumps(self.canonical_dict(), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        return sha256(raw.encode("utf-8")).hexdigest()
