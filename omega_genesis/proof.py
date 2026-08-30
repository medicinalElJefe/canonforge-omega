from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import threading
from typing import Any


@dataclass(frozen=True, slots=True)
class ProofReceipt:
    sequence: int
    kind: str
    decision: str
    state_before: str
    state_after: str | None
    payload: dict[str, Any]
    previous_receipt: str | None
    created_at: str
    digest: str


class ProofLedger:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        if not self.path.exists(): self.path.write_text("", encoding="utf-8")

    def read(self) -> list[dict[str, Any]]:
        with self.lock:
            rows=[]
            for line in self.path.read_text(encoding="utf-8").splitlines():
                if line.strip(): rows.append(json.loads(line))
            return rows

    def append(self, kind: str, decision: str, state_before: str, state_after: str | None, payload: dict[str, Any]) -> ProofReceipt:
        with self.lock:
            rows=self.read(); previous=rows[-1]["digest"] if rows else None; sequence=len(rows)+1
            base={"sequence":sequence,"kind":kind,"decision":decision,"state_before":state_before,"state_after":state_after,"payload":payload,"previous_receipt":previous,"created_at":datetime.now(timezone.utc).isoformat()}
            digest=sha256(json.dumps(base,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
            row={**base,"digest":digest}
            with self.path.open("a",encoding="utf-8") as f:
                f.write(json.dumps(row,sort_keys=True,ensure_ascii=False,separators=(",",":"))+"\n")
                f.flush()
            return ProofReceipt(**row)

    def verify(self) -> dict[str, Any]:
        with self.lock:
            rows=self.read(); prev=None
            for i,row in enumerate(rows,1):
                digest=row.get("digest"); base={k:v for k,v in row.items() if k!="digest"}
                computed=sha256(json.dumps(base,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
                if computed!=digest or row.get("previous_receipt")!=prev or row.get("sequence")!=i:
                    reason="digest_mismatch" if computed!=digest else "previous_receipt_mismatch" if row.get("previous_receipt")!=prev else "sequence_mismatch"
                    return {"valid":False,"records":len(rows),"failure_at":i,"reason":reason}
                prev=digest
            return {"valid":True,"records":len(rows),"head":prev}
