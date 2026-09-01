from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WRAPPER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
CONVERGENCE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "convergence.ts"
VERIFY = ROOT.parent / ".github" / "workflows" / "omega-v6-verify.yml"


def test_r90_preserves_user_visible_live_convergence_surface():
    source = WRAPPER.read_text(encoding="utf-8")
    assert 'url.pathname === "/convergence"' in source
    assert "Governed live convergence" in source
    assert "Manifest agreement" in source
    assert "Hybrid truth" in source
    assert 'href="/convergence"' in source
    assert "fetch('/api/convergence/edge'" in source


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
    assert "current authenticated heartbeat not proven" in source


def test_r90_preserves_service_binding_and_public_probe_fallback_contract():
    wrapper = WRAPPER.read_text(encoding="utf-8")
    convergence = CONVERGENCE.read_text(encoding="utf-8")
    assert "env.GENESIS.fetch" in wrapper
    assert 'transport: "SERVICE_BINDING"' in wrapper
    assert 'probe(`${GENESIS}/api/convergence/manifest`)' in convergence
    assert "genesis_transport_boundary" in wrapper


def test_r90_does_not_rebrand_or_weaken_existing_promotion_verifier():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    verify = VERIFY.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'TRUTH_BOUNDARY_ID = "r88-hybrid-heartbeat-truth"' in wrangler
    assert 'CONVERGENCE_TRANSPORT_ID = "r89-genesis-service-binding"' in wrangler
    assert "LIVE_CONVERGENCE_VERIFIED" in verify
    assert "reciprocal_manifest_ready" in verify
    assert "manifest_digest" in verify


def test_r90_reports_client_measured_freshness_and_never_promotes_pc_from_transport():
    source = WRAPPER.read_text(encoding="utf-8")
    assert "Date.now()-t" in source
    assert "'Evidence '+age(d.timestamp)" in source
    assert "current authenticated heartbeat not proven" in source
    assert "pc.pc_online?'PC ONLINE'" in source
    assert "upstream_online_claim" in source
    assert "pc_online_requires_current_heartbeat" in source
