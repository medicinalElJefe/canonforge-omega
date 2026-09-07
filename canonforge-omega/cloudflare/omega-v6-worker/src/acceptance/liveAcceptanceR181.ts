export const LIVE_ACCEPTANCE_RELEASE_R181 = "r181-live-ai-sai-sovereign-acceptance";
export const LIVE_ACCEPTANCE_SCHEMA_R181 = "OMEGA_LIVE_AI_SAI_SOVEREIGN_ACCEPTANCE_R181";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

async function sha256(value: unknown): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function callCanonical(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: CanonicalFetch,
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; body: AnyObj | null }> {
  try {
    const url = new URL(request.url);
    url.pathname = path;
    url.search = "";
    const response = await canonicalFetch(new Request(url.toString(), {
      method: init.method || "GET",
      headers: init.headers || { accept: "application/json" },
      body: init.body,
    }), env, ctx);
    const body = await response.json().catch(() => null) as AnyObj | null;
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: { error: String(error) } };
  }
}

function hybridTruth(body: AnyObj | null): AnyObj {
  const current = Boolean(body?.pcOnline ?? body?.pc_online ?? body?.agentReachable ?? body?.heartbeatCurrent);
  const authenticated = Boolean(body?.authenticated ?? body?.agentAuthenticated ?? body?.authenticated_heartbeat);
  const heartbeatCurrent = Boolean(body?.heartbeatCurrent ?? body?.heartbeat_current ?? body?.pcOnline ?? body?.pc_online);
  return {
    current,
    authenticated,
    heartbeatCurrent,
    accepted: current && authenticated && heartbeatCurrent,
    state: body?.state ?? null,
    heartbeatAgeSeconds: body?.heartbeatAgeSeconds ?? body?.heartbeat_age_seconds ?? null,
    runtimeVersion: body?.proof?.runtime_version ?? body?.runtime_version ?? null,
    agentId: body?.proof?.agent_id ?? body?.agent_id ?? null,
  };
}

function b059QuickTruth(body: AnyObj | null): AnyObj {
  const present = body?.state === "B059_PRESENT_VERIFICATION_REQUIRED" || body?.passed === true;
  return {
    present,
    state: body?.state ?? null,
    release: body?.release ?? null,
    schema: body?.schema ?? null,
    quickPassed: body?.passed === true,
    fullyTrainedClaim: body?.fully_trained_within_declared_scope === true,
    rootReported: Boolean(body?.root),
  };
}

function b059VerificationTruth(body: AnyObj | null): AnyObj {
  const training = body?.training || {};
  const fully = body?.passed === true && training?.fully_trained_within_declared_scope === true;
  return {
    passed: body?.passed === true,
    fullyTrainedWithinDeclaredScope: fully,
    foundationModelWeightsTrained: training?.foundation_model_weights_trained === true,
    trainingScope: training?.scope ?? null,
    documents: body?.documents ?? null,
    edges: body?.edges ?? null,
    sourceAuthorityCount: body?.source_authority_count ?? null,
    receiptSha256: body?.receipt_sha256 ?? null,
    schema: body?.schema ?? null,
  };
}

function b059QueryTruth(body: AnyObj | null): AnyObj {
  return {
    grounded: body?.grounded === true,
    fullyTrainedWithinDeclaredScope: body?.fully_trained_within_declared_scope === true,
    foundationModelWeightsTrained: body?.foundation_model_weights_trained === true,
    evidenceCount: Number(body?.evidence_count || 0),
    receiptSha256: body?.receipt_sha256 ?? null,
    schema: body?.schema ?? null,
  };
}

export async function handleLiveAcceptanceR181(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: CanonicalFetch,
): Promise<Response> {
  const url = new URL(request.url);
  const canonicalGitSha = String(env?.CANONICAL_GIT_SHA || "").trim() || null;
  if (request.method === "GET" && url.pathname === "/api/acceptance/r181/manifest") {
    return json({
      ok: true,
      schema: "OMEGA_LIVE_ACCEPTANCE_MANIFEST_R181",
      release: LIVE_ACCEPTANCE_RELEASE_R181,
      canonicalGitSha,
      deploymentIdentityBound: Boolean(canonicalGitSha),
      acceptanceLevels: [
        "CLOUD_SWARM_OPERATIONAL",
        "SOVEREIGN_HEARTBEAT_ACCEPTED",
        "B059_PRESENT_VERIFICATION_REQUIRED",
        "B059_FULLY_TRAINED_WITHIN_DECLARED_SCOPE",
        "B059_GROUNDED_QUERY_VERIFIED",
        "FULL_AI_SAI_SOVEREIGN_ACCEPTANCE",
      ],
      hardBoundaries: {
        providerWeightsMayBeCalledOmegaTrained: false,
        quickB059PresenceMayBeCalledFullyTrained: false,
        b059DeepVerificationRequiredForFullyTrainedScope: true,
        b059GroundedQueryRequiredForFullAcceptance: true,
        currentAuthenticatedHeartbeatRequiredForSovereignAcceptance: true,
        deploymentShaMustMatchBeforePostDeployProof: true,
        canonicalMutation: false,
        promotionAuthorized: false,
      },
      canonicalMutation: false,
      promotionAuthorized: false,
    });
  }
  if (request.method !== "POST" || url.pathname !== "/api/acceptance/r181/probe") {
    return json({ ok: false, error: "r181_acceptance_route_not_found" }, 404);
  }

  const payload = await request.json().catch(() => ({})) as AnyObj;
  const deepB059 = payload.deep_b059 !== false;
  const queryB059 = payload.query_b059 !== false;
  const queryPrompt = String(payload.prompt || "Explain Woven Continuity, Mode 188, scar carry, and the 20,736-address system using only grounded B059 evidence.").slice(0, 32000);

  const [hybridCall, statusCall] = await Promise.all([
    callCanonical(request, env, ctx, canonicalFetch, "/api/hybrid/status"),
    callCanonical(request, env, ctx, canonicalFetch, "/api/sai/status"),
  ]);
  const hybrid = hybridTruth(hybridCall.body);
  const b059Quick = b059QuickTruth(statusCall.body);

  let verifyCall: { ok: boolean; status: number; body: AnyObj | null } | null = null;
  let queryCall: { ok: boolean; status: number; body: AnyObj | null } | null = null;
  if (deepB059 && hybrid.accepted && b059Quick.present) {
    verifyCall = await callCanonical(request, env, ctx, canonicalFetch, "/api/sai/verify", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ deep: true, selftest: true }),
    });
    const verified = b059VerificationTruth(verifyCall.body);
    if (queryB059 && verifyCall.ok && verified.fullyTrainedWithinDeclaredScope) {
      queryCall = await callCanonical(request, env, ctx, canonicalFetch, "/api/sai/query", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ prompt: queryPrompt, limit: 8 }),
      });
    }
  }

  const b059Verification = b059VerificationTruth(verifyCall?.body || null);
  const b059Query = b059QueryTruth(queryCall?.body || null);
  const fullAcceptance = Boolean(
    hybrid.accepted &&
    b059Verification.fullyTrainedWithinDeclaredScope &&
    b059Verification.foundationModelWeightsTrained === false &&
    b059Verification.documents === 541526 &&
    b059Verification.edges === 82082 &&
    b059Verification.sourceAuthorityCount === 15 &&
    b059Query.grounded &&
    b059Query.fullyTrainedWithinDeclaredScope &&
    b059Query.foundationModelWeightsTrained === false &&
    b059Query.evidenceCount > 0 &&
    /^[a-f0-9]{64}$/.test(String(b059Query.receiptSha256 || ""))
  );

  const acceptanceState = fullAcceptance
    ? "FULL_AI_SAI_SOVEREIGN_ACCEPTANCE"
    : hybrid.accepted
      ? (b059Quick.present ? "SOVEREIGN_ONLINE_B059_VERIFICATION_INCOMPLETE" : "SOVEREIGN_ONLINE_B059_NOT_PRESENT")
      : "CLOUD_OPERATIONAL_SOVEREIGN_ACCEPTANCE_PENDING_CURRENT_HEARTBEAT";

  const core = {
    schema: LIVE_ACCEPTANCE_SCHEMA_R181,
    release: LIVE_ACCEPTANCE_RELEASE_R181,
    canonicalGitSha,
    deploymentIdentityBound: Boolean(canonicalGitSha),
    timestamp: new Date().toISOString(),
    acceptanceState,
    fullAcceptance,
    hybrid: { transportStatus: hybridCall.status, ...hybrid },
    b059Quick: { transportStatus: statusCall.status, ...b059Quick },
    b059Verification: { transportStatus: verifyCall?.status ?? null, ...b059Verification },
    b059GroundedQuery: { transportStatus: queryCall?.status ?? null, ...b059Query },
    trainingTruth: {
      b059MayBeCalledFullyTrainedOnlyWithinDeclaredDeterministicScopeAfterExactVerification: true,
      providerModelWeightsAreExternalPretrainingNotOmegaTraining: true,
    },
    authority: "LIVE_ACCEPTANCE_RECEIPT_NOT_CANON",
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return json({ ok: true, ...core, receiptSha256: await sha256(core) });
}
