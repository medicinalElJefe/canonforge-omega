from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_timeline_truth_boundaries():
    s=(SRC/'timelineForecast.ts').read_text()
    assert 'OMEGA_UNIFIED_TIMELINE_CORRIDOR_V1' in s
    assert 'SIMULATED_CONTINUATION' in s
    assert 'counterfactuals_are_observations:false' in s
    assert 'causation_claimed:false' in s
    assert 'independently_validated:false' in s
    assert 'not observed futures' in s

def test_timeline_exposes_baseline_and_calibration():
    s=(SRC/'timelineForecast.ts').read_text()
    assert 'baseline_brier' in s
    assert 'held_out_branch_validation:false' in s
    assert 'memoryless' in s and 'memory_aware' in s
    assert 'delta_from_baseline' in s

def test_timeline_is_subordinate_to_existing_memory_dispatch():
    w=(SRC/'memoryWorkbench.ts').read_text()
    assert '"/timeline"' in w
    assert '"/api/timeline/evaluate"' in w
    assert '"/api/timeline/schema"' in w
    assert 'handleMemoryWorkbenchRequest' in w

def test_canonical_heartbeat_entrypoint_remains_protected():
    wr=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text()
    assert 'main = "src/heartbeatTruth.ts"' in wr

def test_prior_surfaces_remain_in_router():
    r=(SRC/'capabilityRouter.ts').read_text()
    assert 'handleMemoryWorkbenchRequest' in r
    assert 'handleRelationWorkbenchRequest' in r
    assert 'handleStateWorkbenchRequest' in r
