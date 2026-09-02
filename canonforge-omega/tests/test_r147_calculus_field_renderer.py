from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r147_replaces_spoke_diagram_with_solved_field():
    umr = (SRC / "unifiedMotionRelativity.ts").read_text(encoding="utf-8")
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'r147-calculus-field-renderer' in wrapper
    for token in [
        'function potential(',
        'function differential(',
        'fxx=',
        'fyy=',
        'fxy=',
        'lap=fxx+fyy',
        'function velocity(',
        'function integrate(',
        'finite_difference + RK2 integral curves',
        'gradient_magnitude',
        'gaussian_curvature',
        'SIMULATED_CONTINUATION',
        'DERIVED SURFACE',
    ]:
        assert token in umr


def test_r147_does_not_render_neighbor_spokes_as_primary_geometry():
    umr = (SRC / "unifiedMotionRelativity.ts").read_text(encoding="utf-8")
    assert "ctx.moveTo(fp[0],fp[1])" not in umr
    assert "ctx.lineTo(ap[0],ap[1])" not in umr
    assert "neighbors:S.neighbors" in umr
    assert "antipode:S.anti" in umr
    assert "mode coefficients are declared visualization weights, not empirical constants" in umr
    assert "Address/neighbors/antipode provide topology context" in umr


def test_r147_preserves_unified_ai_context_and_truth_boundaries():
    umr = (SRC / "unifiedMotionRelativity.ts").read_text(encoding="utf-8")
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    for token in ['VISUAL ⇄ COMPUTE ⇄ AI', 'atlas_context', '/api/route-preview', '/api/chat', 'window.OMEGA_ATLAS_CONTEXT']:
        assert token in umr
    for token in ['heartbeatTruth', 'OmegaRuntime', 'representational 12^n shells', 'UTC render time is not evidence time']:
        assert token in wrapper
