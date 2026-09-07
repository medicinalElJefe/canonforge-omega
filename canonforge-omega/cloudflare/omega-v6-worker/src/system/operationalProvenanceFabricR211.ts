export const OPERATIONAL_PROVENANCE_RELEASE_R211 = "r211-operational-provenance-fabric";
export const OPERATIONAL_PROVENANCE_SCHEMA_R211 = "OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R211";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type EvidenceClass = "LIVE_VERIFIED" | "LIVE_OBSERVED" | "ARCHIVAL_SNAPSHOT" | "DERIVED" | "AVAILABLE" | "UNAVAILABLE";
type Probe = { id: string; domain: string; path: string; expected: string[] };

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" };
const SOURCES: Probe[] = [
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
];

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const out = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(out)].map(v => v.toString(16).padStart(2, "0")).join("");
}

function deepHas(value: any, key: string): boolean {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some(child => child && typeof child === "object" && !Array.isArray(child) && deepHas(child, key));
}

function classify(id: string, body: any, ok: boolean): EvidenceClass {
  if (!ok) return "UNAVAILABLE";
  if (id === "drive") return body?.corpus?.integrity?.ok === true ? "ARCHIVAL_SNAPSHOT" : "AVAILABLE";
  if (id === "earthSar") return "LIVE_OBSERVED";
  if (id === "durability") return body?.verified === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
  if (id === "acceptance") return body?.deploymentIdentityBound === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
  if (id === "solver") return "AVAILABLE";
  if (id === "compute" || id === "motion") return "DERIVED";
  return body?.verified === true ? "LIVE_VERIFIED" : "LIVE_OBSERVED";
}

async function probe(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, spec: Probe) {
  const url = new URL(request.url);
  url.pathname = spec.path;
  url.search = `?r211Proof=${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const started = Date.now();
  try {
    const response = await canonicalFetch(new Request(url.toString(), { headers: { accept: "application/json" } }), env, ctx);
    const raw = await response.text();
    let body: any;
    try { body = JSON.parse(raw); } catch { body = { text: raw.slice(0, 1200) }; }
    const fieldsPresent = spec.expected.every(key => deepHas(body, key));
    const ok = response.ok && body?.ok !== false && fieldsPresent;
    return { id: spec.id, domain: spec.domain, path: spec.path, status: response.status, ok, fieldsPresent, schema: body?.schema ?? null, release: body?.release ?? body?.revision ?? body?.build ?? null, evidenceClass: classify(spec.id, body, ok), body, elapsedMs: Date.now() - started, error: null as string | null };
  } catch (error) {
    return { id: spec.id, domain: spec.domain, path: spec.path, status: 0, ok: false, fieldsPresent: false, schema: null, release: null, evidenceClass: "UNAVAILABLE" as EvidenceClass, body: null, elapsedMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}

async function manifest(env: any) {
  const core = {
    ok: true,
    schema: OPERATIONAL_PROVENANCE_SCHEMA_R211,
    release: OPERATIONAL_PROVENANCE_RELEASE_R211,
    predecessor: "r210-sovereign-proof-archive",
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    authority: "CORRELATED_EVIDENCE_VIEW_NOT_NEW_RUNTIME_AUTHORITY",
    purpose: "Read-only whole-system evidence correlation across existing OMEGA organs without creating a parallel runtime or authority plane.",
    sourceCount: SOURCES.length,
    sources: SOURCES,
    provenanceClasses: ["LIVE_VERIFIED", "LIVE_OBSERVED", "ARCHIVAL_SNAPSHOT", "DERIVED", "AVAILABLE", "UNAVAILABLE"],
    hierarchy: [12, 144, 1728, 20736, 248832],
    hierarchyBoundary: "atlas/address resolution levels; not literal physical dimensions",
    continuityOperator: ["partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"],
    executionTruth: ["DISCOVERED", "AUTHORIZED", "AVAILABLE", "INVOKED", "RETURNED", "VERIFIED"],
    truthBoundaries: {
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
    },
    r210ArchiveBoundary: "R210 content-addressed local proof retention remains non-Canon evidence and is preserved as predecessor authority context.",
    routes: { manifest: "/api/system/r211/manifest", status: "/api/system/r211/status", query: "/api/system/r211/query?domain=earth" },
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await digest(core) };
}

async function status(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const calls = await Promise.all(SOURCES.map(source => probe(request, env, ctx, canonicalFetch, source)));
  const publicSources = calls.map(({ body, ...call }) => call);
  const required = new Set(["canonical", "acceptance", "workspace", "drive", "earthSar", "durability", "returnAdmission", "wholeSystem"]);
  const requiredCalls = calls.filter(call => required.has(call.id));
  const wholeSystem = calls.find(call => call.id === "wholeSystem")?.body || {};
  const hybrid = wholeSystem?.hybrid || wholeSystem?.systems?.hybrid || {};
  const pcOnline = hybrid?.pcOnline === true && hybrid?.heartbeatCurrent === true && hybrid?.authenticated === true;
  const counts = publicSources.reduce((acc: Record<string, number>, source) => { acc[source.evidenceClass] = (acc[source.evidenceClass] || 0) + 1; return acc; }, {});
  const core = {
    ok: requiredCalls.length === required.size && requiredCalls.every(call => call.ok),
    schema: "OMEGA_OPERATIONAL_PROVENANCE_STATUS_R211",
    release: OPERATIONAL_PROVENANCE_RELEASE_R211,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    generatedAt: new Date().toISOString(),
    sources: publicSources,
    counts,
    physicalHost: { pcOnline, heartbeatCurrent: hybrid?.heartbeatCurrent === true, authenticated: hybrid?.authenticated === true, claim: pcOnline ? "CURRENT_AUTHENTICATED_HEARTBEAT_PROVEN" : "PC_ONLINE_NOT_PROVEN_BY_THIS_OBSERVATION" },
    truth: {
      archive: "R195 is an integrity-checked embedded Drive/archive snapshot; R210 separately preserves content-addressed local sovereign proof receipts. Neither is automatically current external Drive or CanonState.",
      earthSar: "R198 source-backed latest-available SAR catalog evidence is distinct from real-time radar and from InSAR deformation products.",
      solver: "Independent-solver availability is distinct from a solver execution receipt.",
      canon: "R211 correlates evidence; it cannot mutate CanonState, HostState, or promotion authority.",
    },
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await digest(core) };
}

async function query(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const url = new URL(request.url);
  const domain = (url.searchParams.get("domain") || "").trim().toLowerCase();
  const id = (url.searchParams.get("id") || "").trim().toLowerCase();
  const selected = SOURCES.filter(source => (!domain || source.domain.toLowerCase() === domain) && (!id || source.id.toLowerCase() === id));
  if (!selected.length) return json({ ok: false, code: "R211_SOURCE_NOT_FOUND", filter: { domain: domain || null, id: id || null }, canonicalMutation: false, promotionAuthorized: false }, 404);
  const calls = await Promise.all(selected.map(source => probe(request, env, ctx, canonicalFetch, source)));
  const results = calls.map(call => ({ id: call.id, domain: call.domain, path: call.path, ok: call.ok, status: call.status, schema: call.schema, release: call.release, evidenceClass: call.evidenceClass, elapsedMs: call.elapsedMs, evidence: call.body, ...(call.error ? { error: call.error } : {}) }));
  const core = { ok: results.every(result => result.ok), schema: "OMEGA_OPERATIONAL_PROVENANCE_QUERY_R211", release: OPERATIONAL_PROVENANCE_RELEASE_R211, canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null, filter: { domain: domain || null, id: id || null }, results, authority: "SOURCE_RESPONSES_WITH_PROVENANCE_NOT_CANON_ADMISSION", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false };
  return { ...core, receiptSha256: await digest(core) };
}

export async function handleOperationalProvenanceR211(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/system/r211/")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"], canonicalMutation: false, promotionAuthorized: false }, 405);
  if (url.pathname === "/api/system/r211/manifest") return json(await manifest(env));
  if (url.pathname === "/api/system/r211/status") return json(await status(request, env, ctx, canonicalFetch));
  if (url.pathname === "/api/system/r211/query") return json(await query(request, env, ctx, canonicalFetch));
  return json({ ok: false, code: "R211_ROUTE_NOT_FOUND", canonicalMutation: false, promotionAuthorized: false }, 404);
}
