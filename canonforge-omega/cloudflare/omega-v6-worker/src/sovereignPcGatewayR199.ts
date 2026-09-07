import { sovereignAgentR199Manifest, sovereignAgentR199Response } from "./sovereignAgentR199";

const HEARTBEAT_FRESH_MS = 30000;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
const text = (value: unknown) => String(value ?? "").trim();
const safeId = (value: unknown, fallback = "") => {
  const source = text(value).slice(0, 160);
  return /^[A-Za-z0-9._:-]+$/.test(source) ? source : fallback;
};
const sessionId = (request: Request) => safeId(request.headers.get("x-omega-session-id"), "anon");
const bridgeId = (request: Request, body: any = {}) => safeId(request.headers.get("x-omega-bridge-id") || body?.bridgeId || sessionId(request), "anon");

function runtimeStub(env: any, id: string) {
  return env.OMEGA_RUNTIME.get(env.OMEGA_RUNTIME.idFromName(id));
}

async function runtimeFetch(env: any, id: string, path: string, request: Request, method = request.method, body?: unknown) {
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");
  const init: RequestInit = { method, headers };
  if (body !== undefined && method !== "GET" && method !== "HEAD") init.body = JSON.stringify(body);
  return runtimeStub(env, id).fetch(new Request("https://omega-runtime.internal" + path, init));
}

async function statusR199(request: Request, env: any, id: string) {
  const response = await runtimeFetch(env, id, "/status", request, "GET");
  const data: any = await response.clone().json().catch(() => ({}));
  const devices = Array.isArray(data.devices) ? data.devices : [];
  const proved = devices.filter((row: any) => Number(row?.lastSeen) > 0 && !row?.revoked);
  const online = proved.filter((row: any) => row?.online);
  const newest = proved.slice().sort((a: any, b: any) => Number(b.lastSeen || 0) - Number(a.lastSeen || 0))[0] || null;
  const last = newest ? Number(newest.lastSeen || 0) : null;
  const ageMs = last ? Math.max(0, Date.now() - last) : null;
  const heartbeatCurrent = ageMs !== null && ageMs < HEARTBEAT_FRESH_MS;
  const hasCredential = Boolean(request.headers.get("x-omega-bridge-id") && request.headers.get("x-omega-bridge-secret"));
  return json({
    ...data,
    ok: response.ok,
    state: online.length && heartbeatCurrent ? "VERIFIED_DEVICE_ONLINE" : "DEVICE_PROOF_REQUIRED",
    pairingState: data.state || "PAIRING_REQUIRED",
    bridgeId: id,
    pc_online: online.length > 0 && heartbeatCurrent,
    nativeExecutionClaimed: online.length > 0 && heartbeatCurrent,
    currentDeviceCount: online.length,
    browserCredentialReady: hasCredential,
    heartbeatCurrent,
    heartbeatStale: ageMs !== null && !heartbeatCurrent,
    heartbeat_age_seconds: ageMs === null ? null : ageMs / 1000,
    heartbeatAgeSeconds: ageMs === null ? null : ageMs / 1000,
    lastAuthenticatedHeartbeat: last,
    heartbeatFreshnessWindowMs: HEARTBEAT_FRESH_MS,
    proof: newest ? {
      agent_id: newest.id,
      agent_version: newest.version,
      capability_revision: newest.capabilityRevision,
      sovereign_closure_revision: newest.sovereignClosureRevision,
      approved_root: newest.rootLabel,
      project_discovery: newest.projectDiscovery || null,
      resource_guard: newest.resourceGuard || null,
    } : null,
    connectorProtocol: "R127_ZERO_DRIFT_SHA256_PLUS_R199_VERIFIED_RETURN",
    returnVerificationRequiredForR199: true,
    truthBoundary: "PC ONLINE REQUIRES CURRENT AUTHENTICATED HEARTBEAT; JOB COMPLETE REQUIRES R199 RETURN VERIFICATION.",
  }, response.status);
}

async function pairR199(request: Request, env: any) {
  const body = await request.json().catch(() => ({})) as any;
  const sid = sessionId(request);
  const response = await runtimeFetch(env, sid, "/pair", request, "POST", { rotate: Boolean(body.rotate) });
  const data: any = await response.clone().json().catch(() => ({}));
  if (data.secret) {
    return json({ ...data, bridgeId: sid, pairingCode: `${sid}.${data.secret}`, agentPath: "/api/hybrid/agent-download", connectorProtocol: "R127_ZERO_DRIFT_SHA256_PLUS_R199_VERIFIED_RETURN", agentRestartRequired: Boolean(body.rotate) }, response.status);
  }
  return new Response(response.body, { status: response.status, headers: response.headers });
}

async function reconnectR199(request: Request, env: any) {
  const body = await request.json().catch(() => ({})) as any;
  const id = bridgeId(request, body);
  const secret = text(request.headers.get("x-omega-bridge-secret"));
  if (id && secret) {
    const authProbe = await runtimeFetch(env, id, "/jobs/__r199_auth_probe__/receipt", request, "GET");
    if (authProbe.status === 404) {
      const status = await statusR199(request, env, id);
      const data: any = await status.json();
      return json({ ...data, ok: true, reconnected: true, credentialState: "VALID", agentRestartRequired: false });
    }
  }
  if (!body.repair) return json({ ok: false, code: "PAIR_AUTH_FAILED", recoverable: true, credentialState: id && secret ? "REJECTED" : "MISSING", reply: "The browser credential did not authenticate this bridge. Repair rotates the credential and requires one Windows agent restart." }, 401);
  const sid = sessionId(request);
  const pairResponse = await runtimeFetch(env, sid, "/pair", request, "POST", { rotate: true });
  const pair: any = await pairResponse.json().catch(() => ({}));
  if (!pairResponse.ok || !pair.secret) return json({ ok: false, code: pair.code || "PAIR_REPAIR_FAILED" }, pairResponse.status || 503);
  return json({ ...pair, ok: true, repaired: true, bridgeId: sid, pairingCode: `${sid}.${pair.secret}`, credentialState: "REISSUED", agentRestartRequired: true, agentPath: "/api/hybrid/agent-download", connectorProtocol: "R127_ZERO_DRIFT_SHA256_PLUS_R199_VERIFIED_RETURN" });
}

export async function handleSovereignPcGatewayR199(request: Request, env: any): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if ((path === "/omega-hybrid-agent.py" || path === "/api/hybrid/agent-download") && request.method === "GET") return sovereignAgentR199Response();
  if (path === "/api/hybrid/connector-manifest" && request.method === "GET") return json(await sovereignAgentR199Manifest());
  if (!env?.OMEGA_RUNTIME) {
    if (path.startsWith("/api/hybrid/") || path.startsWith("/api/runtime/")) return json({ ok: false, code: "RUNTIME_STATE_BINDING_UNAVAILABLE" }, 503);
    return null;
  }
  if (path === "/api/hybrid/pair" && request.method === "POST") return pairR199(request, env);
  if (path === "/api/hybrid/reconnect" && request.method === "POST") return reconnectR199(request, env);

  const body = request.method === "POST" || request.method === "PUT" ? await request.clone().json().catch(() => ({})) : {};
  const id = bridgeId(request, body);
  if (path === "/api/hybrid/status" && request.method === "GET") return statusR199(request, env, id);
  if (path.startsWith("/api/hybrid/agent/") && request.method === "POST") return runtimeFetch(env, id, path.replace("/api/hybrid", ""), request, "POST", body);
  if (path === "/api/hybrid/jobs" && request.method === "POST") return runtimeFetch(env, id, "/jobs", request, "POST", body);
  if (path.startsWith("/api/hybrid/jobs/") && path.endsWith("/analyze") && request.method === "POST") return runtimeFetch(env, id, path.replace("/api/hybrid", ""), request, "POST", body);
  if (path.startsWith("/api/hybrid/jobs/") && path.endsWith("/receipt") && request.method === "GET") return runtimeFetch(env, id, path.replace("/api/hybrid", ""), request, "GET");
  if (path === "/api/runtime/snapshot" && request.method === "GET") return runtimeFetch(env, id, "/snapshot", request, "GET");
  if (path === "/api/runtime/events" && request.method === "GET") return runtimeFetch(env, id, "/events", request, "GET");
  if (path === "/api/missions" && (request.method === "GET" || request.method === "POST")) return runtimeFetch(env, id, "/missions", request, request.method, request.method === "POST" ? body : undefined);
  if (path.startsWith("/api/missions/") && request.method === "POST") return runtimeFetch(env, id, path.replace("/api", ""), request, "POST", body);
  return null;
}
