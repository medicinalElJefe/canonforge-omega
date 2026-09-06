from __future__ import annotations

from dataclasses import dataclass, asdict
from functools import lru_cache
from hashlib import sha256
import json
from math import isfinite, log
from typing import Iterable

ATLAS_NODE_COUNT = 20_736
ATLAS_DEGREE = 7
ATLAS_EDGE_COUNT = 72_576
ATLAS_DIFFUSION_SCHEMA = "OMEGA_ATLAS_REFERENCE_DIFFUSION_R170"
ATLAS_BOUNDARY = (
    "The 20,736-node graph is the transparent OMEGA reference topology: six cyclic D/P/R shell neighbors "
    "at fixed layer plus the recovered full-sphere antipode. It is a derived software topology, not a claim "
    "of 20,736 physical dimensions and not a byte-identical reconstruction of any unavailable donor edge list."
)


def _address0(index: int) -> tuple[int, int, int, int]:
    if not 0 <= index < ATLAS_NODE_COUNT:
        raise ValueError("index must be in 0..20735")
    d, rem = divmod(index, 12 ** 3)
    p, rem = divmod(rem, 12 ** 2)
    r, l = divmod(rem, 12)
    return d, p, r, l


def _index0(d: int, p: int, r: int, l: int) -> int:
    return (((d % 12) * 12 + (p % 12)) * 12 + (r % 12)) * 12 + (l % 12)


def atlas_neighbors(index: int) -> tuple[int, ...]:
    d, p, r, l = _address0(index)
    return (
        _index0(d + 1, p, r, l),
        _index0(d - 1, p, r, l),
        _index0(d, p + 1, r, l),
        _index0(d, p - 1, r, l),
        _index0(d, p, r + 1, l),
        _index0(d, p, r - 1, l),
        _index0(d + 6, 11 - p, 11 - r, l + 6),
    )


@lru_cache(maxsize=1)
def atlas_reference_edges() -> tuple[tuple[int, int], ...]:
    edges: list[tuple[int, int]] = []
    for source in range(ATLAS_NODE_COUNT):
        for target in atlas_neighbors(source):
            if source < target:
                edges.append((source, target))
    result = tuple(edges)
    if len(result) != ATLAS_EDGE_COUNT:
        raise ArithmeticError(f"reference edge count mismatch: {len(result)} != {ATLAS_EDGE_COUNT}")
    return result


def _finite(value: float, name: str) -> float:
    value = float(value)
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
    return value


def _digest(value: object) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return sha256(raw.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class AtlasImpulse:
    index: int
    value: float

    def __post_init__(self) -> None:
        if not 0 <= int(self.index) < ATLAS_NODE_COUNT:
            raise ValueError("impulse index must be in 0..20735")
        if _finite(self.value, "impulse value") < 0:
            raise ValueError("impulse value must be >= 0")


@dataclass(frozen=True, slots=True)
class AtlasDiffusionResult:
    schema: str
    nodes: int
    undirected_edges: int
    degree: int
    diffusivity: float
    dt: float
    stability_number: float
    steps: int
    invariant_before: float
    invariant_after: float
    invariant_absolute_residual: float
    min_value: float
    max_value: float
    l2_norm: float
    normalized_entropy: float
    support_above_epsilon: int
    top_states: tuple[dict, ...]
    step_residuals: tuple[float, ...]
    boundary: str
    evidence_class: str = "DERIVED"
    canonical_mutation: bool = False

    @property
    def receipt_sha256(self) -> str:
        return _digest(asdict(self))


def atlas_reference_diffusion(
    impulses: Iterable[AtlasImpulse | tuple[int, float]],
    *,
    diffusivity: float = 0.1,
    dt: float = 1.0,
    steps: int = 1,
    top_k: int = 24,
    support_epsilon: float = 1e-15,
) -> AtlasDiffusionResult:
    """Diffuse a non-negative scalar field over the full 20,736-state reference graph.

    Pairwise antisymmetric flux is accumulated over each unique undirected edge, so
    total scalar mass is conserved to floating-point precision. The explicit update
    enforces alpha*dt*degree <= 1, sufficient here to preserve non-negativity.
    """
    alpha = _finite(diffusivity, "diffusivity")
    h = _finite(dt, "dt")
    eps = _finite(support_epsilon, "support_epsilon")
    steps = int(steps)
    top_k = int(top_k)
    if alpha < 0 or h <= 0 or not 1 <= steps <= 96 or not 1 <= top_k <= 256 or eps < 0:
        raise ValueError("require diffusivity>=0, dt>0, steps 1..96, top_k 1..256, support_epsilon>=0")
    stability = alpha * h * ATLAS_DEGREE
    if stability > 1.0 + 1e-15:
        raise ValueError("explicit atlas diffusion requires diffusivity*dt*7 <= 1")

    values = [0.0] * ATLAS_NODE_COUNT
    count = 0
    for raw in impulses:
        impulse = raw if isinstance(raw, AtlasImpulse) else AtlasImpulse(int(raw[0]), float(raw[1]))
        values[impulse.index] += impulse.value
        count += 1
        if count > 2048:
            raise ValueError("at most 2048 impulses are allowed")
    if count == 0:
        raise ValueError("at least one impulse is required")

    invariant_before = sum(values)
    factor = alpha * h
    step_residuals: list[float] = []
    edges = atlas_reference_edges()
    for _ in range(steps):
        before = sum(values)
        delta = [0.0] * ATLAS_NODE_COUNT
        for a, b in edges:
            flux = factor * (values[b] - values[a])
            delta[a] += flux
            delta[b] -= flux
        values = [values[i] + delta[i] for i in range(ATLAS_NODE_COUNT)]
        after = sum(values)
        step_residuals.append(abs(after - before))

    invariant_after = sum(values)
    maximum = max(values)
    minimum = min(values)
    l2 = sum(v * v for v in values) ** 0.5
    support = sum(1 for v in values if v > eps)
    if invariant_after > 0:
        entropy = -sum((v / invariant_after) * log(v / invariant_after) for v in values if v > 0)
        normalized_entropy = entropy / log(ATLAS_NODE_COUNT)
    else:
        normalized_entropy = 0.0
    top = sorted(enumerate(values), key=lambda item: (-item[1], item[0]))[:top_k]
    top_states = tuple(
        {
            "index": index,
            "address": tuple(x + 1 for x in _address0(index)),
            "value": value,
        }
        for index, value in top
    )
    return AtlasDiffusionResult(
        schema=ATLAS_DIFFUSION_SCHEMA,
        nodes=ATLAS_NODE_COUNT,
        undirected_edges=len(edges),
        degree=ATLAS_DEGREE,
        diffusivity=alpha,
        dt=h,
        stability_number=stability,
        steps=steps,
        invariant_before=invariant_before,
        invariant_after=invariant_after,
        invariant_absolute_residual=abs(invariant_after - invariant_before),
        min_value=minimum,
        max_value=maximum,
        l2_norm=l2,
        normalized_entropy=normalized_entropy,
        support_above_epsilon=support,
        top_states=top_states,
        step_residuals=tuple(step_residuals),
        boundary=ATLAS_BOUNDARY,
    )


def atlas_topology_manifest() -> dict:
    edges = atlas_reference_edges()
    return {
        "schema": "OMEGA_ATLAS_REFERENCE_TOPOLOGY_R170",
        "nodes": ATLAS_NODE_COUNT,
        "undirected_edges": len(edges),
        "directed_neighbor_relations": ATLAS_NODE_COUNT * ATLAS_DEGREE,
        "degree": ATLAS_DEGREE,
        "shell_neighbors": 6,
        "antipode_neighbors": 1,
        "physical_dimension_claim": False,
        "boundary": ATLAS_BOUNDARY,
        "topology_sha256": _digest(edges),
    }
