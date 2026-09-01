from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def test_r150_branch_lab_is_state_bound_and_non_mutating():
    source = (SRC / "createSimulateBranchLab.ts").read_text(encoding="utf-8")
    for marker in [
        "/api/omega/state",
        "SIMULATED_CONTINUATION",
        "ROLLBACK / DISCARD",
        "REFORK FROM OBSERVED",
        "Branch A",
        "Branch B",
        "STAY",
        "TURN",
        "ESCALATE",
        "144",
        "1728",
        "20736",
        "248832",
        "never mutate canonical state",
    ]:
        assert marker in source
    assert "method:'POST'" not in source
    assert "/api/omega/state" in source


def test_r150_visible_consequences_are_computational_not_static_decoration():
    source = (SRC / "createSimulateBranchLab.ts").read_text(encoding="utf-8")
    for marker in [
        "stability(x)",
        "divergence()",
        "curve(A,-1)",
        "curve(B,1)",
        "shells[shellIndex]",
        "requestAnimationFrame(draw)",
        "x.c=+q('#ocsC').value",
        "x.p=+q('#ocsP').value",
        "x.q=+q('#ocsQ').value",
        "x.b=+q('#ocsBurden').value",
    ]:
        assert marker in source


def test_r150_wrapper_preserves_prior_authority_and_calculus_contracts():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    for marker in [
        "r150-create-simulate-branch-lab",
        "enhanceCreateSimulateBranchLab(rendered)",
        "r149-intelligence-reasoning-pipeline",
        "r148-memory-continuity-graph",
        "finite-difference gradient",
        "Hessian/Laplacian curvature",
        "RK2 integral trajectories",
        "route-before-generation",
        "heartbeatTruth",
        "OmegaRuntime",
        "Hybrid/Genesis authority boundaries",
        "UTC render time is not evidence time",
        "device-DPR 3",
        "61,917,364,224",
        "does not claim physical 20,736 dimensions",
    ]:
        assert marker in wrapper


def test_r150_public_delivery_proves_branch_lab_and_prior_runtime():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        "r150-create-simulate-branch-lab",
        "?view=Create&delivery_probe=$GITHUB_SHA",
        "omegaCreateSimulateRuntime",
        "SIMULATED_CONTINUATION",
        "ROLLBACK / DISCARD",
        "omegaIntelligenceReasoningRuntime",
        "omegaMemoryContinuityRuntime",
        "finite_difference + RK2 integral curves",
        "route-before-generation",
        "omegaVisualRuntimeIntegrity",
    ]:
        assert marker in workflow
