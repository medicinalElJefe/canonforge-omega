from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src"
ENTRY = WORKER / "runtimeEntryR169.ts"
GROUND = WORKER / "sai" / "sourceGroundingR197.ts"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r197_preserves_real_b059_as_first_authority_and_only_falls_back_on_503():
    entry = text(ENTRY)
    assert '"/api/sai/query"' in entry
    assert 'const b059 = await canonical.fetch(request, env, ctx)' in entry
    assert 'if (b059.status !== 503) return b059' in entry
    assert 'sourceGroundedQueryR197(fallbackRequest, env, ctx, runtimeFetch, b059.status)' in entry
    assert 'if (B059_SOVEREIGN_PATHS.has(url.pathname)) return canonical.fetch' in entry
    assert 'handleSourceGroundingR197(request, env, ctx, runtimeFetch)' in entry


def test_r197_grounding_is_scope_limited_and_never_inflates_b059_or_training_authority():
    source = text(GROUND)
    for marker in (
        'SOURCE_GROUNDING_SCHEMA_R197 = "OMEGA_SOURCE_GROUNDED_BUILD_CANON_R197"',
        'SOURCE_GROUNDING_AUTHORITY_R197 = "ADMITTED_BUILD_CANON_RETRIEVAL_NOT_B059_FULL_CORPUS"',
        'source_scope: "ADMITTED_LIVE_BUILD_CANON_ONLY"',
        'b059_full_corpus_verified: false',
        'sovereign_b059_required_for_full_corpus: true',
        'fully_trained_within_declared_scope: false',
        'foundation_model_weights_trained: false',
        'canonicalMutation: false',
        'promotionAuthorized: false',
        'BUILD_CANON_SCOPE_MISS',
        'evidence_sha256',
        'receipt_sha256',
    ):
        assert marker in source


def test_r197_grounding_reads_admitted_live_sources_instead_of_copying_a_fake_b059_database():
    source = text(GROUND)
    assert '"/api/system/r195/manifest"' in source
    assert '"/api/compute/dewey/r195/manifest"' in source
    assert 'OMEGA_ADDRESS_HIERARCHY_R195' in source
    assert 'WOVEN_CONTINUITY_OPERATOR_R195' in source
    assert 'REFERENCE_KERNEL_POLICY_R195' in source
    assert 'DEWEY_OPERATOR_BASIS_R195' in source
    assert 'sourceReady && evidence.length > 0' in source
    assert '541526' not in source
    assert '82082' not in source


def test_r197_explicit_source_query_route_is_additive():
    source = text(GROUND)
    entry = text(ENTRY)
    assert 'url.pathname !== "/api/sai/source-query"' in source
    assert 'handleSourceGroundingR197' in entry
    assert 'if (url.pathname.startsWith("/api/sai/")) return handleSaiRequest' in entry
