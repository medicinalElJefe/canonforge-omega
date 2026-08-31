from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_memory_contract_and_baseline():
    s=(SRC/'memoryScar.ts').read_text()
    assert 'OMEGA_MEMORY_SCAR_FORECAST_V1' in s
    assert 'memory_improves_brier' in s and 'memoryless_brier' in s and 'memory_brier' in s
    assert 'independently_validated:false' in s
    assert 'do not rewrite canonical V6/Genesis state' in s

def test_memory_workbench_is_bounded_and_routed():
    w=(SRC/'memoryWorkbench.ts').read_text(); r=(SRC/'capabilityRouter.ts').read_text()
    assert '"/memory"' in w and '"/api/memory/evaluate"' in w and '"/api/memory/schema"' in w
    assert 'x-omega-authority":"computation-only' in w
    assert 'handleMemoryWorkbenchRequest' in r

def test_canonical_heartbeat_entrypoint_unchanged():
    wr=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text()
    assert 'main = "src/heartbeatTruth.ts"' in wr

def test_relation_and_state_surfaces_retained():
    r=(SRC/'capabilityRouter.ts').read_text()
    assert 'handleRelationWorkbenchRequest' in r and 'handleStateWorkbenchRequest' in r
    assert '/relations' in r and '/workbench' in r
