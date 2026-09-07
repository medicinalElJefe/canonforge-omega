from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
RUNTIME = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r212_is_release_forward_not_r205_delta_allowlist():
    text = read(WORKFLOW)
    assert "release-forward exact-head production" in text
    assert "R205_UNEXPECTED_PROMOTION_DELTA" not in text
    assert "allowed=(" not in text
    assert "push:" in text and "branches: [omega-v6-full-convergence]" in text
    assert "MIN_CANONICAL_SHA: 596b5365d271c6abaa9604a1c880b2c04f3010df" in text


def test_r212_proves_full_cumulative_candidate_before_deploy():
    text = read(WORKFLOW)
    assert "python scripts/check_cloudflare_contract.py --strict" in text
    assert "python -m pytest -q" in text
    assert "npm run typecheck" in text
    assert "wrangler deploy --dry-run" in text
    assert "needs: prove-exact-canonical" in text


def test_r212_binds_exact_sha_without_mutating_source_wrangler():
    text = read(WORKFLOW)
    assert "wrangler.release-forward.toml" in text
    assert "CANONICAL_GIT_SHA" in text
    assert "git diff --exit-code -- wrangler.toml" in text
    assert 'main = "src/runtimeEntryR169.ts"' in read(WRANGLER)
    runtime = read(RUNTIME)
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in runtime


def test_r212_live_proof_covers_current_operational_truth_chain():
    text = read(WORKFLOW)
    for route in (
        "/api/system/r211/manifest",
        "/api/system/r211/status",
        "/api/system/r211/query?domain=earth",
        "/api/system/r205/manifest",
        "/api/system/r204/manifest",
        "/api/acceptance/r181/manifest",
        "/api/mission/r201/verify",
        "/_omega/health",
    ):
        assert route in text
    assert "OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R211" in text
    assert "OMEGA_WHOLE_SYSTEM_CONTROL_MANIFEST_R205" in text
    assert "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204" in text
    assert "pcOnlineRequiresCurrentAuthenticatedHeartbeat" in text


def test_r212_rolls_back_on_failed_live_proof():
    text = read(WORKFLOW)
    assert "continue-on-error: true" in text
    assert "if: steps.liveproof.outcome != 'success'" in text
    assert "npx wrangler rollback" in text
    assert "exit 1" in text
