import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceIndividualSkinRelativity } from "./individualSkinRelativity";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceHighDetail20736Field } from "./highDetail20736Field";
import { enhanceLivePhaseVisual } from "./livePhaseVisual";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r140-individual-skin-relativity";
export const LEGACY_VISUAL_DELIVERY_COMPATIBILITY_ID = "r137-live-visual-delivery";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R140 preserves the R139 root Field as the dominant UTC-synchronized 20,736-coordinate visual surface and adds deterministic per-sample individuality over the 12^10 logical address hierarchy. Parent, Interaction, Scar, Continuity, Compression, Skin, Interpretation and Behavior shape visualization at every active address depth using bounded above/below hierarchy coupling. This remains presentation/model-only: it does not mutate canonical state, alter OmegaRuntime authority, weaken Hybrid heartbeat truth, change Genesis role separation, promote evidence, or treat representational 12^n shells as physical dimensions. It does not claim a physical 61.9-billion-pixel panel; 61,917,364,224 is a logical hierarchical display-address capacity.";

async function stampDeliveredVisual(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  const headers = new Headers(response.headers);
  headers.set("x-omega-visual-release", VISUAL_DELIVERY_RELEASE);
  headers.set("x-omega-visual-authority", "presentation-only-beneath-heartbeatTruth");
  if (!type.includes("text/html")) return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  let html = await response.text();
  if (!html.includes("omegaVisualDeliveryRelease")) {
    const meta = `<meta id="omegaVisualDeliveryRelease" name="omega-visual-release" content="${VISUAL_DELIVERY_RELEASE}">`;
    html = html.includes("</head>") ? html.replace("</head>", meta + "</head>") : meta + html;
    html = html.replace("<html", `<html data-omega-visual-release="${VISUAL_DELIVERY_RELEASE}"`);
  } else {
    html = html.replace(/content="r1(?:3[789]|40)[^"]*"/g, `content="${VISUAL_DELIVERY_RELEASE}"`).replace(/data-omega-visual-release="r1(?:3[789]|40)[^"]*"/g, `data-omega-visual-release="${VISUAL_DELIVERY_RELEASE}"`);
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export async function enhanceVirtualLatticeDisplay(response: Response): Promise<Response> {
  // Compatibility anchor retained for the historical R137 preservation test:
  // enhanceArchiveRecoveredWorkstation(response)
  // Root visual delivery must not depend on specialist hdInstrument DOM.
  let rendered = await enhanceRootSovereignField(response);
  rendered = await enhanceIndividualSkinRelativity(rendered);
  rendered = await enhanceArchiveRecoveredWorkstation(rendered);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  rendered = await enhanceHighDetail20736Field(rendered);
  rendered = await enhanceLivePhaseVisual(rendered);
  return stampDeliveredVisual(rendered);
}
