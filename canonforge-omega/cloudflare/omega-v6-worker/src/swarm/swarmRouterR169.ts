import { AnyObj, DurableBinding, SwarmEnv, AUTONOMIC_REVISION, CONTINUITY_LAW, ORGANISM_REVISION, SWARM_CELL_COUNT, SWARM_DOMAIN_ROLES, SWARM_LANE_COUNT, SWARM_PHASE_ROLES, SWARM_RECOVERY_REVISION, SWARM_REGULATION_ROLES, SWARM_SOURCE_COMMIT, TRUTH_BOUNDARY, cellId, cellIndex, jsonResponse, laneIndex, sha } from "./swarmCoreR169";
import { SWARM_MODEL_R171, SWARM_MODEL_R171_AUTHORITY } from "./swarmCellR169";

const COMPUTE_PATHS = new Set([
  "/api/compute/relativity/event",
  "/api/compute/relativity/velocity",
  "/api/compute/optics/tmm",
  "/api/compute/continuity/transfer",
  "/api/compute/continuity/diffusion",
  "/api/compute/wave/fdtd1d",
]);

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type,authorization,x-omega-bridge-secret");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
async function forward(binding: DurableBinding | undefined, name: string, path: string, request: Request): Promise<Response> {
  if (!binding) return jsonResponse({ ok: false, code: "SWARM_BINDING_UNAVAILABLE", binding: name, canonicalMutation: false }, 503);
  const stub = binding.get(binding.idFromName(name)), init: RequestInit = { method: request.method, headers: request.headers };
  if (!["GET", "HEAD"].includes(request.method)) init.body = await request.text();
  return stub.fetch(new Request(`https://swarm.internal${path}`, init));
}
function residualOf(computation: AnyObj): number | null {
  for (const key of ["invariant_relative_residual", "invariant_absolute_residual", "energy_balance_residual"]) {
    const v = Number(computation?.[key]);
    if (Number.isFinite(v)) return v;
  }
  return null;
}
async function computeConsensus(request: Request, env: SwarmEnv): Promise<Response> {
  if (!env.OMEGA_SWARM_CELL) return jsonResponse({ ok: false, code: "CELL_BINDING_UNAVAILABLE", canonicalMutation: false }, 503);
  const body = await request.json().catch(() => ({})) as AnyObj;
  const computation = body.computation || {}, path = String(computation.path || "");
  if (!COMPUTE_PATHS.has(path)) return jsonResponse({ ok: false, code: "COMPUTATION_PATH_NOT_ALLOWED", allowed: [...COMPUTE_PATHS], canonicalMutation: false }, 400);
  const replicas = Math.max(1, Math.min(12, Math.trunc(Number(body.replicas) || 12)));
  const missionId = `compute_consensus_${Date.now().toString(36)}_${(await sha(JSON.stringify(computation))).slice(0, 10)}`;
  const cells = Array.from({ length: replicas }, (_, regulation) => {
    const address = { domain: 4, phase: 9, regulation, index: cellIndex(4, 9, regulation) };
    return { address, id: cellId(address), lane: laneIndex(address, regulation) };
  });
  const startedAt = Date.now();
  const results = await Promise.all(cells.map(async ({ address, id, lane }, order) => {
    try {
      const stub = env.OMEGA_SWARM_CELL!.get(env.OMEGA_SWARM_CELL!.idFromName(id));
      const response = await stub.fetch(new Request("https://swarm-cell.internal/task", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ schema: "OMEGA_SWARM_COMPUTE_TASK_R171", missionId, taskId: `${missionId}:${order}`, cellId: id, index: address.index, lane, intent: String(body.intent || `Redundant reference computation ${path}`), executor: "COMPUTE_R170", computation, evidence: Array.isArray(body.evidence) ? body.evidence : [], lineage: [`omega-v6:swarm-compute:${missionId}`, `replica:${order}`, `cell:${id}`] }),
      }));
      const data = await response.json().catch(() => null) as AnyObj | null;
      return { ok: response.ok && data?.ok === true, status: response.status, cellId: id, index: address.index, lane, receipt: data?.receipt || null, result: data?.result || null };
    } catch (error) {
      return { ok: false, status: 500, cellId: id, index: address.index, lane, receipt: null, result: { kind: "ERROR", summary: error instanceof Error ? error.message : String(error) } };
    }
  }));
  const successful = results.filter(x => x.ok && x.result?.kind === "COMPUTATION_R170" && x.receipt?.resultSha256);
  const histogram = new Map<string, number>();
  for (const x of successful) histogram.set(String(x.receipt.resultSha256), (histogram.get(String(x.receipt.resultSha256)) || 0) + 1);
  const ranked = [...histogram.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const [consensusHash, consensusCount] = ranked[0] || [null, 0];
  const residuals = successful.map(x => residualOf(x.result?.computation)).filter((v): v is number => v !== null);
  const receipt = {
    schema: "OMEGA_SWARM_COMPUTE_CONSENSUS_RECEIPT_R171", missionId, path, requestedReplicas: replicas,
    successfulReplicas: successful.length, failedReplicas: replicas - successful.length,
    consensusResultSha256: consensusHash, consensusCount, consensusRatio: replicas ? consensusCount / replicas : 0,
    uniqueResultHashes: histogram.size, maxReportedResidual: residuals.length ? Math.max(...residuals) : null,
    minReportedResidual: residuals.length ? Math.min(...residuals) : null,
    startedAt, completedAt: Date.now(), canonicalMutation: false, nativeExecution: false,
    authority: "DERIVED_REDUNDANT_REFERENCE_COMPUTATION_NOT_CANON",
    boundary: "Replicas execute the same reference implementation in distinct stateful swarm cells. Hash agreement detects execution divergence; it is not independent-algorithm validation, empirical measurement, native PC proof, or fabrication-grade verification.",
  };
  return jsonResponse({ ok: successful.length > 0, schema: "OMEGA_SWARM_COMPUTE_CONSENSUS_R171", receipt: { ...receipt, receiptSha256: await sha(receipt) }, replicas: results, canonicalMutation: false }, successful.length ? 200 : 500);
}

export async function handleSwarmRequest(request: Request, env: SwarmEnv): Promise<Response> {
  if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
  const path = new URL(request.url).pathname;
  if (request.method === "POST" && path === "/api/swarm/compute-consensus") return withCors(await computeConsensus(request, env));
  if (path === "/api/swarm/manifest") return withCors(jsonResponse({
    ok: true, schema: "OMEGA_SWARM_COMPUTATION_CONVERGENCE_R171", recoveryRevision: SWARM_RECOVERY_REVISION, operatorRevision: "R171",
    historicalRuntime: { cell: "R121", organism: ORGANISM_REVISION, autonomic: AUTONOMIC_REVISION, sourceRepo: "medicinalElJefe/OMEGAv6", sourceCommit: SWARM_SOURCE_COMMIT },
    hierarchy: { seed: 1, organs: 12, branches: 144, cells: SWARM_CELL_COUNT, lanes: SWARM_LANE_COUNT },
    roles: { domains: SWARM_DOMAIN_ROLES, phases: SWARM_PHASE_ROLES, regulations: SWARM_REGULATION_ROLES },
    providers: {
      workersAI: { bound: Boolean(env.AI?.run), model: SWARM_MODEL_R171, authority: SWARM_MODEL_R171_AUTHORITY },
      referenceCompute: { bound: true, paths: [...COMPUTE_PATHS], authority: "DERIVED_REFERENCE_COMPUTATION_NOT_CANON" },
      genesisMachine: { bound: Boolean(env.OMEGA_GENESIS_MACHINE?.fetch), authority: "PROPOSAL_NOT_CANON" },
      opticalMachine: { bound: Boolean(env.OMEGA_OPTICAL_MACHINE?.fetch), authority: "SCREENING_NOT_FABRICATION_VALIDATION" },
    },
    continuityLaw: CONTINUITY_LAW,
    preservedNamespaces: ["OmegaSwarmCell", "OmegaSwarmCoordinator", "OmegaSwarmBranch", "OmegaSwarmOrgan", "OmegaSwarmOrganismCoordinator", "OmegaSwarmAutonomicCoordinator"],
    truthBoundary: `${TRUTH_BOUNDARY} R171 can redundantly execute the bounded R170 reference solvers across distinct swarm cells; identical implementation agreement is a consistency check, not independent physical validation.`, canonicalMutation: false,
  }));
  let response: Response;
  if (path.startsWith("/api/swarm/autonomic")) response = await forward(env.OMEGA_SWARM_AUTONOMIC, "omega-swarm-autonomic-root", path.slice("/api/swarm/autonomic".length) || "/status", request);
  else if (path.startsWith("/api/swarm/organism")) response = await forward(env.OMEGA_SWARM_ORGANISM, "omega-swarm-organism-root", path.slice("/api/swarm/organism".length) || "/status", request);
  else response = await forward(env.OMEGA_SWARM_COORDINATOR, "omega-swarm-coordinator-root", path.slice("/api/swarm".length) || "/status", request);
  return withCors(response);
}
