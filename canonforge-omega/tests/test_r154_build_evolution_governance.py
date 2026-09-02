from pathlib import Path

ROOT = Path(__file__).parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
BUILD = SRC / "buildEvolutionGovernance.ts"
VISUAL = SRC / "virtualLatticeDisplay.ts"
HEARTBEAT = SRC / "heartbeatTruth.ts"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r154_build_workspace_is_material_and_read_only():
    s = text(BUILD)
    assert 'data-view="Build"' in s
    assert "Canonical candidate lifecycle" in s
    for stage in ("OBSERVE", "CANDIDATE", "BUILD", "EXACT-HEAD CI", "PROMOTE / REJECT", "DEPLOY VERIFY", "ROLLBACK"):
        assert stage in s
    assert "/api/convergence/edge" in s
    assert "/api/development/status" in s
    assert "does not mutate canonical state" in s
    assert "does not create deployment authority" in s
    assert "No promote, deploy, merge or rollback mutation action is exposed here" in s
    assert "method:'POST'" not in s
    assert 'method:"POST"' not in s
    assert "method:'PUT'" not in s
    assert 'method:"PUT"' not in s
    assert "method:'DELETE'" not in s
    assert 'method:"DELETE"' not in s


def test_r154_build_workspace_is_mobile_composed_and_state_navigable():
    s = text(BUILD)
    assert "scroll-snap-type:x mandatory" in s
    assert "min-width:78vw" in s
    assert 'data-app="Build"' in s
    assert 'data-dock-app="Build"' in s
    assert "?view=Proof" in s
    assert "omegaBuildEvolution='r167-evidence-accurate-build'" in s


def test_r154_is_wired_over_existing_visual_runtime_without_replacing_it():
    s = text(VISUAL)
    assert 'from "./buildEvolutionGovernance"' in s
    assert "enhanceBuildEvolutionGovernance(rendered)" in s
    assert 'VISUAL_DELIVERY_RELEASE = "r154-build-evolution-governance"' in s
    for marker in (
        "r152-earth-truth-layers",
        "r153-mobile-workspace-orchestration",
        "finite-difference gradient",
        "Hessian/Laplacian curvature",
        "RK2 integral trajectories",
        "route-before-generation",
        "heartbeatTruth",
        "OmegaRuntime",
        "does not claim physical 20,736 dimensions",
    ):
        assert marker in s


def test_protected_authority_and_heartbeat_contracts_remain_present():
    s = text(HEARTBEAT)
    assert "export { OmegaRuntime }" in s
    assert "PC ONLINE requires both an upstream authenticated-online claim and a current authenticated Hybrid heartbeat" in s
    assert "Genesis may discover, recover, test and propose" in s
    assert "V6 alone owns the operational/release lifecycle" in s
    assert "The convergence cockpit is an observation surface" in s
