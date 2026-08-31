from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

from omega_genesis.sovereign_status import build_status, read_status, validate_status, write_status


def test_status_contract_is_noncanonical_and_zero_paid_dependency():
    payload = build_status("AUTHORING", model="local-model")
    assert payload["status"] == "AUTHORING"
    assert payload["active"] is True
    assert payload["canonical_mutation"] is False
    assert payload["paid_external_ai_required"] is False
    assert payload["external_paid_ai_fallback"] is False
    assert validate_status(payload) == []


def test_missing_status_never_claims_connected_host(tmp_path: Path):
    result = read_status(tmp_path / "missing.json")
    assert result["observed"] is False
    assert result["stale"] is True
    assert result["status"] == "IDLE"
    assert "absence is not evidence" in result["boundary"]


def test_atomic_write_and_freshness(tmp_path: Path):
    path = tmp_path / "status.json"
    observed = datetime(2026, 8, 31, 3, 0, tzinfo=timezone.utc)
    write_status(path, "PROMOTED", observed_at=observed.isoformat(), promoted_sha="a" * 40)
    fresh = read_status(path, stale_after_seconds=3600, now=observed + timedelta(minutes=30))
    stale = read_status(path, stale_after_seconds=3600, now=observed + timedelta(hours=2))
    assert fresh["observed"] is True
    assert fresh["stale"] is False
    assert stale["stale"] is True
    assert fresh["promoted_sha"] == "a" * 40


def test_invalid_status_is_quarantined(tmp_path: Path):
    path = tmp_path / "status.json"
    path.write_text('{"schema":"bad","status":"PROMOTED","observed_at":"nope"}', encoding="utf-8")
    result = read_status(path)
    assert result["status"] == "QUARANTINE"
    assert result["observed"] is True
    assert result["stale"] is True
    assert result["canonical_mutation"] is False
