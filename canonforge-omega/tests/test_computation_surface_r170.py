from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
ENTRY = WORKER / "src" / "runtimeEntryR169.ts"
COMPUTE = WORKER / "src" / "compute" / "computeTruthR170.ts"
LAB = WORKER / "src" / "compute" / "computeLabR170.ts"
SWARM_CELL = WORKER / "src" / "swarm" / "swarmCellR169.ts"
SWARM_COORDINATOR = WORKER / "src" / "swarm" / "swarmCoordinatorR169.ts"
WRANGLER = WORKER / "wrangler.toml"
AGENT = ROOT / "scripts" / "omega_sovereign_agent.py"
SELF_BUILD = ROOT / "omega_runtime" / "self_build.py"


def test_r170_cloud_reference_compute_is_additive_beneath_canonical_runtime():
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'import canonicalRuntime from "./heartbeatTruth"' in entry
    assert 'url.pathname === "/compute"' in entry
    assert 'url.pathname.startsWith("/api/swarm/")' in entry
    assert 'url.pathname.startsWith("/api/compute/")' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'COMPUTATION_TRUTH_ID = "r170-physically-grounded-reference-solvers"' in wrangler
    assert 'main = "src/heartbeatTruth.ts"' in wrangler  # preserved semantic authority marker


def test_r170_compute_surface_declares_real_equations_and_boundaries():
    source = COMPUTE.read_text(encoding="utf-8")
    for token in (
        "OMEGA_COMPUTATION_TRUTH_R170",
        "299_792_458",
        "LORENTZ_EVENT_3D",
        "Minkowski interval",
        "NORMAL_INCIDENCE_TMM",
        "REDUCED_ORDER_SCREENING",
        "CONSERVATIVE_TRANSFER",
        "GRAPH_DIFFUSION",
        "SCALAR_WAVE_FDTD_1D",
        "CFL condition",
        "fabricationGrade: false",
        "maxwellSolver: false",
        "canonicalMutation: false",
        "physical dimensions",
    ):
        assert token in source
    for route in (
        "/api/compute/manifest",
        "/api/compute/relativity/event",
        "/api/compute/relativity/velocity",
        "/api/compute/optics/tmm",
        "/api/compute/continuity/transfer",
        "/api/compute/continuity/diffusion",
        "/api/compute/wave/fdtd1d",
    ):
        assert route in source


def test_r170_computation_lab_is_driven_by_live_solver_responses_not_fake_visuals():
    source = LAB.read_text(encoding="utf-8")
    for token in (
        "Reference computation you can inspect.",
        "/api/compute/manifest",
        "/api/compute/relativity/event",
        "/api/compute/optics/tmm",
        "/api/compute/continuity/transfer",
        "/api/compute/wave/fdtd1d",
        "invariant_relative_residual",
        "energy_balance_residual",
        "receiptSha256",
        "drawWave(r.final_state)",
        "not decorative animation",
    ):
        assert token in source


def test_r170_swarm_can_execute_structured_reference_computation_without_granting_canon_authority():
    cell = SWARM_CELL.read_text(encoding="utf-8")
    coordinator = SWARM_COORDINATOR.read_text(encoding="utf-8")
    assert 'import { handleComputeRequest } from "../compute/computeTruthR170"' in cell
    assert 'executor === "COMPUTE_R170"' in cell
    assert 'DERIVED_REFERENCE_COMPUTATION_NOT_CANON' in cell
    assert 'canonicalMutation: false' in cell
    assert 'mission?.computation && cell.order === 0' in coordinator
    assert 'COMPUTE_R170_ON_FIRST_SELECTED_CELL' in coordinator
    assert 'computationOutputs' in coordinator
    assert 'proofState: "RETURNED_NOT_ADMITTED"' in coordinator


def test_r170_sovereign_agent_executes_truth_suite_as_governed_native_job():
    agent = AGENT.read_text(encoding="utf-8")
    controller = SELF_BUILD.read_text(encoding="utf-8")
    assert '"compute_truth_suite"' in agent
    assert 'omega_runtime.advanced_computation' in agent
    assert '"native_execution": True' in agent
    assert '"fabrication_grade_optical_claim": False' in agent
    assert '"compute_truth_suite"' in controller
    assert '"computation_truth"' in controller
    assert '"physical_dimension_claim": False' in controller
    assert '"optical_fullwave_claim": False' in controller
