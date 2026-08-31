from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
REPLAY=SRC/'coreValidationReplay.ts'
CORE=SRC/'unifiedOperationalCore.ts'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'

def text(p): return p.read_text(encoding='utf-8')

def test_memory_trail_stays_inside_same_forecast_packet():
    s=text(REPLAY)
    assert 'forecast_packet.memory' in s
    assert "d.forecast_packet.memory.push" in s
    assert "fetch('/api/core/evaluate'" in s
    assert "fetch('/api/core/replay'" in s
    assert 'canonical state' in s

def test_memory_is_visual_and_evidence_typed():
    s=text(REPLAY)
    for token in ['Memory / scar trail draft','memoryGraph','SCAR','CONTINUITY','mevidence','mprov','browser memory draft']:
        assert token in s
    assert 'OBSERVED/MEASURED' in s
    assert 'DERIVED_FROM_OBSERVED' in s
    assert 'NO_EVIDENCE' in s

def test_memory_is_not_new_physical_primitive_or_authority():
    s=text(REPLAY)
    assert 'Memory is historical model input, not a new physical primitive.' in s
    assert 'Nothing here mutates canonical state or executes an action.' in s
    core=text(CORE)
    assert 'canonical_state_mutation:false' in core
    assert 'execution:false' in core
    assert 'production_policy_mutation:false' in core

def test_relations_and_replay_are_preserved():
    s=text(REPLAY)
    for token in ['Typed relation draft','transfer_operator','measured_invariant','SYMBOLIC','future_leakage:false','failed_forecasts_preserved:true']:
        assert token in s

def test_heartbeat_entrypoint_remains_canonical():
    assert 'main = "src/heartbeatTruth.ts"' in text(WRANGLER)
