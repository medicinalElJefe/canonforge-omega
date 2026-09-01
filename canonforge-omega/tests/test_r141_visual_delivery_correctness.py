from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "canonforge-omega" / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def test_r141_binds_integrity_after_visual_layers_without_new_authority():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    integrity = (SRC / "visualRuntimeIntegrity.ts").read_text(encoding="utf-8")
    assert 'VISUAL_DELIVERY_RELEASE' in wrapper
    assert 'enhanceVisualRuntimeIntegrity(rendered)' in wrapper
    assert wrapper.index('enhanceLivePhaseVisual(rendered)') < wrapper.index('enhanceVisualRuntimeIntegrity(rendered)')
    assert 'does not mutate canonical state' in integrity
    assert 'UTC, phase, relativity-depth and individual-skin markers' in integrity
    assert 'omegaVisualIntegrity' in integrity


def test_r141_public_delivery_workflow_proves_actual_root_html_and_headers():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        'omegaRootSovereignField',
        'omegaIndividualSkinRelativity',
        'omegaVisualRuntimeIntegrity',
        'x-omega-visual-release',
        'x-omega-visual-contract',
        'cache-control: no-store, no-cache, must-revalidate',
        'PUBLIC_VISUAL_DELIVERY_VERIFIED',
    ]:
        assert marker in workflow
    assert '/?view=Field&delivery_probe=$GITHUB_SHA' in workflow
