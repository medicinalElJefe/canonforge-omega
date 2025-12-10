from __future__ import annotations
from dataclasses import dataclass

from .universal_moment import UniversalMomentSnapshot


@dataclass
class TICVector:
    """Truth / Integrity / Courage vector."""
    truth: float
    integrity: float
    courage: float

    @property
    def omega_effective(self) -> float:
        return round((self.truth + self.integrity + self.courage) / 3.0, 3)


class TICCalculator:
    """Derives a TIC vector from a UniversalMomentSnapshot."""

    def from_moment(self, snap: UniversalMomentSnapshot) -> TICVector:
        avg = (snap.life_coherence + snap.system_coherence) / 2.0
        diff = abs(snap.life_coherence - snap.system_coherence)

        truth = max(0.0, 1.0 - diff * 4.0)
        integrity = max(0.0, min(1.0, min(snap.life_coherence, snap.system_coherence)))
        courage = max(0.0, min(1.0, (avg - 0.5) * 2.0))

        return TICVector(truth=round(truth, 3), integrity=round(integrity, 3), courage=round(courage, 3))
