from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_calibration_workbench_truth_boundary():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'OMEGA_CALIBRATION_LEARNING_WORKBENCH_V1' in s
    assert 'ABLATION_CANDIDATE' in s and 'RETAIN_FOR_TESTING' in s
    assert 'automatic_weight_change:false' in s
    assert 'causation_claimed:false' in s
    assert 'held_out_retest_required:true' in s

def test_timeline_binds_calibration_without_rewriting_r96_contract():
    s=(SRC/'timelineForecast.ts').read_text()
    assert 'OMEGA_UNIFIED_TIMELINE_CORRIDOR_V1' in s
    assert 'operator_calibration' in s
    assert 'evaluateCalibration' in s
    assert 'automatic_canonical_weight_mutation:false' in s
    assert 'counterfactuals_are_observations:false' in s

def test_calibration_is_computation_only():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'x-omega-authority":"computation-only' in s
    assert 'mutation:false' in s

def test_heartbeat_entrypoint_remains_canonical():
    wr=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text()
    assert 'main = "src/heartbeatTruth.ts"' in wr
