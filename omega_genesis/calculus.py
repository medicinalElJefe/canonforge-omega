from __future__ import annotations
from dataclasses import dataclass, asdict
from math import pi
from typing import Iterable, Sequence
EPS = 1e-12
def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float: return max(lo, min(hi, float(value)))
def stability_ratio(continuity: float, burden: float, contradiction: float) -> float:
    denominator = burden + contradiction + burden * contradiction
    if denominator <= 0: return float("inf") if continuity > 0 else 0.0
    return continuity / denominator
@dataclass(frozen=True, slots=True)
class GateDecision:
    ratio: float; dispatch: str; admission: str; reason: str
def mode188_gate(continuity: float, burden: float, contradiction: float, *, low: float = 0.95, high: float = 1.05) -> GateDecision:
    ratio = stability_ratio(continuity, burden, contradiction)
    if ratio > high: return GateDecision(ratio, "STAY", "ACCEPT", "continuity exceeds combined burden and contradiction")
    if ratio >= low: return GateDecision(ratio, "TURN", "CONDITIONAL", "state is inside the calibrated turn band")
    return GateDecision(ratio, "ESCALATE", "PRUNE", "combined burden and contradiction exceed current continuity capacity")
def dewey_balance(burden: float) -> float: return 1.0 - clamp(burden)
@dataclass(frozen=True, slots=True)
class RSCResult:
    capacity: float; load: float; margin: float; continuity_ratio: float; plasticity_ratio: float; burden_ratio: float; contradiction_ratio: float
def relational_skin_calculus(continuity: float, plasticity: float, burden: float, contradiction: float, stability: float, evidence: float = 1.0, scar: float = 0.0) -> RSCResult:
    c, p, b, q, s, e, scar = map(clamp, (continuity, plasticity, burden, contradiction, stability, evidence, scar))
    capacity = c + 0.72 * p + 0.58 * s + 0.42 * e + 0.18 * scar
    load = b + q + b * q + 0.25 * scar * q
    total = capacity + load + EPS
    return RSCResult(capacity, load, capacity - load, c / total, p / total, b / total, q / total)
def deep_mother_lens(continuity: float, plasticity: float, stability: float, evidence: float, burden: float, contradiction: float) -> float:
    preservation = 0.34 * clamp(continuity) + 0.26 * clamp(plasticity) + 0.22 * clamp(stability) + 0.18 * clamp(evidence)
    pressure = 0.58 * clamp(burden) + 0.42 * clamp(contradiction)
    return clamp(0.5 + 0.5 * (preservation - pressure))
def high_father_lens(stability: float, evidence: float, contradiction: float, burden: float) -> float:
    structure = 0.55 * clamp(stability) + 0.45 * clamp(evidence)
    violation = 0.62 * clamp(contradiction) + 0.38 * clamp(burden)
    return clamp(0.5 + 0.5 * (structure - violation))
def deep_thought_lens(continuity: float, stability: float, evidence: float, contradiction: float) -> float:
    vals = [clamp(continuity), clamp(stability), clamp(evidence), clamp(1.0 - contradiction)]
    if any(v <= 0 for v in vals): return 0.0
    return len(vals) / sum(1.0 / v for v in vals)
def shortest_arc_phase(start: float, target: float, progress: float, period: float = 12.0) -> float:
    if period <= 0: raise ValueError("period must be positive")
    t = clamp(progress); a = (float(start) - 1.0) % period; b = (float(target) - 1.0) % period
    delta = (b - a + period / 2.0) % period - period / 2.0
    return ((a + delta * t) % period) + 1.0
def quantize_heading(radians: float) -> float:
    step = pi / 36.0
    return round(float(radians) / step) * step
def form_value(radius: float) -> float:
    r = max(0.0, float(radius)); return pi * r ** 4
def opposite_pair_axes(amplitudes: Sequence[float]) -> tuple[float, float, float]:
    if len(amplitudes) != 6: raise ValueError("1+6 shell requires six neighbor amplitudes")
    a = list(map(float, amplitudes)); return (a[0] - a[3], a[1] - a[4], a[2] - a[5])
def simplex_from_axes(axes: Sequence[float]) -> tuple[float, float, float]:
    if len(axes) != 3: raise ValueError("simplex reduction requires three axes")
    mags = [abs(float(v)) for v in axes]; total = sum(mags)
    return (1/3, 1/3, 1/3) if total <= EPS else tuple(v / total for v in mags)
def central_derivatives(samples: Sequence[float], dt: float = 1.0) -> dict[str, float]:
    if len(samples) < 5: raise ValueError("at least five samples are required for central velocity/acceleration/jerk")
    if dt <= 0: raise ValueError("dt must be positive")
    x = list(map(float, samples[-5:]))
    return {"velocity": (x[3]-x[1])/(2*dt), "acceleration": (x[3]-2*x[2]+x[1])/(dt**2), "jerk": (x[4]-2*x[3]+2*x[1]-x[0])/(2*dt**3)}
def weighted_geometric_mean(values: Iterable[tuple[float, float]]) -> float:
    pairs = [(clamp(v), max(0.0, float(w))) for v, w in values]; total_w = sum(w for _, w in pairs)
    if total_w <= EPS or any(v <= 0 and w > 0 for v, w in pairs): return 0.0
    from math import exp, log
    return exp(sum(w * log(v) for v, w in pairs) / total_w)
def calculus_snapshot(metrics) -> dict[str, object]:
    gate = mode188_gate(metrics.continuity, metrics.burden, metrics.contradiction)
    rsc = relational_skin_calculus(metrics.continuity, metrics.future_plasticity, metrics.burden, metrics.contradiction, metrics.stability, metrics.evidence_strength, metrics.scar)
    return {
        "mode188": asdict(gate),
        "dewey_balance": dewey_balance(metrics.burden),
        "rsc": asdict(rsc),
        "deep_mother": deep_mother_lens(metrics.continuity, metrics.future_plasticity, metrics.stability, metrics.evidence_strength, metrics.burden, metrics.contradiction),
        "high_father": high_father_lens(metrics.stability, metrics.evidence_strength, metrics.contradiction, metrics.burden),
        "deep_thought": deep_thought_lens(metrics.continuity, metrics.stability, metrics.evidence_strength, metrics.contradiction),
        "water": clamp((metrics.continuity * (metrics.future_plasticity + EPS)) / (1.0 + metrics.burden + metrics.contradiction)),
    }
