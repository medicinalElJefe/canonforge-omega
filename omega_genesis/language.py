from __future__ import annotations

from typing import Any

from .calculus import calculus_snapshot
from .schema import CanonicalPacket


def decode_packet(packet: CanonicalPacket) -> dict[str, Any]:
    """Deterministic human-readable decode of one canonical packet."""
    calc = calculus_snapshot(packet.metrics)
    dispatch = calc["mode188"].dispatch
    address = packet.address
    statements = [
        f"Canonical state {address.state_id} resolves to domain {address.domain}, phase {address.phase}, regulation {address.regulation}, lens {address.lens}.",
        f"Evidence class is {packet.evidence_class.value}; this label is preserved through derived views.",
        f"Mode 188 dispatch is {dispatch} with admission {calc['mode188'].admission}.",
        f"Continuity CΩ={packet.metrics.continuity:.4f}, future plasticity Φ={packet.metrics.future_plasticity:.4f}, burden Λ={packet.metrics.burden:.4f}, contradiction q={packet.metrics.contradiction:.4f}, stability S={packet.metrics.stability:.4f}.",
        f"RSC margin is {calc['rsc'].margin:.4f}; Deep Mother={calc['deep_mother']:.4f}; High Father={calc['high_father']:.4f}; Deep Thought={calc['deep_thought']:.4f}.",
    ]
    return {
        "canonical_digest": packet.digest,
        "state_id": address.state_id,
        "statements": statements,
        "tokens": {
            "CΩ": packet.metrics.continuity,
            "Φ": packet.metrics.future_plasticity,
            "Λ": packet.metrics.burden,
            "q": packet.metrics.contradiction,
            "S": packet.metrics.stability,
            "dispatch": dispatch,
        },
        "evidence_class": "DERIVED",
        "boundary": "deterministic packet decoding; no external-language-model claim, hidden evidence, or semantic promotion",
    }
