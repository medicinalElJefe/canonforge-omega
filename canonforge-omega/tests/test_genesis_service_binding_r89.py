from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HEARTBEAT = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"
CONVERGENCE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "convergence.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_r89_adds_native_genesis_service_binding_without_replacing_entrypoint():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'binding = "GENESIS"' in wrangler
    assert 'service = "omega-genesis-v1"' in wrangler
    assert 'CONVERGENCE_TRANSPORT_ID = "r89-genesis-service-binding"' in wrangler


def test_r89_preserves_r87_semantic_identity_and_r88_heartbeat_truth():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'TRUTH_BOUNDARY_ID = "r88-hybrid-heartbeat-truth"' in wrangler
    assert "upstreamOnline && heartbeatCurrent" in heartbeat
    assert "heartbeat_required_for_pc_online = true" in heartbeat
    assert "pc_online_requires_current_heartbeat = true" in heartbeat


def test_r89_keeps_public_genesis_probe_contract_as_fallback_evidence_path():
    convergence = CONVERGENCE.read_text(encoding="utf-8")
    assert 'probe(`${GENESIS}/_omega/health`)' in convergence
    assert 'probe(`${GENESIS}/api/health`)' in convergence
    assert 'probe(`${GENESIS}/api/convergence/manifest`)' in convergence
    assert 'probe(`${GENESIS}/api/capabilities`)' in convergence
    assert 'probe(`${GENESIS}/api/mode?id=ALL_MODES`)' in convergence


def test_r89_repairs_only_from_successful_bound_genesis_observations():
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    assert "async function genesisServiceProbe" in heartbeat
    assert "if (!env.GENESIS) return null" in heartbeat
    assert 'transport: "SERVICE_BINDING"' in heartbeat
    assert '"SERVICE_BINDING_DEGRADED"' in heartbeat
    assert "if (edge?.reachable) topologyGenesis.edge = edge" in heartbeat
    assert "if (health?.reachable) topologyGenesis.health = health" in heartbeat
    assert "if (manifestProbe?.reachable)" in heartbeat
    assert 'manifest.schema === GENESIS_SCHEMA_V3' in heartbeat
    assert 'manifest.authority_contract === AUTHORITY_CONTRACT' in heartbeat
    assert 'runtime.operational_release_authority === false' in heartbeat
    assert 'product.genesis_may_deploy_v6 === false' in heartbeat


def test_r89_keeps_authority_and_transport_truth_boundaries_explicit():
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    assert "Binding success proves transport reachability only" in heartbeat
    assert "Genesis canonical state and V6 release authority remain separate" in heartbeat
    assert "genesis_transport_boundary" in heartbeat
    assert "genesis_manifest_digest" in heartbeat
    assert "authority_contract_ready" in heartbeat
    assert "v6_release_authority" in heartbeat
