from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "canonforge-omega" / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def test_r143_wires_ultra_quality_after_geometry_without_new_authority():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    ultra = (SRC / "ultraQualityView.ts").read_text(encoding="utf-8")
    assert 'r143-ultra-quality-view' in wrapper
    assert 'enhanceIndividualSkinRelativity(rendered)' in wrapper
    assert 'enhanceUltraQualityView(rendered)' in wrapper
    assert wrapper.index('enhanceIndividualSkinRelativity(rendered)') < wrapper.index('enhanceUltraQualityView(rendered)')
    assert 'presentation-only high-fidelity compositor' in ultra
    assert 'device-DPR 3' in wrapper
    assert 'omegaUltraQuality' in ultra
    assert 'omegaRenderDpr' in ultra
    assert 'omegaViewQuality' in ultra
    assert 'canonical state' in ultra
    assert 'physical dimensions' in ultra
    assert 'physical pixels' in ultra


def test_r143_public_delivery_requires_ultra_quality_markers():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        'r143-ultra-quality-view',
        'omegaUltraQualityView',
        'orsfUltraQuality',
        'root+micro-macro-skin+ultra-quality+phase+integrity-v3',
        'PUBLIC_VISUAL_DELIVERY_VERIFIED',
    ]:
        assert marker in workflow
