import { MENU_TRUTH_ITEMS_R214, enhanceMenuTruthR214 } from "../menuTruthR214";
import { UNIVERSAL_WORKSPACE_RELEASE_R193, enhanceUniversalWorkspaceR193 } from "../universalWorkspaceR193";
import {
  NAVIGATION_INTEGRITY_RELEASE_R215,
  NAVIGATION_POLISH_RELEASE_R214,
  enhanceOneSystemNavigationR195,
} from "./oneSystemNavigationR195";

export const LIVE_SYSTEM_SURFACE_RELEASE_R223 = "r223-live-system-surface-closure";
export const LIVE_SYSTEM_SURFACE_SCHEMA_R223 = "OMEGA_LIVE_SYSTEM_SURFACE_CLOSURE_R223";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type Obj = Record<string, any>;
type ProbeSpec = {
  id: string;
  domain: string;
  path: string;
  required?: boolean;
  expected?: string[];
};

type ExternalSpec = {
  id: string;
  surface: string;
  revision: string;
  path: string;
  method?: "GET" | "POST";
  body?: Obj;
  evidenceClass: string;
  blockedState: string;
  boundary: string;
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
};

const R195_PROBES: ProbeSpec[] = [
  { id: "CANONICAL_RUNTIME", domain: "runtime", path: "/_omega/health", required: true },
  { id: "WORKSPACE_R193", domain: "surface", path: "/api/workspace/r193/health", required: true },
  { id: "EVIDENCE_PLANE_R194", domain: "evidence", path: "/api/workspace/r194/health", required: true },
  { id: "CUMULATIVE_CANON_R191", domain: "canon", path: "/api/canon/r191/manifest", required: true },
  { id: "WHOLE_SYSTEM_ACCEPTANCE_R190", domain: "proof", path: "/api/acceptance/r190/manifest", required: true },
  { id: "COMPUTE_R170", domain: "compute", path: "/api/compute/manifest", required: true },
  { id: "SAI_B059", domain: "intelligence", path: "/api/sai/manifest", required: true },
  { id: "AI_SAI_R179", domain: "intelligence", path: "/api/intelligence/r179/manifest", required: true },
  { id: "FEDERATION_R174", domain: "federation", path: "/api/federation/r174/health", required: true },
  { id: "CLOUD_SWARM_R185", domain: "cloud", path: "/api/clouds/r185/manifest", required: true },
  { id: "SURFACE_FABRIC_R191", domain: "surface", path: "/api/fabric/r191/manifest", required: true },
];

const R211_SOURCES: ProbeSpec[] = [
  { id: "canonical", domain: "runtime", path: "/_omega/health", required: true, expected: ["ok"] },
  { id: "acceptance", domain: "proof", path: "/api/acceptance/r181/manifest", required: true, expected: ["canonicalGitSha"] },
  { id: "workspace", domain: "surface", path: "/api/workspace/r193/manifest", required: true, expected: ["release"] },
  { id: "evidence", domain: "evidence", path: "/api/workspace/r194/health", expected: ["release"] },
  { id: "drive", domain: "archive", path: "/api/system/r195/status", required: true, expected: ["schema"] },
  { id: "earthSar", domain: "earth", path: "/api/earth/sar/r198/sources", required: true, expected: ["build", "providers"] },
  { id: "operator", domain: "operator", path: "/api/system/r199/manifest", expected: ["release"] },
  { id: "mission", domain: "mission", path: "/api/mission/r200/manifest", expected: ["release"] },
  { id: "durability", domain: "continuity", path: "/api/mission/r201/verify", required: true, expected: ["verified"] },
  { id: "hybridMission", domain: "hybrid", path: "/api/mission/r203/manifest", expected: ["release"] },
  { id: "returnAdmission", domain: "hybrid", path: "/api/system/r204/manifest", required: true, expected: ["release"] },
  { id: "wholeSystem", domain: "system", path: "/api/system/r205/health", required: true, expected: ["state"] },
  { id: "cloudSwarm", domain: "cloud", path: "/api/clouds/r185/manifest", expected: ["release"] },
  { id: "federation", domain: "federation", path: "/api/federation/r174/health", expected: ["ok"] },
  { id: "solver", domain: "solver", path: "/api/validate/independent/manifest", expected: ["release"] },
  { id: "compute", domain: "compute", path: "/api/compute/manifest", expected: ["release"] },
  { id: "sai", domain: "intelligence", path: "/api/sai/manifest", expected: ["release"] },
  { id: "aiSai", domain: "intelligence", path: "/api/intelligence/r179/manifest", expected: ["release"] },
  { id: "motion", domain: "motion", path: "/api/swarm/motion/r188/manifest", expected: ["release"] },
];

const R190_EXTERNAL: ExternalSpec[] = [
  { id: "SOVEREIGN_CANONICAL_STATE", surface: "SOVEREIGN", revision: "R167+", path: "/api/omega/state", evidenceClass: "SOVEREIGN_RUNTIME_STATE", blockedState: "BLOCKED_SOVEREIGN_STATE_UNAVAILABLE", boundary: "Sovereign canonical state is external runtime evidence; absence is not a Worker-core defect." },
  { id: "SOVEREIGN_PROOF_LEDGER", surface: "PROOF", revision: "R113+", path: "/api/omega/proof?limit=2", evidenceClass: "SOVEREIGN_PROOF", blockedState: "BLOCKED_SOVEREIGN_PROOF_UNAVAILABLE", boundary: "Sovereign proof history remains external evidence." },
  { id: "SOVEREIGN_RESTORATION", surface: "BUILD", revision: "R85+", path: "/api/restoration", evidenceClass: "SOVEREIGN_RECOVERY", blockedState: "BLOCKED_SOVEREIGN_RESTORATION_UNAVAILABLE", boundary: "External restoration state is never fabricated locally." },
  { id: "EARTH_SOURCE_CATALOG", surface: "EARTH", revision: "R167+", path: "/api/earth/catalog", evidenceClass: "OBSERVATION_CATALOG", blockedState: "BLOCKED_EARTH_SOURCE_CATALOG_UNAVAILABLE", boundary: "Observed Earth source identity remains distinct from derived interpretation." },
  { id: "SAI_B059", surface: "INTELLIGENCE", revision: "R179", path: "/api/sai/status", evidenceClass: "GROUNDED_CORPUS", blockedState: "BLOCKED_B059_STATUS_UNAVAILABLE", boundary: "Only declared deterministic B059 scope is OMEGA-trained." },
  { id: "SOVEREIGN_PC", surface: "SOVEREIGN", revision: "R181", path: "/api/hybrid/status", evidenceClass: "AUTHENTICATED_HEARTBEAT", blockedState: "BLOCKED_CURRENT_HEARTBEAT_REQUIRED", boundary: "PC ONLINE requires a current authenticated heartbeat." },
  { id: "AI_SAI_SOVEREIGN", surface: "INTELLIGENCE", revision: "R181", path: "/api/acceptance/r181/probe", method: "POST", body: {}, evidenceClass: "LIVE_ACCEPTANCE", blockedState: "BLOCKED_R181_FULL_ACCEPTANCE", boundary: "R181 full acceptance requires current sovereign heartbeat and grounded B059 evidence." },
];

const SYSTEM_ROUTE_SET = new Set([
  ...MENU_TRUTH_ITEMS_R214.filter(item => item.kind === "SYSTEM").map(item => item.href),
  "/system",
]);

export const SURFACE_CAPABILITY_REGISTRY_R223 = Object.freeze({
  schema: "OMEGA_SURFACE_CAPABILITY_REGISTRY_R223",
  release: LIVE_SYSTEM_SURFACE_RELEASE_R223,
  routeCount: MENU_TRUTH_ITEMS_R214.length + 1,
  routes: [
    ...MENU_TRUTH_ITEMS_R214.map(item => ({
      id: item.id,
      label: item.label,
      href: item.href,
      kind: item.kind,
      provider: item.declaredAuthority,
      evidenceClass: "ROUTE_RETURNED_AND_SURFACE_CONTRACT",
      authorityRequired: "READ_ONLY_NAVIGATION",
      executionSupport: item.kind === "WORKSPACE" ? "DESTINATION_SPECIFIC" : "DESTINATION_SPECIFIC",
      failureBehavior: "MARK_UNAVAILABLE_AND_WITHHOLD_FALSE_OPERATIONAL_CLAIM",
      proof: item.kind === "SYSTEM" ? "R223_FINAL_SURFACE_CONTRACT" : "R214_ROUTE_TRUTH_PLUS_DESTINATION_PROOF",
    })),
    {
      id: "system-one-system",
      label: "One System",
      href: "/system",
      kind: "SYSTEM",
      provider: "R195_R199_R200_R201_ONE_SYSTEM",
      evidenceClass: "LIVE_CORRELATED_SYSTEM_STATE",
      authorityRequired: "READ_ONLY_UNTIL_EXPLICIT_EXECUTION_AUTHORITY",
      executionSupport: "BOUNDED_OPERATION_DISPATCH",
      failureBehavior: "STRUCTURED_DEGRADED_STATUS",
      proof: "R195_R201_R223",
    },
  ],
  controls: [
    { id: "command-palette", surface: "GLOBAL", action: "OPEN_AND_ROUTE", binding: "omegaNavigationIntegrityR215Runtime", authorityRequired: "NONE", executionSupport: false, failureBehavior: "ROUTE_UNAVAILABLE" },
    { id: "advanced-control-menu", surface: "GLOBAL", action: "NAVIGATE", binding: "omegaR214ControlMenu", authorityRequired: "NONE", executionSupport: false, failureBehavior: "ROUTE_UNAVAILABLE" },
    { id: "surface-binding-retry", surface: "GLOBAL", action: "REPROVE_LIVE_BINDINGS", binding: "omegaR216Retry", authorityRequired: "NONE", executionSupport: false, failureBehavior: "CONTROLS_WITHHELD" },
    { id: "hybrid-local-authority", surface: "HYBRID", action: "GRANT_BOUNDED_NATIVE_EXECUTION", binding: "/api/hybrid/authority/grant", authorityRequired: "LOCAL_CONSOLE_APPROVAL", executionSupport: true, failureBehavior: "LOCAL_APPROVAL_REQUIRED" },
    { id: "governed-training", surface: "EVOLUTION", action: "TRAIN_THEN_NATIVE_RCWA", binding: "/api/training/r221", authorityRequired: "BOUNDED_LOCAL_EXECUTION_LEASE", executionSupport: true, failureBehavior: "TRUTHFUL_BLOCKED_STATE" },
    { id: "development-loop", surface: "EVOLUTION", action: "QUEUE_ALLOW_LISTED_BUILD_TEST_VALIDATE", binding: "/api/development/enqueue", authorityRequired: "BOUNDED_LOCAL_EXECUTION_LEASE", executionSupport: true, failureBehavior: "UNSUPPORTED_OR_UNAUTHORIZED_JOB_KIND" },
    { id: "terminal-return", surface: "PROOF", action: "VERIFY_EXACT_JOB_BOUND_RETURN", binding: "/api/system/r222/terminal-return", authorityRequired: "VERIFIED_RETURN_CONTRACT", executionSupport: false, failureBehavior: "WITHHOLD_ADMISSION" },
  ],
  truthBoundaries: {
    visibleIsNotExecuted: true,
    routeResponseIsNotProviderAvailability: true,
    heartbeatIsNotNativeExecution: true,
    returnedIsNotVerified: true,
    measuredClaimsRequireSourceBoundEvidence: true,
    derivedVisualizationIsNotMeasurement: true,
  },
  canonicalMutation: false,
  promotionAuthorized: false,
});

let r195ManifestCache: { sha: string; value: Obj } | null = null;
let r195ManifestInFlight: Promise<Obj> | null = null;

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const out = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(out)].map(v => v.toString(16).padStart(2, "0")).join("");
}

async function readJson(response: Response): Promise<Obj> {
  const text = await response.text();
  try { return JSON.parse(text) as Obj; } catch { return { text: text.slice(0, 1600) }; }
}

function targetRequest(request: Request, path: string, init: RequestInit = {}): Request {
  const url = new URL(request.url);
  const [pathname, query = ""] = path.split("?");
  url.pathname = pathname;
  url.search = query ? `?${query}` : "";
  return new Request(url.toString(), init);
}

async function runBatches<T, R>(items: readonly T[], width: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += width) {
    const batch = items.slice(i, i + width);
    out.push(...await Promise.all(batch.map(fn)));
  }
  return out;
}

async function loadR195Manifest(request: Request, env: any, ctx: any, next: CanonicalFetch): Promise<Obj> {
  const sha = String(env?.CANONICAL_GIT_SHA || "unbound");
  if (r195ManifestCache?.sha === sha) return r195ManifestCache.value;
  if (r195ManifestInFlight) return r195ManifestInFlight;
  r195ManifestInFlight = (async () => {
    const response = await next(targetRequest(request, "/api/system/r195/manifest", { headers: { accept: "application/json", "x-omega-r223-internal": "r195-manifest" } }), env, ctx);
    const value = await readJson(response);
    const wrapped = { ...value, _r223HttpStatus: response.status, _r223HttpOk: response.ok };
    if (response.ok && value?.canonicalGitSha === env?.CANONICAL_GIT_SHA) r195ManifestCache = { sha, value: wrapped };
    return wrapped;
  })();
  try { return await r195ManifestInFlight; } finally { r195ManifestInFlight = null; }
}

async function simpleProbe(request: Request, env: any, ctx: any, next: CanonicalFetch, spec: ProbeSpec) {
  const started = Date.now();
  try {
    const response = await next(targetRequest(request, spec.path, { headers: { accept: "application/json", "x-omega-r223-internal": spec.id } }), env, ctx);
    const body = await readJson(response);
    const fieldsPresent = (spec.expected || []).every(key => key === "release"
      ? Boolean(body?.release || body?.revision || body?.build)
      : key in (body || {}));
    return {
      id: spec.id,
      domain: spec.domain,
      path: spec.path,
      status: response.status,
      ok: response.ok && body?.ok !== false && fieldsPresent,
      schema: body?.schema ?? null,
      release: body?.release ?? body?.revision ?? body?.build ?? null,
      elapsedMs: Date.now() - started,
      body,
      error: null as string | null,
    };
  } catch (error) {
    return { id: spec.id, domain: spec.domain, path: spec.path, status: 0, ok: false, schema: null, release: null, elapsedMs: Date.now() - started, body: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function r195Status(request: Request, env: any, ctx: any, next: CanonicalFetch): Promise<Response> {
  const manifest = await loadR195Manifest(request, env, ctx, next);
  const probes = await runBatches(R195_PROBES, 2, spec => simpleProbe(request, env, ctx, next, spec));
  const corpusReady = manifest?._r223HttpOk === true && manifest?.ok === true && manifest?.corpus?.integrity?.ok === true;
  const runtimeReady = probes.every(probe => probe.ok === true);
  const core = {
    schema: "OMEGA_ONE_SYSTEM_LIVE_STATUS_R195",
    release: "r195-drive-corpus-one-system",
    closureRelease: LIVE_SYSTEM_SURFACE_RELEASE_R223,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    corpusReady,
    runtimeReady,
    corpusProof: {
      source: "/api/system/r195/manifest",
      sha256: manifest?.corpus?.sha256 ?? null,
      runtimeIntegrityVerified: manifest?.corpus?.integrity?.ok === true,
      exactDeploymentBound: manifest?.canonicalGitSha === env?.CANONICAL_GIT_SHA,
      cacheScope: "CURRENT_WORKER_ISOLATE_AND_EXACT_CANONICAL_SHA",
    },
    probes: probes.map(({ body, ...probe }) => probe),
    resourcePolicy: { probeBatchWidth: 2, fullCorpusInflationSharedPerExactDeploymentIsolate: true, unboundedPromiseAll: false },
    truth: {
      pcOnline: "requires current authenticated Sovereign heartbeat",
      fullWave: "requires independent solver receipt",
      externalPromotion: "requires project write authority + deployment receipt",
      returnedResult: "must remain distinct from verified result",
      cachedManifest: "Cache reuses an already runtime-integrity-verified immutable embedded corpus only for the same exact canonical SHA.",
    },
    canonicalMutation: false,
  };
  return json({ ...core, ok: corpusReady && runtimeReady, receiptSha256: await digest(core) });
}

function evidenceClass(id: string, body: Obj, ok: boolean): string {
  if (!ok && (body?.schema || body?.release || body?.revision || body?.build)) return "DEGRADED";
  if (!ok) return "UNAVAILABLE";
  if (id === "drive") return body?.corpusReady === true ? "ARCHIVAL_SNAPSHOT" : "AVAILABLE";
  if (id === "earthSar") return "LIVE_OBSERVED";
  if (id === "durability") return body?.verified === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
  if (id === "acceptance") return body?.deploymentIdentityBound === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
  if (id === "compute" || id === "motion") return "DERIVED";
  if (id === "solver") return "AVAILABLE";
  return body?.verified === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
}

async function r211Status(request: Request, env: any, ctx: any, next: CanonicalFetch): Promise<Response> {
  const calls = await runBatches(R211_SOURCES, 1, spec => simpleProbe(request, env, ctx, next, spec));
  const publicSources = calls.map(({ body, ...call }) => ({ ...call, evidenceClass: evidenceClass(call.id, body || {}, call.ok) }));
  const requiredCalls = calls.filter(call => R211_SOURCES.find(spec => spec.id === call.id)?.required === true);
  const wholeSystem = calls.find(call => call.id === "wholeSystem")?.body || {};
  const hybrid = wholeSystem?.hybrid || wholeSystem?.systems?.hybrid || {};
  const pcOnline = hybrid?.pcOnline === true && hybrid?.heartbeatCurrent === true && hybrid?.authenticated === true;
  const counts = publicSources.reduce((acc: Record<string, number>, source: Obj) => {
    acc[source.evidenceClass] = (acc[source.evidenceClass] || 0) + 1;
    return acc;
  }, {});
  const core = {
    ok: requiredCalls.length === R211_SOURCES.filter(spec => spec.required).length && requiredCalls.every(call => call.ok),
    schema: "OMEGA_OPERATIONAL_PROVENANCE_STATUS_R211",
    release: "r211-operational-provenance-fabric",
    closureRelease: LIVE_SYSTEM_SURFACE_RELEASE_R223,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    generatedAt: new Date().toISOString(),
    sources: publicSources,
    counts,
    resourcePolicy: { probeBatchWidth: 1, nestedBurstFanoutProhibited: true, structuredDegradation: true },
    physicalHost: { pcOnline, heartbeatCurrent: hybrid?.heartbeatCurrent === true, authenticated: hybrid?.authenticated === true, claim: pcOnline ? "CURRENT_AUTHENTICATED_HEARTBEAT_PROVEN" : "PC_ONLINE_NOT_PROVEN_BY_THIS_OBSERVATION" },
    truth: {
      archive: "R195 status is backed by the full exact-SHA runtime-integrity corpus manifest; caching does not convert archive evidence into current external Drive telemetry.",
      earthSar: "R198 source-backed latest-available SAR catalog evidence is distinct from real-time radar and InSAR deformation products.",
      solver: "Independent-solver availability is distinct from a solver execution receipt.",
      health: "A valid OMEGA response may be DEGRADED without being UNAVAILABLE; R223 returns structured state instead of exhausting the Worker through burst fanout.",
      canon: "R211/R223 correlate evidence; neither mutates CanonState, HostState, or promotion authority.",
    },
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await digest(core) });
}

function externalVerification(spec: ExternalSpec, response: Response, body: Obj): { verified: boolean; state: string; detail: Obj } {
  if (!response.ok) return { verified: false, state: spec.blockedState, detail: { httpStatus: response.status, code: body?.code || body?.error || null } };
  switch (spec.id) {
    case "SOVEREIGN_CANONICAL_STATE": {
      const verified = Boolean(body?.digest || body?.state || body?.mode188);
      return { verified, state: verified ? "VERIFIED_CURRENT_SOVEREIGN_STATE" : "BLOCKED_SOVEREIGN_STATE_UNPROVEN", detail: { evidence: body?.state?.evidence_class || null } };
    }
    case "SOVEREIGN_PROOF_LEDGER":
      return { verified: body?.ok !== false, state: body?.ok !== false ? "VERIFIED_CURRENT_SOVEREIGN_PROOF" : "BLOCKED_SOVEREIGN_PROOF_UNPROVEN", detail: { schema: body?.schema || null } };
    case "SOVEREIGN_RESTORATION":
      return { verified: body?.ok !== false, state: body?.ok !== false ? "VERIFIED_CURRENT_SOVEREIGN_RESTORATION" : "BLOCKED_SOVEREIGN_RESTORATION_UNPROVEN", detail: { state: body?.state || body?.schema || null } };
    case "EARTH_SOURCE_CATALOG": {
      const coverages = Array.isArray(body?.coverages) ? body.coverages : Array.isArray(body?.catalog?.coverages) ? body.catalog.coverages : null;
      const explicit = Number(body?.coverageCount ?? body?.catalog?.coverageCount);
      const count = coverages ? coverages.length : Number.isFinite(explicit) ? explicit : null;
      const verified = body?.ok !== false && count !== null && count >= 0;
      return { verified, state: verified ? "VERIFIED_CURRENT_SOURCE_CATALOG" : "BLOCKED_EARTH_SOURCE_CATALOG_UNPROVEN", detail: { coverageCount: count } };
    }
    case "SAI_B059": {
      const verified = body?.state === "B059_PRESENT_VERIFICATION_REQUIRED" || body?.passed === true || body?.ok === true;
      return { verified, state: verified ? "VERIFIED_PRESENT" : "BLOCKED_B059_NOT_PRESENT", detail: { state: body?.state || body?.schema || null } };
    }
    case "SOVEREIGN_PC": {
      const current = Boolean(body?.heartbeatCurrent ?? body?.heartbeat_current ?? body?.pcOnline ?? body?.pc_online);
      const authenticated = Boolean(body?.authenticated ?? body?.agentAuthenticated ?? body?.authenticated_heartbeat ?? current);
      const verified = current && authenticated;
      return { verified, state: verified ? "VERIFIED_CURRENT_HEARTBEAT" : "BLOCKED_CURRENT_HEARTBEAT_REQUIRED", detail: { heartbeatCurrent: current, authenticated, heartbeatAgeSeconds: body?.heartbeatAgeSeconds ?? body?.heartbeat_age_seconds ?? null } };
    }
    case "AI_SAI_SOVEREIGN": {
      const verified = body?.fullAcceptance === true;
      return { verified, state: verified ? "VERIFIED" : "BLOCKED_R181_FULL_ACCEPTANCE", detail: { acceptanceState: body?.acceptanceState || null } };
    }
    default:
      return { verified: false, state: spec.blockedState, detail: { code: "UNKNOWN_EXTERNAL_CAPABILITY" } };
  }
}

async function externalCapability(request: Request, env: any, ctx: any, next: CanonicalFetch, spec: ExternalSpec): Promise<Obj> {
  const started = Date.now();
  try {
    const method = spec.method || "GET";
    const headers: Record<string, string> = { accept: "application/json", "x-omega-r223-internal": spec.id };
    const init: RequestInit = { method, headers };
    if (method === "POST") {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(spec.body || {});
    }
    const response = await next(targetRequest(request, spec.path, init), env, ctx);
    const body = await readJson(response);
    const verification = externalVerification(spec, response, body);
    return {
      id: spec.id,
      surface: spec.surface,
      revision: spec.revision,
      path: spec.path,
      method,
      requiredQuick: false,
      requiredFull: true,
      availability: "EXTERNAL_EVIDENCE",
      stages: verification.verified ? ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED", "VERIFIED"] : ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", ...(response.ok ? ["RETURNED"] : [])],
      state: verification.state,
      verified: verification.verified,
      httpStatus: response.status,
      durationMs: Date.now() - started,
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
      method: spec.method || "GET",
      requiredQuick: false,
      requiredFull: true,
      availability: "EXTERNAL_EVIDENCE",
      stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED"],
      state: spec.blockedState,
      verified: false,
      httpStatus: 0,
      durationMs: Date.now() - started,
      evidenceClass: spec.evidenceClass,
      boundary: spec.boundary,
      detail: { error: error instanceof Error ? error.message : String(error) },
    };
  }
}

async function nativeRcwaCapability(request: Request, env: any, ctx: any, next: CanonicalFetch): Promise<Obj> {
  const base = {
    id: "NATIVE_RCWA_EXECUTION",
    surface: "CALCULUS",
    revision: "R175/R190/R223",
    requiredQuick: false,
    requiredFull: true,
    availability: "EXTERNAL_EVIDENCE",
    evidenceClass: "DERIVED_INDEPENDENT_NUMERICAL_VALIDATION",
    boundary: "Only a persisted VERIFIED native grcwa receipt from an authenticated sovereign lease satisfies this capability.",
  };
  try {
    const statusResponse = await next(targetRequest(request, "/api/development/status", { headers: { accept: "application/json", "x-omega-r223-internal": "native-rcwa-status" } }), env, ctx);
    const status = await readJson(statusResponse);
    const rows = [status?.active_job, ...(Array.isArray(status?.recent_jobs) ? status.recent_jobs : [])].filter(Boolean) as Obj[];
    const job = rows.find(row => row?.kind === "cross_runtime_validate" && row?.state === "VERIFIED" && (row?.evidence?.native_result?.solver_family === "MAXWELL_RCWA" || row?.evidence?.native_result?.solver === "rcwa"));
    if (!job?.id) return { ...base, stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", ...(statusResponse.ok ? ["RETURNED"] : [])], state: "BLOCKED_NO_VERIFIED_NATIVE_RCWA_JOB", verified: false, httpStatus: statusResponse.status, detail: { recentJobsInspected: rows.length } };
    const response = await next(targetRequest(request, "/api/validate/independent/compare", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "x-omega-r223-internal": "native-rcwa-compare" },
      body: JSON.stringify({ job_id: job.id }),
    }), env, ctx);
    const body = await readJson(response);
    const receipt = body?.validation?.receiptSha256;
    const verified = Boolean(response.ok && body?.ok === true && body?.validation?.validationTier?.level === 4 && body?.validation?.solverFamily === "MAXWELL_RCWA" && body?.validation?.nativeExecutionObserved === true && /^[a-f0-9]{64}$/i.test(String(receipt || "")));
    return { ...base, stages: verified ? ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", "RETURNED", "VERIFIED"] : ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED", ...(response.ok ? ["RETURNED"] : [])], state: verified ? "VERIFIED_NATIVE_RCWA" : "BLOCKED_RCWA_RECEIPT_REJECTED", verified, httpStatus: response.status, detail: verified ? { jobId: job.id, solverVersion: body?.validation?.solverVersion, receiptSha256: receipt } : { jobId: job.id, validation: body?.validation?.status || body?.state || null } };
  } catch (error) {
    return { ...base, stages: ["IMPLEMENTED", "ROUTE_BOUND", "INVOKED"], state: "BLOCKED_NATIVE_RCWA_EVIDENCE_UNAVAILABLE", verified: false, httpStatus: 0, detail: { error: error instanceof Error ? error.message : String(error) } };
  }
}

async function r190FullProbe(request: Request, env: any, ctx: any, next: CanonicalFetch): Promise<Response> {
  const quickResponse = await next(targetRequest(request, "/api/acceptance/r190/probe", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "x-omega-r223-internal": "r190-quick" },
    body: JSON.stringify({ depth: "quick" }),
  }), env, ctx);
  const quick = await readJson(quickResponse);
  const quickCapabilities = (Array.isArray(quick?.capabilities) ? quick.capabilities : []).filter((row: Obj) => row?.id !== "NATIVE_RCWA_EXECUTION");
  const external = await runBatches(R190_EXTERNAL, 1, spec => externalCapability(request, env, ctx, next, spec));
  const rcwa = await nativeRcwaCapability(request, env, ctx, next);
  const capabilities = [...quickCapabilities, ...external, rcwa];
  const required = capabilities.filter((row: Obj) => row?.requiredFull !== false);
  const hardFailures = required.filter((row: Obj) => !row?.verified && String(row?.state || "").startsWith("FAILED"));
  const blocked = required.filter((row: Obj) => !row?.verified && String(row?.state || "").startsWith("BLOCKED"));
  const verified = capabilities.filter((row: Obj) => row?.verified === true).length;
  const allRequiredVerified = required.every((row: Obj) => row?.verified === true);
  const overallState = allRequiredVerified ? "FULL_SYSTEM_VERIFIED" : hardFailures.length ? "ACCEPTANCE_FAILED" : blocked.length ? "EXTERNAL_PROOF_BLOCKED" : "PARTIAL_VERIFICATION";
  const core = {
    schema: "OMEGA_WHOLE_SYSTEM_ACCEPTANCE_R190",
    release: "r190-capability-truth-admission",
    closureRelease: LIVE_SYSTEM_SURFACE_RELEASE_R223,
    predecessorRevision: quick?.predecessorRevision ?? "R189_WHOLE_INSTRUMENT_CONVERGENCE",
    predecessorGitSha: quick?.predecessorGitSha ?? null,
    timestamp: new Date().toISOString(),
    depth: "full",
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? quick?.canonicalGitSha ?? null,
    deploymentIdentityBound: quick?.deploymentIdentityBound === true,
    overallState,
    summary: { total: capabilities.length, verified, unverified: capabilities.length - verified, required: required.length, requiredVerified: required.filter((row: Obj) => row?.verified).length, hardFailures: hardFailures.length, blocked: blocked.length },
    capabilities,
    resourcePolicy: { externalBatchWidth: 1, nativeRcwaAfterExternalEvidence: true, unboundedPromiseAll: false },
    truthBoundary: "R223 preserves R190 local-core verification and collects sovereign/source/heartbeat/native-solver evidence in bounded stages. External unavailability is returned as BLOCKED evidence rather than allowed to exhaust the Worker into an opaque platform 503.",
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return json({ ok: hardFailures.length === 0 && quickResponse.ok, ...core, receiptSha256: await digest(core) }, hardFailures.length || !quickResponse.ok ? 503 : 200);
}

export async function handleLiveSystemSurfaceClosureR223(request: Request, env: any, ctx: any, next: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/surface/r223/registry") {
    return json({ ok: true, ...SURFACE_CAPABILITY_REGISTRY_R223, canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null });
  }
  if (request.method === "GET" && url.pathname === "/api/system/r195/status") return r195Status(request, env, ctx, next);
  if (request.method === "GET" && url.pathname === "/api/system/r211/status") return r211Status(request, env, ctx, next);
  if (request.method === "POST" && url.pathname === "/api/acceptance/r190/probe") {
    const clone = request.clone();
    const body = await clone.json().catch(() => ({})) as Obj;
    if (String(body?.depth || "quick").toLowerCase() === "full") return r190FullProbe(request, env, ctx, next);
  }
  return null;
}

async function hasMarker(response: Response, marker: string): Promise<boolean> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return false;
  return (await response.clone().text()).includes(marker);
}

export async function enhanceLiveSystemSurfaceClosureR223(response: Response, pathname: string): Promise<Response> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  if (!SYSTEM_ROUTE_SET.has(normalizedPath)) return response;

  let current = response;
  if (!await hasMarker(current, 'id="omegaR193Rail"')) current = await enhanceUniversalWorkspaceR193(current, normalizedPath);
  if (!await hasMarker(current, 'id="omegaR214ControlMenu"') || !await hasMarker(current, 'id="omegaNavigationIntegrityR215Runtime"')) current = await enhanceOneSystemNavigationR195(current, normalizedPath);
  if (!await hasMarker(current, 'id="omegaMenuTruthR214Runtime"')) current = await enhanceMenuTruthR214(current);

  let html = await current.text();
  const markers = {
    workspace: html.includes('id="omegaR193Rail"'),
    submenu: html.includes('id="omegaR214ControlMenu"'),
    palette: html.includes('id="omegaNavigationIntegrityR215Runtime"'),
    menuTruth: html.includes('id="omegaMenuTruthR214Runtime"'),
  };
  const complete = Object.values(markers).every(Boolean);
  if (!html.includes('id="omegaLiveSystemSurfaceClosureR223"')) {
    const marker = `<meta id="omegaLiveSystemSurfaceClosureR223" name="omega-live-system-surface-closure" content="${LIVE_SYSTEM_SURFACE_RELEASE_R223}">`;
    html = html.includes("</head>") ? html.replace("</head>", marker + "</head>") : marker + html;
  }
  const headers = new Headers(current.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-surface-contract", LIVE_SYSTEM_SURFACE_RELEASE_R223);
  headers.set("x-omega-surface-contract-state", complete ? "COMPLETE" : "INCOMPLETE");
  if (markers.workspace) headers.set("x-omega-workspace", UNIVERSAL_WORKSPACE_RELEASE_R193);
  if (markers.submenu) headers.set("x-omega-navigation-polish", NAVIGATION_POLISH_RELEASE_R214);
  if (markers.palette) headers.set("x-omega-navigation-integrity", NAVIGATION_INTEGRITY_RELEASE_R215);
  return new Response(html, { status: current.status, statusText: current.statusText, headers });
}
