from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r101_trial_plan_contract():
    s=(SRC/'operatorTrialPlanner.ts').read_text()
    for token in ['OMEGA_GOVERNED_OPERATOR_TRIAL_PLAN_V1','READY_FOR_PREREGISTERED_TRIAL','metric_fixed_before_future_observations:true','success_threshold_fixed:true','harm_threshold_fixed:true','rollback_declared:true','automatic_execution:false','automatic_policy_change:false','causation_claimed:false','preregistered_before_observation:true']:
        assert token in s
    assert 'do not execute operators' in s
    assert 'do not claim predictive improvement before held-out observations' in s

def test_r101_declares_baseline_candidate_and_stop_conditions():
    s=(SRC/'operatorTrialPlanner.ts').read_text()
    for token in ['baseline_stack','candidate_stack','minimum_observations','maximum_observations','success_condition','falsification_condition','STOP_SUCCESS','STOP_HARM','STOP_BUDGET','rollback']:
        assert token in s

def test_r101_exposed_without_changing_prior_schema_identities():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'u.pathname==="/api/calibration/trial-plan"' in s
    assert 'Plan preregistered trial' in s
    assert 'OMEGA_GOVERNED_OPERATOR_TRIAL_PLAN_V1' in s
    assert 'CALIBRATION_SCHEMA="OMEGA_CALIBRATION_LEARNING_WORKBENCH_V1"' in s
    assert 'OMEGA_HELD_OUT_ABLATION_LAB_V1' in s
    assert 'OMEGA_EVIDENCE_WEIGHTED_OPERATOR_PORTFOLIO_V1' in s
