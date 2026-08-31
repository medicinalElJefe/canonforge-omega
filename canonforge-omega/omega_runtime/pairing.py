from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import hashlib
import json
import secrets


@dataclass
class PairingRecord:
    token_sha256: str
    issued_at: str
    generation: int


class PairingRegistry:
    """Persistent scoped credential used only by the sovereign Windows agent.

    Browser credential readiness is not device proof. This registry only establishes
    a credential that may authenticate heartbeat/job traffic; PC_ONLINE still requires
    a current authenticated heartbeat from the agent.
    """

    def __init__(self, state_path: Path) -> None:
        self.state_path = state_path
        self._record: Optional[PairingRecord] = None
        self._load()

    @staticmethod
    def _digest(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def _load(self) -> None:
        if not self.state_path.exists():
            return
        try:
            raw = json.loads(self.state_path.read_text(encoding="utf-8"))
            self._record = PairingRecord(**raw)
        except (OSError, ValueError, TypeError, json.JSONDecodeError):
            self._record = None

    def _save(self) -> None:
        if self._record is None:
            return
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.state_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self._record.__dict__, indent=2, sort_keys=True), encoding="utf-8")
        tmp.replace(self.state_path)

    @property
    def ready(self) -> bool:
        return self._record is not None

    @property
    def generation(self) -> int:
        return 0 if self._record is None else self._record.generation

    def issue(self, issued_at: str) -> str:
        token = secrets.token_urlsafe(32)
        self._record = PairingRecord(
            token_sha256=self._digest(token),
            issued_at=issued_at,
            generation=self.generation + 1,
        )
        self._save()
        return token

    def validate(self, token: str | None) -> bool:
        if self._record is None or not token:
            return False
        return secrets.compare_digest(self._record.token_sha256, self._digest(token))
