from __future__ import annotations

from dataclasses import dataclass, field
from collections import deque
from typing import Iterable, Sequence


def ptf_core(values: Sequence[float], weights: Sequence[float]) -> float:
    """Five-step weighted recent contradiction/burden memory.

    `values[0]` and `weights[0]` are the newest sample/weight. This is a
    software memory operator; it does not create an independent physical
    variable.
    """
    if len(values) != 5 or len(weights) != 5:
        raise ValueError("PTF_core requires exactly five values and five weights")
    total_w = sum(float(w) for w in weights)
    if total_w <= 0:
        raise ValueError("PTF_core weights must have positive total weight")
    return sum(float(v) * float(w) for v, w in zip(values, weights)) / total_w


@dataclass(frozen=True, slots=True)
class ScarRecord:
    impact: float
    persistence: float
    lesson: float
    source_digest: str = ""

    @property
    def magnitude(self) -> float:
        return self.impact * self.persistence * self.lesson


@dataclass(slots=True)
class ContradictionMemory:
    weights: tuple[float, float, float, float, float] = (0.37, 0.25, 0.18, 0.12, 0.08)
    _values: deque[float] = field(default_factory=lambda: deque(maxlen=5), init=False, repr=False)

    def push(self, value: float) -> None:
        self._values.appendleft(float(value))

    def load(self, values_newest_first: Iterable[float]) -> None:
        self._values.clear()
        for value in reversed(tuple(values_newest_first)[:5]):
            self.push(float(value))

    @property
    def value(self) -> float:
        vals = tuple(self._values)
        if not vals:
            return 0.0
        padded = vals + (0.0,) * (5 - len(vals))
        return ptf_core(padded, self.weights)

    @property
    def history(self) -> tuple[float, ...]:
        return tuple(self._values)
