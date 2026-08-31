from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r103_packet_contract_is_proposal_only():
    s=(SRC/'policyCandidatePacket.ts').read_text()
    for token in ['OMEGA_GOVERNED_POLICY_CANDIDATE_PACKET_V1','OMEGA_GOVERNED_POLICY_CANDIDATE_SET_V1','policy_candidate_id','deterministic_packet_identity:true','explicit_governance_approval_required:true','automatic_policy_change:false','production_rollout_authorized:false','execution_claimed:false','causation_claimed:false','authority:"proposal-only"']:
        assert token in s
    assert 'do not mutate canonical policy' in s
    assert 'do not authorize rollout' in s

def test_r103_only_packages_eligible_adjudications():
    s=(SRC/'policyCandidatePacket.ts').read_text()
    assert 'PROMOTE_CANDIDATE_FOR_GOVERNANCE_REVIEW' in s
    assert 'failed_and_held_trials_preserved:true' in s
    for token in ['baseline_stack','candidate_stack','baseline_brier','candidate_brier','brier_lift','minimum_brier_lift','maximum_brier_harm','rollback','provenance']:
        assert token in s

def test_r103_exposed_without_regressing_prior_schema_identities():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'u.pathname==="/api/calibration/policy-candidate"' in s
    assert 'Build governance review packet' in s
    for token in ['OMEGA_GOVERNED_POLICY_CANDIDATE_PACKET_V1','OMEGA_OPERATOR_TRIAL_ADJUDICATION_V1','OMEGA_GOVERNED_OPERATOR_TRIAL_PLAN_V1','OMEGA_EVIDENCE_WEIGHTED_OPERATOR_PORTFOLIO_V1','OMEGA_HELD_OUT_ABLATION_LAB_V1','CALIBRATION_SCHEMA="OMEGA_CALIBRATION_LEARNING_WORKBENCH_V1"']:
        assert token in s
