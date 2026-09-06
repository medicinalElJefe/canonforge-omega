from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r174_machine_services_are_real_service_bindings():
    wrangler = read(WORKER / "wrangler.toml")
    assert 'FEDERATED_ORGAN_FABRIC_ID = "r174-live-genesis-optical-swarm-organism"' in wrangler
    assert 'binding = "OMEGA_GENESIS_MACHINE"' in wrangler
    assert 'service = "omega-genesis-machine-r115"' in wrangler
    assert 'binding = "OMEGA_OPTICAL_MACHINE"' in wrangler
    assert 'service = "omega-optical-machine-r115"' in wrangler


def test_r174_is_additive_to_r169_r173_runtime_entry():
    entry = read(WORKER / "src" / "runtimeEntryR169.ts")
    assert 'import canonicalRuntime from "./heartbeatTruth"' in entry
    assert 'handleCrossRuntimeValidationRequest' in entry
    assert 'handleFederatedOrganRequest' in entry
    assert 'federatedOrganLabResponse' in entry
    assert 'url.pathname.startsWith("/api/federation/r174/")' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry


def test_r174_truth_boundary_cannot_self_promote():
    fabric = read(WORKER / "src" / "federation" / "federatedOrganFabricR174.ts")
    assert 'fullFederationProved: false' in fabric
    assert 'CURRENT_AUTHENTICATED_SOVEREIGN_INDEPENDENT_SOLVER_RECEIPT_REQUIRED' in fabric
    assert 'FULLWAVE_REQUEST_CANDIDATE_NOT_VALIDATION' in fabric
    assert 'SCREENING_RESULT_NOT_VALIDATION' in fabric
    assert 'canonicalMutation: false' in fabric
    assert '12/144/1728/20736 are software address/execution-resolution levels, not physical dimensions' in fabric


def test_r174_exposes_real_organism_execution_profiles():
    fabric = read(WORKER / "src" / "federation" / "federatedOrganFabricR174.ts")
    assert 'FOCUSED: { mode: "FLOCK", cells: 24 }' in fabric
    assert 'ORGANISM: { mode: "TREE", cells: 144 }' in fabric
    assert 'FULL: { mode: "FULL", cells: 1728 }' in fabric
    assert 'GENESIS_MACHINE@ORCHESTRATION/FRAME' in fabric
    assert 'OPTICAL_CHAIN@PHYSICS/EXECUTE' in fabric


def test_r174_operator_surface_is_instrumentation_not_fake_activity():
    lab = read(WORKER / "src" / "federation" / "federatedOrganLabR174.ts")
    assert 'structural instrumentation' in lab
    assert 'address capacity is not misrepresented as active computation' in lab
    assert '/api/federation/r174/manifest' in lab
    assert '/api/federation/r174/missions' in lab
    assert '/api/federation/r174/optical-chain' in lab
