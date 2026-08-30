from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
from typing import Any, Iterable

from ..schema import EvidenceClass, evidence_rank

SCALES = (
    "NUCLEAR",
    "ATOMIC",
    "CHEMICAL",
    "BIOLOGICAL",
    "HUMAN_MATERIAL",
    "PLANETARY",
    "STELLAR",
    "GALACTIC",
)


@dataclass(frozen=True, slots=True)
class BioNode:
    node_id: str
    scale: str
    evidence_class: EvidenceClass
    properties: dict[str, Any]

    def __post_init__(self) -> None:
        if not str(self.node_id).strip():
            raise ValueError("node_id is required")
        if self.scale.upper() not in SCALES:
            raise ValueError(f"scale must be one of {SCALES}")


@dataclass(frozen=True, slots=True)
class BioRelation:
    source: str
    target: str
    relation: str = "RELATED"


def analyze_network(nodes: Iterable[BioNode], relations: Iterable[BioRelation]) -> dict[str, Any]:
    """Analyze a supplied source-bound network without inventing biological observations."""
    node_list = list(nodes)
    edge_list = list(relations)
    ids = {n.node_id for n in node_list}
    if len(ids) != len(node_list):
        raise ValueError("node ids must be unique")
    for edge in edge_list:
        if edge.source not in ids or edge.target not in ids:
            raise ValueError("every relation endpoint must reference a supplied node")

    adjacency = {node_id: set() for node_id in ids}
    for edge in edge_list:
        adjacency[edge.source].add(edge.target)
        adjacency[edge.target].add(edge.source)

    components = []
    unseen = set(ids)
    while unseen:
        root = next(iter(unseen))
        stack = [root]
        group = set()
        while stack:
            current = stack.pop()
            if current in group:
                continue
            group.add(current)
            unseen.discard(current)
            stack.extend(adjacency[current] - group)
        components.append(sorted(group))

    evidence_floor = min((evidence_rank(n.evidence_class) for n in node_list), default=0)
    scales = sorted({n.scale.upper() for n in node_list}, key=lambda x: SCALES.index(x))
    degrees = {k: len(v) for k, v in adjacency.items()}
    possible = len(node_list) * (len(node_list) - 1) / 2
    payload = {
        "nodes": len(node_list),
        "relations": len(edge_list),
        "components": len(components),
        "component_members": components,
        "degrees": degrees,
        "density": (len(edge_list) / possible) if possible else 0.0,
        "scales": scales,
        "evidence_floor_rank": evidence_floor,
    }
    fingerprint = sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {
        **payload,
        "fingerprint": fingerprint,
        "evidence_class": "DERIVED",
        "boundary": "structural analysis of supplied nodes/relations only; no diagnosis, microscopy, DNA measurement, or unseen biological evidence is inferred",
    }


def from_dicts(nodes: list[dict[str, Any]], relations: list[dict[str, Any]]) -> dict[str, Any]:
    parsed_nodes = [
        BioNode(
            str(row["node_id"]),
            str(row["scale"]).upper(),
            EvidenceClass(row.get("evidence_class", "USER_ASSERTED")),
            dict(row.get("properties") or {}),
        )
        for row in nodes
    ]
    parsed_edges = [
        BioRelation(str(row["source"]), str(row["target"]), str(row.get("relation", "RELATED")))
        for row in relations
    ]
    return analyze_network(parsed_nodes, parsed_edges)
