import { WORKSPACE_MANIFEST_R193 } from "../workspaceManifestR193";
import { DRIVE_CORPUS_SNAPSHOT_SHA256_R194, driveCorpusIntegrityR194, readDriveCorpusSnapshotR194 } from "./driveCorpusSnapshotR194";

export const DRIVE_CORPUS_RELEASE_R194 = "r194-drive-corpus-one-system";
export const DRIVE_CORPUS_SCHEMA_R194 = "OMEGA_DRIVE_CORPUS_ONE_SYSTEM_R194";
export const MODE188_FORMULA_R194 = "S188=CΩ/(Λ+q+0.35Λq+0.05)";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type Row = Record<string, any>;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const TABLES = [
  ["registry", ["registry","softwareRegistry","software_registry","software"], 100],
  ["menus", ["menus","menuOptions","menu_options","menu"], 36],
  ["capabilities", ["capabilities","capabilityRows","capability_rows","capability"], 18],
  ["stateSpaces", ["stateSpaces","state_spaces","statespaces","stateSpace"], 1],
  ["growthSequence", ["growthSequence","growth_sequence","growth","buildSequence","build_sequence"], 1],
  ["runtimeWiring", ["runtimeWiring","runtime_wiring","wiring","runtime"], 16],
  ["packageSetup", ["packageSetup","package_setup","packaging","package"], 1],
  ["acceptanceGates", ["acceptanceGates","acceptance_gates","gates","proofGates","proof_gates"], 12],
  ["capacityAddressIndex", ["capacityAddressIndex","capacity_address_index","addressIndex","address_index","capacity"], 144],
  ["implementationSequence", ["implementationSequence","implementation_sequence","implementation","milestones"], 16],
  ["upgradeMap", ["upgradeMap","upgrade_map","upgrades","upgrade"], 1],
] as const;

const EXECUTION = {
  "relativity.event": ["/api/compute/relativity/event", "SPECIAL_RELATIVITY_EVENT_TRANSFORM"],
  "relativity.velocity": ["/api/compute/relativity/velocity", "RELATIVISTIC_VELOCITY_TRANSFORM"],
  "optics.tmm": ["/api/compute/optics/tmm", "REDUCED_ORDER_OPTICAL_SCREEN"],
  "continuity.transfer": ["/api/compute/continuity/transfer", "CONSERVATIVE_REDISTRIBUTION"],
  "continuity.diffusion": ["/api/compute/continuity/diffusion", "GRAPH_DIFFUSION"],
  "wave.fdtd1d": ["/api/compute/wave/fdtd1d", "SCALAR_WAVE_FDTD_1D"],
  "sai.query": ["/api/sai/query", "SOURCE_GROUNDED_B059_QUERY"],
  "ai.cloud": ["/api/intelligence/r179/cloud", "PROVIDER_AI_WITH_OPTIONAL_VERIFIED_B059_GROUNDING"],
  "ai.fuse": ["/api/intelligence/r179/fuse", "VERIFIED_B059_PLUS_PROVIDER_AI_FUSION"],
} as const;

type ExecutionKey = keyof typeof EXECUTION;

const PROBES = [
  ["CANONICAL_RUNTIME", "/_omega/health"],
  ["WORKSPACE_R193", "/api/workspace/r193/health"],
  ["CUMULATIVE_CANON_R191", "/api/canon/r191/manifest"],
  ["WHOLE_SYSTEM_ACCEPTANCE_R190", "/api/acceptance/r190/manifest"],
  ["COMPUTE_R170", "/api/compute/manifest"],
  ["SAI_B059", "/api/sai/manifest"],
  ["AI_SAI_R179", "/api/intelligence/r179/manifest"],
  ["FEDERATION_R174", "/api/federation/r174/health"],
  ["CLOUD_SWARM_R185", "/api/clouds/r185/manifest"],
  ["SURFACE_FABRIC_R191", "/api/fabric/r191/manifest"],
] as const;

function json(value: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(value, null, 2), { status, headers: HEADERS });
}
function nk(value: string): string { return value.replace(/[^a-z0-9]/gi, "").toLowerCase(); }
function pick(row: Row, names: string[]): any {
  const map = new Map(Object.entries(row).map(([k,v]) => [nk(k),v]));
  for (const name of names) { const value = map.get(nk(name)); if (value !== undefined && value !== null && value !== "") return value; }
  return null;
}
function numberOrNull(value: any): number | null { const n = Number(value); return Number.isFinite(n) ? n : null; }
function tableRows(snapshot: any, id: string): Row[] {
  const spec = TABLES.find(([table]) => table === id);
  if (!spec || !snapshot || typeof snapshot !== "object") return [];
  const aliases = new Set(spec[1].map(nk));
  for (const [key,value] of Object.entries(snapshot)) if (aliases.has(nk(key)) && Array.isArray(value)) return value as Row[];
  return [];
}
function page(rows: Row[], url: URL) {
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const offset = Math.max(0, Math.trunc(Number(url.searchParams.get("offset") || 0) || 0));
  const limit = Math.min(500, Math.max(1, Math.trunc(Number(url.searchParams.get("limit") || 50) || 50));
  const matches = q ? rows.filter(row => JSON.stringify(row).toLowerCase().includes(q)) : rows;
  return { total: rows.length, matched: matches.length, offset, limit, rows: matches.slice(offset, offset + limit) };
}
async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2,"0")).join("");
}
async function readBody(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { text: text.slice(0,1600) }; }
}

export function mode188DerivedR194(row: Row) {
  const continuity = numberOrNull(pick(row,["Continuity","CΩ","C_Omega","continuity_score"]));
  const burden = numberOrNull(pick(row,["Burden","Λ","Lambda","bridge_load","load"]));
  const contradiction = numberOrNull(pick(row,["Contradiction","q","contradiction_score"]));
  const sourceDecision = pick(row,["Decision","NextAction","Triage","Status"]);
  if (continuity === null || burden === null || contradiction === null) return { applicable:false, formula:MODE188_FORMULA_R194, sourceDecision, reason:"SOURCE_METRICS_INCOMPLETE" };
  const denominator = burden + contradiction + 0.35 * burden * contradiction + 0.05;
  const score = denominator > 0 ? continuity / denominator : null;
  return { applicable:score !== null, formula:MODE188_FORMULA_R194, inputs:{continuity,burden,contradiction}, denominator, score, sourceDecision, boundary:"No STAY/TURN/ESCALATE threshold is invented when the source row does not define one." };
}

async function manifest(env: any) {
  const [snapshot, integrity] = await Promise.all([readDriveCorpusSnapshotR194(), driveCorpusIntegrityR194()]);
  const summaries = TABLES.map(([id,,minimum]) => { const rows=tableRows(snapshot,id); return { id, rows:rows.length, minimum, pass:rows.length>=minimum, route:`/api/system/r194/${id}` }; });
  const registry = tableRows(snapshot,"registry");
  const dispositions: Record<string,number> = {};
  for (const row of registry) { const key=String(pick(row,["Disposition"]) || "UNSPECIFIED").toUpperCase(); dispositions[key]=(dispositions[key]||0)+1; }
  const corpusContract = summaries.every(row => row.pass) && dispositions.KEEP === 63 && dispositions.MERGE === 26 && dispositions.DONOR === 11;
  return {
    ok: integrity.ok && corpusContract,
    schema: DRIVE_CORPUS_SCHEMA_R194,
    release: DRIVE_CORPUS_RELEASE_R194,
    predecessor: WORKSPACE_MANIFEST_R193.release,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    corpus:{ sha256:DRIVE_CORPUS_SNAPSHOT_SHA256_R194, losslessSnapshot:true, integrity, tables:summaries, dispositions },
    architecture:{
      authority:"SINGLE_CANONICAL_RUNTIME_SPINE_PLUS_TYPED_SPECIALIST_ORGANS",
      installTarget:"J:\\OMEGA_INSTALL\\OMEGA_ONE_SYSTEM",
      buildCells:27648,
      buildCellFactorization:"24_FAMILIES_X_24_SUBSYSTEMS_X_12_PHASES_X_4_STREAMS",
      hierarchy:[12,144,1728,20736,248832],
      hierarchyBoundary:"atlas/address resolution levels; not literal physical dimensions",
      active1728:"12_DOMAINS_X_12_PHASES_X_12_REGULATION_STATES",
      truthTraversal20736:"12_LENSES_X_12_PHASES_X_12_REGULATIONS_X_12_SKINS",
      ultraAddressLedger:61917364224,
      continuityOperator:["partition","exchange/transform","invariant carry","scar/residual carry","re-contextualize/repartition"],
      mode188:MODE188_FORMULA_R194,
      referenceKernel:{values:[37,73],boundary:"reference kernel/bias only; symmetry/asymmetry remain frame-relative"},
      orientation:"sigma in {-1,0,+1} factors orientation from structure",
    },
    truthBoundaries:{
      chartedIsNotExecuted:true, visualIsNotExecutionProof:true, modelOutputIsNotCanonState:true,
      reducedOrderTmmIsNotFullWaveValidation:true, pcOnlineRequiresAuthenticatedHeartbeat:true,
      externalReachabilityIsNotWriteAuthority:true, donorRequiresAdmission:true,
    },
    execution:Object.fromEntries(Object.entries(EXECUTION).map(([key,[path,role]])=>[key,{path,role}])),
    routes:{ cockpit:"/system", manifest:"/api/system/r194/manifest", status:"/api/system/r194/status", execute:"/api/system/r194/execute", analyze:"/api/system/r194/analyze" },
    canonicalMutation:false,
  };
}

async function status(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const m = await manifest(env);
  const results = await Promise.all(PROBES.map(async ([id,path]) => {
    const target = new URL(request.url); target.pathname=path; target.search=""; const started=Date.now();
    try { const response=await canonicalFetch(new Request(target.toString(),{headers:{accept:"application/json"}}),env,ctx); const body=await readBody(response); return {id,path,status:response.status,ok:response.ok && body?.ok!==false,authority:body?.authority??body?.runtime?.role??null,revision:body?.revision??body?.release??body?.build??null,elapsedMs:Date.now()-started}; }
    catch(error){ return {id,path,status:0,ok:false,error:error instanceof Error?error.message:String(error),elapsedMs:Date.now()-started}; }
  }));
  const core={schema:"OMEGA_ONE_SYSTEM_LIVE_STATUS_R194",release:DRIVE_CORPUS_RELEASE_R194,canonicalGitSha:env?.CANONICAL_GIT_SHA??null,corpusReady:m.ok===true,runtimeReady:results.every(x=>x.ok===true),probes:results,truth:{pcOnline:"requires current authenticated Sovereign heartbeat",fullWave:"requires independent solver receipt",externalPromotion:"requires project write authority + deployment receipt"},canonicalMutation:false};
  return {...core,ok:core.corpusReady&&core.runtimeReady,receiptSha256:await digest(core)};
}

async function execute(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const body=await request.json().catch(()=>({})) as any;
  const operation=String(body.operation||"") as ExecutionKey;
  const target=EXECUTION[operation];
  if(!target) return json({ok:false,code:"R194_OPERATION_NOT_ALLOWED",allowed:Object.keys(EXECUTION)},422);
  const [path,role]=target;
  const input=body.input&&typeof body.input==="object"?{...body.input}:{} as any;
  if(operation==="sai.query"||operation.startsWith("ai.")) input.prompt=String(body.prompt??input.prompt??input.message??"").trim();
  if((operation==="sai.query"||operation.startsWith("ai."))&&!input.prompt) return json({ok:false,code:"PROMPT_REQUIRED"},422);
  if(body.model) input.model=body.model;
  if(body.use_sai!==undefined) input.use_sai=body.use_sai;
  const url=new URL(request.url);url.pathname=path;url.search="";const started=Date.now();
  const response=await canonicalFetch(new Request(url.toString(),{method:"POST",headers:{"content-type":"application/json",accept:"application/json"},body:JSON.stringify(input)}),env,ctx);
  const result=await readBody(response);
  const core={schema:"OMEGA_ONE_SYSTEM_EXECUTION_RECEIPT_R194",release:DRIVE_CORPUS_RELEASE_R194,operation,specialistRoute:path,specialistRole:role,downstreamStatus:response.status,downstreamOk:response.ok&&result?.ok!==false,elapsedMs:Date.now()-started,result,authority:"R194 routes to existing specialist authority; it does not replace it",canonicalMutation:false};
  return json({...core,receiptSha256:await digest(core)},response.ok?200:response.status);
}

function html(): string { return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA ONE SYSTEM · R194</title><style>
:root{color-scheme:dark;--b:#071019;--p:#0c1622;--l:#2b4058;--t:#eaf1fa;--m:#8fa2b8;--a:#8bd8ff;--ok:#6be0a0;--bad:#ff8585}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 20% 0,#15263c,#060a10 45%);color:var(--t);font:14px/1.45 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:24px}.hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.hero h1{font-size:clamp(30px,5vw,64px);line-height:.95;margin:6px 0}.muted{color:var(--m)}.badge,.btn,input,select,textarea{border:1px solid var(--l);background:#0a1420;color:var(--t);border-radius:9px;padding:9px}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;margin-top:16px}.card{grid-column:span 4;background:#0b1420dd;border:1px solid var(--l);border-radius:14px;padding:15px;min-width:0}.wide{grid-column:span 8}.full{grid-column:1/-1}.metric{font-size:30px;font-weight:900}.law{font-family:ui-monospace,monospace;color:var(--a)}.probe{display:grid;grid-template-columns:10px 1fr auto;gap:8px;padding:7px 0;border-bottom:1px solid #1d2a39}.dot{width:9px;height:9px;border-radius:50%;background:var(--bad)}.dot.ok{background:var(--ok)}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}textarea{min-height:140px;width:100%}select,input{width:100%}.btn{cursor:pointer}pre{max-height:440px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:#05090e;border:1px solid var(--l);padding:12px;border-radius:9px}.tabs{display:flex;gap:6px;overflow:auto}.tablewrap{overflow:auto;max-height:520px;border:1px solid var(--l);border-radius:9px;margin-top:8px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:8px;border-bottom:1px solid #1d2a39;text-align:left;vertical-align:top;max-width:360px;word-break:break-word}th{position:sticky;top:0;background:#101c29}@media(max-width:850px){main{padding:14px}.hero{display:block}.card,.wide{grid-column:1/-1}.row{grid-template-columns:1fr}}
</style></head><body><main><section class="hero"><div><div class="muted">R194 · Drive corpus + R193 workspace + live specialist execution</div><h1>OMEGA ONE SYSTEM</h1><p class="muted">A recovered-data control plane bound to the existing Canon. What is charted, implemented, executed, verified and promoted are reported separately.</p></div><div class="badge" id="overall">PROBING</div></section><section class="grid">
<div class="card"><div class="muted">Drive registry</div><div class="metric" id="reg">—</div><div>63 KEEP · 26 MERGE · 11 DONOR</div></div><div class="card"><div class="muted">Build lattice</div><div class="metric">27,648</div><div>24×24×12×4 cells</div></div><div class="card"><div class="muted">Atlas hierarchy</div><div class="metric">12→20,736</div><div>through 144 and 1,728; address resolution, not physical dimensions</div></div>
<div class="card wide"><b>LIVE ORGAN PROOF</b><div id="probes" class="muted">Loading…</div></div><div class="card"><b>APPLIED MODE 188</b><p class="law">S188=CΩ/(Λ+q+0.35Λq+0.05)</p><p class="muted">Calculated only when those source metrics exist. Source decisions remain authoritative.</p></div>
<div class="card full"><b>EXECUTE EXISTING SPECIALIST ORGANS</b><div class="row"><select id="op"><option value="sai.query">SAI grounded query</option><option value="ai.fuse">AI + SAI fusion</option><option value="ai.cloud">Cloud AI</option><option value="relativity.event">Relativity event</option><option value="relativity.velocity">Relativity velocity</option><option value="optics.tmm">Optical TMM screen</option><option value="continuity.transfer">Continuity transfer</option><option value="continuity.diffusion">Graph diffusion</option><option value="wave.fdtd1d">Scalar-wave FDTD 1D</option></select><textarea id="payload" placeholder="Prompt for AI/SAI, or JSON object for compute"></textarea></div><button class="btn" id="run">EXECUTE + RETURN RECEIPT</button><pre id="result">No execution yet.</pre></div>
<div class="card full"><b>RECOVERED DRIVE CORPUS</b><div class="tabs" id="tabs"></div><div class="row" style="margin-top:8px"><input id="q" placeholder="Search current table"><button class="btn" id="analyze">APPLY MODE 188 WHERE SUPPORTED</button></div><div id="meta" class="muted"></div><div class="tablewrap"><table id="table"></table></div></div>
<div class="card full"><b>BOUNDARIES</b><p class="muted">PC ONLINE remains gated by a current authenticated Sovereign heartbeat. TMM screening is not fabrication-grade RCWA/FDTD/FEM validation. External URL reachability is not deployment authority. Model output is not CanonState. Donor code is not admitted authority without proof.</p></div>
</section></main><script>
const tables=${JSON.stringify(TABLES.map(([id])=>id))};let current='registry';const $=id=>document.getElementById(id);const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function j(url,opts){const r=await fetch(url,opts);const t=await r.text();try{return JSON.parse(t)}catch{return{text:t}}}function render(d){$('meta').textContent=(d.label||d.table||current)+' · '+d.matched+' / '+d.total;const rows=d.rows||[];if(!rows.length){$('table').innerHTML='<tr><td>No rows</td></tr>';return}const keys=[...new Set(rows.flatMap(x=>Object.keys(x)))];$('table').innerHTML='<thead><tr>'+keys.map(k=>'<th>'+esc(k)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+keys.map(k=>'<td>'+esc(typeof r[k]==='object'?JSON.stringify(r[k]):r[k])+'</td>').join('')+'</tr>').join('')+'</tbody>'}async function load(){render(await j('/api/system/r194/'+current+'?limit=100&q='+encodeURIComponent($('q').value)))}
$('tabs').innerHTML=tables.map(x=>'<button class="btn" data-id="'+x+'">'+x+'</button>').join('');$('tabs').onclick=e=>{if(e.target.dataset.id){current=e.target.dataset.id;load()}};$('q').oninput=()=>load();$('analyze').onclick=async()=>{const d=await j('/api/system/r194/analyze?table='+current+'&limit=100&q='+encodeURIComponent($('q').value));render({label:'Mode188 '+current,matched:d.matched,total:d.total,rows:(d.rows||[]).map(x=>({...x.row,Mode188Score:x.mode188?.score,Mode188Applicable:x.mode188?.applicable,SourceDecision:x.mode188?.sourceDecision}))})};
$('run').onclick=async()=>{const op=$('op').value,raw=$('payload').value.trim();let body={operation:op};if(op.startsWith('ai.')||op==='sai.query')body.prompt=raw;else{try{body.input=raw?JSON.parse(raw):{}}catch{$('result').textContent='Compute input must be valid JSON.';return}}$('result').textContent='Executing…';$('result').textContent=JSON.stringify(await j('/api/system/r194/execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),null,2)};
async function boot(){const m=await j('/api/system/r194/manifest');$('reg').textContent=(m.corpus?.tables||[]).find(x=>x.id==='registry')?.rows??'—';const s=await j('/api/system/r194/status');$('overall').textContent=s.ok?'CORE + CORPUS VERIFIED':'PARTIAL / PROOF HOLD';$('probes').innerHTML=(s.probes||[]).map(p=>'<div class="probe"><span class="dot '+(p.ok?'ok':'')+'"></span><span>'+esc(p.id)+'<div class="muted">'+esc(p.path)+'</div></span><span>'+esc(p.status)+'</span></div>').join('');load()}boot();setInterval(boot,30000);
</script></body></html>`; }

export async function handleDriveCorpusSystemR194(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url=new URL(request.url), path=url.pathname.replace(/\/$/,"")||"/";
  if(path!=="/system"&&!path.startsWith("/api/system/r194")) return null;
  if(request.method==="OPTIONS") return json(null,204);
  try{
    if(path==="/system"&&request.method==="GET") return new Response(html(),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
    if(path==="/api/system/r194/manifest"&&request.method==="GET") return json(await manifest(env));
    if(path==="/api/system/r194/status"&&request.method==="GET") return json(await status(request,env,ctx,canonicalFetch));
    if(path==="/api/system/r194/execute"&&request.method==="POST") return execute(request,env,ctx,canonicalFetch);
    if(path==="/api/system/r194/analyze"&&request.method==="GET"){
      const table=url.searchParams.get("table")||"registry";const rows=tableRows(await readDriveCorpusSnapshotR194(),table);const p=page(rows,url);return json({ok:true,schema:"OMEGA_APPLIED_CALCULUS_ANALYSIS_R194",table,formula:MODE188_FORMULA_R194,...p,rows:p.rows.map((row,index)=>({corpusIndex:p.offset+index,row,mode188:mode188DerivedR194(row)})),canonicalMutation:false});
    }
    const id=path.startsWith("/api/system/r194/")?path.slice("/api/system/r194/".length):"";
    if(request.method==="GET"&&TABLES.some(([table])=>table===id)){const rows=tableRows(await readDriveCorpusSnapshotR194(),id);return json({ok:true,schema:"OMEGA_DRIVE_CORPUS_TABLE_R194",table:id,corpusSha256:DRIVE_CORPUS_SNAPSHOT_SHA256_R194,...page(rows,url),canonicalMutation:false});}
    return json({ok:false,code:"R194_SYSTEM_ROUTE_NOT_FOUND",routes:["/system","/api/system/r194/manifest","/api/system/r194/status","/api/system/r194/execute","/api/system/r194/analyze",...TABLES.map(([id])=>`/api/system/r194/${id}`)]},404);
  }catch(error){return json({ok:false,code:"R194_SYSTEM_FAILURE",error:error instanceof Error?error.message:String(error),corpusSha256:DRIVE_CORPUS_SNAPSHOT_SHA256_R194,canonicalMutation:false},500)}
}
