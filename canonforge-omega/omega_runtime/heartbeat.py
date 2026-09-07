from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
import json


@dataclass
class HeartbeatProof:
    agent_id: str
    authenticated: bool
    approved_root: str
    received_at: str
    sequence: int
    capabilities: list[str]
    runtime_version: str | None = None
    last_job_id: str | None = None


class HeartbeatRegistry:
    """Persistent device-proof registry.

    A browser credential is not device proof. PC ONLINE requires a heartbeat
    recorded through authenticated sovereign ingress and still within ttl_seconds.
    """

    def __init__(self, state_path: Path, ttl_seconds: int = 45) -> None:
        self.state_path = state_path
        self.ttl_seconds = ttl_seconds
        self._proof: Optional[HeartbeatProof] = None
        self._load()

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    def _load(self) -> None:
        if not self.state_path.exists():
            return
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            self._proof = HeartbeatProof(**raw)
        except (OSError, ValueError, TypeError, json.JSONDecodeError):
            self._proof = None

    def _save(self) -> None:
        if self._proof is None:
            return
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.state_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(asdict(self._proof), indent=2, sort_keys=True), encoding="utf-8")
        tmp.replace(self.state_path)

    def record(self, *, agent_id: str, approved_root: str, capabilities: list[str],
               runtime_version: str | None = None, last_job_id: str | None = None,
               authenticated: bool = True) -> Dict[str, Any]:
        previous_sequence = self._proof.sequence if self._proof and self._proof.agent_id == agent_id else 0
        self._proof = HeartbeatProof(
            agent_id=agent_id,
            authenticated=authenticated,
            approved_root=approved_root,
            received_at=self._now().isoformat(),
            sequence=previous_sequence + 1,
            capabilities=sorted(set(capabilities)),
            runtime_version=runtime_version,
            last_job_id=last_job_id,
        )
        self._save()
        return self.status()

    def status(self) -> Dict[str, Any]:
        if self._proof is None:
            return {
                "state": "AGENT_NOT_RUNNING_OR_UNREACHABLE",
                "pc_online": False,
                "authenticated_heartbeat": False,
                "heartbeat_age_seconds": None,
                "proof": None,
                "boundary": "browser credential readiness alone is not PC connection proof",
            }
        received = datetime.fromisoformat(self._proof.received_at)
        age = max(0.0, (self._now() - received).total_seconds())
        current = self._proof.authenticated and age <= self.ttl_seconds
        return {
            "state": "PC_ONLINE" if current else "HEARTBEAT_STALE",
            "pc_online": current,
            "authenticated_heartbeat": self._proof.authenticated,
            "heartbeat_age_seconds": round(age, 3),
            "ttl_seconds": self.ttl_seconds,
            "proof": asdict(self._proof),
            "boundary": "PC_ONLINE requires authenticated current heartbeat proof",
        }
