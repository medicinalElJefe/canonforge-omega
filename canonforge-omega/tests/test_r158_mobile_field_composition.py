from pathlib import Path

SRC = Path('cloudflare/omega-v6-worker/src/sovereignVisualShell.ts')

def test_r158_mobile_field_has_single_navigation_authority_and_no_legacy_overlay_collision():
    s = SRC.read_text()
    assert 'MOBILE_FIELD_COMPOSITION_BOUNDARY' in s
    assert '#omegaDock,#omegaSpatialCore,#omegaContinuityRibbon,#omegaContextToggle{display:none!important}' in s
    assert 'omegaMobileLegacyUtility' in s
    for label in ('CALIBRATION / ABLATION','MEMORY / SCAR','RELATION WORKBENCH','STATE WORKBENCH','CAPABILITY ROUTER','LIVE CONVERGENCE'):
        assert label in s
    assert 'omegaMobileWorkspaceRail' in s
    assert '100svh' in s
    assert 'safe-area-inset-bottom' in s
    assert "document.documentElement.dataset.omegaMobileFieldComposition='r158'" in s

def test_r158_preserves_truth_boundaries():
    s = SRC.read_text()
    assert 'does not mutate canonical state' in s
    assert 'heartbeat truth' in s
    assert 'Earth source truth' in s
    assert 'route authority' in s
    assert 'execution authority' in s
