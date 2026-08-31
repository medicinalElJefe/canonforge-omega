from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r102_adjudication_contract():
    s=(SRC/'operatorTrialAdjudicator.ts').read_text()
    for token in ['OMEGA_OPERATOR_TRIAL_ADJUDICATION_V1','PROMOTE_CANDIDATE_FOR_GOVERNANCE_REVIEW','HOLD_INCOMPLETE','HOLD_NO_MATERIAL_LIFT','ROLLBACK_TO_BASELINE','production_rollout_authorized:false','canonical_policy_mutation:false','causation_claimed:false','thresholds_reinterpreted:false','failed_trials_preserved:true','rollback_target_preserved:true']:
        assert token in s
    assert 'cannot mutate canonical policy' in s
    assert 'authorize production rollout' in s

def test_r102_adjudicates_against_preregistered_thresholds():
    s=(SRC/'operatorTrialAdjudicator.ts').read_text()
    for token in ['baseline_brier','candidate_brier','minimum_observations','minimum_brier_lift','maximum_brier_harm','brier_lift','plan_id','provenance']:
        assert token in s

def test_r102_exposed_without_regressing_prior_layers():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'u.pathname==="/api/calibration/trial-adjudicate"' in s
    assert 'Adjudicate completed trial' in s
    for token in ['OMEGA_OPERATOR_TRIAL_ADJUDICATION_V1','OMEGA_GOVERNED_OPERATOR_TRIAL_PLAN_V1','OMEGA_EVIDENCE_WEIGHTED_OPERATOR_PORTFOLIO_V1','OMEGA_HELD_OUT_ABLATION_LAB_V1','CALIBRATION_SCHEMA="OMEGA_CALIBRATION_LEARNING_WORKBENCH_V1"']:
        assert token in s
