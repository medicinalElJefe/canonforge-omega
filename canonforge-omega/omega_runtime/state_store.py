from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
import json
import os
import tempfile

from .state import Address20736, EvidenceClass, MotionState, StateEnvelope, StateMetrics


class StateStore:
    """Atomic local persistence for the canonical StateEnvelope."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path).expanduser()

    def load(self) -> StateEnvelope | None:
        if not self.path.exists():
            return None
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        return StateEnvelope(
            address=Address20736(*raw["address"]),
            evidence_class=EvidenceClass(raw["evidence_class"]),
            metrics=StateMetrics(**raw["metrics"]),
            motion=MotionState(**raw.get("motion", {})),
            payload=raw.get("payload", {}),
            source_id=raw.get("source_id", "runtime"),
            observer_id=raw.get("observer_id", "canonical"),
            timestamp=raw["timestamp"],
            parent_digest=raw.get("parent_digest"),
            schema_version=raw.get("schema_version", "omega-state-v1"),
        )

    def save(self, state: StateEnvelope) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = state.canonical_dict()
        fd, temp_name = tempfile.mkstemp(prefix=self.path.name + ".", suffix=".tmp", dir=str(self.path.parent))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(payload, fh, sort_keys=True, ensure_ascii=False, indent=2)
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(temp_name, self.path)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)
