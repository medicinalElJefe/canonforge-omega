from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r106_unified_core_contract():
    s=(SRC/'unifiedOperationalCore.ts').read_text()
    for token in ['OMEGA_UNIFIED_OPERATIONAL_CORE_V1','OBSERVE/SENSE','NORMALIZE','INVENTORY/RELATE','PRUNE','TRANSLATE','FORECAST/COMPUTE','GATE/DECIDE','ACT/RENDER','PROVE','LEDGER','OBSERVE RESULT','OBSERVED/MEASURED','SIMULATED_CONTINUATION','USER_DEFINED_MODEL','SYMBOLIC_ANALOGY','NO_EVIDENCE']:
        assert token in s
    for token in ['canonical_state_mutation:false','execution:false','production_policy_mutation:false','causation_claimed:false','held_out_validation:false','independently_validated:false','baseline_comparison_required_for_improvement_claim:true']:
        assert token in s

def test_r106_relation_and_observation_truth_gates():
    s=(SRC/'unifiedOperationalCore.ts').read_text()
    assert 'transfer_operator' in s
    assert 'measured_invariant' in s
    assert 'SYMBOLIC_ANALOGY' in s
    assert 'authenticated_source' in s
    assert 'HOLD_RELATION_PROOF' in s
    assert 'HOLD_OBSERVATION_PROOF' in s
    assert 'READY_FOR_REVIEW' in s
    assert 'causal_claim_verified:false' in s

def test_r106_is_routed_under_existing_memory_dispatcher():
    s=(SRC/'memoryWorkbench.ts').read_text()
    for token in ['href="/core"','u.pathname==="/core"','u.pathname==="/api/core/schema"','u.pathname==="/api/core/evaluate"','handleMemoryWorkbenchRequest']:
        assert token in s
    assert 'u.pathname==="/memory"' in s
    assert 'u.pathname==="/timeline"' in s

def test_r106_heartbeat_entrypoint_remains_protected():
    w=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text()
    assert 'main = "src/heartbeatTruth.ts"' in w
