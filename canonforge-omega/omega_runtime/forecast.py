from __future__ import annotations

from dataclasses import dataclass
from .state import StateEnvelope
from .atlas import ping_next


@dataclass(frozen=True, slots=True)
class ForecastBranch:
    address_index: int
    score: float
    assumption: str


@dataclass(frozen=True, slots=True)
class ForecastPacket:
    source_digest: str
    horizon_transitions: int
    branches: tuple[ForecastBranch, ...]
    calibrated: bool = False
    evidence_class: str = "FORECAST"


def deterministic_local_forecast(state: StateEnvelope, horizon: int = 1) -> ForecastPacket:
    if horizon < 1:
        raise ValueError("horizon must be >= 1")
    addr = state.address
    for _ in range(horizon):
        addr = ping_next(addr)
    branches = (ForecastBranch(addr.index, 1.0, "deterministic AutoPing continuation"),)
    return ForecastPacket(state.digest, horizon, branches, calibrated=False)
