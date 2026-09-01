from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_r137_preserves_protected_worker_authority():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    heartbeat = (SRC / "heartbeatTruth.ts").read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert 'binding = "GENESIS"' in wrangler
    assert 'export { OmegaRuntime }' in heartbeat


def test_r137_delivers_archive_lattice_then_live_phase_beneath_visual_shell():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    shell = (SRC / "sovereignVisualShell.ts").read_text(encoding="utf-8")
    assert 'enhanceVirtualLatticeDisplay' in shell
    assert 'enhanceArchiveRecoveredWorkstation(response)' in wrapper
    assert 'enhanceVirtualLatticeDisplayCore(rendered)' in wrapper
    assert 'enhanceLivePhaseVisual(rendered)' in wrapper
    assert wrapper.index('enhanceArchiveRecoveredWorkstation(response)') < wrapper.index('enhanceVirtualLatticeDisplayCore(rendered)') < wrapper.index('enhanceLivePhaseVisual(rendered)')


def test_r137_exposes_public_visual_delivery_fingerprint_and_truth_boundary():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    core = (SRC / "virtualLatticeDisplayCore.ts").read_text(encoding="utf-8")
    archive = (SRC / "archiveRecoveredWorkstation.ts").read_text(encoding="utf-8")
    phase = (SRC / "livePhaseVisual.ts").read_text(encoding="utf-8")
    assert 'r137-live-visual-delivery' in wrapper
    assert 'x-omega-visual-release' in wrapper
    assert 'omegaVisualDeliveryRelease' in wrapper
    assert '61,917,364,224' in core
    assert 'omegaArchiveWorkstationStyle' in archive
    assert 'omegaLivePhaseVisualStyle' in phase
    for token in ('does not mutate canonical state', 'heartbeatTruth', 'representational 12^n shells'):
        assert token in wrapper
