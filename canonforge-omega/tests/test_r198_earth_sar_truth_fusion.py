from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SAR = (WORKER / "src" / "earthSarTruthFusionR198.ts").read_text(encoding="utf-8")
NAV = (WORKER / "src" / "system" / "oneSystemNavigationR195.ts").read_text(encoding="utf-8")
ENTRY = (WORKER / "src" / "runtimeEntryR169.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r198_preserves_canonical_r169_entrypoint():
    assert 'main = "src/runtimeEntryR169.ts"' in WRANGLER
    assert 'enhanceOneSystemNavigationR195' in ENTRY
    assert 'handleEarthSarFusionR198' in NAV
    assert 'enhanceEarthSarTruthR198' in NAV
    assert 'EARTH_SAR_TRUTH_R198_ID = "r198-real-public-sar-truth-fusion"' in WRANGLER


def test_r198_is_additive_inside_existing_final_enhancer():
    assert 'from "../earthSarTruthFusionR198"' in NAV
    assert 'pathname.startsWith("/api/earth/sar/r198/")' in NAV
    assert 'return enhanceEarthSarTruthR198' in NAV
    assert 'x-omega-one-system' in NAV


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


def test_r198_only_plots_source_geometry():
    assert "geometryBbox" in SAR
    assert "bboxCenter" in SAR
    assert "coordinate_authority" in SAR
    assert "actual catalog geometry" in SAR
    assert "No synthetic observation will be substituted" in SAR
