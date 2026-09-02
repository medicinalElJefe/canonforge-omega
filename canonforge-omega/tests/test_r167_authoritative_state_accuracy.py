from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_r167_canonical_state_schema_is_used_without_synthetic_metric_defaults():
    atlas = text("governedModeAtlas.ts")
    intelligence = text("intelligenceReasoningPipeline.ts")
    memory = text("memoryContinuityGraph.ts")
    simulate = text("createSimulateBranchLab.ts")
    earth = text("earthTruthLayers.ts")
    archive = text("archiveRecoveredWorkstation.ts")

    for source in (atlas, intelligence, memory, simulate, earth, archive):
        assert "/api/omega/state" in source
        assert "future_plasticity" in source

    forbidden = [
        "val('c',.72)",
        "val('p',.68)",
        "observed={c:.72,p:.68,q:.18,b:.28}",
        "['continuity','COmega','c'],.72",
        "['futurePlasticity','Phi','p'],.68",
        "state?.CΩ,.72",
        "m.Phi,state?.Phi,.62",
        "const controls={c:'c',p:'p',q:'q',b:'b'}",
    ]
    combined = "\n".join((atlas, intelligence, memory, simulate, earth, archive))
    for marker in forbidden:
        assert marker not in combined


def test_r167_address_axes_and_phase_match_canonical_runtime_contract():
    native = text("native20736Atlas.ts")
    motion = text("unifiedMotionRelativity.ts")
    phase = text("livePhaseVisual.ts")

    assert 'ATLAS_AXES = ["domain","phase","regulation","layer"]' in native
    assert "const phase=address[1]" in native
    assert "phase=a[1]/12*TAU" in motion
    assert "String(S.a[1]+1)" in motion
    assert "canonical.address[1]-1" in phase
    assert "20,736 states" in phase
    assert "20,736D" not in phase


def test_r167_bound_and_unbound_field_states_are_distinct():
    atlas = text("governedModeAtlas.ts")
    motion = text("unifiedMotionRelativity.ts")

    for marker in [
        "omegaCanonicalState='bound'",
        "STATE OK",
        "STATE STALE",
        "EDGE ONLY",
        "No canonical metrics are displayed",
    ]:
        assert marker in atlas

    assert "window.OMEGA_CANONICAL_PACKET" in atlas
    assert "function packet(){const p=window.OMEGA_CANONICAL_PACKET" in motion
    assert "packet:S.stateBound?S.P:null" in motion
    assert "presentation_basis:S.stateBound?null:S.P" in motion
    assert "UNBOUND · DISPLAY ONLY" in motion
    assert "omegaFieldExperience='r163'" not in motion


def test_r167_mode_coefficients_are_not_misrepresented_as_atlas_or_empirical_constants():
    motion = text("unifiedMotionRelativity.ts")
    assert "mode coefficients are declared visualization weights, not empirical constants" in motion
    assert "Address/neighbors/antipode provide topology context" in motion
    assert "Atlas neighbor/antipode relations constrain coefficients" not in motion


def test_r167_status_surfaces_do_not_invent_operational_or_capability_claims():
    shell = text("sovereignVisualShell.ts")
    environment = text("omegaEnvironmentShell.ts")
    command = text("spatialCommandCore.ts")

    assert "capability_count||32" not in shell
    assert "LIVE/REGISTERED" not in shell
    assert "V6 OPERATIONAL" not in shell
    assert "EDGE REACHABLE" in shell
    assert "ROUTE CONTRACT READY" in command
    assert "V6 OPERATIONAL" not in command
    assert "EDGE + PC REACHABLE" in environment
    assert "ROUTE CONTRACT" in environment


def test_r167_memory_simulation_earth_and_tools_preserve_truth_classes():
    memory = text("memoryContinuityGraph.ts")
    simulate = text("createSimulateBranchLab.ts")
    earth = text("earthTruthLayers.ts")
    archive = text("archiveRecoveredWorkstation.ts")

    assert "CANONICAL · '+s.evidence_class" in memory
    assert "DERIVED_FRAMEWORK_MATH" in memory
    assert "CANONICAL · '+p.evidence_class" in simulate
    assert "SIMULATED_CONTINUATION" in simulate
    assert "if(!observed||!A||!B)" in simulate
    assert "canonical_state:P?" in earth
    assert "screen_position:'deterministic presentation only'" in earth
    assert "if(showFc&&P)" in earth
    assert "let canonical=null" in archive
    assert "async function readCanonical()" in archive
    assert "if(!s){background();readout(null,dt)" in archive


def test_r167_visual_integrity_does_not_use_state_availability_as_render_liveness():
    integrity = text("visualRuntimeIntegrity.ts")
    assert "ready=Boolean(utc&&visualMarker)" in integrity
    assert "omegaCanonicalState" in integrity
    assert "STATE BOUND" in integrity
    assert "STATE STALE" in integrity
    assert "STATE UNAVAILABLE" in integrity


def test_r167_public_delivery_contract_requires_state_accuracy_release():
    wrapper = text("virtualLatticeDisplay.ts")
    workflow = WORKFLOW.read_text(encoding="utf-8")

    assert 'STATE_ACCURACY_RELEASE = "r167-authoritative-state-accuracy"' in wrapper
    assert 'headers.set("x-omega-state-release", STATE_ACCURACY_RELEASE)' in wrapper
    assert "canonical-state-binding+address-phase-semantics+no-synthetic-state-defaults" in wrapper
    assert "EXPECTED_STATE_RELEASE: r167-authoritative-state-accuracy" in workflow
    assert "x-omega-state-release" in workflow
    assert "omegaCanonicalState" in workflow
    assert "r167-authoritative-state" in workflow
