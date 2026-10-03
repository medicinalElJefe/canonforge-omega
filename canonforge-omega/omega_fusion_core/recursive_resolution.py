"""Proof-guided recursive resolution for OMEGA.

Extends the intrinsic addressed-skin kernel with bounded dynamic branching,
bidirectional reachability, lemma composition, and scale-projection audits.
Atlas skins are address/resolution lenses, not physical dimensions.

Physical authority is strict:
MEASURED > DERIVED_STANDARD > DERIVED_LENS > HYPOTHESIS.

A failed established-physics check is terminal for a physical branch. Canon or
lens scores may rank surviving branches, but may never rescue a physically
invalid candidate or override source measurements.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, IntEnum
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple
import math

from .intrinsic_skin import NodeState, OmegaAddr, stable_hash, vector_residual


class Authority(IntEnum):
    HYPOTHESIS = 1
    DERIVED_LENS = 2
    DERIVED_STANDARD = 3
    MEASURED = 4


class ProofClass(str, Enum):
    PHYSICAL_INVARIANT = "PHYSICAL_INVARIANT"
    STRUCTURAL_ANALOGY = "STRUCTURAL_ANALOGY"
    REPRESENTATIONAL_COINCIDENCE = "REPRESENTATIONAL_COINCIDENCE"
    UNRESOLVED_HYPOTHESIS = "UNRESOLVED_HYPOTHESIS"


class BranchDisposition(str, Enum):
    ACTIVE = "ACTIVE"
    REJECTED_PHYSICAL = "REJECTED_PHYSICAL"
    REJECTED_CANON = "REJECTED_CANON"
    PRUNED = "PRUNED"
    RESOLVED = "RESOLVED"
    BOUNDED = "BOUNDED"
    OBSERVE_NEXT = "OBSERVE_NEXT"
    INCONSISTENT = "INCONSISTENT"


@dataclass(frozen=True)
class EvidenceRef:
    name: str
    authority: Authority
    source_hash: str = ""
    frame: str = ""
    uncertainty: Optional[float] = None
    assumptions: Tuple[str, ...] = ()


@dataclass(frozen=True)
class CheckResult:
    name: str
    passed: bool
    authority: Authority
    reason: str = ""
    residual: Optional[float] = None


@dataclass
class TransitionRecord:
    source: OmegaAddr
    target: OmegaAddr
    dt: Optional[float] = None
    delta_state: Dict[str, Any] = field(default_factory=dict)
    delta_geometry: Dict[str, Any] = field(default_factory=dict)
    delta_motion: Dict[str, Any] = field(default_factory=dict)
    transform: Dict[str, Any] = field(default_factory=dict)
    physical_checks: List[CheckResult] = field(default_factory=list)
    provenance: List[EvidenceRef] = field(default_factory=list)
    residuals: Dict[str, float] = field(default_factory=dict)

    @property
    def physically_admissible(self) -> bool:
        return all(c.passed for c in self.physical_checks)

    @property
    def authority(self) -> Authority:
        if not self.provenance:
            return Authority.HYPOTHESIS
        return min((p.authority for p in self.provenance), default=Authority.HYPOTHESIS)

    @property
    def transition_id(self) -> str:
        return stable_hash({
            "source": self.source,
            "target": self.target,
            "dt": self.dt,
            "delta_state": self.delta_state,
            "delta_geometry": self.delta_geometry,
            "delta_motion": self.delta_motion,
            "transform": self.transform,
            "checks": [c.__dict__ for c in self.physical_checks],
            "residuals": self.residuals,
        })


@dataclass
class BranchCandidate:
    branch_id: str
    parent_branch_id: Optional[str]
    state: NodeState
    evidence: List[EvidenceRef] = field(default_factory=list)
    physical_checks: List[CheckResult] = field(default_factory=list)
    canon_checks: List[CheckResult] = field(default_factory=list)
    c_omega: Optional[float] = None
    phi: Optional[float] = None
    contradiction_q: Optional[float] = None
    burden_lambda: Optional[float] = None
    evidence_score: Optional[float] = None
    model_score: Optional[float] = None
    residual: Optional[float] = None
    disposition: BranchDisposition = BranchDisposition.ACTIVE
    decline_scar: List[str] = field(default_factory=list)

    @property
    def authority(self) -> Authority:
        if not self.evidence:
            return Authority.HYPOTHESIS
        return min((e.authority for e in self.evidence), default=Authority.HYPOTHESIS)

    def canon_score(self, eps: float = 1e-12) -> Optional[float]:
        if self.disposition != BranchDisposition.ACTIVE:
            return None
        vals = (self.c_omega, self.phi, self.contradiction_q, self.burden_lambda)
        if any(v is None for v in vals):
            return None
        return (float(self.c_omega) * float(self.phi)) / (
            float(self.contradiction_q) + float(self.burden_lambda) + eps
        )


@dataclass(frozen=True)
class ResolutionResult:
    survivors: Tuple[BranchCandidate, ...]
    rejected: Tuple[BranchCandidate, ...]
    status: BranchDisposition


class BranchResolutionEngine:
    """Apply physical vetoes before Canon vetoes and lens scoring."""

    def admit(self, branch: BranchCandidate) -> BranchCandidate:
        failed_physical = [c for c in branch.physical_checks if not c.passed]
        if failed_physical:
            branch.disposition = BranchDisposition.REJECTED_PHYSICAL
            branch.decline_scar.extend(
                f"PHYSICAL:{c.name}:{c.reason}" for c in failed_physical
            )
            return branch

        failed_canon = [c for c in branch.canon_checks if not c.passed]
        if failed_canon:
            branch.disposition = BranchDisposition.REJECTED_CANON
            branch.decline_scar.extend(
                f"CANON:{c.name}:{c.reason}" for c in failed_canon
            )
            return branch

        branch.disposition = BranchDisposition.ACTIVE
        return branch

    def resolve(self, branches: Iterable[BranchCandidate]) -> ResolutionResult:
        survivors: List[BranchCandidate] = []
        rejected: List[BranchCandidate] = []
        for branch in branches:
            self.admit(branch)
            (survivors if branch.disposition == BranchDisposition.ACTIVE else rejected).append(branch)

        survivors.sort(
            key=lambda b: (
                b.authority,
                b.evidence_score if b.evidence_score is not None else -math.inf,
                b.model_score if b.model_score is not None else -math.inf,
                b.canon_score() if b.canon_score() is not None else -math.inf,
                -(b.residual if b.residual is not None else math.inf),
            ),
            reverse=True,
        )

        if not survivors:
            status = BranchDisposition.INCONSISTENT
        elif len(survivors) == 1:
            status = BranchDisposition.RESOLVED
        else:
            status = BranchDisposition.BOUNDED
        return ResolutionResult(tuple(survivors), tuple(rejected), status)


@dataclass(frozen=True)
class ReachabilityMatch:
    forward_index: int
    backward_index: int
    residual: float


@dataclass(frozen=True)
class ReachabilityIntersection:
    matches: Tuple[ReachabilityMatch, ...]
    status: BranchDisposition


def intersect_reachable_states(
    forward: Sequence[Any],
    backward: Sequence[Any],
    metric: Callable[[Any, Any], float],
    tolerance: float,
) -> ReachabilityIntersection:
    if tolerance < 0:
        raise ValueError("tolerance must be non-negative")
    matches: List[ReachabilityMatch] = []
    for i, left in enumerate(forward):
        for j, right in enumerate(backward):
            residual = float(metric(left, right))
            if residual <= tolerance:
                matches.append(ReachabilityMatch(i, j, residual))
    if not matches:
        status = BranchDisposition.INCONSISTENT
    elif len(matches) == 1:
        status = BranchDisposition.RESOLVED
    else:
        status = BranchDisposition.BOUNDED
    return ReachabilityIntersection(tuple(sorted(matches, key=lambda x: x.residual)), status)


@dataclass(frozen=True)
class Lemma:
    name: str
    input_contract: frozenset[str]
    output_contract: frozenset[str]
    proof_class: ProofClass
    authority: Authority
    validated: bool
    assumptions: Tuple[str, ...] = ()
    source_lemmas: Tuple[str, ...] = ()


_PROOF_STRENGTH = {
    ProofClass.PHYSICAL_INVARIANT: 4,
    ProofClass.STRUCTURAL_ANALOGY: 3,
    ProofClass.REPRESENTATIONAL_COINCIDENCE: 2,
    ProofClass.UNRESOLVED_HYPOTHESIS: 1,
}


def compose_lemmas(*lemmas: Lemma, name: str = "") -> Lemma:
    if not lemmas:
        raise ValueError("at least one lemma is required")
    if any(not lemma.validated for lemma in lemmas):
        raise ValueError("cannot compose an unvalidated lemma")
    for left, right in zip(lemmas, lemmas[1:]):
        missing = right.input_contract.difference(left.output_contract)
        if missing:
            raise ValueError(
                f"incompatible lemma contracts: {left.name} does not provide "
                f"{sorted(missing)} for {right.name}"
            )
    weakest = min(lemmas, key=lambda l: _PROOF_STRENGTH[l.proof_class]).proof_class
    authority = min(lemma.authority for lemma in lemmas)
    assumptions: List[str] = []
    for lemma in lemmas:
        for assumption in lemma.assumptions:
            if assumption not in assumptions:
                assumptions.append(assumption)
    return Lemma(
        name=name or " -> ".join(lemma.name for lemma in lemmas),
        input_contract=lemmas[0].input_contract,
        output_contract=lemmas[-1].output_contract,
        proof_class=weakest,
        authority=authority,
        validated=True,
        assumptions=tuple(assumptions),
        source_lemmas=tuple(lemma.name for lemma in lemmas),
    )


def projection_commutation_residual(
    fine_state: Any,
    evolve_fine: Callable[[Any], Any],
    project: Callable[[Any], Any],
    evolve_coarse: Callable[[Any], Any],
    metric: Callable[[Any, Any], float] = vector_residual,
) -> float:
    """Measure ||project(evolve_fine(x)) - evolve_coarse(project(x))||."""
    lhs = project(evolve_fine(fine_state))
    rhs = evolve_coarse(project(fine_state))
    return float(metric(lhs, rhs))


class PromotionLevel(str, Enum):
    EDGE = "EDGE"
    LEMMA = "LEMMA"
    THEOREM = "THEOREM"
    LENS = "LENS"


@dataclass(frozen=True)
class PromotionEvidence:
    replay: bool = False
    invariants: bool = False
    cross_skin: bool = False
    provenance: bool = False
    rollback: bool = False
    replication: bool = False
    out_of_sample: bool = False
    composition: bool = False
    commutation: bool = False
    residual_bound: bool = False


class RecursivePromotionGate:
    BASE = ("replay", "invariants", "cross_skin", "provenance", "rollback")
    EXTRA = {
        PromotionLevel.EDGE: (),
        PromotionLevel.LEMMA: ("replication", "out_of_sample"),
        PromotionLevel.THEOREM: ("replication", "out_of_sample", "composition"),
        PromotionLevel.LENS: (
            "replication",
            "out_of_sample",
            "composition",
            "commutation",
            "residual_bound",
        ),
    }

    def evaluate(self, level: PromotionLevel, evidence: PromotionEvidence) -> str:
        required = self.BASE + self.EXTRA[level]
        return "PROMOTE" if all(getattr(evidence, key) for key in required) else "HOLD"


def normalized_entropy(probabilities: Sequence[float]) -> float:
    if not probabilities:
        return 0.0
    if any(p < 0 for p in probabilities):
        raise ValueError("probabilities must be non-negative")
    total = sum(probabilities)
    if total <= 0:
        raise ValueError("probabilities must have positive total mass")
    probs = [p / total for p in probabilities if p > 0]
    return -sum(p * math.log2(p) for p in probs)


def information_gain(
    prior: Sequence[float],
    posterior_scenarios: Sequence[Tuple[float, Sequence[float]]],
) -> float:
    """Expected entropy reduction; scenario weights are normalized internally."""
    if not posterior_scenarios:
        raise ValueError("posterior_scenarios is required")
    weights = [weight for weight, _ in posterior_scenarios]
    if any(weight < 0 for weight in weights) or sum(weights) <= 0:
        raise ValueError("scenario weights must be non-negative with positive total")
    weight_sum = sum(weights)
    expected = sum(
        (weight / weight_sum) * normalized_entropy(posterior)
        for weight, posterior in posterior_scenarios
    )
    return normalized_entropy(prior) - expected
