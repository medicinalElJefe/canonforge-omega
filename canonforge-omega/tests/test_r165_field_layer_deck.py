from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_r165_layer_deck_is_real_and_non_destructive():
    atlas = text("governedModeAtlas.ts")
    motion = text("unifiedMotionRelativity.ts")

    for marker in [
        'id="gmaLayerToggle"',
        'data-gma-layer="field"',
        'data-gma-layer="contours"',
        'data-gma-layer="flow"',
        'data-gma-layer="particles"',
        'data-gma-layer="trajectory"',
        "omega-field-layer",
        "gma-layers-open",
        'id="gmaLayers"',
    ]:
        assert marker in atlas

    assert "layers:{field:true,contours:true,flow:true,particles:true,trajectory:true}" in motion
    assert "if(state.layers.field)paintField(S)" in motion
    assert "if(state.layers.contours)renderContours(S)" in motion
    assert "if(state.layers.flow)renderFlow(S)" in motion
    assert "if(state.layers.particles)renderParticles(S,dt)" in motion
    assert "if(state.layers.trajectory)renderTrajectory(S,now)" in motion


def test_r165_layer_switches_do_not_change_canonical_packet_or_solver():
    atlas = text("governedModeAtlas.ts")
    motion = text("unifiedMotionRelativity.ts")

    assert "These switches change presentation cost and visibility only." in atlas
    assert "They do not alter canonical state, mode choice, calculus coefficients, evidence class or route authority." in atlas
    assert "finite_difference + RK2 integral curves" in motion
    assert "view:{center:[state.viewX,state.viewY],zoom:state.zoom,probe:sample,user_interacted:state.interacted,layers:{...state.layers}}" in motion
    assert "omegaFieldQuality" in motion
    assert "omegaFieldLayers" in atlas
    assert "omegaFieldLayers" in motion


def test_r165_preserves_r164_depth_and_r163_interaction():
    field = text("fieldExperience.ts")
    environment = text("omegaEnvironmentShell.ts")
    motion = text("unifiedMotionRelativity.ts")

    assert "r164-depth-preserving" in environment
    assert "omega-field-panel-open" in field
    for marker in ["pointerdown", "pointermove", "wheel", "pinch", "omega-field-reset"]:
        assert marker in motion


def test_r165_public_delivery_contract_requires_layer_deck():
    wrapper = text("virtualLatticeDisplay.ts")
    workflow = (ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml").read_text(encoding="utf-8")

    assert 'FIELD_LAYER_RELEASE = "r165-non-destructive-layer-deck"' in wrapper
    assert 'headers.set("x-omega-field-layer-release", FIELD_LAYER_RELEASE)' in wrapper
    assert "independent-layer-deck" in wrapper
    assert "EXPECTED_FIELD_LAYER_RELEASE: r165-non-destructive-layer-deck" in workflow
    assert "x-omega-field-layer-release" in workflow
    assert "gmaLayerToggle" in workflow
    assert "omega-field-layer" in workflow
    assert "omegaFieldLayers" in workflow
