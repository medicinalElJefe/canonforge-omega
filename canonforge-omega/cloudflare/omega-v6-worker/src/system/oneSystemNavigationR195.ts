import { EVIDENCE_PLANE_RELEASE_R194 } from "../evidencePlaneR194";

export const ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system";

export async function enhanceOneSystemNavigationR195(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes('id="omegaR193Rail"') || html.includes('data-r195-one-system="true"')) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
  const active = pathname === "/system" || pathname.startsWith("/system/") ? " active" : "";
  const item = `<a data-r195-one-system="true" data-predecessor="${EVIDENCE_PLANE_RELEASE_R194}" class="r193Item${active}" href="/system"><span class="r193Icon">Ω1</span><span class="r193Label"><b>ONE SYSTEM</b><small>Drive corpus · calculus · execution state · proof</small></span></a>`;
  html = html.replace('<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>', `<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>${item}`);
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-one-system", ONE_SYSTEM_NAVIGATION_RELEASE_R195);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
