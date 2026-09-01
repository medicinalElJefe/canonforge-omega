from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r146_native_atlas_matches_supplied_corpus_contract():
    native = (SRC / "native20736Atlas.ts").read_text(encoding="utf-8")
    assert '460d56a51be0115347574ebbebd5a2b2bad0e46b1bd75c266f954e9ad742e975' in native
    for token in ['478922','20736','248832','165888','22608','antipode','atlasNeighbors']:
        assert token in native
    assert 'not a physical dimension' in native or 'as physical dimensions' in native


def test_r146_unifies_visual_computation_and_ai_on_one_atlas_context():
    umr = (SRC / "unifiedMotionRelativity.ts").read_text(encoding="utf-8")
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'r146-unified-motion-relativity-runtime' in wrapper
    assert 'enhanceGovernedModeAtlas(rendered)' in wrapper
    assert 'enhanceUnifiedMotionRelativity(rendered)' in wrapper
    assert wrapper.index('enhanceGovernedModeAtlas(rendered)') < wrapper.index('enhanceUnifiedMotionRelativity(rendered)')
    assert 'VISUAL ⇄ COMPUTE ⇄ AI' in umr
    assert 'atlas_context' in umr
    assert '/api/route-preview' in umr
    assert '/api/chat' in umr
    assert 'window.OMEGA_ATLAS_CONTEXT' in umr
    assert "old.replaceWith(canvas)" in umr


def test_r146_preserves_truth_and_authority_boundaries():
    umr = (SRC / "unifiedMotionRelativity.ts").read_text(encoding="utf-8")
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'OBSERVED_RUNTIME_WHEN_AVAILABLE' in umr
    assert 'DERIVED_FRAMEWORK_MATH' in umr
    assert 'USER_DEFINED_MODEL' in umr
    assert 'UTC render time is not evidence time' in wrapper
    assert 'heartbeatTruth' in wrapper
    assert 'OmegaRuntime' in wrapper
    body = wrapper.split('export async function enhanceVirtualLatticeDisplay', 1)[1]
    assert 'await enhanceIndividualSkinRelativity' not in body
    assert 'await enhanceUltraQualityView' not in body
    assert 'await enhanceHighDetail20736Field' not in body
    assert 'await enhanceLivePhaseVisual' not in body
