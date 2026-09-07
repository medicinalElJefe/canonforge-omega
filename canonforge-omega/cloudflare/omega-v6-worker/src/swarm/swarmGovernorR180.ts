import { AnyObj, SWARM_CELL_COUNT, jsonResponse } from "./swarmCoreR169";

export const SWARM_GOVERNOR_REVISION_R180 = "R180";
export const SWARM_GOVERNOR_SCHEMA_R180 = "OMEGA_SWARM_LOAD_GOVERNOR_R180";
export const SWARM_GOVERNOR_RECEIPT_R180 = "OMEGA_SWARM_GOVERNOR_RECEIPT_R180";
export const SWARM_CONTINUITY_REVISION_R182 = "R182";

export type SwarmPriorityR180 = "INTERACTIVE" | "VALIDATION" | "DEVELOPMENT" | "BACKGROUND";
export type SwarmPressureR180 = "CALM" | "BUSY" | "SATURATED";

const STAGES = Object.freeze([12, 36, 144, 288, 576, 1728]);
const PRIORITIES = new Set<SwarmPriorityR180>(["INTERACTIVE", "VALIDATION", "DEVELOPMENT", "BACKGROUND"]);

// R182 continuity law: pressure contracts work before it stops work. The saturated
// BACKGROUND floor is deliberately deterministic/provider-free so interactive work
// retains priority while self-development still advances through a tiny proof pulse.
const LIMITS: Record<SwarmPriorityR180, Record<SwarmPressureR180, { cells: number; provider: number; concurrency: number }>> = {
  INTERACTIVE: {
    CALM: { cells: 288, provider: 8, concurrency: 8 },
    BUSY: { cells: 144, provider: 6, concurrency: 6 },
    SATURATED: { cells: 48, provider: 3, concurrency: 3 },
  },
  VALIDATION: {
    CALM: { cells: 288, provider: 6, concurrency: 6 },
    BUSY: { cells: 144, provider: 4, concurrency: 4 },
    SATURATED: { cells: 24, provider: 2, concurrency: 2 },
  },
  DEVELOPMENT: {
    CALM: { cells: 144, provider: 5, concurrency: 5 },
    BUSY: { cells: 72, provider: 3, concurrency: 3 },
    SATURATED: { cells: 12, provider: 1, concurrency: 1 },
  },
  BACKGROUND: {
    CALM: { cells: 72, provider: 2, concurrency: 3 },
    BUSY: { cells: 24, provider: 1, concurrency: 1 },
    SATURATED: { cells: 12, provider: 0, concurrency: 1 },
  },
};

function n(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n(value, fallback))));
}
function missionRows(status: AnyObj): AnyObj[] {
  if (Array.isArray(status?.missions)) return status.missions;
  if (Array.isArray(status?.recent)) return status.recent;
  if (Array.isArray(status?.recentMissions)) return status.recentMissions;
  return [];
}
function statusCounts(status: AnyObj): { active: number; queued: number; running: number; failures: number } {
  const rows = missionRows(status);
  let queued = 0, running = 0, failures = 0;
  for (const row of rows) {
    const state = String(row?.status || row?.state || "").toUpperCase();
    if (state === "QUEUED") queued++;
    if (state === "RUNNING") running++;
    if (["FAILED", "TIMED_OUT", "ERROR"].includes(state)) failures++;
  }
  const active = Math.max(queued + running, clampInt(status?.activeMissionCount ?? status?.active ?? 0, 0, 64, 0));
  return { active, queued, running, failures };
}

function priorPressure(status: AnyObj): SwarmPressureR180 | null {
  const raw = String(status?.governorPressure ?? status?.previousGovernorPressure ?? status?.previousPressure ?? "").toUpperCase();
  return raw === "CALM" || raw === "BUSY" || raw === "SATURATED" ? raw : null;
}

export function inferSwarmPressureR180(status: AnyObj = {}): { pressure: SwarmPressureR180; counts: AnyObj; reason: string; hysteresisApplied: boolean; priorPressure: SwarmPressureR180 | null } {
  const counts = statusCounts(status);
  const backlog = Math.max(counts.queued, clampInt(status?.queueDepth ?? status?.backlog ?? 0, 0, 10000, 0));
  const failureRatio = Math.max(0, Math.min(1, n(status?.failureRatio, counts.failures && missionRows(status).length ? counts.failures / missionRows(status).length : 0)));
  const latencyMs = Math.max(0, n(status?.latencyMs ?? status?.p95LatencyMs, 0));
  const prior = priorPressure(status);
  const metrics = { ...counts, backlog, failureRatio, latencyMs };

  // Escalation thresholds respond quickly. Release thresholds are deliberately
  // lower, which gives the controller hysteresis and prevents CALM/BUSY/SATURATED
  // oscillation under noisy load.
  let pressure: SwarmPressureR180;
  let reason: string;
  if (counts.active >= 8 || backlog >= 12 || failureRatio >= 0.35 || latencyMs >= 45000) {
    pressure = "SATURATED";
    reason = "active/backlog/failure/latency circuit breaker";
  } else if (counts.active >= 3 || backlog >= 4 || failureRatio >= 0.15 || latencyMs >= 15000) {
    pressure = "BUSY";
    reason = "interactive reserve protection";
  } else {
    pressure = "CALM";
    reason = "capacity available";
  }

  let hysteresisApplied = false;
  if (prior === "SATURATED" && pressure !== "SATURATED") {
    const releaseSafe = counts.active <= 4 && backlog <= 6 && failureRatio < 0.20 && latencyMs < 25000;
    if (!releaseSafe) {
      pressure = "SATURATED";
      reason = "scar-carry hysteresis retained saturated state until recovery margin";
      hysteresisApplied = true;
    }
  } else if (prior === "BUSY" && pressure === "CALM") {
    const releaseSafe = counts.active <= 1 && backlog <= 1 && failureRatio < 0.08 && latencyMs < 8000;
    if (!releaseSafe) {
      pressure = "BUSY";
      reason = "scar-carry hysteresis retained busy state until calm margin";
      hysteresisApplied = true;
    }
  }

  return { pressure, counts: metrics, reason, hysteresisApplied, priorPressure: prior };
}

function normalizePriority(input: AnyObj): SwarmPriorityR180 {
  const explicit = String(input?.priority || "").toUpperCase() as SwarmPriorityR180;
  if (PRIORITIES.has(explicit)) return explicit;
  const projection = String(input?.projection || "").toUpperCase();
  if (projection === "BUILD" || /build|repair|develop|code|deploy|repository/i.test(String(input?.intent || input?.text || ""))) return "DEVELOPMENT";
  if (projection === "PROOF" || /proof|verify|validation|audit|test/i.test(String(input?.intent || input?.text || ""))) return "VALIDATION";
  return "INTERACTIVE";
}

function nearestStage(limit: number): number {
  let stage = 0;
  for (const candidate of STAGES) if (candidate <= limit) stage = candidate;
  return stage;
}

export function governAutonomicMissionR180(input: AnyObj = {}, status: AnyObj = {}): AnyObj {
  const priority = normalizePriority(input);
  const pressureState = inferSwarmPressureR180(status);
  const base = LIMITS[priority][pressureState.pressure];
  const requestedMode = String(input?.mode || "AUTO").toUpperCase();
  const requestedCells = input?.requestedCells == null ? base.cells : clampInt(input.requestedCells, 1, SWARM_CELL_COUNT, base.cells || 1);
  const fullRequested = requestedMode === "FULL" || requestedCells > 576 || input?.allowFullAuto === true;
  const expansionVerified = input?.expansionProof?.previousStageVerified === true;
  const operatorAuthorizedFull = input?.operatorAuthorizedFull === true;
  const fullAdmitted = fullRequested && pressureState.pressure === "CALM" && priority !== "BACKGROUND" && expansionVerified && operatorAuthorizedFull;
  const hardCellCap = fullAdmitted ? SWARM_CELL_COUNT : base.cells;
  const admitted = hardCellCap > 0;
  const effectiveCells = admitted ? Math.max(1, Math.min(requestedCells, hardCellCap)) : 0;
  const effectiveProvider = admitted ? Math.min(clampInt(input?.providerBudget, 0, 12, base.provider), base.provider) : 0;
  const effectiveConcurrency = admitted ? Math.min(clampInt(input?.branchConcurrency, 1, 12, base.concurrency || 1), base.concurrency || 1) : 0;
  const stageCeiling = nearestStage(effectiveCells);
  const continuityFloorActive = priority === "BACKGROUND" && pressureState.pressure === "SATURATED";
  const rewritten = {
    ...input,
    priority,
    requestedCells: effectiveCells || 1,
    providerBudget: effectiveProvider,
    branchConcurrency: effectiveConcurrency || 1,
    allowFullAuto: fullAdmitted,
    operatorAuthorizedFull: fullAdmitted,
    governorRevision: SWARM_GOVERNOR_REVISION_R180,
    continuityRevision: SWARM_CONTINUITY_REVISION_R182,
    governorPressure: pressureState.pressure,
    continuityFloorActive,
  };
  const receipt = {
    schema: SWARM_GOVERNOR_RECEIPT_R180,
    revision: SWARM_GOVERNOR_REVISION_R180,
    continuityRevision: SWARM_CONTINUITY_REVISION_R182,
    admitted,
    priority,
    pressure: pressureState.pressure,
    pressureReason: pressureState.reason,
    counts: pressureState.counts,
    scarCarry: {
      priorPressure: pressureState.priorPressure,
      recentFailures: pressureState.counts.failures,
      failureRatio: pressureState.counts.failureRatio,
      hysteresisApplied: pressureState.hysteresisApplied,
    },
    requested: { cells: requestedCells, providerBudget: input?.providerBudget ?? null, branchConcurrency: input?.branchConcurrency ?? null, fullRequested },
    admittedLimits: { cells: effectiveCells, providerBudget: effectiveProvider, branchConcurrency: effectiveConcurrency, stageCeiling },
    continuityFloor: { active: continuityFloorActive, cells: continuityFloorActive ? 12 : null, providerBudget: continuityFloorActive ? 0 : null, branchConcurrency: continuityFloorActive ? 1 : null },
    interactiveReserveProtected: priority === "DEVELOPMENT" || priority === "BACKGROUND" || pressureState.pressure !== "CALM",
    fullExpansionAdmitted: fullAdmitted,
    expansionRequirements: { previousStageVerified: expansionVerified, operatorAuthorizedFull, pressureMustBeCalm: true },
    canonicalMutation: false,
    promotionAuthorized: false,
    authority: "LOAD_ADMISSION_RECEIPT_NOT_CANON",
  };
  return { admitted, rewritten, receipt };
}

export function swarmGovernorManifestR180(): Response {
  return jsonResponse({
    ok: true,
    schema: SWARM_GOVERNOR_SCHEMA_R180,
    revision: SWARM_GOVERNOR_REVISION_R180,
    continuityRevision: SWARM_CONTINUITY_REVISION_R182,
    stages: [...STAGES],
    priorityLimits: LIMITS,
    policy: {
      backgroundPausesWhenSaturated: false,
      backgroundContinuityFloorWhenSaturated: true,
      backgroundContinuityFloorCells: 12,
      backgroundContinuityFloorProviderBudget: 0,
      hysteresisUsesPriorPressureWhenProvided: true,
      scarCarryRecorded: true,
      developmentIsClampedBeforeInteractiveWork: true,
      full1728Requires: ["CALM_PRESSURE", "PREVIOUS_STAGE_VERIFIED", "OPERATOR_AUTHORIZED_FULL"],
      automaticSelfDevelopmentDefaultCeiling: 144,
      providerCallsRemainBounded: true,
      branchConcurrencyRemainsBounded: true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
    boundary: "R182 preserves forward continuity by contracting background work to a 12-cell provider-free proof pulse under saturation. Interactive capacity remains protected; expansion is hysteretic and proof-gated; the governor cannot promote a build, mutate Canon, convert model output into authority, or claim successful work without downstream execution receipts.",
  });
}
