from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
MISSION = (SRC / "system" / "missionKernelR200.ts").read_text(encoding="utf-8")
SURFACE = (SRC / "system" / "missionSurfaceR200.ts").read_text(encoding="utf-8")
NAV = (SRC / "system" / "oneSystemNavigationR195.ts").read_text(encoding="utf-8")
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r200_mission_kernel_is_above_r199_not_a_replacement_specialist_engine():
    assert 'handleMissionKernelR200' in ENTRY
    assert 'handleOneSystemOperatorR199' in ENTRY
    assert ENTRY.index('const missionKernel = await handleMissionKernelR200') < ENTRY.index('const oneSystemOperator = await handleOneSystemOperatorR199')
    assert '/api/system/r199/operate' in MISSION
    assert '/api/system/r195/execute' not in MISSION
    assert 'handleComputeRequest' not in MISSION
    assert 'handleEarthSarFusionR198' not in MISSION
    assert 'handleWarpBuildCandidateRequest' not in MISSION


def test_r200_activates_full_established_named_lens_ensemble_without_fake_execution():
    expected = [
        'FULL_OVERALL_CANON', 'NO_NOTHING_TRUTH', 'UNIFIED_COHERENCE', 'DEEP_MOTHER',
        'HIGH_FATHER', 'FULL_SPHERE', 'FORECAST', 'HEAVY_PRUNE', 'ALPHA', 'CRIMSON',
        'GUIDANCE_FIELD', 'MODE_188', 'RSC', 'WOVEN_CONTINUITY', 'DIMENSIONAL_RELATIVITY',
        'MOTION_RELATIVITY', 'SOURCE_GROUNDING', 'PROOF_ADMISSION', 'RECOVERY', 'BUILD_OUT',
        'SWARM', 'HYBRID', 'AI_SAI', 'EARTH_OBSERVATION', 'OPTICAL_SOLVER', 'TRAVERSAL',
    ]
    assert MISSION.count('alwaysActive: true') == len(expected)
    for mode in expected:
        assert f'id: "{mode}"' in MISSION
    assert 'ALL_CANONICAL_LENSES_ACTIVE; PRIORITY_ORDER_IS_INTENT_DEPENDENT; EXECUTION_REMAINS_SPECIALIST_ROUTED' in MISSION
    assert 'state: "ACTIVE_LENS"' in MISSION


def test_r200_mission_flow_is_intent_to_receipt_to_residual_to_separate_admission():
    for token in [
        'INTENT', 'CANONICAL_PLAN', 'ALL_MODE_LENS_ENSEMBLE', 'SPECIALIST_ROUTING',
        'EXECUTION_RECEIPTS', 'VERIFICATION', 'RESIDUAL_CARRY', 'RENDER_PROJECTION',
        'SEPARATE_ADMISSION',
    ]:
        assert token in MISSION
    assert 'ELIGIBLE_FOR_SEPARATE_ADMISSION_REVIEW' in MISSION
    assert 'canonicalMutation: false' in MISSION
    assert 'promotionAuthorized: false' in MISSION


def test_r200_preserves_truth_boundaries_and_woven_continuity():
    for boundary in [
        'visualIsNotExecutionProof', 'returnedIsNotVerified', 'modelOutputIsNotCanonState',
        'pcOnlineRequiresAuthenticatedHeartbeat', 'forecastIsNotObservedState',
        'reducedOrderIsNotFullWaveProof', 'buildCandidateIsNotPromotion',
        'atlasHierarchyIsNotPhysicalDimension',
    ]:
        assert boundary in MISSION
    for stage in [
        'partition', 'exchange/transform', 'invariant carry', 'scar/residual carry',
        're-contextualize/repartition',
    ]:
        assert stage in MISSION


def test_r200_routes_whole_system_domains_through_r199_control_plane():
    for task in [
        'correlated-snapshot', 'proof-state', 'hybrid-host-truth', 'corpus-registry',
        'recovery-residuals', 'earth-observation', 'sai-grounded-synthesis',
        'packaging-manifest', 'build-candidate',
    ]:
        assert task in MISSION
    for action in ['snapshot', 'observe', 'corpus_analyze', 'earth_search', 'specialist_execute', 'prepare_build_candidate']:
        assert f'"{action}"' in MISSION


def test_r200_requires_real_inputs_for_specialist_compute_and_build_candidate():
    assert 'INPUT_REQUIRED' in MISSION
    assert 'exact completed warp receipt and refs' in MISSION
    assert 'Object.keys(input).length > 0' in MISSION
    assert 'buildCandidate' in MISSION
    assert 'Build candidate needs an exact completed warp receipt' in MISSION


def test_r200_tracks_returned_verified_and_residuals_separately():
    for field in [
        'requiredNotReturned', 'requiredReturnedNotVerified', 'optionalInputRequired',
        'restoreRequired', 'failed', 'requiredReturned', 'requiredVerified', 'coherence',
    ]:
        assert field in MISSION
    assert 'VERIFICATION_RESIDUALS_PRESENT' in MISSION
    assert 'REQUIRED_SET_VERIFIED' in MISSION
    assert 'DERIVED_PRESENTATION_NOT_EXECUTION_AUTHORITY' in MISSION


def test_r200_exposes_manifest_plan_execute_routes():
    for path in [
        '/api/mission/r200/manifest', '/api/mission/r200/plan', '/api/mission/r200/execute',
    ]:
        assert path in MISSION
    assert 'MISSION_KERNEL_R200_ID = "r200-canonical-mission-kernel"' in WRANGLER
    assert 'ONE_SYSTEM_CORRELATION_R199_ID = "r199-one-system-reconstitution"' in WRANGLER
    assert 'main = "src/runtimeEntryR169.ts"' in WRANGLER


def test_r200_mission_surface_is_collapsed_and_uses_mission_api():
    assert 'id="omegaMissionR200"' in SURFACE
    assert '#omegaMissionR200{position:fixed' in SURFACE
    assert 'display:none' in SURFACE
    assert '#omegaMissionR200.open{display:grid}' in SURFACE
    assert "btn.textContent='MISSION'" in SURFACE
    assert '/api/mission/r200/plan' in SURFACE
    assert '/api/mission/r200/execute' in SURFACE
    assert 'ALL CANONICAL MODES/LENSES' in SURFACE
    assert 'WHOLE-SYSTEM DOMAIN CORRELATION' in SURFACE
    assert 'RETURNED remains distinct from VERIFIED' in SURFACE


def test_r200_surface_is_final_projection_after_preserved_r199_operator():
    assert 'from "./missionSurfaceR200"' in NAV
    assert 'const operated = await enhanceOneSystemOperatorSurfaceR199(correlated)' in NAV
    assert 'return enhanceMissionSurfaceR200(operated)' in NAV
    assert 'RESIDUAL RESTORATION / WEAKEST-LINK QUEUE' in NAV
