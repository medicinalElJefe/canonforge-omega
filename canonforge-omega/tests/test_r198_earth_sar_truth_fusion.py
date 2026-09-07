from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SAR = (WORKER / "src" / "earthSarTruthFusionR198.ts").read_text(encoding="utf-8")
REPAIR = (WORKER / "src" / "earthSarIntegratedRepairR198_1.ts").read_text(encoding="utf-8")
NAV = (WORKER / "src" / "system" / "oneSystemNavigationR195.ts").read_text(encoding="utf-8")
ENTRY = (WORKER / "src" / "runtimeEntryR169.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r198_1_preserves_canonical_r169_entrypoint_and_r195_boundary():
    assert 'main = "src/runtimeEntryR169.ts"' in WRANGLER
    assert 'enhanceOneSystemNavigationR195' in ENTRY
    assert 'handleEarthSarFusionR198' not in NAV
    assert 'enhanceEarthSarTruthR198' not in NAV
    assert 'from "../earthSarTruthFusionR198"' not in NAV
    assert 'x-omega-one-system' in NAV


def test_r198_1_routes_full_original_request_before_legacy_handlers():
    assert 'import { handleEarthSarFusionR198 } from "./earthSarTruthFusionR198"' in ENTRY
    assert 'const earthSarR198 = await handleEarthSarFusionR198(request);' in ENTRY
    assert 'if (earthSarR198) return earthSarR198;' in ENTRY
    assert 'new Request("https://omega-r198.internal" + pathname' not in ENTRY
    assert 'new Request("https://omega-r198.internal" + pathname' not in NAV


def test_r198_1_integrates_inside_existing_earth_instrument_only():
    assert 'id=\"omegaEarthTruthLayers\"' in REPAIR
    assert 'hasEarthInstrument' in REPAIR
    assert 'if (!hasEarthInstrument)' in REPAIR
    assert 'sar1981Tab' in REPAIR
    assert 'REAL SAR' in REPAIR
    assert 'stage.appendChild(overlay)' in REPAIR
    assert 'panel.insertBefore(ledger' in REPAIR
    assert 'const nativeSarEarth = await enhanceEarthSarIntegratedRepairR198_1(oneSystemEarth, request.url);' in ENTRY
    assert 'return enhanceEarthSarVisualContextR198_2(nativeSarEarth, request.url);' in ENTRY
    assert ENTRY.index('enhanceEarthSarIntegratedRepairR198_1(oneSystemEarth, request.url)') < ENTRY.index('enhanceEarthSarVisualContextR198_2(nativeSarEarth, request.url)')
    assert 'omegaSarTruthR198Runtime' not in REPAIR


def test_r198_1_existing_earth_modes_are_not_replaced():
    for mode in ['[data-etl-view]', '#etlCanvas', '.etlLegend', '.etlTabs', '.etlPanel']:
        assert mode in REPAIR
    assert "baseCanvas.style.visibility=on?'hidden':''" in REPAIR
    assert "setSar(false)" in REPAIR
    assert "tabs.appendChild(tab)" in REPAIR


def test_r198_preserves_durable_object_contract():
    for name in [
        "OmegaRuntime",
        "OmegaSwarmCell",
        "OmegaSwarmCoordinator",
        "OmegaSwarmBranch",
        "OmegaSwarmOrgan",
        "OmegaSwarmOrganismCoordinator",
        "OmegaSwarmAutonomicCoordinator",
    ]:
        assert f"[exports.{name}]" in WRANGLER


def test_r198_public_sar_providers_are_real_catalogs():
    assert "https://stac.dataspace.copernicus.eu/v1/search" in SAR
    assert "https://cmr.earthdata.nasa.gov/search/collections.json?keyword=NISAR" in SAR
    assert "umbra-open-data-catalog" in SAR
    assert "capella-open-data" in SAR
    assert "iceye-open-data-catalog" in SAR


def test_r198_never_promotes_catalog_metadata_to_insar_displacement():
    assert "No displacement claim is made from catalog metadata" in SAR
    assert "InSAR requires phase-coherent products" in SAR
    assert 'inferred: "WITHHELD' in SAR
    assert 'forecast: "WITHHELD' in SAR
    assert "no_invented_coordinates: true" in SAR


def test_r198_1_source_geometry_and_truth_boundary_are_explicit():
    assert "SOURCE_GEOMETRY only" in REPAIR
    assert "NO SYNTHETIC FOOTPRINTS" in REPAIR
    assert "display_projection:'DERIVED_FRAMEWORK_MATH" in REPAIR
    assert "insar_displacement:'WITHHELD'" in REPAIR
    assert "forecast:'WITHHELD'" in REPAIR
    assert "source footprint" in REPAIR.lower()


def test_r198_truth_classes_remain_separate():
    for token in [
        "OBSERVED_SOURCE",
        "DERIVED_FRAMEWORK_MATH",
        "INFERRED_STATE",
        "FORECAST_PROJECTION",
        "SOURCE_GEOMETRY",
        "WITHHELD_UNTIL_GRANULE_GEOMETRY",
    ]:
        assert token in SAR
