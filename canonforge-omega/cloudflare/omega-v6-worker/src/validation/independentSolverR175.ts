type Obj = Record<string, any>;

export const INDEPENDENT_SOLVER_RELEASE_R175 = "r175-sovereign-independent-rcwa-validation";
export const INDEPENDENT_SOLVER_CHALLENGE_SCHEMA_R175 = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175";
export const INDEPENDENT_SOLVER_VALIDATION_SCHEMA_R175 = "OMEGA_INDEPENDENT_SOLVER_VALIDATION_R175";
export const INDEPENDENT_SOLVER_BOUNDARY_R175 =
  "R175 admits validation level 4 only from a persisted VERIFIED governed cross_runtime_validate job whose payload is an exact-hash-bound OMEGA_FULLWAVE_QUEUE_v1 RCWA challenge and whose returned evidence came from the authenticated leased Sovereign agent with a heartbeat sequence, a native OMEGA_RESULT_v1 result from solver_family=MAXWELL_RCWA and solver_version=grcwa:*, verified input/result/receipt hashes, numerical convergence, energy/convergence tolerances, and explicit no-Canon/no-measurement boundaries. This is independent solver-family numerical evidence relative to the R115 reduced-order optical screen; it is not fabrication validation, measured material truth, empirical observation, or CanonState authority. 12/144/1728/20736 remain software address/execution-resolution levels rather than physical dimensions.";

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
    if (!Number.isFinite(value)) throw new Error("R175 payload contains a non-finite number");
    return JSON.stringify(value);
  }
  if (["string", "boolean"].includes(typeof value)) return JSON.stringify(value);
  throw new Error(`R175 payload contains unsupported JSON type: ${typeof value}`);
}

async function shaText(text: string): Promise<string> {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(raw)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function shaObject(value: any): Promise<string> {
  return shaText(canonicalJson(value));
}

function finite(value: any): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function validateFullwaveQueue(job: Obj): string[] {
  const errors: string[] = [];
  if (!job || typeof job !== "object" || Array.isArray(job)) errors.push("fullwave job must be a JSON object");
  if (job?.schema !== "OMEGA_FULLWAVE_QUEUE_v1") errors.push("schema must be OMEGA_FULLWAVE_QUEUE_v1");
  if (String(job?.solver || "").toLowerCase() !== "rcwa") errors.push("solver must be rcwa");
  const proof = job?.proof || {};
  if (proof.gate !== "STAY") errors.push("proof gate must be STAY");
  if (!finite(Number(proof.mode188_score)) || Number(proof.mode188_score) < 1.05) errors.push("mode188_score must be >= 1.05");
  const geometry = job?.geometry || {};
  for (const key of ["pitch_nm", "width_nm", "length_nm", "height_nm"]) {
    if (!finite(Number(geometry[key])) || Number(geometry[key]) <= 0) errors.push(`geometry.${key} must be finite and positive`);
  }
  if (finite(Number(geometry.width_nm)) && finite(Number(geometry.pitch_nm)) && Number(geometry.width_nm) > Number(geometry.pitch_nm)) errors.push("geometry.width_nm cannot exceed pitch_nm");
  if (finite(Number(geometry.length_nm)) && finite(Number(geometry.pitch_nm)) && Number(geometry.length_nm) > Number(geometry.pitch_nm)) errors.push("geometry.length_nm cannot exceed pitch_nm");
  if (!finite(Number(job?.wavelength_nm)) || Number(job.wavelength_nm) <= 0) errors.push("wavelength_nm must be finite and positive");
  const material = job?.material_model || {};
  for (const key of ["n_incident", "n_feature", "n_background", "n_substrate"]) if (material[key] === undefined) errors.push(`material_model.${key} is required`);
  return errors;
}

async function prepareChallenge(body: Obj): Promise<Obj> {
  const queueJob = body.fullwave_job || body.tier2_job || body.job;
  const errors = validateFullwaveQueue(queueJob);
  if (errors.length) return { ok: false, code: "INVALID_FULLWAVE_QUEUE", errors };
  const queueJobCanonicalJson = canonicalJson(queueJob);
  const queueJobSha256 = await shaText(queueJobCanonicalJson);
  const challengeCore = {
    schema: INDEPENDENT_SOLVER_CHALLENGE_SCHEMA_R175,
    revision: "R175",
    queue_job_canonical_json: queueJobCanonicalJson,
    queue_job_sha256: queueJobSha256,
    source_packet_id: queueJob.source_packet_id || null,
    requested_solver: "rcwa",
    solver_family: "MAXWELL_RCWA",
    authority: "INDEPENDENT_SOLVER_CHALLENGE_NOT_VALIDATION",
    canonical_mutation: false,
    external_measurement_claim: false,
    physical_dimension_claim: false,
  };
  const challengeSha256 = await shaObject(challengeCore);
  return {
    ok: true,
    challenge: {
      ...challengeCore,
      challenge_id: `r175_${challengeSha256.slice(0, 20)}`,
      challenge_sha256: challengeSha256,
      queue_job: queueJob,
      boundary: INDEPENDENT_SOLVER_BOUNDARY_R175,
    },
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

async function verifyNativeHashes(result: Obj, receipt: Obj): Promise<Obj> {
  const resultCore = { ...result };
  delete resultCore.result_sha256;
  delete resultCore.receipt;
  const computedResultSha256 = await shaObject(resultCore);
  const receiptCore = { ...receipt };
  delete receiptCore.receipt_sha256;
  const computedReceiptSha256 = await shaObject(receiptCore);
  return {
    resultHash: typeof result.result_sha256 === "string" && result.result_sha256.length === 64 && result.result_sha256 === computedResultSha256,
    receiptHash: typeof receipt.receipt_sha256 === "string" && receipt.receipt_sha256.length === 64 && receipt.receipt_sha256 === computedReceiptSha256,
    computedResultSha256,
    computedReceiptSha256,
  };
}

function numericalGates(result: Obj): Obj {
  const metrics = result.convergence_metrics || {};
  const observables = result.observables || {};
  const delta = Number(metrics.delta_RT);
  const convergenceTolerance = Number(metrics.convergence_tolerance);
  const energyError = Number(metrics.energy_balance_error);
  const energyTolerance = Number(metrics.energy_tolerance);
  const reflection = Number(observables.R);
  const transmission = Number(observables.T);
  const finiteNumerics = [delta, convergenceTolerance, energyError, energyTolerance, reflection, transmission].every(Number.isFinite);
  const convergenceTolerancePassed = finiteNumerics && delta <= convergenceTolerance;
  const energyTolerancePassed = finiteNumerics && energyError <= energyTolerance;
  const observableBounds = finiteNumerics && reflection >= -energyTolerance && transmission >= -energyTolerance && reflection <= 1 + energyTolerance && transmission <= 1 + energyTolerance;
  return {
    finiteNumerics,
    convergedFlag: result.converged === true,
    convergenceTolerancePassed,
    energyTolerancePassed,
    observableBounds,
    delta_RT: delta,
    convergence_tolerance: convergenceTolerance,
    energy_balance_error: energyError,
    energy_tolerance: energyTolerance,
    R: reflection,
    T: transmission,
    passed: Boolean(result.converged === true && finiteNumerics && convergenceTolerancePassed && energyTolerancePassed && observableBounds),
  };
}

async function comparePersistedJob(request: Request, body: Obj): Promise<Obj> {
  const jobId = String(body.job_id || body.jobId || "");
  if (!jobId) throw new Error("job_id is required");
  const [status, hybridRaw] = await Promise.all([
    fetchCanonicalJson(request, "/api/development/status"),
    fetchCanonicalJson(request, "/api/hybrid/status").catch(error => ({ state: "UNAVAILABLE", error: String(error) } as Obj)),
  ]);
  const hybrid: Obj = hybridRaw as Obj;
  const job = findJob(status, jobId);
  if (!job) return {
    ok: false,
    state: "PENDING_OR_UNKNOWN",
    job_id: jobId,
    validationTier: { level: 4, id: "INDEPENDENT_SOLVER_FAMILY" },
    boundary: INDEPENDENT_SOLVER_BOUNDARY_R175,
  };

  const payload = job.payload || {};
  const evidence = job.evidence || {};
  const nativeResult = evidence.native_result || {};
  const nativeReceipt = evidence.native_receipt || nativeResult.receipt || {};
  const queueCanonical = String(payload.queue_job_canonical_json || "");
  const queueHash = await shaText(queueCanonical);
  const hashGates = await verifyNativeHashes(nativeResult, nativeReceipt);
  const numerics = numericalGates(nativeResult);
  const trustGates: Obj = {
    governedJobKind: job.kind === "cross_runtime_validate",
    verifiedJob: job.state === "VERIFIED",
    challengeSchema: payload.schema === INDEPENDENT_SOLVER_CHALLENGE_SCHEMA_R175,
    queueSchema: (() => { try { return JSON.parse(queueCanonical)?.schema === "OMEGA_FULLWAVE_QUEUE_v1"; } catch { return false; } })(),
    persistedChallengeMatch: typeof payload.challenge_sha256 === "string" && payload.challenge_sha256 === evidence.challenge_sha256,
    queueHashPersisted: typeof payload.queue_job_sha256 === "string" && payload.queue_job_sha256 === queueHash,
    queueHashReturned: payload.queue_job_sha256 === evidence.queue_job_sha256,
    leaseIdentity: Boolean(job.lease_owner && evidence.agent_id && job.lease_owner === evidence.agent_id),
    heartbeatSequenceAtExecution: Number.isInteger(Number(evidence.heartbeat_sequence)) && Number(evidence.heartbeat_sequence) > 0,
    nativeExecution: evidence.native_execution === true && nativeResult.native_execution === true,
    resultSchema: nativeResult.schema === "OMEGA_RESULT_v1",
    solver: nativeResult.solver === "rcwa",
    solverFamily: nativeResult.solver_family === "MAXWELL_RCWA",
    solverVersion: typeof nativeResult.solver_version === "string" && nativeResult.solver_version.startsWith("grcwa:"),
    independentFamily: evidence.independent_solver_family_claim === true && nativeResult.independent_solver_family_claim === true && nativeReceipt.independent_solver_family_claim === true,
    inputIdentity: nativeResult.numerical_identity?.input_sha256 === payload.queue_job_sha256 && nativeReceipt.input_sha256 === payload.queue_job_sha256,
    resultHash: hashGates.resultHash,
    receiptHash: hashGates.receiptHash,
    noCanonMutation: evidence.canonical_mutation === false && nativeResult.canonical_mutation === false && nativeReceipt.canonical_mutation === false,
    noMeasurementPromotion: evidence.external_measurement_claim === false && nativeResult.external_measurement_claim === false && nativeReceipt.external_measurement_claim === false,
  };
  const trustPassed = Object.values(trustGates).every(Boolean);
  const passed = Boolean(trustPassed && numerics.passed);
  const receiptCore = {
    schema: INDEPENDENT_SOLVER_VALIDATION_SCHEMA_R175,
    revision: "R175",
    status: passed ? "PASS" : "FAIL",
    validationTier: { level: 4, id: "INDEPENDENT_SOLVER_FAMILY" },
    job_id: jobId,
    challenge_id: payload.challenge_id || null,
    challenge_sha256: payload.challenge_sha256 || null,
    source_packet_id: payload.source_packet_id || null,
    queue_job_sha256: payload.queue_job_sha256 || null,
    native_result_sha256: nativeResult.result_sha256 || null,
    native_receipt_sha256: nativeReceipt.receipt_sha256 || null,
    authenticated_agent_id: evidence.agent_id || null,
    heartbeat_sequence_at_execution: evidence.heartbeat_sequence || null,
    solver: nativeResult.solver || null,
    solverFamily: nativeResult.solver_family || null,
    solverVersion: nativeResult.solver_version || null,
    numericalValidation: numerics,
    trustGates,
    currentHybridState: hybrid.state || null,
    currentHeartbeat: Boolean(hybrid.heartbeatCurrent || hybrid.pcOnline || hybrid.pc_online),
    nativeExecutionObserved: evidence.native_execution === true,
    independentSolverFamilyClaim: passed,
    evidenceClass: "DERIVED_INDEPENDENT_NUMERICAL_VALIDATION",
    authority: "INDEPENDENT_SOLVER_VALIDATION_RECEIPT_NOT_CANON",
    canonicalMutation: false,
    externalMeasurementClaim: false,
    fabricationValidationClaim: false,
    physicalDimensionClaim: false,
    boundary: INDEPENDENT_SOLVER_BOUNDARY_R175,
  };
  return {
    ok: passed,
    validation: { ...receiptCore, receiptSha256: await shaObject(receiptCore) },
    persistedJobState: job.state || null,
  };
}

export async function handleIndependentSolverValidationRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return json(null, 204);
  const path = new URL(request.url).pathname;
  try {
    if (request.method === "GET" && path === "/api/validate/independent/manifest") return json({
      ok: true,
      schema: "OMEGA_INDEPENDENT_SOLVER_MANIFEST_R175",
      revision: "R175",
      release: INDEPENDENT_SOLVER_RELEASE_R175,
      validationTier: { level: 4, id: "INDEPENDENT_SOLVER_FAMILY" },
      inputSchema: "OMEGA_FULLWAVE_QUEUE_v1",
      nativeResultSchema: "OMEGA_RESULT_v1",
      solver: "rcwa",
      solverFamily: "MAXWELL_RCWA",
      requiredImplementation: "grcwa",
      executionFlow: [
        "R174_OPTICAL_SCREEN",
        "PREPARE_HASH_BOUND_FULLWAVE_CHALLENGE",
        "QUEUE_EXISTING_GOVERNED_CROSS_RUNTIME_JOB",
        "AUTHENTICATED_SOVEREIGN_LEASE",
        "NO_FALLBACK_GRCWA_EXECUTION",
        "PERSIST_NATIVE_RESULT_AND_RECEIPT",
        "VERIFY_IDENTITY_HASHES_AND_NUMERICAL_CONVERGENCE",
        "ADMIT_OR_REJECT_L4_RECEIPT",
      ],
      level5Gate: "EXTERNAL_MEASUREMENT_REQUIRED",
      canonicalMutation: false,
      boundary: INDEPENDENT_SOLVER_BOUNDARY_R175,
    });
    if (request.method === "POST" && path === "/api/validate/independent/prepare") {
      const prepared = await prepareChallenge(await request.json().catch(() => ({})) as Obj);
      return json(prepared, prepared.ok ? 200 : 400);
    }
    if (request.method === "POST" && path === "/api/validate/independent/compare") {
      return json(await comparePersistedJob(request, await request.json().catch(() => ({})) as Obj));
    }
    return json({ ok: false, code: "NOT_FOUND", path, canonicalMutation: false }, 404);
  } catch (error) {
    return json({
      ok: false,
      code: "R175_INDEPENDENT_SOLVER_ERROR",
      error: error instanceof Error ? error.message : String(error),
      canonicalMutation: false,
      boundary: INDEPENDENT_SOLVER_BOUNDARY_R175,
    }, 500);
  }
}
