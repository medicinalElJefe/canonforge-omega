from pathlib import Path

from omega_runtime.pairing import PairingRegistry
from scripts.omega_sovereign_agent import normalize_root


def test_pairing_token_is_scoped_and_rotates(tmp_path: Path):
    registry = PairingRegistry(tmp_path / "pairing.json")
    assert registry.ready is False
    first = registry.issue("2026-08-31T00:00:00+00:00")
    assert registry.ready is True
    assert registry.generation == 1
    assert registry.validate(first) is True
    second = registry.issue("2026-08-31T00:01:00+00:00")
    assert registry.generation == 2
    assert registry.validate(first) is False
    assert registry.validate(second) is True


def test_root_normalizer_repairs_quoted_drive_root(monkeypatch):
    monkeypatch.setattr(Path, "resolve", lambda self: self)
    assert str(normalize_root('J:\\"')).rstrip('\\') == 'J:'
    assert str(normalize_root('"J:"')).rstrip('\\') == 'J:'
