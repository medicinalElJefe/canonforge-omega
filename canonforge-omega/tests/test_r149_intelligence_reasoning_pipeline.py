from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def test_r149_intelligence_is_inspectable_and_route_gated():
    text = (SRC / "intelligenceReasoningPipeline.ts").read_text(encoding="utf-8")
    for marker in [
        "Route → Mode → Forecast → Action → Gate",
        "/api/omega/state",
        "/api/route-preview",
        "/api/chat",
        "GENERATE FROM ADMITTED ROUTE",
        "route-before-generation",
        "SIMULATED_CONTINUATION",
        "MODEL_OUTPUT",
        "No canonical mutation occurred",
    ]:
        assert marker in text
    assert "oirGenerate\" disabled" in text
    assert "q('#oirGenerate').disabled=!x.admitted" in text


def test_r149_preserves_prior_visible_runtime_contracts():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    for marker in [
        "r149-intelligence-reasoning-pipeline",
        "r148-memory-continuity-graph",
        "r147-calculus-field-renderer",
        "enhanceMemoryContinuityGraph(rendered)",
        "enhanceIntelligenceReasoningPipeline(rendered)",
        "heartbeatTruth",
        "OmegaRuntime",
        "Hybrid/Genesis",
        "device-DPR 3",
        "61,917,364,224",
        "does not claim physical 20,736 dimensions",
    ]:
        assert marker in wrapper


def test_r149_public_delivery_checks_intelligence_surface():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        "r149-intelligence-reasoning-pipeline",
        "?view=Intelligence",
        "omegaIntelligenceReasoningRuntime",
        "INSPECT ROUTE",
        "GENERATE FROM ADMITTED ROUTE",
        "PUBLIC_INTELLIGENCE_REASONING_VERIFIED",
    ]:
        assert marker in workflow
