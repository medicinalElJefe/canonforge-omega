from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
VALIDATION = SRC / "validation" / "validationFabricR172.ts"
LAB = SRC / "validation" / "validationLabR172.ts"
OVERLAY = SRC / "validation" / "validationOverlayR172.ts"
ENTRY = SRC / "runtimeEntryR169.ts"
VISUAL = SRC / "virtualLatticeDisplay.ts"
WRANGLER = WORKER / "wrangler.toml"


def test_r172_runtime_mounts_validation_without_replacing_canonical_authority():
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'import canonicalRuntime from "./heartbeatTruth"' in entry
    assert 'handleValidationRequest' in entry
    assert 'validationLabResponse' in entry
    assert 'url.pathname === "/validate"' in entry
    assert 'url.pathname.startsWith("/api/validate/")' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry


def test_r172_has_explicit_validation_ladder_and_does_not_collapse_evidence_classes():
    source = VALIDATION.read_text(encoding="utf-8")
    for marker in (
        "REPLICA_CONSISTENCY",
        "INVARIANT_IDENTITY",
        "INDEPENDENT_FORMULATION",
        "CROSS_RUNTIME_PARITY",
        "INDEPENDENT_SOLVER_FAMILY",
        "EXTERNAL_MEASUREMENT",
        "LORENTZ_4X4_MATRIX",
        "ADMITTANCE_RECURSION",
        "MINKOWSKI_INVARIANT",
        "ATLAS_TOPOLOGY_IDENTITY",
        "VALIDATION_RECEIPT_NOT_CANON",
        "SUPPLIED_COMPARISON_NOT_VALIDATION",
        "verifiedDiversity: false",
    ):
        assert marker in source
    assert "canonicalMutation: true" not in source
    assert "nativeExecution: true" not in source
    assert "physical dimensions" in source


def test_r172_validation_reference_executes_real_r170_compute_then_independent_checks():
    source = VALIDATION.read_text(encoding="utf-8")
    assert 'handleComputeRequest(new Request(`https://compute.internal${path}`' in source
    assert 'path === "/api/compute/relativity/event"' in source
    assert 'path === "/api/compute/optics/tmm"' in source
    assert 'path === "/api/compute/continuity/transfer"' in source
    assert 'path === "/api/compute/continuity/diffusion"' in source
    assert 'path === "/api/compute/wave/fdtd1d"' in source
    assert 'path === "/api/compute/atlas/diffusion"' in source
    assert "4x4 matrix multiplication versus vector-decomposition reference" in source
    assert "recursive input-admittance versus 2x2 characteristic matrix" in source


def test_r172_operator_surface_is_reachable_and_integrated_after_r171_swarm_body():
    lab = LAB.read_text(encoding="utf-8")
    overlay = OVERLAY.read_text(encoding="utf-8")
    visual = VISUAL.read_text(encoding="utf-8")
    assert "OMEGA · R172 · VALIDATION FABRIC" in lab
    assert "Separate computation from proof." in lab
    assert "RUN COMPUTE + INDEPENDENT VALIDATION" in lab
    assert "VALIDATE REFERENCE" in overlay
    assert "OPEN R172 VALIDATION LAB" in overlay
    assert 'enhanceSwarmPrecisionBodyR171(rendered)' in visual
    assert 'enhanceValidationOverlayR172(rendered)' in visual
    assert visual.index('enhanceSwarmPrecisionBodyR171(rendered)') < visual.index('enhanceValidationOverlayR172(rendered)')
    assert 'x-omega-validation-release' in visual


def test_r172_preserves_all_live_durable_object_namespaces_and_does_not_add_migrations():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'HETEROGENEOUS_VALIDATION_ID = "r172-independent-formulation-and-evidence-tiering"' in wrangler
    for class_name in (
        "OmegaRuntime",
        "OmegaSwarmCell",
        "OmegaSwarmCoordinator",
        "OmegaSwarmBranch",
        "OmegaSwarmOrgan",
        "OmegaSwarmOrganismCoordinator",
        "OmegaSwarmAutonomicCoordinator",
    ):
        assert f'class_name = "{class_name}"' in wrangler
        assert f'[exports.{class_name}]' in wrangler
    assert '[[migrations]]' not in wrangler
    assert 'new_sqlite_classes' not in wrangler
    assert 'state = "deleted"' not in wrangler


def test_r172_truth_boundary_never_promotes_replica_or_supplied_metadata_to_scientific_validation():
    source = VALIDATION.read_text(encoding="utf-8")
    assert "same implementation replicated; useful for execution/fault divergence only" in source
    assert "Source and method labels in this endpoint are caller-supplied" in source
    assert "without a trusted execution/measurement receipt" in source
    assert "REQUIRES_TRUSTED_NATIVE_RECEIPT" in source
    assert "REQUIRES_RCWA_OR_MAXWELL_FDTD_RECEIPT" in source
    assert "REQUIRES_OBSERVED_SOURCE_RECEIPT" in source
