export const ONE_SYSTEM_NAVIGATION_RELEASE_R194 = "r194-drive-corpus-one-system";

export async function enhanceOneSystemNavigationR194(response: Response, pathname: string): Promise<Response> {
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html")) return response;
  let html=await response.text();
  if(!html.includes('id="omegaR193Rail"')||html.includes('data-r194-one-system="true"')) return new Response(html,{status:response.status,headers:response.headers});
  const active=pathname==="/system"||pathname.startsWith("/system/")?" active":"";
  const item=`<a data-r194-one-system="true" class="r193Item${active}" href="/system"><span class="r193Icon">Ω1</span><span class="r193Label"><b>ONE SYSTEM</b><small>Drive corpus · calculus · execution · proof</small></span></a>`;
  html=html.replace('<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>',`<section class="r193Section"><div class="r193SectionTitle"><span>SYSTEMS</span></div>${item}`);
  const headers=new Headers(response.headers);
  headers.set("cache-control","no-store");
  headers.set("x-omega-one-system",ONE_SYSTEM_NAVIGATION_RELEASE_R194);
  return new Response(html,{status:response.status,headers});
}
