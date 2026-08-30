from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import isfinite
from typing import Sequence


class Dispatch(str, Enum):
    STAY = "STAY"
    TURN = "TURN"
    ESCALATE = "ESCALATE"


class Admission(str, Enum):
    ACCEPT = "ACCEPT"
    CONDITIONAL = "CONDITIONAL"
    PRUNE = "PRUNE"


@dataclass(frozen=True, slots=True)
class GateDecision:
    ratio: float
    dispatch: Dispatch
    admission: Admission
    reason: str


@dataclass(frozen=True, slots=True)
class OperatorDecision:
    construct_011: float
    prune_01m1: float
    integrated_omega: float
    selected: str
    rejected: tuple[str, ...]


def stability_ratio(continuity: float, burden: float, contradiction: float) -> float:
    denominator = burden + contradiction + burden * contradiction
    if denominator <= 0:
        return float("inf") if continuity > 0 else 0.0
    return continuity / denominator


def gate(continuity: float, burden: float, contradiction: float, *, low: float = 0.95, high: float = 1.05) -> GateDecision:
    s = stability_ratio(continuity, burden, contradiction)
    if s > high:
        return GateDecision(s, Dispatch.STAY, Admission.ACCEPT, "continuity exceeds combined load/contradiction")
    if s >= low:
        return GateDecision(s, Dispatch.TURN, Admission.CONDITIONAL, "state is inside the calibrated turn band")
    return GateDecision(s, Dispatch.ESCALATE, Admission.PRUNE, "combined load/contradiction exceeds current continuity capacity")


def operator_decision(construct_score: float, prune_score: float, turn_bias: float = 0.0) -> OperatorDecision:
    values = (construct_score, prune_score, turn_bias)
    if not all(isfinite(v) for v in values):
        raise ValueError("operator scores must be finite")
    integrated = construct_score - prune_score + turn_bias
    if integrated > 0:
        selected, rejected = "011_CONSTRUCT", ("01-1_PRUNE",)
    elif integrated < 0:
        selected, rejected = "01-1_PRUNE", ("011_CONSTRUCT",)
    else:
        selected, rejected = "OMEGA_HOLD", ("011_CONSTRUCT", "01-1_PRUNE")
    return OperatorDecision(construct_score, prune_score, integrated, selected, rejected)


def opposite_pair_axes(amplitudes: Sequence[float]) -> tuple[float, float, float]:
    if len(amplitudes) != 6:
        raise ValueError("1+6 shell requires six neighbor amplitudes")
    a0, a1, a2, a3, a4, a5 = map(float, amplitudes)
    return (a0 - a3, a1 - a4, a2 - a5)


def simplex_from_axes(axes: Sequence[float]) -> tuple[float, float, float]:
    if len(axes) != 3:
        raise ValueError("simplex reduction requires three axes")
    mags = [abs(float(v)) for v in axes]
    total = sum(mags)
    if total == 0:
        return (1 / 3, 1 / 3, 1 / 3)
    return tuple(v / total for v in mags)  # type: ignore[return-value]
