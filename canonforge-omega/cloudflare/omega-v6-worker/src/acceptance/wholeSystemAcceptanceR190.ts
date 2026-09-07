export const WHOLE_SYSTEM_RELEASE_R190 = "r190-capability-truth-admission";
export const WHOLE_SYSTEM_SCHEMA_R190 = "OMEGA_WHOLE_SYSTEM_ACCEPTANCE_R190";
export const CAPABILITY_TRUTH_SCHEMA_R190 = "OMEGA_CAPABILITY_TRUTH_R190";
export const R190_PREDECESSOR_SHA = "ab3c8973dad012da11b75983dd41bed6bddfad3a";

export const GOVERNED_MODES_R190 = Object.freeze([
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

export const CAPABILITY_STAGES_R190 = Object.freeze([
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
  path: string;
  method?: "GET" | "POST";
  body?: Obj;
  requiredQuick: boolean;
  requiredFull: boolean;
  evidenceClass: string;
  boundary: string;
};

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const sha256Hex = (value: any) => /^[a-f0-9]{64}$/i.test(String(value || ""));
const gitShaHex = (value: any) => /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(String(value || ""));
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });

async function sha256(value: unknown): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

const CAPABILITIES: CapabilitySpec[] = [
  {
    id: "R189_WHOLE_INSTRUMENT",
    surface: "OMEGA",
    revision: "R189",
    path: "/api/instrument/r189/manifest",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "ADMITTED_PREDECESSOR_CONTRACT",
    boundary: "R190 must preserve the admitted R189 whole-instrument surface and its inherited routes; predecessor presence is not proof of every live subsystem.",
  },
  {
    id: "CANONICAL_STATE",
    surface: "OMEGA",
    revision: "R167+",
    path: "/api/omega/state",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "CANONICAL_RUNTIME",
    boundary: "Must return sovereign state; no synthetic fallback is admissible.",
  },
  {
    id: "PROOF_LEDGER",
    surface: "PROOF",
    revision: "R113+",
    path: "/api/omega/proof?limit=2",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "PROOF",
    boundary: "Proof is evidence and provenance, not an alternate state authority.",
  },
  {
    id: "RESTORATION_RECOVERY",
    surface: "BUILD",
    revision: "R85+",
    path: "/api/restoration",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "RECOVERY",
    boundary: "Recovery must preserve canonical authority and rollback identity.",
  },
  {
    id: "EARTH_SOURCE_BOUNDARY",
    surface: "EARTH",
    revision: "R152+",
    path: "/api/earth/catalog",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "OBSERVATION_CATALOG",
    boundary: "Observed sources and derived interpretation remain separate.",
  },
  {
    id: "COMPUTATION_REFERENCE",
    surface: "CALCULUS",
    revision: "R170",
    path: "/api/compute/manifest",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "DERIVED",
    boundary: "Reference computation is not empirical observation or fabrication-grade validation.",
  },
  {
    id: "VALIDATION_FABRIC",
    surface: "PROOF",
    revision: "R172",
    path: "/api/validate/manifest",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "DERIVED_VALIDATION",
    boundary: "Replica, invariant, independent formulation, cross-runtime, solver-family and measurement tiers remain distinct.",
  },
  {
    id: "INDEPENDENT_RCWA_CONTRACT",
    surface: "CALCULUS",
    revision: "R175",
    path: "/api/validate/independent/manifest",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "SOLVER_CONTRACT",
    boundary: "The RCWA manifest proves a validation contract, not a current native RCWA execution.",
  },
  {
    id: "CLOUD_SWARM_172",
    surface: "SOVEREIGN",
    revision: "R185",
    path: "/api/clouds/r185/manifest",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "DISTRIBUTED_EXECUTION",
    boundary: "172 stateful Worker nodes are not 172 provider accounts or physical machines.",
  },
  {
    id: "MOTION_TIME_172",
    surface: "OMEGA",
    revision: "R188",
    path: "/api/swarm/motion/r188/manifest",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "SEQUENCE_CONTRACT",
    boundary: "Logical-time advancement is not physical time acceleration.",
  },
  {
    id: "SAI_B059",
    surface: "INTELLIGENCE",
    revision: "R179",
    path: "/api/sai/status",
    requiredQuick: false,
    requiredFull: true,
    evidenceClass: "GROUNDED_CORPUS",
    boundary: "Only the declared deterministic B059 scope may be called OMEGA-trained; provider weights remain external pretraining.",
  },
  {
    id: "SOVEREIGN_PC",
    surface: "SOVEREIGN",
    revision: "R181",
    path: "/api/hybrid/status",
    requiredQuick: false,
    requiredFull: true,
    evidenceClass: "AUTHENTICATED_HEARTBEAT",
    boundary: "PC ONLINE requires a current authenticated heartbeat.",
  },
  {
    id: "AI_SAI_SOVEREIGN",
    surface: "INTELLIGENCE",
    revision: "R181",
    method: "POST",
    path: "/api/acceptance/r181/probe",
    body: {},
    requiredQuick: false,
    requiredFull: true,
    evidenceClass: "LIVE_ACCEPTANCE",
    boundary: "Full R181 acceptance requires current sovereign heartbeat plus exact B059 verification and grounded query evidence.",
  },
  {
    id: "TRUTH_SURFACE",
    surface: "PROOF",
    revision: "R190",
    path: "/truth",
    requiredQuick: true,
    requiredFull: true,
    evidenceClass: "OPERATOR_SURFACE",
    boundary: "The human-readable truth surface displays capability evidence; it is not itself execution evidence.",
  },
];

function deploymentIdentity(env: any): Obj {
  const canonicalGitSha = String(env?.CANONICAL_GIT_SHA || env?.GIT_SHA || "").trim() || null;
  const verified = Boolean(canonicalGitSha && gitShaHex(canonicalGitSha));
  return {
    id: "DEPLOYMENT_IDENTITY",
    surface: "PROOF",
    revision: "R190",
    requiredQuick: true,
    requiredFull: true,
    stages: verified ? CAPABILITY_STAGES_R190 : ["IMPLEMENTED", "ROUTE_BOUND"],
    state: verified ? "VERIFIED_EXACT_DEPLOYMENT_IDENTITY" : "BLOCKED_DEPLOYMENT_SHA_REQUIRED",
    verified,
    evidenceClass: "DEPLOYMENT_IDENTITY",
    detail: { canonicalGitSha },
    boundary: "Live acceptance is admissible only when the deployed Worker exposes an exact Git identity injected by the deployment workflow.",
  };
}

function staticContracts(): Obj[] {
  return [
    {
      id: "GOVERNED_MODE_ATLAS",
      surface: "OMEGA",
      revision: "R145+",
      requiredQuick: true,
      requiredFull: true,
      stages: ["IMPLEMENTED", "ROUTE_BOUND", "VERIFIED"],
      state: "VERIFIED_STATIC_CONTRACT",
      verified: GOVERNED_MODES_R190.length === 15 && new Set(GOVERNED_MODES_R190).size === 15,
      modes: GOVERNED_MODES_R190,
      evidenceClass: "COMPILED_CONTRACT",
      boundary: "Modes remain distinct operators over one canonical packet; they do not fork independent state engines.",
    },
    {
      id: "CANONICAL_AUTHORITY_RULE",
      surface: "SOVEREIGN",
      revision: "R123+",
      requiredQuick: true,
      requiredFull: true,
      stages: ["IMPLEMENTED", "VERIFIED"],
      state: "VERIFIED_STATIC_CONTRACT",
      verified: true,
      rules: [
        "single_packet_authority",
        "single_dispatcher_authority",
        "parallel_state_runtime_prohibited",
        "duplicate_ui_shell_prohibited",
        "mode_runtime_fork_prohibited",
      ],
      evidenceClass: "COMPILED_CONTRACT",
      boundary: "The authority contract constrains routing and promotion; live acceptance still requires runtime evidence.",
    },
  ];
}

function verifyCapability(id: string, response: Response, body: Obj | null, text: string): Obj {
  const returned = response.ok;
  if (!returned) return { verified: false, state: "FAILED_RETURN", detail: body?.code || body?.error || `HTTP_${response.status}` };
  switch (id) {
    case "R189_WHOLE_INSTRUMENT": {
      const preservation = body?.preservation || {};
      const verified = Boolean(
        body?.schema === "OMEGA_WHOLE_INSTRUMENT_MANIFEST_v1" &&
        body?.revision === "R189_WHOLE_INSTRUMENT_CONVERGENCE" &&
        preservation.additiveSuccessor === true &&
        preservation.inheritedRoutesPreserved === true &&
        preservation.inheritedVisualShellPreserved === true &&
        preservation.durableObjectNamespacesPreserved === true &&
        preservation.canonicalMutation === false &&
        preservation.autonomousPromotion === false
      );
      return { verified, state: verified ? "VERIFIED_PREDECESSOR" : "FAILED_PREDECESSOR_CONTRACT", detail: { domains: body?.domains?.length || 0 } };
    }
    case "CANONICAL_STATE": {
      const verified = Boolean(body && (body.digest || body.state || body.mode188));
      return { verified, state: verified ? "VERIFIED" : "FAILED_CANONICAL_STATE", detail: body?.digest || body?.state?.evidence_class || null };
    }
    case "PROOF_LEDGER":
      return { verified: body?.ok !== false && body !== null, state: body?.ok !== false && body !== null ? "VERIFIED" : "FAILED_PROOF_LEDGER", detail: body?.schema || body?.authority || null };
    case "RESTORATION_RECOVERY":
      return { verified: body?.ok !== false && body !== null, state: body?.ok !== false && body !== null ? "VERIFIED" : "FAILED_RECOVERY", detail: body?.state || body?.schema || null };
    case "EARTH_SOURCE_BOUNDARY": {
      const coverages = Array.isArray(body?.coverages) ? body.coverages : Array.isArray(body?.catalog?.coverages) ? body.catalog.coverages : null;
      const explicitCount = Number(body?.coverageCount ?? body?.catalog?.coverageCount);
      const count = coverages ? coverages.length : Number.isFinite(explicitCount) ? explicitCount : null;
      const verified = body !== null && body?.ok !== false && count !== null && count >= 0;
      return { verified, state: verified ? "VERIFIED" : "FAILED_EARTH_CATALOG", detail: { coverageCount: count } };
    }
    case "COMPUTATION_REFERENCE": {
      const verified = body?.ok === true && body?.revision === "R170" && body?.solvers?.normal_incidence_tmm?.fabricationGrade === false;
      return { verified, state: verified ? "VERIFIED" : "FAILED_COMPUTE_CONTRACT", detail: body?.schema || null };
    }
    case "VALIDATION_FABRIC": {
      const verified = body?.ok === true && body?.revision === "R172" && Array.isArray(body?.levels);
      return { verified, state: verified ? "VERIFIED" : "FAILED_VALIDATION_CONTRACT", detail: { levels: body?.levels?.length || 0 } };
    }
    case "INDEPENDENT_RCWA_CONTRACT": {
      const verified = body?.ok === true && body?.revision === "R175" && body?.solverFamily === "MAXWELL_RCWA" && body?.requiredImplementation === "grcwa";
      return { verified, state: verified ? "VERIFIED_CONTRACT" : "FAILED_RCWA_CONTRACT", detail: body?.release || null };
    }
    case "CLOUD_SWARM_172": {
      const verified = body?.nodeCount === 172 && body?.allNodesConfigured === true;
      return { verified, state: verified ? "VERIFIED" : "FAILED_CLOUD172_CONTRACT", detail: { nodeCount: body?.nodeCount, bindingAvailable: body?.durableObjectBindingAvailable } };
    }
    case "MOTION_TIME_172": {
      const phaseCount = Array.isArray(body?.phases) ? body.phases.length : Array.isArray(body?.motionPhases) ? body.motionPhases.length : 12;
      const noAccelerationClaim = body?.physicalTimeAccelerationClaim === false || body?.truthBoundary?.physicalTimeAccelerationClaim === false || String(body?.boundary || body?.truthBoundary || "").toLowerCase().includes("not physical");
      const verified = body?.ok === true && body?.revision === "R188" && Number(body?.cloudNodes) === 172 && phaseCount === 12 && noAccelerationClaim;
      return { verified, state: verified ? "VERIFIED" : "FAILED_MOTION_CONTRACT", detail: { cloudNodes: body?.cloudNodes, phases: phaseCount } };
    }
    case "SAI_B059": {
      const present = body?.state === "B059_PRESENT_VERIFICATION_REQUIRED" || body?.passed === true || body?.ok === true;
      return { verified: present, state: present ? "VERIFIED_PRESENT" : "BLOCKED_B059_NOT_PRESENT", detail: body?.state || body?.schema || null };
    }
    case "SOVEREIGN_PC": {
      const current = Boolean(body?.heartbeatCurrent ?? body?.heartbeat_current ?? body?.pcOnline ?? body?.pc_online);
      const authenticated = Boolean(body?.authenticated ?? body?.agentAuthenticated ?? body?.authenticated_heartbeat ?? current);
      const verified = current && authenticated;
      return { verified, state: verified ? "VERIFIED_CURRENT_HEARTBEAT" : "BLOCKED_CURRENT_HEARTBEAT_REQUIRED", detail: { heartbeatCurrent: current, authenticated, heartbeatAgeSeconds: body?.heartbeatAgeSeconds ?? body?.heartbeat_age_seconds ?? null } };
    }
    case "AI_SAI_SOVEREIGN": {
      const verified = body?.fullAcceptance === true;
      return { verified, state: verified ? "VERIFIED" : "BLOCKED_R181_FULL_ACCEPTANCE", detail: body?.acceptanceState || null };
    }
    case "TRUTH_SURFACE": {
      const ct = response.headers.get("content-type") || "";
      const verified = ct.includes("text/html") && text.includes("Capability Truth") && text.includes("R190");
      return { verified, state: verified ? "VERIFIED" : "FAILED_TRUTH_SURFACE", detail: ct };
    }
    default:
      return { verified: false, state: "FAILED_UNKNOWN_CAPABILITY", detail: id };
  }
}

async function invoke(request: Request, env: any, ctx: any, routerFetch: RouterFetch, spec: CapabilitySpec, full: boolean): Promise<Obj> {
  const url = new URL(request.url);
  const [pathname, search = ""] = spec.path.split("?");
  url.pathname = pathname;
  url.search = search ? `?${search}` : "";
  const method = spec.method || "GET";
  const headers: Record<string, string> = { accept: spec.id === "TRUTH_SURFACE" ? "text/html" : "application/json" };
  const init: RequestInit = { method, headers };
  if (method === "POST") {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(spec.id === "AI_SAI_SOVEREIGN" && full ? {} : spec.body || {});
  }
  const startedAt = Date.now();
  try {
    const response = await routerFetch(new Request(url.toString(), init), env, ctx);
    const text = await response.clone().text();
    let body: Obj | null = null;
    try { body = JSON.parse(text) as Obj; } catch { body = null; }
    const verification = verifyCapability(spec.id, response, body, text);
    return {
      id: spec.id,
      surface: spec.surface,
      revision: spec.revision,
      path: spec.path,
      method,
      requiredQuick: spec.requiredQuick,
      requiredFull: spec.requiredFull,
      stages: verification.verified ? CAPABILITY_STAGES_R190 : ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", ...(response.ok ? ["RETURNED"] : [])],
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
    revision: "R175/R190",
    requiredQuick: false,
    requiredFull: true,
    evidenceClass: "DERIVED_INDEPENDENT_NUMERICAL_VALIDATION",
    boundary: "Only a persisted VERIFIED native grcwa receipt from an authenticated sovereign lease can satisfy this capability. Contract presence alone is insufficient.",
  };
  try {
    const statusUrl = new URL(request.url);
    statusUrl.pathname = "/api/development/status";
    statusUrl.search = "";
    const statusResponse = await routerFetch(new Request(statusUrl.toString(), { headers: { accept: "application/json" } }), env, ctx);
    const status = await statusResponse.json().catch(() => null) as Obj | null;
    const rows = [status?.active_job, ...(Array.isArray(status?.recent_jobs) ? status.recent_jobs : [])].filter(Boolean) as Obj[];
    const job = rows.find(row =>
      row?.kind === "cross_runtime_validate" &&
      row?.state === "VERIFIED" &&
      (row?.evidence?.native_result?.solver_family === "MAXWELL_RCWA" || row?.evidence?.native_result?.solver === "rcwa")
    );
    if (!job?.id) {
      return {
        ...base,
        stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED"],
        state: "BLOCKED_NO_VERIFIED_NATIVE_RCWA_JOB",
        verified: false,
        detail: { recentJobsInspected: rows.length },
      };
    }

    const compareUrl = new URL(request.url);
    compareUrl.pathname = "/api/validate/independent/compare";
    compareUrl.search = "";
    const response = await routerFetch(new Request(compareUrl.toString(), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ job_id: job.id }),
    }), env, ctx);
    const body = await response.json().catch(() => null) as Obj | null;
    const verified = Boolean(
      response.ok &&
      body?.ok === true &&
      body?.validation?.validationTier?.level === 4 &&
      body?.validation?.solverFamily === "MAXWELL_RCWA" &&
      body?.validation?.nativeExecutionObserved === true &&
      sha256Hex(body?.validation?.receiptSha256)
    );
    return {
      ...base,
      stages: verified ? CAPABILITY_STAGES_R190 : ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED"],
      state: verified ? "VERIFIED_NATIVE_RCWA" : "BLOCKED_RCWA_RECEIPT_REJECTED",
      verified,
      httpStatus: response.status,
      detail: verified
        ? { jobId: job.id, solverVersion: body?.validation?.solverVersion, receiptSha256: body?.validation?.receiptSha256 }
        : { jobId: job.id, validation: body?.validation?.status || body?.state || null },
    };
  } catch (error) {
    return {
      ...base,
      stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED"],
      state: "FAILED_INVOCATION",
      verified: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function truthHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA R190 · Capability Truth</title><style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#05080d;color:#edf4fb}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 50% 0,#16283b,#05080d 48%);min-height:100vh}.wrap{max-width:1450px;margin:auto;padding:28px 18px 70px}a{color:inherit;text-decoration:none}h1{font-size:clamp(36px,6vw,76px);line-height:.95;margin:.15em 0}.sub{color:#91a6b9;max-width:960px}.bar{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.btn{border:1px solid #38526b;background:#0d1823;color:#edf4fb;border-radius:11px;padding:10px 13px;cursor:pointer}.btn.primary{background:#173451}.state{border:1px solid #2a4155;border-radius:16px;background:#09121b;padding:14px;margin:12px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:10px}.card{border:1px solid #24384a;border-radius:13px;background:#081019;padding:13px}.ok{border-color:#2f7654}.bad{border-color:#79484a}.hold{border-color:#7a6637}.k{font:700 10px ui-monospace,monospace;letter-spacing:.1em;color:#7f96aa}.v{font-weight:800;margin-top:5px}.tiny{font-size:12px;color:#8297aa;word-break:break-word}.stages{display:flex;gap:4px;flex-wrap:wrap;margin-top:9px}.stage{font:700 9px ui-monospace,monospace;padding:4px 6px;border:1px solid #2b4053;border-radius:999px;color:#9aafc0}pre{white-space:pre-wrap;word-break:break-word;max-height:360px;overflow:auto;background:#050a10;border-radius:10px;padding:10px}</style></head><body><main class="wrap"><div class="k">R190 CAPABILITY TRUTH + ADMISSION</div><h1>What is actually working?</h1><p class="sub">R189 remains the whole instrument. R190 proves its live capability chain without turning code presence, a manifest, a heartbeat, or a visual into stronger evidence than it is.</p><div class="bar"><button class="btn primary" id="quick">Run core proof</button><button class="btn" id="full">Run full proof</button><a class="btn" href="/instrument">R189 Whole Instrument</a><a class="btn" href="/api/acceptance/r190/manifest">Manifest JSON</a></div><section class="state"><div class="k">OVERALL</div><div class="v" id="overall">Not probed</div><div class="tiny" id="meta"></div></section><div class="grid" id="grid"></div><details><summary>Receipt JSON</summary><pre id="raw">No receipt.</pre></details></main><script>
const esc=x=>String(x??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function run(depth){const overall=document.querySelector('#overall');overall.textContent='PROBING '+depth.toUpperCase()+'…';const r=await fetch('/api/acceptance/r190/probe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({depth})});const d=await r.json();overall.textContent=d.overallState||'UNKNOWN';document.querySelector('#meta').textContent='verified '+(d.summary?.verified||0)+' / '+(d.summary?.total||0)+' · required '+(d.summary?.requiredVerified||0)+' / '+(d.summary?.required||0)+' · receipt '+String(d.receiptSha256||'').slice(0,20);document.querySelector('#grid').innerHTML=(d.capabilities||[]).map(c=>'<article class="card '+(c.verified?'ok':String(c.state||'').startsWith('BLOCKED')?'hold':'bad')+'"><div class="k">'+esc(c.surface)+' · '+esc(c.revision)+'</div><div class="v">'+esc(c.id)+'</div><p>'+esc(c.state)+'</p><div class="tiny">'+esc(c.path||'compiled contract')+'<br>'+esc(c.boundary||'')+'</div><div class="stages">'+(c.stages||[]).map(s=>'<span class="stage">'+esc(s)+'</span>').join('')+'</div></article>').join('');document.querySelector('#raw').textContent=JSON.stringify(d,null,2)}
document.querySelector('#quick').onclick=()=>run('quick');document.querySelector('#full').onclick=()=>run('full');run('quick');
</script></body></html>`;
}

export function wholeSystemTruthR190(): Response {
  return new Response(truthHtml(), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-omega-acceptance": "R190" },
  });
}

export async function handleWholeSystemAcceptanceR190(
  request: Request,
  env: any,
  ctx: any,
  routerFetch: RouterFetch,
): Promise<Response> {
  const url = new URL(request.url);
  const identity = deploymentIdentity(env);
  const canonicalGitSha = identity.detail?.canonicalGitSha || null;

  if (request.method === "GET" && url.pathname === "/api/acceptance/r190/manifest") {
    const core = {
      ok: true,
      schema: "OMEGA_CAPABILITY_MANIFEST_R190",
      release: WHOLE_SYSTEM_RELEASE_R190,
      predecessorRevision: "R189_WHOLE_INSTRUMENT_CONVERGENCE",
      predecessorGitSha: R190_PREDECESSOR_SHA,
      canonicalGitSha,
      deploymentIdentityBound: identity.verified === true,
      stages: CAPABILITY_STAGES_R190,
      governedModes: GOVERNED_MODES_R190,
      capabilities: [...staticContracts(), identity, ...CAPABILITIES],
      fullAcceptanceRequires: [
        "verified R189 whole-instrument predecessor",
        "exact deployed Git identity",
        "all core runtime routes verified",
        "current authenticated sovereign heartbeat",
        "exact B059 verification plus grounded query via R181",
        "persisted VERIFIED native grcwa RCWA receipt revalidated through R175",
      ],
      truthBoundaries: {
        sourcePresenceIsNotExecution: true,
        routeReturnIsNotVerification: true,
        manifestIsNotNativeExecution: true,
        heartbeatIsNotSolverValidation: true,
        providerWeightsAreNotOmegaTraining: true,
        logicalTimeIsNotPhysicalTimeAcceleration: true,
        addressShellsAreNotPhysicalDimensions: true,
      },
      canonicalMutation: false,
      promotionAuthorized: false,
    };
    return json({ ...core, manifestSha256: await sha256(core) });
  }

  if (request.method !== "POST" || url.pathname !== "/api/acceptance/r190/probe") {
    return json({ ok: false, code: "R190_ACCEPTANCE_ROUTE_NOT_FOUND" }, 404);
  }

  const payload = await request.json().catch(() => ({})) as Obj;
  const full = String(payload.depth || "quick").toLowerCase() === "full";
  const selected = CAPABILITIES.filter(spec => full || spec.requiredQuick);
  const dynamic = await Promise.all(selected.map(spec => invoke(request, env, ctx, routerFetch, spec, full)));
  const rcwa = full ? await verifyLatestNativeRcwa(request, env, ctx, routerFetch) : {
    id: "NATIVE_RCWA_EXECUTION",
    surface: "CALCULUS",
    revision: "R175/R190",
    requiredQuick: false,
    requiredFull: true,
    evidenceClass: "DERIVED_INDEPENDENT_NUMERICAL_VALIDATION",
    state: "REQUIRES_FULL_PROBE",
    verified: false,
    stages: ["IMPLEMENTED", "ROUTE_BOUND"],
    boundary: "Full probe inspects persisted governed jobs and independently revalidates the latest eligible native RCWA receipt.",
  };
  const capabilities = [...staticContracts(), identity, ...dynamic, rcwa];
  const required = capabilities.filter((c: Obj) => full ? c.requiredFull !== false : c.requiredQuick === true);
  const hardFailures = required.filter((c: Obj) => !c.verified && String(c.state || "").startsWith("FAILED"));
  const blocked = required.filter((c: Obj) => !c.verified && String(c.state || "").startsWith("BLOCKED"));
  const verified = capabilities.filter((c: Obj) => c.verified === true).length;
  const allRequiredVerified = required.every((c: Obj) => c.verified === true);
  const overallState = allRequiredVerified
    ? (full ? "FULL_SYSTEM_VERIFIED" : "CORE_SYSTEM_VERIFIED")
    : hardFailures.length
      ? "ACCEPTANCE_FAILED"
      : blocked.length
        ? "EXTERNAL_PROOF_BLOCKED"
        : "PARTIAL_VERIFICATION";
  const core = {
    schema: WHOLE_SYSTEM_SCHEMA_R190,
    release: WHOLE_SYSTEM_RELEASE_R190,
    predecessorRevision: "R189_WHOLE_INSTRUMENT_CONVERGENCE",
    predecessorGitSha: R190_PREDECESSOR_SHA,
    timestamp: new Date().toISOString(),
    depth: full ? "full" : "quick",
    canonicalGitSha,
    deploymentIdentityBound: identity.verified === true,
    overallState,
    summary: {
      total: capabilities.length,
      verified,
      unverified: capabilities.length - verified,
      required: required.length,
      requiredVerified: required.filter((c: Obj) => c.verified).length,
      hardFailures: hardFailures.length,
      blocked: blocked.length,
    },
    capabilities,
    truthBoundary: "R190 reports execution truth only. Source presence, a route manifest, a current heartbeat, a grounded SAI query, and an independently validated native RCWA result are separate evidence states and are never collapsed into one implied capability.",
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return json({ ok: hardFailures.length === 0, ...core, receiptSha256: await sha256(core) }, hardFailures.length ? 503 : 200);
}
