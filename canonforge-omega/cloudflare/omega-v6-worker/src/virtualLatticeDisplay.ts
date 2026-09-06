import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceGovernedModeAtlas } from "./governedModeAtlas";
import { enhanceUnifiedMotionRelativity } from "./unifiedMotionRelativity";
import { enhanceMemoryContinuityGraph } from "./memoryContinuityGraph";
import { enhanceIntelligenceReasoningPipeline } from "./intelligenceReasoningPipeline";
import { enhanceCreateSimulateBranchLab } from "./createSimulateBranchLab";
import { enhanceSovereignDevicesCompute } from "./sovereignDevicesCompute";
import { enhanceEarthTruthLayers } from "./earthTruthLayers";
import { enhanceBuildEvolutionGovernance } from "./buildEvolutionGovernance";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceVisualRuntimeIntegrity } from "./visualRuntimeIntegrity";
import { enhanceRecoveredExperience } from "./recoveredExperienceOrchestrator";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";
import { enhanceSaiHybridComputeField, SAI_HYBRID_MOTION_RELEASE } from "./saiHybridComputeField";
import { enhanceSwarmPrecisionBodyR171, SWARM_PRECISION_BODY_RELEASE } from "./swarmPrecisionBodyR171";
import { enhanceValidationOverlayR172, VALIDATION_OVERLAY_RELEASE_R172 } from "./validation/validationOverlayR172";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r154-build-evolution-governance";
export const RECOVERED_EXPERIENCE_RELEASE = "r159-archive-experience-recovery";
export const INTERACTIVE_FIELD_RELEASE = "r163-immersive-living-field";
export const FIELD_LAYER_RELEASE = "r165-non-destructive-layer-deck";
export const OPERATOR_CLARITY_RELEASE = "r166-operator-clarity";
export const STATE_ACCURACY_RELEASE = "r167-authoritative-state-accuracy";
export const SAI_HYBRID_RELEASE = SAI_HYBRID_MOTION_RELEASE;
export const SWARM_COMPUTATION_RELEASE = SWARM_PRECISION_BODY_RELEASE;
export const HETEROGENEOUS_VALIDATION_RELEASE = VALIDATION_OVERLAY_RELEASE_R172;
export const LEGACY_VISUAL_DELIVERY_COMPATIBILITY_ID = "r137-live-visual-delivery";
export const R141_VISUAL_DELIVERY_COMPATIBILITY_ID = "r141-visual-delivery-correctness";
export const R142_VISUAL_GEOMETRY_COMPATIBILITY_ID = "r142-micro-macro-skin-geometry";
export const R143_VISUAL_QUALITY_COMPATIBILITY_ID = "r143-ultra-quality-view";
export const R144_RECOMPOSITION_COMPATIBILITY_ID = "r144-primary-field-recomposition";
export const R145_MODE_ATLAS_COMPATIBILITY_ID = "r145-governed-mode-atlas";
export const R146_UNIFIED_RUNTIME_COMPATIBILITY_ID = "r146-unified-motion-relativity-runtime";
export const R147_CALCULUS_FIELD_COMPATIBILITY_ID = "r147-calculus-field-renderer";
export const R148_MEMORY_COMPATIBILITY_ID = "r148-memory-continuity-graph";
export const R149_INTELLIGENCE_COMPATIBILITY_ID = "r149-intelligence-reasoning-pipeline";
export const R150_CREATE_SIMULATE_COMPATIBILITY_ID = "r150-create-simulate-branch-lab";
export const R151_SOVEREIGN_DEVICES_COMPATIBILITY_ID = "r151-sovereign-devices-compute";
export const R152_EARTH_TRUTH_COMPATIBILITY_ID = "r152-earth-truth-layers";
export const R153_MOBILE_ORCHESTRATION_COMPATIBILITY_ID = "r153-mobile-workspace-orchestration";
export const R154_BUILD_GOVERNANCE_COMPATIBILITY_ID = "r154-build-evolution-governance";
export const R158_MOBILE_FIELD_COMPATIBILITY_ID = "r158-mobile-field-composition";
export const R163_INTERACTIVE_FIELD_COMPATIBILITY_ID = "r163-interactive-living-field";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R172 preserves every inherited visual/state/heartbeat/Earth/build boundary and extends R171 with explicit validation evidence. The operator field distinguishes address capacity, active swarm execution, replica agreement, invariant/identity checks, independent formulations, cross-runtime parity, independent solver families, and external measurement instead of collapsing them into one confidence signal. All 1,728 cell addresses can be rendered, but idle address capacity is not active computation. Planner selection comes only from /api/swarm/autonomic/plan. Redundant solver execution comes only from distinct Durable Object cell receipts. R172 reference validation comes only from /api/validate/reference and remains VALIDATION_RECEIPT_NOT_CANON. R170 cloud computations remain DERIVED and nativeExecution=false, TMM remains reduced-order normal-incidence layered-media screening, scalar-wave FDTD remains non-Maxwell, PC ONLINE remains heartbeat-gated, and 12/144/1728/20736 remain software address/execution-resolution levels rather than physical dimensions.";

/* Historical preservation signatures — NON-EXECUTING compatibility anchors only.
enhanceArchiveRecoveredWorkstation(response)
enhanceIndividualSkinRelativity(rendered)
enhanceUltraQualityView(rendered)
enhanceHighDetail20736Field(rendered)
enhanceLivePhaseVisual(rendered)
*/

async function stampDeliveredVisual(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  const headers = new Headers(response.headers);
  headers.set("x-omega-visual-release", VISUAL_DELIVERY_RELEASE);
  headers.set("x-omega-recovery-release", RECOVERED_EXPERIENCE_RELEASE);
  headers.set("x-omega-field-release", INTERACTIVE_FIELD_RELEASE);
  headers.set("x-omega-field-layer-release", FIELD_LAYER_RELEASE);
  headers.set("x-omega-operator-release", OPERATOR_CLARITY_RELEASE);
  headers.set("x-omega-state-release", STATE_ACCURACY_RELEASE);
  headers.set("x-omega-sai-hybrid-release", SAI_HYBRID_RELEASE);
  headers.set("x-omega-swarm-computation-release", SWARM_COMPUTATION_RELEASE);
  headers.set("x-omega-validation-release", HETEROGENEOUS_VALIDATION_RELEASE);
  headers.set("x-omega-field-contract", "single-renderer+drag-pan+wheel-pinch-zoom+probe+pause-reset+progressive-controls+live-frame-integrity+independent-layer-deck+deduplicated-operator-surface+advanced-tools-drawer+canonical-state-binding+address-phase-semantics+no-synthetic-state-defaults+sai-hybrid-motion-fabric+truth-bound-ai-context+live-1728-address-body+derived-compute-consensus-receipts+heterogeneous-validation-tiers");
  headers.set("x-omega-visual-authority", "presentation-only-beneath-heartbeatTruth");
  headers.set("x-omega-visual-contract", "single-surface+recovered-experience-orchestration+native-20736-atlas+calculus-field+rk2-flow+memory-continuity+intelligence-route-mode-forecast-action-gate+create-simulate-branch-comparison+sovereign-device-heartbeat-truth+earth-observed-derived-forecast-truth+build-evolution-governance+sai-hybrid-ai-context+swarm-reference-computation+validation-evidence-separation+rollback+runtime-truth+integrity-v6");
  if (!type.includes("text/html")) return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  let html = await response.text();
  const meta = `<meta id="omegaVisualDeliveryRelease" name="omega-visual-release" content="${VISUAL_DELIVERY_RELEASE}"><meta id="omegaRecoveredExperienceRelease" name="omega-recovery-release" content="${RECOVERED_EXPERIENCE_RELEASE}"><meta id="omegaInteractiveFieldRelease" name="omega-field-release" content="${INTERACTIVE_FIELD_RELEASE}"><meta id="omegaFieldLayerRelease" name="omega-field-layer-release" content="${FIELD_LAYER_RELEASE}"><meta id="omegaOperatorClarityRelease" name="omega-operator-release" content="${OPERATOR_CLARITY_RELEASE}"><meta id="omegaStateAccuracyRelease" name="omega-state-release" content="${STATE_ACCURACY_RELEASE}"><meta id="omegaSaiHybridRelease" name="omega-sai-hybrid-release" content="${SAI_HYBRID_RELEASE}"><meta id="omegaSwarmComputationRelease" name="omega-swarm-computation-release" content="${SWARM_COMPUTATION_RELEASE}"><meta id="omegaValidationRelease" name="omega-validation-release" content="${HETEROGENEOUS_VALIDATION_RELEASE}">`;
  if (!html.includes("omegaVisualDeliveryRelease")) html = html.includes("</head>") ? html.replace("</head>", meta + "</head>") : meta + html;
  else {
    html = html.replace(/<meta id="omegaVisualDeliveryRelease"[^>]*>/, `<meta id="omegaVisualDeliveryRelease" name="omega-visual-release" content="${VISUAL_DELIVERY_RELEASE}">`);
    const tags = [
      ["omegaRecoveredExperienceRelease", `<meta id="omegaRecoveredExperienceRelease" name="omega-recovery-release" content="${RECOVERED_EXPERIENCE_RELEASE}">`],
      ["omegaInteractiveFieldRelease", `<meta id="omegaInteractiveFieldRelease" name="omega-field-release" content="${INTERACTIVE_FIELD_RELEASE}">`],
      ["omegaFieldLayerRelease", `<meta id="omegaFieldLayerRelease" name="omega-field-layer-release" content="${FIELD_LAYER_RELEASE}">`],
      ["omegaOperatorClarityRelease", `<meta id="omegaOperatorClarityRelease" name="omega-operator-release" content="${OPERATOR_CLARITY_RELEASE}">`],
      ["omegaStateAccuracyRelease", `<meta id="omegaStateAccuracyRelease" name="omega-state-release" content="${STATE_ACCURACY_RELEASE}">`],
      ["omegaSaiHybridRelease", `<meta id="omegaSaiHybridRelease" name="omega-sai-hybrid-release" content="${SAI_HYBRID_RELEASE}">`],
      ["omegaSwarmComputationRelease", `<meta id="omegaSwarmComputationRelease" name="omega-swarm-computation-release" content="${SWARM_COMPUTATION_RELEASE}">`],
      ["omegaValidationRelease", `<meta id="omegaValidationRelease" name="omega-validation-release" content="${HETEROGENEOUS_VALIDATION_RELEASE}">`],
    ] as const;
    for (const [id, tag] of tags) if (!html.includes(id)) html = html.replace("</head>", tag + "</head>");
  }
  if (html.includes("data-omega-visual-release=")) html = html.replace(/data-omega-visual-release="[^"]*"/, `data-omega-visual-release="${VISUAL_DELIVERY_RELEASE}"`);
  else html = html.replace("<html", `<html data-omega-visual-release="${VISUAL_DELIVERY_RELEASE}"`);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export async function enhanceVirtualLatticeDisplay(response: Response): Promise<Response> {
  let rendered = await enhanceRootSovereignField(response);
  rendered = await enhanceGovernedModeAtlas(rendered);
  rendered = await enhanceUnifiedMotionRelativity(rendered);
  rendered = await enhanceMemoryContinuityGraph(rendered);
  rendered = await enhanceIntelligenceReasoningPipeline(rendered);
  rendered = await enhanceCreateSimulateBranchLab(rendered);
  rendered = await enhanceSovereignDevicesCompute(rendered);
  rendered = await enhanceEarthTruthLayers(rendered);
  rendered = await enhanceBuildEvolutionGovernance(rendered);
  rendered = await enhanceArchiveRecoveredWorkstation(rendered);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  rendered = await enhanceVisualRuntimeIntegrity(rendered);
  rendered = await enhanceRecoveredExperience(rendered);
  rendered = await enhanceSaiHybridComputeField(rendered);
  rendered = await enhanceSwarmPrecisionBodyR171(rendered);
  rendered = await enhanceValidationOverlayR172(rendered);
  return stampDeliveredVisual(rendered);
}
