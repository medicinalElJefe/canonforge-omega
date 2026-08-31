from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
ABL=SRC/'modeOperatorAblationMatrix.ts'
MEM=SRC/'memoryWorkbench.ts'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'

def text(p): return p.read_text(encoding='utf-8')

def test_ablation_is_routed_inside_existing_core_dispatcher():
    s=text(MEM)
    assert 'modeOperatorAblationMatrixSchema' in s
    assert 'evaluateModeOperatorAblationMatrix' in s
    assert '/api/core/mode-ablation/schema' in s
    assert '/api/core/mode-ablation' in s
    for prior in ['/api/core/mode-attribution','/api/core/evidence-ledger','/api/core/binding','/api/core/replay','/api/core/evaluate']:
        assert prior in s

def test_matched_case_contract_is_explicit():
    s=text(ABL)
    for token in ['case_id','with_probability','without_probability','baseline_probability','matched_same_observation_required:true','baseline_comparison_required:true','duplicate_matched_case_id']:
        assert token in s
    assert 'minimum_matched_authenticated_sample:5' in s

def test_only_authenticated_observed_measured_is_admissible():
    s=text(ABL)
    assert 'raw?.authenticated_source&&raw?.evidence_class==="OBSERVED/MEASURED"' in s
    assert 'authenticated_observed_measured_required_for_ablation' in s
    assert 'evidence_class:"OBSERVED/MEASURED"' in s

def test_paired_lift_and_gates_are_explicit():
    s=text(ABL)
    for token in ['without_brier - with_brier','mean_paired_brier_lift','mean_with_vs_baseline_lift','FEATURE_ADDS_MATCHED_HELD_OUT_LIFT','ABLATION_IMPROVES_MATCHED_HELD_OUT','NO_CLEAR_MATCHED_LIFT','HOLD_INSUFFICIENT_MATCHED_SAMPLE']:
        assert token in s

def test_no_causal_or_policy_upgrade():
    s=text(ABL)
    for token in ['causation_claimed:false','causal_effect_claimed:false','symbolic_to_physical_upgrade:false','historical_predictions_rewritten:false','automatic_weight_change:false','canonical_state_mutation:false','execution:false','production_policy_mutation:false']:
        assert token in s
    assert 'main = "src/heartbeatTruth.ts"' in text(WRANGLER)
