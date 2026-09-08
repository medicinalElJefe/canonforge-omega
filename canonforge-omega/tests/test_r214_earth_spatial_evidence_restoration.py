from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
RUNTIME = SRC / "runtimeEntryR169.ts"
EARTH = SRC / "earthSpatialEvidenceR214.ts"
COMPAT = SRC / "surfaceCompatibilityR214.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r214_preserves_canonical_r169_entrypoint():
    assert 'main = "src/runtimeEntryR169.ts"' in read(WRANGLER)
    runtime = read(RUNTIME)
    assert 'import canonicalRuntime from "./heartbeatTruth"' in runtime
    assert 'handleEarthSpatialEvidenceR214' in runtime
    assert 'handleSurfaceCompatibilityR214' in runtime


def test_r214_seismic_geometry_is_source_coordinate_not_summary_animation():
    s = read(EARTH)
    for token in (
        "earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
        "lon, lat, depthKm",
        'source: "USGS_EARTHQUAKE_HAZARDS_PROGRAM"',
        'seismicLocations: "SOURCE_COORDINATES_ONLY"',
        "noSummaryToFakeGeometry: true",
        "q.lon,q.lat",
    ):
        assert token in s, token
    forbidden = (
        "Math.random(",
        "seeded",
        "red pulse = returned seismic magnitude",
        "hash(s.id)",
    )
    for token in forbidden:
        assert token not in s, token


def test_r214_layers_preserve_truth_scope():
    s = read(EARTH)
    for token in (
        "NASA_GIBS_VIIRS_SNPP_TRUE_COLOR",
        "NASA_EONET",
        "R198_PUBLIC_SAR_CATALOGS",
        "SOURCE_GEOMETRY_ONLY",
        "RETURNED_PUBLIC_WEATHER_MODEL_NOT_STATION_MEASUREMENT",
        "GLOBAL_GEOMAGNETIC_INDEX_NOT_LOCAL_MAP_OBSERVATION",
        "OMEGA MODEL / INTERFACE SHELL · NOT OBSERVED EARTH",
        "canonicalMutation: false",
        "promotionAuthorized: false",
    ):
        assert token in s, token


def test_r214_replaces_legacy_decorative_earth_panel_without_deleting_it():
    s = read(EARTH)
    assert "#omegaEarthTruthLayers{display:none!important}" in s
    assert "legacy.before(root)" in s
    runtime = read(RUNTIME)
    assert "enhanceEarthSarIntegratedRepairR198_1" in runtime
    assert "enhanceEarthSarVisualContextR198_2" in runtime
    assert "enhanceEarthSpatialEvidenceR214" in runtime


def test_r214_restores_known_legacy_routes_locally_without_sovereign_gateway_fallback():
    s = read(COMPAT)
    for token in (
        '"/api/restoration"',
        '"/api/status"',
        '"/api/federation/ceremony/ledger"',
        '"/api/system/r195/restoration"',
        '"/api/federation/r174/manifest"',
        "sovereignGatewayFallbackUsed: false",
        "READ_ONLY_COMPATIBILITY_VIEW_NOT_NEW_FEDERATION_LEDGER",
    ):
        assert token in s, token
    for forbidden in ("sovereign_gateway_not_configured", "SOVEREIGN_ORIGIN", "SOVEREIGN_SECRET"):
        assert forbidden not in s, forbidden


def test_r214_layer_buttons_are_disabled_when_source_layer_is_unavailable():
    s = read(EARTH)
    assert "b.disabled=s.seismic?.ok!==true" in s
    assert "b.disabled=s.naturalEvents?.ok!==true" in s
    assert "b.disabled=s.sar?.ok!==true" in s
    assert "if(b.disabled)return" in s
