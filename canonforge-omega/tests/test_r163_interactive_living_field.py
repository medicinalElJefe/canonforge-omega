from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_r163_field_uses_one_renderer_and_real_view_controls():
    atlas = text("governedModeAtlas.ts")
    motion = text("unifiedMotionRelativity.ts")

    assert atlas.count('id="gmaCanvas"') == 1
    for control in [
        "gmaModeToggle",
        "gmaDetailsToggle",
        "gmaPause",
        "gmaReset",
        "gmaFullscreen",
    ]:
        assert control in atlas

    for interaction in [
        "pointerdown",
        "pointermove",
        "wheel",
        "pinch",
        "omega-field-reset",
        "omegaFieldFrame",
        "seedParticles",
        "renderParticles",
        "requestAnimationFrame(draw)",
    ]:
        assert interaction in motion

    assert "requestAnimationFrame" not in atlas
    assert "one presentation-only governed Field renderer" in atlas


def test_r163_field_is_canvas_first_with_progressive_controls():
    atlas = text("governedModeAtlas.ts")
    environment = text("omegaEnvironmentShell.ts")

    assert "gma-modes-open" in atlas
    assert "gma-details-open" in atlas
    assert "DRAG TO EXPLORE · WHEEL / PINCH TO ZOOM · DOUBLE-TAP TO RESET" in atlas
    assert "html.omega-root-field-active .top" in environment
    assert "html.omega-root-field-active .nav" in environment
    assert "html.omega-root-field-active #omegaSpatialCore" in environment
    assert "html.omega-root-field-active .surface.app[data-view=\"Field\"]" in environment
    assert "html.omega-root-field-active #omegaLivePhaseRail" in environment
    assert "html.omega-root-field-active #omegaViewAtlasToggle" in environment
    assert "html.omega-root-field-active #omegaViewAtlas" in environment
    assert "html.omega-root-field-active #orsfIntegrity" in environment
    assert "html.omega-root-field-active .work>.crumb" in environment
    assert "bottom:max(8px,env(safe-area-inset-bottom))" in environment
    assert "omegaFieldChrome='r163'" in environment


def test_r163_integrity_uses_the_live_field_frame_not_retired_skin():
    integrity = text("visualRuntimeIntegrity.ts")
    assert "omegaFieldExperience==='r163'" in integrity
    assert "omegaFieldFrame" in integrity
    assert "fieldActive?fieldFrame:skin" in integrity


def test_r163_preserves_worker_authority_and_declares_field_contract():
    wrapper = text("virtualLatticeDisplay.ts")
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text(
        encoding="utf-8"
    )

    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'INTERACTIVE_FIELD_RELEASE = "r163-immersive-living-field"' in wrapper
    assert 'headers.set("x-omega-field-release", INTERACTIVE_FIELD_RELEASE)' in wrapper
    assert "single-renderer+drag-pan+wheel-pinch-zoom+probe+pause-reset" in wrapper
    assert "heartbeatTruth" in wrapper
    assert "OmegaRuntime" in wrapper
