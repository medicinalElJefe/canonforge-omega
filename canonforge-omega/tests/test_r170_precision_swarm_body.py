from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
WRANGLER = WORKER / "wrangler.toml"
VIRTUAL = SRC / "virtualLatticeDisplay.ts"
BODY = SRC / "swarmPrecisionBody.ts"
CELL = SRC / "swarm" / "swarmCellR169.ts"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r170_composes_precision_swarm_body_beneath_existing_visual_pipeline():
    source = text(VIRTUAL)
    assert 'enhanceSwarmPrecisionBody' in source
    assert 'SWARM_PRECISION_BODY_RELEASE' in source
    assert 'rendered = await enhanceSaiHybridComputeField(rendered)' in source
    assert 'rendered = await enhanceSwarmPrecisionBody(rendered)' in source
    assert 'return stampDeliveredVisual(rendered)' in source
    assert 'r167-authoritative-state-accuracy' in source
    assert 'r168-sai-hybrid-motion-fabric' not in source or 'SAI_HYBRID_MOTION_RELEASE' in source


def test_r170_operator_surface_uses_live_planner_and_live_mission_state():
    source = text(BODY)
    for token in (
        'r170-precision-swarm-body',
        '/api/swarm/manifest',
        '/api/swarm/autonomic/plan',
        '/api/swarm/autonomic/missions',
        'PLAN EXACT CELLS',
        'RUN PLANNED MISSION',
        '1,728 CELLS',
        '20,736 LANES',
        "for(let i=0;i<1728;i++)",
        "for(const c of plan.cells||[])selected.set(Number(c.index),'PLANNED')",
        "Mission progress comes only from the live autonomic mission endpoint",
        "Idle points are addressable capacity",
    ):
        assert token in source
    assert 'No visual pulse is treated as proof of computation' in source
    assert 'live-plan-and-mission-observation-only' in source


def test_r170_workers_ai_binding_is_explicit_and_model_output_is_not_canon():
    wrangler = text(WRANGLER)
    cell = text(CELL)
    assert '[ai]' in wrangler
    assert 'binding = "AI"' in wrangler
    assert 'SWARM_MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"' in wrangler
    assert 'SWARM_MODEL_R170 = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"' in cell
    assert 'MODEL_SYNTHESIS_NOT_CANON' in cell
    assert 'NO_RESULT_FABRICATED' in cell
    assert 'Never claim PC execution, measurement, RCWA/FDTD, external research, or CanonState mutation' in cell
    assert 'OBSERVED_SOURCE' in cell
    assert 'DERIVED_FRAMEWORK_MATH' in cell
    assert 'MODEL_OUTPUT' in cell


def test_r170_keeps_every_live_durable_namespace_and_no_destructive_migration():
    wrangler = text(WRANGLER)
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


def test_r170_does_not_promote_address_resolution_into_physical_dimension_claims():
    body = text(BODY)
    virtual = text(VIRTUAL)
    assert 'not physical dimensions' in body
    assert 'not physical dimensions' in virtual
    assert 'Idle points are addressable capacity' in body
    assert 'canonical state' in virtual.lower()
