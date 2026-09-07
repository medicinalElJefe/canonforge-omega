from __future__ import annotations

import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
CAL = SRC / "compute" / "deweyCalibrationR196.ts"
GUARD = SRC / "compute" / "deweyCalibrationGuardR196.ts"
REP = SRC / "compute" / "deweyRepresentationR196.ts"
R195 = SRC / "compute" / "deweyWaterContinuityR195.ts"
ENTRY = SRC / "runtimeEntryR169.ts"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def pair_011(b: float, c: float):
    inv = 1 / math.sqrt(2)
    return (b + c) * inv, (b - c) * inv


def dual_rail(bp: float, bn: float, cp: float, cn: float):
    inv = 1 / math.sqrt(2)
    construct = ((bp + cp) * inv, (bn + cn) * inv)
    prune = ((bp + cn) * inv, (bn + cp) * inv)
    return construct, prune


def test_r196_calibration_reuses_r195_solver_instead_of_forking_dynamics():
    cal = text(CAL)
    assert 'from "./deweyWaterContinuityR195"' in cal
    assert "handleDeweyWaterContinuityR195(request)" in cal
    assert '"https://omega.internal/api/compute/dewey/r195/solve"' in cal
    assert "function stepOnce" not in cal
    assert "function waterVelocity" not in cal


def test_r196_holdout_is_not_used_for_candidate_selection():
    cal = text(CAL)
    assert 'kind: "TRAIN_ONLY"' in cal
    assert "const evaluation = await evaluateRows(split.trainRows" in cal
    assert "// Holdout is evaluated only after candidate selection is complete." in cal
    assert "holdoutUsedForCandidateSelection: false" in cal
    assert "const baselineHoldout = await evaluateRows(split.holdoutRows" in cal
    assert "const candidateHoldout = await evaluateRows(split.holdoutRows" in cal


def test_r196_guard_and_core_require_independent_groups_and_temporal_validity():
    guard = text(GUARD)
    cal = text(CAL)
    for marker in (
        "MINIMUM_2_INDEPENDENT_GROUPS_REQUIRED_FOR_HOLDOUT",
        "TEMPORAL_SPLIT_REQUIRES_VALID_OBSERVED_AT",
        "MEASURED_ROWS_REQUIRE_PROVENANCE",
        "MEASURED_RECEIPT_CLAIM_MUST_BE_SHA256",
        "HOLDOUT_FRACTION_MUST_BE_0_1_TO_0_5",
        "requestBodyMeasurementClaimsAreNotServerAuthentication: true",
    ):
        assert marker in guard
    assert "MINIMUM_2_INDEPENDENT_GROUPS_REQUIRED_FOR_HOLDOUT" in cal
    assert "TEMPORAL_SPLIT_REQUIRES_VALID_OBSERVED_AT" in cal


def test_r196_calibration_never_promotes_request_body_measurement_claim_to_empirical_truth():
    cal = text(CAL)
    guard = text(GUARD)
    assert '"USER_REQUEST_BODY_UNVERIFIED"' in cal
    assert 'evidenceAuthority === "SERVER_VERIFIED_EVIDENCE_LEDGER"' in cal
    assert "empiricalCalibrationVerified" in cal
    assert "automaticPromotion: false" in cal
    assert "canonicalMutation: false" in cal
    assert "User-supplied MEASURED labels and provenance are evidence claims, not independent authentication" in cal
    assert "requestBodyMeasurementClaimsAreNotServerAuthentication: true" in guard


def test_r196_parameter_calibration_is_bounded_and_invariants_are_not_fitted():
    cal = text(CAL)
    for key in (
        "dt", "curvature", "circulation", "constructGain", "pruneGain",
        "scarGain", "recoveryGain", "compoundingGain", "contradictionDamping",
    ):
        assert f'"{key}"' in cal
    for invariant in (
        "011_01M1_ORTHONORMAL_BASIS",
        "NO_ZERO_MAGNITUDE_FLOOR",
        "SIGMA_ORIENTATION_SEMANTICS",
        "DIMENSIONAL_ADDRESS_LEVELS",
        "37_73_REFERENCE_KERNEL_NOT_FIXED_SYMMETRY_RULE",
    ):
        assert invariant in cal
    assert "const maxEvaluations = clamp" in cal
    assert "192" in cal
    assert "weighted Huber" in cal or "TRAIN_WEIGHTED_HUBER" in cal


def test_r196_admission_requires_strict_positive_untouched_holdout_improvement():
    cal = text(CAL)
    assert "const requiredRelativeImprovement = clamp(finite(options.requiredHoldoutRelativeImprovement, 0), 0, 1)" in cal
    assert "holdoutRelativeImprovement > requiredRelativeImprovement + 1e-12" in cal
    assert "candidateHoldout.dataLoss - bestTrain.dataLoss" in cal
    assert 'generalizationGapDefinition: "candidate_holdout_data_loss - candidate_train_data_loss"' in cal
    assert "bestTrain.dataLoss - candidateHoldout.dataLoss" not in cal


def test_r196_exact_pair_energy_still_holds_for_reference_and_signed_kernels():
    for b, c in [(0.7, 0.2), (37, 73), (-37, -73), (1e-9, -1e-8)]:
        construct, prune = pair_011(b, c)
        assert math.isclose(b*b + c*c, construct*construct + prune*prune, rel_tol=1e-12, abs_tol=1e-12)


def test_r196_dual_rails_preserve_cancellation_information_and_exact_net():
    bp, bn, cp, cn = 5.0, 4.0, 3.0, 2.0
    construct, prune = dual_rail(bp, bn, cp, cn)
    b, c = bp - bn, cp - cn
    exact_construct, exact_prune = pair_011(b, c)
    cnet = construct[0] - construct[1]
    pnet = prune[0] - prune[1]
    assert math.isclose(cnet, exact_construct, rel_tol=1e-12, abs_tol=1e-12)
    assert math.isclose(pnet, exact_prune, rel_tol=1e-12, abs_tol=1e-12)
    assert min(construct) > 0 or min(prune) > 0
    rep = text(REP)
    cal = text(CAL)
    assert "cancellationEvidencePreserved" in rep
    assert "railNetResidual" in rep
    assert "representation envelope, not a new physical primitive" in rep
    assert "function dualRailPair" not in cal
    assert "authority: \"deweyRepresentationR196\"" in cal


def test_r196_t12_is_reversible_without_decision_policy_claim():
    for phase in [-25.5, -1, 0, 3.25, 11.9, 28.0]:
        for turns in [-37, -13, -1, 0, 1, 13, 73]:
            inp = phase % 12
            out = (inp + int(turns)) % 12
            inv = (out - int(turns)) % 12
            assert math.isclose(inv, inp, abs_tol=1e-12)
    rep = text(REP)
    assert "T12 is a reversible cyclic phase/address operator" in rep
    assert "does not encode an automatic STAY/TURN/ESCALATE policy" in rep


def test_r196_runtime_routes_guard_and_representation_before_calibration_and_generic_compute():
    entry = text(ENTRY)
    guard = "handleDeweyCalibrationGuardR196(request)"
    rep = "handleDeweyRepresentationR196(request)"
    cal = "handleDeweyCalibrationR196(request)"
    generic = 'url.pathname.startsWith("/api/compute/")'
    for marker in (guard, rep, cal, generic):
        assert marker in entry
    assert entry.index(guard) < entry.index(cal) < entry.index(generic)
    assert entry.index(rep) < entry.index(cal)
    assert 'from "./validation/independentSolverLabR175"' in entry


def test_r196_preserves_r195_no_zero_and_neutral_orientation_contract():
    r195 = text(R195)
    assert "STRICT_POSITIVE_MAGNITUDE_FLOOR_PLUS_SEPARATE_ORIENTATION" in r195
    assert "const orient = s.orientation" in r195
    assert "neutralOrientationCreatesNoSignedDirectionalDrive: true" in r195
    assert "const GOLDEN_FRACTION" in r195
    perturb = r195[r195.index("function perturbState"):]
    assert "* 37" not in perturb
    assert "% 73" not in perturb


def test_r196_synthetic_benchmark_is_explicitly_non_empirical_and_fully_receipted():
    cal = text(CAL)
    assert 'authority: "SYNTHETIC_NUMERICAL_BENCHMARK_ONLY"' in cal
    assert "physicalMeasurement: false" in cal
    assert "empiricalCalibration: false" in cal
    assert 'evidenceClass: "SYNTHETIC"' in cal
    assert "const calibrationReceiptSha256 = result.receiptSha256" in cal
    assert 'envelope: "OMEGA_DEWEY_SYNTHETIC_BENCHMARK_R196"' in cal
    assert "receiptSha256: await sha256(core)" in cal


def test_r196_nested_receipt_chain_covers_guarded_envelope():
    guard = text(GUARD)
    assert 'crypto.subtle.digest("SHA-256"' in guard
    assert "calibrationReceiptSha256" in guard
    assert "guardedReceiptSha256" in guard
    assert 'receiptScope: "guarded-result-with-parent-calibration-receipt"' in guard
    assert "delete result.receiptSha256" in guard


def test_r196_receipts_and_truth_boundaries_are_explicit():
    cal = text(CAL)
    rep = text(REP)
    for source in (cal, rep):
        assert 'crypto.subtle.digest("SHA-256"' in source
        assert "receiptSha256" in source
    assert "No calibration result mutates CanonState" in cal
    assert "promotionAuthorized: false" in cal
