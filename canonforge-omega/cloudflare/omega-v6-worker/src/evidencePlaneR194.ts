export const EVIDENCE_PLANE_RELEASE_R194 = "r194-dual-plane-evidence-restoration";
export const EVIDENCE_PLANE_SCHEMA_R194 = "OMEGA_V6_EVIDENCE_PLANE_R194";

export const EVIDENCE_PLANE_BOUNDARY_R194 =
  "R194 separates locally executable Worker contracts from external sovereign evidence. A live local state/proof/replay/SAI contract remains usable when the sovereign gateway is absent, but it never substitutes for /api/omega/state, sovereign proof history, restoration state, Earth source observations, B059 verification, an authenticated PC heartbeat, or native RCWA execution.";

type RouterFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type Probe = {
  path: string;
  ok: boolean;
  status: number;
  schema: string | null;
  state: string | null;
  code: string | null;
  body: Record<string, any> | null;
};

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });

async function probe(base: Request, env: any, ctx: any, routerFetch: RouterFetch, path: string): Promise<Probe> {
  const url = new URL(base.url);
  const [pathname, search = ""] = path.split("?");
  url.pathname = pathname;
  url.search = search ? `?${search}` : "";
  try {
    const response = await routerFetch(new Request(url.toString(), { method: "GET", headers: { accept: "application/json" } }), env, ctx);
    const body = await response.clone().json().catch(() => null) as Record<string, any> | null;
    return {
      path,
      ok: response.ok,
      status: response.status,
      schema: typeof body?.schema === "string" ? body.schema : null,
      state: typeof body?.state === "string" ? body.state : null,
      code: typeof (body?.code ?? body?.error) === "string" ? String(body?.code ?? body?.error) : null,
      body,
    };
  } catch (error) {
    return { path, ok: false, status: 0, schema: null, state: null, code: error instanceof Error ? error.message : String(error), body: null };
  }
}

function externalSummary(p: Probe) {
  return {
    path: p.path,
    available: p.ok,
    httpStatus: p.status,
    state: p.state,
    schema: p.schema,
    code: p.code,
  };
}

function localSummary(p: Probe, expectedSchema: string) {
  const verified = p.ok && p.schema === expectedSchema;
  return {
    path: p.path,
    available: p.ok,
    verified,
    httpStatus: p.status,
    schema: p.schema,
    state: verified ? "LOCAL_CONTRACT_VERIFIED" : "LOCAL_CONTRACT_DEGRADED",
    code: p.code,
  };
}

async function statusPacket(request: Request, env: any, ctx: any, routerFetch: RouterFetch) {
  const [stateSchema, proofSchema, replaySchema, saiManifest, edge, sovereignState, sovereignProof, sovereignRestoration, earthCatalog, b059Status, hybridStatus] = await Promise.all([
    probe(request, env, ctx, routerFetch, "/api/state/workbench/schema"),
    probe(request, env, ctx, routerFetch, "/api/core/evidence-ledger/schema"),
    probe(request, env, ctx, routerFetch, "/api/core/replay/schema"),
    probe(request, env, ctx, routerFetch, "/api/sai/manifest"),
    probe(request, env, ctx, routerFetch, "/api/convergence/edge"),
    probe(request, env, ctx, routerFetch, "/api/omega/state"),
    probe(request, env, ctx, routerFetch, "/api/omega/proof?limit=1"),
    probe(request, env, ctx, routerFetch, "/api/restoration"),
    probe(request, env, ctx, routerFetch, "/api/earth/catalog"),
    probe(request, env, ctx, routerFetch, "/api/sai/status"),
    probe(request, env, ctx, routerFetch, "/api/hybrid/status"),
  ]);

  const edgeBody = edge.body || {};
  const pc = edgeBody?.topology?.sovereign_pc || {};
  const sai = saiManifest.body || {};
  const earthCoverages = earthCatalog.ok
    ? (Array.isArray(earthCatalog.body?.coverages) ? earthCatalog.body?.coverages : Array.isArray(earthCatalog.body?.catalog?.coverages) ? earthCatalog.body?.catalog?.coverages : [])
    : [];

  const local = {
    state: localSummary(stateSchema, "OMEGA_STATE_WORKBENCH_SCHEMA_V1"),
    proof: localSummary(proofSchema, "OMEGA_BINDING_EVIDENCE_LEDGER_V1"),
    recovery: localSummary(replaySchema, "OMEGA_UNIFIED_CORE_VALIDATION_REPLAY_V1"),
    sai: {
      path: saiManifest.path,
      available: saiManifest.ok,
      verified: saiManifest.ok && sai.schema === "OMEGA_SAI_MANIFEST_R179",
      httpStatus: saiManifest.status,
      schema: sai.schema || null,
      operationalIntelligenceReady: sai.operationalIntelligenceReady === true,
      trainingState: sai.training?.state || null,
      exactTrainingManifestComplete: sai.training?.exactTrainingManifestComplete === true,
      sourceBoundCorpusEntries: sai.training?.sourceBoundCorpusEntries ?? sai.corpusSources?.length ?? null,
    },
    convergence: {
      path: edge.path,
      available: edge.ok,
      verified: edge.ok && Boolean(edgeBody?.topology?.v6?.edge?.reachable),
      v6Reachable: Boolean(edgeBody?.topology?.v6?.edge?.reachable),
      genesisReachable: Boolean(edgeBody?.topology?.genesis?.edge?.reachable),
      reciprocalManifestReady: Boolean(edgeBody?.convergence?.reciprocal_manifest_ready),
    },
  };

  const external = {
    sovereignState: externalSummary(sovereignState),
    sovereignProof: externalSummary(sovereignProof),
    sovereignRestoration: externalSummary(sovereignRestoration),
    earthCatalog: { ...externalSummary(earthCatalog), coverageCount: earthCoverages.length },
    b059: externalSummary(b059Status),
    hybrid: {
      ...externalSummary(hybridStatus),
      pcOnline: pc.pc_online === true,
      heartbeatCurrent: pc.heartbeat_current === true,
      heartbeatAgeSeconds: pc.heartbeat_age_seconds ?? null,
      agentId: pc.agent_id ?? null,
      convergenceEvidenceAvailable: edge.ok,
    },
  };

  const localVerified = Object.values(local).filter((v: any) => v?.verified === true).length;
  const externalAvailable = [sovereignState, sovereignProof, sovereignRestoration, earthCatalog, b059Status, hybridStatus].filter(p => p.ok).length;

  return {
    ok: localVerified >= 4,
    schema: EVIDENCE_PLANE_SCHEMA_R194,
    release: EVIDENCE_PLANE_RELEASE_R194,
    timestamp: new Date().toISOString(),
    summary: {
      localVerified,
      localTotal: 5,
      externalAvailable,
      externalTotal: 6,
      pcOnline: pc.pc_online === true,
      heartbeatCurrent: pc.heartbeat_current === true,
      earthObservedCoverageCount: earthCoverages.length,
      saiOperationalIntelligenceReady: sai.operationalIntelligenceReady === true,
    },
    local,
    external,
    truth: {
      localWorkerContractIsNotSovereignState: true,
      localProofSchemaIsNotSovereignProofHistory: true,
      localReplaySchemaIsNotSovereignRestorationState: true,
      earthCatalogMissingMeansObservationWithheld: !earthCatalog.ok,
      b059MissingMeansTrainingVerificationWithheld: !b059Status.ok,
      pcOnlineRequiresCurrentHeartbeat: true,
      nativeRcwaNotInferred: true,
    },
    boundary: EVIDENCE_PLANE_BOUNDARY_R194,
  };
}

export async function handleEvidencePlaneR194(request: Request, env: any, ctx: any, routerFetch: RouterFetch): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (path !== "/api/workspace/r194/status" && path !== "/api/workspace/r194/health") return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  const packet = await statusPacket(request, env, ctx, routerFetch);
  if (path.endsWith("/health")) {
    return json({
      ok: packet.ok,
      schema: packet.schema,
      release: packet.release,
      localVerified: packet.summary.localVerified,
      localTotal: packet.summary.localTotal,
      externalAvailable: packet.summary.externalAvailable,
      externalTotal: packet.summary.externalTotal,
      pcOnline: packet.summary.pcOnline,
      truth: packet.truth,
    }, packet.ok ? 200 : 503);
  }
  return json(packet, packet.ok ? 200 : 503);
}

const rootScript = `<script id="omegaEvidencePlaneR194Runtime">(()=>{
if(location.pathname!=='/'&&location.pathname!=='')return;const $=s=>document.querySelector(s);let busy=false;
function txt(sel,value){const el=$(sel);if(el)el.textContent=value}function html(sel,value){const el=$(sel);if(el)el.innerHTML=value}function dot(sel,kind){const el=$(sel);if(el)el.className='dot '+kind}
function pretty(x){return JSON.stringify(x,null,2)}
function step(name,state,kind,detail=''){return '<div class="step '+kind+'"><div class="eyebrow">'+name+'</div><h3>'+state+'</h3>'+(detail?'<p class="muted">'+detail+'</p>':'')+'</div>'}
function render(d){const L=d.local||{},X=d.external||{},sum=d.summary||{};
 const sovereign=Boolean(X.sovereignState?.available);if(sovereign){dot('#runtimeDot','ok');txt('#runtimeLabel','Sovereign runtime linked')}else if(L.state?.verified){dot('#runtimeDot','warn');txt('#runtimeLabel','Local state instrument live · sovereign packet unavailable');txt('#dispatch','LOCAL STATE CONTRACT READY');txt('#digest','no sovereign digest');txt('#fieldEvidence','COMPUTATION-ONLY · LIVE PACKET WITHHELD');txt('#stateProof',pretty({local:L.state,sovereign:X.sovereignState,boundary:d.boundary}))}
 if(X.earthCatalog?.available){txt('#earthStatus','SOURCE CATALOG AVAILABLE');txt('#earthCount',String(X.earthCatalog.coverageCount||0)+' observed coverage identities')}else{txt('#earthStatus','EARTH TRUTH LAYER LIVE · SOURCE CATALOG BLOCKED');txt('#earthCount','0 observed identities · no substitution')}
 const H=X.hybrid||{};if(!H.pcOnline){txt('#hybridState','SOVEREIGN CONTROL LIVE · PC NOT PROVEN');txt('#heartbeatAge',H.heartbeatCurrent?'current heartbeat · '+String(H.heartbeatAgeSeconds??'—')+'s':'No current authenticated heartbeat');html('#flow',step('V6 CONTROL','LIVE','ok','canonical cloud control plane')+step('DEVICE CONTRACT','READY','ok','heartbeat-truth governed')+step('HEARTBEAT',H.heartbeatCurrent?'CURRENT':'NOT PROVEN',H.heartbeatCurrent?'ok':'warn','never synthesized')+step('PC CAPABILITY','NOT PROVEN','warn','requires authenticated heartbeat'));txt('#hybridProof',pretty({convergenceEvidenceAvailable:H.convergenceEvidenceAvailable,pcOnline:H.pcOnline,heartbeatCurrent:H.heartbeatCurrent,heartbeatAgeSeconds:H.heartbeatAgeSeconds,externalEndpoint:{available:H.available,httpStatus:H.httpStatus,code:H.code},boundary:d.boundary}))}
 if(L.proof?.verified){txt('#ledgerSummary',X.sovereignProof?.available?'Sovereign proof history available.':'Local evidence fabric live · sovereign proof history blocked.');txt('#ledgerProof',pretty({local:L.proof,sovereign:X.sovereignProof,boundary:d.boundary}))}
 if(L.recovery?.verified){txt('#restoreSummary',X.sovereignRestoration?.available?'Sovereign restoration state available.':'Local replay/recovery contract live · sovereign restoration state blocked.');txt('#restoreProof',pretty({local:L.recovery,sovereign:X.sovereignRestoration,boundary:d.boundary}))}
 if(L.convergence?.verified){txt('#healthSummary','Cloud runtime + convergence contract verified locally.');txt('#healthProof',pretty({local:L.convergence,summary:sum}))}
 const rail=$('#omegaR193Rail .r193HeadText small');if(rail)rail.textContent='R194 · '+sum.localVerified+'/'+sum.localTotal+' LOCAL · '+sum.externalAvailable+'/'+sum.externalTotal+' EXTERNAL';
}
async function load(){if(busy)return;busy=true;try{const r=await fetch('/api/workspace/r194/status',{cache:'no-store',headers:{accept:'application/json'}}),d=await r.json();if(r.ok)render(d)}catch{}finally{busy=false}}load();setTimeout(load,1200);setInterval(load,10000);
})();</script>`;

export async function enhanceEvidencePlaneR194(response: Response, pathname: string): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") || (pathname !== "/" && pathname !== "")) return response;
  let html = await response.text();
  if (html.includes('id="omegaEvidencePlaneR194Runtime"')) return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  html = html.includes("</body>") ? html.replace("</body>", rootScript + "</body>") : html + rootScript;
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-evidence-plane", EVIDENCE_PLANE_RELEASE_R194);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
