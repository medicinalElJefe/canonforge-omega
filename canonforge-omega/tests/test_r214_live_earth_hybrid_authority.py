from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r214_preserves_r169_entrypoint_and_r204_alias_seam():
    wrangler = read(WORKER / "wrangler.toml")
    alias = read(SRC / "convergenceRuntimeAliasR204.ts")
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert '"./convergence" = "./src/convergenceRuntimeAliasR204.ts"' in wrangler
    assert 'export { OmegaRuntime } from "./omegaRuntimeR214"' in alias
    assert 'import convergence from "./system/../convergence"' in alias
    assert "enhanceEarthLiveGeospatialR214" in alias
    assert "handleHybridControlPlaneR214" in alias


def test_r214_seismic_layer_is_usgs_geometry_not_generated_dot_animation():
    text = read(SRC / "earthLiveGeospatialR214.ts")
    assert "earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson" in text
    assert "earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson" in text
    assert "earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson" in text
    assert "earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson" in text
    assert "USGS_EVENT_GEOMETRY" in text
    assert 'synthetic_event_coordinates:false' in text
    assert 'seismic_wavefield:\'WITHHELD\'' in text
    assert "No earthquake propagation, shaking field" in text
    assert "for(let i=0;i<22" not in text


def test_r214_restores_real_public_earth_sources_without_overclaiming_fields():
    text = read(SRC / "earthLiveGeospatialR214.ts")
    assert "eonet.gsfc.nasa.gov/api/v3/events" in text
    assert "services.swpc.noaa.gov/products/noaa-planetary-k-index.json" in text
    assert "gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi" in text
    assert "VIIRS_SNPP_CorrectedReflectance_TrueColor" in text
    assert "NASA_EONET_EVENT_GEOMETRY" in text
    assert "Space-weather values are NOAA SWPC observations/products" in text
    assert "This layer does not mislabel true-color imagery as a meteorological scalar/vector field" in text
    assert "DERIVED_FRAMEWORK_MATH" in text


def test_r214_existing_earth_buttons_are_rewired_not_deleted():
    text = read(SRC / "earthLiveGeospatialR214.ts")
    for layer in ("weather", "seismic", "events", "space", "derived"):
        assert f'[data-layer="{layer}"]' in text
    assert "stopImmediatePropagation" in text
    assert "#earthCanvas{visibility:hidden!important}" in text
    assert "SOURCE DEGRADED · NO SUBSTITUTE" in text


def test_r214_hybrid_uses_durable_outbound_broker_not_inbound_pc_gateway_for_control():
    text = read(SRC / "hybridControlPlaneR214.ts")
    runtime = read(SRC / "omegaRuntimeR214.ts")
    assert 'idFromName("OMEGA_CANONICAL_HYBRID_R214")' in text
    assert '"/api/hybrid/agent/poll": "/agent/poll"' in text
    assert '"/api/hybrid/agent/result": "/agent/result"' in text
    assert 'inboundSovereignGatewayRequired: false' in text
    assert 'badGatewayFallbackUsed: false' in text
    assert 'cloudControlPlane: "CLOUDFLARE_DURABLE_OBJECT_OUTBOUND_AGENT_POLL"' in runtime
    assert "inboundPcGatewayRequiredForJobs: false" in runtime


def test_r214_connection_never_equals_execution_authority():
    runtime = read(SRC / "omegaRuntimeR214.ts")
    agent = read(SRC / "hybridControlPlaneR214.ts")
    assert "LOCAL_APPROVAL_REQUIRED" in runtime
    assert "remoteBrowserMayGrant: false" in runtime
    assert 'body.localApproval !== true' in runtime
    assert "LOCAL_EXECUTION_AUTHORITY_REQUIRED" in runtime
    assert 'path === "/agent/poll"' in runtime
    assert 'path === "/jobs"' in runtime
    assert 'path === "/missions"' in runtime
    assert "Grant governed execution control for this PC session for up to 4 hours? [y/N]:" in agent
    assert "Authority NOT granted. Heartbeat/status mode only." in agent
    assert 'approvalMethod":"LOCAL_CONSOLE_EXPLICIT_YES"' in agent


def test_r214_authority_is_device_root_operation_and_time_bounded():
    text = read(SRC / "omegaRuntimeR214.ts")
    assert "MAX_LEASE_SECONDS = 12 * 60 * 60" in text
    assert "DEFAULT_LEASE_SECONDS = 4 * 60 * 60" in text
    assert "target device is outside the local authority lease" in text
    assert "requested root is outside the local authority lease" in text
    assert "outside the local authority lease" in text
    assert "CURRENT_AUTHENTICATED_HEARTBEAT_REQUIRED" in text
    assert "APPROVED_ROOT_MISMATCH" in text


def test_r214_legacy_bridge_migration_grants_no_execution_authority():
    text = read(SRC / "omegaRuntimeR214.ts")
    alias = read(SRC / "convergenceRuntimeAliasR204.ts")
    assert 'path === "/enroll-existing"' in text
    assert "BRIDGE_MIGRATED_AUTHORITY_NOT_GRANTED" in text
    assert "Verified legacy Hybrid credential migrated" in text
    assert "tryLegacyHeartbeatFromDurableR214" in alias
    assert "migrateVerifiedLegacyHeartbeatR214" in alias
    assert "verifiedLegacy.ok" in alias
