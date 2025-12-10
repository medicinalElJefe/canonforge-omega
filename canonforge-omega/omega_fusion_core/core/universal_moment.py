from __future__ import annotations
from dataclasses import dataclass
from typing import List
from datetime import datetime

from .model import OmegaPacket


@dataclass
class UniversalMomentSnapshot:
    timestamp: datetime
    uai: float
    life_coherence: float
    system_coherence: float


class UniversalMomentCalculator:
    """Simple placeholder for your Universal Measurement engine."""

    def __init__(self) -> None:
        self.history: List[UniversalMomentSnapshot] = []

    def compute_from_packets(self, packets: List[OmegaPacket]) -> UniversalMomentSnapshot:
        ts = packets[-1].timestamp if packets and packets[-1].timestamp else datetime.utcnow()
        life = 0.85
        system = 0.85
        for p in packets[-50:]:
            if "ecfr" in p.tags or "report" in p.tags:
                system += 0.005
            if p.state.name == "EMOTIONAL":
                life += 0.002
        life = max(0.0, min(1.0, life))
        system = max(0.0, min(1.0, system))
        uai = round((life + system) / 2.0, 3)
        snap = UniversalMomentSnapshot(timestamp=ts, uai=uai, life_coherence=life, system_coherence=system)
        self.history.append(snap)
        return snap
