from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_desktop_link_consumes_signed_envelopes():
    text = (ROOT / "omega_genesis" / "desktop_link.py").read_text(encoding="utf-8")
    assert '"execution_protocol": "SIGNED_ENVELOPE_V1"' in text
    assert 'envelope = nxt.get("envelope")' in text
    assert "verify_job(envelope, token" in text
    assert 'nxt.get("job")' not in text


def test_windows_launcher_reuses_existing_v90_root():
    text = (ROOT / "START_OMEGA_DESKTOP_LINK.ps1").read_text(encoding="utf-8")
    assert 'OMEGA\\hybrid-link.json' in text
    assert "Recovered existing OMEGA V90-R4 approved root" in text
    assert '"-m","omega_genesis.desktop_link"' in text
