export const OPERATIONAL_PROVENANCE_RELEASE_R210 = "r210-operational-provenance-fabric";
export const OPERATIONAL_PROVENANCE_SCHEMA_R210 = "OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R210";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;
type EvidenceClass = "LIVE_VERIFIED" | "LIVE_OBSERVED" | "ARCHIVAL_SNAPSHOT" | "DERIVED" | "AVAILABLE" | "UNAVAILABLE";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const SOURCES = [
  { id: "canonical", domain: "runtime", path: "/_omega/health", expected: ["ok"] },
  { id: "acceptance", domain: "proof", path: "/api/acceptance/r181/manifest", expected: ["canonicalGitSha"] },
  { id: "workspace", domain: "surface", path: "/api/workspace/r193/manifest", expected: ["release"] },
  { id: "evidence", domain: "evidence", path: "/api/workspace/r194/health", expected: ["release"] },
  { id: "drive", domain: "archive", path: "/api/system/r195/manifest", expected: ["corpus"] },
  { id: "earthSar", domain: "earth", path: "/api/earth/sar/r198/sources", expected: ["build", "providers"] },
  { id: "operator", domain: "operator", path: "/api/system/r199/manifest", expected: ["release"] },
  { id: "mission", domain: "mission", path: "/api/mission/r200/manifest", expected: ["release"] },
  { id: "durability", domain: "continuity", path: "/api/mission/r201/verify", expected: ["verified"] },
  { id: "hybridMission", domain: "hybrid", path: "/api/mission/r203/manifest", expected: ["release"] },
  { id: "returnAdmission", domain: "hybrid", path: "/api/system/r204/manifest", expected: ["release"] },
  { id: "wholeSystem", domain: "system", path: "/api/system/r205/health", expected: ["state"] },
  { id: "cloudSwarm", domain: "cloud", path: "/api/clouds/r185/manifest", expected: ["release"] },
  { id: "federation", domain: "federation", path: "/api/federation/r174/health", expected: ["ok"] },
  { id: "solver", domain: "solver", path: "/api/validate/independent/manifest", expected: ["release"] },
  { id: "compute", domain: "compute", path: "/api/compute/manifest", expected: ["release"] },
  { id: "sai", domain: "intelligence", path: "/api/sai/manifest", expected: ["release"] },
  { id: "aiSai", domain: "intelligence", path: "/api/intelligence/r179/manifest", expected: ["release"] },
  { id: "motion", domain: "motion", path: "/api/swarm/motion/r188/manifest", expected: ["release"] },
] as const;

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

async function sha(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function readBody(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { text: raw.slice(0, 1200) }; }
}

function pick(body: AnyObj, key: string): any {
  if (!body || typeof body !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(body, key)) return body[key];
  for (const value of Object.values(body)) {
    if (value && typeof value === "object" && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, key)) return (value as AnyObj)[key];
  }
  return undefined;
}

function classify(id: string, call: AnyObj): EvidenceClass {
  const body = call?.body || {};
  if (!call?.ok) return "UNAVAILABLE";
  if (id === "drive") return body?.corpus?.integrity?.ok === true ? "ARCHIVAL_SNAPSHOT" : "AVAILABLE";
  if (id === "earthSar") return "LIVE_OBSERVED";
  if (id === "durability") return body?.verified === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
  if (id === "acceptance") return body?.deploymentIdentityBound === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
  if (id === "solver") return "AVAILABLE";
  if (id === "compute" || id === "motion") return "DERIVED";
  if (body?.verified === true || body?.proof?.verified === true || body?.ok === true) return "LIVE_OBSERVED";
  return "AVAILABLE";
}

async function invoke(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, spec: typeof SOURCES[number]) {
  const target = new URL(request.url);
  target.pathname = spec.path;
  target.search = `?r210Proof=${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const started = Date.now();
  try {
    const response = await canonicalFetch(new Request(target.toString(), { headers: { accept: "application/json" } }), env, ctx);
    const body = await readBody(response);
    const fieldsPresent = spec.expected.every(key => pick(body, key) !== undefined);
    return {
      id: spec.id, domain: spec.domain, path: spec.path, status: response.status,
      ok: response.ok && body?.ok !== false && fieldsPresent, fieldsPresent,
      schema: body?.schema ?? null, release: body?.release ?? body?.revision ?? body?.build ?? null,
      body, elapsedMs: Date.now() - started,
    };
  } catch (error) {
    return {
      id: spec.id, domain: spec.domain, path: spec.path, status: 0, ok: false, fieldsPresent: false,
      schema: null, release: null, body: null,
      error: error instanceof Error ? error.message : String(error), elapsedMs: Date.now() - started,
    };
  }
}

async function manifest(env: any) {
  const core = {
    ok: true,
    schema: OPERATIONAL_PROVENANCE_SCHEMA_R210,
    release: OPERATIONAL_PROVENANCE_RELEASE_R210,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    predecessor: "r209-sovereign-convergence-diagnostics",
    purpose: "One read-only provenance fabric across the established OMEGA runtime, Earth/SAR, archive corpus, modes/calculus, intelligence, cloud/swarm, solver, Hybrid, durable mission and proof layers.",
    authority: "CORRELATED_EVIDENCE_VIEW_NOT_NEW_RUNTIME_AUTHORITY",
    sourceCount: SOURCES.length,
    sources: SOURCES.map(source => ({ id: source.id, domain: source.domain, path: source.path })),
    provenanceClasses: {
      LIVE_VERIFIED: "Live response plus an explicit verification/admission condition from the owning subsystem.",
      LIVE_OBSERVED: "Live response from an owning subsystem; observation alone is not CanonState.",
      ARCHIVAL_SNAPSHOT: "Integrity-checked embedded/archive snapshot; not claimed to be the current external Drive state.",
      DERIVED: "Computed/relational output from declared inputs; not a direct physical observation.",
      AVAILABLE: "Capability/interface is present but this response does not independently prove execution or physical state.",
      UNAVAILABLE: "The source could not satisfy its declared contract in this observation.",
    },
    hierarchy: [12, 144, 1728, 20736, 248832],
    hierarchyBoundary: "atlas/address resolution levels; not literal physical dimensions",
    continuityOperator: ["partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"],
    executionTruth: ["DISCOVERED", "AUTHORIZED", "AVAILABLE", "INVOKED", "RETURNED", "VERIFIED"],
    boundaries: {
      correlationIsNotCanonAdmission: true,
      driveSnapshotIsNotLiveDriveTelemetry: true,
      publicSarCatalogIsNotRealTimeRadar: true,
      sarMetadataIsNotInSarDeformation: true,
      derivedVisualizationIsNotMeasuredObservation: true,
      solverAvailableIsNotSolverExecuted: true,
      cloudConfiguredIsNotCloudExecutionProof: true,
      pcConfiguredIsNotPcOnline: true,
      pcOnlineRequiresCurrentAuthenticatedHeartbeat: true,
      returnedIsNotVerified: true,
      verifiedReturnIsNotCanonState: true,
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    },
    routes: {
      manifest: "/api/system/r210/manifest",
      status: "/api/system/r210/status",
      query: "/api/system/r210/query?domain=earth",
    },
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await sha(core) };
}

async function status(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const calls = await Promise.all(SOURCES.map(spec => invoke(request, env, ctx, canonicalFetch, spec)));
  const sources = calls.map(call => ({
    id: call.id, domain: call.domain, path: call.path, status: call.status, ok: call.ok,
    fieldsPresent: call.fieldsPresent, schema: call.schema, release: call.release,
    evidenceClass: classify(call.id, call), elapsedMs: call.elapsedMs,
    ...(call.error ? { error: call.error } : {}),
  }));
  const counts = sources.reduce((acc: Record<string, number>, source) => {
    acc[source.evidenceClass] = (acc[source.evidenceClass] || 0) + 1;
    return acc;
  }, {});
  const hybrid = calls.find(call => call.id === "wholeSystem")?.body?.hybrid || {};
  const pcOnline = hybrid?.pcOnline === true && hybrid?.heartbeatCurrent === true && hybrid?.authenticated === true;
  const requiredIds = new Set(["canonical", "acceptance", "workspace", "drive", "earthSar", "durability", "returnAdmission", "wholeSystem"]);
  const requiredSources = sources.filter(source => requiredIds.has(source.id));
  const core = {
    ok: requiredSources.length === requiredIds.size && requiredSources.every(source => source.ok),
    schema: "OMEGA_OPERATIONAL_PROVENANCE_STATUS_R210",
    release: OPERATIONAL_PROVENANCE_RELEASE_R210,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    generatedAt: new Date().toISOString(), sources, counts,
    physicalHost: {
      pcOnline,
      heartbeatCurrent: hybrid?.heartbeatCurrent === true,
      authenticated: hybrid?.authenticated === true,
      claim: pcOnline ? "CURRENT_AUTHENTICATED_HEARTBEAT_PROVEN" : "PC_ONLINE_NOT_PROVEN_BY_THIS_OBSERVATION",
    },
    truth: {
      earthSar: "Latest available source-backed catalog observations are distinguished from derived products and from InSAR deformation measurements.",
      archive: "R195 corpus is an integrity-checked archival snapshot; external Drive freshness is outside Worker authority.",
      solver: "Independent-solver availability is distinct from an execution receipt.",
      canon: "This fabric correlates evidence only; it never admits CanonState or promotes a successor.",
    },
    canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await sha(core) };
}

async function query(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const url = new URL(request.url);
  const domain = (url.searchParams.get("domain") || "").trim().toLowerCase();
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const selected = SOURCES.filter(source => (!domain || source.domain.toLowerCase() === domain) && (!id || source.id.toLowerCase() === id));
  if (!selected.length) return json({ ok: false, code: "R210_SOURCE_NOT_FOUND", domain: domain || null, id: id || null, canonicalMutation: false, promotionAuthorized: false }, 404);
  const calls = await Promise.all(selected.map(spec => invoke(request, env, ctx, canonicalFetch, spec)));
  const results = calls.map(call => ({
    id: call.id, domain: call.domain, path: call.path, ok: call.ok, status: call.status,
    schema: call.schema, release: call.release, evidenceClass: classify(call.id, call),
    elapsedMs: call.elapsedMs, evidence: call.body,
  }));
  const core = {
    ok: results.every(result => result.ok),
    schema: "OMEGA_OPERATIONAL_PROVENANCE_QUERY_R210",
    release: OPERATIONAL_PROVENANCE_RELEASE_R210,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    filter: { domain: domain || null, id: id || null }, results,
    authority: "SOURCE_RESPONSES_WITH_PROVENANCE_NOT_CANON_ADMISSION",
    canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await sha(core) };
}

export async function handleOperationalProvenanceR210(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/system/r210/")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"], canonicalMutation: false, promotionAuthorized: false }, 405);
  if (url.pathname === "/api/system/r210/manifest") return json(await manifest(env));
  if (url.pathname === "/api/system/r210/status") return json(await status(request, env, ctx, canonicalFetch));
  if (url.pathname === "/api/system/r210/query") return json(await query(request, env, ctx, canonicalFetch));
  return json({ ok: false, code: "R210_ROUTE_NOT_FOUND", canonicalMutation: false, promotionAuthorized: false }, 404);
}
