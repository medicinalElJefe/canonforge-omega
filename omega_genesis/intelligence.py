from __future__ import annotations

from hashlib import sha256
import json
from typing import Any

from .calculus import calculus_snapshot
from .schema import CanonicalPacket
from .shell import route_packet


def plan(packet: CanonicalPacket, objective: str) -> dict[str, Any]:
    """Governed deterministic planning over the current packet.

    This is the local orchestration kernel. External model plugins may propose
    additional plans, but the proof gate remains authoritative.
    """
    objective = str(objective).strip()
    if not objective:
        raise ValueError("objective is required")

    calc = calculus_snapshot(packet.metrics)
    route = route_packet(packet)
    gate = calc["mode188"]
    steps: list[dict[str, Any]] = [
        {"order": 1, "stage": "CHECKPOINT_SOURCE", "action": "bind current canonical digest", "digest": packet.digest},
        {"order": 2, "stage": "FREEZE_PRIOR", "action": "preserve pre-observation forecast boundary", "future_observation_used": False},
    ]

    if gate.admission == "PRUNE":
        steps.append({"order": 3, "stage": "PRUNE", "action": "reject canonical mutation; reduce burden/contradiction or improve evidence"})
        steps.append({"order": 4, "stage": "PROVE", "action": "re-evaluate Mode 188 before any mutation"})
    elif gate.admission == "CONDITIONAL":
        steps.append({"order": 3, "stage": "TURN", "action": "evaluate reversible 1+6 local alternatives", "candidate_states": [n["state_id"] for n in route["neighbors"]]})
        steps.append({"order": 4, "stage": "TRANSLATE", "action": "convert selected alternative into a canonical proposal"})
        steps.append({"order": 5, "stage": "PROVE", "action": "commit only if explicitly admitted"})
    else:
        steps.append({"order": 3, "stage": "STAY", "action": "preserve current continuity while executing bounded objective work"})
        steps.append({"order": 4, "stage": "TRANSLATE", "action": "form a typed proposal or host-side action"})
        steps.append({"order": 5, "stage": "PROVE", "action": "record evidence, checksum, and admission result"})

    core = {
        "objective": objective,
        "canonical_digest": packet.digest,
        "state_id": packet.address.state_id,
        "dispatch": gate.dispatch,
        "admission": gate.admission,
        "rsc_margin": calc["rsc"].margin,
        "deep_mother": calc["deep_mother"],
        "high_father": calc["high_father"],
        "deep_thought": calc["deep_thought"],
        "steps": steps,
    }
    fingerprint = sha256(json.dumps(core, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()
    return {
        **core,
        "plan_fingerprint": fingerprint,
        "evidence_class": "DERIVED",
        "canonical_mutation": False,
        "boundary": "planner proposes ordered work; only OmegaRuntime can commit canonical state",
    }
