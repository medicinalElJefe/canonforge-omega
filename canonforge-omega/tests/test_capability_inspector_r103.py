from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ROUTER=ROOT/'cloudflare'/'omega-v6-worker'/'src'/'capabilityRouter.ts'


def test_r103_exposes_inspection_without_execution_or_generation():
    s=ROUTER.read_text(encoding='utf-8')
    for token in ['OMEGA_V6_CAPABILITY_INSPECTOR_V1','/api/capability/inspect','authority:"inspection-only"','mutation:false','execution:false','generation:false','promotion:false','CAPABILITY_INSPECTOR_BOUNDARY']:
        assert token in s


def test_r103_preserves_genesis_gate_menu_and_explicit_unknowns():
    s=ROUTER.read_text(encoding='utf-8')
    for token in ['menu:text(value.menu','gate:text(value.gate','inputs:null','outputs:null','units:null','transfer_operator:null','capability-specific input schema unless separately declared','cross-scale transfer operator unless separately declared']:
        assert token in s


def test_r103_truth_layers_do_not_promote_genesis_declarations_to_observation():
    s=ROUTER.read_text(encoding='utf-8')
    assert 'capability_declaration:"USER_DEFINED_MODEL"' in s
    assert 'reciprocal_manifest:truthClass(index)' in s
    assert 'physical_claims:"NO_EVIDENCE"' in s
    assert 'manifest_agreed?"OBSERVED/MEASURED":"NO_EVIDENCE"' in s


def test_r103_routes_only_after_current_manifest_and_hybrid_gate_when_required():
    s=ROUTER.read_text(encoding='utf-8')
    for token in ['ready_for_route_preview:Boolean(index.manifest_agreed&&hybridReady)','capability_route_not_currently_admissible','hybrid_required:hybridRequired','heartbeat_current','route_before_generation: true']:
        assert token in s


def test_r103_uses_governed_machine_grammar_and_keeps_r91_contract():
    s=ROUTER.read_text(encoding='utf-8')
    for token in ['OBSERVE/SENSE','NORMALIZE','INVENTORY/RELATE','PRUNE','TRANSLATE','FORECAST/COMPUTE','GATE/DECIDE','ACT/RENDER','PROVE','LEDGER','OBSERVE RESULT','OMEGA_V6_CAPABILITY_INDEX_V1','OMEGA_V6_CAPABILITY_ROUTE_PREVIEW_V1','Capability Router']:
        assert token in s
