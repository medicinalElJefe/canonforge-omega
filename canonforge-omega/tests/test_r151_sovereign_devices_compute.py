from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def test_r151_is_truth_bound_and_non_mutating():
    src = (SRC / "sovereignDevicesCompute.ts").read_text(encoding="utf-8")
    assert "/api/convergence/edge" in src
    assert "pc_online=true" in src
    assert "does not create credentials" in src
    assert "does not create credentials, mutate canonical state, emulate a heartbeat" in src
    for marker in [
        "BROWSER CREDENTIAL",
        "AGENT REACHABILITY",
        "AUTHENTICATING",
        "HEARTBEAT",
        "PC ONLINE",
        "ERROR / STALE",
        "strict conjunction gate",
        "heartbeat_current",
        "heartbeat_age_seconds",
    ]:
        assert marker in src
    assert "fetch('/api/convergence/edge'" in src
    assert "method:'POST'" not in src
    assert "pc_online===true" in src


def test_r151_wires_over_r150_without_replacing_protected_runtime():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'r151-sovereign-devices-compute' in wrapper
    assert 'r150-create-simulate-branch-lab' in wrapper
    assert 'enhanceCreateSimulateBranchLab(rendered)' in wrapper
    assert 'enhanceSovereignDevicesCompute(rendered)' in wrapper
    assert wrapper.index('enhanceCreateSimulateBranchLab(rendered)') < wrapper.index('enhanceSovereignDevicesCompute(rendered)')
    for marker in [
        "heartbeatTruth",
        "OmegaRuntime",
        "Hybrid/Genesis authority boundaries",
        "route-before-generation",
        "finite-difference gradient",
        "Hessian/Laplacian curvature",
        "RK2 integral trajectories",
        "UTC render time is not evidence time",
        "device-DPR 3",
        "61.9-billion-pixel panel",
        "physical 20,736 dimensions",
    ]:
        assert marker in wrapper


def test_r151_public_delivery_requires_sovereign_state_grammar():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        "r151-sovereign-devices-compute",
        "omegaSovereignDevicesRuntime",
        "SOVEREIGN DEVICES / COMPUTE",
        "BROWSER CREDENTIAL",
        "AGENT REACHABILITY",
        "AUTHENTICATING",
        "PC ONLINE",
        "ERROR / STALE",
        "/api/convergence/edge",
        "PUBLIC_SOVEREIGN_DEVICES_VERIFIED",
    ]:
        assert marker in workflow
