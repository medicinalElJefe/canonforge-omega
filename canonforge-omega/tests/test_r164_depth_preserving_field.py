from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_r164_field_preserves_depth_instead_of_hiding_operator_layers():
    environment = text("omegaEnvironmentShell.ts")
    field = text("fieldExperience.ts")

    assert "r164-depth-preserving" in environment
    assert "omega-field-panel-open" in field
    assert "FIELD CONTROLS" in field
    assert "CLOSE CONTROLS" in field

    # Field may de-emphasize secondary instruments, but must not delete them.
    forbidden = [
        'html.omega-root-field-active .top,\nhtml.omega-root-field-active .nav,\nhtml.omega-root-field-active #omegaSpatialCore,\nhtml.omega-root-field-active #omegaMobileContext',
        'html.omega-field-focus #omegaSpatialCore,html.omega-field-focus #omegaLivePhaseRail{display:none!important}',
        'html.omega-field-focus .archiveWorkstation .awTop p,html.omega-field-focus .archiveWorkstation .awTruth{display:none}',
        'html.omega-field-focus .archiveWorkstation .awPanel{display:none}',
    ]
    combined = environment + field
    for marker in forbidden:
        if marker.startswith("html.omega-root-field-active .top"):
            assert marker + ',\nhtml.omega-root-field-active .omegaMobileWorkspaceRail' not in combined
            assert "{display:none!important}" not in environment.split("html.omega-root-field-active .top", 1)[1].split("html.omega-root-field-active .shell", 1)[0]
        else:
            assert marker not in combined

    assert "opacity:.22" in environment
    assert ".awTruth{display:grid}" in field
    assert "transform:translateY(calc(100% + 120px))" in field
    assert "html.omega-field-panel-open .archiveWorkstation .awPanel{transform:none}" in field


def test_r164_field_keeps_primary_stage_and_existing_interaction_contract():
    environment = text("omegaEnvironmentShell.ts")
    field = text("fieldExperience.ts")
    motion = text("unifiedMotionRelativity.ts")

    assert "min-height:calc(100svh - 104px)" in environment
    assert "border-radius:22px" in environment
    assert "drag · zoom · x-ray · replay · atlas remain available" in field
    for marker in ["pointerdown", "pointermove", "wheel", "pinch", "omega-field-reset"]:
        assert marker in motion
