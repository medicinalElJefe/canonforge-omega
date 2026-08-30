from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Generic, TypeVar

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class TranslationOperator:
    source_domain: str
    target_domain: str
    attenuation: float
    phase_landing: float
    ledger_cost: float
    pattern_retention: float

    def __post_init__(self) -> None:
        if not 0 <= self.attenuation <= 1:
            raise ValueError("attenuation must be in [0,1]")
        if not 0 <= self.pattern_retention <= 1:
            raise ValueError("pattern_retention must be in [0,1]")
        if self.ledger_cost < 0:
            raise ValueError("ledger_cost must be >= 0")


@dataclass(frozen=True, slots=True)
class TranslationResult(Generic[T]):
    admitted: bool
    value: T | None
    attenuation: float
    phase_landing: float
    ledger_cost: float
    pattern_retention: float
    source_domain: str
    target_domain: str
    reason: str


def apply_translation(
    operator: TranslationOperator,
    value: T,
    *,
    filter_fn: Callable[[T], bool],
    transform_fn: Callable[[T, float, float], T],
) -> TranslationResult[T]:
    """Apply α -> W -> φ -> Δl -> ρ as an explicit translation contract.

    Filtering and domain-specific transformation remain supplied functions so
    translation does not invent a universal physical mechanism.
    """
    if not filter_fn(value):
        return TranslationResult(False, None, operator.attenuation, operator.phase_landing,
                                 operator.ledger_cost, operator.pattern_retention,
                                 operator.source_domain, operator.target_domain, "filtered_by_admissibility")
    translated = transform_fn(value, operator.attenuation, operator.phase_landing)
    return TranslationResult(True, translated, operator.attenuation, operator.phase_landing,
                             operator.ledger_cost, operator.pattern_retention,
                             operator.source_domain, operator.target_domain, "admitted")
