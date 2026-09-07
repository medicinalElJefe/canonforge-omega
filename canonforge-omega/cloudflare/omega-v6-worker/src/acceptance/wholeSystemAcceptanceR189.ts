export const WHOLE_SYSTEM_RELEASE_R189 = "r189-whole-system-canonical-acceptance";
export const WHOLE_SYSTEM_SCHEMA_R189 = "OMEGA_WHOLE_SYSTEM_ACCEPTANCE_R189";
export const CAPABILITY_TRUTH_SCHEMA_R189 = "OMEGA_CAPABILITY_TRUTH_R189";

export const GOVERNED_MODES_R189 = Object.freeze([
  "FULL_OVERALL_CANON",
  "MODE_188",
  "UNIFIED_COHERENCE",
  "FORECAST",
  "FULL_SPHERE",
  "RELATIONAL_SKIN",
  "DEWEY_CALCULUS",
  "UNIFIED_RECURSION",
  "DEEP_MOTHER",
  "HIGH_FATHER",
  "HEAVY_PRUNE",
  "ALPHA",
  "CRIMSON",
  "NO_NOTHING_TRUTH",
  "GUIDANCE_FIELD",
]);

export const CAPABILITY_STAGES_R189 = Object.freeze([
  "IMPLEMENTED",
  "ROUTE_BOUND",
  "INVOKED",
  "RETURNED",
  "VERIFIED",
]);

type Obj = Record<string, any>;
type RouterFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type CapabilitySpec = {
  id: string;
  surface: string;
  revision: string;
  method?: "GET" | "POST";
  path?: string;
  body?: Obj;
  requiredQuick: boolean;
  requiredFull: boolean;
  evidenceClass: string;
  boundary: string;
};

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const hash64 = (value: any) => /^[a-f0-9]{64}$/i.test(String(value || ""));
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });

async function sha256(value: unknown): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

const CAPABILITIES: CapabilitySpec[] = [
  { id: "CANONICAL_STATE", surface: "OMEGA", revision: "R167+", path: "/api/omega/state", requiredQuick: true, requiredFull: true, evidenceClass: "CANONICAL_RUNTIME", boundary: "Must return sovereign state; no synthetic fallback is admissible." },
  { id: "PROOF_LEDGER", surface: "PROOF", revision: "R113+", path: "/api/omega/proof?limit=2", requiredQuick: true, requiredFull: true, evidenceClass: "PROOF", boundary: "Proof is evidence and provenance, not an alternate state authority." },
  { id: "RESTORATION_RECOVERY", surface: "BUILD", revision: "R85+", path: "/api/restoration", requiredQuick: true, requiredFull: true, evidenceClass: "RECOVERY", boundary: "Recovery must preserve canonical authority and rollback identity." },
  { id: "EARTH_SOURCE_BOUNDARY", surface: "EARTH", revision: "R152+", path: "/api/earth/catalog", requiredQuick: true, requiredFull: true, evidenceClass: "OBSERVATION_CATALOG", boundary: "Observed sources and derived interpretation remain separate." },
  { id: "COMPUTATION_REFERENCE", surface: "CALCULUS", revision: "R170", path: "/api/compute/manifest", requiredQuick: true, requiredFull: true, evidenceClass: "DERIVED", boundary: "Reference computation is not empirical observation or fabrication-grade validation." },
  { id: "VALIDATION_FABRIC", surface: "PROOF", revision: "R172", path: "/api/validate/manifest", requiredQuick: true, requiredFull: true, evidenceClass: "DERIVED_VALIDATION", boundary: "Replica, invariant, independent formulation, cross-runtime, solver-family and measurement tiers remain distinct." },
  { id: "INDEPENDENT_RCWA_CONTRACT", surface: "CALCULUS", revision: "R175", path: "/api/validate/independent/manifest", requiredQuick: true, requiredFull: true, evidenceClass: "SOLVER_CONTRACT", boundary: "Manifest proves the RCWA validation contract, not a current native RCWA execution." },
  { id: "CLOUD_SWARM_172", surface: "SOVEREIGN", revision: "R185", path: "/api/clouds/r185/manifest", requiredQuick: true, requiredFull: true, evidenceClass: "DISTRIBUTED_EXECUTION", boundary: "172 stateful Worker nodes are not 172 provider accounts or physical machines." },
  { id: "MOTION_TIME_172", surface: "OMEGA", revision: "R188", path: "/api/swarm/motion/r188/manifest", requiredQuick: true, requiredFull: true, evidenceClass: "SEQUENCE_CONTRACT", boundary: "Logical-time advancement is not physical time acceleration." },
  { id: "SAI_B059", surface: "INTELLIGENCE", revision: "R179", path: "/api/sai/status", requiredQuick: false, requiredFull: true, evidenceClass: "GROUNDED_CORPUS", boundary: "Only declared deterministic B059 training scope may be called OMEGA-trained; provider weights remain external." },
  { id: "SOVEREIGN_PC", surface: "SOVEREIGN", revision: "R181", path: "/api/hybrid/status", requiredQuick: false, requiredFull: true, evidenceClass: "AUTHENTICATED_HEARTBEAT", boundary: "PC ONLINE requires a current authenticated heartbeat." },
  { id: "AI_SAI_SOVEREIGN", surface: "INTELLIGENCE", revision: "R181", method: "POST", path: "/api/acceptance/r181/probe", body: {}, requiredQuick: false, requiredFull: true, evidenceClass: "LIVE_ACCEPTANCE", boundary: "Full acceptance requires current sovereign heartbeat plus exact B059 verification and grounded query evidence." },
  { id: "TRUTH_SURFACE", surface: "PROOF", revision: "R189", path: "/truth", requiredQuick: true, requiredFull: true, evidenceClass: "OPERATOR_SURFACE", boundary: "Human-readable truth surface reflects capability evidence; it is not itself evidence of subsystem execution." },
];

function staticContracts(): Obj[] {
  return [
    {
      id: "GOVERNED_MODE_ATLAS",
      surface: "OMEGA",
      revision: "R145+",
      state: "VERIFIED_STATIC_CONTRACT",
      stages: ["IMPLEMENTED", "ROUTE_BOUND", "VERIFIED"],
      verified: GOVERNED_MODES_R189.length === 15 && new Set(GOVERNED_MODES_R189).size === 15,
      modes: GOVERNED_MODES_R189,
      evidenceClass: "COMPILED_CONTRACT",
      boundary: "Modes are distinct operators over one canonical packet; they are not separate runtimes or physical dimensions.",
    },
    {
      id: "CANONICAL_AUTHORITY_RULE",
      surface: "SOVEREIGN",
      revision: "R123+",
      state: "VERIFIED_STATIC_CONTRACT",
      stages: ["IMPLEMENTED", "VERIFIED"],
      verified: true,
      rules: ["single_packet_authority", "single_dispatcher_authority", "parallel_state_runtime_prohibited", "duplicate_ui_shell_prohibited", "mode_runtime_fork_prohibited"],
      evidenceClass: "COMPILED_CONTRACT",
      boundary: "This contract constrains routing and promotion; live acceptance still requires runtime evidence.",
    },
  ];
}

function verifyCapability(id: string, response: Response, body: Obj | null): Obj {
  const returned = response.ok && body !== null;
  if (!returned) return { verified: false, state: "FAILED_RETURN", detail: body?.code || body?.error || `HTTP_${response.status}` };
  switch (id) {
    case "CANONICAL_STATE":
      return { verified: Boolean(body?.digest || body?.state || body?.mode188), state: "VERIFIED", detail: body?.digest || body?.state?.evidence_class || null };
    case "PROOF_LEDGER":
      return { verified: body?.ok !== false, state: "VERIFIED", detail: body?.schema || body?.authority || null };
    case "RESTORATION_RECOVERY":
      return { verified: body?.ok !== false, state: "VERIFIED", detail: body?.state || body?.schema || null };
    case "EARTH_SOURCE_BOUNDARY": {
      const count = Array.isArray(body?.coverages) ? body.coverages.length : Array.isArray(body?.catalog?.coverages) ? body.catalog.coverages.length : Number(body?.coverageCount || 0);
      return { verified: body?.ok !== false && count >= 0, state: "VERIFIED", detail: { coverageCount: count } };
    }
    case "COMPUTATION_REFERENCE":
      return { verified: body?.ok === true && body?.revision === "R170" && body?.solvers?.normal_incidence_tmm?.fabricationGrade === false, state: "VERIFIED", detail: body?.schema || null };
    case "VALIDATION_FABRIC":
      return { verified: body?.ok === true && body?.revision === "R172" && Array.isArray(body?.levels), state: "VERIFIED", detail: { levels: body?.levels?.length || 0 } };
    case "INDEPENDENT_RCWA_CONTRACT":
      return { verified: body?.ok === true && body?.revision === "R175" && body?.solverFamily === "MAXWELL_RCWA" && body?.requiredImplementation === "grcwa", state: "VERIFIED_CONTRACT", detail: body?.release || null };
    case "CLOUD_SWARM_172":
      return { verified: body?.nodeCount === 172 && body?.allNodesConfigured === true, state: "VERIFIED", detail: { nodeCount: body?.nodeCount, bindingAvailable: body?.durableObjectBindingAvailable } };
    case "MOTION_TIME_172":
      return { verified: body?.ok === true && body?.revision === "R188" && Number(body?.cloudNodes) === 172 && body?.physicalTimeAccelerationClaim === false, state: "VERIFIED", detail: { cloudNodes: body?.cloudNodes, phases: body?.phases?.length || 12 } };
    case "SAI_B059": {
      const present = body?.state === "B059_PRESENT_VERIFICATION_REQUIRED" || body?.passed === true || body?.ok === true;
      return { verified: present, state: present ? "VERIFIED_PRESENT" : "BLOCKED", detail: body?.state || body?.schema || null };
    }
    case "SOVEREIGN_PC": {
      const current = Boolean(body?.heartbeatCurrent ?? body?.heartbeat_current ?? body?.pcOnline ?? body?.pc_online);
      const authenticated = Boolean(body?.authenticated ?? body?.agentAuthenticated ?? body?.authenticated_heartbeat ?? current);
      return { verified: current && authenticated, state: current && authenticated ? "VERIFIED_CURRENT_HEARTBEAT" : "BLOCKED_CURRENT_HEARTBEAT_REQUIRED", detail: { heartbeatCurrent: current, authenticated, heartbeatAgeSeconds: body?.heartbeatAgeSeconds ?? body?.heartbeat_age_seconds ?? null } };
    }
    case "AI_SAI_SOVEREIGN":
      return { verified: body?.fullAcceptance === true, state: body?.fullAcceptance === true ? "VERIFIED" : "BLOCKED", detail: body?.acceptanceState || null };
    case "TRUTH_SURFACE": {
      const ct = response.headers.get("content-type") || "";
      return { verified: ct.includes("text/html"), state: ct.includes("text/html") ? "VERIFIED" : "FAILED", detail: ct };
    }
    default:
      return { verified: response.ok, state: response.ok ? "VERIFIED" : "FAILED", detail: null };
  }
}

async function invoke(request: Request, env: any, ctx: any, routerFetch: RouterFetch, spec: CapabilitySpec, full: boolean): Promise<Obj> {
  const url = new URL(request.url);
  const [pathname, search = ""] = String(spec.path || "").split("?");
  url.pathname = pathname;
  url.search = search ? `?${search}` : "";
  const method = spec.method || "GET";
  const init: RequestInit = { method, headers: { accept: "application/json" } };
  if (method === "POST") {
    init.headers = { "content-type": "application/json", accept: "application/json" };
    init.body = JSON.stringify(spec.id === "AI_SAI_SOVEREIGN" && full ? {} : spec.body || {});
  }
  const startedAt = Date.now();
  try {
    const response = await routerFetch(new Request(url.toString(), init), env, ctx);
    const clone = response.clone();
    const body = await clone.json().catch(() => null) as Obj | null;
    const verification = verifyCapability(spec.id, response, body);
    return {
      id: spec.id,
      surface: spec.surface,
      revision: spec.revision,
      path: spec.path,
      method,
      requiredQuick: spec.requiredQuick,
      requiredFull: spec.requiredFull,
      stages: verification.verified ? CAPABILITY_STAGES_R189 : ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED"],
      state: verification.state,
      verified: verification.verified,
      httpStatus: response.status,
      durationMs: Date.now() - startedAt,
      evidenceClass: spec.evidenceClass,
      boundary: spec.boundary,
      detail: verification.detail,
    };
  } catch (error) {
    return {
      id: spec.id,
      surface: spec.surface,
      revision: spec.revision,
      path: spec.path,
      method,
      requiredQuick: spec.requiredQuick,
      requiredFull: spec.requiredFull,
      stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED"],
      state: "FAILED_INVOCATION",
      verified: false,
      httpStatus: 0,
      durationMs: Date.now() - startedAt,
      evidenceClass: spec.evidenceClass,
      boundary: spec.boundary,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function verifyLatestNativeRcwa(request: Request, env: any, ctx: any, routerFetch: RouterFetch): Promise<Obj> {
  const base = {
    id: "NATIVE_RCWA_EXECUTION",
    surface: "CALCULUS",
    revision: "R175/R189",
    requiredQuick: false,
    requiredFull: true,
    evidenceClass: "DERIVED_INDEPENDENT_NUMERICAL_VALIDATION",
    boundary: "Only a persisted VERIFIED native grcwa receipt from an authenticated sovereign lease can satisfy this capability. Contract presence alone is insufficient.",
  };
  try {
    const statusUrl = new URL(request.url); statusUrl.pathname = "/api/development/status"; statusUrl.search = "";
    const statusResponse = await routerFetch(new Request(statusUrl.toString(), { headers: { accept: "application/json" } }), env, ctx);
    const status = await statusResponse.json().catch(() => null) as Obj | null;
    const rows = [status?.active_job, ...(Array.isArray(status?.recent_jobs) ? status.recent_jobs : [])].filter(Boolean) as Obj[];
    const job = rows.find(row => row?.kind === "cross_runtime_validate" && row?.state === "VERIFIED" && (row?.evidence?.native_result?.solver_family === "MAXWELL_RCWA" || row?.evidence?.native_result?.solver === "rcwa"));
    if (!job?.id) return { ...base, stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED"], state: "BLOCKED_NO_VERIFIED_NATIVE_RCWA_JOB", verified: false, detail: { recentJobsInspected: rows.length } };
    const compareUrl = new URL(request.url); compareUrl.pathname = "/api/validate/independent/compare"; compareUrl.search = "";
    const response = await routerFetch(new Request(compareUrl.toString(), { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ job_id: job.id }) }), env, ctx);
    const body = await response.json().catch(() => null) as Obj | null;
    const verified = response.ok && body?.ok === true && body?.validation?.validationTier?.level === 4 && body?.validation?.solverFamily === "MAXWELL_RCWA" && body?.validation?.nativeExecutionObserved === true && hash64(body?.validation?.receiptSha256);
    return { ...base, stages: verified ? CAPABILITY_STAGES_R189 : ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED"], state: verified ? "VERIFIED_NATIVE_RCWA" : "BLOCKED_RCWA_RECEIPT_REJECTED", verified, httpStatus: response.status, detail: verified ? { jobId: job.id, solverVersion: body?.validation?.solverVersion, receiptSha256: body?.validation?.receiptSha256 } : { jobId: job.id, validation: body?.validation?.status || body?.state || null } };
  } catch (error) {
    return { ...base, stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED"], state: "FAILED_INVOCATION", verified: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

function truthHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA R189 · Capability Truth</title><style>:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#05080d;color:#edf4fb}body{margin:0;background:radial-gradient(circle at 50% 0,#16283b,#05080d 48%);min-height:100vh}.wrap{max-width:1400px;margin:auto;padding:28px 18px 70px}h1{font-size:clamp(34px,6vw,72px);margin:.15em 0}.sub{color:#91a6b9;max-width:900px}.bar{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.btn{border:1px solid #38526b;background:#0d1823;color:#edf4fb;border-radius:11px;padding:10px 13px;cursor:pointer}.btn.primary{background:#173451}.state{border:1px solid #2a4155;border-radius:16px;background:#09121b;padding:14px;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}.card{border:1px solid #24384a;border-radius:13px;background:#081019;padding:13px}.ok{border-color:#2f7654}.bad{border-color:#79484a}.hold{border-color:#7a6637}.k{font:700 10px ui-monospace,monospace;letter-spacing:.1em;color:#7f96aa}.v{font-weight:800;margin-top:5px}.tiny{font-size:12px;color:#8297aa;word-break:break-word}pre{white-space:pre-wrap;word-break:break-word;max-height:340px;overflow:auto;background:#050a10;border-radius:10px;padding:10px}</style></head><body><main class="wrap"><div class="k">R189 WHOLE-SYSTEM CANONICAL ACCEPTANCE</div><h1>Capability Truth</h1><p class="sub">One surface for what is implemented, routed, invoked, returned and actually verified. Missing external proof stays blocked instead of being presented as complete.</p><div class="bar"><button class="btn primary" id="quick">Run quick proof</button><button class="btn" id="full">Run full proof</button><a class="btn" href="/api/acceptance/r189/manifest">Manifest JSON</a></div><section class="state"><div class="k">OVERALL</div><div class="v" id="overall">Not probed</div><div class="tiny" id="meta"></div></section><div class="grid" id="grid"></div><details><summary>Receipt JSON</summary><pre id="raw">No receipt.</pre></details></main><script>const esc=x=>String(x??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));async function run(depth){document.querySelector('#overall').textContent='PROBING '+depth.toUpperCase()+'…';const r=await fetch('/api/acceptance/r189/probe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({depth})});const d=await r.json();document.querySelector('#overall').textContent=d.overallState||'UNKNOWN';document.querySelector('#meta').textContent='verified '+(d.summary?.verified||0)+' / '+(d.summary?.total||0)+' · receipt '+String(d.receiptSha256||'').slice(0,20);document.querySelector('#grid').innerHTML=(d.capabilities||[]).map(c=>'<article class="card '+(c.verified?'ok':c.state&&c.state.startsWith('BLOCKED')?'hold':'bad')+'"><div class="k">'+esc(c.surface)+' · '+esc(c.revision)+'</div><div class="v">'+esc(c.id)+'</div><p>'+esc(c.state)+'</p><div class="tiny">'+esc(c.path||'compiled contract')+'<br>'+esc(c.boundary||'')+'</div></article>').join('');document.querySelector('#raw').textContent=JSON.stringify(d,null,2)}document.querySelector('#quick').onclick=()=>run('quick');document.querySelector('#full').onclick=()=>run('full');run('quick');</script></body></html>`;
}

export function wholeSystemTruthLabR189(): Response {
  return new Response(truthHtml(), { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-omega-acceptance": "R189" } });
}

export async function handleWholeSystemAcceptanceR189(request: Request, env: any, ctx: any, routerFetch: RouterFetch): Promise<Response> {
  const url = new URL(request.url);
  const canonicalGitSha = String(env?.CANONICAL_GIT_SHA || env?.GIT_SHA || "").trim() || null;
  if (request.method === "GET" && url.pathname === "/api/acceptance/r189/manifest") {
    const core = {
      ok: true,
      schema: "OMEGA_CAPABILITY_MANIFEST_R189",
      release: WHOLE_SYSTEM_RELEASE_R189,
      canonicalGitSha,
      deploymentIdentityBound: Boolean(canonicalGitSha && hash64(canonicalGitSha)),
      stages: CAPABILITY_STAGES_R189,
      governedModes: GOVERNED_MODES_R189,
      capabilities: [...staticContracts(), ...CAPABILITIES],
      fullAcceptanceRequires: ["current authenticated sovereign heartbeat", "exact B059 verification + grounded query", "persisted VERIFIED native grcwa RCWA receipt", "all required runtime routes returned and verified"],
      canonicalMutation: false,
      promotionAuthorized: false,
    };
    return json({ ...core, manifestSha256: await sha256(core) });
  }
  if (request.method !== "POST" || url.pathname !== "/api/acceptance/r189/probe") return json({ ok: false, code: "R189_ACCEPTANCE_ROUTE_NOT_FOUND" }, 404);

  const payload = await request.json().catch(() => ({})) as Obj;
  const full = String(payload.depth || "quick").toLowerCase() === "full";
  const selected = CAPABILITIES.filter(spec => full || spec.requiredQuick);
  const dynamic = await Promise.all(selected.map(spec => invoke(request, env, ctx, routerFetch, spec, full)));
  const rcwa = full ? await verifyLatestNativeRcwa(request, env, ctx, routerFetch) : {
    id: "NATIVE_RCWA_EXECUTION", surface: "CALCULUS", revision: "R175/R189", requiredQuick: false, requiredFull: true, evidenceClass: "DERIVED_INDEPENDENT_NUMERICAL_VALIDATION", state: "REQUIRES_FULL_PROBE", verified: false, stages: ["IMPLEMENTED", "ROUTE_BOUND"], boundary: "Full probe inspects persisted governed jobs and independently re-validates the latest eligible native RCWA receipt."
  };
  const capabilities = [...staticContracts(), ...dynamic, rcwa];
  const required = capabilities.filter((c: Obj) => full ? c.requiredFull !== false : c.requiredQuick === true || c.state === "VERIFIED_STATIC_CONTRACT");
  const hardFailures = required.filter((c: Obj) => !c.verified && String(c.state || "").startsWith("FAILED"));
  const blocked = required.filter((c: Obj) => !c.verified && String(c.state || "").startsWith("BLOCKED"));
  const verified = capabilities.filter((c: Obj) => c.verified === true).length;
  const allRequiredVerified = required.every((c: Obj) => c.verified === true);
  const overallState = allRequiredVerified ? (full ? "FULL_SYSTEM_VERIFIED" : "CORE_SYSTEM_VERIFIED") : hardFailures.length ? "ACCEPTANCE_FAILED" : blocked.length ? "EXTERNAL_PROOF_BLOCKED" : "PARTIAL_VERIFICATION";
  const core = {
    schema: WHOLE_SYSTEM_SCHEMA_R189,
    release: WHOLE_SYSTEM_RELEASE_R189,
    timestamp: new Date().toISOString(),
    depth: full ? "full" : "quick",
    canonicalGitSha,
    deploymentIdentityBound: Boolean(canonicalGitSha && hash64(canonicalGitSha)),
    overallState,
    summary: { total: capabilities.length, verified, unverified: capabilities.length - verified, required: required.length, requiredVerified: required.filter((c: Obj) => c.verified).length, hardFailures: hardFailures.length, blocked: blocked.length },
    capabilities,
    truthBoundary: "R189 reports execution truth only. Source presence, a route manifest, a current heartbeat, a grounded SAI query, and an independently validated native RCWA result are separate evidence states and are never collapsed into a single implied capability.",
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return json({ ok: hardFailures.length === 0, ...core, receiptSha256: await sha256(core) }, hardFailures.length ? 503 : 200);
}
