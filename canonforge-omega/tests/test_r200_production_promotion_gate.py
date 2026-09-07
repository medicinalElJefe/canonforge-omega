from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LEGACY = ROOT / ".github" / "workflows" / "omega-v6-r198-production-deploy.yml"
RELEASE = ROOT / ".github" / "workflows" / "omega-v6-release-forward-production.yml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r200_exact_head_and_runtime_immutability_laws_survive_in_release_forward():
    text = read(RELEASE)
    legacy = read(LEGACY)
    assert "release-forward exact-head production" in text
    assert "omega-v6-full-convergence" in text
    assert 'git merge-base --is-ancestor "$MIN_CANONICAL_SHA" HEAD' in text
    assert 'test "$(git rev-parse HEAD)" = "$GITHUB_SHA"' in text
    assert 'test "$(git rev-parse "origin/$CANONICAL_BRANCH")" = "$GITHUB_SHA"' in text
    assert "git diff --exit-code -- wrangler.toml" in text
    assert "LEGACY_R198_R200_PRODUCTION_PUBLISHER_RETIRED_R213" in legacy


def test_r200_exact_deployment_identity_binding_survives_without_source_mutation():
    text = read(RELEASE)
    assert "CANONICAL_GIT_SHA" in text
    assert "wrangler.release-forward.toml" in text
    assert "git diff --exit-code -- wrangler.toml" in text
    assert "/api/acceptance/r181/manifest" in text
    assert "canonicalGitSha" in text
    assert "deploymentIdentityBound" not in text or "canonicalGitSha" in text


def test_r200_proof_before_mutation_and_live_acceptance_after_mutation_survive():
    text = read(RELEASE)
    pytest_pos = text.index("python -m pytest -q")
    typecheck_pos = text.index("npm run typecheck")
    dry_run_pos = text.index("npx wrangler deploy --dry-run")
    head_gate_pos = text.index("Final exact-head lock before production mutation")
    deploy_pos = text.index("npx wrangler deploy --config wrangler.release-forward.toml")
    live_pos = text.index("Prove live exact identity, cumulative truth, and all 172 R185 nodes")
    rollback_pos = text.index("Roll back immediately if any live exact-head proof failed")
    assert pytest_pos < typecheck_pos < dry_run_pos < head_gate_pos < deploy_pos < live_pos < rollback_pos


def test_r200_cumulative_truth_boundaries_remain_in_current_live_gate():
    text = read(RELEASE)
    for token in (
        "OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R211",
        "OMEGA_WHOLE_SYSTEM_CONTROL_MANIFEST_R205",
        "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204",
        "/api/acceptance/r181/manifest",
        "/api/mission/r201/verify",
        "pcOnlineRequiresCurrentAuthenticatedHeartbeat",
        "canonicalMutation",
        "promotionAuthorized",
    ):
        assert token in text, token


def test_r200_legacy_publisher_cannot_mutate_production_anymore():
    legacy = read(LEGACY)
    assert "workflow_dispatch" in legacy
    assert "production mutation belongs exclusively" in legacy.lower()
    assert "CLOUDFLARE_API_TOKEN" not in legacy
    assert "CLOUDFLARE_ACCOUNT_ID" not in legacy
    assert "npm run deploy" not in legacy
    assert "wrangler rollback" not in legacy
