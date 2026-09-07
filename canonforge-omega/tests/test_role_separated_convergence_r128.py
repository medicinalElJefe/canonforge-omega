from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
HEARTBEAT = WORKER / "src" / "heartbeatTruth.ts"
ENTRY = WORKER / "src" / "runtimeEntryR169.ts"
WRANGLER = WORKER / "wrangler.toml"
RELEASE = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"


def test_r128_preserves_canonical_entrypoint_and_durable_object_contract():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'main = "src/runtimeEntryR169.ts"' in wrangler
    assert 'import canonicalRuntime from "./heartbeatTruth"' in entry
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'name = "OMEGA_RUNTIME"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert '[exports.OmegaRuntime]' in wrangler
    assert 'type = "durable-object"' in wrangler
    assert 'storage = "sqlite"' in wrangler
    assert '[[migrations]]' not in wrangler
    assert 'new_sqlite_classes' not in wrangler
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


def test_r128_current_production_verifier_preserves_role_separated_runtime_without_second_publisher():
    source = RELEASE.read_text(encoding="utf-8")
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    assert 'release-forward exact-head production' in source
    assert 'MIN_CANONICAL_SHA:' in source
    assert 'CANONICAL_GIT_SHA' in source
    assert '/api/acceptance/r181/manifest' in source
    assert '/api/system/r211/manifest' in source
    assert 'verify_r185_live_federation.py' in source
    assert 'OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3' in heartbeat
    assert 'OMEGA_ROLE_SEPARATED_CONVERGENCE_V1' in heartbeat
    assert 'GENESIS_DISCOVERY_EVOLUTION_AUTHORITY' in heartbeat
    assert 'V6_CANONICAL_OPERATIONAL_RUNTIME' in heartbeat
    assert 'genesis_may_deploy_v6' in heartbeat
