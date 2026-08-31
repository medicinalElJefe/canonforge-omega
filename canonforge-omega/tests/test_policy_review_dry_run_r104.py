from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r104_review_contract_and_decisions():
    s=(SRC/'policyReviewDryRun.ts').read_text()
    for token in ['OMEGA_POLICY_REVIEW_DECISION_V1','OMEGA_POLICY_DRY_RUN_ENVELOPE_V1','OMEGA_POLICY_REVIEW_DRY_RUN_SET_V1','APPROVE_FOR_DRY_RUN','HOLD','REJECT','ROLLBACK','explicit_review_required:true','dry_run_is_simulation_only:true','automatic_policy_change:false','production_rollout_authorized:false','execution_claimed:false','rollback_target_preserved:true']:
        assert token in s
    assert 'does not mutate canonical policy' in s
    assert 'authorize production rollout' in s

def test_r104_approval_only_creates_simulation_envelope():
    s=(SRC/'policyReviewDryRun.ts').read_text()
    assert 'const approved=decision==="APPROVE_FOR_DRY_RUN"' in s
    assert 'simulation_only:true' in s
    assert 'execution:false' in s
    assert 'canonical_policy_mutation:false' in s
    assert 'review_requires_known_candidate_decision_reviewer_reason' in s
    assert 'policy_candidate_id_not_in_current_packet_set' in s

def test_r104_exposed_and_prior_schema_identities_preserved():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'u.pathname==="/api/calibration/policy-review"' in s
    assert 'Review + dry-run' in s
    for token in ['OMEGA_POLICY_REVIEW_DRY_RUN_SET_V1','OMEGA_GOVERNED_POLICY_CANDIDATE_PACKET_V1','OMEGA_OPERATOR_TRIAL_ADJUDICATION_V1','OMEGA_GOVERNED_OPERATOR_TRIAL_PLAN_V1','OMEGA_EVIDENCE_WEIGHTED_OPERATOR_PORTFOLIO_V1','OMEGA_HELD_OUT_ABLATION_LAB_V1','CALIBRATION_SCHEMA="OMEGA_CALIBRATION_LEARNING_WORKBENCH_V1"']:
        assert token in s
