from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
import re
from typing import Iterable, Mapping, Sequence

SCHEMA = "omega.conversation.memory.v1"
MAX_TITLE = 160
MAX_SUMMARY = 4000
MAX_TURN_TEXT = 12000
MAX_TAGS = 24
MAX_TURNS = 80

_SECRET_PATTERNS = [
    re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._~+\-/=]{12,}"),
    re.compile(r"(?i)((?:api[_ -]?key|token|password|secret)\s*[:=]\s*)[^\s,;]{6,}"),
]
_WORD = re.compile(r"[a-z0-9][a-z0-9_'-]{1,}", re.I)
_IMPORTANCE = {
    "decision": (0.20, ("decide", "decision", "agreed", "choose", "selected", "final")),
    "commitment": (0.18, ("will", "commit", "must", "require", "promise", "deadline")),
    "goal": (0.16, ("goal", "objective", "want", "need", "build", "make")),
    "constraint": (0.16, ("constraint", "never", "avoid", "cannot", "do not", "must not")),
    "recovery": (0.12, ("rollback", "restore", "repair", "recover", "broken", "failure")),
    "identity": (0.10, ("canonical", "authority", "source", "proof", "version", "release")),
    "future": (0.08, ("next", "later", "future", "follow up", "continue", "pending")),
}


def canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def digest(value: object) -> str:
    return sha256(canonical_json(value).encode("utf-8")).hexdigest()


def redact(text: object, limit: int = MAX_TURN_TEXT) -> str:
    value = str(text or "").strip()[:limit]
    for pattern in _SECRET_PATTERNS:
        value = pattern.sub(lambda m: (m.group(1) if m.lastindex else "") + "[REDACTED]", value)
    return value


def tokens(text: object) -> set[str]:
    return {m.group(0).lower() for m in _WORD.finditer(str(text or "")) if len(m.group(0)) > 2}


def importance_score(text: object, *, explicit: bool = False) -> dict:
    value = redact(text, MAX_SUMMARY).lower()
    reasons: list[str] = []
    score = 0.15 if explicit else 0.0
    if explicit:
        reasons.append("explicit_user_save")
    for reason, (weight, needles) in _IMPORTANCE.items():
        if any(needle in value for needle in needles):
            score += weight
            reasons.append(reason)
    if len(value) >= 800:
        score += 0.05
        reasons.append("substantive_context")
    score = round(min(1.0, score), 4)
    return {"score": score, "reasons": reasons, "suggest_save": explicit or score >= 0.48}


def normalize_turns(turns: Sequence[Mapping[str, object]]) -> list[dict]:
    out: list[dict] = []
    for row in list(turns)[-MAX_TURNS:]:
        role = str(row.get("role") or "user").lower()
        if role not in {"user", "assistant", "system", "tool"}:
            role = "user"
        text = redact(row.get("text") or row.get("content"))
        if text:
            out.append({"role": role, "text": text})
    return out


def build_record(
    *,
    conversation_id: str,
    title: str,
    summary: str,
    turns: Sequence[Mapping[str, object]],
    tags: Iterable[object] = (),
    canonical_digest: str,
    created_at: str,
    previous_hash: str | None = None,
    explicit: bool = True,
) -> dict:
    cid = re.sub(r"[^a-zA-Z0-9._:-]", "-", str(conversation_id or ""))[:128].strip("-")
    if not cid:
        raise ValueError("conversation_id_required")
    if not re.fullmatch(r"[0-9a-f]{64}", str(canonical_digest or "")):
        raise ValueError("canonical_digest_invalid")
    clean_turns = normalize_turns(turns)
    clean_summary = redact(summary, MAX_SUMMARY)
    clean_title = redact(title, MAX_TITLE) or "Important conversation"
    clean_tags = sorted({redact(t, 64).lower() for t in tags if redact(t, 64)})[:MAX_TAGS]
    signal_text = "\n".join([clean_title, clean_summary, *(x["text"] for x in clean_turns)])
    importance = importance_score(signal_text, explicit=explicit)
    base = {
        "schema": SCHEMA,
        "conversation_id": cid,
        "title": clean_title,
        "summary": clean_summary,
        "turns": clean_turns,
        "tags": clean_tags,
        "importance": importance,
        "canonical_digest": canonical_digest,
        "created_at": str(created_at),
        "previous_hash": previous_hash,
        "archived": False,
        "canonical_mutation": False,
    }
    return {**base, "record_hash": digest(base)}


def verify_record(record: Mapping[str, object], *, expected_previous_hash: str | None = None) -> dict:
    if record.get("schema") != SCHEMA:
        return {"valid": False, "reason": "schema_mismatch"}
    if record.get("canonical_mutation") is not False:
        return {"valid": False, "reason": "canonical_mutation_boundary"}
    if expected_previous_hash is not None and record.get("previous_hash") != expected_previous_hash:
        return {"valid": False, "reason": "previous_hash_mismatch"}
    supplied = record.get("record_hash")
    base = dict(record)
    base.pop("record_hash", None)
    if supplied != digest(base):
        return {"valid": False, "reason": "record_hash_mismatch"}
    return {"valid": True, "record_hash": supplied}


def contextual_rank(query: object, records: Sequence[Mapping[str, object]], *, limit: int = 5) -> list[dict]:
    q = tokens(query)
    ranked: list[dict] = []
    if not q:
        return ranked
    for record in records:
        if record.get("archived") or not verify_record(record).get("valid"):
            continue
        hay = tokens(" ".join([
            str(record.get("title") or ""),
            str(record.get("summary") or ""),
            " ".join(map(str, record.get("tags") or [])),
        ]))
        overlap = sorted(q & hay)
        if not overlap:
            continue
        lexical = len(overlap) / max(1, len(q | hay))
        importance = float((record.get("importance") or {}).get("score", 0.0))
        score = round(min(1.0, lexical * 2.2 + importance * 0.28), 4)
        ranked.append({
            "conversation_id": record["conversation_id"],
            "title": record.get("title"),
            "summary": record.get("summary"),
            "tags": record.get("tags", []),
            "relevance": score,
            "why": {"matched_terms": overlap[:12], "importance": importance},
            "record_hash": record.get("record_hash"),
            "canonical_digest": record.get("canonical_digest"),
            "source_class": "SAVED_CONVERSATION_CONTEXT",
        })
    return sorted(ranked, key=lambda x: (-x["relevance"], x["conversation_id"]))[: max(0, min(int(limit), 20))]


def archive_record(record: Mapping[str, object]) -> dict:
    verified = verify_record(record)
    if not verified.get("valid"):
        raise ValueError(verified["reason"])
    base = dict(record)
    old_hash = base.pop("record_hash")
    base["archived"] = True
    base["previous_hash"] = old_hash
    return {**base, "record_hash": digest(base)}
