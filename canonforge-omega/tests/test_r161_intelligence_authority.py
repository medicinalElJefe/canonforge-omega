from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"


def test_r161_is_canonical_worker_entry_without_replacing_omega_runtime():
    wrangler = (WORKER / "wrangler.toml").read_text(encoding="utf-8")
    entry = (WORKER / "src" / "r161Entry.ts").read_text(encoding="utf-8")
    assert 'main = "src/r161Entry.ts"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert 'service = "omega-genesis-v1"' in wrangler
    assert 'import heartbeatTruth, { OmegaRuntime } from "./heartbeatTruth";' in entry
    assert 'export { OmegaRuntime };' in entry
    assert 'enhanceIntelligenceAuthorityRuntime(response)' in entry


def test_r161_fast_path_is_evidence_bound_and_zero_chat():
    source = (WORKER / "src" / "intelligenceAuthorityRuntime.ts").read_text(encoding="utf-8")
    assert "FAST_DETERMINISTIC" in source
    assert "modelCall:false" in source
    assert "/api/convergence/edge" in source
    assert "/api/hybrid/status" in source
    assert "/api/development/status" in source
    assert "/api/health" in source
    fast_body = source.split("async function fast", 1)[1].split("const oldRoute", 1)[0]
    assert "/api/chat" not in fast_body
    assert "not proven online" in source
