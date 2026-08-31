from __future__ import annotations

from hashlib import sha256
import hmac
import json
import time
from typing import Any


def _canonical(value: dict[str, Any]) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _key(token: str) -> bytes:
    token = str(token or "").strip()
    if len(token) < 32:
        raise ValueError("device token is too short for signed execution envelopes")
    return sha256(token.encode("utf-8")).digest()


def sign_job(job: dict[str, Any], device_token: str, *, issued_at_ms: int | None = None, ttl_ms: int = 120_000) -> dict[str, Any]:
    if not isinstance(job, dict) or not str(job.get("job_id", "")).strip():
        raise ValueError("job must contain job_id")
    if ttl_ms < 5_000 or ttl_ms > 300_000:
        raise ValueError("ttl_ms must be in 5000..300000")
    issued = int(time.time() * 1000) if issued_at_ms is None else int(issued_at_ms)
    envelope = {
        "schema": "omega.link.execution-envelope.v1",
        "job": job,
        "issued_at_ms": issued,
        "expires_at_ms": issued + ttl_ms,
        "nonce": sha256(f"{job['job_id']}:{issued}:{job.get('plan_fingerprint','')}".encode()).hexdigest()[:32],
    }
    envelope["signature"] = hmac.new(_key(device_token), _canonical(envelope), sha256).hexdigest()
    return envelope


def verify_job(envelope: dict[str, Any], device_token: str, *, now_ms: int | None = None, seen_nonces: set[str] | None = None) -> dict[str, Any]:
    if not isinstance(envelope, dict) or envelope.get("schema") != "omega.link.execution-envelope.v1":
        return {"valid": False, "reason": "schema_mismatch"}
    signature = str(envelope.get("signature", ""))
    unsigned = {k: v for k, v in envelope.items() if k != "signature"}
    expected = hmac.new(_key(device_token), _canonical(unsigned), sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return {"valid": False, "reason": "signature_mismatch"}
    current = int(time.time() * 1000) if now_ms is None else int(now_ms)
    issued = envelope.get("issued_at_ms")
    expires = envelope.get("expires_at_ms")
    if not isinstance(issued, int) or not isinstance(expires, int) or issued > current + 30_000:
        return {"valid": False, "reason": "invalid_issue_time"}
    if current > expires:
        return {"valid": False, "reason": "expired"}
    nonce = str(envelope.get("nonce", ""))
    if len(nonce) != 32:
        return {"valid": False, "reason": "invalid_nonce"}
    if seen_nonces is not None:
        if nonce in seen_nonces:
            return {"valid": False, "reason": "replay_detected"}
        seen_nonces.add(nonce)
    job = envelope.get("job")
    if not isinstance(job, dict) or not str(job.get("job_id", "")).strip():
        return {"valid": False, "reason": "invalid_job"}
    return {"valid": True, "job": job, "nonce": nonce, "expires_at_ms": expires, "canonical_mutation": False}
