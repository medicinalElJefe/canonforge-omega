from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_recovered_experience_is_final_compositor():
    delivery = text("virtualLatticeDisplay.ts")
    recovered = text("recoveredExperienceOrchestrator.ts")
    assert 'enhanceRecoveredExperience' in delivery
    assert delivery.index('enhanceVisualRuntimeIntegrity(rendered)') < delivery.index('enhanceRecoveredExperience(rendered)')
    assert 'recovered-r159' in recovered
    assert 'primary-living-field' in recovered
    assert 'primary-mobile-navigation' in recovered
    assert 'governed-projection' in recovered


def test_mobile_has_one_navigation_authority_and_no_overlay_collision():
    recovered = text("recoveredExperienceOrchestrator.ts")
    for selector in ['#omegaDock', '#omegaSpatialCore', '#omegaContinuityRibbon', '#omegaContextToggle', '#omegaContextRail']:
        assert selector in recovered
    assert 'position:sticky!important;top:64px!important' in recovered
    assert '.surface.app[data-view="Field"]{display:none!important}' in recovered
    for label in ['CALIBRATION / ABLATION', 'MEMORY / SCAR', 'RELATION WORKBENCH', 'STATE WORKBENCH', 'CAPABILITY ROUTER', 'LIVE CONVERGENCE']:
        assert label in recovered


def test_truth_and_authority_boundaries_are_preserved():
    recovered = text("recoveredExperienceOrchestrator.ts")
    delivery = text("virtualLatticeDisplay.ts")
    assert 'does not mutate canonical state' in recovered
    assert 'heartbeat truth' in recovered
    assert 'Earth source truth' in recovered
    assert 'route authority' in recovered
    assert 'evidence classes' in recovered
    assert 'execution authority' in recovered
    assert 'PC ONLINE remains rendered only when the protected heartbeatTruth contract itself reports pc_online=true' in delivery
    assert 'does not claim physical 20,736 dimensions' in delivery
