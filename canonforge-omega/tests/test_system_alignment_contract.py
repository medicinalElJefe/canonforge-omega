from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load(name: str):
    return json.loads((ROOT / "config" / name).read_text(encoding="utf-8"))


def test_system_contract_defines_complete_omega_machine():
    contract = load("omega_system_contract.json")
    assert contract["identity"] == "OMEGA Sovereign Computational Environment"
    assert contract["equation"] == [
        "STATE", "INTELLIGENCE", "MEMORY", "RELATION",
        "COMPUTATION", "ACTION", "OBSERVATION", "PROOF",
    ]
    assert set(contract["primary_surfaces"]) == {
        "OMEGA", "CALCULUS", "EARTH", "MEMORY", "INTELLIGENCE",
        "CREATE_SIMULATE", "SOVEREIGN", "BUILD", "PROOF",
    }
    assert "governance_dashboard_becomes_primary_product" in contract["prohibitions"]
    assert "physical-dimension" not in contract["representation_rule"].lower()


def test_convergence_policy_is_bound_to_product_alignment():
    policy = load("convergence_policy.json")
    assert policy["version"] == "R123"
    assert policy["system_contract"] == "config/omega_system_contract.json"
    directive = policy["product_alignment_directive"]
    assert directive["support_systems_must_not_dominate_primary_use"] is True
    assert directive["specialist_surfaces_require_direct_manipulation"] is True
    assert directive["raw_telemetry_requires_progressive_disclosure"] is True
    assert directive["shell_changes_must_change_computational_resolution"] is True
    assert policy["auto_update_directive"]["preserve_system_contract"] is True
    assert policy["auto_update_directive"]["prefer_primary_capability_improvement_over_governance_surface_growth"] is True


def test_modes_remain_distinct_and_single_runtime_authority_is_preserved():
    policy = load("convergence_policy.json")
    modes = policy["all_modes_unification"]
    core = policy["unified_operational_core"]
    assert modes["preserve_individual_mode_semantics"] is True
    assert modes["automatic_mode_collapse_or_aliasing_prohibited"] is True
    assert core["single_packet_authority"] is True
    assert core["single_dispatcher_authority"] is True
    assert core["parallel_state_runtime_prohibited"] is True
    assert core["duplicate_ui_shell_prohibited"] is True
    assert core["mode_runtime_fork_prohibited"] is True
