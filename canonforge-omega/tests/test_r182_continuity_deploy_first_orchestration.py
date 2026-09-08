from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
GOVERNOR = WORKER / "src" / "swarm" / "swarmGovernorR180.ts"
ACCEPTANCE = WORKER / "src" / "acceptance" / "liveAcceptanceR181.ts"
RELEASE = REPO / ".github" / "workflows" / "omega-v6-release-forward-production.yml"
R176 = REPO / ".github" / "workflows" / "omega-v6-r176-live-warp-proof.yml"
R177 = REPO / ".github" / "workflows" / "omega-v6-r177-live-integrity-proof.yml"
R179 = REPO / ".github" / "workflows" / "omega-v6-r179-live-sai-proof.yml"
R181 = REPO / ".github" / "workflows" / "omega-v6-r181-live-ai-sai-sovereign-proof.yml"
VISUAL = REPO / ".github" / "workflows" / "omega-v6-visual-delivery.yml"

DEPLOY_STEP = "Deploy exact canonical Worker to Cloudflare and bind version ID"
LIVE_PROOF_STEP = "Prove live exact identity, cumulative truth, version lock, and all 172 R185 nodes"
RESTORE_STEP = "Restore exact pre-deploy Cloudflare deployment if mutation or admission failed"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r182_continuity_contract_contracts_instead_of_stopping():
    governor = text(GOVERNOR)
    assert 'SWARM_CONTINUITY_REVISION_R182 = "R182"' in governor
    assert 'SATURATED: { cells: 12, provider: 0, concurrency: 1 }' in governor
    assert 'backgroundPausesWhenSaturated: false' in governor
    assert 'backgroundContinuityFloorWhenSaturated: true' in governor
    assert 'scarCarry' in governor
    assert 'hysteresisApplied' in governor
    assert 'pressureMustBeCalm: true' in governor
    assert 'promotionAuthorized: false' in governor
    assert 'canonicalMutation: false' in governor


def test_r182_live_proofs_are_reusable_not_blind_push_pollers():
    for path in (R176, R177, R179, R181, VISUAL):
        workflow = text(path)
        assert 'workflow_call:' in workflow, path
        assert 'cancel-in-progress: true' in workflow, path
        trigger = workflow.split('jobs:', 1)[0]
        assert '\n  push:' not in trigger, path


def test_r182_exact_sha_deploy_precedes_current_post_deploy_proof_and_restore_gate():
    release = text(RELEASE)
    assert 'Checkout exact canonical SHA' in release
    assert 'CANONICAL_GIT_SHA = "{sha}"' in release
    assert 'Final exact-head lock before production mutation' in release
    deploy = release.index(DEPLOY_STEP)
    proof = release.index(LIVE_PROOF_STEP)
    restore = release.index(RESTORE_STEP)
    assert deploy < proof < restore
    assert '--expected-sha "$GITHUB_SHA"' in release
    assert 'test "$(git rev-parse "origin/$CANONICAL_BRANCH")" = "$GITHUB_SHA"' in release
    assert "expected-version-id.txt" in release
    assert "pre-restore-payload.json" in release


def test_r182_keeps_full_integrity_demand_driven_while_r213_uses_bounded_release_proof():
    release = text(RELEASE)
    r177 = text(R177)
    assert 'run_full:' in r177
    assert 'default: false' in r177
    assert 'if: ${{ inputs.run_full == true }}' in r177
    assert '--workers 12' in release
    assert 'verify_r185_live_federation.py' in release
    assert 'R185 172 advertised public routes: LIVE VERIFIED' in release
    assert 'R185 172 machine routes and Durable Object runtimes: LIVE VERIFIED' in release


def test_r182_acceptance_rejects_stale_edge_identity():
    acceptance = text(ACCEPTANCE)
    r181 = text(R181)
    assert 'CANONICAL_GIT_SHA' in acceptance
    assert 'deploymentShaMustMatchBeforePostDeployProof: true' in acceptance
    assert 'deploymentIdentityBound' in acceptance
    assert 'EXPECTED_SHA' in r181
    assert "d.get('canonicalGitSha') == expected" in r181
