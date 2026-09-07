from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "omega-v6-r198-production-deploy.yml"
R200_BASE = "8f28b350f1c47974204beda484adbb88f9c06949"


def _workflow() -> str:
    return WORKFLOW.read_text(encoding="utf-8")


def test_r200_promotion_is_exact_head_and_runtime_immutable():
    text = _workflow()

    assert "OMEGA V6 R200.1 exact-head guarded production promotion" in text
    assert "branches:\n      - omega-v6-full-convergence" in text
    assert f"R200_RUNTIME_BASE_SHA: {R200_BASE}" in text
    assert 'git merge-base --is-ancestor "$R200_RUNTIME_BASE_SHA" HEAD' in text
    assert "R200_RUNTIME_DRIFT_BLOCKED" in text
    assert "canonforge-omega/cloudflare/omega-v6-worker" in text
    assert "canonforge-omega/omega_runtime" in text
    assert "canonforge-omega/api" in text
    assert "canonforge-omega/config" in text
    assert "R200_RUNTIME_TREE_PRESERVED" in text
    assert "test \"$REMOTE_HEAD\" = \"$GITHUB_SHA\"" in text
    assert "test \"$LOCAL_HEAD\" = \"$GITHUB_SHA\"" in text


def test_r200_promotion_binds_exact_deployment_identity_without_source_mutation():
    text = _workflow()

    assert "source config must remain identity-neutral" in text
    assert "CANONICAL_GIT_SHA" in text
    assert "wrangler.promotion.toml" in text
    assert "git diff --exit-code -- wrangler.toml" in text
    assert "deploymentIdentityBound" in text
    assert "canonicalGitSha" in text
    assert "LIVE_CANONICAL_SHA_VERIFIED" in text


def test_r200_promotion_keeps_proof_before_deploy_and_live_acceptance_after_deploy():
    text = _workflow()

    pytest_pos = text.index("python -m pytest -q")
    typecheck_pos = text.index("npm run typecheck")
    dry_run_pos = text.index("npx wrangler deploy --dry-run --config wrangler.promotion.toml")
    head_gate_pos = text.index("Re-prove exact canonical head immediately before mutation")
    deploy_pos = text.index("npx wrangler deploy --config wrangler.promotion.toml")
    identity_pos = text.index("Prove live deployment identity is this exact canonical SHA")
    r200_live_pos = text.index("R200_MISSION_KERNEL_LIVE_VERIFIED")
    r192_live_pos = text.index("R192_NAVIGATION_HOME_LIVE_VERIFIED")
    r178_live_pos = text.index("R178_LIVE_EXECUTION_AND_CANDIDATE_VERIFIED")

    assert pytest_pos < typecheck_pos < dry_run_pos < head_gate_pos < deploy_pos
    assert deploy_pos < identity_pos < r200_live_pos < r192_live_pos < r178_live_pos


def test_r200_live_gate_preserves_cumulative_truth_boundaries():
    text = _workflow()

    assert "OMEGA_MISSION_KERNEL_MANIFEST_R200" in text
    assert "r200-canonical-mission-kernel" in text
    assert "canonicalMutation" in text
    assert "promotionAuthorized" in text
    assert "OMEGA_WARP_BUILD_CANDIDATE_MANIFEST_R178" in text
    assert "RETURNED_NOT_ADMITTED" in text
    assert "CANDIDATE_NOT_CANON" in text
    assert "strictCompletionInvariant" in text
    assert "no_invented_coordinates" in text
    assert "WITHHELD" in text
    assert "NASA GIBS" in text
    assert "EARTH_VISUAL_LAYER_LEAKED_INTO_HYBRID" in text


def test_r200_promotion_is_not_an_ordinary_runtime_auto_deploy():
    text = _workflow()

    trigger_section = text.split("concurrency:", 1)[0]
    assert "paths:\n      - .github/workflows/omega-v6-r198-production-deploy.yml" in trigger_section
    assert "canonforge-omega/**" not in trigger_section
    assert "cancel-in-progress: false" in text
    assert "github.event_name == 'push'" in text
    assert "refs/heads/omega-v6-full-convergence" in text
