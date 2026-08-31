from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
CAL=SRC/'calibrationWorkbench.ts'
REPLAY=SRC/'coreValidationReplay.ts'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'

def text(p): return p.read_text(encoding='utf-8')

def test_observation_capture_is_visible_and_uses_existing_replay_authority():
    s=text(CAL)
    for token in ['Later observation capture','Observed at','Outcome 0–1','Evidence class','Authenticated source','Baseline probability']:
        assert token in s
    assert "fetch('/api/core/replay'" in s
    assert 'OMEGA_LATER_OBSERVATION_CAPTURE_UI_V1' in s

def test_observation_stays_outside_frozen_forecast_packet():
    s=text(CAL)
    assert 'd.observation=observation()' in s
    assert 'd.baseline_probability=Number' in s
    assert 'Observation applied outside forecast_packet.' in s
    assert 'forecast packet remains frozen' in s
    assert 'future leakage forbidden' in s

def test_truth_class_and_authentication_remain_explicit():
    s=text(CAL)
    assert 'USER_DEFINED_MODEL · UNAUTHENTICATED' in s
    assert 'OBSERVED/MEASURED' in s
    assert "o.authenticated_source&&o.evidence_class==='OBSERVED/MEASURED'" in s
    assert 'requires external source proof' in s
    assert 'not proof by itself' in s

def test_r107_replay_truth_boundaries_remain_present():
    s=text(REPLAY)
    for token in ['future_leakage:false','observation_rewrites_forecast:false','failed_forecasts_preserved:true','HOLD_UNAUTHENTICATED_OBSERVATION']:
        assert token in s

def test_heartbeat_entrypoint_remains_canonical():
    assert 'main = "src/heartbeatTruth.ts"' in text(WRANGLER)
