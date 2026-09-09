import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
REGISTRY = ROOT / "config" / "surface_capability_registry_r223.json"

EXPECTED_WORKSPACES = {
    "/?app=Field",
    "/?app=Calculus&mode=dewey-calculus",
    "/?app=Memory",
    "/?app=Simulate",
    "/?app=Earth",
    "/?app=Assistant",
    "/?app=Hybrid",
    "/?app=Proof",
}
EXPECTED_SYSTEMS = {
    "/workbench", "/relations", "/calibration", "/capabilities", "/core", "/sai", "/compute", "/validate",
    "/validate/cross-runtime", "/validate/independent", "/clouds", "/warp", "/warp/build", "/federation",
    "/evolution", "/truth", "/convergence", "/fabric", "/instrument", "/system",
}


def _text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r223_is_additive_through_existing_r169_r210_and_r216_owners():
    adapter = _text(SRC / "system" / "operationalProvenanceFabricR210.ts")
    binding = _text(SRC / "surfaceBindingIntegrityR216.ts")
    wrangler = _text(ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml")
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert "handleLiveSystemSurfaceClosureR223" in adapter
    assert "handleOperationalProvenanceR211" in adapter
    assert adapter.index("handleLiveSystemSurfaceClosureR223") < adapter.index("handleOperationalProvenanceR211(request")
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


def test_r223_registry_covers_every_declared_workspace_and_system_destination_exactly_once():
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    assert data["schema"] == "OMEGA_SURFACE_CAPABILITY_REGISTRY_R223"
    assert data["authority"] == "DECLARATIVE_SURFACE_BINDING_REGISTRY_NOT_RUNTIME_OR_CANON_AUTHORITY"
    routes = data["routes"]
    hrefs = [row["href"] for row in routes]
    assert len(hrefs) == len(set(hrefs))
    workspace = {row["href"] for row in routes if row["kind"] == "WORKSPACE"}
    systems = {row["href"] for row in routes if row["kind"] == "SYSTEM"}
    assert workspace == EXPECTED_WORKSPACES
    assert systems == EXPECTED_SYSTEMS
    for row in routes:
        for field in ("provider", "evidence_class", "authority_required", "failure_behavior"):
            assert row.get(field), (row["id"], field)
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


def test_r223_final_surface_contract_reuses_predecessor_enhancers_and_requires_all_markers():
    source = _text(SRC / "surfaceContractR223.ts")
    for required in (
        "enhanceUniversalWorkspaceR193",
        "enhanceOneSystemNavigationR195",
        "enhanceMenuTruthR214",
        'id="omegaR193Rail"',
        'id="omegaR214ControlMenu"',
        'id="omegaNavigationIntegrityR215Runtime"',
        'id="omegaMenuTruthR214Runtime"',
        'id="omegaSurfaceBindingIntegrityR216Runtime"',
        'id="omegaFinalSurfaceContractR223"',
        'headers.set("x-omega-surface-contract-state", complete ? "COMPLETE" : "INCOMPLETE")',
    ):
        assert required in source


def test_r223_exposes_machine_readable_registry_without_claiming_execution_or_promotion():
    source = _text(SRC / "system" / "liveSystemSurfaceClosureR223.ts")
    assert 'url.pathname === "/api/surface/r223/registry"' in source
    assert "SURFACE_CAPABILITY_REGISTRY_R223" in source
    for forbidden in (
        "canonicalMutation: true",
        "promotionAuthorized: true",
        "wrangler deploy",
        "CF_API_TOKEN",
    ):
        assert forbidden not in source
