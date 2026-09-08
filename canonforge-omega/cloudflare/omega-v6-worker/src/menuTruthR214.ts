export const MENU_TRUTH_RELEASE_R214 = "r214-live-menu-route-truth";

export type MenuTruthItem = {
  id: string;
  label: string;
  href: string;
  kind: "WORKSPACE" | "SYSTEM";
  declaredAuthority: string;
};

export const MENU_TRUTH_ITEMS_R214: MenuTruthItem[] = [
  { id: "workspace-field", label: "Field", href: "/?app=Field", kind: "WORKSPACE", declaredAuthority: "R193_WORKSPACE_COMPOSER" },
  { id: "workspace-calculus", label: "Calculus", href: "/?app=Calculus&mode=dewey-calculus", kind: "WORKSPACE", declaredAuthority: "R193_WORKSPACE_COMPOSER_PLUS_R196_CALIBRATION" },
  { id: "workspace-memory", label: "Memory", href: "/?app=Memory", kind: "WORKSPACE", declaredAuthority: "R193_WORKSPACE_COMPOSER" },
  { id: "workspace-simulate", label: "Simulate", href: "/?app=Simulate", kind: "WORKSPACE", declaredAuthority: "R193_WORKSPACE_COMPOSER" },
  { id: "workspace-earth", label: "Earth", href: "/?app=Earth", kind: "WORKSPACE", declaredAuthority: "R193_PLUS_R198_PLUS_R214_SPATIAL_EVIDENCE" },
  { id: "workspace-assistant", label: "Assistant", href: "/?app=Assistant", kind: "WORKSPACE", declaredAuthority: "R193_WORKSPACE_COMPOSER_PLUS_R179_INTELLIGENCE" },
  { id: "workspace-hybrid", label: "Hybrid", href: "/?app=Hybrid", kind: "WORKSPACE", declaredAuthority: "R193_WORKSPACE_COMPOSER_PLUS_R203_R205_HYBRID" },
  { id: "workspace-proof", label: "Proof", href: "/?app=Proof", kind: "WORKSPACE", declaredAuthority: "R193_WORKSPACE_COMPOSER_PLUS_R194_EVIDENCE" },
  { id: "system-workbench", label: "Workbench", href: "/workbench", kind: "SYSTEM", declaredAuthority: "CANONICAL_RUNTIME_PAGE" },
  { id: "system-relations", label: "Relations", href: "/relations", kind: "SYSTEM", declaredAuthority: "CANONICAL_RUNTIME_PAGE" },
  { id: "system-calibration", label: "Calibration", href: "/calibration", kind: "SYSTEM", declaredAuthority: "R196_OR_CANONICAL_RUNTIME_PAGE" },
  { id: "system-capabilities", label: "Capabilities", href: "/capabilities", kind: "SYSTEM", declaredAuthority: "CAPABILITY_ROUTER_OR_CANONICAL_RUNTIME_PAGE" },
  { id: "system-core", label: "Core", href: "/core", kind: "SYSTEM", declaredAuthority: "CANONICAL_RUNTIME_PAGE" },
  { id: "system-sai", label: "SAI", href: "/sai", kind: "SYSTEM", declaredAuthority: "R179_SAI_LAB" },
  { id: "system-compute", label: "Compute", href: "/compute", kind: "SYSTEM", declaredAuthority: "R170_COMPUTE_LAB" },
  { id: "system-validate", label: "Validate", href: "/validate", kind: "SYSTEM", declaredAuthority: "R172_VALIDATION_LAB" },
  { id: "system-cross-runtime", label: "Cross Runtime", href: "/validate/cross-runtime", kind: "SYSTEM", declaredAuthority: "R173_CROSS_RUNTIME_LAB" },
  { id: "system-independent", label: "Independent Solver", href: "/validate/independent", kind: "SYSTEM", declaredAuthority: "R175_INDEPENDENT_SOLVER_LAB" },
  { id: "system-clouds", label: "Clouds", href: "/clouds", kind: "SYSTEM", declaredAuthority: "R185_CLOUD_SWARM" },
  { id: "system-warp", label: "Warp", href: "/warp", kind: "SYSTEM", declaredAuthority: "R176_WARP_LAB" },
  { id: "system-warp-build", label: "Warp Build", href: "/warp/build", kind: "SYSTEM", declaredAuthority: "R178_BUILD_CANDIDATE_LAB" },
  { id: "system-federation", label: "Federation", href: "/federation", kind: "SYSTEM", declaredAuthority: "R174_FEDERATION_LAB" },
  { id: "system-evolution", label: "Evolution", href: "/evolution", kind: "SYSTEM", declaredAuthority: "CANONICAL_RUNTIME_PAGE" },
  { id: "system-truth", label: "Truth", href: "/truth", kind: "SYSTEM", declaredAuthority: "R190_WHOLE_SYSTEM_TRUTH" },
  { id: "system-convergence", label: "Convergence", href: "/convergence", kind: "SYSTEM", declaredAuthority: "CANONICAL_CONVERGENCE_COCKPIT" },
  { id: "system-fabric", label: "Fabric", href: "/fabric", kind: "SYSTEM", declaredAuthority: "R191_OR_CANONICAL_RUNTIME_PAGE" },
  { id: "system-instrument", label: "Instrument", href: "/instrument", kind: "SYSTEM", declaredAuthority: "R189_WHOLE_INSTRUMENT_OR_CANONICAL_PAGE" },
];

const allowed = new Map(MENU_TRUTH_ITEMS_R214.map((item) => [item.href, item]));

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-menu-truth": MENU_TRUTH_RELEASE_R214,
    },
  });
}

function exactHref(url: URL): string {
  return url.pathname + (url.search || "");
}

export async function handleMenuTruthR214(
  request: Request,
  env: any,
  ctx: any,
  next: (request: Request, env: any, ctx: any) => Promise<Response>,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (path !== "/api/surface/r214/menu-truth" && path !== "/api/surface/r214/route-check") return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);

  if (path === "/api/surface/r214/menu-truth") {
    return json({
      ok: true,
      schema: "OMEGA_MENU_ROUTE_TRUTH_R214",
      revision: "R214",
      release: MENU_TRUTH_RELEASE_R214,
      itemCount: MENU_TRUTH_ITEMS_R214.length,
      items: MENU_TRUTH_ITEMS_R214.map((item) => ({ ...item, availability: "UNPROBED_UNTIL_ROUTE_RESPONSE" })),
      rule: "A visible menu declaration is not itself proof that the target route works. R214 probes the exact same-origin target before click-through and marks non-responding targets unavailable instead of silently navigating into a broken surface.",
      canonicalMutation: false,
      promotionAuthorized: false,
    });
  }

  const href = url.searchParams.get("href") || "";
  const item = allowed.get(href);
  if (!item) return json({ ok: false, code: "UNDECLARED_MENU_TARGET", href }, 400);
  const target = new URL(href, request.url);
  if (target.origin !== url.origin) return json({ ok: false, code: "CROSS_ORIGIN_MENU_TARGET_REJECTED", href }, 400);
  try {
    const probeRequest = new Request(target.toString(), { method: "GET", headers: { accept: "text/html,application/json;q=0.9,*/*;q=0.1" } });
    const response = await next(probeRequest, env, ctx);
    const contentType = response.headers.get("content-type") || "";
    const routeResponded = response.status >= 200 && response.status < 400;
    return json({
      ok: routeResponded,
      schema: "OMEGA_MENU_ROUTE_CHECK_R214",
      revision: "R214",
      release: MENU_TRUTH_RELEASE_R214,
      item,
      checkedHref: exactHref(target),
      httpStatus: response.status,
      contentType,
      availability: routeResponded ? "ROUTE_RESPONDED" : "ROUTE_UNAVAILABLE",
      truthBoundary: "HTTP route response proves navigability only. It does not prove optional providers, physical-PC state, solver execution, Canon admission, or every operation within the destination.",
      canonicalMutation: false,
      promotionAuthorized: false,
    }, routeResponded ? 200 : 424);
  } catch (error) {
    return json({
      ok: false,
      schema: "OMEGA_MENU_ROUTE_CHECK_R214",
      revision: "R214",
      release: MENU_TRUTH_RELEASE_R214,
      item,
      checkedHref: href,
      httpStatus: 0,
      availability: "ROUTE_UNAVAILABLE",
      error: error instanceof Error ? error.message : String(error),
      canonicalMutation: false,
      promotionAuthorized: false,
    }, 424);
  }
}

const style = `<style id="omegaMenuTruthR214Style">
a[data-omega-route-truth]{position:relative}a[data-omega-route-truth]::after{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;margin-left:6px;vertical-align:middle;background:#71808b}a[data-omega-route-state="AVAILABLE"]::after{background:#62d59a;box-shadow:0 0 8px #62d59a88}a[data-omega-route-state="UNAVAILABLE"]::after{background:#e27272;box-shadow:0 0 8px #e2727288}a[data-omega-route-state="CHECKING"]::after{background:#d9b957}.omegaRouteTruthNotice{position:fixed;right:14px;bottom:14px;z-index:99999;max-width:min(420px,calc(100vw - 28px));border:1px solid #734646;border-radius:12px;background:#160c0eee;color:#ffe9e9;padding:10px 12px;font:12px/1.45 ui-monospace,monospace;box-shadow:0 18px 60px #000a}.omegaRouteTruthNotice b{display:block;margin-bottom:3px}</style>`;

const script = `<script id="omegaMenuTruthR214Runtime">(()=>{if(document.documentElement.dataset.omegaMenuTruthR214)return;document.documentElement.dataset.omegaMenuTruthR214='r214';const items=${JSON.stringify(MENU_TRUTH_ITEMS_R214)};const byHref=new Map(items.map(x=>[x.href,x]));const hrefOf=a=>{try{const u=new URL(a.href,location.href);return u.pathname+(u.search||'')}catch{return''}};const links=Array.from(document.querySelectorAll('a[href]')).filter(a=>byHref.has(hrefOf(a)));function state(a,s,msg){a.dataset.omegaRouteTruth='r214';a.dataset.omegaRouteState=s;a.title=(byHref.get(hrefOf(a))?.label||'OMEGA route')+' · '+s+(msg?' · '+msg:'')}async function probe(a){if(a.dataset.omegaRouteState==='AVAILABLE')return true;if(a.dataset.omegaRouteState==='CHECKING')return false;state(a,'CHECKING','verifying exact route');try{const h=hrefOf(a),r=await fetch('/api/surface/r214/route-check?href='+encodeURIComponent(h),{cache:'no-store'}),j=await r.json();if(r.ok&&j.ok){state(a,'AVAILABLE','HTTP '+j.httpStatus+' · '+j.item.declaredAuthority);return true}state(a,'UNAVAILABLE','HTTP '+(j.httpStatus??r.status));return false}catch(e){state(a,'UNAVAILABLE',String(e));return false}}function notice(a){document.querySelector('.omegaRouteTruthNotice')?.remove();const n=document.createElement('div');n.className='omegaRouteTruthNotice';n.innerHTML='<b>OMEGA ROUTE UNAVAILABLE</b>'+String(a.title||'This menu target did not return a usable route.');document.body.appendChild(n);setTimeout(()=>n.remove(),5500)}for(const a of links){state(a,'UNPROBED','verified on use');a.addEventListener('mouseenter',()=>probe(a),{once:true,passive:true});a.addEventListener('focus',()=>probe(a),{once:true,passive:true});a.addEventListener('click',async e=>{if(a.dataset.omegaRouteState==='AVAILABLE')return;e.preventDefault();const ok=await probe(a);if(ok)location.href=a.href;else notice(a)})}})();</script>`;

export async function enhanceMenuTruthR214(response: Response): Promise<Response> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes('id="omegaMenuTruthR214Runtime"')) {
    html = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
    html = html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-menu-truth", MENU_TRUTH_RELEASE_R214);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
