export const CAPABILITY_ADMISSION_RELEASE_R223 = "r223-capability-scoped-admission";
export const CAPABILITY_ADMISSION_SCHEMA_R223 = "OMEGA_CAPABILITY_SCOPED_ADMISSION_R223";

export type CanonicalFetchR223 = (request: Request, env: any, ctx: any) => Promise<Response>;
type Obj = Record<string, any>;
type ProbeSpec = { id: string; path: string; method?: "GET" | "POST"; body?: unknown };

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const R199_RELEASE = "r199-unified-operator-control-plane";
const R205_RELEASE = "r205-whole-system-professional-control";
const R205_BRIDGE_SCHEMA = "OMEGA_SAI_HYBRID_BRIDGE_PREPARE_R205";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map(v => v.toString(16).padStart(2, "0")).join("");
}

function text(value: unknown): string { return String(value ?? "").trim(); }
function sha40(value: unknown): boolean { return /^[0-9a-f]{40}$/i.test(text(value)); }

async function readBody(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { ok: false, code: "NON_JSON_RESPONSE", status: response.status, bodyPreview: raw.slice(0, 1600) }; }
}

async function invoke(
  request: Request,
  env: any,
  ctx: any,
  next: CanonicalFetchR223,
  spec: ProbeSpec,
): Promise<Obj> {
  const target = new URL(request.url);
  const [pathname, query = ""] = spec.path.split("?", 2);
  target.pathname = pathname;
  target.search = query ? `?${query}` : "";
  const method = spec.method || "GET";
  const started = Date.now();
  try {
    const response = await next(new Request(target.toString(), {
      method,
      headers: { accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}) },
      body: method === "POST" ? JSON.stringify(spec.body ?? {}) : undefined,
    }), env, ctx);
    const body = await readBody(response);
    return {
      id: spec.id,
      path: `${target.pathname}${target.search}`,
      method,
      status: response.status,
      ok: response.ok && body?.ok !== false,
      body,
      elapsedMs: Date.now() - started,
    };
  } catch (error) {
    return {
      id: spec.id,
      path: `${target.pathname}${target.search}`,
      method,
      status: 0,
      ok: false,
      body: null,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
    };
  }
}

export async function mapBoundedR223<T, R>(items: readonly T[], width: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const concurrency = Math.max(1, Math.trunc(width || 1));
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker()));
  return results;
}

let coreCache: { sha: string; value: Obj } | null = null;
let coreInFlight: Promise<Obj> | null = null;

async function computeShellCore(request: Request, env: any, ctx: any, next: CanonicalFetchR223): Promise<Obj> {
  const expectedSha = text(env?.CANONICAL_GIT_SHA);
  const specs: ProbeSpec[] = [
    { id: "RELEASE_PROVENANCE", path: "/api/system/r217/release-lease" },
    { id: "ACCEPTANCE_MANIFEST", path: "/api/acceptance/r190/manifest" },
    { id: "WORKSPACE_CORE", path: "/api/workspace/r193/health" },
    { id: "COMPUTE_CORE", path: "/api/compute/manifest" },
    { id: "VALIDATION_CORE", path: "/api/validate/manifest" },
  ];
  const calls = await mapBoundedR223(specs, 1, spec => invoke(request, env, ctx, next, spec));
  const by = Object.fromEntries(calls.map(call => [call.id, call]));
  const r217 = by.RELEASE_PROVENANCE?.body || {};
  const r190 = by.ACCEPTANCE_MANIFEST?.body || {};
  const identityReady = Boolean(
    sha40(expectedSha) &&
    by.RELEASE_PROVENANCE?.ok &&
    r217?.schema === "OMEGA_RELEASE_PROVENANCE_R217" &&
    r217?.state === "DEPLOYMENT_PROVENANCE_BOUND" &&
    r217?.canonicalGitSha === expectedSha &&
    by.ACCEPTANCE_MANIFEST?.ok &&
    r190?.canonicalGitSha === expectedSha &&
    r190?.deploymentIdentityBound === true
  );
  const localCoreReady = Boolean(
    identityReady &&
    by.WORKSPACE_CORE?.ok &&
    by.COMPUTE_CORE?.ok &&
    by.VALIDATION_CORE?.ok
  );
  const core = {
    ok: localCoreReady,
    schema: CAPABILITY_ADMISSION_SCHEMA_R223,
    release: CAPABILITY_ADMISSION_RELEASE_R223,
    canonicalGitSha: expectedSha || null,
    state: localCoreReady ? "SHELL_CORE_VERIFIED" : identityReady ? "SHELL_CORE_DEGRADED" : "SHELL_IDENTITY_WITHHELD",
    identityReady,
    localCoreReady,
    shellReady: localCoreReady,
    probes: calls.map(({ body, ...call }) => ({ ...call, schema: body?.schema ?? null, release: body?.release ?? body?.revision ?? body?.build ?? null })),
    resourcePolicy: {
      batchWidth: 1,
      nestedBurstFanoutProhibited: true,
      exactDeploymentImmutableCoreMayBeShared: true,
      mutableExternalEvidenceCached: false,
    },
    truthBoundaries: {
      shellReadinessDoesNotClaimPcOnline: true,
      shellReadinessDoesNotClaimSaiGrounding: true,
      shellReadinessDoesNotClaimEarthSourceAvailability: true,
      shellReadinessDoesNotClaimNativeSolverExecution: true,
      externalOrganFailureDoesNotDisableHealthyLocalCore: true,
      exactIdentityMismatchStillFailsClosed: true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await digest(core) };
}

async function shellCore(request: Request, env: any, ctx: any, next: CanonicalFetchR223): Promise<Obj> {
  const sha = text(env?.CANONICAL_GIT_SHA);
  if (sha40(sha) && coreCache?.sha === sha) return coreCache.value;
  if (!coreInFlight) {
    coreInFlight = computeShellCore(request, env, ctx, next).then(value => {
      if (value.localCoreReady === true && value.canonicalGitSha === sha && sha40(sha)) coreCache = { sha, value };
      return value;
    }).finally(() => { coreInFlight = null; });
  }
  return coreInFlight;
}

function capability(id: string, state: string, ready: boolean, detail: Obj = {}) {
  return { id, state, ready, ...detail };
}

async function capabilityState(request: Request, env: any, ctx: any, next: CanonicalFetchR223): Promise<Obj> {
  const core = await shellCore(request, env, ctx, next);
  const specs: ProbeSpec[] = [
    { id: "HYBRID", path: "/api/hybrid/status" },
    { id: "HYBRID_AUTHORITY", path: "/api/hybrid/authority/status" },
    { id: "SAI_B059", path: "/api/sai/status" },
    { id: "EARTH", path: "/api/earth/catalog" },
    { id: "DEVELOPMENT", path: "/api/development/status" },
  ];
  const calls = await mapBoundedR223(specs, 1, spec => invoke(request, env, ctx, next, spec));
  const by = Object.fromEntries(calls.map(call => [call.id, call]));
  const hybrid = by.HYBRID?.body || {};
  const authority = by.HYBRID_AUTHORITY?.body || hybrid?.executionAuthority || {};
  const heartbeatCurrent = Boolean(hybrid?.heartbeatCurrent ?? hybrid?.heartbeat_current);
  const authenticated = Boolean(hybrid?.authenticated ?? hybrid?.agentAuthenticated ?? hybrid?.authenticated_heartbeat);
  const pcOnline = Boolean(hybrid?.pcOnline ?? hybrid?.pc_online) && heartbeatCurrent && authenticated;
  const authorityActive = Boolean(authority?.active ?? authority?.executionAuthority?.active);
  const b059 = by.SAI_B059?.body || {};
  const b059Present = Boolean(by.SAI_B059?.ok && (b059?.passed === true || b059?.state === "B059_PRESENT_VERIFICATION_REQUIRED" || b059?.ok === true));
  const earthReady = Boolean(by.EARTH?.ok);
  const development = by.DEVELOPMENT?.body || {};
  const jobs = [development?.active_job, ...(Array.isArray(development?.recent_jobs) ? development.recent_jobs : [])].filter(Boolean);
  const rcwaJob = jobs.find((row: any) => row?.kind === "cross_runtime_validate" && row?.state === "VERIFIED" && (row?.evidence?.native_result?.solver_family === "MAXWELL_RCWA" || row?.evidence?.native_result?.solver === "rcwa"));
  const selfBuildAvailable = Boolean(by.DEVELOPMENT?.ok);

  const capabilities = [
    capability("NAVIGATION", core.shellReady ? "AVAILABLE" : "WITHHELD_CORE", core.shellReady),
    capability("LOCAL_COMPUTE", core.shellReady ? "AVAILABLE" : "WITHHELD_CORE", core.shellReady),
    capability("VALIDATION", core.shellReady ? "AVAILABLE" : "WITHHELD_CORE", core.shellReady),
    capability("INTELLIGENCE", b059Present ? "SOURCE_GROUNDING_AVAILABLE" : "DEGRADED_SOURCE_GROUNDING_UNAVAILABLE", b059Present, { sourceGroundingPresent: b059Present }),
    capability("EARTH", earthReady ? "SOURCE_CATALOG_AVAILABLE" : "DEGRADED_SOURCE_CATALOG_UNAVAILABLE", earthReady),
    capability("HYBRID", pcOnline ? (authorityActive ? "CONNECTED_AUTHORITY_ACTIVE" : "CONNECTED_LOCAL_AUTHORITY_REQUIRED") : "DEVICE_PROOF_REQUIRED", pcOnline && authorityActive, { pcOnline, heartbeatCurrent, authenticated, authorityActive }),
    capability("SELF_BUILD", selfBuildAvailable ? (authorityActive ? "BOUNDED_LOCAL_BUILD_AVAILABLE" : "LOCAL_AUTHORITY_REQUIRED_FOR_NATIVE_BUILD") : "DEVELOPMENT_RUNTIME_UNAVAILABLE", selfBuildAvailable && authorityActive, { transportAvailable: selfBuildAvailable, authorityActive }),
    capability("NATIVE_RCWA", rcwaJob ? "VERIFIED_NATIVE_RECEIPT_PRESENT" : "NATIVE_RECEIPT_REQUIRED", Boolean(rcwaJob), { jobId: rcwaJob?.id ?? null }),
    capability("PROOF", core.shellReady ? "LOCAL_PROOF_AVAILABLE_EXTERNAL_EVIDENCE_SCOPED" : "WITHHELD_CORE", core.shellReady),
  ];

  const corePacket = {
    ok: core.shellReady === true,
    schema: "OMEGA_CAPABILITY_STATE_R223",
    release: CAPABILITY_ADMISSION_RELEASE_R223,
    canonicalGitSha: core.canonicalGitSha,
    shell: { ready: core.shellReady, state: core.state, identityReady: core.identityReady, localCoreReady: core.localCoreReady },
    capabilities,
    probes: calls.map(({ body, ...call }) => ({ ...call, schema: body?.schema ?? null, release: body?.release ?? body?.revision ?? body?.build ?? null })),
    policy: {
      globalKillSwitchOnlyForIdentityOrLocalCoreFailure: true,
      externalCapabilitiesAreIndependentlyScoped: true,
      degradedCapabilityRemainsVisibleForDiagnosis: true,
      serverSideAuthorityStillOwnsExecutionAdmission: true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...corePacket, receiptSha256: await digest(corePacket) };
}

const MISSION_SNAPSHOT_PROBES: readonly ProbeSpec[] = [
  { id: "RUNTIME", path: "/_omega/health" },
  { id: "STATE_CONTRACT", path: "/api/state/workbench/schema" },
  { id: "WORKSPACE", path: "/api/workspace/r193/manifest" },
  { id: "FABRIC", path: "/api/fabric/r191/manifest" },
  { id: "SAI_AI_CONTRACT", path: "/api/intelligence/r179/manifest" },
  { id: "BUILD_CONTRACT", path: "/api/swarm/build/manifest" },
];
const FULL_SNAPSHOT_EXTRA: readonly ProbeSpec[] = [
  { id: "ONE_SYSTEM", path: "/api/system/r195/status" },
  { id: "CONVERGENCE", path: "/api/convergence/edge" },
  { id: "SWARM", path: "/api/clouds/r185/manifest" },
  { id: "RECOVERY", path: "/api/system/r195/restoration?limit=1" },
  { id: "EARTH_SOURCES", path: "/api/earth/sar/r198/sources" },
];

async function boundedR199Snapshot(request: Request, env: any, ctx: any, next: CanonicalFetchR223, profile: "mission" | "full") {
  const specs = profile === "mission" ? [...MISSION_SNAPSHOT_PROBES] : [...MISSION_SNAPSHOT_PROBES, ...FULL_SNAPSHOT_EXTRA];
  const results = await mapBoundedR223(specs, profile === "mission" ? 2 : 1, spec => invoke(request, env, ctx, next, spec));
  const requiredIds = new Set(MISSION_SNAPSHOT_PROBES.map(row => row.id));
  const required = results.filter(row => requiredIds.has(row.id));
  const convergence = results.find(row => row.id === "CONVERGENCE")?.body || {};
  const pc = convergence?.topology?.sovereign_pc || {};
  const runtimeReady = required.every(row => row.ok === true);
  const core = {
    ok: runtimeReady,
    schema: "OMEGA_ONE_SYSTEM_CORRELATED_SNAPSHOT_R199",
    release: R199_RELEASE,
    closureRelease: CAPABILITY_ADMISSION_RELEASE_R223,
    generatedAt: new Date().toISOString(),
    profile,
    runtimeReady,
    pcOnline: profile === "full" ? Boolean(pc.pc_online && pc.heartbeat_current) : false,
    heartbeatCurrent: profile === "full" ? Boolean(pc.heartbeat_current) : false,
    results,
    resourcePolicy: {
      batchWidth: profile === "mission" ? 2 : 1,
      nestedBurstFanoutProhibited: true,
      r195StatusNotDuplicatedInsideMissionBaseline: profile === "mission",
      externalEvidenceExcludedFromMissionCoreReadiness: true,
    },
    truth: {
      pcOnline: profile === "full" && pc.pc_online && pc.heartbeat_current ? "PROVEN_BY_CURRENT_CONVERGENCE_PACKET" : profile === "mission" ? "NOT_PROBED_IN_FAST_MISSION_PROFILE" : "UNPROVEN",
      missionSnapshotDoesNotClaimHostState: profile === "mission",
      missionBaselineIsLocalContractReadinessNotWholeSystemAdmission: true,
      returnedIsNotVerified: true,
      canonicalMutation: false,
    },
  };
  return { ...core, receiptSha256: await digest(core) };
}

async function boundedR199OperateSnapshot(request: Request, env: any, ctx: any, next: CanonicalFetchR223, body: Obj) {
  const menuId = text(body.menuId || body.menu).toUpperCase();
  if (menuId !== "MENU-01") return null;
  if (text(body.action || "observe").toLowerCase() !== "snapshot") return null;
  const snapshot = await boundedR199Snapshot(request, env, ctx, next, "mission");
  const downstream = { status: 200, ok: snapshot.ok === true, result: snapshot, path: "/api/system/r199/snapshot?profile=mission", method: "GET", elapsedMs: 0 };
  const core = {
    schema: "OMEGA_ONE_SYSTEM_OPERATOR_RECEIPT_R199",
    release: R199_RELEASE,
    closureRelease: CAPABILITY_ADMISSION_RELEASE_R223,
    menu: { id: "MENU-01", label: "LAUNCH", observe: "/api/workspace/r193/manifest", role: "entry / workspace projection" },
    action: "snapshot",
    authority: "READ_ONLY_CORRELATED_STATE",
    downstream,
    executionState: { discovered: true, authorized: true, available: true, invoked: true, returned: true, verified: false },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await digest(core) }, snapshot.ok ? 200 : 503);
}

function layer(id: string, call: Obj | undefined, predicate: (body: Obj) => boolean, ready: string, degraded: string, evidenceClass: string) {
  const body = call?.body || {};
  const good = Boolean(call?.ok && predicate(body));
  return { id, state: good ? ready : degraded, ok: good, status: call?.status ?? 0, schema: body?.schema ?? null, release: body?.release ?? body?.revision ?? body?.build ?? null, evidenceClass, elapsedMs: call?.elapsedMs ?? null };
}

const R205_HEALTH_PROBES: readonly ProbeSpec[] = [
  { id: "R190", path: "/api/acceptance/r190/manifest" },
  { id: "AI_FUSION", path: "/api/intelligence/r179/manifest" },
  { id: "SAI_RUNTIME", path: "/api/sai/manifest" },
  { id: "B059", path: "/api/sai/status" },
  { id: "HYBRID", path: "/api/hybrid/status" },
  { id: "R201", path: "/api/mission/r201/verify" },
  { id: "R202", path: "/api/system/r202/manifest" },
  { id: "R203", path: "/api/mission/r203/manifest" },
  { id: "R204", path: "/api/system/r204/manifest" },
  { id: "SELF_BUILD", path: "/api/swarm/improvement/r184/manifest" },
  { id: "SOURCE_PATCH", path: "/api/swarm/patch/r187/manifest" },
];

async function boundedR205Health(request: Request, env: any, ctx: any, next: CanonicalFetchR223) {
  const calls = await mapBoundedR223(R205_HEALTH_PROBES, 2, spec => invoke(request, env, ctx, next, spec));
  const by = Object.fromEntries(calls.map(call => [call.id, call]));
  const hybridBody = by.HYBRID?.body || {};
  const heartbeatCurrent = Boolean(hybridBody?.heartbeatCurrent ?? hybridBody?.heartbeat_current);
  const authenticated = Boolean(hybridBody?.authenticated ?? hybridBody?.agentAuthenticated ?? hybridBody?.authenticated_heartbeat);
  const pcOnline = Boolean(hybridBody?.pcOnline ?? hybridBody?.pc_online) && heartbeatCurrent && authenticated;
  const layers: Obj[] = [
    layer("PROOF", by.R190, b => b?.ok === true && b?.deploymentIdentityBound === true, "VERIFIED", "DEGRADED", "LOCAL_CORE"),
    layer("CLOUD_AI", by.AI_FUSION, b => b?.workers_ai_binding === true, "READY", "BINDING_REQUIRED", "LOCAL_OR_PROVIDER_CONTRACT"),
    layer("SAI_MULTI_AGENT", by.SAI_RUNTIME, b => b?.operationalIntelligenceReady === true, "READY", "BINDING_REQUIRED", "LOCAL_OR_PROVIDER_CONTRACT"),
    layer("SAI_B059", by.B059, b => b?.passed === true || b?.state === "B059_PRESENT_VERIFICATION_REQUIRED" || b?.ok === true, "AVAILABLE", "BLOCKED_EXTERNAL_GROUNDING", "EXTERNAL_EVIDENCE"),
    { id: "HYBRID_PC", state: pcOnline ? "PC_ONLINE_AUTHENTICATED" : heartbeatCurrent ? "HEARTBEAT_PRESENT_AUTHENTICATION_INCOMPLETE" : "READY_AWAITING_DEVICE", ok: pcOnline, available: by.HYBRID?.ok === true, status: by.HYBRID?.status ?? 0, evidenceClass: "EXTERNAL_DEVICE_EVIDENCE", heartbeatCurrent, authenticated, pcOnline, heartbeatAgeSeconds: hybridBody?.heartbeatAgeSeconds ?? hybridBody?.heartbeat_age_seconds ?? null, elapsedMs: by.HYBRID?.elapsedMs ?? null },
    layer("R201_DURABILITY", by.R201, b => b?.verified === true, "CHAIN_VERIFIED", "CHAIN_HOLD", "DURABLE_EXECUTION_EVIDENCE"),
    layer("R202_CONTINUITY", by.R202, b => b?.ok === true, "READY", "DEGRADED", "LOCAL_CORE"),
    layer("R203_HYBRID_CONTINUITY", by.R203, b => b?.ok === true, "READY", "DEGRADED", "CONTRACT_READY"),
    layer("R204_RETURN_ADMISSION", by.R204, b => b?.schema === "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204" && b?.canonicalMutation === false, "VERIFIED_RETURN_GATE_READY", "DEGRADED", "LOCAL_CORE"),
    layer("SELF_BUILD_DISCOVERY", by.SELF_BUILD, b => b?.automaticCanonicalPromotion === false && b?.continuousShapingOnFailure === true, "BOUNDED_READY", "DEGRADED", "LOCAL_CORE"),
    layer("SELF_BUILD_PATCH", by.SOURCE_PATCH, b => b?.canonicalMutation === false, "BOUNDED_READY", "DEGRADED", "LOCAL_CORE"),
  ];
  const okOf = (id: string) => layers.find(row => row.id === id)?.ok === true;
  const localCoreReady = okOf("PROOF") && okOf("R202_CONTINUITY") && okOf("R204_RETURN_ADMISSION");
  const intelligenceCoreReady = okOf("CLOUD_AI") && okOf("SAI_MULTI_AGENT");
  const selfBuildReady = okOf("SELF_BUILD_DISCOVERY") && okOf("SELF_BUILD_PATCH");
  const continuityObserved = okOf("R201_DURABILITY") && okOf("R203_HYBRID_CONTINUITY");
  const externalGroundingReady = okOf("SAI_B059");
  const cloudCoreReady = localCoreReady && intelligenceCoreReady && selfBuildReady;
  const fullSystemReady = cloudCoreReady && continuityObserved && externalGroundingReady && pcOnline;
  const core = {
    ok: cloudCoreReady,
    schema: "OMEGA_WHOLE_SYSTEM_HEALTH_R205",
    release: R205_RELEASE,
    closureRelease: CAPABILITY_ADMISSION_RELEASE_R223,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    generatedAt: new Date().toISOString(),
    state: fullSystemReady ? "WHOLE_SYSTEM_FULLY_EVIDENCED" : cloudCoreReady ? "CLOUD_CORE_READY_CAPABILITIES_SCOPED" : "WHOLE_SYSTEM_CORE_DEGRADED",
    localCoreReady,
    cloudCoreReady,
    fullSystemReady,
    readiness: {
      localCore: localCoreReady,
      intelligenceCore: intelligenceCoreReady,
      sourceGrounding: externalGroundingReady,
      durableContinuityObserved: continuityObserved,
      selfBuild: selfBuildReady,
      hybridPc: pcOnline,
    },
    layers,
    aiSai: { cloudAiReady: okOf("CLOUD_AI"), multiAgentSaiReady: okOf("SAI_MULTI_AGENT"), b059Available: externalGroundingReady, bridgeReady: okOf("R203_HYBRID_CONTINUITY") && okOf("R204_RETURN_ADMISSION") },
    selfBuild: { state: selfBuildReady ? "BOUNDED_SELF_BUILD_READY" : "SELF_BUILD_DEGRADED", automaticGitMutation: false, automaticCanonicalPromotion: false, rule: "Discover, rank and draft bounded successors automatically; require exact evidence and separate mutation/promotion authority." },
    hybrid: { transportAvailable: by.HYBRID?.ok === true, heartbeatCurrent, authenticated, pcOnline, nativeExecutionMayBeClaimed: pcOnline, verifiedReturnAdmissionReady: okOf("R204_RETURN_ADMISSION") },
    resourcePolicy: { batchWidth: 2, nestedBurstFanoutProhibited: true, externalEvidenceExcludedFromCloudCoreReady: true },
    truthBoundaries: { cloudCoreReadyIsNotFullSystemReady: true, b059UnavailableDoesNotDisableLocalCore: true, pcOfflineDoesNotDisableLocalCore: true, r201CurrentChainEvidenceIsSeparatelyVisible: true },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await digest(core) };
}

async function boundedBridgePrepare(request: Request, env: any, ctx: any, next: CanonicalFetchR223, input: Obj) {
  const prompt = text(input.prompt || input.intent || input.objective).slice(0, 12000);
  if (!prompt) return json({ ok: false, code: "R205_BRIDGE_PROMPT_REQUIRED", canonicalMutation: false, promotionAuthorized: false }, 422);
  const depth = Math.max(1, Math.min(12, Math.trunc(Number(input.depth || 6))));
  const healthState = await boundedR205Health(request, env, ctx, next);
  const sai = await invoke(request, env, ctx, next, { id: "SAI", path: "/api/sai/infer", method: "POST", body: { prompt, depth, maxTokens: input.maxTokens } });
  const fusion = await invoke(request, env, ctx, next, { id: "FUSION", path: "/api/intelligence/r179/fuse", method: "POST", body: { prompt, use_sai: true, model: input.model } });
  const saiReceipt = text(sai.body?.receipt?.receiptSha256);
  const fusionReceipt = text(fusion.body?.receipt_sha256);
  const ready = Boolean(sai.ok && sai.body?.ok === true && /^[0-9a-f]{64}$/i.test(saiReceipt) && fusion.ok && /^[0-9a-f]{64}$/i.test(fusionReceipt));
  const core = {
    ok: ready,
    schema: R205_BRIDGE_SCHEMA,
    release: R205_RELEASE,
    closureRelease: CAPABILITY_ADMISSION_RELEASE_R223,
    createdAt: new Date().toISOString(),
    intent: prompt,
    depth,
    lineage: { saiMissionId: sai.body?.result?.missionId ?? sai.body?.missionId ?? null, saiReceiptSha256: saiReceipt || null, fusionReceiptSha256: fusionReceipt || null, b059ReceiptSha256: fusion.body?.sai_receipt_sha256 ?? null, providerModel: fusion.body?.model ?? sai.body?.result?.provider ?? null, provider: fusion.body?.provider ?? null },
    synthesis: { saiAnswer: text(sai.body?.result?.answer).slice(0, 6000) || null, fusedAnswer: text(fusion.body?.answer).slice(0, 6000) || null, successfulSpecialists: sai.body?.result?.successfulSpecialists ?? null, specialistCount: sai.body?.result?.specialistCount ?? null, saiGrounded: fusion.body?.sai_grounded === true },
    hybridReadiness: { bridgeLayerReady: healthState?.aiSai?.bridgeReady === true, verifiedReturnAdmissionReady: healthState?.hybrid?.verifiedReturnAdmissionReady === true, pcOnline: healthState?.hybrid?.pcOnline === true, executionAuthorized: false, reason: healthState?.hybrid?.pcOnline === true ? "Current host proof exists, but explicit bridge execution confirmation, explicit allow-listed host operations, and the paired bridge credential remain required." : "Bridge preparation is complete; native execution remains withheld until current authenticated host proof exists." },
    resourcePolicy: { stagedHealthSaiFusion: true, nestedBurstFanoutProhibited: true },
    authority: "SAI_AI_BRIDGE_PREPARATION_NOT_HOST_EXECUTION_NOT_CANON",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await digest(core) }, ready ? 200 : 503);
}

export async function handleCapabilityAdmissionR223(request: Request, env: any, ctx: any, next: CanonicalFetchR223): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method === "OPTIONS" && path.startsWith("/api/surface/r223/")) return new Response(null, { status: 204, headers: JSON_HEADERS });

  if (path === "/api/surface/r223/core" && request.method === "GET") return json(await shellCore(request, env, ctx, next));
  if (path === "/api/surface/r223/capability-state" && request.method === "GET") return json(await capabilityState(request, env, ctx, next));

  if (path === "/api/system/r199/snapshot" && request.method === "GET") {
    const profile = url.searchParams.get("profile") === "mission" ? "mission" : "full";
    return json(await boundedR199Snapshot(request, env, ctx, next, profile));
  }
  if (path === "/api/system/r199/operate" && request.method === "POST") {
    const clone = request.clone();
    const body = await clone.json().catch(() => ({})) as Obj;
    return boundedR199OperateSnapshot(request, env, ctx, next, body);
  }

  if (path === "/api/system/r205/health" && request.method === "GET") return json(await boundedR205Health(request, env, ctx, next));
  if (path === "/api/intelligence/r205/bridge/prepare" && request.method === "POST") {
    const body = await request.json().catch(() => ({})) as Obj;
    return boundedBridgePrepare(request, env, ctx, next, body);
  }

  return null;
}
