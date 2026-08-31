from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
BIND=SRC/'forecastObservationBinding.ts'
MEM=SRC/'memoryWorkbench.ts'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'

def text(p): return p.read_text(encoding='utf-8')

def test_binding_is_routed_through_existing_core_dispatcher():
    s=text(MEM)
    assert 'forecastObservationBindingSchema' in s
    assert 'evaluateForecastObservationBinding' in s
    assert '/api/core/binding/schema' in s
    assert '/api/core/binding' in s

def test_binding_preserves_frozen_forecast_and_time_order():
    s=text(BIND)
    for token in ['forecast_frozen:true','forecast_rewritten:false','future_leakage_or_nonlater_observation','forecast_id_not_in_frozen_packet']:
        assert token in s
    assert 'selected_forecast' in s
    assert 'observationTime<=forecastTime' in s

def test_authenticated_evidence_is_strictly_gated():
    s=text(BIND)
    assert 'observation.authenticated_source&&observation.evidence_class==="OBSERVED/MEASURED"' in s
    assert 'ELIGIBLE_FOR_LEDGER_UPDATE' in s
    assert 'HOLD_UNAUTHENTICATED_OBSERVATION' in s
    assert 'causation_claimed:false' in s

def test_baseline_comparison_is_explicit_and_scoped():
    s=text(BIND)
    for token in ['baseline_brier','candidate_brier','brier_lift','baseline_absolute_error','candidate_absolute_error','this observation only']:
        assert token in s
    assert 'baseline_probability_0_1_required' in s

def test_no_new_authority_or_entrypoint():
    s=text(BIND)
    for token in ['canonical_state_mutation:false','execution:false','production_policy_mutation:false']:
        assert token in s
    assert 'main = "src/heartbeatTruth.ts"' in text(WRANGLER)
