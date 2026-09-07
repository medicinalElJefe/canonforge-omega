from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
RUNTIME = SRC / "runtimeEntryR169.ts"
FABRIC = SRC / "system" / "operationalProvenanceFabricR211.ts"
ADAPTER = SRC / "system" / "operationalProvenanceFabricR210.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r211_is_additive_to_canonical_r210_and_preserves_r169_authority():
    runtime = read(RUNTIME)
    assert 'main = "src/runtimeEntryR169.ts"' in read(WRANGLER)
    assert 'import { handleOperationalProvenanceR210 } from "./system/operationalProvenanceFabricR210"' in runtime
    assert 'handleOperationalProvenanceR210(request, env, ctx, runtimeFetch)' in runtime
    assert 'handleOperationalProvenanceR211 as handleOperationalProvenanceR210' in read(ADAPTER)
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in runtime
    assert 'export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in runtime
    assert 'export { OmegaHybridMissionLedgerR203 } from "./system/hybridMissionLedgerR203"' in runtime


def test_r211_public_identity_does_not_reuse_canonical_r210_identity():
    text = read(FABRIC)
    assert 'r211-operational-provenance-fabric' in text
    assert 'OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R211' in text
    assert 'predecessor: "r210-sovereign-proof-archive"' in text
    assert '"/api/system/r211/manifest"' in text
    assert '"/api/system/r211/status"' in text
    assert '"/api/system/r211/query"' in text
    assert 'R210 content-addressed local proof retention remains non-Canon evidence' in text


def test_r211_correlates_established_organs_with_explicit_provenance():
    text = read(FABRIC)
    for token in (
        'domain: "runtime"', 'domain: "proof"', 'domain: "surface"', 'domain: "evidence"',
        'domain: "archive"', 'domain: "earth"', 'domain: "operator"', 'domain: "mission"',
        'domain: "continuity"', 'domain: "hybrid"', 'domain: "cloud"', 'domain: "federation"',
        'domain: "solver"', 'domain: "compute"', 'domain: "intelligence"', 'domain: "motion"',
    ):
        assert token in text
    for cls in ("LIVE_VERIFIED", "LIVE_OBSERVED", "ARCHIVAL_SNAPSHOT", "DERIVED", "AVAILABLE", "UNAVAILABLE"):
        assert cls in text
    assert 'path: "/api/earth/sar/r198/sources"' in text
    assert 'path: "/api/system/r195/manifest"' in text


def test_r211_truth_boundaries_are_non_mutating_and_physically_honest():
    text = read(FABRIC)
    for boundary in (
        "driveSnapshotIsNotLiveDriveTelemetry", "publicSarCatalogIsNotRealTimeRadar",
        "sarMetadataIsNotInSarDeformation", "derivedVisualizationIsNotMeasuredObservation",
        "solverAvailableIsNotSolverExecuted", "cloudConfiguredIsNotCloudExecutionProof",
        "pcConfiguredIsNotPcOnline", "pcOnlineRequiresCurrentAuthenticatedHeartbeat",
        "returnedIsNotVerified", "verifiedReturnIsNotCanonState",
    ):
        assert boundary in text
    assert 'canonicalMutation: false' in text
    assert 'hostStateMutation: false' in text
    assert 'promotionAuthorized: false' in text
    assert 'CURRENT_AUTHENTICATED_HEARTBEAT_PROVEN' in text
    assert 'PC_ONLINE_NOT_PROVEN_BY_THIS_OBSERVATION' in text


def test_r211_preserves_atlas_and_continuity_semantics():
    text = read(FABRIC)
    assert '[12, 144, 1728, 20736, 248832]' in text
    assert 'atlas/address resolution levels; not literal physical dimensions' in text
    for item in ("partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"):
        assert item in text
    for state in ("DISCOVERED", "AUTHORIZED", "AVAILABLE", "INVOKED", "RETURNED", "VERIFIED"):
        assert state in text
