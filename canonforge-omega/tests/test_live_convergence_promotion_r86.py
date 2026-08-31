from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-verify.yml"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_v6_promotion_requires_live_post_deploy_convergence_proof():
    source = WORKFLOW.read_text(encoding="utf-8")
    assert "Verify canonical public convergence" in source
    assert "https://omegav6.jeffdeweyeljefe.workers.dev" in source
    assert "https://omega-genesis-v1.jeffdeweyeljefe.workers.dev" in source
    assert 'api/convergence/edge' in source
    assert 'api/convergence/manifest' in source
    assert 'reciprocal_manifest_ready' in source
    assert 'OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2' in source
    assert 'LIVE_CONVERGENCE_VERIFIED' in source
    assert 'EXPECTED_BUILD: r87-semantic-edge-settle-proof' in source
    assert 'seq 1 30' in source
    assert 'Edge not settled on expected semantic identity yet' in source


def test_live_proof_runs_after_deploy_and_before_promotion_record():
    source = WORKFLOW.read_text(encoding="utf-8")
    deploy = source.index("Deploy exact verified canonical head")
    proof = source.index("Verify canonical public convergence")
    record = source.index("Record promoted SHA")
    assert deploy < proof < record


def test_public_health_has_distinct_edge_settle_build_identity():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
