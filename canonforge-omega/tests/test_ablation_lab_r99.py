from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_calibration_is_routed():
    s=(SRC/'capabilityRouter.ts').read_text()
    assert 'handleCalibrationWorkbenchRequest' in s
    assert 'href="/calibration"' in s
    assert 'CALIBRATION / ABLATION' in s

def test_ablation_contract_is_held_out_and_non_mutating():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    for token in ['OMEGA_HELD_OUT_ABLATION_LAB_V1','held_out_minimum_5_required','with_operator_brier','without_operator_brier','held_out_brier_lift','causation_claimed:false','automatic_canonical_weight_mutation:false','historical_predictions_rewritten:false']:
        assert token in s
    assert '/api/calibration/ablation' in s
    assert 'without_operator_brier - with_operator_brier > 0.01' in s

def test_prior_governance_boundaries_remain():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'not causal proof' in s
    assert 'not automatic operator-weight mutation' in s
    r=(SRC/'capabilityRouter.ts').read_text()
    for token in ['route_before_generation: true','execution: false','canonical_mutation:false','native_execution:false','capability_not_in_current_genome']:
        assert token in r
