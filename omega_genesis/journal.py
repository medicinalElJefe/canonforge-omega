from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path
from typing import Any, Callable


def _canonical_digest(packet_dict: dict[str, Any]) -> str:
    raw = json.dumps(packet_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return sha256(raw.encode("utf-8")).hexdigest()


class StateJournal:
    """Append-only canonical packet history used for deterministic replay verification."""

    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("", encoding="utf-8")

    def read(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                rows.append(json.loads(line))
        return rows

    def append(self, packet_dict: dict[str, Any], digest: str, *, origin: str = "COMMIT") -> dict[str, Any]:
        row = {"origin": origin, "digest": digest, "packet": packet_dict}
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(row, sort_keys=True, ensure_ascii=False, separators=(",", ":")) + "\n")
        return row

    def verify(self, *, expected_head: str | None = None) -> dict[str, Any]:
        rows = self.read()
        previous_digest: str | None = None
        previous_sequence: int | None = None
        for i, row in enumerate(rows, 1):
            packet = row.get("packet")
            digest = row.get("digest")
            if not isinstance(packet, dict) or not isinstance(digest, str):
                return {"valid": False, "records": len(rows), "failure_at": i, "reason": "malformed_record"}
            computed = _canonical_digest(packet)
            if computed != digest:
                return {"valid": False, "records": len(rows), "failure_at": i, "reason": "digest_mismatch"}
            sequence = int(packet.get("sequence", -1))
            parent = packet.get("parent_digest")
            if i > 1:
                if previous_sequence is not None and sequence != previous_sequence + 1:
                    return {"valid": False, "records": len(rows), "failure_at": i, "reason": "sequence_gap"}
                if parent != previous_digest:
                    return {"valid": False, "records": len(rows), "failure_at": i, "reason": "parent_mismatch"}
            previous_digest, previous_sequence = digest, sequence
        if expected_head is not None and rows and previous_digest != expected_head:
            return {"valid": False, "records": len(rows), "failure_at": len(rows), "reason": "head_mismatch", "head": previous_digest, "expected_head": expected_head}
        return {"valid": True, "records": len(rows), "head": previous_digest, "start_sequence": (rows[0]["packet"].get("sequence") if rows else None), "end_sequence": previous_sequence}

    def replay(self, decoder: Callable[[dict[str, Any]], Any]) -> list[Any]:
        verification = self.verify()
        if not verification["valid"]:
            raise ValueError(f"state journal invalid: {verification}")
        return [decoder(row["packet"]) for row in self.read()]
