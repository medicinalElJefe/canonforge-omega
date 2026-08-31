from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKBENCH = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "stateWorkbench.ts"
ROUTER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "capabilityRouter.ts"
HEARTBEAT = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "heartbeatTruth.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_r92_exposes_canonical_state_packet_and_truth_layers():
    source = WORKBENCH.read_text(encoding="utf-8")
    assert "OMEGA_CANONICAL_STATE_PACKET_V1" in source
    assert "OBSERVED_MEASURED" in source
    assert "ESTABLISHED_MATH_OR_SCIENCE" in source
    assert "DERIVED_FROM_OBSERVED" in source
    assert "SIMULATED_CONTINUATION" in source
    assert "USER_DEFINED_MODEL" in source
    assert "SYMBOLIC_ANALOGY" in source
    assert "NO_EVIDENCE" in source
    assert "typed multigraph edges with provenance and confidence" in source
    assert "Cross-scale causation requires an explicit transfer operator and measured invariant" in source


def test_r92_makes_dewey_score_and_local_sensitivity_transparent():
    source = WORKBENCH.read_text(encoding="utf-8")
    assert 'score: "D=(CΩ*Φ)/(q+Λ+ε)"' in source
    assert "∂D/∂CΩ = Φ/(q+Λ+ε)" in source
    assert "∂D/∂Φ = CΩ/(q+Λ+ε)" in source
    assert "∂D/∂q = -(CΩ*Φ)/(q+Λ+ε)^2" in source
    assert "∂D/∂Λ = -(CΩ*Φ)/(q+Λ+ε)^2" in source
    assert "const derivativeNegative = -(c * p) / (denominator * denominator)" in source
    assert 'dispatch: "STAY if D≥τ_high; TURN if τ_low<D<τ_high; ESCALATE if D≤τ_low"' in source


def test_r92_fails_closed_on_invalid_inputs_and_marks_thresholds_uncalibrated():
    source = WORKBENCH.read_text(encoding="utf-8")
    assert "must_be_between_0_and_1" in source
    assert "epsilon_must_be_gt_0_and_lte_1" in source
    assert "tau_low_must_be_less_than_tau_high" in source
    assert "valid_evidence_class_required" in source
    assert "thresholds_calibrated: false" in source
    assert "calibrated: false" in source
    assert "MODEL_STILL_REQUIRES_DOMAIN_CALIBRATION" in source
    assert "physical_law_claimed: false" in source


def test_r92_workbench_is_computation_only_and_nonmutating():
    source = WORKBENCH.read_text(encoding="utf-8")
    router = ROUTER.read_text(encoding="utf-8")
    assert 'url.pathname === "/workbench"' in source
    assert 'url.pathname === "/api/state/workbench/schema"' in source
    assert 'url.pathname === "/api/state/workbench/evaluate"' in source
    assert '"x-omega-authority": "computation-only"' in source
    assert "mutation: false" in source
    assert "native_execution: false" in source
    assert "does not mutate canonical V6 or Genesis state" in source
    assert 'import { handleStateWorkbenchRequest } from "./stateWorkbench"' in router
    assert "const workbench = handleStateWorkbenchRequest(request)" in router
    assert 'href="/workbench"' in router


def test_r92_preserves_r88_r89_r90_r91_entrypoint_and_truth_contracts():
    heartbeat = HEARTBEAT.read_text(encoding="utf-8")
    wrangler = WRANGLER.read_text(encoding="utf-8")
    router = ROUTER.read_text(encoding="utf-8")
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'TRUTH_BOUNDARY_ID = "r88-hybrid-heartbeat-truth"' in wrangler
    assert 'CONVERGENCE_TRANSPORT_ID = "r89-genesis-service-binding"' in wrangler
    assert 'CAPABILITY_ROUTER_ID = "r91-actionable-capability-router"' in wrangler
    assert "node.pc_online = Boolean(upstreamOnline && heartbeatCurrent)" in heartbeat
    assert "env.GENESIS.fetch" in heartbeat
    assert 'url.pathname === "/convergence"' in heartbeat
    assert 'url.pathname === "/capabilities"' in router
    assert "handleCapabilityRequest(request, env, () => provenEdgeSnapshot(request, env))" in heartbeat


def test_r92_embeds_empirical_validation_requirements_in_product_contract():
    source = WORKBENCH.read_text(encoding="utf-8")
    for requirement in [
        "held-out baseline comparison",
        "calibration curve or proper scoring rule",
        "ablation of CΩ, Φ, q, Λ",
        "sensitivity analysis over ε and thresholds",
        "cross-domain transfer with domain-specific scaling only",
        "pre-registered falsification condition",
        "no rescue interpretation after failure",
    ]:
        assert requirement in source
