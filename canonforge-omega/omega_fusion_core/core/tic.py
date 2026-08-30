from __future__ import annotations
from dataclasses import dataclass

from .universal_moment import UniversalMomentSnapshot


@dataclass
class TICVector:
    """Truth / Integrity / Courage compatibility vector."""
    truth: float
    integrity: float
    courage: float

    @property
    def omega_effective(self) -> float:
        return round((self.truth + self.integrity + self.courage) / 3.0, 3)


class TICCalculator:
    """Derives a bounded compatibility vector from evidenced Fusion fields.

    No evidence produces a zero vector; it does not produce a synthetic perfect
    truth score. OMEGA V6 canonical truth/evidence authority lives in
    omega_runtime and its proof/evidence classes.
    """

    def from_moment(self, snap: UniversalMomentSnapshot) -> TICVector:
        if snap.evidence_count <= 0:
            return TICVector(truth=0.0, integrity=0.0, courage=0.0)
        avg = (snap.life_coherence + snap.system_coherence) / 2.0
        diff = abs(snap.life_coherence - snap.system_coherence)
        truth = max(0.0, 1.0 - diff * 4.0)
        integrity = max(0.0, min(1.0, min(snap.life_coherence, snap.system_coherence)))
        courage = max(0.0, min(1.0, (avg - 0.5) * 2.0))
        return TICVector(truth=round(truth, 3), integrity=round(integrity, 3), courage=round(courage, 3))
