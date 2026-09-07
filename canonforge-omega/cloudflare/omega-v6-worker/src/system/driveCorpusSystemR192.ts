import {
  DRIVE_CORPUS_SNAPSHOT_SHA256_R192,
  driveCorpusIntegrityR192,
  readDriveCorpusSnapshotR192,
} from "./driveCorpusSnapshotR192";

export const DRIVE_CORPUS_RELEASE_R192 = "r192-drive-corpus-one-system";
export const DRIVE_CORPUS_SCHEMA_R192 = "OMEGA_DRIVE_CORPUS_ONE_SYSTEM_R192";
export const MODE188_FORMULA_R192 = "S188=CΩ/(Λ+q+0.35Λq+0.05)";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type Row = Record<string, any>;

type CorpusTable = {
  id: string;
  aliases: string[];
  label: string;
  expectedMinimum?: number;
};

const CORPUS_TABLES: readonly CorpusTable[] = [
  { id: "registry", aliases: ["registry", "softwareRegistry", "software_registry"], label: "Software / Artifact Registry", expectedMinimum: 100 },
  { id: "menus", aliases: ["menus", "menuOptions", "menu_options"], label: "One-System Menu Options", expectedMinimum: 36 },
  { id: "capabilities", aliases: ["capabilities", "capabilityRows", "capability_rows"], label: "Capability Contract", expectedMinimum: 18 },
  { id: "stateSpaces", aliases: ["stateSpaces", "state_spaces", "statespaces"], label: "State Spaces" },
  { id: "growthSequence", aliases: ["growthSequence", "growth_sequence", "growth"], label: "Growth / Build Sequence" },
  { id: "runtimeWiring", aliases: ["runtimeWiring", "runtime_wiring", "wiring"], label: "Runtime Wiring", expectedMinimum: 16 },
  { id: "packageSetup", aliases: ["packageSetup", "package_setup", "packaging"], label: "Package / Install Setup" },
  { id: "acceptanceGates", aliases: ["acceptanceGates", "acceptance_gates", "gates"], label: "Acceptance Gates", expectedMinimum: 12 },
  { id: "capacityAddressIndex", aliases: ["capacityAddressIndex", "capacity_address_index", "addressIndex", "address_index"], label: "Capacity Address Index", expectedMinimum: 144 },
  { id: "implementationSequence", aliases: ["implementationSequence", "implementation_sequence", "implementation"], label: "Implementation Sequence", expectedMinimum: 16 },
  { id: "upgradeMap", aliases: ["upgradeMap", "upgrade_map", "upgrades"], label: "Upgrade Map" },
] as const;

const EXECUTION_TARGETS: Readonly<Record<string, { path: string; method: "POST"; role: string }>> = {
  "relativity.event": { path: "/api/compute/relativity/event", method: "POST", role: "SPECIAL_RELATIVITY_EVENT_TRANSFORM" },
  "relativity.velocity": { path: "/api/compute/relativity/velocity", method: "POST", role: "RELATIVISTIC_VELOCITY_TRANSFORM" },
  "optics.tmm": { path: "/api/compute/optics/tmm", method: "POST", role: "REDUCED_ORDER_OPTICAL_SCREEN" },
  "continuity.transfer": { path: "/api/compute/continuity/transfer", method: "POST", role: "CONSERVATIVE_REDISTRIBUTION" },
  "continuity.diffusion": { path: "/api/compute/continuity/diffusion", method: "POST", role: "GRAPH_DIFFUSION" },
  "wave.fdtd1d": { path: "/api/compute/wave/fdtd1d", method: "POST", role: "SCALAR_WAVE_FDTD_1D" },
  "sai.query": { path: "/api/sai/query", method: "POST", role: "SOURCE_GROUNDED_B059_QUERY" },
  "ai.cloud": { path: "/api/intelligence/r179/cloud", method: "POST", role: "PROVIDER_AI_WITH_OPTIONAL_VERIFIED_B059_GROUNDING" },
  "ai.fuse": { path: "/api/intelligence/r179/fuse", method: "POST", role: "VERIFIED_B059_PLUS_PROVIDER_AI_FUSION" },
};

const STATUS_PROBES = [
  { id: "CANONICAL_RUNTIME", path: "/_omega/health", required: true },
  { id: "CUMULATIVE_CANON_R191", path: "/api/canon/r191/manifest", required: true },
  { id: "WHOLE_SYSTEM_ACCEPTANCE_R190", path: "/api/acceptance/r190/manifest", required: true },
  { id: "COMPUTE_R170", path: "/api/compute/manifest", required: true },
  { id: "SAI_B059", path: "/api/sai/manifest", required: true },
  { id: "AI_SAI_FUSION_R179", path: "/api/intelligence/r179/manifest", required: true },
  { id: "FEDERATION_R174", path: "/api/federation/r174/health", required: true },
  { id: "CLOUD_SWARM_R185", path: "/api/clouds/r185/manifest", required: true },
  { id: "SURFACE_FABRIC_R191", path: "/api/fabric/r191/manifest", required: true },
] as const;

function json(data: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

function normalizeKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function tableFromSnapshot(snapshot: any, table: CorpusTable): Row[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const aliases = new Set(table.aliases.map(normalizeKey));
  for (const [key, value] of Object.entries(snapshot)) {
    if (aliases.has(normalizeKey(key)) && Array.isArray(value)) return value as Row[];
  }
  return [];
}

function tablesFromSnapshot(snapshot: any): Record<string, Row[]> {
  return Object.fromEntries(CORPUS_TABLES.map(table => [table.id, tableFromSnapshot(snapshot, table)]));
}

function pick(row: Row, names: string[]): any {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  for (const name of names) {
    const value = normalized.get(normalizeKey(name));
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function finiteOrNull(value: any): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function mode188DerivedR192(row: Row) {
  const continuity = finiteOrNull(pick(row, ["Continuity", "CΩ", "C_Omega", "continuity_score"]));
  const burden = finiteOrNull(pick(row, ["Burden", "Λ", "Lambda", "bridge_load", "load"]));
  const contradiction = finiteOrNull(pick(row, ["Contradiction", "q", "contradiction_score"]));
  const sourceDecision = pick(row, ["Decision", "NextAction", "Triage", "Status"]);
  if (continuity === null || burden === null || contradiction === null) {
    return {
      applicable: false,
      formula: MODE188_FORMULA_R192,
      sourceDecision,
      reason: "ROW_DOES_NOT_EXPOSE_CONTINUITY_BURDEN_AND_CONTRADICTION_TOGETHER",
    };
  }
  const denominator = burden + contradiction + 0.35 * burden * contradiction + 0.05;
  const score = denominator > 0 ? continuity / denominator : null;
  return {
    applicable: score !== null,
    formula: MODE188_FORMULA_R192,
    inputs: { continuity, burden, contradiction },
    denominator,
    score,
    sourceDecision,
    boundary: "R192 derives the documented Mode188 stability index from corpus metrics but does not invent STAY/TURN/ESCALATE thresholds when the source row does not provide them.",
  };
}

function dispositionCounts(registry: Row[]) {
  const counts: Record<string, number> = {};
  for (const row of registry) {
    const raw = String(pick(row, ["Disposition", "disposition", "SourceRole"]) ?? "UNSPECIFIED").trim().toUpperCase();
    counts[raw] = (counts[raw] || 0) + 1;
  }
  return counts;
}

async function corpusManifestR192() {
  const [snapshot, integrity] = await Promise.all([readDriveCorpusSnapshotR192(), driveCorpusIntegrityR192()]);
  const tables = tablesFromSnapshot(snapshot);
  const tableSummary = CORPUS_TABLES.map(table => ({
    id: table.id,
    label: table.label,
    rows: tables[table.id].length,
    expectedMinimum: table.expectedMinimum ?? null,
    meetsExpectedMinimum: table.expectedMinimum === undefined ? tables[table.id].length > 0 : tables[table.id].length >= table.expectedMinimum,
    route: `/api/system/r192/${table.id}`,
  }));
  const criticalContract = tableSummary.every(table => table.meetsExpectedMinimum);
  const dispositions = dispositionCounts(tables.registry);
  return {
    ok: integrity.ok && criticalContract,
    schema: DRIVE_CORPUS_SCHEMA_R192,
    release: DRIVE_CORPUS_RELEASE_R192,
    corpus: {
      embedded: true,
      losslessSnapshot: true,
      sha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R192,
      integrity,
      tables: tableSummary,
      dispositions,
    },
    oneSystem: {
      authority: "SINGLE_RUNTIME_SPINE_PLUS_TYPED_SPECIALIST_ORGANS",
      installTarget: "J:\\OMEGA_INSTALL\\OMEGA_ONE_SYSTEM",
      stateHierarchy: [12, 144, 1728, 20736, 248832],
      stateHierarchyBoundary: "OMEGA address / atlas resolution levels, not literal physical dimensions",
      active1728: "12_DOMAINS_X_12_PHASES_X_12_REGULATION_STATES",
      truthTraversal20736: "12_LENSES_X_12_PHASES_X_12_REGULATIONS_X_12_SKINS",
      ultraAddressLedger: 61917364224,
      softwareBuildCells: 27648,
      buildCellFactorization: "24_FAMILIES_X_24_SUBSYSTEMS_X_12_PHASES_X_4_STREAMS",
      continuityLaw: "PARTITION -> EXCHANGE/TRANSFORM -> INVARIANT_CARRY -> SCAR/RESIDUAL_CARRY -> RECONTEXTUALIZE/REPARTITION",
      mode188: {
        formula: MODE188_FORMULA_R192,
        role: "ADMISSIBILITY_PRUNE_BEFORE_BUILD_STAY_TURN_ESCALATE_CLOSURE_LAW",
      },
      referenceKernel: {
        values: [37, 73],
        boundary: "reference kernel / bias parameters only; contextual symmetry and asymmetry remain frame-dependent",
      },
      orientation: "SIGNED_INVERSE_OUTVERSE_STATE_FACTORS_STRUCTURE_FROM_SIGMA_IN_-1_0_+1",
    },
    capabilityTruth: {
      embeddedOrChartedIsNotExecuted: true,
      visualStateIsNotExecutionProof: true,
      modelOutputIsNotCanonState: true,
      reducedOrderOpticalScreeningIsNotRcwaFdtdFemValidation: true,
      pcOnlineRequiresCurrentAuthenticatedSovereignHeartbeat: true,
      externalSurfaceReachabilityDoesNotGrantWriteAuthority: true,
      donorCodeNeverBecomesAuthorityWithoutAdmissionProof: true,
    },
    routes: {
      manifest: "/api/system/r192/manifest",
      status: "/api/system/r192/status",
      execute: "/api/system/r192/execute",
      analyze: "/api/system/r192/analyze?table=registry",
      tables: Object.fromEntries(CORPUS_TABLES.map(table => [table.id, `/api/system/r192/${table.id}`])),
      cockpit: "/system",
    },
    executionTargets: EXECUTION_TARGETS,
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}

async function sha256(value: unknown): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

async function readResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { text: text.slice(0, 1600) };
  }
}

async function probeRoute(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, probe: typeof STATUS_PROBES[number]) {
  const target = new URL(request.url);
  target.pathname = probe.path;
  target.search = "";
  const started = Date.now();
  try {
    const response = await canonicalFetch(new Request(target.toString(), { method: "GET", headers: { accept: "application/json" } }), env, ctx);
    const body = await readResponse(response);
    return {
      id: probe.id,
      route: probe.path,
      required: probe.required,
      reachable: response.status > 0,
      status: response.status,
      ok: response.ok && body?.ok !== false,
      schema: body?.schema ?? null,
      revision: body?.revision ?? body?.release ?? body?.version ?? body?.build ?? null,
      authority: body?.authority ?? body?.runtime?.role ?? null,
      elapsedMs: Date.now() - started,
    };
  } catch (error) {
    return {
      id: probe.id,
      route: probe.path,
      required: probe.required,
      reachable: false,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
    };
  }
}

async function liveStatusR192(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const [manifest, probes] = await Promise.all([
    corpusManifestR192(),
    Promise.all(STATUS_PROBES.map(probe => probeRoute(request, env, ctx, canonicalFetch, probe))),
  ]);
  const required = probes.filter(probe => probe.required);
  const runtimeReady = required.every(probe => probe.ok === true);
  const core = {
    schema: "OMEGA_ONE_SYSTEM_LIVE_STATUS_R192",
    release: DRIVE_CORPUS_RELEASE_R192,
    corpusReady: manifest.ok === true,
    runtimeReady,
    requiredProbeCount: required.length,
    requiredProbePassCount: required.filter(probe => probe.ok === true).length,
    probes,
    boundaries: {
      pcOnline: "UNPROVED_HERE_UNLESS_A_CURRENT_AUTHENTICATED_SOVEREIGN_HEARTBEAT_IS_PRESENT_IN_ITS_OWN_AUTHORITY_PATH",
      rcwaFdtdFem: "DO_NOT_PROMOTE_REDUCED_ORDER_SCREENING_TO_FULL_WAVE_OR_FABRICATION_GRADE_WITHOUT_SOLVER_RECEIPT",
      externalTargets: "DO_NOT_CLAIM_SAME_URL_PROMOTION_WITHOUT_VERIFIED_PROJECT_WRITE_ACCESS_AND_DEPLOYMENT_RECEIPT",
    },
    canonicalMutation: false,
  };
  return { ...core, ok: manifest.ok === true && runtimeReady, receiptSha256: await sha256(core) };
}

function buildDownstreamBody(operation: string, body: any): any {
  const input = body?.input && typeof body.input === "object" ? { ...body.input } : {};
  if (operation === "sai.query" || operation === "ai.cloud" || operation === "ai.fuse") {
    const prompt = String(body?.prompt ?? input.prompt ?? input.message ?? "").trim();
    if (prompt) input.prompt = prompt;
    if (body?.model) input.model = body.model;
    if (body?.use_sai !== undefined) input.use_sai = body.use_sai;
  }
  return input;
}

async function executeR192(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response> {
  const body = await request.json().catch(() => ({})) as any;
  const operation = String(body?.operation ?? "").trim();
  const target = EXECUTION_TARGETS[operation];
  if (!target) {
    return json({ ok: false, code: "R192_OPERATION_NOT_ALLOWED", allowed: Object.keys(EXECUTION_TARGETS), canonicalMutation: false }, 422);
  }
  const downstreamBody = buildDownstreamBody(operation, body);
  if ((operation === "sai.query" || operation.startsWith("ai.")) && !String(downstreamBody.prompt ?? "").trim()) {
    return json({ ok: false, code: "PROMPT_REQUIRED", operation }, 422);
  }
  const targetUrl = new URL(request.url);
  targetUrl.pathname = target.path;
  targetUrl.search = "";
  const started = Date.now();
  const downstream = await canonicalFetch(new Request(targetUrl.toString(), {
    method: target.method,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(downstreamBody),
  }), env, ctx);
  const result = await readResponse(downstream);
  const receiptCore = {
    schema: "OMEGA_ONE_SYSTEM_EXECUTION_RECEIPT_R192",
    release: DRIVE_CORPUS_RELEASE_R192,
    operation,
    specialistRole: target.role,
    specialistRoute: target.path,
    downstreamStatus: downstream.status,
    downstreamOk: downstream.ok && result?.ok !== false,
    elapsedMs: Date.now() - started,
    result,
    canonicalMutation: false,
    authority: "R192_ORCHESTRATES_EXISTING_SPECIALIST_AUTHORITY;IT_DOES_NOT_REIMPLEMENT_OR_OVERRIDE_THE_SPECIALIST",
  };
  const payload = { ...receiptCore, receiptSha256: await sha256(receiptCore) };
  return json(payload, downstream.ok ? 200 : downstream.status);
}

function filteredRows(rows: Row[], url: URL) {
  const query = String(url.searchParams.get("q") ?? "").trim().toLowerCase();
  const offset = Math.max(0, Math.trunc(Number(url.searchParams.get("offset") ?? 0) || 0));
  const limit = Math.min(500, Math.max(1, Math.trunc(Number(url.searchParams.get("limit") ?? 50) || 50));
  const selected = query ? rows.filter(row => JSON.stringify(row).toLowerCase().includes(query)) : rows;
  return { total: rows.length, matched: selected.length, offset, limit, rows: selected.slice(offset, offset + limit) };
}

async function tableResponseR192(tableId: string, url: URL): Promise<Response> {
  const table = CORPUS_TABLES.find(candidate => candidate.id === tableId);
  if (!table) return json({ ok: false, code: "R192_TABLE_NOT_FOUND" }, 404);
  const snapshot = await readDriveCorpusSnapshotR192();
  const rows = tableFromSnapshot(snapshot, table);
  const page = filteredRows(rows, url);
  return json({
    ok: true,
    schema: "OMEGA_DRIVE_CORPUS_TABLE_R192",
    release: DRIVE_CORPUS_RELEASE_R192,
    table: table.id,
    label: table.label,
    corpusSha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R192,
    ...page,
    canonicalMutation: false,
  });
}

async function analyzeResponseR192(url: URL): Promise<Response> {
  const tableId = String(url.searchParams.get("table") ?? "registry");
  const table = CORPUS_TABLES.find(candidate => candidate.id === tableId);
  if (!table) return json({ ok: false, code: "R192_TABLE_NOT_FOUND", tables: CORPUS_TABLES.map(row => row.id) }, 404);
  const snapshot = await readDriveCorpusSnapshotR192();
  const rows = tableFromSnapshot(snapshot, table);
  const page = filteredRows(rows, url);
  return json({
    ok: true,
    schema: "OMEGA_APPLIED_CALCULUS_ANALYSIS_R192",
    release: DRIVE_CORPUS_RELEASE_R192,
    table: tableId,
    formula: MODE188_FORMULA_R192,
    total: page.total,
    matched: page.matched,
    offset: page.offset,
    limit: page.limit,
    rows: page.rows.map((row, index) => ({ corpusIndex: page.offset + index, row, mode188: mode188DerivedR192(row) })),
    boundary: "Derived analysis is evidence-bound to the embedded Drive row. R192 preserves source decisions and does not fabricate missing thresholds or measurements.",
    canonicalMutation: false,
  });
}

function systemHtmlR192(): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OMEGA ONE SYSTEM — R192</title>
<style>
:root{color-scheme:dark;--bg:#070a0f;--panel:#0d131c;--panel2:#111a26;--line:#263347;--text:#e8eef8;--muted:#8fa0b6;--accent:#8bd9ff;--ok:#7fe3ad;--warn:#ffd37a;--bad:#ff8c8c}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 20% 0,#142237 0,#070a0f 42%);color:var(--text);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.app{min-height:100vh;display:grid;grid-template-columns:240px minmax(0,1fr)}aside{position:sticky;top:0;height:100vh;border-right:1px solid var(--line);background:#080d14e8;padding:18px 14px;overflow:auto;backdrop-filter:blur(18px)}main{padding:20px;min-width:0}.brand{font-weight:800;letter-spacing:.12em;font-size:13px}.rev{font-size:11px;color:var(--accent);margin:4px 0 18px}.nav{display:grid;gap:6px}.nav a,.nav button{display:block;width:100%;text-align:left;border:1px solid transparent;background:transparent;color:var(--muted);padding:9px 10px;border-radius:8px;text-decoration:none;cursor:pointer}.nav a:hover,.nav button:hover{border-color:var(--line);color:var(--text);background:#101722}.hero{display:flex;gap:18px;align-items:flex-end;justify-content:space-between;margin-bottom:16px}.hero h1{font-size:clamp(24px,4vw,46px);line-height:1;margin:0}.hero p{max-width:760px;color:var(--muted);margin:8px 0 0}.badge{border:1px solid var(--line);padding:8px 10px;border-radius:999px;white-space:nowrap}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}.card{grid-column:span 4;background:linear-gradient(180deg,#111925e8,#0b111ae8);border:1px solid var(--line);border-radius:12px;padding:14px;min-width:0}.card.wide{grid-column:span 8}.card.full{grid-column:1/-1}.kicker{text-transform:uppercase;letter-spacing:.1em;font-size:10px;color:var(--muted)}.metric{font-size:28px;font-weight:800;margin:5px 0}.muted{color:var(--muted)}.status-row{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #1d2735}.dot{width:9px;height:9px;border-radius:50%;background:var(--warn)}.dot.ok{background:var(--ok);box-shadow:0 0 12px #7fe3ad66}.dot.bad{background:var(--bad)}pre{margin:0;white-space:pre-wrap;word-break:break-word;background:#070b11;border:1px solid var(--line);border-radius:9px;padding:12px;max-height:460px;overflow:auto}textarea,input,select{width:100%;background:#090e15;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:10px;font:inherit}textarea{min-height:150px;resize:vertical}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.btn{border:1px solid var(--line);background:#131d2a;color:var(--text);padding:9px 12px;border-radius:8px;cursor:pointer;text-decoration:none}.btn.primary{background:#153149;border-color:#2f668a}.table-tabs{display:flex;gap:6px;overflow:auto;padding-bottom:6px}.table-tabs button{white-space:nowrap}.table-wrap{overflow:auto;max-height:520px;border:1px solid var(--line);border-radius:9px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:8px 9px;border-bottom:1px solid #1d2735;text-align:left;vertical-align:top;max-width:360px;word-break:break-word}th{position:sticky;top:0;background:#111925;z-index:1}.law{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--accent)}@media(max-width:900px){.app{grid-template-columns:1fr}aside{position:sticky;height:auto;z-index:20;border-right:0;border-bottom:1px solid var(--line);padding:10px 12px}.nav{display:flex;overflow:auto}.nav a,.nav button{white-space:nowrap;width:auto}.brand,.rev{display:inline-block;margin-right:12px}.hero{align-items:flex-start;flex-direction:column}.card,.card.wide{grid-column:1/-1}main{padding:14px}.row{grid-template-columns:1fr}}
</style></head><body><div class="app"><aside><div class="brand">OMEGA ONE SYSTEM</div><div class="rev">R192 DRIVE CORPUS CONVERGENCE</div><nav class="nav"><a href="/">Canon</a><a href="/instrument">Instrument</a><a href="/truth">Truth</a><a href="/fabric">Fabric</a><a href="/clouds">Clouds</a><a href="/sai">SAI</a><a href="/compute">Compute</a><a href="/validate">Validate</a><a href="/federation">Federation</a></nav></aside><main>
<section class="hero"><div><div class="kicker">single runtime spine · recovered drive corpus · executable specialist routing</div><h1>OMEGA ONE SYSTEM</h1><p>The recovered software registry, menus, capabilities, proof gates, wiring, install plan and upgrade sequence are bound to live runtime truth. Archive presence is not treated as execution proof.</p></div><div class="badge" id="overall">CHECKING LIVE STATE</div></section>
<section class="grid">
<div class="card"><div class="kicker">Software registry</div><div class="metric" id="registryCount">—</div><div class="muted">KEEP / MERGE / DONOR corpus</div></div>
<div class="card"><div class="kicker">Address hierarchy</div><div class="metric">12→144→1728</div><div class="muted">→20,736→248,832 atlas resolution</div></div>
<div class="card"><div class="kicker">Build cells</div><div class="metric">27,648</div><div class="muted">24×24×12×4 streams</div></div>
<div class="card wide"><div class="kicker">Live organ proof</div><div id="probes" class="muted">Loading real runtime routes…</div></div>
<div class="card"><div class="kicker">Applied calculus</div><div class="law">S188=CΩ/(Λ+q+0.35Λq+0.05)</div><p class="muted">R192 applies the stability index only where the recovered row actually supplies continuity, burden and contradiction. Missing thresholds remain missing rather than being invented.</p></div>
<div class="card full"><div class="kicker">Unified execution console</div><div class="row"><div><label>Specialist operation</label><select id="operation"><option value="sai.query">SAI · grounded query</option><option value="ai.fuse">AI+SAI · verified fusion</option><option value="ai.cloud">AI · cloud provider</option><option value="relativity.event">Relativity · Lorentz event</option><option value="relativity.velocity">Relativity · velocity transform</option><option value="optics.tmm">Optics · TMM screen</option><option value="continuity.transfer">Continuity · conservative transfer</option><option value="continuity.diffusion">Continuity · graph diffusion</option><option value="wave.fdtd1d">Wave · scalar FDTD 1D</option></select></div><div><label>Prompt or JSON input</label><textarea id="payload" placeholder="For SAI/AI, enter a prompt. For compute operations, enter a JSON object."></textarea></div></div><div class="actions"><button class="btn primary" id="run">Execute through real specialist route</button><button class="btn" id="clear">Clear</button></div><pre id="result">No execution yet.</pre></div>
<div class="card full"><div class="kicker">Recovered Drive corpus</div><div class="table-tabs" id="tabs"></div><div class="actions"><input id="search" placeholder="Search current corpus table" style="max-width:420px"><button class="btn" id="searchBtn">Search</button><button class="btn" id="analyzeBtn">Apply Mode188 where supported</button></div><div id="tableMeta" class="muted" style="margin:8px 0"></div><div class="table-wrap"><table id="table"></table></div></div>
<div class="card full"><div class="kicker">Truth boundaries</div><div class="row"><div><strong>What R192 now proves</strong><p class="muted">The embedded Drive snapshot matches its sealed digest; the One-System corpus is queryable; real specialist routes can be invoked; live runtime organs are probed independently.</p></div><div><strong>What remains separately gated</strong><p class="muted">PC ONLINE requires an authenticated Sovereign heartbeat. Full-wave RCWA/FDTD/FEM requires its solver receipt. External same-URL promotion requires actual project write authority and deployment proof.</p></div></div></div>
</section></main></div><script>
const tableIds=${JSON.stringify(CORPUS_TABLES.map(table => table.id))};let current='registry';const $=id=>document.getElementById(id);const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getJson(url,opts){const r=await fetch(url,opts);const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={text}}return {r,data}}
async function loadManifest(){const {data}=await getJson('/api/system/r192/manifest');const reg=(data.corpus?.tables||[]).find(x=>x.id==='registry');$('registryCount').textContent=reg?.rows??'—'}
async function loadStatus(){const {data}=await getJson('/api/system/r192/status');$('overall').textContent=data.ok?'LIVE CORE + CORPUS VERIFIED':'PARTIAL / PROOF HOLD';$('overall').style.borderColor=data.ok?'var(--ok)':'var(--warn)';$('probes').innerHTML=(data.probes||[]).map(p=>'<div class="status-row"><span class="dot '+(p.ok?'ok':'bad')+'"></span><span>'+esc(p.id)+'<div class="muted">'+esc(p.route)+'</div></span><span>'+esc(p.status)+'</span></div>').join('')||'No probe data'}
function renderRows(data){$('tableMeta').textContent=data.label+' · '+data.matched+' matched / '+data.total+' total';const rows=data.rows||[];if(!rows.length){$('table').innerHTML='<tbody><tr><td>No rows</td></tr></tbody>';return}const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];$('table').innerHTML='<thead><tr>'+keys.map(k=>'<th>'+esc(k)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+keys.map(k=>'<td>'+esc(typeof r[k]==='object'?JSON.stringify(r[k]):r[k])+'</td>').join('')+'</tr>').join('')+'</tbody>'}
async function loadTable(q=''){const {data}=await getJson('/api/system/r192/'+current+'?limit=100&q='+encodeURIComponent(q));renderRows(data)}
async function analyze(){const q=$('search').value;const {data}=await getJson('/api/system/r192/analyze?table='+encodeURIComponent(current)+'&limit=100&q='+encodeURIComponent(q));$('tableMeta').textContent='Mode188 analysis · '+data.matched+' matched / '+data.total+' total';const rows=(data.rows||[]).map(x=>({...x.row,Mode188Score:x.mode188?.score,Mode188Applicable:x.mode188?.applicable,SourceDecision:x.mode188?.sourceDecision}));renderRows({label:'Applied calculus '+current,matched:data.matched,total:data.total,rows})}
function buildTabs(){const host=$('tabs');host.innerHTML=tableIds.map(id=>'<button class="btn" data-id="'+id+'">'+id+'</button>').join('');host.addEventListener('click',e=>{const id=e.target?.dataset?.id;if(!id)return;current=id;loadTable($('search').value)})}
$('searchBtn').onclick=()=>loadTable($('search').value);$('analyzeBtn').onclick=analyze;$('clear').onclick=()=>{$('payload').value='';$('result').textContent='No execution yet.'};$('run').onclick=async()=>{const op=$('operation').value;const raw=$('payload').value.trim();let body={operation:op};if(op.startsWith('ai.')||op==='sai.query')body.prompt=raw;else{try{body.input=raw?JSON.parse(raw):{}}catch(e){$('result').textContent='Input must be valid JSON for compute operations.';return}}$('result').textContent='Executing…';const {data}=await getJson('/api/system/r192/execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});$('result').textContent=JSON.stringify(data,null,2)};
buildTabs();loadManifest();loadStatus();loadTable();setInterval(loadStatus,30000);
</script></body></html>`;
}

export async function handleDriveCorpusSystemR192(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const inScope = path === "/system" || path.startsWith("/api/system/r192");
  if (!inScope) return null;
  if (request.method === "OPTIONS") return json(null, 204);
  try {
    if (path === "/system" && request.method === "GET") {
      return new Response(systemHtmlR192(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (path === "/api/system/r192/manifest" && request.method === "GET") return json(await corpusManifestR192());
    if (path === "/api/system/r192/status" && request.method === "GET") return json(await liveStatusR192(request, env, ctx, canonicalFetch));
    if (path === "/api/system/r192/execute" && request.method === "POST") return executeR192(request, env, ctx, canonicalFetch);
    if (path === "/api/system/r192/analyze" && request.method === "GET") return analyzeResponseR192(url);
    const tableId = path.startsWith("/api/system/r192/") ? path.slice("/api/system/r192/".length) : "";
    if (request.method === "GET" && CORPUS_TABLES.some(table => table.id === tableId)) return tableResponseR192(tableId, url);
    if (request.method !== "GET" && request.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET", "POST"] }, 405);
    return json({
      ok: false,
      code: "R192_SYSTEM_ROUTE_NOT_FOUND",
      routes: ["/system", "/api/system/r192/manifest", "/api/system/r192/status", "/api/system/r192/execute", "/api/system/r192/analyze", ...CORPUS_TABLES.map(table => `/api/system/r192/${table.id}`)],
      canonicalMutation: false,
    }, 404);
  } catch (error) {
    return json({
      ok: false,
      code: "R192_SYSTEM_FAILURE",
      error: error instanceof Error ? error.message : String(error),
      corpusSha256: DRIVE_CORPUS_SNAPSHOT_SHA256_R192,
      canonicalMutation: false,
    }, 500);
  }
}
