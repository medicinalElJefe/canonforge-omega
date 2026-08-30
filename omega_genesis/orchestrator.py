from __future__ import annotations

from typing import Any

from .calculus import clamp
from .modes import catalog, evaluate


def evaluate_all(packet) -> dict[str, Any]:
    """Evaluate every registered mode against one immutable canonical packet."""
    results: dict[str, Any] = {}
    boundary_only: list[str] = []
    unknown: list[str] = []
    for spec in catalog():
        mode_id = spec["id"]
        result = evaluate(mode_id, packet)
        results[mode_id] = result
        if result.get("status") == "BOUNDARY_ONLY":
            boundary_only.append(mode_id)
        if result.get("status") == "UNKNOWN_MODE":
            unknown.append(mode_id)
    m = packet.metrics
    coherence = clamp(0.30*m.continuity + 0.22*m.stability + 0.18*m.evidence_strength + 0.15*m.future_plasticity + 0.15*(1-m.contradiction) - 0.18*m.burden)
    pressure = clamp(0.46*m.burden + 0.38*m.contradiction + 0.16*m.scar)
    return {
        "canonical_digest": packet.digest,
        "state_id": packet.address.state_id,
        "registered": len(results),
        "evaluated": len(results) - len(boundary_only),
        "boundary_only": boundary_only,
        "unknown": unknown,
        "mutation_authority": "OmegaRuntime only",
        "summary": {
            "coherence": coherence,
            "pressure": pressure,
            "dispatch": results["MODE188"]["dispatch"],
            "admission": results["MODE188"]["admission"],
            "evidence_class": packet.evidence_class.value,
        },
        "results": results,
    }
