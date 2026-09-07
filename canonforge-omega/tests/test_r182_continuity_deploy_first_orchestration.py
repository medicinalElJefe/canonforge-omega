from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
GOVERNOR = WORKER / "src" / "swarm" / "swarmGovernorR180.ts"
ACCEPTANCE = WORKER / "src" / "acceptance" / "liveAcceptanceR181.ts"
VERIFY = REPO / ".github" / "workflows" / "omega-v6-verify.yml"
R176 = REPO / ".github" / "workflows" / "omega-v6-r176-live-warp-proof.yml"
R177 = REPO / ".github" / "workflows" / "omega-v6-r177-live-integrity-proof.yml"
R179 = REPO / ".github" / "workflows" / "omega-v6-r179-live-sai-proof.yml"
R181 = REPO / ".github" / "workflows" / "omega-v6-r181-live-ai-sai-sovereign-proof.yml"
VISUAL = REPO / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


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


def test_r182_deploys_exact_sha_before_post_deploy_proof_expansion():
    verify = text(VERIFY)
    assert 'Deploy exact verified canonical head with immutable Git identity' in verify
    assert 'CANONICAL_GIT_SHA:$GITHUB_SHA' in verify
    assert 'post-deploy-classify:' in verify
    assert 'needs: [promote-canonical-worker]' in verify
    assert 'post-deploy-r181-continuity:' in verify
    assert 'expected_sha: ${{ github.sha }}' in verify
    assert 'post-deploy-r179-intelligence:' in verify
    assert 'post-deploy-r176-swarm:' in verify
    assert 'post-deploy-r177-full-integrity:' in verify
    assert 'post-deploy-visual:' in verify


def test_r182_escalates_proof_by_changed_frame_and_keeps_1728_demand_driven():
    verify = text(VERIFY)
    r177 = text(R177)
    assert 'intelligence_changed' in verify
    assert 'swarm_changed' in verify
    assert 'full_integrity_changed' in verify
    assert 'visual_changed' in verify
    assert "needs.post-deploy-classify.outputs.full_integrity_changed != 'true'" in verify
    assert "needs.post-deploy-classify.outputs.full_integrity_changed == 'true'" in verify
    assert 'run_full: true' in verify
    assert 'run_full:' in r177
    assert 'default: false' in r177
    assert 'if: ${{ inputs.run_full == true }}' in r177


def test_r182_acceptance_rejects_stale_edge_identity():
    acceptance = text(ACCEPTANCE)
    r181 = text(R181)
    assert 'CANONICAL_GIT_SHA' in acceptance
    assert 'deploymentShaMustMatchBeforePostDeployProof: true' in acceptance
    assert 'deploymentIdentityBound' in acceptance
    assert 'EXPECTED_SHA' in r181
    assert "d.get('canonicalGitSha') == expected" in r181
