from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
RUNTIME = SRC / "runtimeEntryR169.ts"
FABRIC = SRC / "system" / "operationalProvenanceFabricR209.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r209_is_additive_on_preserved_r169_authority():
    runtime = read(RUNTIME)
    wrangler = read(WRANGLER)
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert 'import { handleOperationalProvenanceR209 } from "./system/operationalProvenanceFabricR209"' in runtime
    assert "handleOperationalProvenanceR209(request, env, ctx, runtimeFetch)" in runtime
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in runtime
    assert 'export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in runtime
    assert 'export { OmegaHybridMissionLedgerR203 } from "./system/hybridMissionLedgerR203"' in runtime


def test_r209_unifies_established_domains_without_new_authority():
    text = read(FABRIC)
    for token in (
        'domain: "runtime"', 'domain: "proof"', 'domain: "surface"', 'domain: "evidence"',
        'domain: "archive"', 'domain: "earth"', 'domain: "operator"', 'domain: "mission"',
        'domain: "continuity"', 'domain: "hybrid"', 'domain: "cloud"', 'domain: "federation"',
        'domain: "solver"', 'domain: "compute"', 'domain: "intelligence"', 'domain: "motion"',
    ):
        assert token in text
    assert 'authority: "CORRELATED_EVIDENCE_VIEW_NOT_NEW_RUNTIME_AUTHORITY"' in text
    assert 'canonicalMutation: false' in text
    assert 'hostStateMutation: false' in text
    assert 'promotionAuthorized: false' in text


def test_r209_preserves_required_truth_boundaries():
    text = read(FABRIC)
    for boundary in (
        "driveSnapshotIsNotLiveDriveTelemetry",
        "publicSarCatalogIsNotRealTimeRadar",
        "sarMetadataIsNotInSarDeformation",
        "derivedVisualizationIsNotMeasuredObservation",
        "solverAvailableIsNotSolverExecuted",
        "cloudConfiguredIsNotCloudExecutionProof",
        "pcConfiguredIsNotPcOnline",
        "pcOnlineRequiresCurrentAuthenticatedHeartbeat",
        "returnedIsNotVerified",
        "verifiedReturnIsNotCanonState",
    ):
        assert boundary in text
    assert '[12, 144, 1728, 20736, 248832]' in text
    assert 'atlas/address resolution levels; not literal physical dimensions' in text


def test_r209_provenance_classes_are_explicit_and_queryable():
    text = read(FABRIC)
    for cls in ("LIVE_VERIFIED", "LIVE_OBSERVED", "ARCHIVAL_SNAPSHOT", "DERIVED", "AVAILABLE", "UNAVAILABLE"):
        assert cls in text
    assert '"/api/system/r209/manifest"' in text
    assert '"/api/system/r209/status"' in text
    assert '"/api/system/r209/query"' in text
    assert "SOURCE_RESPONSES_WITH_PROVENANCE_NOT_CANON_ADMISSION" in text


def test_r209_keeps_r198_and_r195_semantics_explicit():
    text = read(FABRIC)
    assert 'id: "drive"' in text and '"ARCHIVAL_SNAPSHOT"' in text
    assert 'id: "earthSar"' in text and '"LIVE_OBSERVED"' in text
    assert "Latest available source-backed catalog observations" in text
    assert "external Drive freshness is outside Worker authority" in text
