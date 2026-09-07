from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def read(name: str) -> str:
    return (SRC / name).read_text()


def test_r194_is_additive_after_r192_and_r193():
    entry = read("runtimeEntryR169.ts")
    assert 'main = "src/runtimeEntryR169.ts"' in (WORKER / "wrangler.toml").read_text()
    assert 'enhanceUniversalNavigationR192(response, new URL(request.url).pathname)' in entry
    assert 'enhanceUniversalWorkspaceR193(r192, new URL(request.url).pathname)' in entry
    assert 'enhanceEvidencePlaneR194(r193, new URL(request.url).pathname)' in entry
    assert 'handleEvidencePlaneR194(request, env, ctx, runtimeFetch)' in entry


def test_r194_never_relabels_external_evidence_as_local():
    r194 = read("evidencePlaneR194.ts")
    r190 = read("acceptance/wholeSystemAcceptanceR190.ts")
    for path in (
        "/api/omega/state",
        "/api/omega/proof?limit=1",
        "/api/restoration",
        "/api/earth/catalog",
        "/api/sai/status",
        "/api/hybrid/status",
    ):
        assert path in r194
    for marker in (
        "localWorkerContractIsNotSovereignState: true",
        "localProofSchemaIsNotSovereignProofHistory: true",
        "localReplaySchemaIsNotSovereignRestorationState: true",
        "earthCatalogMissingMeansObservationWithheld",
        "b059MissingMeansTrainingVerificationWithheld",
        "pcOnlineRequiresCurrentHeartbeat: true",
        "nativeRcwaNotInferred: true",
    ):
        assert marker in r194
    assert 'availability: "EXTERNAL_EVIDENCE"' in r190
    assert 'id: "SOVEREIGN_CANONICAL_STATE"' in r190
    assert 'id: "SOVEREIGN_PC"' in r190


def test_r194_uses_real_local_contracts_for_graceful_degradation():
    r194 = read("evidencePlaneR194.ts")
    expected = {
        "/api/state/workbench/schema": "OMEGA_STATE_WORKBENCH_SCHEMA_V1",
        "/api/core/evidence-ledger/schema": "OMEGA_BINDING_EVIDENCE_LEDGER_V1",
        "/api/core/replay/schema": "OMEGA_UNIFIED_CORE_VALIDATION_REPLAY_V1",
    }
    for path, schema in expected.items():
        assert path in r194
        assert schema in r194
    assert "/api/sai/manifest" in r194
    assert "OMEGA_SAI_MANIFEST_R179" in r194
    assert "/api/convergence/edge" in r194


def test_r194_repairs_misleading_root_degraded_labels_without_faking_state():
    r194 = read("evidencePlaneR194.ts")
    for text in (
        "Local state instrument live · sovereign packet unavailable",
        "LOCAL STATE CONTRACT READY",
        "COMPUTATION-ONLY · LIVE PACKET WITHHELD",
        "EARTH TRUTH LAYER LIVE · SOURCE CATALOG BLOCKED",
        "0 observed identities · no substitution",
        "SOVEREIGN CONTROL LIVE · PC NOT PROVEN",
        "Local evidence fabric live · sovereign proof history blocked.",
        "Local replay/recovery contract live · sovereign restoration state blocked.",
    ):
        assert text in r194
    assert "setInterval(load,10000)" in r194
    assert "nativeRcwaNotInferred: true" in r194


def test_r194_status_api_remains_json_and_root_only_enhancer_is_html():
    r194 = read("evidencePlaneR194.ts")
    assert 'path !== "/api/workspace/r194/status"' in r194
    assert 'path !== "/api/workspace/r194/health"' in r194
    assert '"content-type": "application/json; charset=utf-8"' in r194
    assert 'if (!type.includes("text/html") || (pathname !== "/" && pathname !== "")) return response' in r194
    assert 'headers.set("x-omega-evidence-plane", EVIDENCE_PLANE_RELEASE_R194)' in r194


def test_existing_advanced_truth_surfaces_are_retained():
    earth = read("earthTruthLayers.ts")
    hybrid = read("sovereignDevicesCompute.ts")
    sai = read("sai/saiRuntimeR179.ts")
    assert "No Earth source state is fabricated" in earth
    assert "Missing coordinates and missing state are explicitly withheld" in earth
    assert "PC ONLINE is displayed only when /api/convergence/edge reports pc_online=true" in hybrid
    assert "does not create credentials" in hybrid
    assert "OPERATIONAL_INFERENCE_NOT_FULLY_FINE_TUNED" in sai
    assert "exactTrainingManifestComplete: false" in sai
