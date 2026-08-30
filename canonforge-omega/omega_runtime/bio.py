from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class BioScale(str, Enum):
    ORGANISM = "organism"
    ORGAN = "organ"
    TISSUE = "tissue"
    CELL = "cell"
    ORGANELLE = "organelle"
    MOLECULE = "molecule"
    ATOM = "atom"


ORDER = tuple(BioScale)


@dataclass(frozen=True, slots=True)
class BioNode:
    scale: BioScale
    label: str
    source_id: str
    evidence_class: str
    units: str | None = None
    value: float | None = None
    parent_label: str | None = None

    def validate(self) -> "BioNode":
        if not self.label.strip() or not self.source_id.strip():
            raise ValueError("biological nodes require label and source_id")
        if self.value is not None and not self.units:
            raise ValueError("numeric biological values require explicit units")
        return self


def can_descend(parent: BioScale, child: BioScale) -> bool:
    return ORDER.index(child) == ORDER.index(parent) + 1


def validate_chain(nodes: list[BioNode]) -> dict[str, object]:
    if not nodes:
        raise ValueError("biological traversal chain cannot be empty")
    for node in nodes:
        node.validate()
    violations: list[str] = []
    for a, b in zip(nodes, nodes[1:]):
        if not can_descend(a.scale, b.scale):
            violations.append(f"{a.scale.value}->{b.scale.value}")
        if b.parent_label != a.label:
            violations.append(f"parent:{b.label}")
    return {
        "valid": not violations,
        "depth": len(nodes),
        "path": [n.scale.value for n in nodes],
        "violations": violations,
        "evidence_boundary": "structural traversal only; no diagnosis, efficacy claim, or biological inference is generated from geometry alone",
    }
