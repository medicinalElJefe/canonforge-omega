from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "canonforge-omega" / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def test_r117_geometry_is_same_core_projection_only():
    geometry = (SRC / "coreStudioModeGeometry.ts").read_text(encoding="utf-8")
    preview = (SRC / "coreStudioModePreview.ts").read_text(encoding="utf-8")
    assert "REACTIVE MODE GEOMETRY · PROJECTION ONLY" in geometry
    assert "software visualization—not a physical-dimension claim" in geometry
    assert "does not create observations" in geometry
    assert "does not create observations" in geometry or "does not create observations" in geometry
    assert "canonical state" in geometry
    assert "omega:mode-preview" in preview
    assert "omega:mode-preview" in geometry
    assert "enhanceOperationalCoreGeometry" in preview
    assert "USER_DEFINED_MODEL" in geometry
    assert "SIMULATED_CONTINUATION" in geometry


def test_r117_semantic_anchors_and_state_driven_geometry_present():
    geometry = (SRC / "coreStudioModeGeometry.ts").read_text(encoding="utf-8")
    for anchor in ["ALPHA", "BASE", "CONSTRUCT", "PRUNE", "OMEGA"]:
        assert anchor in geometry
    for field in ["continuity", "plasticity", "contradiction", "burden"]:
        assert field in geometry
    for dispatch in ["STAY", "TURN", "ESCALATE"]:
        assert dispatch in geometry
    assert "@media(max-width:760px)" in geometry


def test_r117_preserves_r116_and_heartbeat_entrypoint():
    preview = (SRC / "coreStudioModePreview.ts").read_text(encoding="utf-8")
    wrangler = (WORKER / "wrangler.toml").read_text(encoding="utf-8")
    assert "modePreviewStudio" in preview
    assert "/api/core/mode-attribution" in preview
    assert "baseline untouched" in preview
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
