import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
REGISTRY = ROOT / "config" / "surface_capability_registry_r223.json"

EXPECTED_WORKSPACES = {
    "/?app=Field", "/?app=Calculus&mode=dewey-calculus", "/?app=Memory", "/?app=Simulate",
    "/?app=Earth", "/?app=Assistant", "/?app=Hybrid", "/?app=Proof",
}
EXPECTED_SYSTEMS = {
    "/workbench", "/relations", "/calibration", "/capabilities", "/core", "/sai", "/compute", "/validate",
    "/validate/cross-runtime", "/validate/independent", "/clouds", "/warp", "/warp/build", "/federation",
    "/evolution", "/truth", "/convergence", "/fabric", "/instrument", "/system",
}
EXPECTED_CAPABILITY_GROUPS = {
    "NAVIGATION", "LOCAL_COMPUTE", "VALIDATION", "INTELLIGENCE", "EARTH", "HYBRID", "SELF_BUILD", "NATIVE_RCWA", "PROOF",
}


def _text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r223_is_additive_through_existing_r169_r210_and_r216_owners():
    adapter = _text(SRC / "system" / "operationalProvenanceFabricR210.ts")
    binding = _text(SRC / "surfaceBindingIntegrityR216.ts")
    wrangler = _text(ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml")
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert "handleCapabilityAdmissionR223" in adapter
    assert "handleLiveSystemSurfaceClosureR223" in adapter
    assert "handleOperationalProvenanceR211" in adapter
    assert adapter.index("handleCapabilityAdmissionR223(request") < adapter.index("handleLiveSystemSurfaceClosureR223(request")
    assert adapter.index("handleLiveSystemSurfaceClosureR223(request") < adapter.index("handleOperationalProvenanceR211(request")
    assert "enhanceFinalSurfaceContractR223" in binding
    assert "return enhanceFinalSurfaceContractR223(bound)" in binding
    assert "SURFACE_BINDING_INTEGRITY_RELEASE_R216" in binding


def test_r223_r195_status_preserves_full_corpus_truth_but_bounds_probe_fanout():
    source = _text(SRC / "system" / "liveSystemSurfaceClosureR223.ts")
    assert 'targetRequest(request, "/api/system/r195/manifest"' in source
    assert "manifest?.corpus?.integrity?.ok === true" in source
    assert "manifest?.canonicalGitSha === env?.CANONICAL_GIT_SHA" in source
    assert "r195ManifestInFlight" in source
    assert "r195ManifestCache?.sha === sha" in source
    assert "runBatches(R195_PROBES, 2" in source
    assert "fullCorpusInflationSharedPerExactDeploymentIsolate: true" in source
    assert "unboundedPromiseAll: false" in source
    assert "Promise.all(R195_PROBES.map" not in source


def test_r223_r211_status_is_sequential_and_uses_bounded_r195_status_not_nested_manifest_burst():
    source = _text(SRC / "system" / "liveSystemSurfaceClosureR223.ts")
    r211 = source.split("const R211_SOURCES", 1)[1].split("const R190_EXTERNAL", 1)[0]
    assert 'id: "drive", domain: "archive", path: "/api/system/r195/status"' in r211
    assert 'path: "/api/system/r205/health"' in r211
    assert "runBatches(R211_SOURCES, 1" in source
    assert "nestedBurstFanoutProhibited: true" in source
    assert "Promise.all(R211_SOURCES.map" not in source


def test_r223_r190_full_probe_stages_external_evidence_and_keeps_blocked_distinct_from_failed():
    source = _text(SRC / "system" / "liveSystemSurfaceClosureR223.ts")
    assert "runBatches(R190_EXTERNAL, 1" in source
    assert "const rcwa = await nativeRcwaCapability" in source
    assert 'state: spec.blockedState' in source
    assert 'startsWith("FAILED")' in source
    assert 'startsWith("BLOCKED")' in source
    assert 'overallState = allRequiredVerified ? "FULL_SYSTEM_VERIFIED"' in source
    assert '"EXTERNAL_PROOF_BLOCKED"' in source
    assert "externalBatchWidth: 1" in source
    assert "unboundedPromiseAll: false" in source


def test_r223_capability_admission_separates_shell_core_from_external_organs():
    source = _text(SRC / "system" / "capabilityAdmissionR223.ts")
    for required in (
        'CAPABILITY_ADMISSION_RELEASE_R223 = "r223-capability-scoped-admission"',
        'path: "/api/system/r217/release-lease"',
        'path: "/api/acceptance/r190/manifest"',
        'path: "/api/workspace/r193/health"',
        'path: "/api/compute/manifest"',
        'path: "/api/validate/manifest"',
        "shellReadinessDoesNotClaimPcOnline: true",
        "externalOrganFailureDoesNotDisableHealthyLocalCore: true",
        "exactIdentityMismatchStillFailsClosed: true",
        'path === "/api/surface/r223/core"',
        'path === "/api/surface/r223/capability-state"',
    ):
        assert required in source
    assert "const localCoreReady = Boolean(" in source
    shell_block = source.split("async function computeShellCore", 1)[1].split("async function shellCore", 1)[0]
    for external in ("/api/hybrid/status", "/api/sai/status", "/api/earth/catalog", "/api/development/status"):
        assert external not in shell_block


def test_r223_r216_globally_blocks_only_identity_or_local_core_not_external_aggregate():
    binding = _text(SRC / "surfaceBindingIntegrityR216.ts")
    assert "'/api/surface/r223/core'" in binding
    assert "'/api/surface/r223/capability-state'" in binding
    assert "core.identityReady===true" in binding
    assert "core.localCoreReady===true&&core.shellReady===true" in binding
    assert "External source/device outages alone do not trigger this global interlock." in binding
    assert "applyCapabilityPacket" in binding
    assert "data-omega-capability" in binding
    assert "r211.ok===true" not in binding
    assert "r205.ok===true" not in binding
    assert "Promise.all([read('/api/system/r211/status'),read('/api/system/r205/health')])" not in binding


def test_r223_mission_snapshot_removes_duplicate_r195_status_from_fast_baseline_and_bounds_work():
    source = _text(SRC / "system" / "capabilityAdmissionR223.ts")
    mission = source.split("const MISSION_SNAPSHOT_PROBES", 1)[1].split("const FULL_SNAPSHOT_EXTRA", 1)[0]
    full = source.split("const FULL_SNAPSHOT_EXTRA", 1)[1].split("async function boundedR199Snapshot", 1)[0]
    assert "/api/system/r195/status" not in mission
    assert "/api/system/r195/status" in full
    assert "mapBoundedR223(specs, profile === \"mission\" ? 2 : 1" in source
    assert "r195StatusNotDuplicatedInsideMissionBaseline: profile === \"mission\"" in source
    assert "externalEvidenceExcludedFromMissionCoreReadiness: true" in source
    assert 'schema: "OMEGA_ONE_SYSTEM_OPERATOR_RECEIPT_R199"' in source
    assert 'action: "snapshot"' in source


def test_r223_r205_health_has_readiness_vectors_and_does_not_make_b059_or_pc_cloud_core_requirements():
    source = _text(SRC / "system" / "capabilityAdmissionR223.ts")
    block = source.split("async function boundedR205Health", 1)[1].split("async function boundedBridgePrepare", 1)[0]
    assert "mapBoundedR223(R205_HEALTH_PROBES, 2" in block
    assert "const cloudCoreReady = localCoreReady && intelligenceCoreReady && selfBuildReady" in block
    assert "const fullSystemReady = cloudCoreReady && continuityObserved && externalGroundingReady && pcOnline" in block
    assert "externalEvidenceExcludedFromCloudCoreReady: true" in block
    assert "b059UnavailableDoesNotDisableLocalCore: true" in block
    assert "pcOfflineDoesNotDisableLocalCore: true" in block
    assert "readiness:" in block
    assert "sourceGrounding: externalGroundingReady" in block
    assert "hybridPc: pcOnline" in block


def test_r223_bridge_preparation_is_staged_instead_of_three_way_nested_fanout():
    source = _text(SRC / "system" / "capabilityAdmissionR223.ts")
    block = source.split("async function boundedBridgePrepare", 1)[1].split("export async function handleCapabilityAdmissionR223", 1)[0]
    assert "const healthState = await boundedR205Health" in block
    assert "const sai = await invoke" in block
    assert "const fusion = await invoke" in block
    assert "stagedHealthSaiFusion: true" in block
    assert "Promise.all" not in block


def test_r223_registry_covers_every_declared_destination_and_binds_capability_group():
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    assert data["schema"] == "OMEGA_SURFACE_CAPABILITY_REGISTRY_R223"
    assert data["authority"] == "DECLARATIVE_SURFACE_BINDING_REGISTRY_NOT_RUNTIME_OR_CANON_AUTHORITY"
    assert data["state_endpoint"] == "/api/surface/r223/capability-state"
    assert data["core_admission_endpoint"] == "/api/surface/r223/core"
    routes = data["routes"]
    hrefs = [row["href"] for row in routes]
    assert len(hrefs) == len(set(hrefs)) == 28
    workspace = {row["href"] for row in routes if row["kind"] == "WORKSPACE"}
    systems = {row["href"] for row in routes if row["kind"] == "SYSTEM"}
    assert workspace == EXPECTED_WORKSPACES
    assert systems == EXPECTED_SYSTEMS
    assert {row["capability_group"] for row in routes} <= EXPECTED_CAPABILITY_GROUPS
    for row in routes:
        for field in ("capability_group", "provider", "evidence_class", "authority_required", "failure_behavior"):
            assert row.get(field), (row["id"], field)
    for control in data["controls"]:
        assert control.get("capability_group") in EXPECTED_CAPABILITY_GROUPS
    assert data["truth_boundaries"]["shell_ready_is_not_all_capabilities_ready"] is True
    assert data["truth_boundaries"]["external_organ_failure_does_not_disable_healthy_local_core"] is True
    assert data["canonical_mutation"] is False
    assert data["promotion_authorized"] is False


def test_r223_registry_stays_in_lockstep_with_r214_and_r193_route_declarations():
    menu = _text(SRC / "menuTruthR214.ts")
    workspace = _text(SRC / "universalWorkspaceR193.ts")
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    registered = {row["href"] for row in registry["routes"]}
    menu_hrefs = set(re.findall(r'href: "([^"]+)"', menu.split("MENU_TRUTH_ITEMS_R214", 1)[1].split("const allowed", 1)[0]))
    systems_block = workspace.split("const SYSTEMS = [", 1)[1].split("] as const;", 1)[0]
    system_hrefs = set(re.findall(r'"(/[^"]+)"', systems_block))
    assert menu_hrefs <= registered
    assert system_hrefs | {"/system"} == {href for href in registered if not href.startswith("/?app=")}


def test_r223_final_surface_contract_uses_fast_path_and_repairs_exact_browser_route_context():
    source = _text(SRC / "surfaceContractR223.ts")
    for required in (
        "enhanceUniversalWorkspaceR193", "enhanceOneSystemNavigationR195", "enhanceMenuTruthR214",
        'id="omegaR193Rail"', 'id="omegaR214ControlMenu"', 'id="omegaNavigationIntegrityR215Runtime"',
        'id="omegaMenuTruthR214Runtime"', 'id="omegaSurfaceBindingIntegrityR216Runtime"',
        'id="omegaFinalSurfaceContractR223"', 'id="omegaFinalSurfaceRouteContextR223"',
        "document.body.dataset.omegaSurfaceHref=hereKey", "here.searchParams.get('app')===app",
        'headers.set("x-omega-surface-contract-state", complete ? "COMPLETE" : "INCOMPLETE")',
        'headers.set("x-omega-surface-route-context", "client-location-exact")',
    ):
        assert required in source
    assert "async function contains" not in source
    assert "response.clone().text()" not in source


def test_r223_exposes_machine_readable_registry_without_claiming_execution_or_promotion():
    source = _text(SRC / "system" / "liveSystemSurfaceClosureR223.ts")
    assert 'url.pathname === "/api/surface/r223/registry"' in source
    assert "SURFACE_CAPABILITY_REGISTRY_R223" in source
    combined = source + _text(SRC / "system" / "capabilityAdmissionR223.ts")
    for forbidden in ("canonicalMutation: true", "promotionAuthorized: true", "wrangler deploy", "CF_API_TOKEN"):
        assert forbidden not in combined
