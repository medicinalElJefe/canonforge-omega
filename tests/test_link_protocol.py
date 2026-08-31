from __future__ import annotations

from omega_genesis.link_protocol import sign_job, verify_job

TOKEN = "a" * 48
JOB = {"job_id": "job-1", "plan_fingerprint": "f" * 64, "steps": [{"op": "READ_TEXT", "path": "README.md"}]}


def test_signed_job_roundtrip_and_replay_rejection():
    envelope = sign_job(JOB, TOKEN, issued_at_ms=1_000_000, ttl_ms=60_000)
    seen: set[str] = set()
    verified = verify_job(envelope, TOKEN, now_ms=1_010_000, seen_nonces=seen)
    assert verified["valid"] is True
    assert verified["job"] == JOB
    replay = verify_job(envelope, TOKEN, now_ms=1_020_000, seen_nonces=seen)
    assert replay == {"valid": False, "reason": "replay_detected"}


def test_tamper_and_expiry_are_rejected():
    envelope = sign_job(JOB, TOKEN, issued_at_ms=1_000_000, ttl_ms=60_000)
    envelope["job"] = {**JOB, "job_id": "tampered"}
    assert verify_job(envelope, TOKEN, now_ms=1_010_000)["reason"] == "signature_mismatch"
    expired = sign_job(JOB, TOKEN, issued_at_ms=1_000_000, ttl_ms=60_000)
    assert verify_job(expired, TOKEN, now_ms=1_060_001)["reason"] == "expired"
