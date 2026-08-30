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
    evidence_count: int = 0


class UniversalMomentCalculator:
    """Evidence-bound compatibility calculator for the older Fusion donor.

    The former prototype returned fixed 0.85 values even with no packets. That
    synthetic baseline is removed. Coherence is now calculated only from
    explicit numeric payload fields supplied by packets; absent evidence yields
    zero rather than invented certainty. The canonical OMEGA V6 authority is
    omega_runtime.StateEnvelope, not this compatibility layer.
    """

    def __init__(self) -> None:
        self.history: List[UniversalMomentSnapshot] = []

    @staticmethod
    def _bounded(value: object) -> float | None:
        if isinstance(value, (int, float)):
            return max(0.0, min(1.0, float(value)))
        return None

    def compute_from_packets(self, packets: List[OmegaPacket]) -> UniversalMomentSnapshot:
        ts = packets[-1].timestamp if packets and packets[-1].timestamp else datetime.utcnow()
        life_values: list[float] = []
        system_values: list[float] = []
        evidence_count = 0
        for packet in packets[-50:]:
            life = self._bounded(packet.payload.get("life_coherence"))
            system = self._bounded(packet.payload.get("system_coherence"))
            generic = self._bounded(packet.payload.get("coherence"))
            if life is not None:
                life_values.append(life); evidence_count += 1
            elif generic is not None and packet.state.name in {"EMOTIONAL", "SOMATIC", "RELATIONAL"}:
                life_values.append(generic); evidence_count += 1
            if system is not None:
                system_values.append(system); evidence_count += 1
            elif generic is not None:
                system_values.append(generic); evidence_count += 1
        life_value = sum(life_values) / len(life_values) if life_values else 0.0
        system_value = sum(system_values) / len(system_values) if system_values else 0.0
        uai = round((life_value + system_value) / 2.0, 6)
        snap = UniversalMomentSnapshot(timestamp=ts, uai=uai, life_coherence=life_value,
                                       system_coherence=system_value, evidence_count=evidence_count)
        self.history.append(snap)
        return snap
