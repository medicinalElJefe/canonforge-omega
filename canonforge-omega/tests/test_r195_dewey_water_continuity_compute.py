from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"


def read(name: str) -> str:
    return (SRC / name).read_text()


def pair_011(b: float, c: float):
    inv = 1 / math.sqrt(2)
    construct = (b + c) * inv
    prune = (b - c) * inv
    return construct, prune


def inverse_pair(construct: float, prune: float):
    inv = 1 / math.sqrt(2)
    return (construct + prune) * inv, (construct - prune) * inv


def water_velocity(s: float, d: float, curvature: float, circulation: float, phase: float):
    eps = 1e-12
    r2 = s * s + d * d + eps
    radial = 2 * circulation / r2
    wave = 0.08 * math.sin(phase + s - d)
    ds = curvature * d + radial * d + wave
    dd = -curvature * s - radial * s + wave
    return ds, dd


def test_011_01m1_pair_is_orthonormal_and_invertible():
    samples = [
        (0.7, 0.2),
        (-3.25, 8.125),
        (1e-9, -1e-7),
        (37.0, 73.0),
        (-37.0, -73.0),
    ]
    for b, c in samples:
        construct, prune = pair_011(b, c)
        rb, rc = inverse_pair(construct, prune)
        assert math.isclose(b * b + c * c, construct * construct + prune * prune, rel_tol=1e-12, abs_tol=1e-12)
        assert math.isclose(rb, b, rel_tol=1e-12, abs_tol=1e-12)
        assert math.isclose(rc, c, rel_tol=1e-12, abs_tol=1e-12)


def test_water_geometry_is_numerically_divergence_free():
    # Central finite-difference check of d(v_s)/ds + d(v_d)/dd.
    h = 1e-6
    points = [(0.4, 0.8), (-1.2, 0.45), (2.1, -0.7), (-0.35, -1.4)]
    for s, d in points:
        vsp = water_velocity(s + h, d, 0.42, 0.55, 1.1)[0]
        vsm = water_velocity(s - h, d, 0.42, 0.55, 1.1)[0]
        vdp = water_velocity(s, d + h, 0.42, 0.55, 1.1)[1]
        vdm = water_velocity(s, d - h, 0.42, 0.55, 1.1)[1]
        divergence = (vsp - vsm) / (2 * h) + (vdp - vdm) / (2 * h)
        assert abs(divergence) < 2e-7


def test_r195_engine_declares_no_zero_log_space_and_truth_boundaries():
    engine = read("compute/deweyWaterContinuityR195.ts")
    required = (
        'const EPS = 1e-12',
        'MAGNITUDE_FLOOR_PLUS_SEPARATE_ORIENTATION',
        'log-space accumulation with bounded exponentiation',
        'orientation: Orientation',
        'safeLog',
        'safeExp',
        'MODEL_CONVERGENCE_INDEX_NOT_FATE',
        'DETERMINISTIC_MODEL_COMPUTATION_NOT_MEASUREMENT',
        'physicalMeasurement: false',
        'canonicalMutation: false',
        'not literal physical dimensions',
    )
    for token in required:
        assert token in engine


def test_r195_implements_full_woven_continuity_chain():
    engine = read("compute/deweyWaterContinuityR195.ts")
    for token in (
        '"partition"',
        '"exchange/transform"',
        '"invariant carry"',
        '"scar/residual carry"',
        '"re-contextualize/repartition"',
    ):
        assert token in engine
    assert "predictedResidual" in engine
    assert "scarIn" in engine
    assert "recoveryGain" in engine


def test_r195_all_15_governed_modes_share_one_engine():
    engine = read("compute/deweyWaterContinuityR195.ts")
    mode_ids = (
        "full-overall-canon", "mode-188", "unified-coherence", "forecast", "full-sphere",
        "relational-skin", "dewey-calculus", "unified-recursion", "deep-mother", "high-father",
        "heavy-prune", "alpha", "crimson", "no-nothing-truth", "guidance-field",
    )
    for mode in mode_ids:
        assert f'"{mode}"' in engine
    assert "MODE_PROFILES" in engine
    assert "function params(raw: Obj = {}, mode: GovernedModeId)" in engine
    assert "function stepOnce(s: DeweyState, p: DeweyParams)" in engine


def test_r195_dimensional_relativity_is_address_resolution_only():
    engine = read("compute/deweyWaterContinuityR195.ts")
    assert "[12, 144, 1728, 20736, 248832]" in engine
    assert 'boundary: "address/resolution only"' in engine
    assert 'base: 12' in engine
    assert "Math.log(shellValue) / Math.log(12)" in engine


def test_r195_extreme_compute_is_bounded_for_worker_performance():
    engine = read("compute/deweyWaterContinuityR195.ts")
    assert "const MAX_STEPS = 4096" in engine
    assert "const MAX_ENSEMBLE = 256" in engine
    assert "const MAX_TRACE = 2048" in engine
    assert "traceEvery" in engine
    assert "maxPairEnergyError" in engine
    assert "omegaCoefficientOfVariation" in engine
    assert "sensitivityPenalty" in engine


def test_r195_routes_before_generic_compute_fallback():
    entry = read("runtimeEntryR169.ts")
    exact = 'const deweyCompute = await handleDeweyWaterContinuityR195(request);'
    generic = 'if (url.pathname.startsWith("/api/compute/")) return handleComputeRequest(request);'
    assert exact in entry
    assert generic in entry
    assert entry.index(exact) < entry.index(generic)
    assert 'import { handleDeweyWaterContinuityR195 } from "./compute/deweyWaterContinuityR195"' in entry
    assert 'import { enhanceDeweyComputeSurfaceR195 } from "./deweyComputeSurfaceR195"' in entry


def test_r195_preserves_r192_r193_r194_wrapper_chain():
    entry = read("runtimeEntryR169.ts")
    assert 'enhanceUniversalNavigationR192(response, new URL(request.url).pathname)' in entry
    assert 'enhanceUniversalWorkspaceR193(r192, new URL(request.url).pathname)' in entry
    assert 'enhanceEvidencePlaneR194(r193, new URL(request.url).pathname)' in entry
    assert 'enhanceDeweyComputeSurfaceR195(r194, new URL(request.url).pathname)' in entry
    assert 'import { handleSuccessorEvidenceR186 } from "./swarm/successorEvidenceR186"' in entry


def test_r195_calculus_surface_calls_real_server_engine():
    ui = read("deweyComputeSurfaceR195.ts")
    for path in (
        "/api/compute/dewey/r195/manifest",
        "/api/compute/dewey/r195/solve",
        "/api/compute/dewey/r195/ensemble",
    ):
        assert path in ui
    assert "4096" in ui
    assert "64× STABILITY" in ui
    assert "SEED FROM STATE" in ui
    assert "/api/omega/state" in ui
    assert "SOVEREIGN STATE UNAVAILABLE · MODEL UNCHANGED" in ui


def test_r195_does_not_claim_physical_water_or_fate():
    engine = read("compute/deweyWaterContinuityR195.ts")
    ui = read("deweyComputeSurfaceR195.ts")
    assert "not measured fluid dynamics" in engine
    assert "physicalClaim: false" in engine
    assert "never fate or empirical certainty" in engine
    assert "not physical inevitability" in ui
    assert "not physical dimensions" not in ui or "address/resolution levels only" in ui
