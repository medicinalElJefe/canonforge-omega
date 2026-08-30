from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from .state import StateEnvelope
from .mode188 import GateDecision


@dataclass(frozen=True, slots=True)
class ScenePrimitive:
    kind: str
    source_field: str
    data: dict[str, Any]


@dataclass(frozen=True, slots=True)
class ScenePacket:
    state_digest: str
    evidence_class: str
    primitives: tuple[ScenePrimitive, ...]


def living_glyph_scene(state: StateEnvelope, gate: GateDecision) -> ScenePacket:
    a = state.address
    m = state.metrics
    primitives = (
        ScenePrimitive("core", "state.address", {"domain": a.domain, "phase": a.phase, "regulation": a.regulation, "layer": a.layer}),
        ScenePrimitive("mode188_gate", "metrics", {"ratio": gate.ratio, "dispatch": gate.dispatch.value, "admission": gate.admission.value}),
        ScenePrimitive("continuity", "metrics.continuity", {"value": m.continuity}),
        ScenePrimitive("burden", "metrics.burden", {"value": m.burden}),
        ScenePrimitive("contradiction", "metrics.contradiction", {"value": m.contradiction}),
    )
    return ScenePacket(state.digest, state.evidence_class.value, primitives)
