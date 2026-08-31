from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES

ROOT = Path(__file__).resolve().parents[1]


def test_signed_hybrid_link_capability_is_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    cap = rows["CAP-021"]
    assert cap["status"] == "LIVE_CORE"
    assert "signed" in cap["name"].lower()
    assert "replay" in cap["name"].lower()


def test_guided_link_ui_is_pair_first_mobile_safe_and_truth_bounded():
    source = (ROOT / "web" / "cloud.js").read_text(encoding="utf-8")
    assert "Connect your PC to OMEGA" in source
    assert "Create secure pair" in source
    assert "Copy PC command" in source
    assert "PC connected and authenticated" in source
    assert "No device is claimed online until an authenticated heartbeat is actually observed" in source
    assert "The browser cannot silently launch software on your PC" in source
    assert "sessionStorage" in source
    assert "localStorage" not in source
    assert "@media(max-width:520px)" in source
    assert "Advanced · typed Hybrid plan tools" in source


def test_worker_signing_canonicalizes_nested_job_payload():
    source = (ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "link.js").read_text(encoding="utf-8")
    assert "function canonicalJson(value)" in source
    assert "Object.keys(value).sort()" in source
    assert "execution_protocol!==\"SIGNED_ENVELOPE_V1\"" in source
    assert "return{envelope:await signEnvelope" in source
