from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
WRANGLER = WORKER / "wrangler.toml"
CELL = SRC / "swarm" / "swarmCellR169.ts"
ROUTER = SRC / "swarm" / "swarmRouterR169.ts"
BODY = SRC / "swarmPrecisionBodyR171.ts"
VIRTUAL = SRC / "virtualLatticeDisplay.ts"
ENTRY = SRC / "runtimeEntryR169.ts"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r171_preserves_r170_compute_routes_and_canonical_delegation():
    source = text(ENTRY)
    assert 'handleComputeRequest' in source
    assert 'computeLabResponse' in source
    assert 'url.pathname === "/compute"' in source
    assert 'url.pathname.startsWith("/api/compute/")' in source
    assert 'url.pathname.startsWith("/api/swarm/")' in source
    assert 'return canonical.fetch(request, env, ctx)' in source


def test_r171_cell_converges_reference_computation_and_current_ai_without_authority_inflation():
    source = text(CELL)
    for token in (
        'COMPUTE_R170',
        'handleComputeRequest',
        'DERIVED_REFERENCE_COMPUTATION_NOT_CANON',
        'nativeExecution: false',
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        'MODEL_SYNTHESIS_NOT_CANON',
        'DERIVED_REFERENCE_COMPUTATION',
        'OBSERVED_SOURCE',
        'FORECAST_PROJECTION',
        'SIMULATED_CONTINUATION',
        'computeReceiptSha256',
    ):
        assert token in source
    assert 'Never claim PC execution, measurement, RCWA/FDTD, external research, or CanonState mutation' in source


def test_r171_redundant_compute_is_actual_cell_execution_and_not_fake_independent_validation():
    source = text(ROUTER)
    for token in (
        '/api/swarm/compute-consensus',
        'OMEGA_SWARM_COMPUTE_TASK_R171',
        'OMEGA_SWARM_COMPUTE_CONSENSUS_R171',
        'OMEGA_SWARM_COMPUTE_CONSENSUS_RECEIPT_R171',
        'executor: "COMPUTE_R170"',
        'requestedReplicas',
        'successfulReplicas',
        'consensusResultSha256',
        'consensusRatio',
        'uniqueResultHashes',
        'DERIVED_REDUNDANT_REFERENCE_COMPUTATION_NOT_CANON',
        'same reference implementation in distinct stateful swarm cells',
        'not independent-algorithm validation',
    ):
        assert token in source
    assert 'domain: 4, phase: 9' in source
    assert 'Math.min(12' in source


def test_r171_precision_body_renders_capacity_but_sources_execution_from_live_receipts():
    source = text(BODY)
    for token in (
        'r171-computation-swarm-convergence',
        'for(let i=0;i<1728;i++)',
        '/api/swarm/manifest',
        '/api/swarm/autonomic/plan',
        '/api/swarm/compute-consensus',
        'RUN REDUNDANT COMPUTE',
        '1,728 CELLS',
        '20,736 LANES',
        'DERIVED / NOT CANON',
        'Address capacity is not execution proof',
        'Identical solver replicas test execution consistency, not independent physical validation',
    ):
        assert token in source
    assert 'selected.set' not in source  # R171 uses exact planner indices in a Set, not animated guesses.
    assert 'chosen.add(Number(c.index))' in source


def test_r171_composes_after_sai_hybrid_and_preserves_existing_visual_authority():
    source = text(VIRTUAL)
    assert 'enhanceSaiHybridComputeField(rendered)' in source
    assert 'enhanceSwarmPrecisionBodyR171(rendered)' in source
    assert source.index('enhanceSaiHybridComputeField(rendered)') < source.index('enhanceSwarmPrecisionBodyR171(rendered)')
    assert 'presentation-only-beneath-heartbeatTruth' in source
    assert 'scalar-wave FDTD remains non-Maxwell' in source
    assert 'TMM remains reduced-order normal-incidence layered-media screening' in source
    assert '12/144/1728/20736 remain software address/execution-resolution levels rather than physical dimensions' in source


def test_r171_cloudflare_config_keeps_every_live_namespace_and_adds_ai_without_migration_replay():
    wrangler = text(WRANGLER)
    assert 'COMPUTATION_TRUTH_ID = "r170-physically-grounded-reference-solvers"' in wrangler
    assert 'COMPUTATION_SWARM_ID = "r171-redundant-reference-compute-consensus"' in wrangler
    assert 'SWARM_PRECISION_BODY_ID = "r171-live-address-compute-instrument"' in wrangler
    assert '[ai]' in wrangler
    assert 'binding = "AI"' in wrangler
    assert 'SWARM_MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"' in wrangler
    expected = {
        'OMEGA_RUNTIME': 'OmegaRuntime',
        'OMEGA_SWARM_CELL': 'OmegaSwarmCell',
        'OMEGA_SWARM_COORDINATOR': 'OmegaSwarmCoordinator',
        'OMEGA_SWARM_BRANCH': 'OmegaSwarmBranch',
        'OMEGA_SWARM_ORGAN': 'OmegaSwarmOrgan',
        'OMEGA_SWARM_ORGANISM': 'OmegaSwarmOrganismCoordinator',
        'OMEGA_SWARM_AUTONOMIC': 'OmegaSwarmAutonomicCoordinator',
    }
    for binding, cls in expected.items():
        assert f'name = "{binding}"' in wrangler
        assert f'class_name = "{cls}"' in wrangler
        assert f'[exports.{cls}]' in wrangler
    assert '[[migrations]]' not in wrangler
    assert 'new_sqlite_classes' not in wrangler
    assert 'state = "deleted"' not in wrangler
