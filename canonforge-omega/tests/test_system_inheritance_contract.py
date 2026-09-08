import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "config" / "system_inheritance_contract.json"
REPAIR = ROOT / "config" / "repair_system_contract.json"
GATEWAY = ROOT / "scripts" / "START_OMEGA_SOVEREIGN.ps1"
RCWA_AGENT = ROOT / "scripts" / "omega_sovereign_agent.py"


def load() -> dict:
    return json.loads(CONTRACT.read_text(encoding="utf-8"))


def test_inheritance_contract_prevents_archive_and_authority_flattening():
    data = load()
    assert data["schema"] == "OMEGA_SYSTEM_INHERITANCE_CONTRACT_V1"
    classes = data["source_classes"]
    assert classes["CANONICAL_SOURCE"]["requires_governed_release_admission"] is True
    assert classes["ARCHIVE_DONOR"]["may_define_runtime_behavior"] is False
    assert classes["ARCHIVE_DONOR"]["requires_extraction_diff_validation"] is True
    assert classes["ARCHIVE_DONOR"]["requires_conflict_routing"] is True
    assert classes["PACKAGE_OR_REPAIR_ARTIFACT"]["may_define_runtime_behavior"] is False
    assert classes["PROOF_EVIDENCE"]["may_define_runtime_behavior"] is False
    assert data["archive_rules"]["archive_name_or_recency_is_not_authority"] is True
    assert data["archive_rules"]["nested_meta_archives_require_recursive_expansion_before_admission"] is True
    assert "ARCHIVE_TO_CANON_WITHOUT_VALIDATION" in data["forbidden_shortcuts"]
    assert "REPAIR_SCRIPT_EQUALS_SOURCE_AUTHORITY" in data["forbidden_shortcuts"]


def test_plugin_contract_separates_availability_execution_and_verification():
    data = load()
    plugin = data["plugin_rules"]
    assert plugin["states"] == ["DISCOVERED", "AUTHORIZED", "AVAILABLE", "INVOKED", "RETURNED", "VERIFIED"]
    assert plugin["failure_and_unavailable_states_remain_visible"] is True
    assert plugin["plugin_result_is_not_canon_by_default"] is True
    assert plugin["plugin_execution_cannot_grant_release_authority"] is True
    assert plugin["plugin_execution_cannot_bootstrap_parallel_omega_runtime"] is True
    assert data["source_classes"]["PLUGIN_PROVIDER"]["availability_is_not_execution"] is True
    assert "PLUGIN_AVAILABLE_EQUALS_EXECUTED" in data["forbidden_shortcuts"]


def test_mode_contract_requires_real_operational_semantics_not_cosmetic_skinning():
    data = load()
    mode = data["mode_rules"]
    assert mode["mode_requires_operational_semantics"] is True
    assert mode["cosmetic_color_change_is_not_mode_implementation"] is True
    assert set(mode["required_contract_fields"]) == {
        "mode_id",
        "purpose",
        "inputs",
        "operator_or_transform",
        "outputs",
        "evidence_class",
        "authority_boundary",
        "failure_behavior",
    }
    assert mode["mode_may_change_view_without_changing_truth"] is True
    assert mode["mode_may_change_computation_only_when_declared"] is True
    assert mode["mode_cannot_inflate_derived_data_to_measured_data"] is True
    assert mode["mode_cannot_inflate_planning_to_execution"] is True
    assert "MODE_COLOR_EQUALS_MODE_FUNCTION" in data["forbidden_shortcuts"]


def test_evidence_and_repair_contract_require_fresh_probes_and_truthful_claim_classes():
    data = load()
    external = data["source_classes"]["EXTERNAL_DATA"]
    repair = data["repair_rules"]
    assert external["requires_source_provenance"] is True
    assert external["measured_claims_require_returned_or_measured_fields"] is True
    assert external["derived_fields_must_be_labeled_derived"] is True
    assert repair["dependency_repair_requires_fresh_import_or_probe"] is True
    assert repair["acceptance_and_proof_surfaces_follow_stable_entrypoints"] is True
    assert repair["repair_packaging_is_not_source_authority"] is True
    assert repair["failed_proof_remains_in_ledger"] is True
    assert "DERIVED_EQUALS_MEASURED" in data["forbidden_shortcuts"]
    assert "CAPABILITY_PROBE_EQUALS_EXECUTION_PROOF" in data["forbidden_shortcuts"]


def test_inheritance_contract_binds_to_current_single_owner_and_real_rcwa_probe():
    data = load()
    continuity = data["continuity"]
    assert continuity["one_field_one_packet_one_continuity_law"] is True
    assert continuity["single_runtime_ownership"] is True
    assert continuity["stable_windows_entrypoint"] == "scripts/START_OMEGA_SOVEREIGN.ps1"
    assert continuity["durable_runtime_singleton"] == "OMEGA_RUNTIME"
    assert continuity["software_address_levels_not_physical_dimensions"] == [12, 144, 1728, 20736, 248832]

    gateway = GATEWAY.read_text(encoding="utf-8")
    agent = RCWA_AGENT.read_text(encoding="utf-8")
    assert "START_OMEGA_R222_FULL_HYBRID.ps1" in gateway
    assert "PROVE_OMEGA_V6_R209_WINDOWS.ps1" in gateway
    assert 'RCWA_REQUIRED_PACKAGES = ("numpy>=1.24", "grcwa==0.1.2")' in agent
    assert "repair_rcwa_dependencies" in agent
    assert "rcwa_dependency_status" in agent
    assert '"fallback": False' in agent


def test_repair_system_and_inheritance_system_are_composable_not_competing_authorities():
    inheritance = load()
    repair = json.loads(REPAIR.read_text(encoding="utf-8"))
    assert repair["schema"] == "OMEGA_REPAIR_SYSTEM_CONTRACT_V1"
    assert repair["canonical_entrypoints"]["windows_powershell"] == inheritance["continuity"]["stable_windows_entrypoint"]
    assert repair["canonical_entrypoints"]["durable_singleton"] == inheritance["continuity"]["durable_runtime_singleton"]
    assert repair["policy"]["capability_actions_must_not_bootstrap_parallel_runtimes"] is True


def test_admission_pipeline_has_no_merge_equals_live_shortcut():
    data = load()
    pipeline = data["admission_pipeline"]
    assert pipeline.index("CLASSIFY_SOURCE") < pipeline.index("DIFF")
    assert pipeline.index("DIFF") < pipeline.index("CONFLICT_ROUTE")
    assert pipeline.index("CONFLICT_ROUTE") < pipeline.index("REIMPLEMENT_OR_RECONCILE")
    assert pipeline.index("REGRESSION_PROVE") < pipeline.index("GOVERNED_MERGE")
    assert pipeline.index("GOVERNED_MERGE") < pipeline.index("EXACT_HEAD_DEPLOY")
    assert pipeline.index("EXACT_HEAD_DEPLOY") < pipeline.index("LIVE_ACCEPTANCE")
    assert pipeline[-1] == "LEDGER"
    assert "MERGED_EQUALS_LIVE" in data["forbidden_shortcuts"]
