from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_hd_instrument_is_same_packet_direct_manipulation():
    hd = (SRC / "coreStudioHdInstrument.ts").read_text()
    preview = (SRC / "coreStudioModePreview.ts").read_text()
    assert "HIGH-DEFINITION STATE INSTRUMENT" in hd
    assert "omegaHdCanvas" in hd
    assert "devicePixelRatio" in hd
    assert "pointerdown" in hd and "pointermove" in hd and "pointerup" in hd
    assert "document.getElementById(ids[k])" in hd
    assert "document.getElementById('run')?.click()" in hd
    assert "omega:mode-preview" in hd
    assert "enhanceOperationalCoreHdInstrument" in preview


def test_hd_instrument_preserves_truth_boundaries():
    hd = (SRC / "coreStudioHdInstrument.ts").read_text()
    for phrase in [
        "same browser packet",
        "no second state path",
        "physical-dimension claim",
        "canonical mutation",
        "authenticated observation",
        "native execution",
        "learned weight",
        "production policy authority",
    ]:
        assert phrase in hd
    assert "USER_DEFINED_MODEL" in hd
    assert "projection only" in hd


def test_hd_instrument_has_professional_interaction_surfaces():
    hd = (SRC / "coreStudioHdInstrument.ts").read_text()
    assert 'data-focus="state"' in hd
    assert 'data-focus="forecast"' in hd
    assert 'data-focus="proof"' in hd
    assert "requestFullscreen" in hd
    assert "ResizeObserver" in hd
    assert "touch-action:none" in hd
    assert "@media(max-width:540px)" in hd


def test_heartbeat_entrypoint_is_unchanged():
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text()
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
