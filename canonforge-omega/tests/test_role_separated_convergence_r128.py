from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
HEARTBEAT = WORKER / "src" / "heartbeatTruth.ts"
WRANGLER = WORKER / "wrangler.toml"
VERIFY = ROOT.parent / ".github" / "workflows" / "omega-v6-verify.yml"


def test_r128_preserves_canonical_entrypoint_and_durable_object_contract():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'name = "OMEGA_RUNTIME"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert '[exports.OmegaRuntime]' in wrangler
    assert 'type = "durable-object"' in wrangler
    assert 'storage = "sqlite"' in wrangler
    assert '[[migrations]]' not in wrangler
    assert 'binding = "GENESIS"' in wrangler
    assert 'service = "omega-genesis-v1"' in wrangler


def test_r128_negotiates_role_separated_genesis_v3_inside_heartbeat_truth():
    source = HEARTBEAT.read_text(encoding="utf-8")
    for token in [
        'OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3',
        'OMEGA_ROLE_SEPARATED_CONVERGENCE_V1',
        'GENESIS_DISCOVERY_EVOLUTION_AUTHORITY',
        'V6_CANONICAL_OPERATIONAL_RUNTIME',
        'omega-v6-full-convergence',
        'operational_release_authority === false',
        'genesis_may_deploy_v6 === false',
        'authority_contract_ready',
        'reciprocal_manifest_ready = compatible',
        'v6_release_authority',
    ]:
        assert token in source
    assert 'if (url.pathname === "/camera" || url.pathname === "/reconstruct")' in source
    assert 'pc_online_requires_current_heartbeat = true' in source


def test_r128_production_verifier_requires_roles_digest_and_v3_without_rebranding_health():
    source = VERIFY.read_text(encoding="utf-8")
    assert 'EXPECTED_BUILD: r87-semantic-edge-settle-proof' in source
    assert 'OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3' in source
    assert 'OMEGA_ROLE_SEPARATED_CONVERGENCE_V1' in source
    assert 'GENESIS_DISCOVERY_EVOLUTION_AUTHORITY' in source
    assert 'V6_CANONICAL_OPERATIONAL_RUNTIME' in source
    assert 'manifest.get("manifest_digest") != peer_manifest.get("digest")' in source
    assert 'genesis_may_deploy_v6' in source
    assert 'LIVE_CONVERGENCE_VERIFIED__ROLE_SEPARATED_V3' in source
