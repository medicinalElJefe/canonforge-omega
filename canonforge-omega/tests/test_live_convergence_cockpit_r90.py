from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WRAPPER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
CONVERGENCE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "convergence.ts"
RELEASE = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"


def test_r90_adds_user_visible_live_convergence_surface():
    source = WRAPPER.read_text(encoding="utf-8")
    assert 'url.pathname === "/convergence"' in source
    assert "Governed live convergence" in source
    assert "Manifest agreement" in source
    assert "Capability genome" in source
    assert "Hybrid truth" in source
    assert 'href="/convergence"' in source


def test_r90_cockpit_is_observation_only_and_preserves_authorities():
    source = WRAPPER.read_text(encoding="utf-8")
    assert "cockpit is an observation surface" in source
    assert '"x-omega-authority": "observation-only"' in source
    assert "V6 remains operational release authority" in source
    assert "Genesis remains discovery/evolution authority" in source


def test_r90_preserves_current_heartbeat_requirement_for_pc_online():
    source = WRAPPER.read_text(encoding="utf-8")
    assert "node.pc_online = Boolean(upstreamOnline && heartbeatCurrent)" in source
    assert "heartbeat_required_for_pc_online = true" in source
    assert "HEARTBEAT_STALE_OR_UNPROVEN" in source
    assert "PC ONLINE requires both" in source


def test_r90_preserves_service_binding_and_public_probe_fallback_contract():
    wrapper = WRAPPER.read_text(encoding="utf-8")
    convergence = CONVERGENCE.read_text(encoding="utf-8")
    assert "env.GENESIS.fetch" in wrapper
    assert 'transport: "SERVICE_BINDING"' in wrapper
    assert 'probe(`${GENESIS}/api/convergence/manifest`)' in convergence
    assert "genesis_transport_boundary" in wrapper


def test_r90_does_not_rebrand_or_weaken_current_production_authority():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    release = RELEASE.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'TRUTH_BOUNDARY_ID = "r88-hybrid-heartbeat-truth"' in wrangler
    assert 'CONVERGENCE_TRANSPORT_ID = "r89-genesis-service-binding"' in wrangler
    assert "release-forward exact-head production" in release
    assert "canonicalGitSha" in release
    assert "/api/acceptance/r181/manifest" in release
    assert "R185 manifest + deployment identity stable across complete sweep: VERIFIED" in release


def test_r90_reports_client_measured_freshness_and_does_not_infer_pc_online_from_transport():
    source = WRAPPER.read_text(encoding="utf-8")
    assert "Date.now()-t" in source
    assert "Evidence '+age(d.timestamp)" in source
    assert "current authenticated heartbeat not proven" in source
    assert "pc.pc_online?'PC ONLINE'" in source
    assert "genesis_transport||m.transport" in source
