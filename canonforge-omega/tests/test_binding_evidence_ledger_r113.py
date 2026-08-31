from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
LEDGER=SRC/'bindingEvidenceLedger.ts'
MEM=SRC/'memoryWorkbench.ts'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'

def text(p): return p.read_text(encoding='utf-8')

def test_ledger_is_routed_through_existing_core_dispatcher():
    s=text(MEM)
    assert 'bindingEvidenceLedgerSchema' in s
    assert 'evaluateBindingEvidenceLedger' in s
    assert '/api/core/evidence-ledger/schema' in s
    assert '/api/core/evidence-ledger' in s

def test_only_authenticated_observed_measured_counts():
    s=text(LEDGER)
    assert 'r.authenticated_observation&&r.observation_evidence_class==="OBSERVED/MEASURED"' in s
    assert 'minimum_authenticated_sample:5' in s
    assert 'HOLD_INSUFFICIENT_AUTHENTICATED_SAMPLE' in s

def test_failures_and_degradation_are_preserved():
    s=text(LEDGER)
    for token in ['failures_preserved:true','unauthenticated_preserved:true','degrading_bindings_preserved:true','ROLLBACK_CANDIDATE']:
        assert token in s
    assert 'preserved:true' in s

def test_aggregate_baseline_comparison_is_explicit():
    s=text(LEDGER)
    for token in ['mean_candidate_brier','mean_baseline_brier','mean_brier_lift','READY_FOR_GOVERNANCE_REVIEW','HOLD_NO_MATERIAL_MEAN_LIFT']:
        assert token in s

def test_no_automatic_policy_or_execution_authority():
    s=text(LEDGER)
    for token in ['historical_forecasts_rewritten:false','causation_claimed:false','automatic_weight_change:false','canonical_state_mutation:false','execution:false','production_policy_mutation:false']:
        assert token in s
    assert 'main = "src/heartbeatTruth.ts"' in text(WRANGLER)
