from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
from pathlib import Path
from datetime import datetime, timezone
import json
from typing import Any


@dataclass(frozen=True, slots=True)
class ProofRecord:
    sequence: int
    kind: str
    input_digest: str | None
    output_digest: str | None
    decision: str
    evidence: dict[str, Any]
    rejected_alternatives: tuple[str, ...]
    timestamp: str
    previous_record_hash: str | None
    record_hash: str


class ProofLedger:
    def __init__(self, path: str | Path | None = None) -> None:
        self.path = Path(path).expanduser() if path else None
        self._records: list[ProofRecord] = []
        if self.path and self.path.exists():
            self._load()

    def _load(self) -> None:
        assert self.path is not None
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                self._records.append(ProofRecord(**json.loads(line)))
        self.verify()

    @property
    def records(self) -> tuple[ProofRecord, ...]:
        return tuple(self._records)

    def append(self, *, kind: str, input_digest: str | None, output_digest: str | None, decision: str,
               evidence: dict[str, Any] | None = None, rejected_alternatives: tuple[str, ...] = ()) -> ProofRecord:
        previous = self._records[-1].record_hash if self._records else None
        body = {
            "sequence": len(self._records),
            "kind": kind,
            "input_digest": input_digest,
            "output_digest": output_digest,
            "decision": decision,
            "evidence": evidence or {},
            "rejected_alternatives": rejected_alternatives,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "previous_record_hash": previous,
        }
        raw = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        record = ProofRecord(**body, record_hash=sha256(raw.encode("utf-8")).hexdigest())
        self._records.append(record)
        if self.path:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(asdict(record), sort_keys=True, ensure_ascii=False) + "\n")
        return record

    def verify(self) -> bool:
        previous = None
        for i, record in enumerate(self._records):
            body = asdict(record)
            record_hash = body.pop("record_hash")
            body["rejected_alternatives"] = tuple(body["rejected_alternatives"])
            if record.sequence != i or record.previous_record_hash != previous:
                raise ValueError("proof ledger chain/order failure")
            raw = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
            if sha256(raw.encode("utf-8")).hexdigest() != record_hash:
                raise ValueError("proof ledger hash failure")
            previous = record_hash
        return True
