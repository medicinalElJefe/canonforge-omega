from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT.parent / ".github" / "workflows" / "omega-v6-release-forward-production.yml"
R185 = ROOT.parent / ".github" / "workflows" / "omega-v6-r185-live-172-cloud-proof.yml"
VERIFIER = ROOT / "scripts" / "verify_r185_live_federation.py"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r213_release_forward_owns_exhaustive_r185_gate_and_rollback():
    text = read(RELEASE)
    assert "MIN_CANONICAL_SHA: 878f331a38ac01ace480858f9f135e441ad3a1f6" in text
    assert "Prove live exact identity, cumulative truth, and all 172 R185 nodes" in text
    assert "python canonforge-omega/scripts/verify_r185_live_federation.py" in text
    assert '--expected-sha "$GITHUB_SHA"' in text
    assert '--workers 12' in text
    assert "if: steps.liveproof.outcome != 'success'" in text
    assert "npx wrangler rollback" in text
    assert "R185 172 advertised public routes: LIVE VERIFIED" in text
    assert "R185 172 machine routes and Durable Object runtimes: LIVE VERIFIED" in text
    assert "R185 manifest + deployment identity stable across complete sweep: VERIFIED" in text


def test_r213_r185_audit_runs_after_release_forward_not_in_parallel_with_push_deploy():
    text = read(R185)
    assert 'workflows: ["OMEGA V6 release-forward exact-head production"]' in text
    assert "github.event.workflow_run.conclusion == 'success'" in text
    assert "github.event.workflow_run.head_branch == 'omega-v6-full-convergence'" in text
    assert "push:" not in text
    assert 'workflows: ["OMEGA V6 verify"]' not in text
    assert "verify_r185_live_federation.py" in text
    assert 'ref: ${{ env.EXPECTED_SHA }}' in text


def test_r213_verifier_checks_advertised_links_not_reconstructed_number_guesses():
    text = read(VERIFIER)
    assert "NODE_COUNT = 172" in text
    assert "WAVE_COUNT = 15" in text
    assert 'links = node.get("links") or {}' in text
    assert 'public = str(links.get("public") or "")' in text
    assert 'machine = str(links.get("machine") or "")' in text
    assert "ThreadPoolExecutor(max_workers=args.workers)" in text
    assert "runtime.get(\"reachable\") is True" in text
    assert "R185 manifest changed during the exhaustive federation sweep" in text
    assert "prove_identity(base, expected_sha)" in text
    assert '"deploymentIdentityStableAcrossSweep": True' in text
    assert '"manifestStableAcrossSweep": True' in text
    assert '"canonicalMutation": False' in text
    assert '"promotionAuthorizedByReceipt": False' in text
