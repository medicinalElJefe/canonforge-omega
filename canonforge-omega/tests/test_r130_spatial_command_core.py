from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'


def text(p): return p.read_text(encoding='utf-8')


def test_r130_preserves_protected_runtime_and_composes_beneath_r129():
    w=text(WRANGLER); shell=text(SRC/'sovereignVisualShell.ts'); core=text(SRC/'spatialCommandCore.ts')
    assert 'main = "src/heartbeatTruth.ts"' in w
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in w
    assert 'enhanceSpatialCommandCore' in shell
    assert 'enhanceSovereignVisualShell' in shell
    assert 'navigation separate from visualization, state authority and chat' in core
    assert 'existing governed route' in core


def test_r135_navigation_preserves_real_v6_surfaces_without_becoming_state_authority():
    core=text(SRC/'spatialCommandCore.ts')
    for token in ['/?view=Field','/?view=Calculus','/?view=Memory','/?view=Simulate','/?view=Earth','/?view=Assistant','/?view=Hybrid','/?view=Proof','/core','/relations','/evolution','/convergence']:
        assert token in core
    assert '/api/convergence/edge' in core
    assert 'authority_contract_ready' in core
    assert 'route-contract readiness only' in core
    assert 'Chat/text output remains a separate channel' in core


def test_r135_visual_renderer_is_bound_but_not_reimplemented_in_navigation():
    core=text(SRC/'spatialCommandCore.ts')
    visual=text(SRC/'livePhaseVisual.ts')
    lattice=text(SRC/'virtualLatticeDisplay.ts')
    assert 'enhanceArchiveRecoveredWorkstation' in core
    assert 'enhanceVirtualLatticeDisplay' in core
    assert 'enhanceLivePhaseVisual' in core
    assert 'OMEGA compact workspace switcher' in core
    assert 'VISUAL COMPUTATION CHANNEL' in visual
    assert 'TEXT / CHAT CHANNEL' in visual
    assert '61,917,364,224' in lattice
    assert 'does not claim a physical 61.9-billion-pixel panel' in lattice
