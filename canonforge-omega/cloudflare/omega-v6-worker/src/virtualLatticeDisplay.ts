import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceVisualRuntimeIntegrity } from "./visualRuntimeIntegrity";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r144-primary-field-recomposition";
export const LEGACY_VISUAL_DELIVERY_COMPATIBILITY_ID = "r137-live-visual-delivery";
export const R141_VISUAL_DELIVERY_COMPATIBILITY_ID = "r141-visual-delivery-correctness";
export const R142_VISUAL_GEOMETRY_COMPATIBILITY_ID = "r142-micro-macro-skin-geometry";
export const R143_VISUAL_QUALITY_COMPATIBILITY_ID = "r143-ultra-quality-view";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R144 removes the accumulated full-screen presentation overlays from the primary Living Field. The primary view is recomposed from the root sovereign field, the recovered functional workstation, the virtual lattice instrument and runtime-integrity proof only. Micro/macro skin, high-detail 20,736 control rendering, live-phase and ultra-quality renderers remain preserved as specialist capabilities but are not composited over the primary workspace. This restores view/information/visualization separation and does not mutate canonical state beneath heartbeatTruth. It preserves representational 12^n shells and does not claim a physical 61.9-billion-pixel panel; 20,736 and 61,917,364,224 remain software/model address spaces, not physical dimensions or physical pixels.";

/*
Historical preservation signatures — NON-EXECUTING compatibility anchors only.
They preserve R137/R140/R141/R143 capability identity while R144 intentionally keeps
these full-screen renderers out of the primary Living Field composition.

enhanceArchiveRecoveredWorkstation(response)
enhanceIndividualSkinRelativity(rendered)
enhanceLivePhaseVisual(rendered)
enhanceUltraQualityView(rendered)
enhanceHighDetail20736Field(rendered)
*/

async function stampDeliveredVisual(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  const headers = new Headers(response.headers);
  headers.set("x-omega-visual-release", VISUAL_DELIVERY_RELEASE);
  headers.set("x-omega-visual-authority", "presentation-only-beneath-heartbeatTruth");
  headers.set("x-omega-visual-contract", "recomposed-primary-field+workstation+lattice+integrity-v4");
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
  // R144 primary Living Field: one composed workspace, not a stack of canvases.
  let rendered = await enhanceRootSovereignField(response);
  rendered = await enhanceArchiveRecoveredWorkstation(rendered);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  rendered = await enhanceVisualRuntimeIntegrity(rendered);
  return stampDeliveredVisual(rendered);
}
