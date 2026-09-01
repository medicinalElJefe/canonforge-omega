from pathlib import Path

SRC = Path(__file__).parents[1] / "cloudflare" / "omega-v6-worker" / "src" / "visualRuntimeIntegrity.ts"


def source() -> str:
    return SRC.read_text(encoding="utf-8")


def test_r157_preserves_protected_truth_boundaries():
    s = source()
    assert "does not mutate canonical state" in s
    assert "heartbeat truth" in s
    assert "route authority" in s
    assert "Earth source truth" in s
    assert "representational shells" in s
    assert "UTC, phase, relativity-depth and individual-skin markers" in s


def test_one_primary_navigation_authority_per_viewport():
    s = source()
    assert "@media(min-width:761px){#omegaDock{display:none!important}" in s
    assert ".nav>.group:not(.omegaPrimaryGroup),.nav>.navbtn{display:none!important}" in s
    assert "omegaPrimaryNav" in s
    assert "@media(max-width:760px)" in s
    assert ".nav,#omegaDock{display:none!important}" in s
    assert "omegaMobileWorkspaceRail" in s


def test_desktop_primary_navigation_has_complete_workspace_contract():
    s = source()
    for view in ("Field", "Calculus", "Earth", "Memory", "Assistant", "Simulate", "Hybrid", "Build", "Proof"):
        assert f"{view}:" in s or f"'{view}'" in s
    assert "ensureDesktopNav" in s
    assert "data-primary-app" in s
    assert "omegaPrimaryCommand" in s


def test_visible_recovery_feedback_is_present_and_non_authoritative():
    s = source()
    assert "omegaUxToast" in s
    assert "Network unavailable" in s
    assert "Network restored" in s
    assert "unhandledrejection" in s
    assert "A workspace action failed" in s
    assert "open Proof for diagnostics" in s
    assert "role=\"status\"" in s
