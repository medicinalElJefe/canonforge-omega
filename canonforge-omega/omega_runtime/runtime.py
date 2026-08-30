from __future__ import annotations

from threading import RLock
from typing import Sequence

from .state import StateEnvelope, EvidenceClass
from .mode188 import gate, operator_decision, opposite_pair_axes, simplex_from_axes, GateDecision, OperatorDecision
from .proof import ProofLedger


class OmegaRuntime:
    """Single-authority state machine. Views, AI, cloud and bridge may propose; only this object accepts."""

    def __init__(self, initial: StateEnvelope, ledger: ProofLedger | None = None) -> None:
        self._lock = RLock()
        self._state = initial
        self.ledger = ledger or ProofLedger()
        self.ledger.append(kind="BOOT", input_digest=None, output_digest=initial.digest, decision="ACCEPT",
                           evidence={"schema": initial.schema_version})

    @property
    def state(self) -> StateEnvelope:
        with self._lock:
            return self._state

    def evaluate(self, candidate: StateEnvelope, *, shell_amplitudes: Sequence[float] | None = None) -> tuple[GateDecision, OperatorDecision, tuple[float, float, float] | None]:
        m = candidate.metrics
        g = gate(m.continuity, m.burden, m.contradiction)
        construct = max(0.0, m.continuity + m.future_plasticity - m.burden)
        prune = max(0.0, m.contradiction + m.burden - m.continuity)
        op = operator_decision(construct, prune, 0.0 if g.dispatch.value == "STAY" else 0.05)
        simplex = None
        if shell_amplitudes is not None:
            simplex = simplex_from_axes(opposite_pair_axes(shell_amplitudes))
        return g, op, simplex

    def propose(self, candidate: StateEnvelope, *, shell_amplitudes: Sequence[float] | None = None, allow_forecast_mutation: bool = False) -> dict:
        with self._lock:
            current = self._state
            if candidate.parent_digest != current.digest:
                self.ledger.append(kind="TRANSITION", input_digest=current.digest, output_digest=candidate.digest,
                                   decision="PRUNE", evidence={"reason": "parent_digest_mismatch"},
                                   rejected_alternatives=("candidate",))
                return {"accepted": False, "reason": "parent_digest_mismatch"}
            if candidate.evidence_class is EvidenceClass.FORECAST and not allow_forecast_mutation:
                self.ledger.append(kind="TRANSITION", input_digest=current.digest, output_digest=candidate.digest,
                                   decision="PRUNE", evidence={"reason": "forecast_cannot_mutate_canonical_state"},
                                   rejected_alternatives=("forecast_candidate",))
                return {"accepted": False, "reason": "forecast_cannot_mutate_canonical_state"}
            g, op, simplex = self.evaluate(candidate, shell_amplitudes=shell_amplitudes)
            accepted = g.admission.value == "ACCEPT" and op.selected != "01-1_PRUNE"
            decision = "ACCEPT" if accepted else ("CONDITIONAL" if g.admission.value == "CONDITIONAL" else "PRUNE")
            self.ledger.append(kind="TRANSITION", input_digest=current.digest, output_digest=candidate.digest,
                               decision=decision,
                               evidence={"mode188_ratio": g.ratio, "dispatch": g.dispatch.value, "operator": op.selected, "simplex": simplex},
                               rejected_alternatives=op.rejected)
            if accepted:
                self._state = candidate
            return {"accepted": accepted, "decision": decision, "gate": g, "operator": op, "simplex": simplex}
