from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r148_memory_is_state_bound_navigable_and_non_authoritative():
    memory = (SRC / "memoryContinuityGraph.ts").read_text(encoding="utf-8")
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'r148-memory-continuity-graph' in wrapper
    assert 'enhanceMemoryContinuityGraph(rendered)' in wrapper
    assert '/api/omega/state' in memory
    assert 'CONTINUITY / SCAR / RELATION GRAPH' in memory
    assert 'omcTimeline' in memory
    assert 'canvas.addEventListener(\'click\'' in memory
    assert 'OPEN INTELLIGENCE' in memory
    assert 'HAND OFF TO FORECAST' in memory
    assert 'Memory samples valid canonical /api/omega/state responses' in memory
    assert 'DERIVED_FRAMEWORK_MATH' in memory
    assert 'not canonical metrics or empirical observations' in memory


def test_r148_preserves_calculus_and_truth_boundaries():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'r147-calculus-field-renderer' in wrapper
    assert 'finite-difference gradient' in wrapper
    assert 'Hessian/Laplacian curvature' in wrapper
    assert 'RK2 integral trajectories' in wrapper
    assert 'heartbeatTruth' in wrapper
    assert 'OmegaRuntime' in wrapper
    assert 'Hybrid/Genesis authority boundaries' in wrapper
    assert 'does not claim physical 20,736 dimensions' in wrapper
