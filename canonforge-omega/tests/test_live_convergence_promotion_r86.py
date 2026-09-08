from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"

DEPLOY_STEP = "Deploy exact canonical Worker to Cloudflare and bind version ID"
LIVE_PROOF_STEP = "Prove live exact identity, R217 lease, cumulative truth, version lock, and all 172 R185 nodes"
RESTORE_STEP = "Restore exact pre-deploy Cloudflare deployment if mutation or admission failed"


def test_v6_promotion_requires_live_post_deploy_convergence_proof():
    source = WORKFLOW.read_text(encoding="utf-8")
    assert DEPLOY_STEP in source
    assert LIVE_PROOF_STEP in source
    assert "https://omegav6.jeffdeweyeljefe.workers.dev" in source
    assert "/api/system/r217/release-lease" in source
    assert "OMEGA_RELEASE_PROVENANCE_R217" in source
    assert "expected-release-lease.txt" in source
    assert "RELEASE_LEASE_MISMATCH" in source
    assert "/api/system/r211/manifest" in source
    assert "/api/system/r205/manifest" in source
    assert "/api/system/r204/manifest" in source
    assert "/api/acceptance/r181/manifest" in source
    assert "/api/mission/r201/verify" in source
    assert "verify_r185_live_federation.py" in source
    assert "canonicalGitSha" in source
    assert "pcOnlineRequiresCurrentAuthenticatedHeartbeat" in source
    assert "R185 manifest + deployment identity stable across complete sweep: VERIFIED" in source
    assert "expected-version-id.txt" in source
    assert "PRODUCTION_WRITER_RACE" in source


def test_live_proof_runs_after_deploy_and_before_success_record_or_restore_decision():
    source = WORKFLOW.read_text(encoding="utf-8")
    deploy = source.index(DEPLOY_STEP)
    proof = source.index(LIVE_PROOF_STEP)
    restore = source.index(RESTORE_STEP)
    record = source.index("Publish production proof summary")
    assert deploy < proof < restore < record


def test_failed_admission_restores_the_exact_predeploy_version_set_only_when_owned():
    source = WORKFLOW.read_text(encoding="utf-8")
    assert "pre-restore-payload.json" in source
    assert "pre-version-ids.json" in source
    assert '"$DEPLOYMENTS_URL?force=true"' in source
    assert "RESTORE_TARGET_MISMATCH" in source
    assert "RESTORE_WITHHELD_PRODUCTION_WRITER_RACE" in source
    assert "EXTERNAL_OR_UNATTRIBUTED_PRODUCTION_MUTATION" in source
    assert "exit 1" in source


def test_public_health_has_distinct_edge_settle_build_identity():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
