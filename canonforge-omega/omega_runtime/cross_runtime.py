from __future__ import annotations

from dataclasses import asdict
from hashlib import sha256
import json
import platform
import sys
from typing import Any, Dict

from .advanced_computation import (
    OpticalLayer,
    conservative_diffusion_step,
    conservative_transfer,
    lorentz_boost_event,
    normal_incidence_tmm,
    scalar_wave_fdtd_1d,
    transform_velocity,
)

CROSS_RUNTIME_SCHEMA = "OMEGA_NATIVE_REFERENCE_RECEIPT_R173"
CROSS_RUNTIME_CHALLENGE_SCHEMA = "OMEGA_CROSS_RUNTIME_CHALLENGE_R173"
CROSS_RUNTIME_BOUNDARY = (
    "R173 native receipts prove that an authenticated Sovereign-PC Python runtime executed the declared reference input. "
    "They are DERIVED computation evidence, not empirical observation and not CanonState authority. "
    "Cloud/native agreement is cross-runtime parity for the same mathematical model, not independent solver-family validation. "
    "12/144/1728/20736 remain software address/execution-resolution levels rather than physical dimensions."
)


def _sha_text(value: str) -> str:
    return sha256(value.encode("utf-8")).hexdigest()


def _input(body: Dict[str, Any], snake: str, camel: str | None = None, default: Any = None) -> Any:
    if snake in body:
        return body[snake]
    if camel and camel in body:
        return body[camel]
    return default


def _atlas_index(d: int, p: int, r: int, layer: int) -> int:
    w = lambda x: x % 12
    return (((w(d) * 12 + w(p)) * 12 + w(r)) * 12 + w(layer))


def _atlas_address(index: int) -> tuple[int, int, int, int]:
    if not 0 <= index < 20_736:
        raise ValueError("atlas index must be in 0..20735")
    d, rem = divmod(index, 1728)
    p, rem = divmod(rem, 144)
    r, layer = divmod(rem, 12)
    return d, p, r, layer


def _atlas_neighbors(index: int) -> tuple[int, ...]:
    d, p, r, layer = _atlas_address(index)
    return (
        _atlas_index(d + 1, p, r, layer),
        _atlas_index(d - 1, p, r, layer),
        _atlas_index(d, p + 1, r, layer),
        _atlas_index(d, p - 1, r, layer),
        _atlas_index(d, p, r + 1, layer),
        _atlas_index(d, p, r - 1, layer),
        _atlas_index(d + 6, 11 - p, 11 - r, layer + 6),
    )


def atlas_reference_diffusion(body: Dict[str, Any]) -> Dict[str, Any]:
    node_count = 20_736
    alpha = float(_input(body, "diffusivity", default=0.1))
    dt = float(_input(body, "dt", default=1.0))
    steps = int(_input(body, "steps", default=1))
    top_k = int(_input(body, "top_k", "topK", 24))
    epsilon = float(_input(body, "support_epsilon", "supportEpsilon", 1e-15))
    if alpha < 0 or dt <= 0 or not 1 <= steps <= 12 or not 1 <= top_k <= 256 or epsilon < 0:
        raise ValueError("atlas diffusion requires diffusivity>=0, dt>0, steps 1..12, top_k 1..256, support_epsilon>=0")
    stability = alpha * dt * 7
    if stability > 1 + 1e-15:
        raise ValueError("explicit atlas diffusion requires diffusivity*dt*7 <= 1")
    impulses = body.get("impulses") if isinstance(body.get("impulses"), list) else []
    if not 1 <= len(impulses) <= 2048:
        raise ValueError("impulses must contain 1..2048 entries")

    values = [0.0] * node_count
    for idx, raw in enumerate(impulses):
        if isinstance(raw, (list, tuple)) and len(raw) >= 2:
            address, value = int(raw[0]), float(raw[1])
        elif isinstance(raw, dict):
            address, value = int(raw.get("index", -1)), float(raw.get("value", 0.0))
        else:
            raise ValueError(f"impulses[{idx}] is invalid")
        if not 0 <= address < node_count or value < 0:
            raise ValueError(f"impulses[{idx}] requires index 0..20735 and value >= 0")
        values[address] += value

    invariant_before = sum(values)
    factor = alpha * dt
    step_residuals: list[float] = []
    # Each undirected edge is visited once by source<target, matching the cloud reference topology.
    for _ in range(steps):
        before = sum(values)
        delta = [0.0] * node_count
        edge_count = 0
        for source in range(node_count):
            for target in _atlas_neighbors(source):
                if source < target:
                    edge_count += 1
                    flux = factor * (values[target] - values[source])
                    delta[source] += flux
                    delta[target] -= flux
        if edge_count != 72_576:
            raise RuntimeError(f"atlas topology edge count mismatch: {edge_count}")
        values = [value + delta[i] for i, value in enumerate(values)]
        step_residuals.append(abs(sum(values) - before))

    invariant_after = sum(values)
    minimum = min(values)
    maximum = max(values)
    l2_norm = sum(value * value for value in values) ** 0.5
    support = sum(1 for value in values if value > epsilon)
    entropy = 0.0
    if invariant_after > 0:
        from math import log
        for value in values:
            if value > 0:
                p = value / invariant_after
                entropy -= p * log(p)
        entropy /= log(node_count)
    ranking = sorted(enumerate(values), key=lambda item: (-item[1], item[0]))[:top_k]
    top_states = [
        {"index": index, "address": [x + 1 for x in _atlas_address(index)], "value": value}
        for index, value in ranking
    ]
    return {
        "schema": "OMEGA_ATLAS_REFERENCE_DIFFUSION_R170_PYTHON",
        "nodes": node_count,
        "undirected_edges": 72_576,
        "degree": 7,
        "diffusivity": alpha,
        "dt": dt,
        "stability_number": stability,
        "steps": steps,
        "invariant_before": invariant_before,
        "invariant_after": invariant_after,
        "invariant_absolute_residual": abs(invariant_after - invariant_before),
        "min_value": minimum,
        "max_value": maximum,
        "l2_norm": l2_norm,
        "normalized_entropy": entropy,
        "support_above_epsilon": support,
        "top_states": top_states,
        "step_residuals": step_residuals,
        "evidence_class": "DERIVED",
        "canonical_mutation": False,
    }


def native_reference_result(path: str, body: Dict[str, Any]) -> Dict[str, Any]:
    if path == "/api/compute/relativity/event":
        return asdict(lorentz_boost_event(
            _input(body, "t_seconds", "tSeconds"),
            _input(body, "position_m", "positionM"),
            _input(body, "frame_velocity_m_s", "frameVelocityMS"),
        ))
    if path == "/api/compute/relativity/velocity":
        return asdict(transform_velocity(
            _input(body, "object_velocity_m_s", "objectVelocityMS"),
            _input(body, "frame_velocity_m_s", "frameVelocityMS"),
        ))
    if path == "/api/compute/optics/tmm":
        raw_layers = body.get("layers") if isinstance(body.get("layers"), list) else []
        layers = tuple(OpticalLayer(
            float(layer["n"]),
            float(layer.get("k", 0.0)),
            float(_input(layer, "thickness_nm", "thicknessNm", 0.0)),
        ) for layer in raw_layers)
        return asdict(normal_incidence_tmm(
            _input(body, "wavelength_nm", "wavelengthNm"),
            layers,
            incident_n=float(_input(body, "incident_n", "incidentN", 1.0)),
            substrate_n=float(_input(body, "substrate_n", "substrateN", 1.5)),
        ))
    if path == "/api/compute/continuity/transfer":
        transfers = tuple((int(item.get("from", item.get("source"))), int(item.get("to", item.get("target"))), float(item["amount"])) for item in body.get("transfers", []))
        return asdict(conservative_transfer(body.get("values", []), transfers))
    if path == "/api/compute/continuity/diffusion":
        edges = tuple((int(edge[0]), int(edge[1])) for edge in body.get("edges", []))
        return asdict(conservative_diffusion_step(
            body.get("values", []), edges,
            diffusivity=float(body.get("diffusivity", 0.0)), dt=float(body.get("dt", 0.0)),
        ))
    if path == "/api/compute/wave/fdtd1d":
        return asdict(scalar_wave_fdtd_1d(
            _input(body, "initial_displacement", "initialDisplacement", []),
            initial_velocity=_input(body, "initial_velocity", "initialVelocity", None),
            wave_speed=float(_input(body, "wave_speed", "waveSpeed", 1.0)),
            dx=float(body.get("dx", 1.0)), dt=float(body.get("dt", 0.5)),
            steps=int(body.get("steps", 1)), snapshot_stride=int(_input(body, "snapshot_stride", "snapshotStride", 0)),
        ))
    if path == "/api/compute/atlas/diffusion":
        return atlas_reference_diffusion(body)
    raise ValueError(f"unsupported R173 cross-runtime reference path: {path}")


def native_reference_receipt(path: str, input_canonical_json: str) -> Dict[str, Any]:
    if not isinstance(input_canonical_json, str) or not input_canonical_json:
        raise ValueError("input_canonical_json is required")
    body = json.loads(input_canonical_json)
    if not isinstance(body, dict):
        raise ValueError("cross-runtime input must decode to a JSON object")
    result = native_reference_result(path, body)
    core = {
        "schema": CROSS_RUNTIME_SCHEMA,
        "revision": "R173",
        "path": path,
        "input_sha256": _sha_text(input_canonical_json),
        "result": result,
        "result_sha256": digest_result(result),
        "native_execution": True,
        "implementation": "python.omega_runtime.cross_runtime",
        "runtime": {"python": platform.python_version(), "implementation": platform.python_implementation(), "platform": sys.platform},
        "evidence_class": "DERIVED",
        "canonical_mutation": False,
        "physical_dimension_claim": False,
        "independent_solver_family_claim": False,
        "truth_boundary": CROSS_RUNTIME_BOUNDARY,
    }
    return {**core, "receipt_sha256": digest_result(core)}


def digest_result(value: Any) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return sha256(raw.encode("utf-8")).hexdigest()
