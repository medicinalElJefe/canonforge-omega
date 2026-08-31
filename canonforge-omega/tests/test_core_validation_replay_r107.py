from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r107_replay_contract():
    s=(SRC/'coreValidationReplay.ts').read_text()
    for token in ['OMEGA_UNIFIED_CORE_VALIDATION_REPLAY_V1','future_leakage_or_noncausal_time_order','baseline_probability_0_1_required','forecast_frozen:true','observation_rewrites_forecast:false','failed_forecasts_preserved:true','causation_claimed:false','canonical_policy_mutation:false','production_rollout_authorized:false']:
        assert token in s

def test_r107_evidence_and_sample_gates():
    s=(SRC/'coreValidationReplay.ts').read_text()
    for token in ['authenticated_source','OBSERVED/MEASURED','HOLD_UNAUTHENTICATED_OBSERVATION','HOLD_INSUFFICIENT_SAMPLE','READY_FOR_POLICY_PROMOTION_REVIEW','ROLLBACK_CANDIDATE','HOLD_NO_MATERIAL_LIFT','minimum_sample:5','improvement_claim_allowed']:
        assert token in s

def test_r107_routes_additively_under_core():
    s=(SRC/'memoryWorkbench.ts').read_text()
    for token in ['u.pathname==="/core/replay"','u.pathname==="/api/core/replay/schema"','u.pathname==="/api/core/replay"','u.pathname==="/core"','u.pathname==="/api/core/evaluate"','u.pathname==="/memory"','u.pathname==="/timeline"']:
        assert token in s

def test_r107_preserves_heartbeat_entrypoint():
    w=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text()
    assert 'main = "src/heartbeatTruth.ts"' in w
