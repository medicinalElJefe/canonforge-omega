import { enhanceMenuTruthR214 } from "./menuTruthR214";
import { UNIVERSAL_WORKSPACE_RELEASE_R193, enhanceUniversalWorkspaceR193 } from "./universalWorkspaceR193";
import {
  NAVIGATION_INTEGRITY_RELEASE_R215,
  NAVIGATION_POLISH_RELEASE_R214,
  enhanceOneSystemNavigationR195,
} from "./system/oneSystemNavigationR195";

export const FINAL_SURFACE_CONTRACT_RELEASE_R223 = "r223-final-universal-surface-contract";

const ROUTE_CONTEXT = `<script id="omegaFinalSurfaceRouteContextR223">(()=>{
if(document.documentElement.dataset.omegaFinalRouteContextR223)return;document.documentElement.dataset.omegaFinalRouteContextR223='r223';
const here=new URL(location.href);const key=u=>u.pathname+(u.search||'');const hereKey=key(here);document.body.dataset.omegaSurfaceHref=hereKey;
function matches(a){try{const u=new URL(a.href,location.origin);const app=u.searchParams.get('app');if(app)return here.pathname==='/'&&here.searchParams.get('app')===app&&(u.searchParams.get('mode')?here.searchParams.get('mode')===u.searchParams.get('mode'):true);return here.pathname===u.pathname||((u.pathname!=='/')&&here.pathname.startsWith(u.pathname+'/'));}catch{return false}}
for(const a of document.querySelectorAll('#omegaR193Rail a[href]')){a.classList.toggle('active',matches(a));if(matches(a))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
for(const a of document.querySelectorAll('#omegaR214ControlMenu a[href]')){a.classList.toggle('current',matches(a));if(matches(a))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
window.dispatchEvent(new CustomEvent('omega:r223-surface-route-context',{detail:{href:hereKey}}));
})();</script>`;

function responseFrom(html: string, source: Response, headers: Headers): Response {
  return new Response(html, { status: source.status, statusText: source.statusText, headers });
}

/**
 * Final structural normalizer for every HTML surface.
 *
 * Fast path: read the HTML once, verify all predecessor markers, stamp the final contract,
 * and return. Repair path: replay only a missing idempotent predecessor enhancer. The final
 * browser-side route-context pass then derives the active workspace/system from location,
 * so standalone legacy pages do not inherit the synthetic "/" repair context.
 */
export async function enhanceFinalSurfaceContractR223(response: Response): Promise<Response> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  let html = await response.text();
  let headers = new Headers(response.headers);

  if (!html.includes('id="omegaR193Rail"')) {
    const repaired = await enhanceUniversalWorkspaceR193(responseFrom(html, response, headers), "/");
    headers = new Headers(repaired.headers);
    html = await repaired.text();
  }
  if (!html.includes('id="omegaR214ControlMenu"') || !html.includes('id="omegaNavigationIntegrityR215Runtime"')) {
    const repaired = await enhanceOneSystemNavigationR195(responseFrom(html, response, headers), "/");
    headers = new Headers(repaired.headers);
    html = await repaired.text();
  }
  if (!html.includes('id="omegaMenuTruthR214Runtime"')) {
    const repaired = await enhanceMenuTruthR214(responseFrom(html, response, headers));
    headers = new Headers(repaired.headers);
    html = await repaired.text();
  }

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
  if (!html.includes('id="omegaFinalSurfaceRouteContextR223"')) {
    html = html.includes("</body>") ? html.replace("</body>", ROUTE_CONTEXT + "</body>") : html + ROUTE_CONTEXT;
  }

  headers.set("cache-control", "no-store");
  headers.set("x-omega-surface-contract", FINAL_SURFACE_CONTRACT_RELEASE_R223);
  headers.set("x-omega-surface-contract-state", complete ? "COMPLETE" : "INCOMPLETE");
  headers.set("x-omega-surface-route-context", "client-location-exact");
  if (markers.workspace) headers.set("x-omega-workspace", UNIVERSAL_WORKSPACE_RELEASE_R193);
  if (markers.submenu) headers.set("x-omega-navigation-polish", NAVIGATION_POLISH_RELEASE_R214);
  if (markers.palette) headers.set("x-omega-navigation-integrity", NAVIGATION_INTEGRITY_RELEASE_R215);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
