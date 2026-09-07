from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
ENTRY = (SRC / "runtimeEntryR169.ts").read_text(encoding="utf-8")
R202 = (SRC / "system" / "continuityPotentialR202.ts").read_text(encoding="utf-8")
R201 = (SRC / "system" / "omegaRuntimeR201.ts").read_text(encoding="utf-8")
R200 = (SRC / "system" / "missionKernelR200.ts").read_text(encoding="utf-8")
R199 = (SRC / "system" / "oneSystemOperatorR199.ts").read_text(encoding="utf-8")
R195 = (SRC / "system" / "driveCorpusSystemR195.ts").read_text(encoding="utf-8")
RESTORE = (SRC / "system" / "restorationPlannerR195.ts").read_text(encoding="utf-8")
WRANGLER = (WORKER / "wrangler.toml").read_text(encoding="utf-8")


def test_r202_is_routed_above_r201_and_r200_without_replacing_canonical_runtime():
    assert 'handleContinuityPotentialR202' in ENTRY
    assert 'handleDurableMissionR201' in ENTRY
    assert 'handleMissionKernelR200' in ENTRY
    assert ENTRY.index('const continuityPotential = await handleContinuityPotentialR202') < ENTRY.index('const durableMission = await handleDurableMissionR201')
    assert ENTRY.index('const durableMission = await handleDurableMissionR201') < ENTRY.index('const missionKernel = await handleMissionKernelR200')
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in ENTRY
    assert 'export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201"' in ENTRY


def test_r202_closes_existing_truth_corpus_operator_mission_history_loop():
    for path in [
        '/api/acceptance/r190/manifest',
        '/api/system/r195/manifest',
        '/api/system/r199/snapshot',
        '/api/mission/r200/manifest',
        '/api/mission/r201/summary',
        '/api/mission/r201/verify',
        '/api/system/r195/restoration?limit=100',
    ]:
        assert path in R202
    for token in [
        'R190_CAPABILITY_TRUTH',
        'R195_DRIVE_CORPUS_AND_RESTORATION_EVIDENCE',
        'R199_CORRELATED_OPERATOR_STATE',
        'R200_ALL_MODE_MISSION_KERNEL',
        'R201_DURABLE_MISSION_CHAIN',
        'R202_GAP_CORRELATION',
        'R202_BOUNDED_NEXT_ACTION',
        'R202_RECALIBRATION',
    ]:
        assert token in R202


def test_r202_uses_evidence_priority_not_invented_physical_or_mode_score():
    assert 'LEXICOGRAPHIC_EVIDENCE_PRIORITY_NOT_PHYSICAL_SCORE' in R202
    assert 'workbookScoreIsNotPhysicalTruth: true' in R202
    assert 'cohortReachabilityIsNotArtifactProof: true' in R202
    assert 'recommendationIsNotAuthorization: true' in R202
    assert 'Drive/corpus classification and cohort reachability guide engineering priority' in R202
    assert 'S188=CΩ/' not in R202
    assert 'STAY_THRESHOLD' not in R202
    assert 'ESCALATE_THRESHOLD' not in R202
    assert 'Math.random' not in R202


def test_r202_preserves_r200_as_mode_authority_and_uses_all_established_mode_families():
    assert 'R200 mode ensemble remains authoritative' in R202
    assert 'R200_CANONICAL_LENS_POLICY' in R202
    for mode in [
        'FULL_OVERALL_CANON', 'NO_NOTHING_TRUTH', 'UNIFIED_COHERENCE', 'HIGH_FATHER',
        'FULL_SPHERE', 'FORECAST', 'HEAVY_PRUNE', 'CRIMSON', 'GUIDANCE_FIELD',
        'MODE_188', 'RSC', 'WOVEN_CONTINUITY', 'DIMENSIONAL_RELATIVITY',
        'MOTION_RELATIVITY', 'SOURCE_GROUNDING', 'PROOF_ADMISSION', 'RECOVERY',
        'BUILD_OUT', 'HYBRID', 'AI_SAI', 'EARTH_OBSERVATION', 'TRAVERSAL',
    ]:
        assert mode in R200
        assert mode in R202


def test_r202_maps_the_drive_one_system_menu_into_live_gap_classes_without_claiming_artifact_admission():
    for menu in [
        '01 Runtime Core', '02 Proof & Governance', '03 Traversal', '04 Render Field',
        '05 Host Inputs', '06 AI Orchestration', '07 Data / Excel Atlas', '08 Audio / Signal',
        '09 World / Bio / Forecast', '10 Recovery / Packaging', '11 Archive Merge', '12 Operator Cockpit',
    ]:
        assert menu in R202
        assert menu in RESTORE
    for cls in [
        'RESTORE_EXECUTION_PROOF', 'REPAIR_LIVE_COHORT', 'BOUNDED_ADMISSION_OPPORTUNITY',
        'ARTIFACT_PROOF_EXPANSION', 'PRESERVE_VERIFIED_COHORT',
    ]:
        assert cls in R202
    assert 'artifactProofGap' in R202
    assert 'unadmittedArtifacts' in R202


def test_r202_closed_loop_executes_only_through_r201_then_recalibrates():
    assert '/api/mission/r201/execute' in R202
    execute_pos = R202.index('const durableMission = await invoke')
    rescan_pos = R202.index('const recalibrated = await buildPotentialSnapshot')
    assert execute_pos < rescan_pos
    assert 'R200_PLAN_AND_EXECUTE' in R202
    assert 'R201_RECEIPT_VERIFY_AND_RECORD' in R202
    assert 'R201_CHAIN_VERIFY' in R202
    assert 'SEPARATE_ADMISSION_REQUIRED' in R202
    assert 'EVIDENCE_LOOP_VERIFIED_SEPARATE_ADMISSION_STILL_REQUIRED' in R202


def test_r202_cannot_mutate_canon_host_source_deployment_or_promotion():
    for token in [
        'canonicalMutation: false', 'hostStateMutation: false', 'sourceMutationAuthorized: false',
        'deploymentAuthorized: false', 'promotionAuthorized: false',
    ]:
        assert token in R202
    lowered = R202.lower()
    for mutation_surface in [
        'api.github.com/repos/', 'github.com/medicinaleljefe/', 'wrangler deploy',
        'ctx.storage.put', 'env?.omega_runtime', 'env?.omega_mission_ledger_r201.get(',
    ]:
        assert mutation_surface not in lowered


def test_r202_adds_no_shadow_durable_namespace_or_service_binding():
    assert 'CONTINUITY_POTENTIAL_R202_ID = "r202-unified-continuity-potential"' in WRANGLER
    assert 'OMEGA_R202' not in WRANGLER
    assert 'OmegaContinuityPotentialR202' not in WRANGLER
    assert WRANGLER.count('name = "OMEGA_RUNTIME"') == 1
    assert WRANGLER.count('name = "OMEGA_MISSION_LEDGER_R201"') == 1
    assert 'R202 adds no Durable Object' in WRANGLER


def test_r201_hardening_removes_general_runtime_behavior_from_evidence_namespace():
    assert 'export class OmegaMissionLedgerR201' in R201
    assert 'from "../omegaRuntime"' not in R201
    assert 'extends BaseOmegaRuntime' not in R201
    assert 'super.fetch' not in R201
    assert 'HYBRID_OPS' not in R201
    assert 'DEDICATED_EVIDENCE_ONLY_DURABLE_OBJECT_NO_GENERAL_RUNTIME_METHODS' in R201
    assert 'R201_EVIDENCE_LEDGER_ROUTE_NOT_FOUND' in R201


def test_r202_reuses_existing_organs_instead_of_duplicating_specialist_engines():
    assert 'SPECIALIST_EXECUTION_WITH_RECEIPT' in R199
    assert 'chartEDIsNotExecuted'.lower() in R195.lower()
    assert 'individualized' not in R202.lower()
    assert 'handleComputeRequest' not in R202
    assert 'handleEarthSarFusionR198' not in R202
    assert 'handleSaiAiFusionR179' not in R202
    assert 'handleWarpBuildCandidateRequest' not in R202


def test_r202_public_contract_exposes_manifest_potential_resolve_and_closed_loop_execution():
    for path in [
        '/api/system/r202/manifest',
        '/api/system/r202/potential',
        '/api/system/r202/resolve',
        '/api/mission/r202/execute',
    ]:
        assert path in R202
    assert 'OMEGA_UNIFIED_CONTINUITY_POTENTIAL_R202' in R202
    assert 'OMEGA_CONTINUITY_POTENTIAL_RESOLUTION_R202' in R202
    assert 'OMEGA_CLOSED_LOOP_CONTINUITY_EXECUTION_R202' in R202
    assert 'receiptSha256' in R202