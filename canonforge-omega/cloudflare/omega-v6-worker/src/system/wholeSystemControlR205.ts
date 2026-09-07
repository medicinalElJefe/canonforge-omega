export const WHOLE_SYSTEM_CONTROL_RELEASE_R205 = "r205-whole-system-professional-control";
export const SAI_HYBRID_BRIDGE_SCHEMA_R205 = "OMEGA_SAI_HYBRID_BRIDGE_PREPARE_R205";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const HYBRID_OPS_R205 = new Set([
  "TRAIN_LOCAL","INDEX","READ_TEXT","SEARCH_TEXT","HASH_TREE","SAFE_IMPORT",
  "WORKBOOK_AUDIT","BUILD","TEST","PACKAGE","SUPPORT_BUNDLE","APPLY_PATCH",
  "OPEN_URL","WAIT","CLICK","KEY","TYPE_TEXT","SCROLL","ASSERT_WINDOW",
  "READ_VISIBLE_TEXT","RECORD_MACRO","REPLAY_MACRO",
]);
const DIRECT_PATH_OPS_R205 = new Set([
  "INDEX","READ_TEXT","HASH_TREE","BUILD","TEST","PACKAGE","SUPPORT_BUNDLE",
]);
const HYBRID_PROFILES_R205 = new Set([
  "AUTO_BUILD","NODE_BUILD","PYTHON_TEST","DOTNET_BUILD","WINDOWS_AUTOMATION","BROWSER_AUTOMATION",
]);

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

async function sha(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function readBody(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { ok: false, code: "NON_JSON_RESPONSE", status: response.status, bodyPreview: raw.slice(0, 1200) }; }
}

async function invoke(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: CanonicalFetch,
  path: string,
  method: "GET" | "POST" = "GET",
  payload?: unknown,
  extraHeaders: Record<string, string> = {},
) {
  const target = new URL(request.url);
  const [pathname, query = ""] = path.split("?", 2);
  target.pathname = pathname;
  target.search = query ? `?${query}` : "";
  const started = Date.now();
  try {
    const response = await canonicalFetch(new Request(target.toString(), {
      method,
      headers: {
        accept: "application/json",
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
        ...extraHeaders,
      },
      body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
    }), env, ctx);
    return {
      path: `${target.pathname}${target.search}`,
      status: response.status,
      ok: response.ok,
      body: await readBody(response),
      elapsedMs: Date.now() - started,
    };
  } catch (error) {
    return {
      path: `${target.pathname}${target.search}`,
      status: 0,
      ok: false,
      body: null,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
    };
  }
}

function layer(id: string, call: AnyObj, predicate: (body: AnyObj) => boolean, ready: string, degraded: string) {
  const body = call?.body || {};
  const good = Boolean(call?.ok && predicate(body));
  return {
    id,
    state: good ? ready : degraded,
    ok: good,
    status: call?.status ?? 0,
    schema: body?.schema ?? null,
    release: body?.release ?? body?.revision ?? null,
    elapsedMs: call?.elapsedMs ?? null,
  };
}

async function manifest(env: any) {
  const core = {
    ok: true,
    schema: "OMEGA_WHOLE_SYSTEM_CONTROL_MANIFEST_R205",
    release: WHOLE_SYSTEM_CONTROL_RELEASE_R205,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    purpose: "Unify presentation, AI, SAI, Hybrid, durable continuity, verified host return and bounded self-development above the preserved R169-R204 authority chain.",
    upstream: [
      "R179_PROVIDER_AI_AND_MULTI_AGENT_SAI",
      "R200_CANONICAL_MISSION_KERNEL",
      "R201_DURABLE_MISSION_CHAIN",
      "R202_UNIFIED_CONTINUITY_POTENTIAL",
      "R203_AUTHENTICATED_HYBRID_MISSION_CONTINUITY",
      "R204_VERIFIED_HYBRID_RETURN_ADMISSION",
    ],
    flow: [
      "OBSERVE_CURRENT_RUNTIME",
      "VERIFY_AI_AND_SAI_AUTHORITIES",
      "VERIFY_HYBRID_HEARTBEAT_TRUTH",
      "VERIFY_R201_R202_R203_R204_CONTINUITY",
      "VERIFY_BOUNDED_SELF_BUILD_PIPELINE",
      "PREPARE_RECEIPT_BOUND_SAI_HYBRID_BRIDGE",
      "MATERIALIZE_ONLY_EXPLICIT_ALLOW_LISTED_HOST_OPERATIONS",
      "REQUIRE_STRUCTURED_PARAMETERS_FOR_CONTEXTUAL_HOST_OPERATIONS",
      "R203_AUTHENTICATED_NATIVE_QUEUE_ONLY_IF_CURRENT_HOST_PROOF",
      "R204_VERIFIED_HOST_RETURN_ADMISSION",
      "R205_CORRELATE_HEALTH_AND_PRESENTATION",
      "SEPARATE_CANON_ADMISSION",
    ],
    endpoints: [
      "/api/system/r205/manifest",
      "/api/system/r205/health",
      "/api/intelligence/r205/bridge/prepare",
      "/api/intelligence/r205/bridge/execute",
    ],
    hybridOperations: [...HYBRID_OPS_R205],
    directPathOperations: [...DIRECT_PATH_OPS_R205],
    boundaries: {
      aiOutputIsNotCanon: true,
      saiOutputIsNotCanon: true,
      pcOnlineRequiresCurrentAuthenticatedHeartbeat: true,
      bridgePreparationIsNotHostExecution: true,
      explicitHostOperationsRequired: true,
      contextualOperationsRequireStructuredSteps: true,
      hostQueueIsNotHostCompletion: true,
      r204VerifiedReturnIsNotCanonState: true,
      selfBuildDraftIsNotGitMutation: true,
      successorEvidenceIsNotAutomaticPromotion: true,
      canonicalMutation: false,
      promotionAuthorized: false,
    },
  };
  return { ...core, receiptSha256: await sha(core) };
}

async function health(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const [r190, aiFusion, saiRuntime, b059, hybrid, r201, r202, r203, r204Return, selfBuild, sourcePatch] = await Promise.all([
    invoke(request, env, ctx, canonicalFetch, "/api/acceptance/r190/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/intelligence/r179/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/sai/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/sai/status"),
    invoke(request, env, ctx, canonicalFetch, "/api/hybrid/status"),
    invoke(request, env, ctx, canonicalFetch, "/api/mission/r201/verify"),
    invoke(request, env, ctx, canonicalFetch, "/api/system/r202/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/mission/r203/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/system/r204/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/swarm/improvement/r184/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/swarm/patch/r187/manifest"),
  ]);

  const hybridBody = hybrid.body || {};
  const heartbeatCurrent = Boolean(hybridBody?.heartbeatCurrent ?? hybridBody?.heartbeat_current);
  const authenticated = Boolean(hybridBody?.authenticated ?? hybridBody?.agentAuthenticated ?? hybridBody?.authenticated_heartbeat);
  const pcOnline = Boolean(hybridBody?.pcOnline ?? hybridBody?.pc_online) && heartbeatCurrent && authenticated;

  const layers = [
    layer("PROOF", r190, b => b?.ok === true, "VERIFIED", "DEGRADED"),
    layer("CLOUD_AI", aiFusion, b => b?.workers_ai_binding === true, "READY", "BINDING_REQUIRED"),
    layer("SAI_MULTI_AGENT", saiRuntime, b => b?.operationalIntelligenceReady === true, "READY", "BINDING_REQUIRED"),
    layer("SAI_B059", b059, b => b?.passed === true || b?.state === "B059_PRESENT_VERIFICATION_REQUIRED", "AVAILABLE", "UNAVAILABLE"),
    {
      id: "HYBRID_PC",
      state: pcOnline ? "PC_ONLINE_AUTHENTICATED" : heartbeatCurrent ? "HEARTBEAT_PRESENT_AUTHENTICATION_INCOMPLETE" : "READY_AWAITING_DEVICE",
      ok: pcOnline,
      available: hybrid.ok,
      status: hybrid.status,
      schema: hybridBody?.schema ?? null,
      release: hybridBody?.release ?? null,
      heartbeatCurrent,
      authenticated,
      pcOnline,
      heartbeatAgeSeconds: hybridBody?.heartbeatAgeSeconds ?? hybridBody?.heartbeat_age_seconds ?? null,
      elapsedMs: hybrid.elapsedMs,
    },
    layer("R201_DURABILITY", r201, b => b?.verified === true, "CHAIN_VERIFIED", "CHAIN_HOLD"),
    layer("R202_CONTINUITY", r202, b => b?.ok === true, "READY", "DEGRADED"),
    layer("R203_HYBRID_CONTINUITY", r203, b => b?.ok === true, "READY", "DEGRADED"),
    layer("R204_RETURN_ADMISSION", r204Return, b => b?.schema === "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204" && b?.canonicalMutation === false, "VERIFIED_RETURN_GATE_READY", "DEGRADED"),
    layer("SELF_BUILD_DISCOVERY", selfBuild, b => b?.automaticCanonicalPromotion === false && b?.continuousShapingOnFailure === true, "BOUNDED_READY", "DEGRADED"),
    layer("SELF_BUILD_PATCH", sourcePatch, b => b?.canonicalMutation === false, "BOUNDED_READY", "DEGRADED"),
  ];

  const required = layers.filter((row: any) => row.id !== "HYBRID_PC");
  const cloudReady = required.every((row: any) => row.ok === true);
  const core = {
    ok: cloudReady,
    schema: "OMEGA_WHOLE_SYSTEM_HEALTH_R205",
    release: WHOLE_SYSTEM_CONTROL_RELEASE_R205,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    generatedAt: new Date().toISOString(),
    state: cloudReady ? (pcOnline ? "WHOLE_SYSTEM_READY_WITH_SOVEREIGN_HOST" : "CLOUD_SYSTEM_READY_HOST_OPTIONAL_OFFLINE") : "WHOLE_SYSTEM_DEGRADED",
    layers,
    aiSai: {
      cloudAiReady: layers.find((x: any) => x.id === "CLOUD_AI")?.ok === true,
      multiAgentSaiReady: layers.find((x: any) => x.id === "SAI_MULTI_AGENT")?.ok === true,
      b059Available: layers.find((x: any) => x.id === "SAI_B059")?.ok === true,
      bridgeReady: layers.find((x: any) => x.id === "R203_HYBRID_CONTINUITY")?.ok === true && layers.find((x: any) => x.id === "R204_RETURN_ADMISSION")?.ok === true,
    },
    selfBuild: {
      state: layers.filter((x: any) => x.id.startsWith("SELF_BUILD_")).every((x: any) => x.ok) ? "BOUNDED_SELF_BUILD_READY" : "SELF_BUILD_DEGRADED",
      automaticGitMutation: false,
      automaticCanonicalPromotion: false,
      rule: "Discover, rank and draft bounded successors automatically; require exact evidence and separate mutation/promotion authority.",
    },
    hybrid: {
      transportAvailable: hybrid.ok,
      heartbeatCurrent,
      authenticated,
      pcOnline,
      nativeExecutionMayBeClaimed: pcOnline,
      verifiedReturnAdmissionReady: layers.find((x: any) => x.id === "R204_RETURN_ADMISSION")?.ok === true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await sha(core) };
}

async function prepareBridge(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, input: AnyObj) {
  const prompt = text(input.prompt || input.intent || input.objective).slice(0, 12000);
  if (!prompt) return json({ ok: false, code: "R205_BRIDGE_PROMPT_REQUIRED", canonicalMutation: false, promotionAuthorized: false }, 422);
  const depth = Math.max(1, Math.min(12, Math.trunc(Number(input.depth || 6))));

  const [sai, fusion, healthState] = await Promise.all([
    invoke(request, env, ctx, canonicalFetch, "/api/sai/infer", "POST", { prompt, depth, maxTokens: input.maxTokens }),
    invoke(request, env, ctx, canonicalFetch, "/api/intelligence/r179/fuse", "POST", { prompt, use_sai: true, model: input.model }),
    health(request, env, ctx, canonicalFetch),
  ]);

  const saiReceipt = text(sai.body?.receipt?.receiptSha256);
  const fusionReceipt = text(fusion.body?.receipt_sha256);
  const ready = Boolean(sai.ok && sai.body?.ok === true && /^[0-9a-f]{64}$/i.test(saiReceipt) && fusion.ok && /^[0-9a-f]{64}$/i.test(fusionReceipt));
  const core = {
    ok: ready,
    schema: SAI_HYBRID_BRIDGE_SCHEMA_R205,
    release: WHOLE_SYSTEM_CONTROL_RELEASE_R205,
    createdAt: new Date().toISOString(),
    intent: prompt,
    depth,
    lineage: {
      saiMissionId: sai.body?.result?.missionId ?? sai.body?.missionId ?? null,
      saiReceiptSha256: saiReceipt || null,
      fusionReceiptSha256: fusionReceipt || null,
      b059ReceiptSha256: fusion.body?.sai_receipt_sha256 ?? null,
      providerModel: fusion.body?.model ?? sai.body?.result?.provider ?? null,
      provider: fusion.body?.provider ?? null,
    },
    synthesis: {
      saiAnswer: text(sai.body?.result?.answer).slice(0, 6000) || null,
      fusedAnswer: text(fusion.body?.answer).slice(0, 6000) || null,
      successfulSpecialists: sai.body?.result?.successfulSpecialists ?? null,
      specialistCount: sai.body?.result?.specialistCount ?? null,
      saiGrounded: fusion.body?.sai_grounded === true,
    },
    hybridReadiness: {
      bridgeLayerReady: healthState?.aiSai?.bridgeReady === true,
      verifiedReturnAdmissionReady: healthState?.hybrid?.verifiedReturnAdmissionReady === true,
      pcOnline: healthState?.hybrid?.pcOnline === true,
      executionAuthorized: false,
      reason: healthState?.hybrid?.pcOnline === true
        ? "Current host proof exists, but explicit bridge execution confirmation, explicit allow-listed host operations, and the existing paired bridge credential are still required."
        : "Bridge preparation is complete; native execution remains withheld until current authenticated host proof exists.",
    },
    authority: "SAI_AI_BRIDGE_PREPARATION_NOT_HOST_EXECUTION_NOT_CANON",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await sha(core) }, ready ? 200 : 503);
}

function explicitHybridPlan(hybrid: AnyObj) {
  const structured = Array.isArray(hybrid.steps) ? hybrid.steps.filter((row: unknown) => row && typeof row === "object").slice(0, 24) : [];
  if (structured.length) {
    const normalized = structured.map((row: AnyObj, index: number) => ({
      ...row,
      id: text(row.id) || `R205-${String(index + 1).padStart(2, "0")}`,
      op: text(row.op).toUpperCase(),
      label: text(row.label) || `R205 explicit ${text(row.op).toUpperCase()}`,
    }));
    const unsupported = normalized.filter((row: AnyObj) => !HYBRID_OPS_R205.has(row.op)).map((row: AnyObj) => row.op || "MISSING_OP");
    if (unsupported.length) return { ok: false, code: "R205_UNSUPPORTED_STRUCTURED_HOST_OPERATION", unsupported, allowedOps: [], draft: null };
    const allowedOps = [...new Set(normalized.map((row: AnyObj) => row.op))];
    return {
      ok: true,
      code: "R205_STRUCTURED_HOST_PLAN_ACCEPTED_FOR_R33_R204_VALIDATION",
      unsupported: [],
      allowedOps,
      draft: {
        schema: "OMEGA_GOVERNED_ACTION_DRAFT_R205",
        projectPath: text(hybrid.projectPath || ".") || ".",
        allowedDomains: Array.isArray(hybrid.allowedDomains) ? hybrid.allowedDomains.map(String).slice(0, 12) : [],
        steps: normalized,
      },
    };
  }

  const requested = Array.isArray(hybrid.allowedOps)
    ? hybrid.allowedOps.map((value: unknown) => text(value).toUpperCase()).filter(Boolean)
    : [];
  const unsupported = requested.filter((op: string) => !HYBRID_OPS_R205.has(op));
  const allowedOps = [...new Set(requested.filter((op: string) => HYBRID_OPS_R205.has(op)))];
  if (!allowedOps.length) return { ok: false, code: "R205_EXPLICIT_ALLOW_LISTED_HOST_OPERATIONS_REQUIRED", unsupported, allowedOps: [] as string[], draft: null };
  if (unsupported.length) return { ok: false, code: "R205_UNSUPPORTED_HOST_OPERATION", unsupported, allowedOps, draft: null };
  const contextual = allowedOps.filter((op: string) => !DIRECT_PATH_OPS_R205.has(op));
  if (contextual.length) return { ok: false, code: "R205_STRUCTURED_STEPS_REQUIRED_FOR_CONTEXTUAL_OPERATIONS", contextual, allowedOps, draft: null };

  const projectPath = text(hybrid.projectPath || ".") || ".";
  const profile = HYBRID_PROFILES_R205.has(text(hybrid.profile).toUpperCase()) ? text(hybrid.profile).toUpperCase() : "AUTO_BUILD";
  const steps = allowedOps.map((op: string, index: number) => ({
    id: `R205-${String(index + 1).padStart(2, "0")}`,
    op,
    label: `R205 SAI-bridged explicit ${op}`,
    path: projectPath,
    ...(op === "BUILD" || op === "TEST" ? { profile } : {}),
  }));
  return {
    ok: true,
    code: "R205_EXPLICIT_HOST_PLAN_MATERIALIZED",
    unsupported: [],
    allowedOps,
    draft: {
      schema: "OMEGA_GOVERNED_ACTION_DRAFT_R205",
      projectPath,
      allowedDomains: Array.isArray(hybrid.allowedDomains) ? hybrid.allowedDomains.map(String).slice(0, 12) : [],
      steps,
    },
  };
}

async function executeBridge(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, input: AnyObj) {
  const packet = input.preparePacket;
  if (!packet || packet.schema !== SAI_HYBRID_BRIDGE_SCHEMA_R205 || packet.release !== WHOLE_SYSTEM_CONTROL_RELEASE_R205) {
    return json({ ok: false, code: "R205_VALID_PREPARE_PACKET_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);
  }
  const given = text(packet.receiptSha256);
  const packetCore: AnyObj = { ...packet };
  delete packetCore.receiptSha256;
  const recomputed = await sha(packetCore);
  if (!/^[0-9a-f]{64}$/i.test(given) || recomputed.toLowerCase() !== given.toLowerCase() || packet.ok !== true) {
    return json({ ok: false, code: "R205_PREPARE_RECEIPT_INTEGRITY_FAILED", given, recomputed, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 409);
  }
  if (input.confirmedBridgeExecution !== true) {
    return json({ ok: false, code: "R205_EXPLICIT_BRIDGE_EXECUTION_CONFIRMATION_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 409);
  }
  const bridgeSecret = text(request.headers.get("x-omega-bridge-secret"));
  if (!bridgeSecret) {
    return json({ ok: false, code: "DEVICE_PROOF_REQUIRED", reason: "The existing paired bridge credential is required and is never persisted by R205.", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 503);
  }

  const hybrid = input.hybrid && typeof input.hybrid === "object" ? input.hybrid : {};
  const hostPlan = explicitHybridPlan(hybrid);
  if (!hostPlan.ok) return json({ ...hostPlan, ok: false, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);

  const lineageIntent = [
    packet.intent,
    "",
    `R205_SAI_RECEIPT=${packet.lineage?.saiReceiptSha256}`,
    `R205_FUSION_RECEIPT=${packet.lineage?.fusionReceiptSha256}`,
    `R205_BRIDGE_PREPARE_RECEIPT=${given}`,
  ].join("\n");
  const missionInput = {
    intent: lineageIntent,
    useAI: true,
    allModes: true,
    allDomains: false,
    operations: [{ operation: "sai.query", prompt: packet.intent, required: true }],
  };
  const result = await invoke(request, env, ctx, canonicalFetch, "/api/mission/r203/execute-closed-loop", "POST", {
    missionInput,
    hybrid: {
      ...hybrid,
      objective: text(hybrid.objective || packet.intent),
      allowedOps: hostPlan.allowedOps,
      draft: hostPlan.draft,
      confirmedMission: true,
    },
  }, { "x-omega-bridge-secret": bridgeSecret });

  const responseCore = {
    ok: result.ok && result.body?.ok === true,
    schema: "OMEGA_SAI_HYBRID_BRIDGE_EXECUTION_R205",
    release: WHOLE_SYSTEM_CONTROL_RELEASE_R205,
    bridgePrepareReceiptSha256: given,
    saiReceiptSha256: packet.lineage?.saiReceiptSha256 ?? null,
    fusionReceiptSha256: packet.lineage?.fusionReceiptSha256 ?? null,
    requestedHostOperations: hostPlan.allowedOps,
    hostPlanSha256: await sha(hostPlan.draft),
    downstreamStatus: result.status,
    downstream: result.body,
    state: result.body?.state ?? result.body?.hybrid?.state ?? (result.ok ? "BRIDGE_DOWNSTREAM_RETURNED" : "BRIDGE_WITHHELD_OR_FAILED"),
    bridgeCredentialPersisted: false,
    canonicalMutation: false,
    hostStateMutation: result.body?.hostStateMutation === true,
    promotionAuthorized: false,
    authority: "R205_LINEAGE_WRAPPER_R203_QUEUES_AND_R204_VERIFIES_HOST_RETURN",
  };
  return json({ ...responseCore, receiptSha256: await sha(responseCore) }, result.status || 500);
}

export async function handleWholeSystemControlR205(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const relevant = path.startsWith("/api/system/r205") || path.startsWith("/api/intelligence/r205");
  if (!relevant) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });

  try {
    if (path === "/api/system/r205/manifest" && request.method === "GET") return json(await manifest(env));
    if (path === "/api/system/r205/health" && request.method === "GET") return json(await health(request, env, ctx, canonicalFetch));
    if (path === "/api/intelligence/r205/bridge/prepare" && request.method === "POST") return prepareBridge(request, env, ctx, canonicalFetch, await request.json().catch(() => ({})) as AnyObj);
    if (path === "/api/intelligence/r205/bridge/execute" && request.method === "POST") return executeBridge(request, env, ctx, canonicalFetch, await request.json().catch(() => ({})) as AnyObj);
    return json({ ok: false, code: "R205_ROUTE_NOT_FOUND", canonicalMutation: false, promotionAuthorized: false }, 404);
  } catch (error) {
    return json({
      ok: false,
      schema: "OMEGA_WHOLE_SYSTEM_CONTROL_ERROR_R205",
      release: WHOLE_SYSTEM_CONTROL_RELEASE_R205,
      code: "R205_CONTROL_FAILED",
      error: error instanceof Error ? error.message : String(error),
      canonicalMutation: false,
      promotionAuthorized: false,
    }, 500);
  }
}
