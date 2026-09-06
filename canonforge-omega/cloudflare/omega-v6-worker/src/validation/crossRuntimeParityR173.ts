import { handleComputeRequest } from "../compute/computeTruthR170";
import { handleAtlasComputeRequest } from "../compute/atlasComputeR170";

type Obj = Record<string, any>;

export const CROSS_RUNTIME_PARITY_RELEASE_R173 = "r173-authenticated-cross-runtime-parity";
export const CROSS_RUNTIME_CHALLENGE_SCHEMA_R173 = "OMEGA_CROSS_RUNTIME_CHALLENGE_R173";
export const CROSS_RUNTIME_VALIDATION_SCHEMA_R173 = "OMEGA_CROSS_RUNTIME_VALIDATION_R173";
export const CROSS_RUNTIME_BOUNDARY_R173 = "R173 promotes a result to validation level 3 only when the canonical development ledger contains a VERIFIED cross_runtime_validate job returned by the authenticated Sovereign-PC agent, the persisted lease owner matches the returned agent identity, the heartbeat sequence is present, the native receipt is bound to the exact cloud canonical input string, and a fresh cloud re-execution numerically agrees with the native Python result. Cross-runtime parity is evidence that independent runtimes agree on the same mathematical model; it is not an independent solver-family result, not empirical observation, and not CanonState authority. 12/144/1728/20736 remain software address/execution-resolution levels rather than physical dimensions.";

const SUPPORTED_PATHS = Object.freeze([
  "/api/compute/relativity/event",
  "/api/compute/relativity/velocity",
  "/api/compute/optics/tmm",
  "/api/compute/continuity/transfer",
  "/api/compute/continuity/diffusion",
  "/api/compute/wave/fdtd1d",
  "/api/compute/atlas/diffusion",
]);

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(value: any, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(value, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors },
  });
}

function canonicalJson(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("cross-runtime input contains a non-finite number");
    return JSON.stringify(value);
  }
  if (["string", "boolean"].includes(typeof value)) return JSON.stringify(value);
  throw new Error(`cross-runtime input contains unsupported JSON type: ${typeof value}`);
}

async function shaText(text: string): Promise<string> {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(raw)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function cloudCompute(path: string, input: Obj): Promise<Obj> {
  const request = new Request(`https://r173.compute.internal${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const response = path.startsWith("/api/compute/atlas/")
    ? await handleAtlasComputeRequest(request)
    : await handleComputeRequest(request);
  const body = await response.json().catch(() => null) as Obj | null;
  if (!response.ok || !body?.ok || !body.result || !body.receipt) {
    throw new Error(`cloud reference computation failed for ${path}: ${JSON.stringify(body)}`);
  }
  return body;
}

function flattenNumbers(value: any, out: number[] = []): number[] {
  if (typeof value === "number" && Number.isFinite(value)) out.push(value);
  else if (Array.isArray(value)) for (const item of value) flattenNumbers(item, out);
  return out;
}

function pick(result: Obj, ...keys: string[]): any {
  for (const key of keys) if (result[key] !== undefined) return result[key];
  return undefined;
}

function parityVector(path: string, result: Obj): number[] {
  if (path === "/api/compute/relativity/event") return flattenNumbers([
    result.gamma, result.beta2, pick(result, "transformed_t_seconds", "transformedTSeconds"),
    pick(result, "transformed_position_m", "transformedPositionM"),
    pick(result, "interval_before_m2", "intervalBeforeM2"), pick(result, "interval_after_m2", "intervalAfterM2"),
  ]);
  if (path === "/api/compute/relativity/velocity") return flattenNumbers([
    pick(result, "transformed_velocity_m_s", "transformedVelocityMS"),
    pick(result, "transformed_speed_fraction_c", "transformedSpeedFractionC"), pick(result, "gamma_frame", "gammaFrame"),
  ]);
  if (path === "/api/compute/optics/tmm") return flattenNumbers([
    result.reflectance, result.transmittance, result.absorptance,
    pick(result, "raw_absorptance", "rawAbsorptance"), pick(result, "energy_balance", "energyBalance"),
  ]);
  if (path === "/api/compute/continuity/transfer" || path === "/api/compute/continuity/diffusion") return flattenNumbers([
    pick(result, "values_after", "valuesAfter"), pick(result, "invariant_before", "invariantBefore"),
    pick(result, "invariant_after", "invariantAfter"), pick(result, "min_after", "minAfter"), pick(result, "max_after", "maxAfter"),
  ]);
  if (path === "/api/compute/wave/fdtd1d") return flattenNumbers([
    result.cfl, result.steps, pick(result, "final_state", "finalState"), pick(result, "max_abs_amplitude", "maxAbsAmplitude"),
  ]);
  if (path === "/api/compute/atlas/diffusion") return flattenNumbers([
    result.nodes, pick(result, "undirected_edges", "undirectedEdges"), result.degree,
    pick(result, "stability_number", "stabilityNumber"), pick(result, "invariant_before", "invariantBefore"),
    pick(result, "invariant_after", "invariantAfter"), pick(result, "min_value", "minValue"), pick(result, "max_value", "maxValue"),
    pick(result, "l2_norm", "l2Norm"), pick(result, "normalized_entropy", "normalizedEntropy"),
    (pick(result, "top_states", "topStates") || []).map((row: Obj) => row.value),
  ]);
  return [];
}

function toleranceFor(path: string): number {
  if (path === "/api/compute/optics/tmm") return 5e-10;
  if (path === "/api/compute/wave/fdtd1d" || path === "/api/compute/atlas/diffusion") return 1e-9;
  return 5e-11;
}

function compareNumeric(path: string, cloudResult: Obj, nativeResult: Obj): Obj {
  const a = parityVector(path, cloudResult), b = parityVector(path, nativeResult);
  if (!a.length || a.length !== b.length) return { passed: false, count: Math.max(a.length, b.length), maxRelativeResidual: Infinity, reason: "comparable numeric vector shape mismatch" };
  let maxRelativeResidual = 0;
  let maxAbsoluteResidual = 0;
  for (let i = 0; i < a.length; i++) {
    const absolute = Math.abs(a[i] - b[i]);
    const relative = absolute / Math.max(1, Math.abs(a[i]), Math.abs(b[i]));
    maxAbsoluteResidual = Math.max(maxAbsoluteResidual, absolute);
    maxRelativeResidual = Math.max(maxRelativeResidual, relative);
  }
  const tolerance = toleranceFor(path);
  return { passed: maxRelativeResidual <= tolerance, count: a.length, maxRelativeResidual, maxAbsoluteResidual, tolerance };
}

async function prepareChallenge(body: Obj): Promise<Obj> {
  const path = String(body.path || "");
  const input = body.input;
  if (!SUPPORTED_PATHS.includes(path)) throw new Error(`unsupported cross-runtime path: ${path}`);
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("input must be a JSON object");
  const inputCanonicalJson = canonicalJson(input);
  const inputSha256 = await shaText(inputCanonicalJson);
  const cloud = await cloudCompute(path, input);
  const cloudResultSha256 = String(cloud.receipt.resultSha256 || cloud.receipt.result_sha256 || await shaText(canonicalJson(cloud.result)));
  const cloudReceiptSha256 = String(cloud.receipt.receiptSha256 || cloud.receipt.receipt_sha256 || await shaText(canonicalJson(cloud.receipt)));
  const challengeCore = {
    schema: CROSS_RUNTIME_CHALLENGE_SCHEMA_R173,
    revision: "R173",
    path,
    input_canonical_json: inputCanonicalJson,
    input_sha256: inputSha256,
    cloud_result_sha256: cloudResultSha256,
    cloud_receipt_sha256: cloudReceiptSha256,
    authority: "CLOUD_CHALLENGE_NOT_VALIDATION",
    canonical_mutation: false,
    independent_solver_family_claim: false,
    physical_dimension_claim: false,
  };
  const challengeSha256 = await shaText(canonicalJson(challengeCore));
  const challengeId = `r173_${challengeSha256.slice(0, 20)}`;
  return {
    ...challengeCore,
    challenge_id: challengeId,
    challenge_sha256: challengeSha256,
    cloud_result: cloud.result,
    cloud_receipt: cloud.receipt,
    boundary: CROSS_RUNTIME_BOUNDARY_R173,
  };
}

async function fetchCanonicalJson(request: Request, path: string): Promise<Obj> {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = "";
  const response = await fetch(new Request(url.toString(), { method: "GET", headers: { accept: "application/json" }, cache: "no-store" }));
  const body = await response.json().catch(() => null) as Obj | null;
  if (!response.ok || !body) throw new Error(`canonical ${path} unavailable with status ${response.status}`);
  return body;
}

function findJob(status: Obj, jobId: string): Obj | null {
  const rows = [status.active_job, ...(Array.isArray(status.recent_jobs) ? status.recent_jobs : [])].filter(Boolean);
  return rows.find((row: Obj) => String(row.id) === jobId) || null;
}

async function comparePersistedJob(request: Request, body: Obj): Promise<Obj> {
  const jobId = String(body.job_id || body.jobId || "");
  if (!jobId) throw new Error("job_id is required");
  const [status, hybrid] = await Promise.all([
    fetchCanonicalJson(request, "/api/development/status"),
    fetchCanonicalJson(request, "/api/hybrid/status").catch(error => ({ state: "UNAVAILABLE", error: String(error) })),
  ]);
  const job = findJob(status, jobId);
  if (!job) return { ok: false, state: "PENDING_OR_UNKNOWN", job_id: jobId, validationTier: { level: 3, id: "CROSS_RUNTIME_PARITY" }, boundary: CROSS_RUNTIME_BOUNDARY_R173 };
  const payload = job.payload || {}, evidence = job.evidence || {}, nativeReceipt = evidence.native_receipt || {};
  const trustGates: Obj = {
    typedJob: job.kind === "cross_runtime_validate",
    verifiedJob: job.state === "VERIFIED",
    challengeSchema: payload.schema === CROSS_RUNTIME_CHALLENGE_SCHEMA_R173,
    persistedChallengeMatch: typeof payload.challenge_sha256 === "string" && payload.challenge_sha256 === evidence.challenge_sha256,
    nativeExecution: evidence.native_execution === true && nativeReceipt.native_execution === true,
    leaseIdentity: Boolean(job.lease_owner && evidence.agent_id && job.lease_owner === evidence.agent_id),
    heartbeatSequence: Number.isInteger(Number(evidence.heartbeat_sequence)) && Number(evidence.heartbeat_sequence) > 0,
    inputBinding: typeof payload.input_sha256 === "string" && payload.input_sha256 === evidence.input_sha256 && payload.input_sha256 === nativeReceipt.input_sha256,
    pathBinding: typeof payload.path === "string" && payload.path === evidence.path && payload.path === nativeReceipt.path,
    cloudHashBinding: typeof payload.cloud_result_sha256 === "string" && payload.cloud_result_sha256 === evidence.cloud_result_sha256,
    nativeReceiptHash: typeof nativeReceipt.receipt_sha256 === "string" && nativeReceipt.receipt_sha256.length === 64,
    noCanonMutation: nativeReceipt.canonical_mutation === false && evidence.canonical_mutation === false,
    noSolverFamilyPromotion: nativeReceipt.independent_solver_family_claim === false && evidence.independent_solver_family_claim === false,
  };
  const trustPassed = Object.values(trustGates).every(Boolean);
  if (!trustPassed) return {
    ok: false, state: "TRUST_GATES_FAILED", job_id: jobId, validationTier: { level: 3, id: "CROSS_RUNTIME_PARITY" },
    trustGates, currentHybrid: hybrid, authority: "UNVERIFIED_NATIVE_PACKET_NOT_VALIDATION", canonicalMutation: false, boundary: CROSS_RUNTIME_BOUNDARY_R173,
  };

  const inputCanonicalJson = String(payload.input_canonical_json || "");
  if (await shaText(inputCanonicalJson) !== payload.input_sha256) throw new Error("persisted canonical input hash no longer matches the job payload");
  const input = JSON.parse(inputCanonicalJson) as Obj;
  const freshCloud = await cloudCompute(String(payload.path), input);
  const freshCloudResultSha = String(freshCloud.receipt.resultSha256 || freshCloud.receipt.result_sha256 || await shaText(canonicalJson(freshCloud.result)));
  const cloudReexecutionBound = freshCloudResultSha === payload.cloud_result_sha256;
  const parity = compareNumeric(String(payload.path), freshCloud.result, nativeReceipt.result || {});
  const passed = trustPassed && cloudReexecutionBound && parity.passed;
  const receiptCore = {
    schema: CROSS_RUNTIME_VALIDATION_SCHEMA_R173,
    revision: "R173",
    status: passed ? "PASS" : "FAIL",
    validationTier: { level: 3, id: "CROSS_RUNTIME_PARITY" },
    job_id: jobId,
    challenge_id: payload.challenge_id || null,
    challenge_sha256: payload.challenge_sha256,
    path: payload.path,
    input_sha256: payload.input_sha256,
    cloud_result_sha256: freshCloudResultSha,
    native_result_sha256: nativeReceipt.result_sha256,
    cloud_receipt_sha256: payload.cloud_receipt_sha256,
    native_receipt_sha256: nativeReceipt.receipt_sha256,
    authenticated_agent_id: evidence.agent_id,
    heartbeat_sequence_at_execution: evidence.heartbeat_sequence,
    cloudReexecutionBound,
    parity,
    trustGates,
    currentHybridState: hybrid.state || null,
    currentHeartbeat: Boolean(hybrid.heartbeatCurrent || hybrid.pcOnline || hybrid.pc_online),
    nativeExecutionObserved: true,
    evidenceClass: "DERIVED_VALIDATION",
    authority: "CROSS_RUNTIME_VALIDATION_RECEIPT_NOT_CANON",
    canonicalMutation: false,
    independentSolverFamilyClaim: false,
    externalMeasurementClaim: false,
    physicalDimensionClaim: false,
    boundary: CROSS_RUNTIME_BOUNDARY_R173,
  };
  return { ...receiptCore, receiptSha256: await shaText(canonicalJson(receiptCore)) };
}

export async function handleCrossRuntimeValidationRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return json(null, 204);
  const path = new URL(request.url).pathname;
  try {
    if (request.method === "GET" && path === "/api/validate/cross-runtime/manifest") return json({
      ok: true,
      schema: "OMEGA_CROSS_RUNTIME_MANIFEST_R173",
      revision: "R173",
      release: CROSS_RUNTIME_PARITY_RELEASE_R173,
      validationTier: { level: 3, id: "CROSS_RUNTIME_PARITY" },
      supportedPaths: SUPPORTED_PATHS,
      executionFlow: ["PREPARE_CLOUD_CHALLENGE", "ENQUEUE_TYPED_JOB", "AUTHENTICATED_PC_EXECUTION", "PERSIST_NATIVE_RECEIPT", "FRESH_CLOUD_REEXECUTION", "NUMERIC_PARITY", "ISSUE_L3_RECEIPT"],
      status: "AVAILABLE_WHEN_AUTHENTICATED_SOVEREIGN_PC_JOB_IS_VERIFIED",
      independentFullWaveStatus: "REQUIRES_RCWA_OR_MAXWELL_FDTD_RECEIPT",
      externalMeasurementStatus: "REQUIRES_OBSERVED_SOURCE_RECEIPT",
      canonicalMutation: false,
      boundary: CROSS_RUNTIME_BOUNDARY_R173,
    });
    if (request.method === "POST" && path === "/api/validate/cross-runtime/prepare") {
      const body = await request.json().catch(() => ({})) as Obj;
      return json({ ok: true, challenge: await prepareChallenge(body) });
    }
    if (request.method === "POST" && path === "/api/validate/cross-runtime/compare") {
      const body = await request.json().catch(() => ({})) as Obj;
      const validation = await comparePersistedJob(request, body);
      return json({ ok: validation.status === "PASS", validation }, validation.status === "PASS" ? 200 : 409);
    }
    return json({ ok: false, code: "NOT_FOUND" }, 404);
  } catch (error) {
    return json({ ok: false, code: "INVALID_CROSS_RUNTIME_VALIDATION", error: error instanceof Error ? error.message : String(error), canonicalMutation: false, boundary: CROSS_RUNTIME_BOUNDARY_R173 }, 422);
  }
}
