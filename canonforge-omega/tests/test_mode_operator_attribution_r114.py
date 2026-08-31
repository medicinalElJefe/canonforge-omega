from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
ATTR=SRC/'modeOperatorEvidenceAttribution.ts'
MEM=SRC/'memoryWorkbench.ts'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'

def text(p): return p.read_text(encoding='utf-8')

def test_attribution_is_routed_inside_existing_core_dispatcher():
    s=text(MEM)
    assert 'modeOperatorEvidenceAttributionSchema' in s
    assert 'evaluateModeOperatorEvidenceAttribution' in s
    assert '/api/core/mode-attribution/schema' in s
    assert '/api/core/mode-attribution' in s
    for prior in ['/api/core/evidence-ledger','/api/core/binding','/api/core/replay','/api/core/evaluate']:
        assert prior in s

def test_declared_modes_operators_are_domain_grouped():
    s=text(ATTR)
    for token in ['operator_ids','mode_ids','domain','authenticated_sample','mean_candidate_brier','mean_baseline_brier','mean_brier_lift']:
        assert token in s
    assert 'minimum_authenticated_sample:5' in s

def test_only_authenticated_observed_measured_contributes():
    s=text(ATTR)
    assert 'b.evidence?.authenticated_observation&&b.observation?.evidence_class==="OBSERVED/MEASURED"' in s
    for token in ['HOLD_EVIDENCE','RETAIN_FOR_HELD_OUT_TESTING','ABLATION_CANDIDATE','NO_CLEAR_LIFT']:
        assert token in s

def test_attribution_never_claims_causal_mode_effect():
    s=text(ATTR)
    for token in ['association_only:true','causation_claimed:false','causal_effect_claimed:false','symbolic_to_physical_upgrade:false','historical_predictions_rewritten:false','automatic_weight_change:false']:
        assert token in s

def test_no_new_execution_or_policy_authority():
    s=text(ATTR)
    for token in ['canonical_state_mutation:false','execution:false','production_policy_mutation:false']:
        assert token in s
    assert 'main = "src/heartbeatTruth.ts"' in text(WRANGLER)
