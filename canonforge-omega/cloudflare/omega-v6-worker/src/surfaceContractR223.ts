import { enhanceMenuTruthR214 } from "./menuTruthR214";
import { UNIVERSAL_WORKSPACE_RELEASE_R193, enhanceUniversalWorkspaceR193 } from "./universalWorkspaceR193";
import {
  NAVIGATION_INTEGRITY_RELEASE_R215,
  NAVIGATION_POLISH_RELEASE_R214,
  enhanceOneSystemNavigationR195,
} from "./system/oneSystemNavigationR195";

export const FINAL_SURFACE_CONTRACT_RELEASE_R223 = "r223-final-universal-surface-contract";

async function contains(response: Response, marker: string): Promise<boolean> {
  return (await response.clone().text()).includes(marker);
}

/**
 * Final structural normalizer for every HTML surface.
 *
 * R193/R214/R215 remain the owners of the rail, submenu and palette behavior. R223 does
 * not duplicate those implementations: it re-runs their idempotent enhancers only when
 * a predecessor/standalone HTML route escaped one of the shared layers. R216 remains
 * the live authority interlock; this function runs on the already R216-bound response.
 */
export async function enhanceFinalSurfaceContractR223(response: Response): Promise<Response> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  let current = response;
  if (!await contains(current, 'id="omegaR193Rail"')) current = await enhanceUniversalWorkspaceR193(current, "/");
  if (!await contains(current, 'id="omegaR214ControlMenu"') || !await contains(current, 'id="omegaNavigationIntegrityR215Runtime"')) {
    current = await enhanceOneSystemNavigationR195(current, "/");
  }
  if (!await contains(current, 'id="omegaMenuTruthR214Runtime"')) current = await enhanceMenuTruthR214(current);

  let html = await current.text();
  const markers = {
    workspace: html.includes('id="omegaR193Rail"'),
    submenu: html.includes('id="omegaR214ControlMenu"'),
    palette: html.includes('id="omegaNavigationIntegrityR215Runtime"'),
    menuTruth: html.includes('id="omegaMenuTruthR214Runtime"'),
    binding: html.includes('id="omegaSurfaceBindingIntegrityR216Runtime"'),
  };
  const complete = Object.values(markers).every(Boolean);

  if (!html.includes('id="omegaFinalSurfaceContractR223"')) {
    const meta = `<meta id="omegaFinalSurfaceContractR223" name="omega-final-surface-contract" content="${FINAL_SURFACE_CONTRACT_RELEASE_R223}">`;
    html = html.includes("</head>") ? html.replace("</head>", meta + "</head>") : meta + html;
  }

  const headers = new Headers(current.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-surface-contract", FINAL_SURFACE_CONTRACT_RELEASE_R223);
  headers.set("x-omega-surface-contract-state", complete ? "COMPLETE" : "INCOMPLETE");
  if (markers.workspace) headers.set("x-omega-workspace", UNIVERSAL_WORKSPACE_RELEASE_R193);
  if (markers.submenu) headers.set("x-omega-navigation-polish", NAVIGATION_POLISH_RELEASE_R214);
  if (markers.palette) headers.set("x-omega-navigation-integrity", NAVIGATION_INTEGRITY_RELEASE_R215);
  return new Response(html, { status: current.status, statusText: current.statusText, headers });
}
