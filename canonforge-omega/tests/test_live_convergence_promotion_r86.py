from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_v6_promotion_requires_live_post_deploy_convergence_proof():
    source = WORKFLOW.read_text(encoding="utf-8")
    assert "Deploy exact canonical Worker to Cloudflare" in source
    assert "Prove live exact identity, cumulative truth, and all 172 R185 nodes" in source
    assert "https://omegav6.jeffdeweyeljefe.workers.dev" in source
    assert "/api/system/r211/manifest" in source
    assert "/api/system/r205/manifest" in source
    assert "/api/system/r204/manifest" in source
    assert "/api/acceptance/r181/manifest" in source
    assert "/api/mission/r201/verify" in source
    assert "verify_r185_live_federation.py" in source
    assert "canonicalGitSha" in source
    assert "pcOnlineRequiresCurrentAuthenticatedHeartbeat" in source
    assert "R185 manifest + deployment identity stable across complete sweep: VERIFIED" in source


def test_live_proof_runs_after_deploy_and_before_success_record_or_rollback_decision():
    source = WORKFLOW.read_text(encoding="utf-8")
    deploy = source.index("Deploy exact canonical Worker to Cloudflare")
    proof = source.index("Prove live exact identity, cumulative truth, and all 172 R185 nodes")
    rollback = source.index("Roll back immediately if any live exact-head proof failed")
    record = source.index("Publish production proof summary")
    assert deploy < proof < rollback < record


def test_public_health_has_distinct_edge_settle_build_identity():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
