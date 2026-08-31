from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES


ROOT = Path(__file__).resolve().parents[1]


def test_reciprocal_convergence_is_registered_as_new_capability():
    row = next(item for item in CAPABILITIES if item["id"] == "CAP-029")
    assert row["status"] == "LIVE_CORE"
    assert "convergence" in row["name"].lower()


def test_genesis_wrapper_preserves_durable_object_authority_and_exposes_two_surfaces():
    source = (ROOT / "cloudflare/omega-genesis-worker/src/convergence.js").read_text(encoding="utf-8")
    assert 'export {OmegaGenesisState}' in source
    assert '"/api/convergence/manifest"' in source
    assert '"/_omega/convergence"' in source
    assert 'return base.fetch(request,env)' in source


def test_manifest_is_non_recursive_and_peer_probe_is_separate():
    source = (ROOT / "cloudflare/omega-genesis-worker/src/convergence.js").read_text(encoding="utf-8")
    manifest_start = source.index("async function manifest")
    snapshot_start = source.index("async function reciprocalSnapshot")
    manifest_block = source[manifest_start:snapshot_start]
    assert "probe(" not in manifest_block
    assert 'probe(V6_URL+"/_omega/health")' in source
    assert 'probe(V6_URL+"/api/convergence/edge")' in source


def test_manifest_exposes_sanitized_genome_and_truth_boundaries():
    source = (ROOT / "cloudflare/omega-genesis-worker/src/convergence.js").read_text(encoding="utf-8")
    for marker in (
        "capability_genome",
        "manifest_digest",
        "private_corpus_embedded:false",
        "promotion_boundary",
        "dimensional_boundary",
        "DONOR_DISPOSITIONS",
        "OPERATOR_ROLES",
    ):
        assert marker in source


def test_worker_entrypoint_is_convergence_wrapper_without_durable_object_rename():
    wrangler = (ROOT / "cloudflare/omega-genesis-worker/wrangler.toml").read_text(encoding="utf-8")
    assert 'main = "src/convergence.js"' in wrangler
    assert 'class_name = "OmegaGenesisState"' in wrangler
    assert '[exports.OmegaGenesisState]' in wrangler
