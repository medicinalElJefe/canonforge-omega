import runtime, { OmegaRuntime } from "./heartbeatTruth";
import type { Env } from "./index";

export { OmegaRuntime };

type GenesisBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type BoundEnv = Env & { GENESIS?: GenesisBinding };

type V6View = "Field" | "Earth" | "Assistant" | "Hybrid" | "Proof";

type CapabilityDetail = {
  id: string;
  title: string | null;
  category: string | null;
  domain: string | null;
  summary: string | null;
  status: string | null;
  declared_route: string | null;
};

const CAPABILITY_BOUNDARY =
  "Capability discovery is observational until an admitted route is previewed. This surface cannot promote Genesis candidates, mutate canonical state, generate on selection, or claim native execution.";

const VIEWS: readonly V6View[] = ["Field", "Earth", "Assistant", "Hybrid", "Proof"];

function isView(value: string): value is V6View {
  return (VIEWS as readonly string[]).includes(value);
}

function text(value: unknown, max = 360): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

function sanitizeCapability(value: any): CapabilityDetail | null {
  if (!value || typeof value !== "object") return null;
  const id = text(value.id ?? value.capability_id ?? value.capabilityId ?? value.key, 120);
  if (!id) return null;
  return {
    id,
    title: text(value.title ?? value.name ?? value.label, 180),
    category: text(value.category ?? value.kind ?? value.family, 120),
    domain: text(value.domain ?? value.surface ?? value.area, 120),
    summary: text(value.summary ?? value.description ?? value.purpose, 360),
    status: text(value.status ?? value.state ?? value.maturity, 80),
    declared_route: text(value.route ?? value.app ?? value.menu ?? value.target, 160),
  };
}

async function json(response: Response): Promise<any> {
  try { return await response.json(); }
  catch { return null; }
}

async function edgeEvidence(request: Request, env: BoundEnv): Promise<any> {
  const url = new URL(request.url);
  url.pathname = "/api/convergence/edge";
  url.search = "";
  const response = await runtime.fetch(new Request(url.toString(), { method: "GET", headers: { accept: "application/json" } }), env as any);
  return json(response);
}

async function genesisCapabilities(env: BoundEnv): Promise<any> {
  if (!env.GENESIS) return null;
  try {
    const response = await env.GENESIS.fetch(new Request("https://omega-genesis.internal/api/capabilities", {
      method: "GET",
      headers: { accept: "application/json" },
    }));
    if (!response.ok) return null;
    return json(response);
  } catch {
    return null;
  }
}

async function capabilityIndex(request: Request, env: BoundEnv) {
  const [edge, source] = await Promise.all([edgeEvidence(request, env), genesisCapabilities(env)]);
  const genesis = edge?.genesis || {};
  const manifest = genesis.manifest || {};
  const ids: string[] = Array.isArray(manifest.capability_ids)
    ? manifest.capability_ids.filter((v: unknown): v is string => typeof v === "string")
    : [];
  const sourceItems = Array.isArray(source?.capabilities)
    ? source.capabilities
    : Array.isArray(source?.items)
      ? source.items
      : [];
  const details = sourceItems.map(sanitizeCapability).filter(Boolean) as CapabilityDetail[];
  const byId = new Map(details.map(item => [item.id, item]));
  const capabilities = ids.map(id => byId.get(id) || ({
    id,
    title: null,
    category: null,
    domain: null,
    summary: null,
    status: null,
    declared_route: null,
  } as CapabilityDetail));
  for (const detail of details) if (!ids.includes(detail.id)) capabilities.push(detail);

  const agreed = Boolean(
    edge?.convergence?.reciprocal_manifest_ready &&
    manifest.digest &&
    edge?.convergence?.genesis_manifest_digest === manifest.digest,
  );

  return {
    schema: "OMEGA_V6_CAPABILITY_INDEX_V1",
    authority: "observation-only",
    boundary: CAPABILITY_BOUNDARY,
    evidence_timestamp: edge?.timestamp || null,
    manifest_digest: manifest.digest || null,
    manifest_agreed: agreed,
    transport: edge?.convergence?.genesis_transport || manifest.transport || "UNPROVEN",
    capability_count: genesis.capability_count ?? capabilities.length,
    mode_count: manifest.mode_count ?? null,
    acceptance_gates: Array.isArray(genesis.acceptance_gates) ? genesis.acceptance_gates : [],
    capabilities,
    hybrid: {
      pc_online: Boolean(edge?.topology?.sovereign_pc?.pc_online),
      heartbeat_current: Boolean(edge?.topology?.sovereign_pc?.heartbeat_current),
      state: edge?.topology?.sovereign_pc?.state || "UNPROVEN",
    },
  };
}

function declaredView(capability: CapabilityDetail): V6View | null {
  const declared = (capability.declared_route || "").toLowerCase();
  for (const view of VIEWS) if (declared.includes(view.toLowerCase())) return view;
  return null;
}

function inferView(capability: CapabilityDetail): { view: V6View; reason: string } {
  const explicit = declaredView(capability);
  if (explicit) return { view: explicit, reason: "Genesis public capability metadata names an existing V6 specialist surface." };
  const corpus = [capability.id, capability.title, capability.category, capability.domain, capability.summary]
    .filter(Boolean).join(" ").toLowerCase();
  const rules: Array<[V6View, RegExp, string]> = [
    ["Earth", /earth|geo|gis|map|weather|seismic|osm|noaa|terrain|source[- ]bound/, "Earth/source vocabulary routes to the source-bound Earth specialist."],
    ["Hybrid", /hybrid|desktop|device|heartbeat|agent|native|sovereign pc|workspace/, "Device/native vocabulary routes to the heartbeat-governed Hybrid specialist."],
    ["Assistant", /assistant|memory|context|language|intelligence|model|synthesis|conversation|route/, "Intelligence/context vocabulary routes to the route-before-generation Assistant."],
    ["Field", /field|calculus|operator|topolog|shell|visual|mode|relation|coherence/, "Relational/calculus vocabulary routes to the Living Field specialist."],
    ["Proof", /proof|evidence|verify|verification|rollback|govern|ledger|audit|policy/, "Proof/governance vocabulary routes to the Proof & Rollback specialist."],
  ];
  for (const [view, pattern, reason] of rules) if (pattern.test(corpus)) return { view, reason };
  return { view: "Proof", reason: "No specialist route is evidenced by current metadata, so the conservative fallback is Proof & Rollback." };
}

async function routePreview(request: Request, env: BoundEnv): Promise<Response> {
  const url = new URL(request.url);
  const id = (url.searchParams.get("id") || "").trim();
  if (!id) return Response.json({ ok: false, error: "capability_id_required" }, { status: 400 });
  const index = await capabilityIndex(request, env);
  const capability = index.capabilities.find((item: CapabilityDetail) => item.id === id);
  if (!capability) return Response.json({ ok: false, error: "capability_not_in_current_genome", id }, { status: 404 });
  const route = inferView(capability);
  return Response.json({
    ok: true,
    schema: "OMEGA_V6_CAPABILITY_ROUTE_PREVIEW_V1",
    authority: "routing-only",
    route_before_generation: true,
    execution: false,
    capability,
    manifest_digest: index.manifest_digest,
    manifest_agreed: index.manifest_agreed,
    target: `/app/${route.view}`,
    specialist: route.view,
    reason: route.reason,
    boundary: CAPABILITY_BOUNDARY,
  }, { headers: { "cache-control": "no-store", "x-omega-authority": "routing-only" } });
}

const capabilityBrowser = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>OMEGA V6 · Capability Router</title><style>
:root{--bg:#05070b;--panel:#0b1119;--line:#26364d;--text:#f4f7ff;--muted:#93a2b8;--good:#54d68a;--warn:#edc75f;font:15px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 18% -8%,#182845 0,#080c13 36%,var(--bg) 75%);color:var(--text);min-height:100vh}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;gap:10px;align-items:center;padding:13px 16px;background:#05070bea;border-bottom:1px solid #202d41;backdrop-filter:blur(16px)}.brand{font-weight:900;letter-spacing:.14em}.actions{display:flex;gap:8px;flex-wrap:wrap}.btn,.pill,input{border:1px solid #34445e;border-radius:12px;background:#0c131e;color:var(--text);padding:9px 11px}.btn{cursor:pointer}.wrap{max-width:1500px;margin:auto;padding:18px}.hero{display:grid;grid-template-columns:1.15fr .85fr;gap:14px}.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,#0f1723ee,#080d14ee);padding:17px;box-shadow:0 28px 80px #0006}.ey{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#8090a7}.hero h1{font-size:clamp(2rem,5vw,4.5rem);line-height:.96;letter-spacing:-.045em;margin:7px 0 12px}.muted{color:var(--muted)}.good{color:var(--good)}.warn{color:var(--warn)}.toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:14px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.cap{display:flex;flex-direction:column;gap:8px;min-height:190px}.cap h3{margin:0;font-size:1.05rem}.meta{font-size:.78rem;color:var(--muted)}.cap .grow{flex:1}.route{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;word-break:break-all}.chips{display:flex;gap:6px;flex-wrap:wrap}.chip{border:1px solid #30415c;border-radius:999px;padding:5px 8px;font-size:.74rem;background:#09111b}.hidden{display:none}.footer{padding:20px 0;color:#77879e;font-size:.8rem}@media(max-width:1000px){.grid{grid-template-columns:1fr 1fr}.hero,.route{grid-template-columns:1fr}}@media(max-width:650px){.grid{grid-template-columns:1fr}.toolbar{grid-template-columns:1fr}.wrap{padding:10px}.top{align-items:flex-start;flex-wrap:wrap}}
</style></head><body><header class="top"><a class="brand" href="/">OMEGA V6</a><div class="actions"><span class="pill" id="state">Loading genome</span><a class="btn" href="/convergence">Convergence</a><a class="btn" href="https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/">Genesis ↗</a></div></header><main class="wrap"><section class="hero"><div class="card"><div class="ey">Discovery → admitted route → specialist</div><h1>Capability Router</h1><p class="muted">Browse the current Genesis capability genome from V6, inspect public metadata, preview a deterministic route, then open the existing V6 specialist surface. Selection alone never generates, promotes, executes native work, or mutates either canonical role.</p></div><div class="card"><div class="ey">Current evidence</div><h2 id="agreement">PROBING</h2><div class="meta mono" id="digest">No manifest digest.</div><div class="chips" id="gates"></div></div></section><div class="toolbar"><input id="search" placeholder="Search capability ID, title, category, domain or summary…"><button class="btn" id="refresh">Refresh genome</button></div><section class="grid" id="capGrid"></section><section class="route"><div class="card"><div class="ey">Selected capability</div><h2 id="selected">None selected</h2><p class="muted" id="selectedSummary">Choose a capability to inspect it.</p><pre class="mono" id="selectedMeta"></pre></div><div class="card"><div class="ey">Route-before-generation preview</div><h2 id="specialist">ROUTE REQUIRED</h2><p class="muted" id="reason">No route has been admitted.</p><div class="actions"><button class="btn" id="preview" disabled>Preview route</button><a class="btn hidden" id="open" href="#">Open specialist</a></div><pre class="mono" id="routeProof"></pre></div></section><div class="footer">${CAPABILITY_BOUNDARY}</div></main><script>
const q=s=>document.querySelector(s),grid=q('#capGrid');let index=null,selected=null;function esc(v){return String(v??'')}function searchable(c){return [c.id,c.title,c.category,c.domain,c.summary,c.status].filter(Boolean).join(' ').toLowerCase()}function render(){const term=q('#search').value.trim().toLowerCase(),caps=(index?.capabilities||[]).filter(c=>!term||searchable(c).includes(term));grid.innerHTML='';for(const c of caps){const el=document.createElement('article');el.className='card cap';const h=document.createElement('h3');h.textContent=c.title||c.id;const id=document.createElement('div');id.className='meta mono';id.textContent=c.id;const meta=document.createElement('div');meta.className='meta';meta.textContent=[c.category,c.domain,c.status].filter(Boolean).join(' · ')||'Public metadata not declared';const s=document.createElement('p');s.className='muted grow';s.textContent=c.summary||'No public summary declared in the current capability response.';const b=document.createElement('button');b.className='btn';b.textContent='Inspect + route';b.onclick=()=>select(c);el.append(h,id,meta,s,b);grid.append(el)}if(!caps.length){const e=document.createElement('div');e.className='card muted';e.textContent='No capabilities match this filter.';grid.append(e)}}function select(c){selected=c;q('#selected').textContent=c.title||c.id;q('#selectedSummary').textContent=c.summary||'No public summary declared.';q('#selectedMeta').textContent=JSON.stringify(c,null,2);q('#specialist').textContent='ROUTE REQUIRED';q('#reason').textContent='Preview is required before opening a specialist surface.';q('#routeProof').textContent='';q('#preview').disabled=false;q('#open').classList.add('hidden')}async function preview(){if(!selected)return;q('#specialist').textContent='ROUTING…';const r=await fetch('/api/capability/route?id='+encodeURIComponent(selected.id),{cache:'no-store'}),d=await r.json();q('#routeProof').textContent=JSON.stringify(d,null,2);if(!r.ok){q('#specialist').textContent='ROUTE REJECTED';q('#reason').textContent=d.error||'Current evidence rejected this route.';return}q('#specialist').textContent=d.specialist;q('#reason').textContent=d.reason;q('#open').href=d.target;q('#open').classList.remove('hidden')}async function load(){q('#state').textContent='Refreshing…';try{const r=await fetch('/api/convergence/capabilities',{cache:'no-store'}),d=await r.json();index=d;q('#state').textContent=(d.capability_count??d.capabilities?.length??0)+' capabilities · '+(d.transport||'UNPROVEN');q('#agreement').textContent=d.manifest_agreed?'MANIFEST AGREED':'MANIFEST UNPROVEN';q('#agreement').className=d.manifest_agreed?'good':'warn';q('#digest').textContent=d.manifest_digest||'No manifest digest.';q('#gates').innerHTML='';for(const gate of d.acceptance_gates||[]){const e=document.createElement('span');e.className='chip';e.textContent=esc(gate);q('#gates').append(e)}render()}catch(e){q('#state').textContent='Genome unavailable';q('#agreement').textContent='UNREACHABLE';q('#agreement').className='warn';grid.innerHTML='<div class="card muted">Capability evidence could not be loaded.</div>'}}q('#search').oninput=render;q('#refresh').onclick=load;q('#preview').onclick=preview;load();
</script></body></html>`;

async function htmlResponse(response: Response, mutate: (body: string) => string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  return new Response(mutate(await response.text()), { status: response.status, headers });
}

async function rootWithCapabilityLink(request: Request, env: BoundEnv): Promise<Response> {
  const response = await runtime.fetch(request, env as any);
  return htmlResponse(response, body => body.includes('href="/capabilities"') ? body : body.replace("</body>", '<a href="/capabilities" style="position:fixed;right:18px;bottom:72px;z-index:9999;padding:10px 13px;border:1px solid #4b6388;border-radius:999px;background:#08111ddd;color:#f4f7ff;text-decoration:none;font:700 12px system-ui;backdrop-filter:blur(12px)">CAPABILITY ROUTER</a></body>'));
}

async function specialistView(request: Request, env: BoundEnv, view: V6View): Promise<Response> {
  const root = new URL(request.url);
  root.pathname = "/";
  root.search = "";
  const response = await runtime.fetch(new Request(root.toString(), { method: "GET", headers: request.headers }), env as any);
  return htmlResponse(response, body => body.replace("</body>", `<script>addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('button[data-app="${view}"]');if(b instanceof HTMLElement)b.click()})</script></body>`));
}

export default {
  async fetch(request: Request, env: BoundEnv): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/capabilities") {
      return new Response(capabilityBrowser, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-omega-authority": "observation-only" } });
    }
    if (request.method === "GET" && url.pathname === "/api/convergence/capabilities") {
      return Response.json(await capabilityIndex(request, env), { headers: { "cache-control": "no-store", "x-omega-authority": "observation-only" } });
    }
    if (request.method === "GET" && url.pathname === "/api/capability/route") return routePreview(request, env);
    if (request.method === "GET" && url.pathname.startsWith("/app/")) {
      const view = decodeURIComponent(url.pathname.slice(5));
      if (!isView(view)) return Response.json({ ok: false, error: "unknown_specialist", allowed: VIEWS }, { status: 404 });
      return specialistView(request, env, view);
    }
    if (request.method === "GET" && url.pathname === "/") return rootWithCapabilityLink(request, env);
    return runtime.fetch(request, env as any);
  },
};
