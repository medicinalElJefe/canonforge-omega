from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_pc_online_requires_current_authenticated_heartbeat():
    source = WORKER.read_text(encoding="utf-8")
    assert "upstreamOnline && heartbeatCurrent" in source
    assert "heartbeat_required_for_pc_online = true" in source
    assert "pc_online_requires_current_heartbeat = true" in source
    assert "HEARTBEAT_STALE_OR_UNPROVEN" in source


def test_r87_worker_wraps_existing_convergence_without_replacing_runtime():
    source = WORKER.read_text(encoding="utf-8")
    assert 'import convergence, { OmegaRuntime } from "./convergence"' in source
    assert "export { OmegaRuntime }" in source
    assert 'url.pathname !== "/api/convergence/edge"' in source
    assert "convergence.fetch(request, env)" in source


def test_r87_is_the_configured_public_worker_entrypoint():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'BUILD_ID = "r87-hybrid-heartbeat-truth"' in wrangler
