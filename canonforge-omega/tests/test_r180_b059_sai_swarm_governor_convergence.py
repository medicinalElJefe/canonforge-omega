from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
RUNTIME = WORKER / "src" / "runtimeEntryR169.ts"
GOVERNOR = WORKER / "src" / "swarm" / "swarmGovernorR180.ts"
ROUTER = WORKER / "src" / "swarm" / "swarmRouterR169.ts"
FUSION = WORKER / "src" / "intelligence" / "saiAiFusionR179.ts"
WRANGLER = WORKER / "wrangler.toml"
B059 = ROOT / "omega_runtime" / "sai_b059.py"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_cloud_sai_and_sovereign_b059_are_not_shadowed():
    runtime = text(RUNTIME)
    assert 'handleSaiRequest, saiLabResponse' in runtime
    assert 'handleSaiAiFusionR179' in runtime
    assert 'B059_SOVEREIGN_PATHS' in runtime
    for route in ('/api/sai/status', '/api/sai/verify', '/api/sai/query', '/api/sai/traverse'):
        assert route in runtime
    assert 'if (B059_SOVEREIGN_PATHS.has(url.pathname)) return canonical.fetch' in runtime
    assert 'if (url.pathname.startsWith("/api/sai/")) return handleSaiRequest' in runtime


def test_b059_training_truth_remains_scope_bounded():
    b059 = text(B059)
    assert 'DETERMINISTIC_SOURCE_GROUNDED_CORPUS_COMPILED_INDEXED_CALIBRATED' in b059
    assert 'foundation_model_weights_trained' in b059
    assert '541_526' in b059 or '541526' in b059
    assert '82_082' in b059 or '82082' in b059
    fusion = text(FUSION)
    assert 'omega_trained_provider_weights: false' in fusion
    assert 'fully_trained_within_declared_scope' in fusion
    assert 'OMEGA_SAI_B059_QUERY_RECEIPT_R179' in fusion


def test_self_development_is_load_governed_before_mission_creation():
    governor = text(GOVERNOR)
    router = text(ROUTER)
    assert 'automaticSelfDevelopmentDefaultCeiling: 144' in governor
    assert 'backgroundPausesWhenSaturated: true' in governor
    assert 'developmentIsClampedBeforeInteractiveWork: true' in governor
    assert 'PREVIOUS_STAGE_VERIFIED' in governor
    assert 'OPERATOR_AUTHORIZED_FULL' in governor
    assert 'promotionAuthorized: false' in governor
    assert 'canonicalMutation: false' in governor
    assert 'path === "/api/swarm/autonomic/missions"' in router
    assert 'governAutonomicMissionR180(original, status)' in router
    assert 'SWARM_GOVERNOR_LOAD_SHED' in router


def test_r180_config_registers_all_intelligence_layers():
    cfg = text(WRANGLER)
    assert 'SAI_INTELLIGENCE_RUNTIME_ID' in cfg
    assert 'SAI_B059_TRAINING_ID' in cfg
    assert 'SAI_AI_FUSION_ID' in cfg
    assert 'SWARM_GOVERNOR_ID' in cfg
    assert 'binding = "AI"' in cfg
