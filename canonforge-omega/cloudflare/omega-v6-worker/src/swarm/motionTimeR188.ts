import { AnyObj, SwarmEnv, clip, jsonResponse, schedule, sha } from "./swarmCoreR169";
import { CLOUD_SWARM_NODE_COUNT_R185, CLOUD_SWARM_WAVE_SIZE_R185, cloudNodeDescriptorR185 } from "./cloudSwarmR185";

export const MOTION_REVISION_R188 = "R188";
export const MOTION_SCHEMA_R188 = "OMEGA_SYNCHRONOUS_MOTION_TIME_R188";
export const MOTION_STATE_SCHEMA_R188 = "OMEGA_SYNCHRONOUS_MOTION_STATE_R188";
export const MOTION_WAVE_RECEIPT_SCHEMA_R188 = "OMEGA_MOTION_WAVE_RECEIPT_R188";
export const MOTION_PHASE_RECEIPT_SCHEMA_R188 = "OMEGA_MOTION_PHASE_RECEIPT_R188";
export const MOTION_TICK_RECEIPT_SCHEMA_R188 = "OMEGA_MOTION_TICK_RECEIPT_R188";
export const MOTION_COORDINATOR_NAME_R188 = "omega-motion-r188";
export const MOTION_WAVE_COUNT_R188 = Math.ceil(CLOUD_SWARM_NODE_COUNT_R185 / CLOUD_SWARM_WAVE_SIZE_R185);
export const MOTION_MAX_TICK_BUDGET_R188 = 12;
export const MOTION_MAX_LOGICAL_DELTA_MS_R188 = 86_400_000;

export const MOTION_PHASES_R188 = Object.freeze([
  "FRAME",
  "PARTITION",
  "TRANSFORM",
  "EXCHANGE",
  "INVARIANT_CARRY",
  "SCAR_CARRY",
  "RECONTEXTUALIZE",
  "FORECAST",
  "SYNTHESIZE",
  "EXECUTE",
  "OBSERVE",
  "PROVE",
]);

const STATE_KEY = "motion:r188:state";
const hash64 = (value: any) => /^[a-f0-9]{64}$/i.test(String(value || ""));
const boundedInt = (value: any, fallback: number, min: number, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
};

export function motionWaveOrdinalsR188(wave: number): number[] {
  const start = wave * CLOUD_SWARM_WAVE_SIZE_R185 + 1;
  if (wave < 0 || start > CLOUD_SWARM_NODE_COUNT_R185) return [];
  const end = Math.min(CLOUD_SWARM_NODE_COUNT_R185, start + CLOUD_SWARM_WAVE_SIZE_R185 - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function publicState(state: AnyObj | null): AnyObj | null {
  if (!state) return null;
  return {
    schema: state.schema,
    revision: state.revision,
    runId: state.runId,
    status: state.status,
    intent: state.intent,
    autonomous: state.autonomous,
    tickBudget: state.tickBudget,
    completedTicks: state.completedTicks,
    currentTick: state.currentTick,
    logicalTimeMs: state.logicalTimeMs,
    logicalDeltaMs: state.logicalDeltaMs,
    observedNowWallMs: state.observedNowWallMs,
    phaseIndex: state.phaseIndex,
    phase: MOTION_PHASES_R188[state.phaseIndex] || null,
    waveIndex: state.waveIndex,
    waveCount: MOTION_WAVE_COUNT_R188,
    previousBarrierSha256: state.previousBarrierSha256,
    memoryStateSha256: state.memoryStateSha256,
    lastPhaseReceipt: state.lastPhaseReceipt || null,
    lastTickReceipt: state.lastTickReceipt || null,
    lastWaveReceipt: state.lastWaveReceipt || null,
    scarLedger: Array.isArray(state.scarLedger) ? state.scarLedger.slice(-24) : [],
    nowLedger: Array.isArray(state.nowLedger) ? state.nowLedger.slice(-24) : [],
    developmentContinuation: state.developmentContinuation,
    canonicalMutation: false,
    physicalTimeAccelerationClaim: false,
  };
}

async function nodeTaskR188(n: number, state: AnyObj, env: SwarmEnv): Promise<AnyObj> {
  if (!env.OMEGA_SWARM_CELL) return { ok: false, ordinal: n, code: "OMEGA_SWARM_CELL_BINDING_UNAVAILABLE" };
  const descriptor = cloudNodeDescriptorR185(n, "https://omegav6.jeffdeweyeljefe.workers.dev");
  const binding = env.OMEGA_SWARM_CELL;
  const stub = binding.get(binding.idFromName(descriptor.durableObjectName));
  const phase = MOTION_PHASES_R188[state.phaseIndex];
  const attempt = boundedInt(state.attempt, 0, 0, 1_000_000);
  const taskId = `${state.runId}:t${state.currentTick}:p${state.phaseIndex}:w${state.waveIndex}:n${n}:a${attempt}`;
  const payload = {
    schema: "OMEGA_MOTION_NODE_TASK_R188",
    revision: MOTION_REVISION_R188,
    missionId: state.runId,
    taskId,
    cellId: descriptor.mappedSwarmCell.cellId,
    index: descriptor.mappedSwarmCell.index,
    lane: (n - 1) % 12,
    intent: clip(`${state.intent}\n\nR188 motion phase=${phase}; logicalTick=${state.currentTick}; logicalTimeMs=${state.logicalTimeMs}. Advance only this phase. Preserve invariant carry and report scar/residual evidence without inventing proof.`, 7000),
    executor: "DETERMINISTIC",
    evidence: [
      { id: "r188-barrier", type: "SEQUENCE_BARRIER", sha256: state.previousBarrierSha256, summary: `Prior barrier for tick ${state.currentTick} phase ${phase}.`, authority: "R188_SEQUENCE_RECEIPT" },
      { id: "r188-memory", type: "MEMORY_STATE", sha256: state.memoryStateSha256, summary: "Hash-linked invariant/scar carry from the preceding proven motion state.", authority: "R188_MEMORY_RECEIPT" },
    ],
    lineage: [
      `r188:${state.runId}`,
      `tick:${state.currentTick}`,
      `phase:${state.phaseIndex}:${phase}`,
      `wave:${state.waveIndex}`,
      `logical-time:${state.logicalTimeMs}`,
      `barrier:${state.previousBarrierSha256}`,
      `memory:${state.memoryStateSha256}`,
    ],
  };
  try {
    const response = await stub.fetch(new Request("https://omega-motion-node.internal/task", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));
    const data = await response.json().catch(() => null) as AnyObj | null;
    const receiptHash = String(data?.receipt?.resultSha256 || data?.receipt?.receiptSha256 || "");
    return {
      ok: response.ok && data?.ok === true,
      ordinal: n,
      nodeId: descriptor.id,
      mappedCellId: descriptor.mappedSwarmCell.cellId,
      status: response.status,
      receiptSha256: hash64(receiptHash) ? receiptHash.toLowerCase() : await sha({ ordinal: n, ok: response.ok && data?.ok === true, data }),
      deduplicated: data?.deduplicated === true,
      summary: clip(data?.result?.summary || data?.result?.truthBoundary || data?.error || data?.code, 800),
    };
  } catch (error) {
    return { ok: false, ordinal: n, nodeId: descriptor.id, status: 500, error: error instanceof Error ? error.message : String(error), receiptSha256: null };
  }
}

async function startMotion(storage: any, body: AnyObj): Promise<AnyObj> {
  const existing = await storage.get(STATE_KEY) as AnyObj | undefined;
  if (existing && ["ACTIVE", "PAUSED", "SCAR_BLOCKED"].includes(existing.status) && body.replace !== true) {
    return { ok: false, statusCode: 409, code: "R188_MOTION_ALREADY_ACTIVE", state: publicState(existing) };
  }
  const intent = clip(body.intent || body.objective || body.text, 7000);
  if (!intent) return { ok: false, statusCode: 400, code: "R188_INTENT_REQUIRED" };
  const observedNow = Date.now();
  const logicalTimeMs = Number.isFinite(Number(body.logicalStartMs)) ? Number(body.logicalStartMs) : observedNow;
  const logicalDeltaMs = boundedInt(body.logicalDeltaMs, 1000, 1, MOTION_MAX_LOGICAL_DELTA_MS_R188);
  const tickBudget = boundedInt(body.tickBudget, 1, 1, MOTION_MAX_TICK_BUDGET_R188);
  const runCore = { schema: MOTION_SCHEMA_R188, revision: MOTION_REVISION_R188, intent, logicalTimeMs, logicalDeltaMs, tickBudget, observedNow };
  const initialBarrier = await sha(runCore);
  const runId = `r188_${observedNow.toString(36)}_${initialBarrier.slice(0, 12)}`;
  const state: AnyObj = {
    schema: MOTION_STATE_SCHEMA_R188,
    revision: MOTION_REVISION_R188,
    runId,
    status: "ACTIVE",
    intent,
    autonomous: body.autonomous !== false,
    tickBudget,
    completedTicks: 0,
    currentTick: 0,
    logicalTimeMs,
    logicalDeltaMs,
    createdAtWallMs: observedNow,
    observedNowWallMs: observedNow,
    previousObservedNowWallMs: observedNow,
    phaseIndex: 0,
    waveIndex: 0,
    attempt: 0,
    previousBarrierSha256: initialBarrier,
    memoryStateSha256: await sha(`${initialBarrier}|R188_INITIAL_MEMORY|${intent}`),
    phaseWaveHashes: [],
    tickPhaseHashes: [],
    scarLedger: [],
    nowLedger: [{ wallMs: observedNow, logicalTimeMs, event: "START" }],
    lastPhaseReceipt: null,
    lastTickReceipt: null,
    lastWaveReceipt: null,
    developmentContinuation: "R188 motion tick -> R186 execution-derived measurement -> R183 superiority -> R184 design discovery -> R187 bounded patch/rollback -> validated successor -> next R188 motion run",
    canonicalMutation: false,
    physicalTimeAccelerationClaim: false,
  };
  await storage.put(STATE_KEY, state);
  if (state.autonomous) await schedule(storage, 350);
  return { ok: true, statusCode: 202, state: publicState(state) };
}

async function advanceMotion(storage: any, env: SwarmEnv, retry = false): Promise<AnyObj> {
  const state = await storage.get(STATE_KEY) as AnyObj | undefined;
  if (!state) return { ok: false, statusCode: 404, code: "R188_MOTION_NOT_STARTED" };
  if (state.status === "COMPLETE") return { ok: true, statusCode: 200, state: publicState(state), complete: true };
  if (state.status === "PAUSED") return { ok: false, statusCode: 409, code: "R188_MOTION_PAUSED", state: publicState(state) };
  if (state.status === "SCAR_BLOCKED" && !retry) return { ok: false, statusCode: 409, code: "R188_RETRY_REQUIRED_AFTER_SCAR", state: publicState(state) };
  if (state.status === "SCAR_BLOCKED" && retry) {
    state.status = "ACTIVE";
    state.attempt = boundedInt(state.attempt, 0, 0, 1_000_000) + 1;
  }
  const phase = MOTION_PHASES_R188[state.phaseIndex];
  if (!phase) return { ok: false, statusCode: 500, code: "R188_PHASE_STATE_INVALID", state: publicState(state) };
  const selected = motionWaveOrdinalsR188(state.waveIndex);
  if (!selected.length) return { ok: false, statusCode: 500, code: "R188_WAVE_STATE_INVALID", state: publicState(state) };

  const startedAt = Date.now();
  const results = await Promise.all(selected.map((n) => nodeTaskR188(n, state, env)));
  const failed = results.filter((row) => !row.ok);
  const receiptCore: AnyObj = {
    schema: MOTION_WAVE_RECEIPT_SCHEMA_R188,
    revision: MOTION_REVISION_R188,
    runId: state.runId,
    currentTick: state.currentTick,
    logicalTimeMs: state.logicalTimeMs,
    phaseIndex: state.phaseIndex,
    phase,
    waveIndex: state.waveIndex,
    requestedNodes: selected.length,
    successfulNodes: selected.length - failed.length,
    failedNodes: failed.length,
    nodeOrdinals: selected,
    nodeReceiptSha256: results.map((row) => row.receiptSha256),
    predecessorBarrierSha256: state.previousBarrierSha256,
    memoryStateSha256: state.memoryStateSha256,
    attempt: state.attempt,
    startedAtWallMs: startedAt,
    completedAtWallMs: Date.now(),
    canonicalMutation: false,
    authority: "R188_MOTION_WAVE_RECEIPT_NOT_CANON",
  };
  const waveReceipt = { ...receiptCore, receiptSha256: await sha(receiptCore) };
  state.lastWaveReceipt = waveReceipt;
  state.observedNowWallMs = receiptCore.completedAtWallMs;
  state.nowLedger = [...(Array.isArray(state.nowLedger) ? state.nowLedger : []), {
    wallMs: state.observedNowWallMs,
    previousWallMs: state.previousObservedNowWallMs,
    wallDeltaMs: state.observedNowWallMs - Number(state.previousObservedNowWallMs || state.observedNowWallMs),
    logicalTimeMs: state.logicalTimeMs,
    tick: state.currentTick,
    phase,
    wave: state.waveIndex,
  }].slice(-48);
  state.previousObservedNowWallMs = state.observedNowWallMs;

  if (failed.length) {
    state.status = "SCAR_BLOCKED";
    const scarCore = {
      tick: state.currentTick,
      phase,
      wave: state.waveIndex,
      attempt: state.attempt,
      failedNodes: failed.map((row) => row.nodeId || row.ordinal),
      failedReceiptSha256: failed.map((row) => row.receiptSha256),
      predecessorBarrierSha256: state.previousBarrierSha256,
      waveReceiptSha256: waveReceipt.receiptSha256,
      observedNowWallMs: state.observedNowWallMs,
    };
    state.scarLedger = [...(Array.isArray(state.scarLedger) ? state.scarLedger : []), { ...scarCore, scarSha256: await sha(scarCore) }].slice(-64);
    state.memoryStateSha256 = await sha(`${state.memoryStateSha256}|SCAR|${state.scarLedger[state.scarLedger.length - 1].scarSha256}`);
    await storage.put(STATE_KEY, state);
    return { ok: false, statusCode: 207, code: "R188_SCAR_BLOCKED_EXACT_SEQUENCE", failed, waveReceipt, state: publicState(state) };
  }

  state.phaseWaveHashes = [...(Array.isArray(state.phaseWaveHashes) ? state.phaseWaveHashes : []), waveReceipt.receiptSha256];
  state.attempt = 0;
  if (state.waveIndex + 1 < MOTION_WAVE_COUNT_R188) {
    state.waveIndex += 1;
    await storage.put(STATE_KEY, state);
    if (state.autonomous) await schedule(storage, 350);
    return { ok: true, statusCode: 200, advanced: "WAVE", waveReceipt, state: publicState(state) };
  }

  const phaseCore = {
    schema: MOTION_PHASE_RECEIPT_SCHEMA_R188,
    revision: MOTION_REVISION_R188,
    runId: state.runId,
    currentTick: state.currentTick,
    logicalTimeMs: state.logicalTimeMs,
    phaseIndex: state.phaseIndex,
    phase,
    waveReceiptSha256: state.phaseWaveHashes,
    predecessorBarrierSha256: state.previousBarrierSha256,
    memoryBeforeSha256: state.memoryStateSha256,
    complete172NodeBarrier: true,
    canonicalMutation: false,
    authority: "R188_MOTION_PHASE_BARRIER_NOT_CANON",
  };
  const phaseReceipt = { ...phaseCore, receiptSha256: await sha(phaseCore) };
  state.lastPhaseReceipt = phaseReceipt;
  state.previousBarrierSha256 = phaseReceipt.receiptSha256;
  state.memoryStateSha256 = await sha(`${state.memoryStateSha256}|PHASE|${phaseReceipt.receiptSha256}`);
  state.tickPhaseHashes = [...(Array.isArray(state.tickPhaseHashes) ? state.tickPhaseHashes : []), phaseReceipt.receiptSha256];
  state.phaseWaveHashes = [];
  state.waveIndex = 0;

  if (state.phaseIndex + 1 < MOTION_PHASES_R188.length) {
    state.phaseIndex += 1;
    await storage.put(STATE_KEY, state);
    if (state.autonomous) await schedule(storage, 350);
    return { ok: true, statusCode: 200, advanced: "PHASE_BARRIER", phaseReceipt, state: publicState(state) };
  }

  const tickCore = {
    schema: MOTION_TICK_RECEIPT_SCHEMA_R188,
    revision: MOTION_REVISION_R188,
    runId: state.runId,
    completedTick: state.currentTick,
    logicalTimeBeforeMs: state.logicalTimeMs,
    logicalDeltaMs: state.logicalDeltaMs,
    logicalTimeAfterMs: Number(state.logicalTimeMs) + Number(state.logicalDeltaMs),
    phaseReceiptSha256: state.tickPhaseHashes,
    finalPhaseBarrierSha256: phaseReceipt.receiptSha256,
    memoryStateSha256: state.memoryStateSha256,
    scarCount: Array.isArray(state.scarLedger) ? state.scarLedger.length : 0,
    canonicalMutation: false,
    physicalTimeAccelerationClaim: false,
    authority: "R188_LOGICAL_TIME_TICK_RECEIPT_NOT_CANON",
  };
  const tickReceipt = { ...tickCore, receiptSha256: await sha(tickCore) };
  state.lastTickReceipt = tickReceipt;
  state.completedTicks += 1;
  state.currentTick += 1;
  state.logicalTimeMs = tickCore.logicalTimeAfterMs;
  state.previousBarrierSha256 = tickReceipt.receiptSha256;
  state.memoryStateSha256 = await sha(`${state.memoryStateSha256}|TICK|${tickReceipt.receiptSha256}`);
  state.tickPhaseHashes = [];
  state.phaseIndex = 0;
  state.waveIndex = 0;
  state.status = state.completedTicks >= state.tickBudget ? "COMPLETE" : "ACTIVE";
  await storage.put(STATE_KEY, state);
  if (state.status === "ACTIVE" && state.autonomous) await schedule(storage, 350);
  return { ok: true, statusCode: 200, advanced: "LOGICAL_TICK", tickReceipt, state: publicState(state) };
}

async function setMotionStatus(storage: any, next: "PAUSED" | "ACTIVE"): Promise<AnyObj> {
  const state = await storage.get(STATE_KEY) as AnyObj | undefined;
  if (!state) return { ok: false, statusCode: 404, code: "R188_MOTION_NOT_STARTED" };
  if (state.status === "COMPLETE") return { ok: false, statusCode: 409, code: "R188_MOTION_ALREADY_COMPLETE", state: publicState(state) };
  if (next === "ACTIVE" && state.status === "SCAR_BLOCKED") return { ok: false, statusCode: 409, code: "R188_SCAR_REQUIRES_EXPLICIT_RETRY", state: publicState(state) };
  state.status = next;
  await storage.put(STATE_KEY, state);
  if (next === "ACTIVE" && state.autonomous) await schedule(storage, 350);
  return { ok: true, statusCode: 200, state: publicState(state) };
}

export async function advanceScheduledMotionR188(storage: any, env: SwarmEnv): Promise<boolean> {
  const state = await storage.get(STATE_KEY) as AnyObj | undefined;
  if (!state || state.status !== "ACTIVE" || state.autonomous !== true) return false;
  await advanceMotion(storage, env, false);
  return true;
}

export async function handleMotionCoordinatorR188(request: Request, storage: any, env: SwarmEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/motion/r188/state") {
    const state = await storage.get(STATE_KEY) as AnyObj | undefined;
    return jsonResponse({ ok: Boolean(state), schema: MOTION_SCHEMA_R188, revision: MOTION_REVISION_R188, state: publicState(state || null), canonicalMutation: false }, state ? 200 : 404);
  }
  if (request.method === "POST" && url.pathname === "/motion/r188/start") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    const result = await startMotion(storage, body);
    return jsonResponse(result, result.statusCode || 200);
  }
  if (request.method === "POST" && url.pathname === "/motion/r188/advance") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    const result = await advanceMotion(storage, env, body.retry === true);
    return jsonResponse(result, result.statusCode || 200);
  }
  if (request.method === "POST" && url.pathname === "/motion/r188/pause") return jsonResponse(await setMotionStatus(storage, "PAUSED"));
  if (request.method === "POST" && url.pathname === "/motion/r188/resume") return jsonResponse(await setMotionStatus(storage, "ACTIVE"));
  return jsonResponse({ ok: false, code: "R188_COORDINATOR_ROUTE_NOT_FOUND", revision: MOTION_REVISION_R188 }, 404);
}

async function coordinatorCall(request: Request, env: SwarmEnv, internalPath: string): Promise<Response> {
  if (!env.OMEGA_SWARM_COORDINATOR) return jsonResponse({ ok: false, code: "OMEGA_SWARM_COORDINATOR_BINDING_UNAVAILABLE", revision: MOTION_REVISION_R188 }, 503);
  const binding = env.OMEGA_SWARM_COORDINATOR;
  const stub = binding.get(binding.idFromName(MOTION_COORDINATOR_NAME_R188));
  const url = new URL(request.url);
  url.pathname = internalPath;
  return stub.fetch(new Request(url.toString(), { method: request.method, headers: request.headers, body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body }));
}

export async function handleMotionTimeR188(request: Request, env: SwarmEnv): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/swarm/motion/r188/manifest") return jsonResponse({
    ok: true,
    schema: MOTION_SCHEMA_R188,
    revision: MOTION_REVISION_R188,
    cloudNodes: CLOUD_SWARM_NODE_COUNT_R185,
    boundedWaveSize: CLOUD_SWARM_WAVE_SIZE_R185,
    wavesPerPhase: MOTION_WAVE_COUNT_R188,
    motionPhases: MOTION_PHASES_R188,
    phasesPerLogicalTick: MOTION_PHASES_R188.length,
    nodeExecutionsPerLogicalTick: CLOUD_SWARM_NODE_COUNT_R185 * MOTION_PHASES_R188.length,
    sequencing: "all 172 nodes complete the current motion phase barrier before any node enters the next phase; bounded waves are transport scheduling only and do not change the logical superstep",
    memory: "each phase and tick hash-links predecessor barrier, invariant/scar memory state and observed wall-clock now ledger",
    rapidComputationalTime: "logicalTimeMs may advance by a bounded logicalDeltaMs after each fully proven 12-phase tick; this is computational/model time, never a claim that physical time accelerates",
    autonomous: "the existing OmegaSwarmCoordinator Durable Object alarm advances one bounded wave at a time until tickBudget completes or a scar blocks exact sequencing",
    scarLaw: "any failed node blocks the sequence at the exact phase/wave; memory carries the scar and advancement resumes only through explicit retry",
    developmentContinuation: "R188 -> R186 measured evidence -> R183 superiority -> R184 design discovery -> R187 bounded source patch/rollback -> validated successor -> next R188 run",
    limits: { maxTickBudget: MOTION_MAX_TICK_BUDGET_R188, maxLogicalDeltaMs: MOTION_MAX_LOGICAL_DELTA_MS_R188 },
    canonicalMutation: false,
    physicalTimeAccelerationClaim: false,
  });
  const suffix = path.replace("/api/swarm/motion/r188", "");
  const routes = new Set(["/state", "/start", "/advance", "/pause", "/resume"]);
  if (!routes.has(suffix)) return jsonResponse({ ok: false, code: "R188_ROUTE_NOT_FOUND", revision: MOTION_REVISION_R188 }, 404);
  return coordinatorCall(request, env, `/motion/r188${suffix}`);
}
