import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceGovernedModeAtlas } from "./governedModeAtlas";
import { enhanceUnifiedMotionRelativity } from "./unifiedMotionRelativity";
import { enhanceMemoryContinuityGraph } from "./memoryContinuityGraph";
import { enhanceIntelligenceReasoningPipeline } from "./intelligenceReasoningPipeline";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceVisualRuntimeIntegrity } from "./visualRuntimeIntegrity";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r149-intelligence-reasoning-pipeline";
export const LEGACY_VISUAL_DELIVERY_COMPATIBILITY_ID = "r137-live-visual-delivery";
export const R141_VISUAL_DELIVERY_COMPATIBILITY_ID = "r141-visual-delivery-correctness";
export const R142_VISUAL_GEOMETRY_COMPATIBILITY_ID = "r142-micro-macro-skin-geometry";
export const R143_VISUAL_QUALITY_COMPATIBILITY_ID = "r143-ultra-quality-view";
export const R144_RECOMPOSITION_COMPATIBILITY_ID = "r144-primary-field-recomposition";
export const R145_MODE_ATLAS_COMPATIBILITY_ID = "r145-governed-mode-atlas";
export const R146_UNIFIED_RUNTIME_COMPATIBILITY_ID = "r146-unified-motion-relativity-runtime";
export const R147_CALCULUS_FIELD_COMPATIBILITY_ID = "r147-calculus-field-renderer";
export const R148_MEMORY_COMPATIBILITY_ID = "r148-memory-continuity-graph";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R149 adds an inspectable Intelligence route-to-generation workspace over the established R148 Memory, R147 calculus field and native 20,736 atlas. The preserved R147 field contract includes scalar potential, finite-difference gradient, Hessian/Laplacian curvature, derived vector flow and RK2 integral trajectories. Intelligence reads the existing /api/omega/state authority and /api/route-preview contract, exposes governed mode, bounded forecast, proposed action and generation admission before /api/chat can run, and preserves route-before-generation. Runtime observations remain distinct from DERIVED_FRAMEWORK_MATH, SIMULATED_CONTINUATION, MODEL_OUTPUT and USER_DEFINED_MODEL geometry; UTC render time is not evidence time. It does not mutate canonical state beneath heartbeatTruth, preserves OmegaRuntime and Hybrid/Genesis authority boundaries, preserves representational 12^n shells, preserves the R143 device-DPR 3 quality contract as a compatibility capability, does not claim a physical 61.9-billion-pixel panel, and does not claim physical 20,736 dimensions.";

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
  headers.set("x-omega-visual-contract", "single-surface+native-20736-atlas+calculus-field+rk2-flow+memory-continuity+intelligence-route-mode-forecast-action-gate+runtime-truth+integrity-v6");
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
  rendered = await enhanceArchiveRecoveredWorkstation(rendered);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  // Historical R137/R141 position anchor only; deliberately not executed:
  // enhanceLivePhaseVisual(rendered)
  rendered = await enhanceVisualRuntimeIntegrity(rendered);
  return stampDeliveredVisual(rendered);
}
