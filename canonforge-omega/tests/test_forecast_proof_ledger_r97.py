from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r97_forecast_ledger_preserves_failed_predictions():
    text=(SRC/'forecastProofLedger.ts').read_text()
    assert 'append_only_semantics:true' in text
    assert 'historical_predictions_rewritten:false' in text
    assert 'failures_preserved:true' in text
    assert 'automatic_canonical_weight_mutation:false' in text
    assert 'causation_claimed:false' in text

def test_r97_requires_observation_before_scoring_and_gates_trust():
    text=(SRC/'forecastProofLedger.ts').read_text()
    assert 'AWAITING_OBSERVATION' in text
    assert 'minimum_observations_for_trust_update:5' in text
    assert 'calibration_sample_target:20' in text
    assert 'INSUFFICIENT_SAMPLE' in text

def test_r97_timeline_binds_learning_without_mutation():
    text=(SRC/'timelineForecast.ts').read_text()
    assert 'evaluateForecastLedger' in text
    assert 'forecast_learning' in text
    assert 'historical_predictions_rewritten:false' in text
    assert 'automatic_canonical_weight_mutation:false' in text
    assert 'mutation:false' in text
