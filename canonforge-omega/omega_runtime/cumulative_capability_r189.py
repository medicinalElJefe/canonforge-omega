from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

from .system_manifest import FAMILIES


CUMULATIVE_REVISION_R189 = "R189"
CUMULATIVE_SCHEMA_R189 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R189"

EXECUTION_REGIMES_R189 = (
    "ASYNC_INDEPENDENT",
    "CAUSAL_DAG",
    "BOUNDED_WAVE",
    "SYNCHRONIZED_BARRIER_R188",
    "HETEROGENEOUS_FEDERATED",
)


@dataclass(frozen=True, slots=True)
class CapabilityOrganR189:
    capability_id: str
    name: str
    introduced: str
    artifacts: tuple[str, ...]
    invariant: str


CAPABILITY_ORGANS_R189: tuple[CapabilityOrganR189, ...] = (
    CapabilityOrganR189("R85_RUNTIME_RECOVERY", "Runtime recovery and continuity", "R85", (
        "omega_runtime/runtime.py",
        "tests/test_omega_runtime_recovery_r85.py",
    ), "Recovery extends the runtime; it never replaces the full runtime."),
    CapabilityOrganR189("R89_GENESIS_BINDING", "Genesis service binding", "R89", (
        "evidence/R89_GENESIS_SERVICE_BINDING.md",
        "tests/test_genesis_service_binding_r89.py",
    ), "Genesis remains a federated organ with explicit service truth."),
    CapabilityOrganR189("R91_CAPABILITY_ROUTER", "Actionable capability router", "R91", (
        "cloudflare/omega-v6-worker/src/capabilityRouter.ts",
        "tests/test_actionable_capability_router_r91.py",
    ), "Capabilities remain routable and independently inspectable."),
    CapabilityOrganR189("R94_RELATION_WORKBENCH", "Relation workbench", "R94", (
        "cloudflare/omega-v6-worker/src/relationWorkbench.ts",
        "tests/test_relation_workbench_r94.py",
    ), "Relations are first-class state, not UI decoration."),
    CapabilityOrganR189("R95_MEMORY_SCAR_FORECAST", "Memory, scar and forecast continuity", "R95", (
        "cloudflare/omega-v6-worker/src/memoryScar.ts",
        "tests/test_memory_scar_forecast_r95.py",
    ), "History/scar carry survives successor transformation."),
    CapabilityOrganR189("R106_UNIFIED_OPERATIONAL_CORE", "Unified operational core", "R106", (
        "cloudflare/omega-v6-worker/src/unifiedOperationalCore.ts",
        "tests/test_unified_operational_core_r106.py",
    ), "State, intelligence, memory, relation, computation, action, observation and proof remain composed."),
    CapabilityOrganR189("R107_R115_PROOF_LEARNING_CHAIN", "Validation, observation, attribution and ablation chain", "R107-R115", (
        "cloudflare/omega-v6-worker/src/coreValidationReplay.ts",
        "cloudflare/omega-v6-worker/src/forecastObservationBinding.ts",
        "cloudflare/omega-v6-worker/src/bindingEvidenceLedger.ts",
        "cloudflare/omega-v6-worker/src/modeOperatorEvidenceAttribution.ts",
        "cloudflare/omega-v6-worker/src/modeOperatorAblationMatrix.ts",
        "tests/test_core_validation_replay_r107.py",
        "tests/test_binding_evidence_ledger_r113.py",
        "tests/test_mode_operator_ablation_r115.py",
    ), "Learning and promotion remain evidence-bound."),
    CapabilityOrganR189("R118_R130_HD_SPATIAL_VISUAL", "HD instrument, navigation, camera, sovereign visual and spatial command", "R118-R130", (
        "cloudflare/omega-v6-worker/src/coreStudioHdInstrument.ts",
        "cloudflare/omega-v6-worker/src/launchHdNavigation.ts",
        "cloudflare/omega-v6-worker/src/syntheticCamera.ts",
        "cloudflare/omega-v6-worker/src/sovereignVisualShell.ts",
        "cloudflare/omega-v6-worker/src/spatialCommandCore.ts",
        "tests/test_core_hd_instrument_r118.py",
        "tests/test_r127_synthetic_camera.py",
        "tests/test_r130_spatial_command_core.py",
    ), "Visual and spatial upgrades preserve operational controls and evidence boundaries."),
    CapabilityOrganR189("R136_R147_CALCULUS_VISUAL_RELATIVITY", "Calculus, dimensional relativity and visual integrity", "R136-R147", (
        "cloudflare/omega-v6-worker/src/calculusInstrument.ts",
        "cloudflare/omega-v6-worker/src/individualSkinRelativity.ts",
        "cloudflare/omega-v6-worker/src/governedModeAtlas.ts",
        "cloudflare/omega-v6-worker/src/unifiedMotionRelativity.ts",
        "cloudflare/omega-v6-worker/src/visualRuntimeIntegrity.ts",
        "tests/test_r136_calculus_instrument.py",
        "tests/test_r140_individual_skin_relativity.py",
        "tests/test_r145_governed_mode_atlas.py",
        "tests/test_r146_unified_motion_relativity.py",
        "tests/test_r147_calculus_field_renderer.py",
    ), "Representation, motion and dimensional roles remain frame-relative and proof-bound."),
    CapabilityOrganR189("R148_MEMORY_CONTINUITY", "Memory continuity graph", "R148", (
        "cloudflare/omega-v6-worker/src/memoryContinuityGraph.ts",
        "tests/test_r148_memory_continuity.py",
    ), "Continuity is carried, not reset by the newest build."),
    CapabilityOrganR189("R149_INTELLIGENCE_REASONING", "Intelligence reasoning pipeline", "R149", (
        "cloudflare/omega-v6-worker/src/intelligenceReasoningPipeline.ts",
        "tests/test_r149_intelligence_reasoning_pipeline.py",
    ), "Reasoning is an organ inside the runtime, not the sole authority."),
    CapabilityOrganR189("R150_CREATE_SIMULATE", "Create/simulate branch lab", "R150", (
        "cloudflare/omega-v6-worker/src/createSimulateBranchLab.ts",
        "tests/test_r150_create_simulate_branch_lab.py",
    ), "Candidate exploration remains sandboxed from Canon."),
    CapabilityOrganR189("R151_SOVEREIGN_DEVICE_COMPUTE", "Sovereign device computation", "R151", (
        "cloudflare/omega-v6-worker/src/sovereignDevicesCompute.ts",
        "tests/test_r151_sovereign_devices_compute.py",
    ), "PC/device computation remains authenticated and receipt-returning."),
    CapabilityOrganR189("R152_EARTH_TRUTH", "Earth truth layers", "R152", (
        "cloudflare/omega-v6-worker/src/earthTruthLayers.ts",
        "tests/test_r152_earth_truth_layers.py",
    ), "Observed geospatial truth remains distinct from synthetic representation."),
    CapabilityOrganR189("R154_BUILD_EVOLUTION_GOVERNANCE", "Build evolution governance", "R154", (
        "cloudflare/omega-v6-worker/src/buildEvolutionGovernance.ts",
        "tests/test_r154_build_evolution_governance.py",
    ), "Evolution is additive, bounded and reviewable."),
    CapabilityOrganR189("R159_R167_ENVIRONMENT_WORKSPACE_TRUTH", "Recovered experience, environment, workspace and state accuracy", "R159-R167", (
        "cloudflare/omega-v6-worker/src/archiveRecoveredWorkstation.ts",
        "cloudflare/omega-v6-worker/src/recoveredExperienceOrchestrator.ts",
        "cloudflare/omega-v6-worker/src/omegaEnvironmentShell.ts",
        "cloudflare/omega-v6-worker/src/unifiedWorkspaceAcceptance.ts",
        "tests/test_r159_archive_experience_recovery.py",
        "tests/test_r160_unified_environment_shell.py",
        "tests/test_r162_unified_workspace_acceptance.py",
        "tests/test_r167_authoritative_state_accuracy.py",
    ), "Archive recovery composes strongest capability without flattening authoritative state."),
    CapabilityOrganR189("R168_CLOUDFLARE_DO_SAI_HYBRID", "Durable-object lifecycle and SAI hybrid motion fabric", "R168", (
        "cloudflare/omega-v6-worker/src/saiHybridComputeField.ts",
        "tests/test_r168_cloudflare_do_lifecycle.py",
        "tests/test_r168_sai_hybrid_motion_fabric.py",
    ), "Cloud state and SAI hybrid execution remain explicit and inspectable."),
    CapabilityOrganR189("R169_SWARM_NAMESPACE", "Stateful swarm organism and routing", "R169", (
        "cloudflare/omega-v6-worker/src/runtimeEntryR169.ts",
        "cloudflare/omega-v6-worker/src/swarm/swarmCoreR169.ts",
        "cloudflare/omega-v6-worker/src/swarm/swarmCellR169.ts",
        "cloudflare/omega-v6-worker/src/swarm/swarmCoordinatorR169.ts",
        "cloudflare/omega-v6-worker/src/swarm/swarmOrganismR169.ts",
        "cloudflare/omega-v6-worker/src/swarm/swarmAutonomicR169.ts",
        "cloudflare/omega-v6-worker/src/swarm/swarmRouterR169.ts",
        "tests/test_swarm_namespace_recovery_r169.py",
    ), "The swarm remains one body with independently addressable organs/cells."),
    CapabilityOrganR189("R170_COMPUTATION", "Advanced and atlas computation surfaces", "R170", (
        "omega_runtime/advanced_computation.py",
        "cloudflare/omega-v6-worker/src/compute/computeTruthR170.ts",
        "cloudflare/omega-v6-worker/src/compute/atlasComputeR170.ts",
        "tests/test_advanced_computation_r170.py",
        "tests/test_computation_surface_r170.py",
    ), "Computed outputs carry method and evidence truth."),
    CapabilityOrganR189("R171_PRECISION_CONVERGENCE", "Precision swarm convergence body", "R171", (
        "cloudflare/omega-v6-worker/src/swarmPrecisionBodyR171.ts",
        "tests/test_r171_computation_swarm_convergence.py",
    ), "Higher precision extends rather than removes lower-cost execution paths."),
    CapabilityOrganR189("R172_VALIDATION_FABRIC", "Heterogeneous validation fabric", "R172", (
        "cloudflare/omega-v6-worker/src/validation/validationFabricR172.ts",
        "cloudflare/omega-v6-worker/src/validation/validationLabR172.ts",
        "cloudflare/omega-v6-worker/src/validation/validationOverlayR172.ts",
        "tests/test_heterogeneous_validation_r172.py",
    ), "Validation remains heterogeneous and independently inspectable."),
    CapabilityOrganR189("R173_CROSS_RUNTIME", "Cross-runtime parity validation", "R173", (
        "omega_runtime/cross_runtime.py",
        "cloudflare/omega-v6-worker/src/validation/crossRuntimeParityR173.ts",
        "tests/test_cross_runtime_parity_r173.py",
    ), "Runtime parity is proved rather than assumed."),
    CapabilityOrganR189("R174_FEDERATED_ORGANS", "Federated organ fabric", "R174", (
        "cloudflare/omega-v6-worker/src/federation/federatedOrganFabricR174.ts",
        "cloudflare/omega-v6-worker/src/federation/federatedOrganLabR174.ts",
        "tests/test_r174_federated_organ_fabric.py",
    ), "Genesis, Optical, Sovereign and cloud organs remain federated without collapsing authority."),
    CapabilityOrganR189("R175_INDEPENDENT_SOLVER", "Independent solver validation", "R175", (
        "omega_runtime/rcwa_solver.py",
        "cloudflare/omega-v6-worker/src/validation/independentSolverR175.ts",
        "tests/test_r175_independent_solver_validation.py",
    ), "Independent numerical validation cannot be replaced by a display claim."),
    CapabilityOrganR189("R176_WARP_COMPUTATION", "Warp computation fabric", "R176", (
        "cloudflare/omega-v6-worker/src/swarm/warpComputationR176.ts",
        "cloudflare/omega-v6-worker/src/swarm/warpComputationLabR176.ts",
        "tests/test_r176_warp_computation_fabric.py",
    ), "Accelerated computation retains terminal accounting and receipts."),
    CapabilityOrganR189("R177_WARP_INTEGRITY", "Warp integrity accelerator", "R177", (
        ".github/workflows/omega-v6-r177-live-integrity-proof.yml",
        "tests/test_r177_warp_integrity_accelerator.py",
    ), "Fast paths remain subordinate to integrity proof."),
    CapabilityOrganR189("R178_CANDIDATE_LAB", "Warp self-build candidate lab", "R178", (
        "omega_runtime/warp_candidate.py",
        "cloudflare/omega-v6-worker/src/swarm/warpBuildCandidateR178.ts",
        "cloudflare/omega-v6-worker/src/swarm/warpBuildCandidateLabR178.ts",
        "tests/test_r178_warp_build_candidate.py",
    ), "Generated candidates are not Canon until admitted."),
    CapabilityOrganR189("R179_B059_AI_SAI", "B059 deterministic SAI plus provider-backed AI/SAI fusion", "R179", (
        "omega_runtime/sai_b059.py",
        "omega_runtime/sai_training.py",
        "omega_runtime/agent_sai_r179.py",
        "cloudflare/omega-v6-worker/src/sai/saiRuntimeR179.ts",
        "cloudflare/omega-v6-worker/src/intelligence/saiAiFusionR179.ts",
        "tests/test_r179_b059_integrated_training.py",
        "tests/test_r179_ai_sai_fusion.py",
    ), "B059 corpus training scope and external model pretraining remain separately labeled."),
    CapabilityOrganR189("R180_LOAD_GOVERNOR", "Load-governed continuous swarm development", "R180", (
        "cloudflare/omega-v6-worker/src/swarm/swarmGovernorR180.ts",
        "tests/test_r180_b059_sai_swarm_governor_convergence.py",
    ), "Development contracts under pressure instead of erasing interactive capacity."),
    CapabilityOrganR189("R181_LIVE_ACCEPTANCE", "Live AI/SAI/Sovereign acceptance", "R181", (
        "cloudflare/omega-v6-worker/src/acceptance/liveAcceptanceR181.ts",
        "tests/test_r181_live_ai_sai_sovereign_acceptance.py",
    ), "Full acceptance requires current authenticated evidence."),
    CapabilityOrganR189("R182_CONTINUITY_DEPLOY_FIRST", "Continuity and deploy-first proof orchestration", "R182", (
        "tests/test_r182_continuity_deploy_first_orchestration.py",
        ".github/workflows/omega-v6-verify.yml",
    ), "Deploy exact verified SHA before expensive live proof."),
    CapabilityOrganR189("R183_SUCCESSOR_SUPERIORITY", "Successor superiority gate", "R183", (
        "omega_runtime/successor_gate.py",
        "cloudflare/omega-v6-worker/src/swarm/successorGateR183.ts",
        "tests/test_r183_successor_superiority_gate.py",
    ), "A successor must prove improvement without capability regression."),
    CapabilityOrganR189("R184_IMPROVEMENT_DISCOVERY", "Exact improvement/design discovery", "R184", (
        "omega_runtime/improvement_discovery.py",
        "cloudflare/omega-v6-worker/src/swarm/improvementDiscoveryR184.ts",
        "tests/test_r184_improvement_discovery_design_output.py",
    ), "Design identity is hash-bound to mission, predecessor and evidence."),
    CapabilityOrganR189("R185_172_CLOUD_FEDERATION", "172-cloud stateful federation", "R185", (
        "cloudflare/omega-v6-worker/src/swarm/cloudSwarmR185.ts",
        ".github/workflows/omega-v6-r185-live-172-cloud-proof.yml",
        "tests/test_r185_172_cloud_federation.py",
    ), "All 172 cloud nodes remain individually addressable while participating as one organism."),
    CapabilityOrganR189("R186_EXECUTION_EVIDENCE", "Execution-derived successor evidence loop", "R186", (
        "omega_runtime/successor_evidence_r186.py",
        "cloudflare/omega-v6-worker/src/swarm/successorEvidenceR186.ts",
        "tests/test_r186_execution_evidence_loop.py",
    ), "Successor metrics derive from execution evidence rather than caller assertion."),
    CapabilityOrganR189("R187_BOUNDED_SELF_PATCH", "Bounded self-patch materialization with rollback", "R187", (
        "omega_runtime/source_patch_r187.py",
        "cloudflare/omega-v6-worker/src/swarm/sourcePatchR187.ts",
        "tests/test_r187_source_patch.py",
    ), "Self-development is path-bounded, predecessor-hash-bound and rollback-capable."),
    CapabilityOrganR189("R188_MOTION_TIME", "Synchronous motion-time regime", "R188", (
        "omega_runtime/motion_time_r188.py",
        "cloudflare/omega-v6-worker/src/swarm/motionTimeR188.ts",
        "cloudflare/omega-v6-worker/src/swarm/motionCoordinatorR188.ts",
        "tests/test_r188_motion_time.py",
    ), "Synchronous barrier motion is preserved as one execution regime, not promoted into a universal replacement."),
)


def base_family_ids_r189() -> tuple[str, ...]:
    return tuple(family.family_id for family in FAMILIES)


def extension_capability_ids_r189() -> tuple[str, ...]:
    return tuple(organ.capability_id for organ in CAPABILITY_ORGANS_R189)


def required_capability_ids_r189() -> tuple[str, ...]:
    return base_family_ids_r189() + extension_capability_ids_r189()


def _canonical_payload() -> Dict[str, object]:
    return {
        "schema": CUMULATIVE_SCHEMA_R189,
        "revision": CUMULATIVE_REVISION_R189,
        "baseFamilies": list(base_family_ids_r189()),
        "extensionOrgans": [
            {
                "id": organ.capability_id,
                "name": organ.name,
                "introduced": organ.introduced,
                "artifacts": list(organ.artifacts),
                "invariant": organ.invariant,
            }
            for organ in CAPABILITY_ORGANS_R189
        ],
        "executionRegimes": list(EXECUTION_REGIMES_R189),
        "law": {
            "upgrade": "ADD_OR_STRENGTHEN_WITHOUT_OVERWRITING_ADMITTED_CAPABILITY",
            "promotion": "PROVE_PREDECESSOR_PRESERVATION_PLUS_MATERIAL_IMPROVEMENT",
            "deprecation": "EXPLICIT_MIGRATION_PROOF_COMPATIBILITY_ROUTE_AND_ROLLBACK_REQUIRED",
            "r188Role": "SPECIALIZED_SYNCHRONIZED_BARRIER_REGIME_NOT_UNIVERSAL_SCHEDULER",
        },
    }


def capability_baseline_hash_r189() -> str:
    raw = json.dumps(_canonical_payload(), sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def required_artifacts_r189() -> tuple[str, ...]:
    ordered: list[str] = []
    for family in FAMILIES:
        for artifact in family.implementation:
            if artifact.endswith("/"):
                continue
            normalized = artifact.replace("\\", "/")
            if normalized and normalized not in ordered:
                ordered.append(normalized)
    for organ in CAPABILITY_ORGANS_R189:
        for artifact in organ.artifacts:
            normalized = artifact.replace("\\", "/")
            if normalized and normalized not in ordered:
                ordered.append(normalized)
    return tuple(ordered)


def verify_cumulative_artifacts_r189(repo_root: Path | str | None = None) -> Dict[str, object]:
    root = Path(repo_root) if repo_root is not None else Path(__file__).resolve().parents[1]
    package_root = root if (root / "omega_runtime").is_dir() else root / "canonforge-omega"
    repository_root = package_root.parent if (package_root.parent / ".github").is_dir() else root
    required = required_artifacts_r189()
    missing: list[str] = []
    hashes: Dict[str, str] = {}
    for relative in required:
        target = (repository_root / relative) if relative.startswith(".github/") else (package_root / relative)
        if not target.is_file():
            missing.append(relative)
            continue
        hashes[relative] = hashlib.sha256(target.read_bytes()).hexdigest()
    digest_payload = {
        "baselineSha256": capability_baseline_hash_r189(),
        "artifactHashes": hashes,
    }
    inventory_sha = hashlib.sha256(
        json.dumps(digest_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return {
        "schema": "OMEGA_CUMULATIVE_ARTIFACT_PROOF_R189",
        "revision": CUMULATIVE_REVISION_R189,
        "complete": not missing,
        "requiredArtifactCount": len(required),
        "verifiedArtifactCount": len(hashes),
        "missingArtifacts": missing,
        "baselineSha256": capability_baseline_hash_r189(),
        "inventorySha256": inventory_sha,
        "artifactHashes": hashes,
    }


def cumulative_summary_r189(repo_root: Path | str | None = None) -> Dict[str, object]:
    proof = verify_cumulative_artifacts_r189(repo_root)
    return {
        **_canonical_payload(),
        "baseFamilyCount": len(FAMILIES),
        "extensionOrganCount": len(CAPABILITY_ORGANS_R189),
        "totalCapabilityGroups": len(required_capability_ids_r189()),
        "baselineSha256": capability_baseline_hash_r189(),
        "artifactProof": proof,
        "complete": bool(proof["complete"]) and len(FAMILIES) == 24,
        "authority": "CUMULATIVE_CAPABILITY_CANON_FOR_PROMOTION_NON_REGRESSION",
    }
