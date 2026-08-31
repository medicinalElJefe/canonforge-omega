from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence
import json
import time


class Disposition(str, Enum):
    KEEP = "KEEP"
    BIND = "BIND"
    REIMPLEMENT = "REIMPLEMENT"
    PRUNE = "PRUNE"
    QUARANTINE = "QUARANTINE"


class EvidenceState(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIAL = "PARTIAL"
    UNKNOWN = "UNKNOWN"
    REJECTED = "REJECTED"


@dataclass(frozen=True)
class CapabilitySignal:
    capability: str
    patterns: tuple[str, ...]
    weight: float = 1.0


CAPABILITY_SIGNALS: tuple[CapabilitySignal, ...] = (
    CapabilitySignal("state", ("state", "canonical", "store", "packet"), 1.20),
    CapabilitySignal("intelligence", ("assistant", "route", "intent", "reason", "forecast"), 1.15),
    CapabilitySignal("memory", ("memory", "ledger", "history", "checkpoint", "replay"), 1.10),
    CapabilitySignal("relation", ("relation", "graph", "topology", "skin", "continuity"), 1.20),
    CapabilitySignal("computation", ("calculus", "mode188", "kernel", "engine", "solver"), 1.25),
    CapabilitySignal("action", ("executor", "hybrid", "agent", "launcher", "macro"), 1.15),
    CapabilitySignal("observation", ("earth", "source", "sensor", "atlas", "catalog"), 1.10),
    CapabilitySignal("proof", ("proof", "evidence", "verify", "test", "rollback"), 1.30),
    CapabilitySignal("visual_runtime", ("render", "canvas", "visual", "glyph", "scene"), 1.10),
    CapabilitySignal("portability", ("install", "windows", "desktop", "cloudflare", "docker"), 0.95),
)


@dataclass
class DonorArtifact:
    donor: str
    path: str
    digest: str
    size: int = 0
    source_kind: str = "repository"
    evidence: EvidenceState = EvidenceState.UNKNOWN
    capabilities: Dict[str, float] = field(default_factory=dict)
    contradictions: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


@dataclass
class CandidateScore:
    candidate: str
    correctness: float
    recovered_capability: float
    usability: float
    performance: float
    portability: float
    proof_strength: float
    regression_risk: float
    contradiction_burden: float

    @property
    def utility(self) -> float:
        gains = (
            self.correctness * 1.40
            + self.recovered_capability * 1.25
            + self.usability * 1.15
            + self.performance * 0.90
            + self.portability * 0.85
            + self.proof_strength * 1.45
        )
        penalties = self.regression_risk * 1.55 + self.contradiction_burden * 1.35
        return round(gains - penalties, 6)


@dataclass
class ConvergenceSnapshot:
    generated_at: float
    canonical_ref: str
    genesis_ref: str
    donors: List[DonorArtifact]
    capability_best: Dict[str, Dict[str, Any]]
    pruned: List[str]
    quarantined: List[str]
    unresolved: List[str]
    next_objectives: List[Dict[str, Any]]
    policy_digest: str

    def as_dict(self) -> Dict[str, Any]:
        return {
            "generated_at": self.generated_at,
            "canonical_ref": self.canonical_ref,
            "genesis_ref": self.genesis_ref,
            "donors": [
                {
                    **asdict(d),
                    "evidence": d.evidence.value,
                }
                for d in self.donors
            ],
            "capability_best": self.capability_best,
            "pruned": self.pruned,
            "quarantined": self.quarantined,
            "unresolved": self.unresolved,
            "next_objectives": self.next_objectives,
            "policy_digest": self.policy_digest,
        }


DEFAULT_POLICY: Dict[str, Any] = {
    "canonical_authority": "omega-v6-full-convergence",
    "genesis_role": "candidate discovery, archive recovery, bounded experimentation",
    "promotion": {
        "require_green_tests": True,
        "require_exact_head": True,
        "require_rollback_parent": True,
        "require_material_delta": True,
        "allow_direct_production_mutation": False,
    },
    "prune": {
        "synthetic_runtime_truth": True,
        "duplicate_state_authority": True,
        "unbounded_shell_execution": True,
        "stale_version_overlays": True,
    },
}


def stable_digest(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return sha256(encoded).hexdigest()


def infer_capabilities(path: str, text_hint: str = "") -> Dict[str, float]:
    haystack = f"{path} {text_hint}".lower()
    scores: Dict[str, float] = {}
    for signal in CAPABILITY_SIGNALS:
        hits = sum(1 for pattern in signal.patterns if pattern in haystack)
        if hits:
            scores[signal.capability] = round(min(1.0, 0.20 + hits * 0.18) * signal.weight, 4)
    return scores


def disposition_for(artifact: DonorArtifact) -> Disposition:
    lower = artifact.path.lower()
    if artifact.evidence == EvidenceState.REJECTED:
        return Disposition.PRUNE
    if any(key in lower for key in ("__pycache__", ".pyc", "node_modules/", ".ds_store")):
        return Disposition.PRUNE
    if any("synthetic" in c.lower() or "random" in c.lower() for c in artifact.contradictions):
        return Disposition.QUARANTINE
    if artifact.evidence == EvidenceState.VERIFIED and artifact.capabilities:
        return Disposition.KEEP
    if artifact.capabilities and artifact.evidence == EvidenceState.PARTIAL:
        return Disposition.BIND
    if artifact.capabilities:
        return Disposition.REIMPLEMENT
    return Disposition.PRUNE


def pareto_dominates(a: CandidateScore, b: CandidateScore) -> bool:
    gains_a = (a.correctness, a.recovered_capability, a.usability, a.performance, a.portability, a.proof_strength)
    gains_b = (b.correctness, b.recovered_capability, b.usability, b.performance, b.portability, b.proof_strength)
    costs_a = (a.regression_risk, a.contradiction_burden)
    costs_b = (b.regression_risk, b.contradiction_burden)
    no_worse = all(x >= y for x, y in zip(gains_a, gains_b)) and all(x <= y for x, y in zip(costs_a, costs_b))
    strictly_better = any(x > y for x, y in zip(gains_a, gains_b)) or any(x < y for x, y in zip(costs_a, costs_b))
    return no_worse and strictly_better


def select_pareto_front(candidates: Sequence[CandidateScore]) -> List[CandidateScore]:
    return [candidate for candidate in candidates if not any(pareto_dominates(other, candidate) for other in candidates if other is not candidate)]


def build_snapshot(
    artifacts: Iterable[DonorArtifact],
    canonical_ref: str,
    genesis_ref: str,
    policy: Mapping[str, Any] | None = None,
) -> ConvergenceSnapshot:
    effective_policy = dict(DEFAULT_POLICY if policy is None else policy)
    donors = list(artifacts)
    best: Dict[str, Dict[str, Any]] = {}
    pruned: List[str] = []
    quarantined: List[str] = []
    unresolved: List[str] = []

    for donor in donors:
        disposition = disposition_for(donor)
        if disposition == Disposition.PRUNE:
            pruned.append(f"{donor.donor}:{donor.path}")
        elif disposition == Disposition.QUARANTINE:
            quarantined.append(f"{donor.donor}:{donor.path}")
        elif disposition in (Disposition.BIND, Disposition.REIMPLEMENT):
            unresolved.append(f"{donor.donor}:{donor.path}")

        for capability, score in donor.capabilities.items():
            current = best.get(capability)
            proof_bonus = {EvidenceState.VERIFIED: 0.25, EvidenceState.PARTIAL: 0.10, EvidenceState.UNKNOWN: 0.0, EvidenceState.REJECTED: -1.0}[donor.evidence]
            effective = round(score + proof_bonus, 4)
            if current is None or effective > current["effective_score"]:
                best[capability] = {
                    "donor": donor.donor,
                    "path": donor.path,
                    "effective_score": effective,
                    "evidence": donor.evidence.value,
                    "disposition": disposition.value,
                }

    missing = [signal.capability for signal in CAPABILITY_SIGNALS if signal.capability not in best]
    objectives: List[Dict[str, Any]] = []
    for capability in missing:
        objectives.append({"capability": capability, "priority": 1.0, "action": "DISCOVER"})
    for item in unresolved[:20]:
        objectives.append({"artifact": item, "priority": 0.8, "action": "PROVE_OR_REIMPLEMENT"})
    for capability, info in sorted(best.items(), key=lambda pair: pair[1]["effective_score"]):
        if info["evidence"] != EvidenceState.VERIFIED.value:
            objectives.append({"capability": capability, "priority": 0.7, "action": "STRENGTHEN_PROOF", "source": info["path"]})

    return ConvergenceSnapshot(
        generated_at=time.time(),
        canonical_ref=canonical_ref,
        genesis_ref=genesis_ref,
        donors=donors,
        capability_best=best,
        pruned=pruned,
        quarantined=quarantined,
        unresolved=unresolved,
        next_objectives=objectives[:30],
        policy_digest=stable_digest(effective_policy),
    )


def write_snapshot(snapshot: ConvergenceSnapshot, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(snapshot.as_dict(), indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)
