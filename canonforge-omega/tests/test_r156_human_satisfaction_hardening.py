from pathlib import Path

SRC = Path(__file__).parents[1] / "cloudflare" / "omega-v6-worker" / "src" / "visualRuntimeIntegrity.ts"


def source() -> str:
    return SRC.read_text(encoding="utf-8")


def test_r156_preserves_truth_and_authority_boundaries():
    s = source()
    assert "does not mutate canonical state" in s
    assert "heartbeat truth" in s
    assert "route authority" in s
    assert "Earth source truth" in s
    assert "representational shells" in s
    assert "UTC, phase, relativity-depth and individual-skin markers" in s


def test_mobile_has_one_primary_navigation_authority():
    s = source()
    assert ".nav,#omegaDock{display:none!important}" in s
    assert "omegaMobileWorkspaceRail" in s
    for view in ("Field", "Calculus", "Earth", "Memory", "Assistant", "Simulate", "Hybrid", "Build", "Proof"):
        assert f'data-app=\"{view}\"' in s
    assert "omegaMobileCommand" in s


def test_touch_and_accessibility_are_hardened():
    s = source()
    assert "viewport-fit=cover" in s
    assert "min-height:44px" in s
    assert ":focus-visible" in s
    assert "omegaA11yStatus" in s
    assert 'role=\"status\"' in s
    assert "touch-action:manipulation" in s
    assert "startTarget" in s
    assert "input,textarea,select,button,a,canvas" in s


def test_mobile_layout_is_intentional_not_squeezed_desktop():
    s = source()
    assert "grid-template-columns:1fr!important" in s
    assert "height:min(58vh,520px)!important" in s
    assert "@media(max-width:430px)" in s
    assert "controls{grid-template-columns:1fr!important}" in s
    assert "safe-area-inset-bottom" in s
