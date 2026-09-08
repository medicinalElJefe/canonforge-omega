export const SURFACE_COMPATIBILITY_RELEASE_R214 = "r214-truthful-surface-compatibility";

type RuntimeNext = (request: Request, env: any, ctx: any) => Promise<Response>;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-surface-compatibility": SURFACE_COMPATIBILITY_RELEASE_R214,
    },
  });
}

function aliasRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url.toString(), { method: "GET", headers: request.headers });
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { ok: response.ok, status: response.status, preview: text.slice(0, 320) }; }
}

async function probe(next: RuntimeNext, request: Request, env: any, ctx: any, pathname: string) {
  try {
    const response = await next(aliasRequest(request, pathname), env, ctx);
    return { pathname, status: response.status, ok: response.ok, body: await readJson(response) };
  } catch (error) {
    return { pathname, status: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function handleSurfaceCompatibilityR214(
  request: Request,
  env: any,
  ctx: any,
  next: RuntimeNext,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const aliases = new Set(["/api/restoration", "/api/status", "/api/federation/ceremony/ledger", "/api/surface/r214/manifest"]);
  if (!aliases.has(path)) return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);

  if (path === "/api/restoration") {
    const target = await next(aliasRequest(request, "/api/system/r195/restoration"), env, ctx);
    const headers = new Headers(target.headers);
    headers.set("x-omega-compatibility-alias", "/api/restoration -> /api/system/r195/restoration");
    headers.set("cache-control", "no-store");
    return new Response(target.body, { status: target.status, statusText: target.statusText, headers });
  }

  if (path === "/api/federation/ceremony/ledger") {
    const target = await next(aliasRequest(request, "/api/federation/r174/manifest"), env, ctx);
    const body = await readJson(target);
    return json({
      ok: target.ok,
      schema: "OMEGA_FEDERATION_CEREMONY_COMPATIBILITY_R214",
      revision: "R214",
      release: SURFACE_COMPATIBILITY_RELEASE_R214,
      compatibilityAlias: true,
      requestedPath: path,
      authoritativeRoute: "/api/federation/r174/manifest",
      authority: "READ_ONLY_COMPATIBILITY_VIEW_NOT_NEW_FEDERATION_LEDGER",
      sourceStatus: target.status,
      federation: body,
      canonicalMutation: false,
      promotionAuthorized: false,
    }, target.ok ? 200 : 502);
  }

  if (path === "/api/status") {
    const [acceptance, fabric, federation, restoration] = await Promise.all([
      probe(next, request, env, ctx, "/api/acceptance/r190/manifest"),
      probe(next, request, env, ctx, "/api/fabric/r191/status"),
      probe(next, request, env, ctx, "/api/federation/r174/health"),
      probe(next, request, env, ctx, "/api/system/r195/restoration"),
    ]);
    const probes = [acceptance, fabric, federation, restoration];
    return json({
      ok: true,
      schema: "OMEGA_PUBLIC_STATUS_R214",
      revision: "R214",
      release: SURFACE_COMPATIBILITY_RELEASE_R214,
      canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
      state: probes.every((p) => p.ok) ? "OPERATIONAL" : "DEGRADED",
      probes,
      truthBoundary: "Status is an aggregate read-only observation. A degraded optional subsystem is not fabricated as healthy, and this route does not claim Sovereign-PC acceptance.",
      canonicalMutation: false,
      promotionAuthorized: false,
    });
  }

  return json({
    ok: true,
    schema: "OMEGA_SURFACE_COMPATIBILITY_MANIFEST_R214",
    revision: "R214",
    release: SURFACE_COMPATIBILITY_RELEASE_R214,
    aliases: [
      { path: "/api/restoration", target: "/api/system/r195/restoration", mode: "READ_ONLY_ALIAS" },
      { path: "/api/federation/ceremony/ledger", target: "/api/federation/r174/manifest", mode: "READ_ONLY_ALIAS" },
      { path: "/api/status", target: "LOCAL_AGGREGATE", mode: "READ_ONLY_AGGREGATE" },
    ],
    sovereignGatewayFallbackUsed: false,
    canonicalMutation: false,
    promotionAuthorized: false,
  });
}
