from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_r168_adds_a_truth_bound_sai_hybrid_motion_layer():
    source = text("saiHybridComputeField.ts")
    for marker in [
        'r168-sai-hybrid-motion-fabric',
        'omegaSaiHybridCanvas',
        'omegaSaiHybridMotionRuntime',
        "dataset.gmaLayer='sai'",
        'SAI / HYBRID',
        "/api/omega/state",
        "/api/convergence/edge",
        "/api/hybrid/status",
        "/api/development/status",
        'Math.min(3,devicePixelRatio||1)',
        '20736',
        '1728',
        '144',
    ]:
        assert marker in source


def test_r168_pc_online_and_ai_context_keep_existing_authority_boundaries():
    source = text("saiHybridComputeField.ts")
    assert "snapshot.pc=Boolean(pc.pc_online)" in source
    assert "PC ONLINE by heartbeatTruth" in source
    assert "window.OMEGA_SAI_HYBRID_CONTEXT=context" in source
    assert "sai_hybrid:context" in source
    assert "route_authority_ready:Boolean(snapshot.route)" in source
    assert "canonical_state_bound:Boolean(s)" in source
    assert "does not mutate canonical state" in source
    assert "method:'POST'" not in source
    assert "method: \"POST\"" not in source


def test_r168_motion_is_adaptive_and_obeys_field_pause_reset_and_layer_control():
    source = text("saiHybridComputeField.ts")
    assert "quality=ema<18?1:ema<24?.82:ema<32?.64:.48" in source
    assert "omega-field-layer" in source
    assert "omega-field-pause" in source
    assert "omega-field-reset" in source
    assert "prefers-reduced-motion" in source
    assert "pointer-events:none" in source


def test_r168_is_composed_after_recovered_experience_without_replacing_existing_layers():
    wrapper = text("virtualLatticeDisplay.ts")
    recovered = wrapper.index("enhanceRecoveredExperience(rendered)")
    sai = wrapper.index("enhanceSaiHybridComputeField(rendered)")
    assert recovered < sai
    assert 'SAI_HYBRID_RELEASE = SAI_HYBRID_MOTION_RELEASE' in wrapper
    assert 'headers.set("x-omega-sai-hybrid-release", SAI_HYBRID_RELEASE)' in wrapper
    assert "sai-hybrid-motion-fabric+truth-bound-ai-context" in wrapper
    assert "sai-hybrid-ai-context" in wrapper


def test_r168_public_delivery_requires_the_new_layer_and_contract():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        "EXPECTED_SAI_HYBRID_RELEASE: r168-sai-hybrid-motion-fabric",
        "x-omega-sai-hybrid-release",
        "omegaSaiHybridMotionRuntime",
        "OMEGA_SAI_HYBRID_CONTEXT",
        "SAI / HYBRID",
        "sai-hybrid-motion-fabric+truth-bound-ai-context",
        "sai-hybrid-ai-context",
    ]:
        assert marker in workflow
