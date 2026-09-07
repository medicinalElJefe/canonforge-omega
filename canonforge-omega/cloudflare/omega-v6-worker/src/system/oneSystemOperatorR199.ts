export const ONE_SYSTEM_OPERATOR_RELEASE_R199 = "r199-unified-operator-control-plane";
export const ONE_SYSTEM_OPERATOR_SCHEMA_R199 = "OMEGA_ONE_SYSTEM_OPERATOR_R199";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const MENUS = [
  { id: "MENU-01", label: "LAUNCH", observe: "/api/workspace/r193/manifest", role: "entry / workspace projection" },
  { id: "MENU-02", label: "HOST INTAKE", observe: "/api/convergence/edge", role: "cloud + Genesis + authenticated Hybrid truth" },
  { id: "MENU-03", label: "STATE MANIFOLD", observe: "/api/omega/state", role: "canonical state packet" },
  { id: "MENU-04", label: "20,736 EXPAND", observe: "/api/canon/r191/manifest", role: "atlas/address hierarchy; not physical dimension" },
  { id: "MENU-05", label: "RENDERER", observe: "/api/fabric/r191/manifest", role: "shared surface fabric / render projection" },
  { id: "MENU-06", label: "TRAVERSAL", observe: "/api/system/r195/status", role: "governed motion + specialist execution" },
  { id: "MENU-07", label: "FORECAST", observe: "/api/system/r195/status", role: "bounded projection; execution remains specialist-routed" },
  { id: "MENU-08", label: "PROOF", observe: "/api/system/r195/status", role: "execution / verification / admission truth" },
  { id: "MENU-09", label: "AUDIO", observe: null, role: "archive-authorized family; canonical cloud surface not yet admitted", state: "RESTORE_REQUIRED" },
  { id: "MENU-10", label: "AI ASSIST", observe: "/api/intelligence/r179/manifest", role: "SAI + provider intelligence" },
  { id: "MENU-11", label: "RECOVERY", observe: "/api/system/r195/restoration?limit=24", role: "weakest-link restoration / scar carry" },
  { id: "MENU-12", label: "PACKAGING", observe: "/api/swarm/build/manifest", role: "bounded candidate build / validation" },
] as const;

const ACTIONS = {
  observe: { method: "GET", authority: "READ_ONLY_DOMAIN_PROJECTION" },
  snapshot: { method: "GET", authority: "READ_ONLY_CORRELATED_STATE" },
  specialist_execute: { method: "POST", target: "/api/system/r195/execute", authority: "SPECIALIST_EXECUTION_WITH_RECEIPT" },
  earth_search: { method: "POST", target: "/api/earth/sar/r198/search", authority: "PUBLIC_SOURCE_QUERY_NO_CANON_MUTATION" },
  corpus_analyze: { method: "POST", target: "/api/system/r195/analyze", authority: "DERIVED_ANALYSIS_NO_CANON_MUTATION" },
  prepare_build_candidate: { method: "POST", target: "/api/swarm/build/candidate", authority: "CANDIDATE_NOT_CANON" },
} as const;

type MenuId = typeof MENUS[number]["id"];
type SnapshotProfile = "mission" | "full";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: HEADERS });
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const out = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(out)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function readBody(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { text: text.slice(0, 4000) }; }
}

function menu(id: string) {
  return MENUS.find(item => item.id === id) || null;
}

async function invoke(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: CanonicalFetch,
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
) {
  const target = new URL(request.url);
  const [pathname, query = ""] = path.split("?", 2);
  target.pathname = pathname;
  target.search = query ? `?${query}` : "";
  const started = Date.now();
  const response = await canonicalFetch(new Request(target.toString(), {
    method,
    headers: { accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}) },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  }), env, ctx);
  const result = await readBody(response);
  return {
    path: `${target.pathname}${target.search}`,
    method,
    status: response.status,
    ok: response.ok && result?.ok !== false,
    elapsedMs: Date.now() - started,
    result,
  };
}

async function manifest() {
  const core = {
    ok: true,
    schema: ONE_SYSTEM_OPERATOR_SCHEMA_R199,
    release: ONE_SYSTEM_OPERATOR_RELEASE_R199,
    architecture: {
      authority: "ONE_HOSTSTATE_ONE_CANONSTATE_ONE_RENDER_AUTHORITY",
      flow: "OPERATOR_TO_CONTROL_TO_RUNTIME_TO_STATE_TO_RENDER_TO_RECEIPT_TO_PROOF_TO_ADMISSION",
      continuity: "PARTITION_TO_EXCHANGE_TRANSFORM_TO_INVARIANT_CARRY_TO_SCAR_CARRY_TO_RECONTEXTUALIZE_REPARTITION",
      presentation: "ONE_OPERATOR_SHELL_WITH_DOMAIN_PROJECTIONS",
      executionTruth: "DISCOVERED_TO_AUTHORIZED_TO_AVAILABLE_TO_INVOKED_TO_RETURNED_TO_VERIFIED",
    },
    menus: MENUS,
    actions: ACTIONS,
    snapshotProfiles: {
      mission: "FAST_INTERNAL_ONLY_CORE_PROOF_SNAPSHOT_FOR_R200_R201_MISSIONS",
      full: "FULL_OPERATOR_SNAPSHOT_INCLUDING_CONVERGENCE_RECOVERY_AND_EARTH_SOURCE_HEALTH",
    },
    boundaries: {
      returnedIsNotVerified: true,
      modelOutputIsNotCanonState: true,
      pcOnlineRequiresAuthenticatedHeartbeat: true,
      buildCandidateIsNotPromotion: true,
      earthObservationIsNotForecast: true,
      audioIsRestoreRequired: true,
      atlas20736IsAddressResolutionNotPhysicalDimension: true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await digest(core) };
}

function snapshotProbes(profile: SnapshotProfile) {
  const core = [
    ["STATE", "/api/omega/state"],
    ["ONE_SYSTEM", "/api/system/r195/status"],
    ["WORKSPACE", "/api/workspace/r193/manifest"],
    ["FABRIC", "/api/fabric/r191/manifest"],
    ["SAI_AI", "/api/intelligence/r179/manifest"],
    ["BUILD", "/api/swarm/build/manifest"],
  ] as const;
  if (profile === "mission") return core;
  return [
    ...core,
    ["CONVERGENCE", "/api/convergence/edge"],
    ["SWARM", "/api/clouds/r185/manifest"],
    ["RECOVERY", "/api/system/r195/restoration?limit=1"],
    ["EARTH_SOURCES", "/api/earth/sar/r198/sources"],
  ] as const;
}

async function snapshot(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, profile: SnapshotProfile = "full") {
  const probes = snapshotProbes(profile);
  const results = await Promise.all(probes.map(async ([id, path]) => ({ id, ...(await invoke(request, env, ctx, canonicalFetch, path)) })));
  const convergence = results.find(x => x.id === "CONVERGENCE")?.result || {};
  const pc = convergence?.topology?.sovereign_pc || {};
  const requiredIds = profile === "mission"
    ? new Set(["STATE", "ONE_SYSTEM", "WORKSPACE", "FABRIC", "SAI_AI", "BUILD"])
    : new Set(results.map(x => x.id).filter(id => id !== "EARTH_SOURCES"));
  const required = results.filter(x => requiredIds.has(x.id));
  const core = {
    schema: "OMEGA_ONE_SYSTEM_CORRELATED_SNAPSHOT_R199",
    release: ONE_SYSTEM_OPERATOR_RELEASE_R199,
    generatedAt: new Date().toISOString(),
    profile,
    runtimeReady: required.every(x => x.ok),
    pcOnline: profile === "full" ? Boolean(pc.pc_online) : false,
    heartbeatCurrent: profile === "full" ? Boolean(pc.heartbeat_current) : false,
    results,
    truth: {
      pcOnline: profile === "full" && Boolean(pc.pc_online) ? "PROVEN_BY_CURRENT_CONVERGENCE_PACKET" : profile === "mission" ? "NOT_PROBED_IN_FAST_MISSION_PROFILE" : "UNPROVEN",
      missionSnapshotDoesNotClaimHostState: profile === "mission",
      returnedIsNotVerified: true,
      canonicalMutation: false,
    },
  };
  return { ...core, receiptSha256: await digest(core) };
}

function earthPath(payload: AnyObj): string {
  const q = new URLSearchParams();
  if (payload.providers) q.set("providers", Array.isArray(payload.providers) ? payload.providers.join(",") : String(payload.providers));
  if (payload.days != null) q.set("days", String(payload.days));
  if (payload.limit != null) q.set("limit", String(payload.limit));
  if (payload.bbox) q.set("bbox", Array.isArray(payload.bbox) ? payload.bbox.join(",") : String(payload.bbox));
  return `/api/earth/sar/r198/search${q.toString() ? `?${q}` : ""}`;
}

function analyzePath(payload: AnyObj): string {
  const q = new URLSearchParams();
  q.set("table", String(payload.table || "registry"));
  if (payload.q) q.set("q", String(payload.q));
  q.set("limit", String(payload.limit || 100));
  return `/api/system/r195/analyze?${q}`;
}

async function operate(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const body = await request.json().catch(() => ({})) as AnyObj;
  const menuId = String(body.menuId || body.menu || "").toUpperCase() as MenuId;
  const selected = menu(menuId);
  const action = String(body.action || "observe").toLowerCase();
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  if (!selected) return json({ ok: false, code: "R199_MENU_REQUIRED", menus: MENUS.map(x => x.id) }, 422);

  if (selected.id === "MENU-09") return json({
    ok: false,
    code: "R199_AUDIO_RESTORE_REQUIRED",
    menu: selected,
    reason: "Audio exists in the established one-system corpus but no admitted canonical cloud execution surface is currently proven. R199 will not fabricate one.",
    canonicalMutation: false,
  }, 409);

  let downstream: any;
  let authority = "READ_ONLY_DOMAIN_PROJECTION";
  if (action === "observe") {
    if (!selected.observe) return json({ ok: false, code: "R199_OBSERVE_ROUTE_UNAVAILABLE", menu: selected }, 409);
    downstream = await invoke(request, env, ctx, canonicalFetch, selected.observe);
  } else if (action === "snapshot") {
    downstream = { status: 200, ok: true, result: await snapshot(request, env, ctx, canonicalFetch, "mission"), path: "/api/system/r199/snapshot?profile=mission", method: "GET", elapsedMs: 0 };
    authority = ACTIONS.snapshot.authority;
  } else if (action === "specialist_execute") {
    if (!["MENU-05", "MENU-06", "MENU-07", "MENU-10"].includes(selected.id)) return json({ ok: false, code: "R199_SPECIALIST_EXECUTION_NOT_ALLOWED_FOR_MENU", menu: selected.id }, 422);
    downstream = await invoke(request, env, ctx, canonicalFetch, ACTIONS.specialist_execute.target, "POST", payload);
    authority = ACTIONS.specialist_execute.authority;
  } else if (action === "earth_search") {
    if (!["MENU-03", "MENU-05", "MENU-08"].includes(selected.id)) return json({ ok: false, code: "R199_EARTH_SEARCH_NOT_ALLOWED_FOR_MENU", menu: selected.id }, 422);
    downstream = await invoke(request, env, ctx, canonicalFetch, earthPath(payload));
    authority = ACTIONS.earth_search.authority;
  } else if (action === "corpus_analyze") {
    if (!["MENU-03", "MENU-06", "MENU-08", "MENU-11"].includes(selected.id)) return json({ ok: false, code: "R199_CORPUS_ANALYSIS_NOT_ALLOWED_FOR_MENU", menu: selected.id }, 422);
    downstream = await invoke(request, env, ctx, canonicalFetch, analyzePath(payload));
    authority = ACTIONS.corpus_analyze.authority;
  } else if (action === "prepare_build_candidate") {
    if (selected.id !== "MENU-12") return json({ ok: false, code: "R199_BUILD_CANDIDATE_REQUIRES_MENU_12" }, 422);
    downstream = await invoke(request, env, ctx, canonicalFetch, ACTIONS.prepare_build_candidate.target, "POST", payload);
    authority = ACTIONS.prepare_build_candidate.authority;
  } else {
    return json({ ok: false, code: "R199_ACTION_NOT_ALLOWED", allowed: Object.keys(ACTIONS) }, 422);
  }

  const core = {
    schema: "OMEGA_ONE_SYSTEM_OPERATOR_RECEIPT_R199",
    release: ONE_SYSTEM_OPERATOR_RELEASE_R199,
    menu: selected,
    action,
    authority,
    downstream,
    executionState: {
      discovered: true,
      authorized: true,
      available: downstream.status !== 404 && downstream.status !== 501,
      invoked: true,
      returned: true,
      verified: Boolean(downstream.result?.executionState?.verified || downstream.result?.verification?.verified || downstream.result?.receipt?.verified),
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await digest(core) }, downstream.status || 200);
}

export async function handleOneSystemOperatorR199(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (!path.startsWith("/api/system/r199")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  if (path === "/api/system/r199/manifest" && request.method === "GET") return json(await manifest());
  if (path === "/api/system/r199/snapshot" && request.method === "GET") {
    const profile: SnapshotProfile = url.searchParams.get("profile") === "mission" ? "mission" : "full";
    return json(await snapshot(request, env, ctx, canonicalFetch, profile));
  }
  if (path === "/api/system/r199/operate" && request.method === "POST") return operate(request, env, ctx, canonicalFetch);
  return json({ ok: false, code: "R199_OPERATOR_ROUTE_NOT_FOUND", routes: ["/api/system/r199/manifest", "/api/system/r199/snapshot", "/api/system/r199/operate"] }, 404);
}
