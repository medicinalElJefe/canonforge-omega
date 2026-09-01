import { enhanceRootSovereignField } from "./rootSovereignField";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceHighDetail20736Field } from "./highDetail20736Field";
import { enhanceLivePhaseVisual } from "./livePhaseVisual";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r139-root-sovereign-field";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R139 makes the root Field workspace receive a dominant UTC-synchronized 20,736-coordinate visual field before legacy/specialist lenses are considered, then preserves archive workstation, virtual lattice/light mandala, adaptive high-detail field and live phase rendering where their DOM contracts exist. This wrapper is presentation/model-only: it does not mutate canonical state, alter OmegaRuntime authority, weaken Hybrid heartbeat truth, change Genesis role separation, promote evidence, or treat representational 12^n shells as physical dimensions. The virtual lattice does not claim a physical 61.9-billion-pixel panel; 61,917,364,224 is a logical hierarchical display-address capacity rendered through bounded adaptive visible sampling.";

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
    html = html.replace(/content="r13[78][^"]*"/g, `content="${VISUAL_DELIVERY_RELEASE}"`).replace(/data-omega-visual-release="r13[78][^"]*"/g, `data-omega-visual-release="${VISUAL_DELIVERY_RELEASE}"`);
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export async function enhanceVirtualLatticeDisplay(response: Response): Promise<Response> {
  // Root visual delivery must not depend on the specialist hdInstrument DOM.
  // The root sovereign field is therefore applied first. Archive/high-detail
  // specialist lenses remain bounded enhancements when their workstation exists.
  let rendered = await enhanceRootSovereignField(response);
  rendered = await enhanceArchiveRecoveredWorkstation(rendered);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  rendered = await enhanceHighDetail20736Field(rendered);
  rendered = await enhanceLivePhaseVisual(rendered);
  return stampDeliveredVisual(rendered);
}
