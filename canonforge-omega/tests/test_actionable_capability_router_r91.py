from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ROUTER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "capabilityRouter.ts"
HEARTBEAT = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
VERIFY = ROOT.parent / ".github" / "workflows" / "omega-v6-verify.yml"


def test_r91_wraps_r90_r89_r88_runtime_instead_of_replacing_it():
    source = ROUTER.read_text(encoding="utf-8")
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    assert 'import runtime, { OmegaRuntime } from "./heartbeatTruth"' in source
    assert "export { OmegaRuntime }" in source
    assert "return runtime.fetch(request, env as any)" in source
    assert "node.pc_online = Boolean(upstreamOnline && heartbeatCurrent)" in heartbeat
    assert "env.GENESIS.fetch" in heartbeat
    assert 'url.pathname === "/convergence"' in heartbeat


def test_r91_exposes_actionable_browser_and_observation_only_capability_index():
    source = ROUTER.read_text(encoding="utf-8")
    assert 'url.pathname === "/capabilities"' in source
    assert 'url.pathname === "/api/convergence/capabilities"' in source
    assert '"x-omega-authority": "observation-only"' in source
    assert "OMEGA_V6_CAPABILITY_INDEX_V1" in source
    assert "Capability Router" in source
    assert "manifest_agreed" in source
    assert "acceptance_gates" in source


def test_r91_requires_route_preview_before_specialist_open_and_never_executes_on_selection():
    source = ROUTER.read_text(encoding="utf-8")
    assert 'url.pathname === "/api/capability/route"' in source
    assert "OMEGA_V6_CAPABILITY_ROUTE_PREVIEW_V1" in source
    assert 'authority: "routing-only"' in source
    assert "route_before_generation: true" in source
    assert "execution: false" in source
    assert "capability_not_in_current_genome" in source
    assert "Preview route" in source
    assert "q('#open').classList.add('hidden')" in source


def test_r91_specialist_routes_are_allowlisted_and_unknown_targets_fail_closed():
    source = ROUTER.read_text(encoding="utf-8")
    assert 'type V6View = "Field" | "Earth" | "Assistant" | "Hybrid" | "Proof"' in source
    assert 'url.pathname.startsWith("/app/")' in source
    assert "if (!isView(view))" in source
    assert 'error: "unknown_specialist"' in source
    assert "No specialist route is evidenced by current metadata" in source
    assert 'return { view: "Proof"' in source


def test_r91_uses_only_sanitized_public_capability_fields():
    source = ROUTER.read_text(encoding="utf-8")
    for field in ["id", "title", "category", "domain", "summary", "status", "declared_route"]:
        assert field in source
    assert "SOVEREIGN_GATEWAY_TOKEN" not in source
    assert "private_drive" not in source.lower()
    assert "raw_corpus" not in source.lower()


def test_r91_preserves_existing_release_identities_and_verifier():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    verify = VERIFY.read_text(encoding="utf-8")
    assert 'main = "src/capabilityRouter.ts"' in wrangler
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'TRUTH_BOUNDARY_ID = "r88-hybrid-heartbeat-truth"' in wrangler
    assert 'CONVERGENCE_TRANSPORT_ID = "r89-genesis-service-binding"' in wrangler
    assert 'CAPABILITY_ROUTER_ID = "r91-actionable-capability-router"' in wrangler
    assert "LIVE_CONVERGENCE_VERIFIED" in verify
    assert "reciprocal_manifest_ready" in verify
