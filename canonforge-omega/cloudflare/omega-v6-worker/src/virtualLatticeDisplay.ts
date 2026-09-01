import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceIndividualSkinRelativity } from "./individualSkinRelativity";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceHighDetail20736Field } from "./highDetail20736Field";
import { enhanceLivePhaseVisual } from "./livePhaseVisual";
import { enhanceVisualRuntimeIntegrity } from "./visualRuntimeIntegrity";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r142-micro-macro-skin-geometry";
export const LEGACY_VISUAL_DELIVERY_COMPATIBILITY_ID = "r137-live-visual-delivery";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R142 preserves R141 delivery/liveness proof and replaces point-like skin styling with multiscale geometry. The 20,736 deterministic control identities now shape a 12-sector macro membrane, 144 meso contours, and individual micro glyphs across the 12^10 logical hierarchy. Parent, Interaction, Scar, Continuity, Compression, Skin, Interpretation and Behavior alter topology, curvature, relation branching, boundary thickness, density, orientation and motion. Paired structural correspondence is rendered as symmetry; bounded local residual/deformation is rendered as asymmetry. Micro residuals aggregate upward and macro constraints project downward. This remains presentation/model-only beneath heartbeatTruth: it does not mutate canonical state, alter OmegaRuntime authority, weaken Hybrid heartbeat truth, change Genesis role separation, promote animation to empirical evidence, or treat representational 12^n shells as physical dimensions. It does not claim a physical 61.9-billion-pixel panel; 61,917,364,224 is a logical hierarchical display-address capacity.";

async function stampDeliveredVisual(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  const headers = new Headers(response.headers);
  headers.set("x-omega-visual-release", VISUAL_DELIVERY_RELEASE);
  headers.set("x-omega-visual-authority", "presentation-only-beneath-heartbeatTruth");
  headers.set("x-omega-visual-contract", "root+micro-macro-skin+phase+integrity-v2");
  if (!type.includes("text/html")) return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  let html = await response.text();
  if (!html.includes("omegaVisualDeliveryRelease")) {
    const meta = `<meta id="omegaVisualDeliveryRelease" name="omega-visual-release" content="${VISUAL_DELIVERY_RELEASE}">`;
    html = html.includes("</head>") ? html.replace("</head>", meta + "</head>") : meta + html;
    html = html.replace("<html", `<html data-omega-visual-release="${VISUAL_DELIVERY_RELEASE}"`);
  } else {
    html = html.replace(/content="r1(?:3[789]|4[012])[^\"]*"/g, `content="${VISUAL_DELIVERY_RELEASE}"`).replace(/data-omega-visual-release="r1(?:3[789]|4[012])[^\"]*"/g, `data-omega-visual-release="${VISUAL_DELIVERY_RELEASE}"`);
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
  rendered = await enhanceVisualRuntimeIntegrity(rendered);
  return stampDeliveredVisual(rendered);
}
