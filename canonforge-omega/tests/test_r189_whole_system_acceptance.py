from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config" / "capability_truth_r189.json"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
R189 = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "acceptance" / "wholeSystemAcceptanceR189.ts"
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


def load_contract():
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def test_r189_extends_exact_r188_baseline_without_redefining_authority():
    contract = load_contract()
    assert contract["version"] == "R189"
    assert contract["baseline"]["revision"] == "R188"
    assert contract["baseline"]["sha"] == "cba7d9a9b4720beeb6c79c6c211ba8e7fbc87a18"
    assert contract["truth_boundaries"]["automatic_production_mutation"] is False
    source = R189.read_text(encoding="utf-8")
    assert "canonicalMutation: false" in source
    assert "promotionAuthorized: false" in source


def test_r189_capability_truth_uses_explicit_progression_and_exact_mode_inventory():
    contract = load_contract()
    assert contract["capability_stages"] == ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED", "VERIFIED"]
    assert set(contract["governed_modes"]) == EXPECTED_MODES
    assert len(contract["governed_modes"]) == 15
    source = R189.read_text(encoding="utf-8")
    for stage in contract["capability_stages"]:
        assert f'"{stage}"' in source
    for mode in EXPECTED_MODES:
        assert f'"{mode}"' in source


def test_r189_quick_acceptance_covers_every_primary_runtime_family():
    contract = load_contract()
    routes = set(contract["quick_required_routes"])
    required = {
        "/api/omega/state",
        "/api/omega/proof?limit=2",
        "/api/restoration",
        "/api/earth/catalog",
        "/api/compute/manifest",
        "/api/validate/manifest",
        "/api/validate/independent/manifest",
        "/api/clouds/r185/manifest",
        "/api/swarm/motion/r188/manifest",
        "/truth",
    }
    assert routes == required
    source = R189.read_text(encoding="utf-8")
    for route in required:
        assert route in source


def test_r189_full_acceptance_does_not_confuse_contract_with_live_pc_rcwa_proof():
    contract = load_contract()
    source = R189.read_text(encoding="utf-8")
    assert "BLOCKED_NO_VERIFIED_NATIVE_RCWA_JOB" in source
    assert 'row?.kind === "cross_runtime_validate"' in source
    assert 'row?.state === "VERIFIED"' in source
    assert 'solver_family === "MAXWELL_RCWA"' in source
    assert 'body?.validation?.nativeExecutionObserved === true' in source
    assert "/api/validate/independent/compare" in source
    assert "current authenticated sovereign heartbeat" in contract["full_acceptance_requirements"]
    assert "persisted VERIFIED native grcwa RCWA execution receipt" in contract["full_acceptance_requirements"]
    assert contract["truth_boundaries"]["manifest_is_not_native_execution"] is True
    assert contract["truth_boundaries"]["heartbeat_is_not_solver_validation"] is True


def test_r189_is_wired_through_the_existing_single_dispatcher():
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'from "./acceptance/wholeSystemAcceptanceR189"' in entry
    assert 'url.pathname.startsWith("/api/acceptance/r189/")' in entry
    assert 'handleWholeSystemAcceptanceR189(request, env, ctx, runtimeFetch)' in entry
    assert 'url.pathname === "/truth"' in entry
    assert "return canonical.fetch(request, env, ctx);" in entry
    assert "parallel state" not in entry.lower()


def test_r189_preserves_r188_r185_r181_r175_routes_in_same_entrypoint():
    entry = ENTRY.read_text(encoding="utf-8")
    for marker in [
        "/api/swarm/motion/r188/",
        "/api/clouds/r185/",
        "/api/acceptance/r181/",
        "/api/validate/independent/",
        "/api/validate/",
        "/api/compute/",
        "/api/sai/",
    ]:
        assert marker in entry


def test_r189_truth_surface_is_real_operator_access_not_completion_claim():
    source = R189.read_text(encoding="utf-8")
    assert "Capability Truth" in source
    assert "Run quick proof" in source
    assert "Run full proof" in source
    assert "Missing external proof stays blocked" in source
    assert "TRUTH_SURFACE" in source
    assert '"/truth"' in source


def test_r189_wrangler_contract_declares_acceptance_identity_after_update():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'WHOLE_SYSTEM_ACCEPTANCE_ID = "r189-whole-system-canonical-acceptance"' in wrangler
    assert 'CAPABILITY_TRUTH_ID = "r189-implemented-route-invoked-returned-verified"' in wrangler
