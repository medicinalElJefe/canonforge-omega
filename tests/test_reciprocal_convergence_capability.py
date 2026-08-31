from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES


def test_reciprocal_convergence_is_measurable_live_core_capability():
    row = next(item for item in CAPABILITIES if item["id"] == "CAP-026")
    assert row["status"] == "LIVE_CORE"
    assert "convergence" in row["name"].lower()


def test_genesis_edge_wrapper_preserves_state_authority_and_exposes_manifest():
    source = Path("cloudflare/omega-genesis-worker/src/convergence.js").read_text(encoding="utf-8")
    assert 'export {OmegaGenesisState}' in source
    assert '"/api/convergence/manifest"' in source
    assert '"/_omega/convergence"' in source
    assert 'private_corpus_embedded:false' in source
    assert 'return base.fetch(request,env)' in source


def test_genesis_worker_routes_through_convergence_wrapper_without_durable_object_rename():
    wrangler = Path("cloudflare/omega-genesis-worker/wrangler.toml").read_text(encoding="utf-8")
    assert 'main = "src/convergence.js"' in wrangler
    assert 'class_name = "OmegaGenesisState"' in wrangler
    assert '[exports.OmegaGenesisState]' in wrangler
