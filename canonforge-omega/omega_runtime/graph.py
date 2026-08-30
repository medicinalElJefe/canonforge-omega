from __future__ import annotations

from dataclasses import dataclass
from typing import Iterator

from .state import Address20736


@dataclass(frozen=True, slots=True)
class GraphEdge:
    source: int
    target: int
    kind: str


@dataclass(frozen=True, slots=True)
class GraphSummary:
    node_count: int
    directed_edge_count: int
    shell_edges_per_node: int
    antipode_edges_per_node: int
    topology_boundary: str


def _wrap12(value: int) -> int:
    return ((value - 1) % 12) + 1


def shell_neighbors(address: Address20736) -> tuple[Address20736, ...]:
    """Reference six-neighbor shell on D/P/R while preserving layer.

    This is a transparent derived lattice realization of the recovered 1+6
    shell grammar. It is not claimed to be identical to every historical donor
    graph. Imported edge lists remain authoritative for their own datasets.
    """
    d, p, r, l = address.as_tuple()
    return (
        Address20736(_wrap12(d + 1), p, r, l),
        Address20736(_wrap12(d - 1), p, r, l),
        Address20736(d, _wrap12(p + 1), r, l),
        Address20736(d, _wrap12(p - 1), r, l),
        Address20736(d, p, _wrap12(r + 1), l),
        Address20736(d, p, _wrap12(r - 1), l),
    )


def antipode(address: Address20736) -> Address20736:
    """Recovered RH/FULL-SPHERE antipode rule A(S)=S(D⊕6,13-P,13-R,L⊕6)."""
    d, p, r, l = address.as_tuple()
    return Address20736(_wrap12(d + 6), 13 - p, 13 - r, _wrap12(l + 6))


def outgoing_edges(address: Address20736) -> tuple[GraphEdge, ...]:
    src = address.index
    shell = tuple(GraphEdge(src, n.index, "shell_1_plus_6") for n in shell_neighbors(address))
    return shell + (GraphEdge(src, antipode(address).index, "antipode_state"),)


def iter_reference_edges() -> Iterator[GraphEdge]:
    for index in range(20736):
        yield from outgoing_edges(Address20736.from_index(index))


def reference_graph_summary() -> GraphSummary:
    # 20,736 nodes × (6 local shell edges + 1 antipode edge) = 145,152 directed edges.
    return GraphSummary(
        node_count=20736,
        directed_edge_count=20736 * 7,
        shell_edges_per_node=6,
        antipode_edges_per_node=1,
        topology_boundary=(
            "Derived reference graph: six D/P/R cyclic shell neighbors plus the recovered RH antipode rule. "
            "This exactly yields 145,152 directed edges, matching the verified Total Control frame count, "
            "but is not asserted to reproduce an unavailable donor edge list byte-for-byte."
        ),
    )
