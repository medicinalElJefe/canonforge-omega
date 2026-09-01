import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceGovernedModeAtlas } from "./governedModeAtlas";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceVisualRuntimeIntegrity } from "./visualRuntimeIntegrity";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r145-governed-mode-atlas";
export const LEGACY_VISUAL_DELIVERY_COMPATIBILITY_ID = "r137-live-visual-delivery";
export const R141_VISUAL_DELIVERY_COMPATIBILITY_ID = "r141-visual-delivery-correctness";
export const R142_VISUAL_GEOMETRY_COMPATIBILITY_ID = "r142-micro-macro-skin-geometry";
export const R143_VISUAL_QUALITY_COMPATIBILITY_ID = "r143-ultra-quality-view";
export const R144_RECOMPOSITION_COMPATIBILITY_ID = "r144-primary-field-recomposition";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R145 keeps the R144 single-workspace correction and makes the primary visual a governed 20,736 state-atlas projection deck. One current packet is re-projected by Full Overall Canon, Mode 188, Unified Coherence, Forecast, Full Sphere, Relational Skin, Dewey Calculus and the other governed mode operators. The primary workspace uses one visible atlas canvas rather than stacked visual overlays. Live UTC and convergence observations are kept distinct from USER_DEFINED_MODEL geometry. It does not mutate canonical state beneath heartbeatTruth, preserves representational 12^n shells, and does not claim a physical 61.9-billion-pixel panel. R143's device-DPR 3 compositor and other historical visual capabilities remain preserved as specialist code, not primary overlays.";

/*
Historical preservation signatures — NON-EXECUTING compatibility anchors only.
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
  headers.set("x-omega-visual-contract", "single-surface+governed-mode-atlas+runtime-truth+integrity-v5");
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
  rendered = await enhanceArchiveRecoveredWorkstation(rendered);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  // Historical R137/R141 position anchor only; deliberately not executed:
  // enhanceLivePhaseVisual(rendered)
  rendered = await enhanceVisualRuntimeIntegrity(rendered);
  return stampDeliveredVisual(rendered);
}
