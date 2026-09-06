from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r175_mounts_additively_without_replacing_canonical_runtime():
    entry = read(WORKER / "src" / "runtimeEntryR169.ts")
    assert 'import canonicalRuntime from "./heartbeatTruth"' in entry
    assert 'handleFederatedOrganRequest' in entry
    assert 'handleIndependentSolverValidationRequest' in entry
    assert 'independentSolverLabResponse' in entry
    assert 'url.pathname === "/validate/independent"' in entry
    assert 'url.pathname.startsWith("/api/validate/independent/")' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry


def test_r175_requires_real_grcwa_and_has_no_reduced_order_fallback():
    solver = read(ROOT / "omega_runtime" / "rcwa_solver.py")
    assert 'import grcwa' in solver
    assert 'SOLVER_FAMILY = "MAXWELL_RCWA"' in solver
    assert 'no fallback result is permitted' in solver
    assert '"fallback": False' in solver
    assert 'solver_family": SOLVER_FAMILY' in solver
    assert 'independent_solver_family_claim": True' in solver
    assert 'external_measurement_claim": False' in solver
    assert 'canonical_mutation": False' in solver
    assert 'fabrication validation' in solver
    assert 'NORMAL_INCIDENCE_TMM' not in solver
    assert 'handleComputeRequest' not in solver


def test_r175_agent_only_advertises_rcwa_when_dependency_probe_passes():
    agent = read(ROOT / "scripts" / "omega_sovereign_agent.py")
    assert 'INDEPENDENT_SOLVER_CHALLENGE_SCHEMA = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175"' in agent
    assert 'rcwa_dependency_status' in agent
    assert 'if rcwa_probe["available"]:' in agent
    assert 'capabilities.extend(["independent_fullwave_rcwa", "maxwell_rcwa_grcwa"])' in agent
    assert 'R175 RCWA dependencies are unavailable on the authenticated Sovereign host; no fallback is permitted' in agent
    assert 'evidence.independent_solver_family_claim' not in agent


def test_r175_l4_requires_persisted_authenticated_identity_and_numerical_gates():
    fabric = read(WORKER / "src" / "validation" / "independentSolverR175.ts")
    assert 'validationTier: { level: 4, id: "INDEPENDENT_SOLVER_FAMILY" }' in fabric
    assert 'job.kind === "cross_runtime_validate"' in fabric
    assert 'job.state === "VERIFIED"' in fabric
    assert 'job.lease_owner === evidence.agent_id' in fabric
    assert 'heartbeat_sequence' in fabric
    assert 'nativeResult.solver_family === "MAXWELL_RCWA"' in fabric
    assert 'nativeResult.solver_version.startsWith("grcwa:")' in fabric
    assert 'resultHash: hashGates.resultHash' in fabric
    assert 'receiptHash: hashGates.receiptHash' in fabric
    assert 'convergenceTolerancePassed' in fabric
    assert 'energyTolerancePassed' in fabric
    assert 'EXTERNAL_MEASUREMENT_REQUIRED' in fabric
    assert 'canonicalMutation: false' in fabric


def test_r175_operator_lab_executes_r174_to_r175_end_to_end_path():
    lab = read(WORKER / "src" / "validation" / "independentSolverLabR175.ts")
    assert '/api/federation/r174/optical-chain' in lab
    assert '/api/validate/independent/prepare' in lab
    assert '/api/development/enqueue' in lab
    assert "cross_runtime_validate" in lab
    assert '/api/validate/independent/compare' in lab
    assert 'NO FULL-WAVE JOB' in lab
    assert 'L4 INDEPENDENT SOLVER RECEIPT ADMITTED' in lab
    assert 'EXTERNAL MEASUREMENT STILL REQUIRED' in lab


def test_r175_dependency_extra_is_explicit_and_isolated():
    project = read(ROOT / "pyproject.toml")
    assert 'rcwa = [' in project
    assert '"numpy>=1.24"' in project
    assert '"grcwa==0.1.2"' in project
