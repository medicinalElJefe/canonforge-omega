from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def read(path: str) -> str:
    return (SRC / path).read_text()


def test_r195_preserves_canonical_runtime_and_predecessor_enhancement_order():
    entry = read("runtimeEntryR169.ts")
    assert 'main = "src/runtimeEntryR169.ts"' in (WORKER / "wrangler.toml").read_text()
    assert 'import { handleDeweyWaterMotionR195 } from "./compute/deweyWaterMotionR195"' in entry
    assert 'import { enhanceDeweyWaterMotionSurfaceR195 } from "./deweyWaterMotionSurfaceR195"' in entry
    assert 'enhanceUniversalNavigationR192(response, new URL(request.url).pathname)' in entry
    assert 'enhanceUniversalWorkspaceR193(r192, new URL(request.url).pathname)' in entry
    assert 'enhanceEvidencePlaneR194(r193, new URL(request.url).pathname)' in entry
    assert 'enhanceDeweyWaterMotionSurfaceR195(r194, new URL(request.url).pathname)' in entry
    assert 'const deweyWaterMotion = await handleDeweyWaterMotionR195(request)' in entry
    assert entry.index('const deweyWaterMotion = await handleDeweyWaterMotionR195(request)') < entry.index('if (url.pathname.startsWith("/api/compute/atlas/"))')


def test_r195_compiles_zero_free_semantics_as_dual_rails_not_fake_nonzero_values():
    kernel = read("compute/deweyWaterMotionR195.ts")
    assert 'type Rail = { outverse: number; inverse: number; scar: number }' in kernel
    assert 'outverse: Math.max(0, x)' in kernel
    assert 'inverse: Math.max(0, -x)' in kernel
    assert 'rails[i].outverse += construct[i]' in kernel
    assert 'rails[i].inverse += prune[i]' in kernel
    assert 'netProjection: outverse - inverse' in kernel
    assert 'tiePreservesOpposingCarry: true' in kernel
    assert 'nullOperationAllowed: false' in kernel
    assert 'zero net projection cannot erase opposing carry' in kernel


def test_r195_t12_turn_group_and_antipodal_tie_policy_are_explicit():
    kernel = read("compute/deweyWaterMotionR195.ts")
    assert 'turnGroup: "T12"' in kernel
    assert 'turnLaw: "tau_a ∘ tau_b = tau_(a+b mod 12)"' in kernel
    assert 'inverseTurn: "tau_k^-1 = tau_(12-k)"' in kernel
    assert 'autoTurnDefault: false' in kernel
    assert 'antipodalAutoTurnPolicyWhenEnabled: 6' in kernel
    assert 'DECLARED_ANTIPODAL_TIE_POLICY_NOT_UNIVERSAL_THEOREM' in kernel
    assert 'TURN_REQUIRED_OR_EXPLICITLY_WITHHELD' in kernel


def test_r195_water_geometry_is_a_conservative_12_phase_transport_kernel():
    kernel = read("compute/deweyWaterMotionR195.ts")
    for name in ("Source", "Drop", "Stream", "River", "Eddy", "Wave", "Tide", "Vortex", "Flood", "Mist", "Ice", "Ocean"):
        assert f'"{name}"' in kernel
    assert 'const theta = TAU * (mode - 1) / N' in kernel
    assert 'const residenceBasis = clamp01((1 + Math.cos(theta)) / 2)' in kernel
    assert 'const direction = Math.sin(theta)' in kernel
    assert 'const mobilityBasis = 1 - residenceBasis' in kernel
    assert 'sum: self + forward + backward' in kernel
    assert 'out[next][key] += v * w.forward' in kernel
    assert 'out[prev][key] += v * w.backward' in kernel
    assert 'out[i][key] += v * w.self' in kernel


def test_r195_uses_source_bound_mode188_parameters_without_claiming_sovereign_authority():
    kernel = read("compute/deweyWaterMotionR195.ts")
    assert 'const EPSILON = 0.05' in kernel
    assert 'const GAMMA_LAMBDA_Q = 0.35' in kernel
    assert 'const STAY_THRESHOLD = 1.05' in kernel
    assert 'const TURN_THRESHOLD = 0.90' in kernel
    assert 'const ESCALATE_THRESHOLD = 0.75' in kernel
    assert 'DERIVED_SCREENING_NOT_SOVEREIGN_MODE188' in kernel
    assert 'const screeningRatio = (continuity * futurePlasticity + EPSILON) / (contradiction + burden + GAMMA_LAMBDA_Q * burden * contradiction + EPSILON)' in kernel


def test_r195_applies_all_governed_mode_lenses_to_one_state():
    kernel = read("compute/deweyWaterMotionR195.ts")
    mode_ids = (
        "full-overall-canon", "mode-188", "unified-coherence", "forecast", "full-sphere",
        "relational-skin", "dewey-calculus", "unified-recursion", "deep-mother", "high-father",
        "heavy-prune", "alpha", "crimson", "no-nothing-truth", "guidance-field",
    )
    for mode_id in mode_ids:
        assert f'"{mode_id}"' in kernel
    assert 'zeroProjectionDoesNotEraseRails: true' in kernel
    assert 'boundedContinuationCapacity' in kernel
    assert 'suggestedTurnDirection' in kernel


def test_r195_dimensional_relativity_is_address_and_frame_computation_not_physical_dimension_claim():
    kernel = read("compute/deweyWaterMotionR195.ts")
    assert 'shell144' in kernel
    assert 'shell1728' in kernel
    assert 'shell20736' in kernel
    assert 'shell248832' in kernel
    assert 'relativeAddress' in kernel
    assert 'frameRelativeRoles: true' in kernel
    assert 'addressLevels: [12, 144, 1728, 20736, 248832]' in kernel
    assert 'physicalDimensionClaim: false' in kernel
    assert 'not literal physical dimensions' in kernel


def test_r195_inevitability_is_bounded_diagnostic_not_probability_or_destiny():
    kernel = read("compute/deweyWaterMotionR195.ts")
    assert 'const inevitabilityProxy = omegaScore / (1 + omegaScore)' in kernel
    assert 'not a probability and not a claim of metaphysical inevitability' in kernel
    assert 'OPERATOR_COMPOSITION_NOT_FINANCIAL_COMPOUNDING' in kernel


def test_r195_receipts_are_source_bound_and_non_mutating():
    kernel = read("compute/deweyWaterMotionR195.ts")
    for source_id in (
        "12iYNtUkHqlHtjpQot46HWURGe-TI8Kdz",
        "1Q9hKgW6R7jxzDFnGoaj0BokJAHixp5OU",
        "1Flbg7drpujKdQhLKM030I_It9aPzEcPV",
    ):
        assert source_id in kernel
    assert 'inputSha256' in kernel
    assert 'resultSha256' in kernel
    assert 'receiptSha256' in kernel
    assert 'canonicalMutation: false' in kernel
    assert 'nativeExecution: false' in kernel
    assert 'SOURCE_BOUND_EXECUTABLE_OPERATOR_CONTEXT_NOT_MODEL_FINETUNE' in kernel


def test_r195_integrated_surface_is_real_api_driven_and_mobile_bounded():
    ui = read("deweyWaterMotionSurfaceR195.ts")
    assert 'id="omegaDeweyWaterR195"' in ui
    assert '/api/compute/dewey/r195/step' in ui
    assert '/api/compute/dewey/r195/trajectory' in ui
    assert 'data-view="Calculus"' in ui
    assert 'DERIVED_MODEL · RECEIPTED' in ui
    assert '@media(max-width:620px)' in ui
    assert 'new Array(12)' in ui
    assert '20,736 DOM' not in ui


def test_r195_does_not_replace_existing_real_reference_compute_or_validation_paths():
    compute = read("compute/computeTruthR170.ts")
    atlas = read("compute/atlasComputeR170.ts")
    entry = read("runtimeEntryR169.ts")
    for path in (
        '/api/compute/relativity/event', '/api/compute/relativity/velocity', '/api/compute/optics/tmm',
        '/api/compute/continuity/transfer', '/api/compute/continuity/diffusion', '/api/compute/wave/fdtd1d',
    ):
        assert path in compute
    assert 'NODE_COUNT = 20_736' in atlas
    assert 'handleIndependentSolverValidationRequest' in entry
    assert 'handleAtlasComputeRequest' in entry
    assert 'handleComputeRequest' in entry
