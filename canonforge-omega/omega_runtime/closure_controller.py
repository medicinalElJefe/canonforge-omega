from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from typing import Iterable
import json

from .intrinsic_skin import ClosureNavigator, ProofObligation, SKINS

SCHEMA = "OMEGA_CLOSURE_CONTROLLER_R224"


def _digest(value) -> str:
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


@dataclass(frozen=True, slots=True)
class ClosureAction:
    obligation_id: str
    closure_address: str
    action: str
    current_skin: int
    target_skin: int
    reason: str
    canonical_mutation: bool = False

    @property
    def receipt(self) -> str:
        return _digest((self.obligation_id, self.closure_address, self.action, self.current_skin, self.target_skin, self.reason, self.canonical_mutation))


class ClosureController:
    """Deterministic proof-space controller. It selects work; it never mutates Canon."""

    def __init__(self, epsilon: float = 0.05):
        if epsilon < 0:
            raise ValueError("epsilon must be non-negative")
        self.epsilon = float(epsilon)
        self.navigator = ClosureNavigator()

    def select(self, obligations: Iterable[ProofObligation], resolved_ids: Iterable[str] = ()) -> ProofObligation | None:
        return self.navigator.next(tuple(obligations), tuple(resolved_ids))

    def plan(self, obligations: Iterable[ProofObligation], resolved_ids: Iterable[str] = ()) -> ClosureAction | None:
        obligation = self.select(obligations, resolved_ids)
        if obligation is None:
            return None
        route = self.navigator.route(obligation, self.epsilon)
        skin = obligation.closure.path.skin
        target = skin
        reason = "closure requires investigation"
        if route == "ESCALATE":
            target = SKINS[SKINS.index(skin) + 1]
            reason = "return residual or contradiction exceeds epsilon"
        elif route == "TURN":
            reason = "resolution ceiling reached; change frame/model/operator"
        elif route == "PROVE_EQUIVALENCE":
            reason = "projected/approximate return requires explicit equivalence proof"
        elif route == "CLOSED":
            reason = "closure already proven"
        return ClosureAction(obligation.obligation_id, obligation.closure_address, route, skin, target, reason)

    def cycle(self, obligations: Iterable[ProofObligation], resolved_ids: Iterable[str] = ()) -> dict:
        action = self.plan(obligations, resolved_ids)
        body = {
            "schema": SCHEMA,
            "action": None if action is None else action.action,
            "obligation_id": None if action is None else action.obligation_id,
            "closure_address": None if action is None else action.closure_address,
            "current_skin": None if action is None else action.current_skin,
            "target_skin": None if action is None else action.target_skin,
            "canonical_mutation": False,
            "loop": ["ADDRESS", "SELECT_UNRESOLVED_CLOSURE", "TRAVERSE", "RETURN", "COMPARE", "PROVE", "SELECT_NEXT"],
        }
        return {**body, "receipt_sha256": _digest(body)}
