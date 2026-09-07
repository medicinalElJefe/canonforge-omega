import { handleWholeSystemAcceptanceR190 } from "./wholeSystemAcceptanceR190";

type Obj = Record<string, any>;
type RouterFetch = (request: Request, env: any, ctx: any) => Promise<Response>;

export const R190_ACCEPTANCE_REPAIR_ID = "r190-sovereign-boundary-classification-repair";

const SOVEREIGN_BACKED = new Set([
  "CANONICAL_STATE",
  "PROOF_LEDGER",
  "RESTORATION_RECOVERY",
  "EARTH_SOURCE_BOUNDARY",
]);

const TRANSIENT_EXTERNAL_STATUSES = new Set([0, 502, 503, 504]);
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

async function sha256(value: unknown): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

function repairCapability(capability: Obj): Obj {
  const repaired = { ...capability };
  const id = String(repaired.id || "");
  if (!SOVEREIGN_BACKED.has(id)) return repaired;

  repaired.requiredQuick = false;
  repaired.requiredFull = true;

  const state = String(repaired.state || "");
  const status = Number(repaired.httpStatus ?? 0);
  const transientFailure =
    repaired.verified !== true &&
    (state.startsWith("FAILED_RETURN") || state.startsWith("FAILED_INVOCATION")) &&
    TRANSIENT_EXTERNAL_STATUSES.has(Number.isFinite(status) ? status : 0);

  if (transientFailure) {
    repaired.state = "BLOCKED_SOVEREIGN_AUTHORITY_UNAVAILABLE";
    repaired.verified = false;
    repaired.boundary = `${repaired.boundary || ""} Sovereign-backed capability: transient authority/gateway unavailability is reported as an external proof block, not as a local implementation failure.`.trim();
  }
  return repaired;
}

function repairCapabilities(value: unknown): Obj[] {
  return Array.isArray(value) ? value.map(item => repairCapability((item || {}) as Obj)) : [];
}

function recomputeProbe(body: Obj): Obj {
  const capabilities = repairCapabilities(body.capabilities);
  const full = String(body.depth || "quick").toLowerCase() === "full";
  const required = capabilities.filter(capability => full ? capability.requiredFull !== false : capability.requiredQuick === true);
  const hardFailures = required.filter(capability => !capability.verified && String(capability.state || "").startsWith("FAILED"));
  const blocked = required.filter(capability => !capability.verified && String(capability.state || "").startsWith("BLOCKED"));
  const verified = capabilities.filter(capability => capability.verified === true).length;
  const allRequiredVerified = required.every(capability => capability.verified === true);
  const overallState = allRequiredVerified
    ? (full ? "FULL_SYSTEM_VERIFIED" : "CORE_SYSTEM_VERIFIED")
    : hardFailures.length
      ? "ACCEPTANCE_FAILED"
      : blocked.length
        ? "EXTERNAL_PROOF_BLOCKED"
        : "PARTIAL_VERIFICATION";

  const repaired: Obj = {
    ...body,
    ok: hardFailures.length === 0,
    overallState,
    capabilities,
    summary: {
      total: capabilities.length,
      verified,
      unverified: capabilities.length - verified,
      required: required.length,
      requiredVerified: required.filter(capability => capability.verified === true).length,
      hardFailures: hardFailures.length,
      blocked: blocked.length,
    },
    acceptanceRepair: {
      id: R190_ACCEPTANCE_REPAIR_ID,
      cloudQuickExcludesSovereignBackedCapabilities: [...SOVEREIGN_BACKED],
      fullAcceptanceStillRequiresSovereignBackedCapabilities: true,
      transientExternalStatusesClassifiedAsBlocked: [...TRANSIENT_EXTERNAL_STATUSES],
      invalidSuccessfulResponsesRemainHardFailures: true,
      canonicalMutation: false,
      promotionAuthorized: false,
    },
  };
  delete repaired.receiptSha256;
  return repaired;
}

export async function handleWholeSystemAcceptanceR190Repaired(
  request: Request,
  env: any,
  ctx: any,
  routerFetch: RouterFetch,
): Promise<Response> {
  const original = await handleWholeSystemAcceptanceR190(request, env, ctx, routerFetch);
  const text = await original.text();
  let body: Obj;
  try {
    body = JSON.parse(text) as Obj;
  } catch {
    return new Response(text, { status: original.status, headers: original.headers });
  }

  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/acceptance/r190/manifest") {
    const capabilities = repairCapabilities(body.capabilities);
    const repaired: Obj = {
      ...body,
      capabilities,
      acceptanceRepair: {
        id: R190_ACCEPTANCE_REPAIR_ID,
        cloudQuickExcludesSovereignBackedCapabilities: [...SOVEREIGN_BACKED],
        fullAcceptanceStillRequiresSovereignBackedCapabilities: true,
        transientExternalStatusesClassifiedAsBlocked: [...TRANSIENT_EXTERNAL_STATUSES],
        canonicalMutation: false,
        promotionAuthorized: false,
      },
    };
    delete repaired.manifestSha256;
    return json({ ...repaired, manifestSha256: await sha256(repaired) }, 200);
  }

  if (request.method === "POST" && url.pathname === "/api/acceptance/r190/probe") {
    const repaired = recomputeProbe(body);
    const receiptSha256 = await sha256(repaired);
    const status = repaired.summary?.hardFailures ? 503 : 200;
    return json({ ...repaired, receiptSha256 }, status);
  }

  return json(body, original.status);
}
