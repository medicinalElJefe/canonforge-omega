from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CORE=ROOT/'cloudflare'/'omega-v6-worker'/'src'/'unifiedOperationalCore.ts'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'

def text(p): return p.read_text(encoding='utf-8')

def test_r108_keeps_unified_core_as_single_surface():
    s=text(CORE)
    assert 'OMEGA_UNIFIED_OPERATIONAL_CORE_V2' in s
    assert 'LIVING OPERATIONAL CORE' in s
    assert '/api/core/evaluate' in text(ROOT/'cloudflare'/'omega-v6-worker'/'src'/'memoryWorkbench.ts')
    assert 'canonical_state_mutation:false' in s
    assert 'execution:false' in s
    assert 'production_policy_mutation:false' in s

def test_all_modes_are_explicit_projections_not_authorities():
    s=text(CORE)
    for name in ['FULL OVERALL CANON','Unified Coherence','Mode 188','Deep Mother','High Father','Forecast','Full Sphere','Heavy Prune','Alpha','Crimson','No-Nothing Truth','Guidance Field','Unified Recursion','Relational Skin Calculus','Dewey Calculus']:
        assert name in s
    assert 'authority:"projection-only"' in s
    assert 'evidence_class:"USER_DEFINED_MODEL"' in s
    assert 'mode_projection:modeState' in s

def test_semantic_operator_colors_and_direct_manipulation_are_present():
    s=text(CORE)
    for token in ['--alpha:#a56cff','--base:#f0c85a','--construct:#ff5e5e','--prune:#5f91ff','--omega:#52d88a']:
        assert token in s
    for control in ['Continuity CΩ','Plasticity Φ','Contradiction q','Burden Λ','type="range"']:
        assert control in s
    assert 'STATE-DRIVEN OPERATOR FIELD' in s
    assert 'Forecast corridor' in s

def test_truth_and_execution_boundaries_remain_locked():
    s=text(CORE)
    assert 'SIMULATED_CONTINUATION' in s
    assert 'NO_EVIDENCE_PRESERVED' in s
    assert 'causal_claim_verified:false' in s
    assert 'held_out_validation:false' in s
    assert 'independently_validated:false' in s
    assert 'baseline_comparison_required_for_improvement_claim:true' in s

def test_heartbeat_entrypoint_is_unchanged():
    w=text(WRANGLER)
    assert 'main = "src/heartbeatTruth.ts"' in w
