from __future__ import annotations

from hashlib import sha256
import json
import math
import os
from pathlib import Path
import re
from threading import RLock
from typing import Any

from .schema import EvidenceClass

_HEX64 = re.compile(r"^[0-9a-f]{64}$")


def _canonical(value: dict[str, Any]) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _event_hash(event: dict[str, Any]) -> str:
    payload = {k: v for k, v in event.items() if k != "event_hash"}
    return sha256(_canonical(payload)).hexdigest()


def _checkpoint_hash(checkpoint: dict[str, Any]) -> str:
    payload = {k: v for k, v in checkpoint.items() if k != "checkpoint_hash"}
    return sha256(_canonical(payload)).hexdigest()


def _validate_state_binding(state_id: int, state_digest: str) -> tuple[int, str]:
    if isinstance(state_id, bool) or not isinstance(state_id, int) or not 1 <= state_id <= 20_736:
        raise ValueError("state_id must be an integer in 1..20736")
    state_digest = str(state_digest).strip().lower()
    if not _HEX64.fullmatch(state_digest):
        raise ValueError("state_digest must be a 64-character lowercase SHA-256")
    return state_id, state_digest


class LearningMemory:
    """Append-only adaptive memory subordinate to canonical OMEGA state."""

    def __init__(self, root: Path):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.path = self.root / "events.jsonl"
        self._lock = RLock()

    def _rows(self) -> list[dict[str, Any]]:
        if not self.path.is_file():
            return []
        rows: list[dict[str, Any]] = []
        for line in self.path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                value = json.loads(line)
                if not isinstance(value, dict):
                    raise ValueError("learning journal row must be an object")
                rows.append(value)
        return rows

    @staticmethod
    def _verify_rows(rows: list[dict[str, Any]], max_seq: int | None = None) -> dict[str, Any]:
        if max_seq is not None and (isinstance(max_seq, bool) or not isinstance(max_seq, int) or max_seq < 0):
            return {"valid": False, "records": 0, "reason": "invalid_max_seq"}
        prev = None
        checked = 0
        for expected_seq, row in enumerate(rows, 1):
            seq = row.get("sequence")
            if seq != expected_seq:
                return {"valid": False, "records": checked, "reason": "sequence_mismatch", "failure_at": expected_seq}
            if max_seq is not None and seq > max_seq:
                break
            if row.get("prev_hash") != prev:
                return {"valid": False, "records": checked, "reason": "chain_mismatch", "failure_at": expected_seq}
            actual = _event_hash(row)
            if row.get("event_hash") != actual:
                return {"valid": False, "records": checked, "reason": "hash_mismatch", "failure_at": expected_seq}
            prev = actual
            checked += 1
        if max_seq is not None and max_seq > len(rows):
            return {"valid": False, "records": checked, "reason": "sequence_unavailable", "requested": max_seq, "available": len(rows)}
        return {"valid": True, "records": checked, "head": prev, "max_seq": max_seq}

    def verify(self, max_seq: int | None = None) -> dict[str, Any]:
        with self._lock:
            try:
                rows = self._rows()
                return self._verify_rows(rows, max_seq=max_seq)
            except Exception as exc:
                return {"valid": False, "records": 0, "reason": f"{type(exc).__name__}: {exc}"}

    def record(
        self,
        *,
        state_id: int,
        state_digest: str,
        context_key: str,
        action: str,
        reward: float,
        evidence_class: EvidenceClass | str = EvidenceClass.DERIVED,
    ) -> dict[str, Any]:
        state_id, state_digest = _validate_state_binding(state_id, state_digest)
        context_key = str(context_key).strip()
        action = str(action).strip()
        if not context_key or len(context_key) > 128:
            raise ValueError("context_key must contain 1..128 characters")
        if not action or len(action) > 128:
            raise ValueError("action must contain 1..128 characters")
        reward = float(reward)
        if not math.isfinite(reward) or not -1.0 <= reward <= 1.0:
            raise ValueError("reward must be finite and in -1..1")
        evidence = EvidenceClass(evidence_class).value

        with self._lock:
            rows = self._rows()
            verified = self._verify_rows(rows)
            if not verified.get("valid"):
                raise RuntimeError("learning journal is invalid; refusing append")
            event = {
                "schema": "omega.learning.event.v1",
                "sequence": len(rows) + 1,
                "state_id": state_id,
                "state_digest": state_digest,
                "context_key": context_key,
                "action": action,
                "reward": reward,
                "evidence_class": evidence,
                "prev_hash": verified.get("head"),
                "canonical_mutation": False,
            }
            event["event_hash"] = _event_hash(event)
            with self.path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(event, sort_keys=True, separators=(",", ":")) + "\n")
                fh.flush()
                os.fsync(fh.fileno())
            return dict(event)

    def checkpoint(
        self,
        *,
        state_id: int,
        state_digest: str,
        max_seq: int | None = None,
    ) -> dict[str, Any]:
        """Bind a verified learning prefix to a canonical state without mutating either authority."""
        state_id, state_digest = _validate_state_binding(state_id, state_digest)
        with self._lock:
            verified = self.verify(max_seq=max_seq)
        if not verified.get("valid"):
            raise RuntimeError(f"learning journal verification failed: {verified.get('reason')}")
        checkpoint = {
            "schema": "omega.learning.checkpoint.v1",
            "state_id": state_id,
            "state_digest": state_digest,
            "learning_sequence": int(verified.get("records", 0)),
            "learning_head": verified.get("head"),
            "evidence_class": EvidenceClass.DERIVED.value,
            "canonical_mutation": False,
            "boundary": "checkpoint proves a learning-history prefix is bound to an observed canonical state digest; it does not grant learning state canonical authority",
        }
        checkpoint["checkpoint_hash"] = _checkpoint_hash(checkpoint)
        return checkpoint

    def verify_checkpoint(self, checkpoint: dict[str, Any]) -> dict[str, Any]:
        """Verify checkpoint integrity and replay its exact historical learning prefix."""
        if not isinstance(checkpoint, dict):
            return {"valid": False, "reason": "checkpoint_not_object"}
        if checkpoint.get("schema") != "omega.learning.checkpoint.v1":
            return {"valid": False, "reason": "checkpoint_schema_mismatch"}
        if checkpoint.get("canonical_mutation") is not False:
            return {"valid": False, "reason": "canonical_authority_violation"}
        try:
            _validate_state_binding(checkpoint.get("state_id"), checkpoint.get("state_digest"))
        except ValueError as exc:
            return {"valid": False, "reason": f"invalid_state_binding: {exc}"}
        expected_hash = _checkpoint_hash(checkpoint)
        if checkpoint.get("checkpoint_hash") != expected_hash:
            return {"valid": False, "reason": "checkpoint_hash_mismatch"}
        sequence = checkpoint.get("learning_sequence")
        if isinstance(sequence, bool) or not isinstance(sequence, int) or sequence < 0:
            return {"valid": False, "reason": "invalid_learning_sequence"}
        replay = self.verify(max_seq=sequence)
        if not replay.get("valid"):
            return {"valid": False, "reason": "learning_replay_failed", "replay": replay}
        if replay.get("head") != checkpoint.get("learning_head"):
            return {"valid": False, "reason": "learning_head_mismatch", "replay": replay}
        return {
            "valid": True,
            "state_id": checkpoint["state_id"],
            "state_digest": checkpoint["state_digest"],
            "learning_sequence": sequence,
            "learning_head": checkpoint.get("learning_head"),
            "checkpoint_hash": checkpoint["checkpoint_hash"],
            "canonical_mutation": False,
            "replay": replay,
        }

    def _eligible(self, state_id: int, context_key: str, max_seq: int | None = None) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        rows = self._rows()
        verified = self._verify_rows(rows, max_seq=max_seq)
        if not verified.get("valid"):
            raise RuntimeError("learning journal verification failed")
        limit = max_seq if max_seq is not None else len(rows)
        selected = [
            row for row in rows
            if int(row["sequence"]) <= limit
            and int(row["state_id"]) == int(state_id)
            and row["context_key"] == context_key
        ]
        return selected, verified

    def predict(self, *, state_id: int, context_key: str, max_seq: int | None = None) -> dict[str, Any]:
        context_key = str(context_key).strip()
        with self._lock:
            rows, verified = self._eligible(state_id, context_key, max_seq=max_seq)
        if not rows:
            return {
                "status": "INSUFFICIENT_EVIDENCE",
                "state_id": state_id,
                "context_key": context_key,
                "recommendation": None,
                "samples": 0,
                "replay": verified,
                "canonical_mutation": False,
                "evidence_class": EvidenceClass.DERIVED.value,
            }

        stats: dict[str, dict[str, float | int]] = {}
        for row in rows:
            action = str(row["action"])
            bucket = stats.setdefault(action, {"count": 0, "reward_sum": 0.0})
            bucket["count"] = int(bucket["count"]) + 1
            bucket["reward_sum"] = float(bucket["reward_sum"]) + float(row["reward"])

        ranked = []
        for action, bucket in stats.items():
            count = int(bucket["count"])
            mean = float(bucket["reward_sum"]) / count
            score = mean * (count / (count + 1.0))
            ranked.append({
                "action": action,
                "count": count,
                "mean_reward": mean,
                "confidence_weighted_score": score,
            })
        ranked.sort(key=lambda row: (-row["confidence_weighted_score"], -row["count"], row["action"]))
        best = ranked[0]
        return {
            "status": "PASS",
            "state_id": state_id,
            "context_key": context_key,
            "recommendation": best["action"],
            "score": best["confidence_weighted_score"],
            "samples": len(rows),
            "alternatives": ranked,
            "replay": verified,
            "canonical_mutation": False,
            "evidence_class": EvidenceClass.DERIVED.value,
            "boundary": "adaptive recommendation only; OMEGA canonical runtime retains commit/admission authority",
        }

    def status(self) -> dict[str, Any]:
        verified = self.verify()
        return {
            "status": "PASS" if verified.get("valid") else "FAIL",
            "authority": "subordinate adaptive memory",
            "records": verified.get("records", 0),
            "head": verified.get("head"),
            "canonical_mutation": False,
            "replay": verified,
            "source_lineage": "Drive v31r1 adaptive_learning execution report; reimplemented under Genesis cloud governance",
        }
