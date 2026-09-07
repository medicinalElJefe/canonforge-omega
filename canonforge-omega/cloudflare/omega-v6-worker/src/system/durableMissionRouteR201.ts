export const DURABLE_MISSION_ROUTE_R201 = "r201-durable-mission-execution-route";
export const DURABLE_MISSION_SINGLETON_R201 = "omega-r201-durable-mission-evidence-ledger-v1";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

async function body(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { ok: false, code: "NON_JSON_RESPONSE", status: response.status, bodyPreview: raw.slice(0, 1000) }; }
}

function runtimeStub(env: any): any | null {
  const namespace = env?.OMEGA_RUNTIME;
  if (!namespace || typeof namespace.idFromName !== "function" || typeof namespace.get !== "function") return null;
  return namespace.get(namespace.idFromName(DURABLE_MISSION_SINGLETON_R201));
}

function internalRequest(request: Request, path: string, init?: RequestInit): Request {
  const source = new URL(request.url);
  const target = new URL("https://omega-runtime-r201.internal" + path);
  target.search = source.search;
  const headers = new Headers(init?.headers || request.headers);
  headers.set("content-type", "application/json");
  headers.delete("cookie");
  headers.delete("authorization");
  return new Request(target.toString(), { ...init, headers });
}

async function doFetch(request: Request, env: any, path: string, init?: RequestInit): Promise<Response> {
  const stub = runtimeStub(env);
  if (!stub || typeof stub.fetch !== "function") {
    return json({
      ok: false,
      code: "R201_DURABLE_RUNTIME_BINDING_UNAVAILABLE",
      release: DURABLE_MISSION_ROUTE_R201,
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, 503);
  }
  return stub.fetch(internalRequest(request, path, init));
}

async function manifest() {
  return {
    ok: true,
    schema: "OMEGA_DURABLE_MISSION_ROUTE_MANIFEST_R201",
    release: DURABLE_MISSION_ROUTE_R201,
    singleton: DURABLE_MISSION_SINGLETON_R201,
    durableClass: "OmegaRuntime",
    flow: [
      "INTENT",
      "R200_CANONICAL_MISSION_EXECUTION",
      "R200_MISSION_RECEIPT_SHA256_VERIFICATION",
      "R201_DURABLE_HASH_CHAIN_RECORD",
      "R201_CONTINUITY_VERIFICATION",
      "RETURN_MISSION_PLUS_DURABLE_RECEIPT",
    ],
    publicEndpoints: [
      "/api/mission/r201/manifest",
      "/api/mission/r201/execute",
      "/api/mission/r201/summary",
      "/api/mission/r201/history",
      "/api/mission/r201/verify",
    ],
    privacyBoundary: "Public history is sanitized and omits stored mission intent, specialist payloads, downstream evidence bodies, and secrets.",
    authority: "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
}

async function executeDurably(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response> {
  const input = await request.json().catch(() => ({})) as AnyObj;
  const r200Url = new URL(request.url);
  r200Url.pathname = "/api/mission/r200/execute";
  r200Url.search = "";
  const r200Request = new Request(r200Url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
  });
  const missionResponse = await canonicalFetch(r200Request, env, ctx);
  const mission = await body(missionResponse);
  if (!missionResponse.ok || mission?.schema !== "OMEGA_CANONICAL_MISSION_R200") {
    return json({
      ok: false,
      schema: "OMEGA_DURABLE_MISSION_EXECUTION_R201",
      release: DURABLE_MISSION_ROUTE_R201,
      state: "R200_EXECUTION_NOT_RECORDABLE",
      missionKernelStatus: missionResponse.status,
      mission,
      durableRecorded: false,
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, missionResponse.status >= 400 ? missionResponse.status : 502);
  }

  const recordResponse = await doFetch(request, env, "/mission-ledger/record", {
    method: "POST",
    body: JSON.stringify(mission),
  });
  const continuity = await body(recordResponse);
  if (!recordResponse.ok || continuity?.ok !== true) {
    return json({
      ok: false,
      schema: "OMEGA_DURABLE_MISSION_EXECUTION_R201",
      release: DURABLE_MISSION_ROUTE_R201,
      state: "MISSION_EXECUTED_DURABILITY_FAILED",
      mission,
      continuity,
      durableRecorded: false,
      boundary: "Mission execution is not silently promoted to durable continuity when the R201 ledger write fails.",
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, recordResponse.status >= 400 ? recordResponse.status : 503);
  }

  const verifyResponse = await doFetch(request, env, "/mission-ledger/verify", { method: "GET" });
  const verification = await body(verifyResponse);
  const durableVerified = Boolean(verifyResponse.ok && verification?.verified === true);
  return json({
    ok: durableVerified,
    schema: "OMEGA_DURABLE_MISSION_EXECUTION_R201",
    release: DURABLE_MISSION_ROUTE_R201,
    state: durableVerified ? "EXECUTED_RECORDED_CHAIN_VERIFIED" : "EXECUTED_RECORDED_CHAIN_UNVERIFIED",
    mission,
    continuity,
    verification,
    durableRecorded: true,
    durableVerified,
    authority: "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  }, durableVerified ? 201 : 503);
}

export async function handleDurableMissionR201(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (!path.startsWith("/api/mission/r201")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });

  if (path === "/api/mission/r201/manifest" && request.method === "GET") return json(await manifest());
  if (path === "/api/mission/r201/execute" && request.method === "POST") return executeDurably(request, env, ctx, canonicalFetch);
  if (path === "/api/mission/r201/summary" && request.method === "GET") return doFetch(request, env, "/mission-ledger/summary", { method: "GET" });
  if (path === "/api/mission/r201/history" && request.method === "GET") return doFetch(request, env, "/mission-ledger/public-history", { method: "GET" });
  if (path === "/api/mission/r201/verify" && request.method === "GET") return doFetch(request, env, "/mission-ledger/verify", { method: "GET" });

  return json({
    ok: false,
    code: "R201_ROUTE_NOT_FOUND",
    routes: (await manifest()).publicEndpoints,
    directRecordRouteExposed: false,
  }, 404);
}
