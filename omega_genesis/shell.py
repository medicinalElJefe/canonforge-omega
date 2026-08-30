from __future__ import annotations

from .calculus import mode188_gate
from .schema import Address20736, CanonicalPacket

AXES = (
    ("phase-", 0, -1, 0, 0),
    ("phase+", 0, 1, 0, 0),
    ("regulation-", 0, 0, -1, 0),
    ("regulation+", 0, 0, 1, 0),
    ("lens-", 0, 0, 0, -1),
    ("lens+", 0, 0, 0, 1),
)


def _wrap(value: int) -> int:
    return ((value - 1) % 12) + 1


def move(address: Address20736, delta: tuple[int, int, int, int]) -> Address20736:
    values = address.as_tuple()
    return Address20736(*(_wrap(v + d) for v, d in zip(values, delta)))


def shell_1_plus_6(address: Address20736) -> dict[str, object]:
    neighbors = []
    for name, dd, dp, dr, dl in AXES:
        target = move(address, (dd, dp, dr, dl))
        neighbors.append(
            {
                "axis": name,
                "state_id": target.state_id,
                "address": target.as_tuple(),
                "reverse_axis": name[:-1] + ("+" if name.endswith("-") else "-"),
            }
        )
    return {
        "center": {"state_id": address.state_id, "address": address.as_tuple()},
        "neighbors": neighbors,
        "count": 7,
        "topology": "1+6 local reversible shell",
    }


def route_packet(packet: CanonicalPacket) -> dict[str, object]:
    gate = mode188_gate(packet.metrics.continuity, packet.metrics.burden, packet.metrics.contradiction)
    shell = shell_1_plus_6(packet.address)
    return {
        **shell,
        "dispatch": gate.dispatch,
        "admission": gate.admission,
        "ratio": gate.ratio,
        "canonical_digest": packet.digest,
        "mutation": False,
        "rule": "candidate topology only; OmegaRuntime retains commit authority",
    }
