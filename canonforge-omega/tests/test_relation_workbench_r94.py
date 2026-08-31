from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKBENCH = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "relationWorkbench.ts"
ROUTER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "capabilityRouter.ts"
RELATIONS = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "relationGraph.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_r94_preserves_canonical_heartbeat_entrypoint():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'TRUTH_BOUNDARY_ID = "r88-hybrid-heartbeat-truth"' in wrangler
    assert 'CONVERGENCE_TRANSPORT_ID = "r89-genesis-service-binding"' in wrangler
    assert 'CAPABILITY_ROUTER_ID = "r91-actionable-capability-router"' in wrangler
    assert 'RELATION_WORKBENCH_ID = "r94-relation-workbench-graph-projection"' in wrangler


def test_r94_binds_relation_workbench_beneath_existing_dispatcher():
    router = ROUTER.read_text(encoding="utf-8")
    assert 'import { handleRelationWorkbenchRequest } from "./relationWorkbench"' in router
    assert "const relations = handleRelationWorkbenchRequest(request)" in router
    assert 'href="/relations"' in router
    assert 'from "./heartbeatTruth"' not in router


def test_r94_exposes_nonmutating_relation_schema_evaluation_and_graph_page():
    source = WORKBENCH.read_text(encoding="utf-8")
    assert 'url.pathname === "/relations"' in source
    assert 'url.pathname === "/api/relations/schema"' in source
    assert 'url.pathname === "/api/relations/evaluate"' in source
    assert '"x-omega-authority": "observation-only"' in source
    assert '"x-omega-authority": "computation-only"' in source
    assert "browser-local draft graph" in source
    assert "does not mutate canonical V6 or Genesis state" in source
    assert "Typed graph projection" in source
    assert "Clear local draft" in source


def test_r94_preserves_cross_scale_and_symbolic_truth_boundaries():
    source = RELATIONS.read_text(encoding="utf-8")
    workbench = WORKBENCH.read_text(encoding="utf-8")
    assert "transfer_operator and measured_invariant are required" in source
    assert 'edgeType === "SYMBOLIC"' in source
    assert 'evidenceClass === "SYMBOLIC_ANALOGY"' in source
    assert "HOLD_MISSING_TRANSFER_PROOF" in source
    assert "CAUSAL_EDGE_DECLARATION_ADMISSIBLE_NOT_INDEPENDENTLY_VERIFIED" in source
    assert "Declared causal admissibility is not independent verification" in workbench


def test_r94_graph_projection_is_semantic_not_decorative():
    source = WORKBENCH.read_text(encoding="utf-8")
    for relation_type in ["CAUSAL", "CONSTITUTIVE", "HISTORICAL", "OBSERVATIONAL", "CONSTRAINT", "TRANSFER", "SYMBOLIC"]:
        assert relation_type in source
    assert "stroke-dasharray" in source
    assert "proof.causal_admissible" in source
    assert "proof.status.includes('HOLD')" in source
