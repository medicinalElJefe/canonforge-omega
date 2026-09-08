import { HYBRID_OUTBOUND_R222 } from "./omegaRuntimeR222";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });

type DurableStub = { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };
type DurableNamespace = { idFromName(name: string): unknown; get(id: unknown): DurableStub };
type HybridEnv = {
  OMEGA_RUNTIME?: DurableNamespace;
  CANONICAL_GIT_SHA?: string;
  SOVEREIGN_GATEWAY_TOKEN?: string;
};

const CANONICAL_SINGLETON = "OMEGA_RUNTIME";

function runtimeStub(env: HybridEnv): DurableStub | null {
  const ns = env.OMEGA_RUNTIME;
  if (!ns) return null;
  return ns.get(ns.idFromName(CANONICAL_SINGLETON));
}

function bridgeRequest(request: Request, targetPath: string, body?: unknown): Request {
  const url = new URL(request.url);
  url.pathname = targetPath;
  url.search = "";
  const headers = new Headers(request.headers);
  const token = headers.get("x-omega-agent-token");
  if (token && !headers.get("x-omega-bridge-secret")) headers.set("x-omega-bridge-secret", token);
  headers.set("accept", "application/json");
  headers.delete("content-length");
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers.set("content-type", "application/json");
    payload = JSON.stringify(body);
  } else if (!["GET", "HEAD"].includes(request.method)) {
    payload = request.body || undefined;
  }
  return new Request(url.toString(), {
    method: request.method,
    headers,
    body: payload,
    redirect: "manual",
  });
}

async function readJson(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { ok: false, code: "NON_JSON_DURABLE_RESPONSE", status: response.status, raw: raw.slice(0, 1000) }; }
}

async function hybridStatus(request: Request, env: HybridEnv): Promise<Response> {
  const stub = runtimeStub(env);
  if (!stub) return json({ ok: false, code: "OMEGA_RUNTIME_BINDING_MISSING", badGatewayFallbackUsed: false }, 503);
  const raw = await stub.fetch(bridgeRequest(request, "/status"));
  const d = await readJson(raw);
  const devices = Array.isArray(d.devices) ? d.devices : [];
  const online = devices.find((row: any) => row.online && !row.revoked) || null;
  const authority = d.executionAuthority || {};
  return json({
    ok: raw.ok,
    state: online ? "VERIFIED_DEVICE_ONLINE" : d.paired ? "DEVICE_PROOF_REQUIRED" : "PAIRING_REQUIRED",
    serverRevision: d.serverRevision || HYBRID_OUTBOUND_R222,
    browserCredentialReady: Boolean(d.paired),
    pairingConfigured: Boolean(d.paired),
    agentRunning: Boolean(online),
    agentReachable: Boolean(online),
    authenticated: Boolean(online),
    agentAuthenticated: Boolean(online),
    heartbeatCurrent: Boolean(online),
    heartbeatStale: Boolean(d.paired && !online),
    heartbeatAgeSeconds: online ? Math.max(0, (Date.now() - Number(online.lastSeen || Date.now())) / 1000) : null,
    heartbeat_age_seconds: online ? Math.max(0, (Date.now() - Number(online.lastSeen || Date.now())) / 1000) : null,
    heartbeatTtlSeconds: 30,
    nativeExecutionClaimed: Boolean(online && authority.active),
    pcOnline: Boolean(online),
    pc_online: Boolean(online),
    proof: online ? {
      sequence: online.heartbeatSequence ?? null,
      agent_id: online.id,
      approved_root: online.rootLabel,
      capabilities: online.capabilities || [],
      runtime_version: online.version || null,
      last_job_id: online.lastJobId || null,
      lastSeen: online.lastSeen,
    } : null,
    executionAuthority: authority,
    development: d.developmentR222 || null,
    controlPlane: "CLOUDFLARE_DURABLE_OBJECT_OUTBOUND_AGENT_POLL",
    durableBinding: "OMEGA_RUNTIME",
    durableSingleton: CANONICAL_SINGLETON,
    inboundSovereignGatewayRequired: false,
    badGatewayFallbackUsed: false,
    boundary: "PC ONLINE requires a current authenticated outbound heartbeat. Native execution additionally requires a separate explicit local authority lease; the public browser cannot grant that lease by itself.",
  }, raw.ok ? 200 : raw.status);
}

function bootstrapCmd(env: HybridEnv): Response {
  const sha = String(env.CANONICAL_GIT_SHA || "").trim();
  const pinned = /^[0-9a-f]{40}$/i.test(sha) ? sha : "omega-v6-full-convergence";
  const short = /^[0-9a-f]{40}$/i.test(sha) ? sha.slice(0, 8) : "canonical";
  const cmd = `@echo off\r\nsetlocal EnableExtensions\r\nchcp 65001 >nul\r\nset "OMEGA_CANONICAL_SHA=${pinned}"\r\nset "OMEGA_HOME=%LOCALAPPDATA%\\OMEGA"\r\nset "OMEGA_BOOT=%OMEGA_HOME%\\r222_${short}"\r\nset "OMEGA_REPO=%OMEGA_BOOT%\\repo"\r\nif not exist "%OMEGA_HOME%" mkdir "%OMEGA_HOME%"\r\necho ============================================================\r\necho OMEGA R222 FULL HYBRID - SINGLE INSTANCE SETUP\r\necho ============================================================\r\necho Canonical: %OMEGA_CANONICAL_SHA%\r\necho.\r\nwhere git >nul 2>nul || goto :git_error\r\nif not exist "%OMEGA_REPO%\\.git" (\r\n  if not exist "%OMEGA_BOOT%" mkdir "%OMEGA_BOOT%"\r\n  git clone https://github.com/medicinalElJefe/canonforge-omega.git "%OMEGA_REPO%" || goto :clone_error\r\n)\r\npushd "%OMEGA_REPO%" || goto :clone_error\r\ngit fetch origin --prune >nul 2>nul\r\ngit checkout --detach %OMEGA_CANONICAL_SHA% || goto :checkout_error\r\nset "OMEGA_ROOT_OVERRIDE=%OMEGA_REPO%\\canonforge-omega"\r\ncall "%OMEGA_ROOT_OVERRIDE%\\scripts\\START_OMEGA_R222_FULL_HYBRID.cmd"\r\nset "RC=%ERRORLEVEL%"\r\npopd\r\nexit /b %RC%\r\n:git_error\r\necho GIT REQUIRED: Git must be installed and available on PATH.\r\npause\r\nexit /b 11\r\n:clone_error\r\necho SOURCE ERROR: canonical R222 source could not be prepared.\r\npause\r\nexit /b 12\r\n:checkout_error\r\necho SOURCE ERROR: exact canonical commit could not be checked out.\r\npause\r\nexit /b 13\r\n`;
  return new Response(cmd, {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": 'attachment; filename="START_OMEGA_R222_FULL_HYBRID.cmd"',
      "cache-control": "no-store",
      "x-omega-hybrid-control-plane": HYBRID_OUTBOUND_R222,
    },
  });
}

export async function handleHybridControlPlaneR222(request: Request, env: HybridEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const stub = runtimeStub(env);

  if (path === "/api/hybrid/launcher" && request.method === "GET") return bootstrapCmd(env);

  const claimed = path === "/api/hybrid/status" ||
    path === "/api/hybrid/enroll" ||
    path === "/api/device/heartbeat" ||
    path.startsWith("/api/hybrid/authority/") ||
    path === "/api/development/status" ||
    path === "/api/development/mode" ||
    path === "/api/development/enqueue" ||
    path === "/api/development/lease" ||
    /^\/api\/development\/jobs\/[A-Za-z0-9._:-]+\/result$/.test(path);

  if (!claimed) return null;
  if (!stub) return json({ ok: false, code: "OMEGA_RUNTIME_BINDING_MISSING", badGatewayFallbackUsed: false }, 503);

  if (path === "/api/hybrid/status" && request.method === "GET") return hybridStatus(request, env);
  if (path === "/api/hybrid/enroll" && request.method === "POST") return stub.fetch(bridgeRequest(request, "/r222/enroll-signed"));
  if (path === "/api/device/heartbeat" && request.method === "POST") return stub.fetch(bridgeRequest(request, "/r222/device-heartbeat"));
  if (path === "/api/hybrid/authority/status" && request.method === "GET") return stub.fetch(bridgeRequest(request, "/r222/authority/status"));
  if (path === "/api/hybrid/authority/grant" && request.method === "POST") return stub.fetch(bridgeRequest(request, "/r222/authority/grant"));
  if (path === "/api/hybrid/authority/revoke" && request.method === "POST") return stub.fetch(bridgeRequest(request, "/r222/authority/revoke"));
  if (path === "/api/development/status" && request.method === "GET") return stub.fetch(bridgeRequest(request, "/r222/development/status"));
  if (path === "/api/development/mode" && request.method === "POST") return stub.fetch(bridgeRequest(request, "/r222/development/mode"));
  if (path === "/api/development/enqueue" && request.method === "POST") return stub.fetch(bridgeRequest(request, "/r222/development/enqueue"));
  if (path === "/api/development/lease" && request.method === "POST") return stub.fetch(bridgeRequest(request, "/r222/development/lease"));

  const resultMatch = path.match(/^\/api\/development\/jobs\/([A-Za-z0-9._:-]+)\/result$/);
  if (resultMatch && request.method === "POST") {
    return stub.fetch(bridgeRequest(request, `/r222/development/jobs/${resultMatch[1]}/result`));
  }

  return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
}
