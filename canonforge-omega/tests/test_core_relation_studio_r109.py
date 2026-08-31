from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'


def test_relation_studio_uses_same_core_packet_and_api():
    s=(SRC/'coreValidationReplay.ts').read_text(encoding='utf-8')
    assert "fetch('/api/core/evaluate'" in s
    assert 'forecast_packet.relations' in s
    assert 'browser relation draft' in s
    assert 'canonical policy' in s
    assert 'cannot mutate canonical policy' in s


def test_relation_truth_controls_are_visible():
    s=(SRC/'coreValidationReplay.ts').read_text(encoding='utf-8')
    for token in ['Source domain','Target domain','Source scale','Target scale','Transfer operator','Measured invariant']:
        assert token in s
    for edge in ['CAUSAL','CONSTITUTIVE','HISTORICAL','OBSERVATIONAL','CONSTRAINT','TRANSFER','SYMBOLIC']:
        assert edge in s
    assert 'Cross-domain or cross-scale CAUSAL edges must declare a transfer operator and measured invariant.' in s
    assert 'SYMBOLIC edges remain symbolic.' in s


def test_relation_canvas_is_visual_and_draft_only():
    s=(SRC/'coreValidationReplay.ts').read_text(encoding='utf-8')
    assert 'typed relation graph' in s
    assert '<svg id="graph"' in s
    assert "stroke-dasharray','8 7'" in s
    assert 'Nothing here mutates canonical state or executes an action.' in s


def test_replay_and_heartbeat_contracts_remain():
    s=(SRC/'coreValidationReplay.ts').read_text(encoding='utf-8')
    for token in ['OMEGA_UNIFIED_CORE_VALIDATION_REPLAY_V1','future_leakage:false','observation_rewrites_forecast:false','failed_forecasts_preserved:true','execution:false','production_rollout_authorized:false']:
        assert token in s
    w=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text(encoding='utf-8')
    assert 'main = "src/heartbeatTruth.ts"' in w
