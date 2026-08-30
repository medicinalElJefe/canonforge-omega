from __future__ import annotations

from dataclasses import dataclass
from .state import Address20736, StateEnvelope
from .atlas import ping_next, ping_prev, opposite_address


@dataclass(slots=True)
class InstrumentSelection:
    address: Address20736

    def select(self, address: Address20736) -> Address20736:
        self.address = address
        return self.address

    def navigate(self, direction: str) -> Address20736:
        direction = direction.upper().strip()
        if direction == "NEXT":
            self.address = ping_next(self.address)
        elif direction == "PREV":
            self.address = ping_prev(self.address)
        elif direction in {"OPPOSITE", "INVERSE"}:
            self.address = opposite_address(self.address)
        elif direction.startswith("PHASE+"):
            step = int(direction.split("+", 1)[1] or "1")
            self.address = Address20736(self.address.domain, ((self.address.phase - 1 + step) % 12) + 1, self.address.regulation, self.address.layer)
        elif direction.startswith("PHASE-"):
            step = int(direction.split("-", 1)[1] or "1")
            self.address = Address20736(self.address.domain, ((self.address.phase - 1 - step) % 12) + 1, self.address.regulation, self.address.layer)
        else:
            raise ValueError(f"unsupported navigation direction: {direction}")
        return self.address


def instrument_summary(selection: InstrumentSelection, state: StateEnvelope) -> dict:
    a = selection.address
    return {
        "selection": {"index": a.index, "domain": a.domain, "phase": a.phase, "regulation": a.regulation, "layer": a.layer,
                      "label": f"D{a.domain:02d}|P{a.phase:02d}|R{a.regulation:02d}|L{a.layer:02d}"},
        "canonical_state_digest": state.digest,
        "canonical_metrics": state.metrics.__dict__ if hasattr(state.metrics, "__dict__") else {
            "continuity": state.metrics.continuity, "burden": state.metrics.burden,
            "contradiction": state.metrics.contradiction, "future_plasticity": state.metrics.future_plasticity,
            "proof_scar": state.metrics.proof_scar, "shell_depth": state.metrics.shell_depth,
            "branch_pressure": state.metrics.branch_pressure,
        },
        "boundary": "selection is a traversal cursor; it does not mutate canonical state",
    }
