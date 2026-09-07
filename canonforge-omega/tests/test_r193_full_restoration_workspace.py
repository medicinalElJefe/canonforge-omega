from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def read(name: str) -> str:
    return (SRC / name).read_text()


def test_r193_preserves_canonical_entrypoint_and_r192_predecessor():
    wrangler = (WORKER / "wrangler.toml").read_text()
    entry = read("runtimeEntryR169.ts")
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert 'import { enhanceUniversalNavigationR192 } from "./universalNavigationR192"' in entry
    assert 'import { enhanceUniversalWorkspaceR193 } from "./universalWorkspaceR193"' in entry
    assert 'import { handleWorkspaceManifestR193 } from "./workspaceManifestR193"' in entry
    assert "const r192 = await enhanceUniversalNavigationR192(response, new URL(request.url).pathname)" in entry
    assert "enhanceUniversalWorkspaceR193(r192, new URL(request.url).pathname)" in entry
    assert "export default { fetch: publicFetch }" in entry


def test_r193_restores_all_primary_operating_workspaces():
    ui = read("universalWorkspaceR193.ts")
    for app in ("Field", "Calculus", "Memory", "Simulate", "Earth", "Assistant", "Hybrid", "Proof"):
        assert f'app={app}' in ui
    assert "routeApp(name)" in ui
    assert "[data-dock-app]" in ui
    assert "[data-open-app]" in ui


def test_r193_exposes_specialist_systems_without_creating_shadow_runtime():
    ui = read("universalWorkspaceR193.ts")
    for route in (
        "/workbench", "/relations", "/calibration", "/capabilities", "/core",
        "/sai", "/compute", "/validate", "/validate/cross-runtime",
        "/validate/independent", "/clouds", "/warp", "/warp/build",
        "/federation", "/evolution", "/truth", "/convergence", "/fabric", "/instrument",
    ):
        assert f'"{route}"' in ui
    assert "handleSwarmRequest" in read("runtimeEntryR169.ts")
    assert "handleComputeRequest" in read("runtimeEntryR169.ts")
    assert "handleValidationRequest" in read("runtimeEntryR169.ts")
    assert "handleUniversalSurfaceFabricR191" in read("runtimeEntryR169.ts")


def test_r193_all_governed_modes_route_into_existing_mode_atlas():
    ui = read("universalWorkspaceR193.ts")
    atlas = read("governedModeAtlas.ts")
    mode_ids = (
        "full-overall-canon", "mode-188", "unified-coherence", "forecast", "full-sphere",
        "relational-skin", "dewey-calculus", "unified-recursion", "deep-mother", "high-father",
        "heavy-prune", "alpha", "crimson", "no-nothing-truth", "guidance-field",
    )
    for mode_id in mode_ids:
        assert mode_id in ui
        assert mode_id in atlas
    assert "[data-gma-mode]" in ui
    assert "applyMode(id)" in ui


def test_r193_restores_atlas_shell_controls_as_representation_not_physical_claims():
    ui = read("universalWorkspaceR193.ts")
    manifest = read("workspaceManifestR193.ts")
    for shell in ("144", "1728", "20736"):
        assert f'data-r193-shell=\\"{shell}\\"' in ui or f'data-r193-shell="{shell}"' in ui
    assert "interactive_shells: [144, 1728, 20736]" in manifest
    assert "representation_shells: [12, 144, 1728, 20736, 248832]" in manifest
    assert "not literal physical dimensions" in manifest
    assert "applyShell(value)" in ui


def test_r193_applied_calculus_preserves_evidence_boundary():
    launch = read("launchHdNavigation.ts")
    manifest = read("workspaceManifestR193.ts")
    assert "fetch('/api/omega/state'" in launch
    assert "CANONICAL_SEED_THEN_USER_DEFINED_MODEL" in launch
    assert "SIMULATED_CONTINUATION" in launch
    assert "Ω score = (CΩ × Φ) / (q + Λ + ε)" in launch
    for token in ("CΩ", "Φ", "Λ", "q", "invariant carry", "scar/residual carry"):
        assert token in manifest
    assert "execution_claim: false" in manifest


def test_r193_html_only_enrichment_leaves_machine_apis_clean():
    ui = read("universalWorkspaceR193.ts")
    manifest = read("workspaceManifestR193.ts")
    assert 'if (!type.includes("text/html")) return response' in ui
    assert 'headers.set("x-omega-workspace", UNIVERSAL_WORKSPACE_RELEASE_R193)' in ui
    assert '"/api/workspace/r193/manifest"' in manifest
    assert '"/api/workspace/r193/health"' in manifest
    assert '"content-type": "application/json; charset=utf-8"' in manifest


def test_r193_performance_and_mobile_policy_are_bounded():
    ui = read("universalWorkspaceR193.ts")
    manifest = read("workspaceManifestR193.ts")
    assert "setInterval(status,20000)" in ui
    assert "navigation_status_poll_ms: 20000" in manifest
    assert "@media(max-width:760px)" in ui
    assert "duplicate_runtime_authority: false" in manifest
    assert "duplicate_state_authority: false" in manifest
    assert "api_html_wrapping: false" in manifest


def test_r193_restoration_sources_remain_present():
    required = (
        "stateWorkbench.ts", "relationWorkbench.ts", "memoryWorkbench.ts", "calibrationWorkbench.ts",
        "calculusInstrument.ts", "governedModeAtlas.ts", "native20736Atlas.ts", "highDetail20736Field.ts",
        "earthTruthLayers.ts", "intelligenceReasoningPipeline.ts", "saiHybridComputeField.ts",
        "sovereignDevicesCompute.ts", "buildEvolutionGovernance.ts", "wholeInstrumentR189.ts",
    )
    for name in required:
        assert (SRC / name).is_file(), name
