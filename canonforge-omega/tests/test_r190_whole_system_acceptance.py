from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "capability_truth_r190.json
"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
R190 = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "acceptance" / "wholeSystemAcceptanceR190.ts"
R189 = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "wholeInstrumentR189.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"

EXPECTED_MODES = {
    "FULL_OVERALL_CANON",
    "MODE_188",
    "UNIFIED_COHERENCE",
    "FORECAST",
    "FULL_SPHERE",
    "RELATIONAL_SKIN",
    "DEWEY_CALCULUS",
    "UNIFIED_RECURSION",
    "DEEP_MOTHER",
    "HIGH_FATHER",
    "HEAVY_PRUNE",
    "ALPHA",
    "CRIMSON",
    "NO_NOTHING_TRUTH",
    "GUIDANCE_FIELD",
}


def contract():
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def test_r190_is_additive_over_exact_admitted_r189_head():
    c = contract()
    assert c["version"] == "R190"
    assert c["predecessor"]["revision"] == "R189_WHOLE_INSTRUMENT_CONVERGENCE"
    assert c["predecessor"]["sha"] == "ab3c8973dad012da11b75983dd41bed6bddfad3a"
    assert R189.exists()
    r189 = R189.read_text(encoding="utf-8")
    assert 'R189_REVISION = "R189_WHOLE_INSTRUMENT_CONVERGENCE"' in r189
    source = R190.read_text(encoding="utf-8")
    assert 'R190_PREDECESSOR_SHA = "ab3c8973dad012da11b75983dd41bed6bddfad3a"' in source
    assert "canonicalMutation: false" in source
    assert "promotionAuthorized: false" in source


def test_r190_uses_explicit_truth_progression_and_preserves_all_modes():
    c = contract()
    assert c["capability_stages"] == ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED", "VERIFIED"]
    assert set(c["governed_modes"]) == EXPECTED_MODES
    assert len(c["governed_modes"]) == 15
    source = R190.read_text(encoding="utf-8")
    for stage in c["capability_stages"]:
        assert f'"{stage}"' in source
    for mode in EXPECTED_MODES:
        assert f'"{mode}"' in source


def test_r190_quick_probe_uses_only_worker_local_runtime_contracts():
    c = contract()
    routes = set(c["quick_required_routes"])
    required = {
        "/api/instrument/r189/manifest",
        "/api/state/workbench/schema",
        "/api/core/evidence-ledger/schema",
        "/api/core/replay/schema",
        "/api/compute/manifest",
        "/api/validate/manifest",
        "/api/validate/independent/manifest",
        "/api/clouds/r185/manifest",
        "/api/swarm/motion/r188/manifest",
        "/truth",
    }
    assert routes == required
    external = set(c["full_additional_routes"])
    assert {"/api/omega/state", "/api/omega/proof?limit=2", "/api/restoration", "/api/earth/catalog"} <= external
    assert routes.isdisjoint({"/api/omega/state", "/api/omega/proof?limit=2", "/api/restoration", "/api/earth/catalog"})
    source = R190.read_text(encoding="utf-8")
    for route in required:
        assert route in source
    assert 'id: "R189_WHOLE_INSTRUMENT"' in source
    assert 'id: "STATE_INSTRUMENT_CONTRACT"' in source
    assert 'id: "PROOF_EVIDENCE_FABRIC"' in source
    assert 'id: "RECOVERY_REPLAY_CONTRACT"' in source
    assert 'availability: "LOCAL_CORE"' in source
    assert 'availability: "EXTERNAL_EVIDENCE"' in source
    assert "inheritedRoutesPreserved" in source
    assert "inheritedVisualShellPreserved" in source
    assert "durableObjectNamespacesPreserved" in source


def test_r190_external_unavailability_is_blocked_not_mislabeled_as_core_failure():
    c = contract()
    source = R190.read_text(encoding="utf-8")
    assert c["truth_boundaries"]["local_core_is_not_external_evidence"] is True
    assert "blockedExternal" in source
    assert "BLOCKED_SOVEREIGN_STATE_UNAVAILABLE" in source
    assert "BLOCKED_SOVEREIGN_PROOF_UNAVAILABLE" in source
    assert "BLOCKED_SOVEREIGN_RESTORATION_UNAVAILABLE" in source
    assert "BLOCKED_EARTH_SOURCE_CATALOG_UNAVAILABLE" in source
    assert "BLOCKED_CURRENT_HEARTBEAT_REQUIRED" in source
    assert 'state: external ? (spec.unavailableState || "BLOCKED_EXTERNAL_EVIDENCE_UNAVAILABLE") : "FAILED_INVOCATION"' in source
    assert 'id: "EARTH_TRUTH_BOUNDARY"' in source
    assert "EARTH_TRUTH_LAYERS_BOUNDARY" in source


def test_r190_local_contracts_assert_truthful_non_mutating_schemas():
    source = R190.read_text(encoding="utf-8")
    assert 'body?.schema === "OMEGA_STATE_WORKBENCH_SCHEMA_V1"' in source
    assert 'body?.schema === "OMEGA_BINDING_EVIDENCE_LEDGER_V1"' in source
    assert 'body?.schema === "OMEGA_UNIFIED_CORE_VALIDATION_REPLAY_V1"' in source
    assert 'body?.authority === "computation-only"' in source
    assert 'body?.authority === "validation-and-aggregation-only"' in source
    assert 'body?.authority === "validation-only"' in source
    assert "body?.native_execution === false" in source
    assert "body?.automatic_weight_change === false" in source
    assert "body?.production_policy_mutation === false" in source


def test_r190_exact_deployment_identity_accepts_git_sha_not_only_sha256():
    source = R190.read_text(encoding="utf-8")
    assert "gitShaHex" in source
    assert "{40}|[a-f0-9]{64}" in source
    assert 'id: "DEPLOYMENT_IDENTITY"' in source
    assert "BLOCKED_DEPLOYMENT_SHA_REQUIRED" in source
    assert "CANONICAL_GIT_SHA" in source


def test_r190_native_rcwa_requires_persisted_verified_job_and_r175_revalidation():
    c = contract()
    source = R190.read_text(encoding="utf-8")
    assert "BLOCKED_NO_VERIFIED_NATIVE_RCWA_JOB" in source
    assert 'row?.kind === "cross_runtime_validate"' in source
    assert 'row?.state === "VERIFIED"' in source
    assert 'solver_family === "MAXWELL_RCWA"' in source
    assert 'body?.validation?.validationTier?.level === 4' in source
    assert 'body?.validation?.nativeExecutionObserved === true' in source
    assert "/api/validate/independent/compare" in source
    assert "persisted VERIFIED native grcwa RCWA execution receipt" in c["full_acceptance_requirements"]
    assert c["truth_boundaries"]["manifest_is_not_native_execution"] is True
    assert c["truth_boundaries"]["heartbeat_is_not_solver_validation"] is True


def test_r190_single_dispatcher_preserves_r189_and_inherited_routes():
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'from "./wholeInstrumentR189"' in entry
    assert "handleWholeInstrumentR189(request)" in entry
    assert 'from "./acceptance/wholeSystemAcceptanceR190"' in entry
    assert 'url.pathname.startsWith("/api/acceptance/r190/")' in entry
    assert "handleWholeSystemAcceptanceR190(request, env, ctx, runtimeFetch)" in entry
    assert 'url.pathname === "/truth"' in entry
    for marker in [
        "/api/canon/r189/",
        "/api/swarm/motion/r188/",
        "/api/clouds/r185/",
        "/api/acceptance/r181/",
        "/api/validate/independent/",
        "/api/validate/",
        "/api/compute/",
        "/api/sai/",
    ]:
        assert marker in entry
    assert "return canonical.fetch(request, env, ctx);" in entry


def test_r190_operator_surface_connects_truth_to_whole_instrument():
    source = R190.read_text(encoding="utf-8")
    assert "Capability Truth" in source
    assert "Run core proof" in source
    assert "Run full proof" in source
    assert 'href="/instrument"' in source
    assert "fetch('/api/acceptance/r190/probe'" in source
    assert "What is actually working?" in source


def test_r190_wrangler_ids_are_additive_and_preserve_inherited_build_identity():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'WHOLE_INSTRUMENT_R189_ID = "r189-whole-instrument-convergence"' in wrangler
    assert 'WHOLE_SYSTEM_ACCEPTANCE_R190_ID = "r190-capability-truth-admission"' in wrangler
    assert 'CAPABILITY_TRUTH_R190_ID = "r190-implemented-route-invoked-returned-verified"' in wrangler


def test_r190_acceptance_layer_cannot_autonomously_promote():
    c = contract()
    source = R190.read_text(encoding="utf-8")
    assert c["promotion"]["acceptance_layer_may_promote"] is False
    assert c["truth_boundaries"]["automatic_production_mutation"] is False
    assert "canonicalMutation: false" in source
    assert "promotionAuthorized: false" in source
