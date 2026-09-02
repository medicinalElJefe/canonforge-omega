from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r145_uses_one_governed_projection_surface_and_existing_modes():
    atlas = (SRC / "governedModeAtlas.ts").read_text(encoding="utf-8")
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'r145-governed-mode-atlas' in wrapper
    assert 'enhanceGovernedModeAtlas(rendered)' in wrapper
    assert atlas.count('<canvas id="gmaCanvas"') == 1
    for mode in [
        'full-overall-canon', 'mode-188', 'unified-coherence', 'forecast',
        'full-sphere', 'relational-skin', 'dewey-calculus', 'unified-recursion',
        'deep-mother', 'high-father', 'heavy-prune', 'alpha', 'crimson',
        'no-nothing-truth', 'guidance-field'
    ]:
        assert mode in atlas


def test_r145_keeps_runtime_truth_separate_from_model_geometry():
    atlas = (SRC / "governedModeAtlas.ts").read_text(encoding="utf-8")
    assert '/api/convergence/edge' in atlas
    assert '/api/omega/state' in atlas
    assert 'USER_DEFINED_MODEL' in atlas
    assert 'CANONICAL STATE:' in atlas
    assert 'omegaCanonicalState' in atlas
    assert 'derived presentation, not observed evidence' in atlas
    assert 'not a physical dimension claim' in atlas
    assert 'Date.now()' in atlas


def test_r145_does_not_restore_retired_primary_overlay_calls():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    body = wrapper.split('export async function enhanceVirtualLatticeDisplay', 1)[1]
    assert 'await enhanceIndividualSkinRelativity' not in body
    assert 'await enhanceUltraQualityView' not in body
    assert 'await enhanceHighDetail20736Field' not in body
    assert 'await enhanceLivePhaseVisual' not in body
