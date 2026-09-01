from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r132_keeps_one_workspace_visual_plane():
    text = (SRC / "capabilityViewRestoration.ts").read_text(encoding="utf-8")
    assert 'data-omega-workspace' in text
    assert "#omegaSpatialCore" in text
    assert "view==='Field'" in text
    assert ".omegaRecoveredViews{display:none!important}" in text
    assert "ONE MACHINE · PURPOSE-SPECIFIC WORKSPACES" in text
    assert "Switch instruments without mixing their controls, information or visual grammar" in text


def test_r132_preserves_deep_routes_without_new_authority():
    text = (SRC / "capabilityViewRestoration.ts").read_text(encoding="utf-8")
    for route in ("/core", "/workbench", "/relations", "/memory", "/calibration", "/capabilities", "/camera", "/evolution", "/convergence"):
        assert route in text
    assert "no second runtime" in text
    assert "state authority" in text
    assert "mode engine" in text
    assert "execution path" in text
