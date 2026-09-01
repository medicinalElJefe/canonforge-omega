import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceLivePhaseVisual } from "./livePhaseVisual";
import { enhanceVirtualLatticeDisplay as enhanceVirtualLatticeDisplayCore } from "./virtualLatticeDisplayCore";

export { VIRTUAL_LATTICE_BOUNDARY } from "./virtualLatticeDisplayCore";

export const VISUAL_DELIVERY_RELEASE = "r137-live-visual-delivery";
export const VIRTUAL_DISPLAY_CAPACITY_LABEL = "61,917,364,224";
export const VISUAL_DELIVERY_BOUNDARY =
  "R137 composes archive workstation, virtual lattice/light mandala and live phase/time rendering beneath the established heartbeatTruth -> sovereignVisualShell path. This wrapper is presentation/model-only: it does not mutate canonical state, alter OmegaRuntime authority, weaken Hybrid heartbeat truth, change Genesis role separation, promote evidence, or treat representational 12^n shells as physical dimensions.";

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
  }
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export async function enhanceVirtualLatticeDisplay(response: Response): Promise<Response> {
  // Ordering is intentional and non-commutative. The archive workstation must
  // exist before the 12^10 lattice can bind to its viewport; the live phase
  // layer is applied last so its time/phase/shell readout sees the completed
  // visual DOM. All computation remains a visualization lens over one packet.
  let rendered = await enhanceArchiveRecoveredWorkstation(response);
  rendered = await enhanceVirtualLatticeDisplayCore(rendered);
  rendered = await enhanceLivePhaseVisual(rendered);
  return stampDeliveredVisual(rendered);
}
