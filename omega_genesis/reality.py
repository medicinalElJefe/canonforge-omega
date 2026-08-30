from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
from math import cos, log, pi, sin, sqrt
import csv
import io
import json
from statistics import mean
from typing import Any, Iterable

from .calculus import clamp
from .schema import Address20736

MAX_ANALYZED = 720
EPS = 1e-12


@dataclass(frozen=True, slots=True)
class RealityConfig:
    time_column: str
    value_column: str
    time_unit: str = "transition_unit"
    value_unit: str = "source_unit"
    continuity_column: str | None = None
    plasticity_column: str | None = None
    contradiction_column: str | None = None
    burden_column: str | None = None
    evidence_column: str | None = None


def _float(value: Any) -> float:
    if value is None or str(value).strip() == "":
        raise ValueError("missing numeric value")
    x = float(str(value).strip())
    if x != x or x in (float("inf"), float("-inf")):
        raise ValueError("non-finite numeric value")
    return x


def _delimiter(text: str) -> str:
    sample = text[:8192]
    try:
        d = csv.Sniffer().sniff(sample, delimiters=",\t;|").delimiter
        return d
    except csv.Error:
        counts = {d: sample.count(d) for d in (",", "\t", ";", "|")}
        return max(counts, key=counts.get)


def _downsample(rows: list[dict[str, Any]], limit: int = MAX_ANALYZED) -> list[dict[str, Any]]:
    if len(rows) <= limit:
        return rows
    if limit < 2:
        return [rows[0]]
    idx = sorted({round(i * (len(rows) - 1) / (limit - 1)) for i in range(limit)})
    return [rows[i] for i in idx]


def parse_observations(text: str, config: RealityConfig) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    reader = csv.DictReader(io.StringIO(text), delimiter=_delimiter(text))
    if not reader.fieldnames:
        raise ValueError("dataset has no header row")
    required = {config.time_column, config.value_column}
    missing = required - set(reader.fieldnames)
    if missing:
        raise ValueError("missing required columns: " + ", ".join(sorted(missing)))
    rows = []
    for source_index, raw in enumerate(reader, start=2):
        try:
            t = _float(raw.get(config.time_column))
            y = _float(raw.get(config.value_column))
        except ValueError:
            continue
        rows.append({"source_row": source_index, "time": t, "value": y, "raw": raw})
    rows.sort(key=lambda r: (r["time"], r["source_row"]))
    if len(rows) < 5:
        raise ValueError("at least five valid observations are required")
    original = len(rows)
    rows = _downsample(rows)
    return rows, {"original_rows": original, "analyzed_rows": len(rows), "delimiter": reader.dialect.delimiter, "columns": reader.fieldnames}


def _normalize(values: Iterable[float]) -> list[float]:
    vals = list(map(float, values))
    lo, hi = min(vals), max(vals)
    span = hi - lo
    if span <= EPS:
        return [0.5 for _ in vals]
    return [(v - lo) / span for v in vals]


def _derivatives(t: list[float], y: list[float]) -> tuple[list[float], list[float], list[float]]:
    n = len(y)
    v = [0.0] * n
    for i in range(n):
        if i == 0:
            dt = t[1] - t[0]
            v[i] = (y[1] - y[0]) / (dt if abs(dt) > EPS else 1.0)
        elif i == n - 1:
            dt = t[-1] - t[-2]
            v[i] = (y[-1] - y[-2]) / (dt if abs(dt) > EPS else 1.0)
        else:
            dt = t[i + 1] - t[i - 1]
            v[i] = (y[i + 1] - y[i - 1]) / (dt if abs(dt) > EPS else 1.0)
    a = [0.0] * n
    j = [0.0] * n
    for out, src in ((a, v), (j, a)):
        for i in range(n):
            if i == 0:
                dt = t[1] - t[0]
                out[i] = (src[1] - src[0]) / (dt if abs(dt) > EPS else 1.0)
            elif i == n - 1:
                dt = t[-1] - t[-2]
                out[i] = (src[-1] - src[-2]) / (dt if abs(dt) > EPS else 1.0)
            else:
                dt = t[i + 1] - t[i - 1]
                out[i] = (src[i + 1] - src[i - 1]) / (dt if abs(dt) > EPS else 1.0)
    return v, a, j


def _direct_or_derived(rows: list[dict[str, Any]], column: str | None, derived: list[float]) -> tuple[list[float], str]:
    if column and all(str(r["raw"].get(column, "")).strip() != "" for r in rows):
        try:
            return [clamp(_float(r["raw"][column])) for r in rows], "IMPORTED_DIRECT"
        except ValueError:
            pass
    return [clamp(x) for x in derived], "DERIVED_MODEL_SPACE"


def _feature_packet(rows: list[dict[str, Any]], config: RealityConfig) -> tuple[list[dict[str, Any]], dict[str, str]]:
    t = [r["time"] for r in rows]
    y = [r["value"] for r in rows]
    yn = _normalize(y)
    v, a, j = _derivatives(t, y)
    av = [abs(x) for x in v]
    aa = [abs(x) for x in a]
    vnorm = _normalize(av)
    anorm = _normalize(aa)
    # Continuity rewards local smoothness; plasticity follows signed change magnitude;
    # contradiction tracks residual curvature; burden is persistent motion/curvature load.
    c_derived = [1.0 - clamp(anorm[i]) for i in range(len(rows))]
    p_derived = vnorm
    q_derived = anorm
    b_derived = [clamp(0.62 * vnorm[i] + 0.38 * anorm[i]) for i in range(len(rows))]
    e_derived = [1.0] * len(rows)
    c, csrc = _direct_or_derived(rows, config.continuity_column, c_derived)
    p, psrc = _direct_or_derived(rows, config.plasticity_column, p_derived)
    q, qsrc = _direct_or_derived(rows, config.contradiction_column, q_derived)
    b, bsrc = _direct_or_derived(rows, config.burden_column, b_derived)
    e, esrc = _direct_or_derived(rows, config.evidence_column, e_derived)
    out = []
    for i, r in enumerate(rows):
        # Product-grid nearest fingerprint over four address axes.
        address = Address20736(
            max(1, min(12, round(c[i] * 11) + 1)),
            max(1, min(12, round(p[i] * 11) + 1)),
            max(1, min(12, round((1.0 - q[i]) * 11) + 1)),
            max(1, min(12, round(((1.0 - b[i]) * 0.7 + e[i] * 0.3) * 11) + 1)),
        )
        out.append({
            "source_row": r["source_row"], "time": t[i], "value": y[i],
            "velocity": v[i], "acceleration": a[i], "jerk": j[i],
            "continuity": c[i], "plasticity": p[i], "contradiction": q[i], "burden": b[i], "evidence": e[i],
            "state_id": address.state_id, "address": address.as_tuple(),
        })
    return out, {"continuity": csrc, "plasticity": psrc, "contradiction": qsrc, "burden": bsrc, "evidence": esrc}


def _validation(obs: list[dict[str, Any]]) -> dict[str, float | int | bool]:
    errors = []
    feature_errors = []
    hits = 0
    for i in range(2, len(obs)):
        y0, y1, yt = obs[i - 2]["value"], obs[i - 1]["value"], obs[i]["value"]
        pred = y1 + (y1 - y0)
        errors.append((pred - yt) ** 2)
        pv = [obs[i - 1][k] for k in ("continuity", "plasticity", "contradiction", "burden")]
        tv = [obs[i][k] for k in ("continuity", "plasticity", "contradiction", "burden")]
        feature_errors.append(mean(abs(a - b) for a, b in zip(pv, tv)))
        if abs(obs[i]["state_id"] - obs[i - 1]["state_id"]) <= 12 ** 2:
            hits += 1
    rmse = sqrt(mean(errors)) if errors else 0.0
    scale = max(EPS, max(o["value"] for o in obs) - min(o["value"] for o in obs))
    nrmse = rmse / scale
    mfe = mean(feature_errors) if feature_errors else 0.0
    hit_rate = hits / max(1, len(obs) - 2)
    eligible = len(obs) >= 12 and nrmse <= 0.35 and mfe <= 0.35 and hit_rate >= 0.25
    return {"normalized_rmse": nrmse, "mean_feature_error": mfe, "topological_hit_rate": hit_rate, "backtest_points": max(0, len(obs) - 2), "commit_eligible": eligible}


def _analog_forecast(obs: list[dict[str, Any]]) -> dict[str, Any]:
    if len(obs) < 4:
        return {"status": "NO_ANALOG"}
    target = obs[-1]
    keys = ("continuity", "plasticity", "contradiction", "burden")
    candidates = []
    for i in range(1, len(obs) - 1):
        d = sqrt(sum((obs[i][k] - target[k]) ** 2 for k in keys))
        candidates.append((d, i))
    candidates.sort()
    picked = candidates[: min(12, len(candidates))]
    deltas = [obs[i + 1]["value"] - obs[i]["value"] for _, i in picked]
    state_deltas = [obs[i + 1]["state_id"] - obs[i]["state_id"] for _, i in picked]
    deltas_sorted = sorted(deltas)
    def q(frac: float) -> float:
        if not deltas_sorted:
            return 0.0
        pos = frac * (len(deltas_sorted) - 1)
        lo = int(pos); hi = min(len(deltas_sorted) - 1, lo + 1); w = pos - lo
        return deltas_sorted[lo] * (1 - w) + deltas_sorted[hi] * w
    return {
        "status": "PASS", "analogs": len(picked),
        "next_value": target["value"] + mean(deltas),
        "interval_10_90": [target["value"] + q(0.10), target["value"] + q(0.90)],
        "state_delta_mean": mean(state_deltas) if state_deltas else 0.0,
        "evidence_class": "FORECAST",
    }


def _spectrum(values: list[float]) -> dict[str, Any]:
    n = len(values)
    if n < 8:
        return {"status": "INSUFFICIENT_DATA"}
    centered = [v - mean(values) for v in values]
    powers = []
    for k in range(1, n // 2 + 1):
        re = sum(centered[i] * cos(2 * pi * k * i / n) for i in range(n))
        im = -sum(centered[i] * sin(2 * pi * k * i / n) for i in range(n))
        powers.append((k, re * re + im * im))
    total = sum(p for _, p in powers) or 1.0
    probs = [p / total for _, p in powers if p > 0]
    entropy = -sum(p * log(p + EPS) for p in probs) / max(EPS, log(len(probs) or 1))
    k, power = max(powers, key=lambda x: x[1])
    return {"status": "PASS", "dominant_period_samples": n / k if k else None, "spectral_entropy": clamp(entropy), "dominant_power_fraction": power / total}


def analyze_delimited(text: str, config: RealityConfig) -> dict[str, Any]:
    rows, meta = parse_observations(text, config)
    observations, channel_sources = _feature_packet(rows, config)
    cfg = asdict(config)
    data_hash = sha256(text.encode("utf-8")).hexdigest()
    config_hash = sha256(json.dumps(cfg, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
    validation = _validation(observations)
    result = {
        "schema": "OMEGA_REALITY_LAB_V1",
        "data_hash": data_hash,
        "configuration_hash": config_hash,
        "configuration": cfg,
        "meta": meta,
        "channel_sources": channel_sources,
        "observations": observations,
        "validation": validation,
        "forecast": _analog_forecast(observations),
        "spectrum": _spectrum([o["value"] for o in observations]),
        "commit_gate": {
            "eligible": bool(validation["commit_eligible"]),
            "requires_second_confirmation": True,
            "canonical_mutation_performed": False,
        },
        "truth_boundary": "Imported values/timestamps/units are source data. Derived CΩ/Φ/q/Λ, atlas addresses, validation and forecasts are model-space transformations unless explicitly mapped from imported columns.",
    }
    result["analysis_fingerprint"] = sha256(json.dumps(result, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")).hexdigest()
    return result
