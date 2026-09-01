import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceGovernedModeAtlas } from "./governedModeAtlas";
import { enhanceUnifiedMotionRelativity } from "./unifiedMotionRelativity";
import { enhanceMemoryContinuityGraph } from "./memoryContinuityGraph";
import { enhanceIntelligenceReasoningPipeline } from "./intelligenceReasoningPipeline";
import { enhanceCreateSimulateBranchLab } from "./createSimulateBranchLab";
import { enhanceSovereignDevicesCompute } from "./sovereignDevicesCompute";
import { enhanceEarthTruthLayers } from "./earthTruthLayers";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceVisualRuntimeIntegrity } from "./visualRuntimeIntegrity";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r152-earth-truth-layers";
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
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R152 adds a source-bound Earth truth lens over the established R151 Sovereign Devices/Compute, R150 Create/Simulate, R149 Intelligence, R148 Memory, R147 calculus field and native 20,736 atlas. Earth OBSERVED_SOURCE identities come only from /api/earth/catalog; DERIVED_FRAMEWORK_MATH relations are computed from those observed identities but never promoted to source evidence; FORECAST_PROJECTION requires both the Earth catalog and canonical /api/omega/state and remains model continuation, never observation. Missing geospatial coordinates are never invented. The visual layer does not mutate canonical state or Earth source data. PC ONLINE remains rendered only when the protected heartbeatTruth contract itself reports pc_online=true. The preserved R147 field contract includes scalar potential, finite-difference gradient, Hessian/Laplacian curvature, derived vector flow and RK2 integral trajectories. Runtime observations remain distinct from DERIVED_FRAMEWORK_MATH, SIMULATED_CONTINUATION, FORECAST_PROJECTION, MODEL_OUTPUT and USER_DEFINED_MODEL geometry; UTC render time is not evidence time. It preserves route-before-generation, heartbeatTruth, OmegaRuntime and Hybrid/Genesis authority boundaries, preserves representational 12^n shells, preserves the R143 device-DPR 3 quality contract as a compatibility capability, does not claim a physical 61.9-billion-pixel panel, and does not claim physical 20,736 dimensions.";

/* Historical preservation signatures — NON-EXECUTING compatibility anchors only.
enhanceArchiveRecoveredWorkstation(response)
enhanceIndividualSkinRelativity(rendered)
enhanceUltraQualityView(rendered)
enhanceHighDetail20736Field(rendered)
*/

async function stampDeliveredVisual(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  const headers = new Headers(response.headers);
  headers.set("x-omega-visual-release", VISUAL_DELIVERY_RELEASE);
  headers.set("x-omega-visual-authority", "presentation-only-beneath-heartbeatTruth");
  headers.set("x-omega-visual-contract", "single-surface+native-20736-atlas+calculus-field+rk2-flow+memory-continuity+intelligence-route-mode-forecast-action-gate+create-simulate-branch-comparison+sovereign-device-heartbeat-truth+earth-observed-derived-forecast-truth+rollback+runtime-truth+integrity-v6");
  if (!type.includes("text/html")) return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  let html = await response.text();
  const meta = `<meta id="omegaVisualDeliveryRelease" name="omega-visual-release" content="${VISUAL_DELIVERY_RELEASE}">`;
  if (!html.includes("omegaVisualDeliveryRelease")) html = html.includes("</head>") ? html.replace("</head>", meta + "</head>") : meta + html;
  else html = html.replace(/<meta id="omegaVisualDeliveryRelease"[^>]*>/, meta);
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
  rendered = await enhanceArchiveRecoveredWorkstation(rendered);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  // Historical R137/R141 position anchor only; deliberately not executed:
  // enhanceLivePhaseVisual(rendered)
  rendered = await enhanceVisualRuntimeIntegrity(rendered);
  return stampDeliveredVisual(rendered);
}
