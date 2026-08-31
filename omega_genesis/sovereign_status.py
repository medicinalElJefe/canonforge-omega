from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

SCHEMA = "omega.sovereign.evolution.host.v1"
ALLOWED_STATUSES = frozenset({
    "IDLE",
    "VERIFYING_BASELINE",
    "AUTHORING",
    "TESTING_CANDIDATE",
    "JUDGING",
    "PROMOTING",
    "PROMOTED",
    "LOCAL_MODEL_UNAVAILABLE",
    "BLOCKED_LOCAL_TOOLING",
    "CANDIDATE_REJECTED",
    "SUPERSEDED",
    "PROMOTION_PUSH_BLOCKED",
    "QUARANTINE",
})
ACTIVE_STATUSES = frozenset({
    "VERIFYING_BASELINE",
    "AUTHORING",
    "TESTING_CANDIDATE",
    "JUDGING",
    "PROMOTING",
})


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def build_status(status: str, **fields: Any) -> dict[str, Any]:
    status = str(status).strip().upper()
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"unsupported sovereign host status: {status}")
    payload: dict[str, Any] = {
        "schema": SCHEMA,
        "status": status,
        "observed_at": fields.pop("observed_at", now_iso()),
        "authority": "sovereign-host-observation",
        "canonical_mutation": False,
        "paid_external_ai_required": False,
        "external_paid_ai_fallback": False,
        "active": status in ACTIVE_STATUSES,
    }
    payload.update(fields)
    return payload


def validate_status(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if payload.get("schema") != SCHEMA:
        errors.append("schema")
    if payload.get("status") not in ALLOWED_STATUSES:
        errors.append("status")
    try:
        _parse_time(str(payload.get("observed_at", "")))
    except Exception:
        errors.append("observed_at")
    if payload.get("authority") != "sovereign-host-observation":
        errors.append("authority")
    if payload.get("canonical_mutation") is not False:
        errors.append("canonical_mutation")
    if payload.get("paid_external_ai_required") is not False:
        errors.append("paid_external_ai_required")
    if payload.get("external_paid_ai_fallback") is not False:
        errors.append("external_paid_ai_fallback")
    return errors


def write_status(path: Path, status: str, **fields: Any) -> dict[str, Any]:
    path = Path(path)
    payload = build_status(status, **fields)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp.replace(path)
    return payload


def read_status(path: Path, *, stale_after_seconds: int = 5400, now: datetime | None = None) -> dict[str, Any]:
    path = Path(path)
    if not path.is_file():
        return {
            "schema": SCHEMA,
            "status": "IDLE",
            "authority": "sovereign-host-observation",
            "canonical_mutation": False,
            "paid_external_ai_required": False,
            "external_paid_ai_fallback": False,
            "active": False,
            "observed": False,
            "stale": True,
            "boundary": "no sovereign host status file has been observed; absence is not evidence of a connected host",
        }
    payload = json.loads(path.read_text(encoding="utf-8"))
    errors = validate_status(payload)
    if errors:
        return {
            "schema": SCHEMA,
            "status": "QUARANTINE",
            "authority": "sovereign-host-observation",
            "canonical_mutation": False,
            "paid_external_ai_required": False,
            "external_paid_ai_fallback": False,
            "active": False,
            "observed": True,
            "stale": True,
            "errors": errors,
            "boundary": "invalid host telemetry is quarantined and never promoted to canonical evidence",
        }
    current = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    observed = _parse_time(str(payload["observed_at"]))
    age = max(0.0, (current - observed).total_seconds())
    result = dict(payload)
    result.update({
        "observed": True,
        "age_seconds": round(age, 3),
        "stale": age > max(1, int(stale_after_seconds)),
    })
    return result
