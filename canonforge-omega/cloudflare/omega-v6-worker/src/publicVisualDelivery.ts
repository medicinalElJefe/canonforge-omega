import heartbeatTruth, { OmegaRuntime } from "./heartbeatTruth";
import { enhanceArchiveRecoveredWorkstation } from "./archiveRecoveredWorkstation";
import { enhanceVirtualLatticeDisplay } from "./virtualLatticeDisplay";
import { enhanceLivePhaseVisual } from "./livePhaseVisual";

export { OmegaRuntime };

export const PUBLIC_VISUAL_DELIVERY_ID = "r137-live-visual-delivery";
export const PUBLIC_VISUAL_DELIVERY_BOUNDARY =
  "R137 is a delivery wrapper over heartbeatTruth. It may transform eligible V6 HTML for visualization only; heartbeat truth, OmegaRuntime Durable Object authority, Genesis role separation, API contracts, Earth/source boundaries, route-before-generation, proof/rollback, and execution authority remain owned by the established runtime underneath it.";

function withDeliveryHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("x-omega-visual-release", PUBLIC_VISUAL_DELIVERY_ID);
  headers.set("x-omega-visual-authority", "presentation-only-over-heartbeatTruth");
  const type = headers.get("content-type") || "";
  if (type.includes("text/html")) headers.set("cache-control", "no-store, no-cache, must-revalidate");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function stampHtml(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return withDeliveryHeaders(response);
  let html = await response.text();
  if (!html.includes("omegaVisualDeliveryRelease")) {
    const meta = `<meta id="omegaVisualDeliveryRelease" name="omega-visual-release" content="${PUBLIC_VISUAL_DELIVERY_ID}">`;
    html = html.includes("</head>") ? html.replace("</head>", meta + "</head>") : meta + html;
    html = html.replace("<html", `<html data-omega-visual-release="${PUBLIC_VISUAL_DELIVERY_ID}"`);
    if (html.includes('id="omegaLivePhaseVisualRail"')) {
      html = html.replace('id="omegaLivePhaseVisualRail"', `id="omegaLivePhaseVisualRail" data-release="${PUBLIC_VISUAL_DELIVERY_ID}"`);
    } else if (html.includes('id="omegaLivePhaseRail"')) {
      html = html.replace('id="omegaLivePhaseRail"', `id="omegaLivePhaseRail" data-release="${PUBLIC_VISUAL_DELIVERY_ID}"`);
    }
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store, no-cache, must-revalidate");
  headers.set("x-omega-visual-release", PUBLIC_VISUAL_DELIVERY_ID);
  headers.set("x-omega-visual-authority", "presentation-only-over-heartbeatTruth");
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const base = await heartbeatTruth.fetch(request, env);
    if (request.method !== "GET") return withDeliveryHeaders(base);
    const type = base.headers.get("content-type") || "";
    if (!type.includes("text/html")) return withDeliveryHeaders(base);

    // Delivery order matters. Recover the archive workstation first so the
    // virtual 12^10 lattice has a real workstation viewport to bind into;
    // then apply the live phase/dimensional-relativity layer last so it sees
    // the completed visual DOM. All three remain presentation/model lenses.
    let response = await enhanceArchiveRecoveredWorkstation(base);
    response = await enhanceVirtualLatticeDisplay(response);
    response = await enhanceLivePhaseVisual(response);
    return stampHtml(response);
  },
};
