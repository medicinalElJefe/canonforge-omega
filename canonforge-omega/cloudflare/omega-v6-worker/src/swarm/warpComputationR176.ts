import {
  AnyObj,
  DurableBinding,
  SwarmEnv,
  SWARM_CELL_COUNT,
  SWARM_LANE_COUNT,
  SWARM_REGULATION_ROLES,
  clip,
  jsonResponse,
  merkle,
  num,
  sha,
  stableSeed,
} from "./swarmCoreR169";

export const WARP_REVISION_R176 = "R176";
export const WARP_SCHEMA_R176 = "OMEGA_WARP_COMPUTATION_R176";
export const WARP_RECEIPT_SCHEMA_R176 = "OMEGA_WARP_EXECUTION_RECEIPT_R176";
export const WARP_AUTHORITY_R176 = "WARP_EXECUTION_RECEIPT_NOT_CANON";
export const WARP_TRUTH_BOUNDARY_R176 =
  "R176 'warp computation' is a software scheduling/orchestration term: it shards bounded work across existing independently addressable OMEGA Durable Object cells and service-bound organs. It is not a faster-than-light, physical-dimension, infinite-compute, or performance-guarantee claim. 12/144/1728/20736 remain software address/execution-resolution levels. Every returned contribution remains candidate/receipt state until separately admitted by canonical OMEGA authority.";

const PROFILE = Object.freeze({
  PULSE: { cells: 12, shards: 1, mode: "PIPELINE" },
  FLOCK: { cells: 24, shards: 1, mode: "FLOCK" },
  ORGAN: { cells: 144, shards: 1, mode: "FLOCK" },
  WARP: { cells: 576, shards: 4, mode: "FLOCK" },
  FULL: { cells: 1728, shards: 12, mode: "FLOCK" },
});

type WarpProfile = keyof typeof PROFILE;
type WarpRef = {
  coordinator: string;
  missionId: string;
  residue: number | null;
  regulationRole: string | null;
  expectedCells: number;
  seedLabel: string | null;
};

function profileOf(value: any): WarpProfile {
  const key = String(value || "WARP").toUpperCase() as WarpProfile;
  return Object.prototype.hasOwnProperty.call(PROFILE, key) ? key : "WARP";
}

function purposeOf(value: any): string {
  const p = String(value || "BUILD").toUpperCase();
  return ["BUILD", "SCIENCE", "RECOVERY", "GENERAL"].includes(p) ? p : "GENERAL";
}

function preferredResidues(purpose: string): number[] {
  if (purpose === "BUILD") return [0, 1, 10, 11, 7, 5, 2, 4, 6, 9, 8, 3];
  if (purpose === "SCIENCE") return [2, 5, 6, 10, 0, 7, 3, 4, 11, 9, 8, 1];
  if (purpose === "RECOVERY") return [11, 10, 1, 7, 2, 5, 0, 9, 8, 4, 3, 6];
  return [2, 5, 0, 10, 7, 11, 6, 1, 4, 3, 9, 8];
}

function rotatedResidues(intent: string, purpose: string, count: number): number[] {
  if (count >= 12) return Array.from({ length: 12 }, (_, i) => i);
  const preferred = preferredResidues(purpose);
  const shift = stableSeed(`${intent}|${purpose}|R176`) % preferred.length;
  const rotated = [...preferred.slice(shift), ...preferred.slice(0, shift)];
  return rotated.slice(0, count);
}

function seedLabelForResidue(intent: string, residue: number): string {
  for (let i = 0; i < 4096; i++) {
    const label = `r176-residue-${residue}-${i}`;
    if (stableSeed(`${intent}|${label}`) % 12 === residue) return label;
  }
  throw new Error(`WARP_SEED_SEARCH_FAILED_${residue}`);
}

function coordinator(binding: DurableBinding | undefined, name: string) {
  if (!binding) return null;
  return binding.get(binding.idFromName(name));
}

async function readJson(response: Response): Promise<AnyObj> {
  return await response.json().catch(() => ({ ok: false, code: "NON_JSON_SWARM_RESPONSE", status: response.status })) as AnyObj;
}

async function createChildMission(
  env: SwarmEnv,
  intent: string,
  purpose: string,
  evidence: any[],
  computation: AnyObj | null,
  profile: WarpProfile,
  residue: number | null,
  providerBudget: number,
): Promise<AnyObj> {
  const binding = env.OMEGA_SWARM_COORDINATOR;
  if (!binding) return { ok: false, code: "SWARM_COORDINATOR_BINDING_UNAVAILABLE" };
  const single = PROFILE[profile];
  const seedLabel = residue === null ? `r176-${profile.toLowerCase()}-${stableSeed(intent)}` : seedLabelForResidue(intent, residue);
  const name = residue === null ? `omega-warp-r176-${profile.toLowerCase()}` : `omega-warp-r176-residue-${String(residue).padStart(2, "0")}`;
  const stub = coordinator(binding, name);
  if (!stub) return { ok: false, code: "SWARM_COORDINATOR_BINDING_UNAVAILABLE" };
  const requestedCells = residue === null ? single.cells : 144;
  const body: AnyObj = {
    intent,
    mode: single.mode,
    requestedCells,
    providerBudget,
    seed: seedLabel,
    evidence,
    warp: {
      schema: WARP_SCHEMA_R176,
      revision: WARP_REVISION_R176,
      purpose,
      profile,
      residue,
      regulationRole: residue === null ? null : SWARM_REGULATION_ROLES[residue],
      authority: WARP_AUTHORITY_R176,
      canonicalMutation: false,
    },
  };
  if (computation) body.computation = computation;
  const response = await stub.fetch(new Request("https://warp-coordinator.internal/missions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  const data = await readJson(response);
  const missionId = String(data?.mission?.id || "");
  if (!response.ok || !data?.ok || !missionId) return { ok: false, status: response.status, coordinator: name, residue, seedLabel, data };
  const ref: WarpRef = {
    coordinator: name,
    missionId,
    residue,
    regulationRole: residue === null ? null : SWARM_REGULATION_ROLES[residue],
    expectedCells: requestedCells,
    seedLabel,
  };
  return { ok: true, ref, mission: data.mission, plan: data.plan };
}

function validateRefs(value: any): WarpRef[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) throw new Error("WARP_REFS_REQUIRED");
  return value.map((raw: AnyObj) => {
    const coordinatorName = clip(raw?.coordinator, 180);
    const missionId = clip(raw?.missionId, 220);
    const residue = raw?.residue === null || raw?.residue === undefined ? null : Number(raw.residue);
    if (!/^omega-warp-r176-[a-z0-9-]+$/i.test(coordinatorName)) throw new Error("INVALID_WARP_COORDINATOR_REF");
    if (!/^swarm_[A-Za-z0-9_-]+$/.test(missionId)) throw new Error("INVALID_WARP_MISSION_REF");
    if (residue !== null && (!Number.isInteger(residue) || residue < 0 || residue > 11)) throw new Error("INVALID_WARP_RESIDUE");
    return {
      coordinator: coordinatorName,
      missionId,
      residue,
      regulationRole: residue === null ? null : SWARM_REGULATION_ROLES[residue],
      expectedCells: Math.max(1, Math.min(144, Math.trunc(Number(raw.expectedCells) || (residue === null ? 24 : 144)))),
      seedLabel: raw.seedLabel ? clip(raw.seedLabel, 120) : null,
    };
  });
}

async function fetchChild(env: SwarmEnv, ref: WarpRef, tick = false): Promise<AnyObj> {
  const stub = coordinator(env.OMEGA_SWARM_COORDINATOR, ref.coordinator);
  if (!stub) return { ok: false, ref, status: 503, mission: null, code: "SWARM_COORDINATOR_BINDING_UNAVAILABLE" };
  const path = `/missions/${encodeURIComponent(ref.missionId)}${tick ? "/tick" : ""}`;
  try {
    const response = await stub.fetch(new Request(`https://warp-coordinator.internal${path}`, { method: tick ? "POST" : "GET" }));
    const data = await readJson(response);
    return { ok: response.ok && data?.ok === true, ref, status: response.status, mission: data?.mission || null, data };
  } catch (error) {
    return { ok: false, ref, status: 500, mission: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function aggregate(warpId: string, profile: WarpProfile, purpose: string, rows: AnyObj[]): Promise<AnyObj> {
  const missions = rows.map(row => ({ ...row.ref, transportOk: row.ok, transportStatus: row.status, mission: row.mission }));
  const total = missions.reduce((sum, row) => sum + num(row.mission?.total, row.expectedCells), 0);
  const completed = missions.reduce((sum, row) => sum + num(row.mission?.completed), 0);
  const failed = missions.reduce((sum, row) => sum + num(row.mission?.failed), 0);
  const terminal = missions.length > 0 && missions.every(row => ["COMPLETE", "FAILED"].includes(String(row.mission?.status || "")));
  const successful = missions.length > 0 && missions.every(row => row.mission?.status === "COMPLETE");
  const active = missions.filter(row => ["QUEUED", "RUNNING"].includes(String(row.mission?.status || ""))).length;
  const childHashes = await Promise.all(missions.map(row => sha({
    coordinator: row.coordinator,
    missionId: row.missionId,
    residue: row.residue,
    status: row.mission?.status || "UNAVAILABLE",
    total: row.mission?.total ?? null,
    completed: row.mission?.completed ?? null,
    failed: row.mission?.failed ?? null,
    proofState: row.mission?.proofState ?? null,
    finalSynthesis: row.mission?.finalSynthesis ?? null,
  })));
  const resultMerkleRoot = await merkle(childHashes);
  const receiptCore = terminal ? {
    schema: WARP_RECEIPT_SCHEMA_R176,
    revision: WARP_REVISION_R176,
    warpId,
    profile,
    purpose,
    status: successful ? "COMPLETE" : "COMPLETE_WITH_FAILURES",
    shardCount: missions.length,
    totalCells: total,
    completedCells: completed,
    failedCells: failed,
    childMissionHashes: childHashes,
    resultMerkleRoot,
    proofState: "RETURNED_NOT_ADMITTED",
    authority: WARP_AUTHORITY_R176,
    canonicalMutation: false,
    nativeExecutionClaim: false,
    performanceGuaranteeClaim: false,
    physicalDimensionClaim: false,
    truthBoundary: WARP_TRUTH_BOUNDARY_R176,
  } : null;
  return {
    ok: rows.every(row => row.ok),
    schema: "OMEGA_WARP_STATUS_R176",
    revision: WARP_REVISION_R176,
    warpId,
    profile,
    purpose,
    state: terminal ? (successful ? "COMPLETE" : "COMPLETE_WITH_FAILURES") : active ? "RUNNING" : "QUEUED_OR_UNAVAILABLE",
    totalCells: total,
    completedCells: completed,
    failedCells: failed,
    activeShards: active,
    shardCount: missions.length,
    progress: total ? Math.round(((completed + failed) / total) * 1000) / 10 : 0,
    resultMerkleRoot,
    shards: missions,
    receipt: receiptCore ? { ...receiptCore, receiptSha256: await sha(receiptCore) } : null,
    canonicalMutation: false,
    truthBoundary: WARP_TRUTH_BOUNDARY_R176,
  };
}

async function launch(request: Request, env: SwarmEnv): Promise<Response> {
  if (!env.OMEGA_SWARM_COORDINATOR) return jsonResponse({ ok: false, code: "SWARM_COORDINATOR_BINDING_UNAVAILABLE", canonicalMutation: false }, 503);
  const body = await request.json().catch(() => ({})) as AnyObj;
  const intent = clip(body.intent || body.text, 7000);
  if (!intent) return jsonResponse({ ok: false, code: "INTENT_REQUIRED", canonicalMutation: false }, 400);
  const profile = profileOf(body.profile);
  const purpose = purposeOf(body.purpose);
  const spec = PROFILE[profile];
  const evidence = Array.isArray(body.evidence) ? body.evidence.slice(0, 16) : [];
  const computation = body.computation && typeof body.computation === "object" ? body.computation : null;
  const requestedProviderBudget = Math.max(0, Math.min(12, Math.trunc(Number(body.providerBudget) || 0)));
  const warpId = `warp_${Date.now().toString(36)}_${(await sha(`${intent}|${profile}|${purpose}|${Date.now()}`)).slice(0, 14)}`;

  let children: AnyObj[];
  if (profile === "PULSE" || profile === "FLOCK") {
    children = [await createChildMission(env, intent, purpose, evidence, computation, profile, null, requestedProviderBudget)];
  } else {
    const residues = rotatedResidues(intent, purpose, spec.shards);
    const base = Math.floor(requestedProviderBudget / residues.length);
    let remainder = requestedProviderBudget % residues.length;
    children = await Promise.all(residues.map(async residue => {
      const budget = base + (remainder-- > 0 ? 1 : 0);
      return createChildMission(env, intent, purpose, evidence, computation, profile, residue, budget);
    }));
  }
  const failures = children.filter(x => !x.ok);
  const refs = children.filter(x => x.ok).map(x => x.ref as WarpRef);
  if (failures.length || !refs.length) return jsonResponse({
    ok: false,
    code: "WARP_LAUNCH_PARTIAL_OR_FAILED",
    warpId,
    profile,
    purpose,
    expectedCells: spec.cells,
    refs,
    failures,
    canonicalMutation: false,
    truthBoundary: WARP_TRUTH_BOUNDARY_R176,
  }, 503);
  const planCore = {
    schema: "OMEGA_WARP_PLAN_R176",
    revision: WARP_REVISION_R176,
    warpId,
    profile,
    purpose,
    expectedCells: spec.cells,
    shardCount: refs.length,
    providerBudget: requestedProviderBudget,
    refs,
    structuralDispatch: {
      coordinatorShards: refs.length,
      cellsPerShardedMission: profile === "PULSE" ? 12 : profile === "FLOCK" ? 24 : 144,
      inheritedCoordinatorBatchSize: 24,
      dispatchFanoutCeilingFromCodePath: Math.min(refs.length * 24, 288),
      observedThroughputClaim: false,
    },
    authority: "WARP_PLAN_NOT_EXECUTION_PROOF",
    canonicalMutation: false,
    truthBoundary: WARP_TRUTH_BOUNDARY_R176,
  };
  return jsonResponse({
    ok: true,
    schema: WARP_SCHEMA_R176,
    warpId,
    profile,
    purpose,
    expectedCells: spec.cells,
    refs,
    children: children.map(x => ({ ref: x.ref, mission: x.mission, plan: x.plan })),
    plan: { ...planCore, planSha256: await sha(planCore) },
    next: { action: "POST /api/swarm/warp/tick", body: { warpId, profile, purpose, refs } },
    canonicalMutation: false,
  }, 202);
}

async function statusOrTick(request: Request, env: SwarmEnv, tick: boolean): Promise<Response> {
  const body = await request.json().catch(() => ({})) as AnyObj;
  const refs = validateRefs(body.refs);
  const warpId = clip(body.warpId || body.warp_id, 220) || "warp-unlabeled";
  const profile = profileOf(body.profile);
  const purpose = purposeOf(body.purpose);
  const rows = await Promise.all(refs.map(ref => fetchChild(env, ref, tick)));
  return jsonResponse(await aggregate(warpId, profile, purpose, rows), rows.every(x => x.ok) ? 200 : 207);
}

export async function handleWarpComputationRequest(request: Request, env: SwarmEnv): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
  const path = new URL(request.url).pathname;
  try {
    if (request.method === "GET" && path === "/api/swarm/warp/manifest") return jsonResponse({
      ok: true,
      schema: "OMEGA_WARP_MANIFEST_R176",
      revision: WARP_REVISION_R176,
      profiles: PROFILE,
      hierarchy: { seed: 1, organs: 12, branches: 144, cells: SWARM_CELL_COUNT, lanes: SWARM_LANE_COUNT },
      shardAxis: { count: 12, meaning: "cell index modulo 12 / regulation axis", roles: SWARM_REGULATION_ROLES },
      execution: {
        existingCoordinatorClass: "OmegaSwarmCoordinator",
        inheritedBatchSizePerCoordinator: 24,
        maximumCoordinatorShards: 12,
        dispatchFanoutCeilingFromCodePath: 288,
        observedThroughputClaim: false,
        alarmContinuation: true,
        explicitTickAcceleration: true,
      },
      continuity: "partition -> parallel shard execution -> receipt carry -> Merkle reconvergence -> returned-not-admitted",
      authority: WARP_AUTHORITY_R176,
      canonicalMutation: false,
      truthBoundary: WARP_TRUTH_BOUNDARY_R176,
    });
    if (request.method === "POST" && path === "/api/swarm/warp/launch") return launch(request, env);
    if (request.method === "POST" && path === "/api/swarm/warp/status") return statusOrTick(request, env, false);
    if (request.method === "POST" && path === "/api/swarm/warp/tick") return statusOrTick(request, env, true);
    return jsonResponse({ ok: false, code: "NOT_FOUND", path, canonicalMutation: false }, 404);
  } catch (error) {
    return jsonResponse({
      ok: false,
      code: "R176_WARP_ERROR",
      error: error instanceof Error ? error.message : String(error),
      canonicalMutation: false,
      truthBoundary: WARP_TRUTH_BOUNDARY_R176,
    }, 400);
  }
}
