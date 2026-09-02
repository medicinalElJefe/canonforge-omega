from pathlib import Path

SRC = Path(__file__).parents[1] / "cloudflare" / "omega-v6-worker" / "src" / "visualRuntimeIntegrity.ts"


def source() -> str:
    return SRC.read_text(encoding="utf-8")


def test_r153_preserves_visual_integrity_and_truth_boundaries():
    s = source()
    assert "omegaVisualRuntimeIntegrityRuntime" in s
    assert "separates visual-render integrity from canonical-state availability" in s
    assert "does not mutate canonical state" in s
    assert "heartbeat truth" in s
    assert "Earth source truth" in s
    assert "route authority" in s
    assert "representational shell markers are not evidence" in s


def test_mobile_workspace_navigation_is_stateful_and_direct():
    s = source()
    for view in ("Field", "Calculus", "Earth", "Memory", "Assistant", "Simulate", "Hybrid", "Proof"):
        assert f'data-app="{view}"' in s
    assert "omega:lastWorkspace" in s
    assert "URL(location.href)" in s
    assert "history.replaceState" in s
    assert "popstate" in s
    assert "omegaWorkspace" in s


def test_mobile_composition_is_not_squeezed_desktop():
    s = source()
    assert "omegaMobileWorkspaceRail" in s
    assert "omegaMobileContext" in s
    assert "@media(max-width:760px)" in s
    assert "touchstart" in s and "touchend" in s
    assert "safe-area-inset-bottom" in s
    assert "roleToolbar" in s
    assert "overflow-x:auto" in s


def test_proof_is_progressively_disclosed_without_deleting_evidence():
    s = source()
    assert "omegaProofToggle" in s
    assert "omegaExpertProof" in s
    assert "details.proof" in s
    assert "HIDE EXPERT" in s
    assert "EXPERT PROOF" in s
