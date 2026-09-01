import convergence, { OmegaRuntime } from "./convergence";
import { syntheticCameraResponse } from "./syntheticCamera";
import type { Env } from "./index";
import {
  handleCapabilityRequest,
  injectCapabilityLink,
  injectSpecialistActivation,
  specialistFromPath,
} from "./capabilityRouter";

export { OmegaRuntime };

type GenesisBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type BoundEnv = Env & { GENESIS?: GenesisBinding };

const HEARTBEAT_TRUTH_BOUNDARY =
  "PC ONLINE requires both an upstream authenticated-online claim and a current authenticated Hybrid heartbeat; stale or absent heartbeat proof cannot be promoted to online.";
const GENESIS_TRANSPORT_BOUNDARY =
  "V6 may use an internal Cloudflare service binding to observe Genesis. Binding success proves transport reachability only; Genesis canonical state and V6 release authority remain separate.";
const CONVERGENCE_COCKPIT_BOUNDARY =
  "The convergence cockpit is an observation surface. It visualizes current runtime evidence and cannot mutate canonical V6, Genesis, Hybrid, or release state.";
const GENESIS_SCHEMA_V3 = "OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3";
const AUTHORITY_CONTRACT = "OMEGA_ROLE_SEPARATED_CONVERGENCE_V1";
const GENESIS_ROLE = "GENESIS_DISCOVERY_EVOLUTION_AUTHORITY";
const V6_ROLE = "V6_CANONICAL_OPERATIONAL_RUNTIME";
const V6_RELEASE_BRANCH = "omega-v6-full-convergence";
const ROLE_SEPARATION_BOUNDARY =
  "Genesis may discover, recover, test and propose. OMEGA V6 alone owns the operational/release lifecycle on omega-v6-full-convergence.";

const convergenceCockpit = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>OMEGA V6 · Live Convergence</title><style>
:root{--bg:#05070b;--panel:#0b1119;--line:#26364d;--text:#f4f7ff;--muted:#93a2b8;--good:#54d68a;--warn:#edc75f;--bad:#ef7777;font:15px/1.45 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 20% -10%,#192843 0,#080c13 34%,var(--bg) 72%);color:var(--text);min-height:100vh}a{color:inherit;text-decoration:none}.top{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 18px;background:#05070be8;border-bottom:1px solid #202d41;backdrop-filter:blur(16px)}.brand{font-weight:900;letter-spacing:.14em}.actions{display:flex;gap:8px;flex-wrap:wrap}.btn,.pill{border:1px solid #34445e;border-radius:999px;background:#0c131e;padding:8px 11px}.btn{cursor:pointer}.wrap{max-width:1440px;margin:auto;padding:18px}.hero{display:grid;grid-template-columns:1.3fr .7fr;gap:14px}.card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,#0f1723ee,#080d14ee);padding:17px;box-shadow:0 28px 80px #0007}.ey{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#8090a7}.hero h1{font-size:clamp(2.1rem,5vw,4.6rem);line-height:.94;letter-spacing:-.045em;margin:8px 0 12px}.muted{color:var(--muted)}.status{display:flex;gap:8px;align-items:center;font-weight:800}.dot{width:10px;height:10px;border-radius:50%;background:#66738a}.good{color:var(--good)}.warn{color:var(--warn)}.bad{color:var(--bad)}.dot.good{background:var(--good);box-shadow:0 0 20px #54d68a88}.dot.warn{background:var(--warn)}.dot.bad{background:var(--bad)}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}.metric b{display:block;font-size:1.4rem;margin-top:5px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.row{display:grid;grid-template-columns:160px 1fr;gap:10px;padding:9px 0;border-bottom:1px solid #202d40}.row:last-child{border:0}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8rem;word-break:break-all}.caps{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.cap{border:1px solid #31425d;border-radius:999px;background:#0a111b;padding:6px 9px;font-size:.76rem}.proof{white-space:pre-wrap;word-break:break-word;max-height:340px;overflow:auto;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;color:#aab7ca}.footer{padding:17px 0 28px;color:#77879e;font-size:.8rem}@media(max-width:1000px){.grid{grid-template-columns:1fr 1fr}.hero,.pair{grid-template-columns:1fr}}@media(max-width:620px){.grid{grid-template-columns:1fr}.wrap{padding:10px}.row{grid-template-columns:1fr}.top{align-items:flex-start;flex-wrap:wrap}}
</style></head><body><header class="top"><a class="brand" href="/">OMEGA V6</a><div class="actions"><span class="pill" id="freshness">Waiting for evidence</span><button class="btn" id="refresh">Refresh</button><a class="btn" href="https://omega-genesis-v1.jeffdeweyeljefe.workers.dev/">Genesis ↗</a></div></header><main class="wrap"><section class="hero"><div class="card"><div class="ey">Governed live convergence</div><h1>One operational view of V6, Genesis and Hybrid proof.</h1><p class="muted">This surface observes the reciprocal runtime contract. It does not merge authorities: V6 remains operational release authority, Genesis remains discovery/evolution authority, and PC ONLINE still requires a current authenticated Hybrid heartbeat.</p><div class="caps"><span class="cap">OBSERVE</span><span class="cap">RELATE</span><span class="cap">PRUNE</span><span class="cap">TRANSLATE</span><span class="cap">PROVE</span></div></div><div class="card"><div class="ey">Convergence decision</div><h2 id="decision">PROBING</h2><p id="decisionWhy" class="muted">Waiting for current public evidence.</p><div class="status"><span id="meshDot" class="dot"></span><span id="meshLabel">Mesh unproven</span></div></div></section><section class="grid"><div class="card metric"><div class="ey">Genesis transport</div><b id="transport">—</b><span class="muted">internal observation path</span></div><div class="card metric"><div class="ey">Manifest agreement</div><b id="manifestState">—</b><span class="muted" id="manifestShort">no digest</span></div><div class="card metric"><div class="ey">Capability genome</div><b id="capCount">—</b><span class="muted" id="modeCount">— modes</span></div><div class="card metric"><div class="ey">Hybrid truth</div><b id="pcState">UNPROVEN</b><span class="muted" id="heartbeatAge">no current heartbeat</span></div></section><section class="pair"><div class="card"><div class="ey">Canonical role state</div><div class="row"><b>V6</b><span id="v6State">Probing</span></div><div class="row"><b>Genesis</b><span id="genesisState">Probing</span></div><div class="row"><b>PC</b><span id="pcDetail">Probing</span></div><div class="row"><b>Evidence time</b><span id="evidenceTime">—</span></div><div class="row"><b>Manifest digest</b><span id="digest" class="mono">—</span></div><div class="row"><b>Transport boundary</b><span id="transportBoundary" class="muted">—</span></div></div><div class="card"><div class="ey">Genesis capability IDs</div><div id="capabilities" class="caps"><span class="muted">Waiting for genome.</span></div><div class="ey" style="margin-top:16px">Acceptance gates</div><div id="gates" class="caps"><span class="muted">Waiting for gates.</span></div></div></section><section class="pair"><div class="card"><div class="ey">Current governed development</div><div class="row"><b>Mode</b><span id="devMode">UNKNOWN</span></div><div class="row"><b>Active job</b><span id="activeJob">None reported</span></div><div id="jobs"></div></div><div class="card"><details open><summary class="ey">Technical proof packet</summary><pre id="proof" class="proof">Loading…</pre></details></div></section><div class="footer">${CONVERGENCE_COCKPIT_BOUNDARY} Representation shells such as 144/1728/20736 remain software/model/interface shells, not physical-dimension claims.</div></main><script>
const q=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));function age(iso){const t=Date.parse(iso||'');if(!Number.isFinite(t))return'unknown freshness';const s=Math.max(0,Math.round((Date.now()-t)/1000));return s<60?s+'s old':Math.round(s/60)+'m old'}async function load(){q('#freshness').textContent='Refreshing…';try{const r=await fetch('/api/convergence/edge',{cache:'no-store'}),d=await r.json(),c=d.convergence||{},g=d.genesis||{},m=g.manifest||{},pc=d.topology?.sovereign_pc||{},v6=d.topology?.v6?.edge||{},ge=d.topology?.genesis?.edge||{};const manifestOk=Boolean(c.reciprocal_manifest_ready&&c.authority_contract_ready&&m.digest&&c.genesis_manifest_digest===m.digest),transport=c.genesis_transport||m.transport||'UNPROVEN',mesh=Boolean(d.ok&&manifestOk);q('#transport').textContent=transport;q('#transport').className=transport==='SERVICE_BINDING'?'good':'warn';q('#manifestState').textContent=manifestOk?'AGREED':'UNPROVEN';q('#manifestState').className=manifestOk?'good':'warn';q('#manifestShort').textContent=m.digest?m.digest.slice(0,16)+'…':'no digest';q('#capCount').textContent=g.capability_count??'—';q('#modeCount').textContent=(m.mode_count??'—')+' modes';q('#pcState').textContent=pc.pc_online?'PC ONLINE':pc.heartbeat_current?'HEARTBEAT CURRENT':'PC UNPROVEN';q('#pcState').className=pc.pc_online?'good':'warn';q('#heartbeatAge').textContent=pc.heartbeat_current?'heartbeat '+(pc.heartbeat_age_seconds??'—')+'s old':'current authenticated heartbeat not proven';q('#v6State').textContent=v6.reachable?'REACHABLE · '+(v6.status??''):'DEGRADED';q('#genesisState').textContent=ge.reachable?'REACHABLE · '+(ge.status??''):'DEGRADED';q('#pcDetail').textContent=(pc.state||'UNPROVEN')+' · online='+String(Boolean(pc.pc_online));q('#evidenceTime').textContent=d.timestamp||'—';q('#digest').textContent=m.digest||'—';q('#transportBoundary').textContent=c.authority_boundary||c.genesis_transport_boundary||'No transport boundary reported.';q('#freshness').textContent='Evidence '+age(d.timestamp);q('#decision').textContent=mesh?'ROLE-SEPARATED CONVERGENCE PROVEN':'CONVERGENCE DEGRADED';q('#decision').className=mesh?'good':'warn';q('#decisionWhy').textContent=mesh?'V6 observes a current Genesis V3 manifest whose authority roles and digest agree with the operational release boundary.':'One or more current evidence or authority gates are not satisfied.';q('#meshDot').className='dot '+(mesh?'good':'warn');q('#meshLabel').textContent=mesh?'Role contract current':'Role contract incomplete';const ids=m.capability_ids||[];q('#capabilities').innerHTML=ids.length?ids.map(x=>'<span class="cap">'+esc(x)+'</span>').join(''):'<span class="muted">No capability IDs reported.</span>';const gates=g.acceptance_gates||[];q('#gates').innerHTML=gates.length?gates.map(x=>'<span class="cap">'+esc(x)+'</span>').join(''):'<span class="muted">No acceptance gates reported.</span>';q('#devMode').textContent=d.development?.mode||'UNKNOWN';const a=d.development?.active_job;q('#activeJob').textContent=a?(a.kind||'job')+' · '+(a.reason||''):'None reported';const jobs=(d.development?.recent_jobs||[]).slice().reverse().slice(0,5);q('#jobs').innerHTML=jobs.map(j=>'<div class="row"><b>'+esc(j.kind||'job')+'</b><span>'+esc(j.state||'')+' · '+esc(j.reason||'')+'</span></div>').join('');q('#proof').textContent=JSON.stringify(d,null,2)}catch(e){q('#freshness').textContent='Evidence unavailable';q('#decision').textContent='CONVERGENCE UNREACHABLE';q('#decision').className='bad';q('#meshDot').className='dot bad';q('#meshLabel').textContent='Public proof request failed';q('#proof').textContent=String(e)}}q('#refresh').onclick=load;load();setInterval(load,5000);
</script></body></html>`;

async function jsonFrom(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { ok: false, error: "non_json_response", status: response.status, body_preview: text.slice(0, 240) }; }
}

async function genesisServiceProbe(env: BoundEnv, path: string): Promise<any | null> {
  if (!env.GENESIS) return null;
  try {
    const response = await env.GENESIS.fetch(new Request("https://omega-genesis.internal" + path, { method: "GET", headers: { accept: "application/json" } }));
    return { reachable: response.ok, status: response.status, body: await jsonFrom(response), transport: "SERVICE_BINDING" };
  } catch (error) {
    return { reachable: false, status: 0, error: String(error), transport: "SERVICE_BINDING" };
  }
}

function roleSeparatedManifestReady(manifest: any): boolean {
  if (!manifest || typeof manifest !== "object") return false;
  const runtime = manifest.runtime || {};
  const product = manifest.public_product || {};
  return Boolean(
    manifest.schema === GENESIS_SCHEMA_V3 &&
    manifest.authority_contract === AUTHORITY_CONTRACT &&
    runtime.role === GENESIS_ROLE &&
    runtime.operational_release_authority === false &&
    product.role === V6_ROLE &&
    product.release_authority === V6_RELEASE_BRANCH &&
    product.genesis_may_deploy_v6 === false &&
    typeof manifest.manifest_digest === "string" &&
    manifest.manifest_digest.length === 64
  );
}

async function repairGenesisTransport(body: any, env: BoundEnv): Promise<any> {
  if (!env.GENESIS || !body || typeof body !== "object") return body;
  const [edge, health, manifestProbe, capabilitiesProbe, modesProbe] = await Promise.all([
    genesisServiceProbe(env, "/_omega/health"), genesisServiceProbe(env, "/api/health"), genesisServiceProbe(env, "/api/convergence/manifest"), genesisServiceProbe(env, "/api/capabilities"), genesisServiceProbe(env, "/api/mode?id=ALL_MODES"),
  ]);
  body.convergence = body.convergence || {};
  body.convergence.genesis_transport_boundary = GENESIS_TRANSPORT_BOUNDARY;
  body.convergence.genesis_transport = manifestProbe?.reachable ? "SERVICE_BINDING" : "SERVICE_BINDING_DEGRADED";
  const topologyGenesis = body?.topology?.genesis;
  if (topologyGenesis && typeof topologyGenesis === "object") { if (edge?.reachable) topologyGenesis.edge = edge; if (health?.reachable) topologyGenesis.health = health; }
  body.genesis = body.genesis || {};
  const manifest = manifestProbe?.body || {}, genome = manifest.capability_genome || {}, capabilities = capabilitiesProbe?.body || {};
  if (capabilitiesProbe?.reachable) {
    body.genesis.capability_count = genome.capability_count ?? capabilities.count ?? (Array.isArray(capabilities.capabilities) ? capabilities.capabilities.length : null);
    body.genesis.acceptance_gates = genome.acceptance_gates || capabilities.acceptance_gates || [];
    body.genesis.menus = capabilities.menus || [];
  }
  if (modesProbe?.reachable) body.genesis.all_modes = modesProbe.body?.result || modesProbe.body || null;
  if (manifestProbe?.reachable) {
    const runtime = manifest.runtime || {}, product = manifest.public_product || {};
    const compatible = roleSeparatedManifestReady(manifest);
    body.genesis.manifest = {
      reachable: true,
      status: manifestProbe.status,
      schema: manifest.schema || null,
      digest: manifest.manifest_digest || null,
      authority_contract: manifest.authority_contract || null,
      runtime_role: runtime.role || null,
      operational_release_authority: runtime.operational_release_authority ?? null,
      public_product_role: product.role || null,
      release_authority: product.release_authority || null,
      genesis_may_deploy_v6: product.genesis_may_deploy_v6 ?? null,
      authority_boundary: manifest.authority_boundary || null,
      capability_ids: genome.capability_ids || [],
      mode_count: genome.mode_count ?? null,
      promotion_boundary: manifest.promotion_boundary || null,
      dimensional_boundary: manifest.dimensional_boundary || null,
      transport: "SERVICE_BINDING",
    };
    body.convergence.reciprocal_manifest_ready = compatible;
    body.convergence.authority_contract_ready = compatible;
    body.convergence.authority_contract = manifest.authority_contract || null;
    body.convergence.genesis_manifest_digest = manifest.manifest_digest || null;
    body.convergence.genesis_may_deploy_v6 = false;
    body.convergence.v6_release_authority = V6_RELEASE_BRANCH;
    body.convergence.authority_boundary = ROLE_SEPARATION_BOUNDARY;
  }
  body.ok = Boolean(body?.topology?.v6?.edge?.reachable && body?.topology?.genesis?.edge?.reachable);
  return body;
}

async function enforceHeartbeatTruth(response: Response, env: BoundEnv): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return response;
  let body: any = await response.json();
  body = await repairGenesisTransport(body, env);
  const node = body?.topology?.sovereign_pc;
  if (!node || typeof node !== "object") return Response.json(body, { status: response.status, headers: response.headers });
  const upstreamOnline = Boolean(node.pc_online), heartbeatCurrent = Boolean(node.heartbeat_current);
  node.pc_online = Boolean(upstreamOnline && heartbeatCurrent);
  node.heartbeat_required_for_pc_online = true;
  node.upstream_online_claim = upstreamOnline;
  node.truth_boundary = HEARTBEAT_TRUTH_BOUNDARY;
  if (!heartbeatCurrent && upstreamOnline) node.state = "HEARTBEAT_STALE_OR_UNPROVEN";
  body.convergence = body.convergence || {};
  body.convergence.hybrid_truth_boundary = HEARTBEAT_TRUTH_BOUNDARY;
  body.convergence.pc_online_requires_current_heartbeat = true;
  body.convergence.cockpit_observation_boundary = CONVERGENCE_COCKPIT_BOUNDARY;
  return Response.json(body, { status: response.status, headers: response.headers });
}

async function provenEdgeSnapshot(request: Request, env: BoundEnv): Promise<any> {
  const url = new URL(request.url);
  url.pathname = "/api/convergence/edge";
  url.search = "";
  const response = await convergence.fetch(new Request(url.toString(), { method: "GET", headers: { accept: "application/json" } }), env);
  return jsonFrom(await enforceHeartbeatTruth(response, env));
}

async function injectCockpitLink(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const html = await response.text();
  if (html.includes('href="/convergence"')) return new Response(html, response);
  const link = '<a href="/convergence" style="position:fixed;right:14px;bottom:14px;z-index:9999;border:1px solid #3b4f71;border-radius:999px;background:#09111aee;color:#f4f7ff;padding:9px 12px;text-decoration:none;font:700 12px/1.2 system-ui;box-shadow:0 12px 34px #0008">LIVE CONVERGENCE ↗</a>';
  return new Response(html.replace("</body>", link + "</body>"), response);
}

export default {
  async fetch(request: Request, env: BoundEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/camera" || url.pathname === "/reconstruct") return syntheticCameraResponse();

    const capabilityResponse = await handleCapabilityRequest(request, env, () => provenEdgeSnapshot(request, env));
    if (capabilityResponse) return capabilityResponse;
    const specialist = specialistFromPath(url.pathname);
    if (specialist.matched) {
      if (!specialist.view) return Response.json({ ok: false, error: "unknown_specialist", allowed: ["Field", "Earth", "Assistant", "Hybrid", "Proof"] }, { status: 404 });
      const root = new URL(request.url);
      root.pathname = "/";
      root.search = "";
      const response = await convergence.fetch(new Request(root.toString(), { method: "GET", headers: request.headers }), env);
      const withCockpit = await injectCockpitLink(response);
      const withCapabilities = await injectCapabilityLink(withCockpit);
      return injectSpecialistActivation(withCapabilities, specialist.view);
    }

    if (url.pathname === "/convergence") return new Response(convergenceCockpit, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-omega-authority": "observation-only" } });
    const response = await convergence.fetch(request, env);
    if (url.pathname !== "/api/convergence/edge") {
      if (url.pathname === "/") return injectCapabilityLink(await injectCockpitLink(response));
      return response;
    }
    return enforceHeartbeatTruth(response, env);
  },
};