import { WORKSPACE_MANIFEST_R193 } from "../workspaceManifestR193";
import { EVIDENCE_PLANE_RELEASE_R194 } from "../evidencePlaneR194";
import {
  DRIVE_CORPUS_EVIDENCE_R195,
  DRIVE_CORPUS_SNAPSHOT_SHA256_R195,
  driveCorpusIntegrityR195,
  readDriveCorpusSnapshotR195,
} from "./driveCorpusSnapshotR195";

export const DRIVE_CORPUS_RELEASE_R195 = "r195-drive-corpus-one-system";
export const DRIVE_CORPUS_SCHEMA_R195 = "OMEGA_DRIVE_CORPUS_ONE_SYSTEM_R195";
export const MODE188_FORMULA_R195 = "S188=CΩ/(Λ+q+0.35Λq+0.05)";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type Row = Record<string, any>;

type TableSpec = {
  id: string;
  aliases: readonly string[];
  label: string;
  minimum: number;
};

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const TABLES: readonly TableSpec[] = [
  { id: "registry", aliases: ["registry", "softwareRegistry", "software_registry", "software"], label: "Software / Artifact Registry", minimum: 100 },
  { id: "menus", aliases: ["menus", "menuOptions", "menu_options", "menu"], label: "One-System Menu Options", minimum: 36 },
  { id: "capabilities", aliases: ["capabilities", "capabilityRows", "capability_rows", "capability"], label: "Capability Contract", minimum: 18 },
  { id: "stateSpaces", aliases: ["stateSpaces", "state_spaces", "statespaces", "stateSpace"], label: "State Spaces", minimum: 1 },
  { id: "growthSequence", aliases: ["growthSequence", "growth_sequence", "growth", "buildSequence", "build_sequence"], label: "Growth / Build Sequence", minimum: 1 },
  { id: "runtimeWiring", aliases: ["runtimeWiring", "runtime_wiring", "wiring", "runtime"], label: "Runtime Wiring", minimum: 16 },
  { id: "packageSetup", aliases: ["packageSetup", "package_setup", "packaging", "package"], label: "Package / Install Setup", minimum: 1 },
  { id: "acceptanceGates", aliases: ["acceptanceGates", "acceptance_gates", "gates", "proofGates", "proof_gates"], label: "Acceptance Gates", minimum: 12 },
  { id: "capacityAddressIndex", aliases: ["capacityAddressIndex", "capacity_address_index", "addressIndex", "address_index", "capacity"], label: "Capacity Address Index", minimum: 144 },
  { id: "implementationSequence", aliases: ["implementationSequence", "implementation_sequence", "implementation", "milestones"], label: "Implementation Sequence", minimum: 16 },
  { id: "upgradeMap", aliases: ["upgradeMap", "upgrade_map", "upgrades", "upgrade"], label: "Upgrade Map", minimum: 1 },
] as const;

const EXECUTION = {
  "relativity.event": { path: "/api/compute/relativity/event", role: "SPECIAL_RELATIVITY_EVENT_TRANSFORM" },
  "relativity.velocity": { path: "/api/compute/relativity/velocity", role: "RELATIVISTIC_VELOCITY_TRANSFORM" },
  "optics.tmm": { path: "/api/compute/optics/tmm", role: "REDUCED_ORDER_OPTICAL_SCREEN" },
  "continuity.transfer": { path: "/api/compute/continuity/transfer", role: "CONSERVATIVE_REDISTRIBUTION" },
  "continuity.diffusion": { path: "/api/compute/continuity/diffusion", role: "GRAPH_DIFFUSION" },
  "wave.fdtd1d": { path: "/api/compute/wave/fdtd1d", role: "SCALAR_WAVE_FDTD_1D" },
  "sai.query": { path: "/api/sai/query", role: "SOURCE_GROUNDED_B059_QUERY" },
  "ai.cloud": { path: "/api/intelligence/r179/cloud", role: "PROVIDER_AI_WITH_OPTIONAL_VERIFIED_B059_GROUNDING" },
  "ai.fuse": { path: "/api/intelligence/r179/fuse", role: "VERIFIED_B059_PLUS_PROVIDER_AI_FUSION" },
} as const;

type ExecutionKey = keyof typeof EXECUTION;

const PROBES = [
  ["CANONICAL_RUNTIME", "/_omega/health"],
  ["WORKSPACE_R193", "/api/workspace/r193/health"],
  ["EVIDENCE_PLANE_R194", "/api/workspace/r194/health"],
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

function nk(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function pick(row: Row, names: readonly string[]): any {
  const map = new Map(Object.entries(row).map(([key, value]) => [nk(key), value]));
  for (const name of names) {
    const value = map.get(nk(name));
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function numberOrNull(value: any): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function tableRows(snapshot: any, id: string): Row[] {
  const spec = TABLES.find(table => table.id === id);
  if (!spec || !snapshot || typeof snapshot !== "object") return [];
  const aliases = new Set(spec.aliases.map(nk));
  for (const [key, value] of Object.entries(snapshot)) {
    if (aliases.has(nk(key)) && Array.isArray(value)) return value as Row[];
  }
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
  return [...new Uint8Array(d)].map(value => value.toString(16).padStart(2, "0")).join("");
}

async function readBody(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { text: text.slice(0, 1600) };
  }
}

export function mode188DerivedR195(row: Row) {
  const continuity = numberOrNull(pick(row, ["Continuity", "CΩ", "C_Omega", "continuity_score"]));
  const burden = numberOrNull(pick(row, ["Burden", "Λ", "Lambda", "bridge_load", "load"]));
  const contradiction = numberOrNull(pick(row, ["Contradiction", "q", "contradiction_score"]));
  const sourceDecision = pick(row, ["Decision", "NextAction", "Triage", "Status"]);
  if (continuity === null || burden === null || contradiction === null) {
    return {
      applicable: false,
      formula: MODE188_FORMULA_R195,
      sourceDecision,
      reason: "SOURCE_METRICS_INCOMPLETE",
    };
  }
  const denominator = burden + contradiction + 0.35 * burden * contradiction + 0.05;
  const score = denominator > 0 ? continuity / denominator : null;
  return {
    applicable: score !== null,
    formula: MODE188_FORMULA_R195,
    inputs: { continuity, burden, contradiction },
    denominator,
    score,
    sourceDecision,
    boundary: "No STAY/TURN/ESCALATE threshold is invented when the source row does not define one.",
  };
}

function executionVerification(operation: ExecutionKey, result: any) {
  const payload = result?.result ?? result ?? {};
  if (operation === "continuity.transfer") {
    const before = numberOrNull(payload?.invariant_before);
    const after = numberOrNull(payload?.invariant_after);
    const residual = before !== null && after !== null ? Math.abs(after - before) : null;
    return {
      verified: residual !== null && residual <= 1e-12,
      class: "INVARIANT_CONSERVATION",
      residual,
      condition: "|invariant_after-invariant_before|<=1e-12",
    };
  }
  if (operation === "sai.query") {
    return {
      verified: result?.grounded === true && Boolean(result?.receipt_sha256),
      class: "SOURCE_GROUNDED_RECEIPT",
      grounded: result?.grounded === true,
      receiptPresent: Boolean(result?.receipt_sha256),
    };
  }
  const explicit = result?.verified === true || result?.verification?.ok === true || result?.receipt?.verified === true;
  return {
    verified: explicit,
    class: explicit ? "SPECIALIST_EXPLICIT_VERIFICATION" : "RETURNED_NOT_YET_INDEPENDENTLY_VERIFIED",
  };
}

async function manifest(env: any) {
  const [snapshot, integrity] = await Promise.all([readDriveCorpusSnapshotR195(), driveCorpusIntegrityR195()]);
  const summaries = TABLES.map(spec => {
    const rows = tableRows(snapshot, spec.id);
    return {
      id: spec.id,
      label: spec.label,
      rows: rows.length,
      minimum: spec.minimum,
      pass: rows.length >= spec.minimum,
      route: `/api/system/r195/${spec.id}`,
    };
  });
  const registry = tableRows(snapshot, "registry");
  const dispositions: Record<string, number> = {};
  for (const row of registry) {
    const key = String(pick(row, ["Disposition"]) || "UNSPECIFIED").toUpperCase();
    dispositions[key] = (dispositions[key] || 0) + 1;
  }
  const corpusContract = summaries.every(row => row.pass) && dispositions.KEEP === 63 && dispositions.MERGE === 26 && dispositions.DONOR === 11;
  return {
    ok: integrity.ok && corpusContract,
    schema: DRIVE_CORPUS_SCHEMA_R195,
    release: DRIVE_CORPUS_RELEASE_R195,
    predecessor: EVIDENCE_PLANE_RELEASE_R194,
    workspacePredecessor: WORKSPACE_MANIFEST_R193.release,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    corpus: {
      sha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R195,
      losslessSnapshot: true,
      integrity,
      driveEvidence: DRIVE_CORPUS_EVIDENCE_R195,
      tables: summaries,
      dispositions,
    },
    architecture: {
      authority: "SINGLE_CANONICAL_RUNTIME_SPINE_PLUS_TYPED_SPECIALIST_ORGANS",
      installTarget: "J:\\OMEGA_INSTALL\\OMEGA_ONE_SYSTEM",
      buildCells: 27648,
      buildCellFactorization: "24_FAMILIES_X_24_SUBSYSTEMS_X_12_PHASES_X_4_STREAMS",
      hierarchy: [12, 144, 1728, 20736, 248832],
      hierarchyBoundary: "atlas/address resolution levels; not literal physical dimensions",
      active1728: "12_DOMAINS_X_12_PHASES_X_12_REGULATION_STATES",
      truthTraversal20736: "12_LENSES_X_12_PHASES_X_12_REGULATIONS_X_12_SKINS",
      ultraAddressLedger: 61917364224,
      continuityOperator: ["partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"],
      mode188: MODE188_FORMULA_R195,
      referenceKernel: { values: [37, 73], boundary: "reference kernel/bias only; symmetry/asymmetry remain frame-relative" },
      orientation: "sigma in {-1,0,+1} factors orientation from structure",
    },
    truthBoundaries: {
      chartedIsNotExecuted: true,
      visualIsNotExecutionProof: true,
      returnedIsNotVerified: true,
      modelOutputIsNotCanonState: true,
      reducedOrderTmmIsNotFullWaveValidation: true,
      pcOnlineRequiresAuthenticatedHeartbeat: true,
      externalReachabilityIsNotWriteAuthority: true,
      donorRequiresAdmission: true,
    },
    execution: Object.fromEntries(Object.entries(EXECUTION).map(([key, value]) => [key, value])),
    routes: {
      cockpit: "/system",
      manifest: "/api/system/r195/manifest",
      status: "/api/system/r195/status",
      execute: "/api/system/r195/execute",
      analyze: "/api/system/r195/analyze",
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}

async function status(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const m = await manifest(env);
  const results = await Promise.all(PROBES.map(async ([id, path]) => {
    const target = new URL(request.url);
    target.pathname = path;
    target.search = "";
    const started = Date.now();
    try {
      const response = await canonicalFetch(new Request(target.toString(), { headers: { accept: "application/json" } }), env, ctx);
      const body = await readBody(response);
      return {
        id,
        path,
        status: response.status,
        ok: response.ok && body?.ok !== false,
        authority: body?.authority ?? body?.runtime?.role ?? null,
        revision: body?.revision ?? body?.release ?? body?.build ?? null,
        elapsedMs: Date.now() - started,
      };
    } catch (error) {
      return {
        id,
        path,
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        elapsedMs: Date.now() - started,
      };
    }
  }));
  const core = {
    schema: "OMEGA_ONE_SYSTEM_LIVE_STATUS_R195",
    release: DRIVE_CORPUS_RELEASE_R195,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    corpusReady: m.ok === true,
    runtimeReady: results.every(result => result.ok === true),
    probes: results,
    truth: {
      pcOnline: "requires current authenticated Sovereign heartbeat",
      fullWave: "requires independent solver receipt",
      externalPromotion: "requires project write authority + deployment receipt",
      returnedResult: "must remain distinct from verified result",
    },
    canonicalMutation: false,
  };
  return { ...core, ok: core.corpusReady && core.runtimeReady, receiptSha256: await digest(core) };
}

async function execute(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const body = await request.json().catch(() => ({})) as any;
  const operation = String(body.operation || "") as ExecutionKey;
  const target = EXECUTION[operation];
  if (!target) return json({ ok: false, code: "R195_OPERATION_NOT_ALLOWED", allowed: Object.keys(EXECUTION) }, 422);

  const input = body.input && typeof body.input === "object" ? { ...body.input } : {} as any;
  if (operation === "sai.query" || operation.startsWith("ai.")) input.prompt = String(body.prompt ?? input.prompt ?? input.message ?? "").trim();
  if ((operation === "sai.query" || operation.startsWith("ai.")) && !input.prompt) return json({ ok: false, code: "PROMPT_REQUIRED" }, 422);
  if (body.model) input.model = body.model;
  if (body.use_sai !== undefined) input.use_sai = body.use_sai;

  const targetUrl = new URL(request.url);
  targetUrl.pathname = target.path;
  targetUrl.search = "";
  const started = Date.now();
  const response = await canonicalFetch(new Request(targetUrl.toString(), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
  }), env, ctx);
  const result = await readBody(response);
  const verification = executionVerification(operation, result);
  const executionState = {
    discovered: true,
    authorized: true,
    available: response.status !== 404 && response.status !== 501,
    invoked: true,
    returned: true,
    verified: verification.verified,
    progression: [
      "DISCOVERED",
      "AUTHORIZED",
      response.status !== 404 && response.status !== 501 ? "AVAILABLE" : "UNAVAILABLE",
      "INVOKED",
      "RETURNED",
      verification.verified ? "VERIFIED" : "VERIFICATION_PENDING_OR_FAILED",
    ],
  };
  const core = {
    schema: "OMEGA_ONE_SYSTEM_EXECUTION_RECEIPT_R195",
    release: DRIVE_CORPUS_RELEASE_R195,
    operation,
    specialistRoute: target.path,
    specialistRole: target.role,
    downstreamStatus: response.status,
    downstreamOk: response.ok && result?.ok !== false,
    elapsedMs: Date.now() - started,
    executionState,
    verification,
    result,
    authority: "R195 routes to existing specialist authority; it does not replace it",
    canonicalMutation: false,
  };
  return json({ ...core, receiptSha256: await digest(core) }, response.ok ? 200 : response.status);
}

function systemHtml(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA ONE SYSTEM · R195</title><style>
:root{color-scheme:dark;--b:#071019;--p:#0c1622;--l:#2b4058;--t:#eaf1fa;--m:#8fa2b8;--a:#8bd8ff;--ok:#6be0a0;--warn:#e7c96e;--bad:#ff8585}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 20% 0,#15263c,#060a10 45%);color:var(--t);font:14px/1.45 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:24px}.hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.hero h1{font-size:clamp(30px,5vw,64px);line-height:.95;margin:6px 0}.muted{color:var(--m)}.badge,.btn,input,select,textarea{border:1px solid var(--l);background:#0a1420;color:var(--t);border-radius:9px;padding:9px}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;margin-top:16px}.card{grid-column:span 4;background:#0b1420dd;border:1px solid var(--l);border-radius:14px;padding:15px;min-width:0}.wide{grid-column:span 8}.full{grid-column:1/-1}.metric{font-size:30px;font-weight:900}.law{font-family:ui-monospace,monospace;color:var(--a)}.probe{display:grid;grid-template-columns:10px 1fr auto;gap:8px;padding:7px 0;border-bottom:1px solid #1d2a39}.dot{width:9px;height:9px;border-radius:50%;background:var(--bad)}.dot.ok{background:var(--ok)}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}textarea{min-height:140px;width:100%}select,input{width:100%}.btn{cursor:pointer}pre{max-height:440px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:#05090e;border:1px solid var(--l);padding:12px;border-radius:9px}.tabs{display:flex;gap:6px;overflow:auto}.tablewrap{overflow:auto;max-height:520px;border:1px solid var(--l);border-radius:9px;margin-top:8px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:8px;border-bottom:1px solid #1d2a39;text-align:left;vertical-align:top;max-width:360px;word-break:break-word}th{position:sticky;top:0;background:#101c29}.truth{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.truth div{padding:10px;border:1px solid var(--l);border-radius:9px;background:#08111a}@media(max-width:850px){main{padding:14px}.hero{display:block}.card,.wide{grid-column:1/-1}.row,.truth{grid-template-columns:1fr}}
</style></head><body><main><section class="hero"><div><div class="muted">R195 · Drive corpus + R193 workspace + R194 evidence plane + live specialist execution</div><h1>OMEGA ONE SYSTEM</h1><p class="muted">Recovered data, applied calculus, execution state, verification receipts and predecessor evidence are separated instead of flattened into one completion claim.</p></div><div class="badge" id="overall">PROBING</div></section><section class="grid">
<div class="card"><div class="muted">Drive registry</div><div class="metric" id="reg">—</div><div>63 KEEP · 26 MERGE · 11 DONOR</div></div><div class="card"><div class="muted">Build lattice</div><div class="metric">27,648</div><div>24×24×12×4 cells</div></div><div class="card"><div class="muted">Atlas hierarchy</div><div class="metric">12→20,736</div><div>through 144 and 1,728; address resolution, not physical dimensions</div></div>
<div class="card wide"><b>LIVE ORGAN PROOF</b><div id="probes" class="muted">Loading…</div></div><div class="card"><b>APPLIED MODE 188</b><p class="law">S188=CΩ/(Λ+q+0.35Λq+0.05)</p><p class="muted">Calculated only when those source metrics exist. Source decisions remain authoritative.</p></div>
<div class="card full"><b>EXECUTION TRUTH CONSOLE</b><div class="row"><select id="op"><option value="sai.query">SAI grounded query</option><option value="ai.fuse">AI + SAI fusion</option><option value="ai.cloud">Cloud AI</option><option value="relativity.event">Relativity event</option><option value="relativity.velocity">Relativity velocity</option><option value="optics.tmm">Optical TMM screen</option><option value="continuity.transfer">Continuity transfer</option><option value="continuity.diffusion">Graph diffusion</option><option value="wave.fdtd1d">Scalar-wave FDTD 1D</option></select><textarea id="payload" placeholder="Prompt for AI/SAI, or JSON object for compute"></textarea></div><button class="btn" id="run">EXECUTE + RETURN STATE/RECEIPT</button><pre id="result">No execution yet.</pre></div>
<div class="card full"><b>RECOVERED DRIVE CORPUS</b><div class="tabs" id="tabs"></div><div class="row" style="margin-top:8px"><input id="q" placeholder="Search current table"><button class="btn" id="analyze">APPLY MODE 188 WHERE SUPPORTED</button></div><div id="meta" class="muted"></div><div class="tablewrap"><table id="table"></table></div></div>
<div class="card full"><b>TRUTH BOUNDARIES</b><div class="truth"><div>CHARTED ≠ EXECUTED</div><div>RETURNED ≠ VERIFIED</div><div>MODEL OUTPUT ≠ CANON STATE</div><div>PC ONLINE REQUIRES HEARTBEAT</div><div>TMM ≠ FULL-WAVE FABRICATION PROOF</div><div>DONOR ≠ AUTHORITY WITHOUT ADMISSION</div></div></div>
</section></main><script>
const tables=${JSON.stringify(TABLES.map(spec=>spec.id))};let current='registry';const $=id=>document.getElementById(id);const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function j(url,opts){const r=await fetch(url,opts);const t=await r.text();try{return JSON.parse(t)}catch{return{text:t}}}function render(d){$('meta').textContent=(d.label||d.table||current)+' · '+d.matched+' / '+d.total;const rows=d.rows||[];if(!rows.length){$('table').innerHTML='<tr><td>No rows</td></tr>';return}const keys=[...new Set(rows.flatMap(x=>Object.keys(x)))];$('table').innerHTML='<thead><tr>'+keys.map(k=>'<th>'+esc(k)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+keys.map(k=>'<td>'+esc(typeof r[k]==='object'?JSON.stringify(r[k]):r[k])+'</td>').join('')+'</tr>').join('')+'</tbody>'}async function load(){render(await j('/api/system/r195/'+current+'?limit=100&q='+encodeURIComponent($('q').value)))}
$('tabs').innerHTML=tables.map(x=>'<button class="btn" data-id="'+x+'">'+x+'</button>').join('');$('tabs').onclick=e=>{if(e.target.dataset.id){current=e.target.dataset.id;load()}};$('q').oninput=()=>load();$('analyze').onclick=async()=>{const d=await j('/api/system/r195/analyze?table='+current+'&limit=100&q='+encodeURIComponent($('q').value));render({label:'Mode188 '+current,matched:d.matched,total:d.total,rows:(d.rows||[]).map(x=>({...x.row,Mode188Score:x.mode188?.score,Mode188Applicable:x.mode188?.applicable,SourceDecision:x.mode188?.sourceDecision}))})};
$('run').onclick=async()=>{const op=$('op').value,raw=$('payload').value.trim();let body={operation:op};if(op.startsWith('ai.')||op==='sai.query')body.prompt=raw;else{try{body.input=raw?JSON.parse(raw):{}}catch{$('result').textContent='Compute input must be valid JSON.';return}}$('result').textContent='Executing…';$('result').textContent=JSON.stringify(await j('/api/system/r195/execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),null,2)};
async function boot(){const m=await j('/api/system/r195/manifest');$('reg').textContent=(m.corpus?.tables||[]).find(x=>x.id==='registry')?.rows??'—';const s=await j('/api/system/r195/status');$('overall').textContent=s.ok?'CORE + CORPUS VERIFIED':'PARTIAL / PROOF HOLD';$('probes').innerHTML=(s.probes||[]).map(p=>'<div class="probe"><span class="dot '+(p.ok?'ok':'')+'"></span><span>'+esc(p.id)+'<div class="muted">'+esc(p.path)+'</div></span><span>'+esc(p.status)+'</span></div>').join('');load()}boot();setInterval(boot,30000);
</script></body></html>`;
}

export async function handleDriveCorpusSystemR195(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (path !== "/system" && !path.startsWith("/api/system/r195")) return null;
  if (request.method === "OPTIONS") return json(null, 204);
  try {
    if (path === "/system" && request.method === "GET") return new Response(systemHtml(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    if (path === "/api/system/r195/manifest" && request.method === "GET") return json(await manifest(env));
    if (path === "/api/system/r195/status" && request.method === "GET") return json(await status(request, env, ctx, canonicalFetch));
    if (path === "/api/system/r195/execute" && request.method === "POST") return execute(request, env, ctx, canonicalFetch);
    if (path === "/api/system/r195/analyze" && request.method === "GET") {
      const table = url.searchParams.get("table") || "registry";
      const spec = TABLES.find(candidate => candidate.id === table);
      if (!spec) return json({ ok: false, code: "R195_TABLE_NOT_FOUND", tables: TABLES.map(candidate => candidate.id) }, 404);
      const rows = tableRows(await readDriveCorpusSnapshotR195(), table);
      const p = page(rows, url);
      return json({
        ok: true,
        schema: "OMEGA_APPLIED_CALCULUS_ANALYSIS_R195",
        table,
        label: spec.label,
        formula: MODE188_FORMULA_R195,
        ...p,
        rows: p.rows.map((row, index) => ({ corpusIndex: p.offset + index, row, mode188: mode188DerivedR195(row) })),
        canonicalMutation: false,
      });
    }
    const id = path.startsWith("/api/system/r195/") ? path.slice("/api/system/r195/".length) : "";
    const spec = TABLES.find(candidate => candidate.id === id);
    if (request.method === "GET" && spec) {
      const rows = tableRows(await readDriveCorpusSnapshotR195(), id);
      return json({
        ok: true,
        schema: "OMEGA_DRIVE_CORPUS_TABLE_R195",
        table: id,
        label: spec.label,
        corpusSha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R195,
        ...page(rows, url),
        canonicalMutation: false,
      });
    }
    return json({
      ok: false,
      code: "R195_SYSTEM_ROUTE_NOT_FOUND",
      routes: ["/system", "/api/system/r195/manifest", "/api/system/r195/status", "/api/system/r195/execute", "/api/system/r195/analyze", ...TABLES.map(spec => `/api/system/r195/${spec.id}`)],
    }, 404);
  } catch (error) {
    return json({
      ok: false,
      code: "R195_SYSTEM_FAILURE",
      error: error instanceof Error ? error.message : String(error),
      corpusSha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R195,
      canonicalMutation: false,
    }, 500);
  }
}
