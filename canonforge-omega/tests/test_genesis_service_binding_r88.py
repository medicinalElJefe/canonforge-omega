from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "index.ts"
CONVERGENCE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "convergence.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_v6_has_internal_genesis_service_binding():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert '[[services]]' in wrangler
    assert 'binding = "GENESIS"' in wrangler
    assert 'service = "omega-genesis-v1"' in wrangler


def test_env_types_genesis_fetch_binding():
    source = INDEX.read_text(encoding="utf-8")
    assert 'GENESIS?:' in source
    assert 'fetch(input: Request | string | URL' in source


def test_convergence_prefers_service_binding_over_same_zone_global_fetch():
    source = CONVERGENCE.read_text(encoding="utf-8")
    assert 'async function genesisProbe' in source
    assert 'if (env.GENESIS)' in source
    assert 'env.GENESIS.fetch' in source
    assert 'transport: "SERVICE_BINDING"' in source
    assert 'PUBLIC_FETCH_FALLBACK' in source
    for endpoint in (
        '/_omega/health',
        '/api/health',
        '/api/convergence/manifest',
        '/api/capabilities',
        '/api/mode?id=ALL_MODES',
    ):
        assert f'genesisProbe(env, "{endpoint}")' in source


def test_service_binding_repair_preserves_non_recursive_manifest_contract():
    source = CONVERGENCE.read_text(encoding="utf-8")
    assert 'OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2' in source
    assert 'reciprocal_manifest_ready' in source
    assert 'genesis_manifest_digest' in source
