import { HYBRID_MISSION_LEDGER_RELEASE_R203, HYBRID_MISSION_LEDGER_SINGLETON_R203 } from "./hybridMissionLedgerR203";

export const HYBRID_MISSION_ROUTE_R203 = "r203-r201-anchored-r202-aware-hybrid-mission-continuity";

const R201_LEDGER_SINGLETON = "omega-r201-durable-mission-evidence-ledger-v1";
const CANONICAL_HYBRID_SINGLETON = "OMEGA_RUNTIME";
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

type AnyObj = Record<string, any>;
type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type Stub = { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function isSha(value: unknown): value is string {
  return /^[0-9a-f]{64}$/i.test(text(value));
}

async function sha(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function responseBody(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { ok: false, code: "NON_JSON_RESPONSE", status: response.status, bodyPreview: raw.slice(0, 800) }; }
}

function durableStub(namespace: any, singleton: string): Stub | null {
  if (!namespace || typeof namespace.idFromName !== "function" || typeof namespace.get !== "function") return null;
  return namespace.get(namespace.idFromName(singleton));
}

function r201Stub(env: any): Stub | null {
  return durableStub(env?.OMEGA_MISSION_LEDGER_R201, R201_LEDGER_SINGLETON);
}

function hybridStub(env: any): Stub | null {
  return durableStub(env?.OMEGA_RUNTIME, CANONICAL_HYBRID_SINGLETON);
}

function r203Stub(env: any): Stub | null {
  return durableStub(env?.OMEGA_HYBRID_MISSION_LEDGER_R203, HYBRID_MISSION_LEDGER_SINGLETON_R203);
}

async function stubJson(stub: Stub | null, url: string, init?: RequestInit) {
  if (!stub) return { response: null as Response | null, data: { ok: false, code: "DURABLE_BINDING_UNAVAILABLE" } };
  const response = await stub.fetch(new Request(url, init));
  return { response, data: await responseBody(response) };
}

async function invokeCanonical(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: CanonicalFetch,
  path: string,
  method: "GET" | "POST" = "GET",
  payload?: unknown,
) {
  const target = new URL(request.url);
  target.pathname = path;
  target.search = "";
  const response = await canonicalFetch(new Request(target.toString(), {
    method,
    headers: method === "POST" ? { "content-type": "application/json", accept: "application/json" } : { accept: "application/json" },
    body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
  }), env, ctx);
  return { response, data: await responseBody(response) };
}

async function r201Anchor(env: any, missionId: string, expectedReceipt: string) {
  const { response, data } = await stubJson(r201Stub(env), `https://omega-r201.internal/mission-ledger/mission/${encodeURIComponent(missionId)}`);
  const record = data?.record || null;
  const valid = Boolean(
    response?.ok &&
    record?.missionId === missionId &&
    record?.receiptIntegrityVerified === true &&
    isSha(record?.missionReceiptSha256) &&
    isSha(record?.entrySha256) &&
    record.missionReceiptSha256.toLowerCase() === expectedReceipt.toLowerCase()
  );
  return {
    valid,
    transportStatus: response?.status || 0,
    missionId,
    missionReceiptSha256: valid ? record.missionReceiptSha256.toLowerCase() : null,
    r201EntrySha256: valid ? record.entrySha256.toLowerCase() : null,
    admissionState: valid ? record?.admission?.state ?? null : null,
    code: valid ? "R201_DURABLE_MISSION_ANCHOR_VERIFIED" : (data?.code || "R201_DURABLE_MISSION_ANCHOR_REJECTED"),
  };
}

async function hybridSnapshot(env: any) {
  const { response, data } = await stubJson(hybridStub(env), "https://omega-runtime.internal/status");
  const devices = Array.isArray(data?.devices) ? data.devices : [];
  const online = devices.filter((row: any) => row?.online === true && row?.revoked !== true);
  return {
    ok: Boolean(response?.ok && data?.ok === true),
    transportStatus: response?.status || 0,
    state: text(data?.state) || null,
    paired: data?.paired === true,
    onlineCount: online.length,
    activeJobs: Number(data?.activeJobs || 0),
    nativeExecutionClaimed: data?.nativeExecutionClaimed === true,
    raw: data,
  };
}

function sanitizeHybridMission(mission: any) {
  if (!mission || typeof mission !== "object") return null;
  return {
    id: text(mission.id) || null,
    status: text(mission.status) || null,
    cycle: Number.isFinite(Number(mission.cycle)) ? Number(mission.cycle) : null,
    maxCycles: Number.isFinite(Number(mission.maxCycles)) ? Number(mission.maxCycles) : null,
    currentJobId: text(mission.currentJobId) || null,
    currentJobStatus: text(mission.currentJob?.status) || null,
    needsReview: mission.needsReview === true,
    createdAt: mission.createdAt ?? null,
    completedAt: mission.completedAt ?? null,
    heldAt: mission.heldAt ?? null,
    resultFingerprint: text(mission.lastProof?.resultFingerprint) || null,
  };
}

function continuityState(mission: any) {
  const missionStatus = text(mission?.status);
  const jobStatus = text(mission?.currentJob?.status);
  if (missionStatus === "HOLD_REPAIR_REQUIRED") return "HOLD_REPAIR_REQUIRED";
  if (missionStatus === "COMPLETE" && mission?.lastProof) return "RETURNED_HOST_PROOF_HASHED";
  if (missionStatus === "PAUSED") return "PAUSED";
  if (jobStatus === "RUNNING") return "RUNNING";
  if (jobStatus === "QUEUED" || missionStatus === "ACTIVE") return "QUEUED";
  return missionStatus || jobStatus || "HYBRID_STATE_OBSERVED";
}

async function hashedDeviceRef(deviceId: unknown) {
  const value = text(deviceId);
  return value ? sha({ deviceId: value, scope: "R203_DEVICE_REFERENCE_ONLY" }) : null;
}

async function hostProofHash(mission: any) {
  if (!mission?.lastProof || typeof mission.lastProof !== "object") return null;
  return sha({
    schema: text(mission.lastProof.schema) || null,
    receivedAt: mission.lastProof.receivedAt ?? null,
    resultFingerprint: text(mission.lastProof.resultFingerprint) || null,
    stepProofs: Array.isArray(mission.lastProof.stepProofs) ? mission.lastProof.stepProofs : [],
    outputPaths: Array.isArray(mission.lastProof.outputPaths) ? mission.lastProof.outputPaths : [],
    evaluation: mission.lastProof.evaluation ?? null,
    promotion: mission.lastProof.promotion ?? null,
  });
}

async function recordCorrelation(env: any, payload: AnyObj) {
  const stub = r203Stub(env);
  if (!stub) return { ok: false, code: "R203_LEDGER_BINDING_UNAVAILABLE", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false };
  const response = await stub.fetch(new Request("https://omega-r203.internal/r203/record", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
  return responseBody(response);
}

async function latestCorrelation(env: any, missionId: string) {
  const { response, data } = await stubJson(r203Stub(env), `https://omega-r203.internal/r203/latest?missionId=${encodeURIComponent(missionId)}`);
  return { ok: Boolean(response?.ok && data?.entry), entry: data?.entry || null };
}

async function listHybridMissions(env: any) {
  const { response, data } = await stubJson(hybridStub(env), "https://omega-runtime.internal/missions");
  return { ok: Boolean(response?.ok && data?.ok === true), missions: Array.isArray(data?.missions) ? data.missions : [], state: data?.state || null };
}

async function manifest(env: any) {
  const hybrid = await hybridSnapshot(env);
  const core = {
    ok: true,
    schema: "OMEGA_HYBRID_MISSION_CONTINUITY_MANIFEST_R203",
    release: HYBRID_MISSION_ROUTE_R203,
    ledgerRelease: HYBRID_MISSION_LEDGER_RELEASE_R203,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    purpose: "Carry an R200/R201 durable mission through the R202 continuity loop into the existing authenticated R33 Hybrid mission lifecycle while preserving separate evidence, HostState and CanonState authorities.",
    upstream: ["R200_CANONICAL_MISSION_KERNEL", "R201_DURABLE_MISSION_CHAIN", "R202_UNIFIED_CONTINUITY_POTENTIAL", "R33_CANONICAL_HYBRID_RUNTIME"],
    endpoints: [
      "/api/mission/r203/manifest",
      "/api/mission/r203/prepare-hybrid",
      "/api/mission/r203/execute-hybrid",
      "/api/mission/r203/execute-closed-loop",
      "/api/mission/r203/sync",
      "/api/mission/r203/status",
      "/api/mission/r203/history",
      "/api/mission/r203/verify",
    ],
    canonicalHybridBinding: "OMEGA_RUNTIME",
    canonicalHybridSingleton: CANONICAL_HYBRID_SINGLETON,
    r201AnchorRequired: true,
    r202ClosedLoopSupported: true,
    bridgeAuthorizationBypass: false,
    currentHeartbeatRequiredForQueue: true,
    explicitMissionConfirmationRequired: true,
    blindRetryAuthorized: false,
    failureLaw: "R33 HOLD_REPAIR_REQUIRED IS PRESERVED; R203 DOES NOT AUTO-RETRY FAILED HOST PROOF.",
    hostProofLaw: "R203 independently hashes an observed R33 host return packet. That proves retained packet integrity only; it is not physical correctness, CanonState admission or promotion authority.",
    hybridTruth: { state: hybrid.state, paired: hybrid.paired, onlineCount: hybrid.onlineCount, nativeExecutionClaimed: hybrid.nativeExecutionClaimed },
    authority: "R201_ANCHORED_R202_AWARE_HYBRID_CORRELATION_NOT_HOSTSTATE_NOT_CANONSTATE",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await sha(core) };
}

async function prepare(env: any, payload: AnyObj) {
  const missionId = text(payload.missionId);
  const receipt = text(payload.missionReceiptSha256).toLowerCase();
  if (!missionId || !isSha(receipt)) return json({ ok: false, code: "R203_R201_MISSION_ID_AND_RECEIPT_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);
  const anchor = await r201Anchor(env, missionId, receipt);
  if (!anchor.valid) return json({ ok: false, code: anchor.code, anchor, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 409);
  const hybrid = await hybridSnapshot(env);
  const ready = hybrid.ok && hybrid.paired && hybrid.onlineCount > 0;
  const evidence = await recordCorrelation(env, {
    missionId,
    r201MissionReceiptSha256: anchor.missionReceiptSha256,
    r201EntrySha256: anchor.r201EntrySha256,
    state: ready ? "R201_ANCHORED_DEVICE_PROOF_AVAILABLE" : "DEVICE_PROOF_REQUIRED",
    evidenceClass: ready ? "R203_PREPARED_CURRENT_HOST_PRESENT_NOT_AUTHORIZED_TO_QUEUE" : "R203_PREPARED_HOST_PROOF_REQUIRED",
  });
  return json({
    ok: true,
    schema: "OMEGA_HYBRID_MISSION_PREPARATION_R203",
    release: HYBRID_MISSION_ROUTE_R203,
    missionId,
    anchor,
    state: ready ? "R201_ANCHORED_DEVICE_PROOF_AVAILABLE" : "DEVICE_PROOF_REQUIRED",
    queueAuthorized: false,
    reason: ready ? "A current host heartbeat exists, but queueing still requires the caller's existing paired bridge credential and explicit mission confirmation." : "No current paired host heartbeat is proved; no native work may queue.",
    hybridTruth: { state: hybrid.state, paired: hybrid.paired, onlineCount: hybrid.onlineCount, nativeExecutionClaimed: hybrid.nativeExecutionClaimed },
    evidence,
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  });
}

async function queueHybrid(request: Request, env: any, payload: AnyObj) {
  const missionId = text(payload.missionId);
  const receipt = text(payload.missionReceiptSha256).toLowerCase();
  const bridgeSecret = text(request.headers.get("x-omega-bridge-secret"));
  if (!missionId || !isSha(receipt)) return { status: 422, data: { ok: false, code: "R203_R201_MISSION_ID_AND_RECEIPT_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };
  if (!bridgeSecret) return { status: 503, data: { ok: false, code: "DEVICE_PROOF_REQUIRED", reason: "Existing paired bridge credential is required and is never persisted by R203.", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };
  if (payload.confirmedMission !== true) return { status: 409, data: { ok: false, code: "R203_EXPLICIT_MISSION_CONFIRMATION_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };

  const anchor = await r201Anchor(env, missionId, receipt);
  if (!anchor.valid) return { status: 409, data: { ok: false, code: anchor.code, anchor, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };
  const hybrid = await hybridSnapshot(env);
  if (!hybrid.ok || !hybrid.paired || hybrid.onlineCount < 1) {
    const evidence = await recordCorrelation(env, {
      missionId,
      r201MissionReceiptSha256: anchor.missionReceiptSha256,
      r201EntrySha256: anchor.r201EntrySha256,
      state: "DEVICE_PROOF_REQUIRED",
      evidenceClass: "R203_EXECUTION_WITHHELD_NO_CURRENT_HOST_PROOF",
    });
    return { status: 503, data: { ok: false, code: "DEVICE_PROOF_REQUIRED", anchor, hybridTruth: { state: hybrid.state, paired: hybrid.paired, onlineCount: hybrid.onlineCount }, evidence, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };
  }

  const targetDeviceId = text(payload.targetDeviceId);
  if (!targetDeviceId) return { status: 422, data: { ok: false, code: "TARGET_DEVICE_ID_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };
  const target = (hybrid.raw?.devices || []).find((row: any) => row?.id === targetDeviceId && row?.online === true && row?.revoked !== true);
  if (!target) return { status: 503, data: { ok: false, code: "DEVICE_PROOF_REQUIRED", reason: "The selected paired host is not currently proving an online heartbeat.", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };

  const forward = {
    objective: text(payload.objective).slice(0, 3000),
    threadId: text(payload.threadId),
    targetDeviceId,
    allowedOps: Array.isArray(payload.allowedOps) ? payload.allowedOps : [],
    maxCycles: payload.maxCycles,
    confirmedMission: true,
    draft: payload.draft && typeof payload.draft === "object" ? payload.draft : {},
  };
  const stub = hybridStub(env);
  if (!stub) return { status: 503, data: { ok: false, code: "R203_CANONICAL_HYBRID_BINDING_UNAVAILABLE", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };
  const response = await stub.fetch(new Request("https://omega-runtime.internal/missions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-omega-bridge-secret": bridgeSecret },
    body: JSON.stringify(forward),
  }));
  const result = await responseBody(response);
  if (!response.ok || result?.ok !== true || !result?.mission) {
    const evidence = await recordCorrelation(env, {
      missionId,
      r201MissionReceiptSha256: anchor.missionReceiptSha256,
      r201EntrySha256: anchor.r201EntrySha256,
      state: result?.code || "HYBRID_QUEUE_REJECTED",
      evidenceClass: "R203_CANONICAL_R33_QUEUE_REJECTION",
    });
    return { status: response.status || 500, data: { ok: false, code: result?.code || "R203_HYBRID_QUEUE_REJECTED", transportStatus: response.status, anchor, hybrid: result, evidence, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false } };
  }

  const mission = result.mission;
  const evidence = await recordCorrelation(env, {
    missionId,
    r201MissionReceiptSha256: anchor.missionReceiptSha256,
    r201EntrySha256: anchor.r201EntrySha256,
    hybridMissionId: mission.id,
    hybridJobId: mission.currentJobId,
    state: "QUEUED",
    hybridMissionStatus: mission.status,
    hybridJobStatus: mission.currentJob?.status,
    cycle: mission.cycle,
    repairRequired: false,
    targetDeviceRefSha256: await hashedDeviceRef(targetDeviceId),
    evidenceClass: "R203_R201_ANCHORED_R33_MISSION_QUEUED",
  });
  return {
    status: 201,
    data: {
      ok: true,
      schema: "OMEGA_R201_ANCHORED_HYBRID_EXECUTION_R203",
      release: HYBRID_MISSION_ROUTE_R203,
      missionId,
      anchor,
      hybridMission: sanitizeHybridMission(mission),
      state: "QUEUED",
      bridgeCredentialPersisted: false,
      evidence,
      authority: "R33_HOST_EXECUTION_PLUS_R203_CORRELATION_NOT_CANON",
      canonicalMutation: false,
      hostStateMutation: true,
      hostStateMutationAuthority: "R33_CANONICAL_HYBRID_RUNTIME_ONLY",
      promotionAuthorized: false,
    },
  };
}

async function executeClosedLoop(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, payload: AnyObj) {
  const missionInput = payload?.missionInput && typeof payload.missionInput === "object" ? payload.missionInput : null;
  const hybrid = payload?.hybrid && typeof payload.hybrid === "object" ? payload.hybrid : null;
  if (!missionInput) return json({ ok: false, code: "R203_MISSION_INPUT_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);
  if (!hybrid || hybrid.confirmedMission !== true) return json({ ok: false, code: "R203_EXPLICIT_HYBRID_ENVELOPE_CONFIRMATION_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 409);

  const r202 = await invokeCanonical(request, env, ctx, canonicalFetch, "/api/mission/r202/execute", "POST", missionInput);
  const durable = r202.data?.durableMission || {};
  const r202Ready = Boolean(
    r202.response.ok &&
    r202.data?.ok === true &&
    durable?.durableVerified === true &&
    isSha(durable?.missionReceiptSha256) &&
    text(durable?.missionId)
  );
  if (!r202Ready) {
    return json({
      ok: false,
      schema: "OMEGA_R202_TO_R203_CLOSED_LOOP_HOLD",
      release: HYBRID_MISSION_ROUTE_R203,
      code: "R202_DURABLE_CONTINUITY_REQUIRED_BEFORE_HYBRID_EXECUTION",
      r202: { status: r202.response.status, ok: r202.data?.ok === true, receiptSha256: r202.data?.receiptSha256 ?? null, durableMission: durable },
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, 409);
  }

  const queued = await queueHybrid(request, env, {
    ...hybrid,
    missionId: durable.missionId,
    missionReceiptSha256: durable.missionReceiptSha256,
    confirmedMission: true,
    objective: text(hybrid.objective || missionInput.intent || missionInput.objective || missionInput.prompt),
  });
  const core = {
    ok: queued.data?.ok === true,
    schema: "OMEGA_R202_R203_CLOSED_LOOP_HYBRID_CONTINUITY",
    release: HYBRID_MISSION_ROUTE_R203,
    progression: [
      "R200_PLAN_AND_EXECUTE",
      "R201_RECEIPT_VERIFY_RECORD_CHAIN_VERIFY",
      "R202_RECALIBRATE_CONTINUITY_POTENTIAL",
      "R203_VERIFY_R201_ANCHOR",
      "R33_REQUIRE_PAIRED_SECRET_AND_CURRENT_HEARTBEAT",
      queued.data?.ok === true ? "R33_QUEUE_NATIVE_MISSION" : "WITHHOLD_NATIVE_MISSION",
      "R203_RECORD_SANITIZED_CORRELATION_EVIDENCE",
      "SEPARATE_HOST_RETURN_SYNC_AND_CANON_ADMISSION",
    ],
    r202: {
      status: r202.response.status,
      receiptSha256: r202.data?.receiptSha256 ?? null,
      durableMission: durable,
      recalibratedPotential: r202.data?.recalibratedPotential ?? null,
    },
    hybrid: queued.data,
    truthBoundary: queued.data?.ok === true
      ? "The native mission was queued by the existing R33 authority. Queueing is not completion; host return and subsequent evidence sync remain required."
      : "The R200/R201/R202 evidence loop is durable, but native execution was withheld because the existing R33 authority did not admit the Hybrid leg.",
    canonicalMutation: false,
    hostStateMutation: queued.data?.hostStateMutation === true,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await sha(core) }, queued.status);
}

async function sync(env: any, payload: AnyObj) {
  const missionId = text(payload.missionId);
  const receipt = text(payload.missionReceiptSha256).toLowerCase();
  if (!missionId || !isSha(receipt)) return json({ ok: false, code: "R203_R201_MISSION_ID_AND_RECEIPT_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);
  const anchor = await r201Anchor(env, missionId, receipt);
  if (!anchor.valid) return json({ ok: false, code: anchor.code, anchor, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 409);
  const current = await latestCorrelation(env, missionId);
  const hybridMissionId = text(payload.hybridMissionId || current.entry?.hybridMissionId);
  if (!hybridMissionId) return json({ ok: false, code: "R203_HYBRID_MISSION_ID_REQUIRED", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 422);
  const listed = await listHybridMissions(env);
  const mission = listed.missions.find((row: any) => row?.id === hybridMissionId) || null;
  if (!mission) return json({ ok: false, code: "R203_HYBRID_MISSION_NOT_FOUND", hybridMissionId, canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 404);

  const proofSha = await hostProofHash(mission);
  const state = continuityState(mission);
  const evidenceClass = state === "HOLD_REPAIR_REQUIRED"
    ? "R203_R33_FAILURE_HOLD_PRESERVED_NO_BLIND_RETRY"
    : proofSha
      ? "R203_HOST_RETURN_EVIDENCE_HASHED_NOT_CANON"
      : "R203_HYBRID_LIFECYCLE_OBSERVED";
  const evidence = await recordCorrelation(env, {
    missionId,
    r201MissionReceiptSha256: anchor.missionReceiptSha256,
    r201EntrySha256: anchor.r201EntrySha256,
    hybridMissionId: mission.id,
    hybridJobId: mission.currentJobId,
    state,
    hybridMissionStatus: mission.status,
    hybridJobStatus: mission.currentJob?.status,
    cycle: mission.cycle,
    repairRequired: mission.status === "HOLD_REPAIR_REQUIRED" || mission.needsReview === true,
    targetDeviceRefSha256: await hashedDeviceRef(mission.targetDeviceId),
    hostProofSha256: proofSha,
    hostResultFingerprint: text(mission.lastProof?.resultFingerprint) || null,
    evidenceClass,
  });
  return json({
    ok: true,
    schema: "OMEGA_HYBRID_MISSION_SYNC_R203",
    release: HYBRID_MISSION_ROUTE_R203,
    missionId,
    anchor,
    state,
    hybridMission: sanitizeHybridMission(mission),
    hostProofSha256: proofSha,
    hostProofIntegrityClass: proofSha ? "R203_HOST_RETURN_PACKET_SHA256_RECORDED_NOT_PHYSICAL_VERIFICATION" : "HOST_RETURN_NOT_YET_AVAILABLE",
    blindRetryQueued: false,
    evidence,
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  });
}

async function status(env: any, missionId: string) {
  if (!missionId) return json({ ok: false, code: "MISSION_ID_REQUIRED" }, 422);
  const current = await latestCorrelation(env, missionId);
  const listed = await listHybridMissions(env);
  const hybridMissionId = text(current.entry?.hybridMissionId);
  const mission = hybridMissionId ? listed.missions.find((row: any) => row?.id === hybridMissionId) : null;
  return json({
    ok: current.ok,
    schema: "OMEGA_HYBRID_MISSION_STATUS_R203",
    release: HYBRID_MISSION_ROUTE_R203,
    missionId,
    evidence: current.entry,
    hybridMission: sanitizeHybridMission(mission),
    observedHybridState: listed.state,
    correlationAuthority: "READ_ONLY_EVIDENCE_CORRELATION",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  }, current.ok ? 200 : 404);
}

export async function handleHybridMissionR203(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (!path.startsWith("/api/mission/r203")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  try {
    if (path === "/api/mission/r203/manifest" && request.method === "GET") return json(await manifest(env));
    if (path === "/api/mission/r203/prepare-hybrid" && request.method === "POST") return prepare(env, await request.json().catch(() => ({})) as AnyObj);
    if (path === "/api/mission/r203/execute-hybrid" && request.method === "POST") {
      const queued = await queueHybrid(request, env, await request.json().catch(() => ({})) as AnyObj);
      return json(queued.data, queued.status);
    }
    if (path === "/api/mission/r203/execute-closed-loop" && request.method === "POST") return executeClosedLoop(request, env, ctx, canonicalFetch, await request.json().catch(() => ({})) as AnyObj);
    if (path === "/api/mission/r203/sync" && request.method === "POST") return sync(env, await request.json().catch(() => ({})) as AnyObj);
    if (path === "/api/mission/r203/status" && request.method === "GET") return status(env, text(url.searchParams.get("missionId")));
    if (path === "/api/mission/r203/history" && request.method === "GET") {
      const stub = r203Stub(env);
      if (!stub) return json({ ok: false, code: "R203_LEDGER_BINDING_UNAVAILABLE" }, 503);
      const target = new URL("https://omega-r203.internal/r203/history");
      if (url.searchParams.get("missionId")) target.searchParams.set("missionId", text(url.searchParams.get("missionId")));
      return stub.fetch(new Request(target.toString()));
    }
    if (path === "/api/mission/r203/verify" && request.method === "GET") {
      const stub = r203Stub(env);
      return stub ? stub.fetch(new Request("https://omega-r203.internal/r203/verify")) : json({ ok: false, code: "R203_LEDGER_BINDING_UNAVAILABLE" }, 503);
    }
    return json({ ok: false, code: "R203_ROUTE_NOT_FOUND", canonicalMutation: false, hostStateMutation: false, promotionAuthorized: false }, 404);
  } catch (error) {
    return json({
      ok: false,
      code: "R203_HYBRID_CONTINUITY_FAILED",
      error: error instanceof Error ? error.message : String(error),
      canonicalMutation: false,
      hostStateMutation: false,
      promotionAuthorized: false,
    }, 500);
  }
}
