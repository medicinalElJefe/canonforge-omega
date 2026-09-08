type RuntimeFetch = (request: Request, env: any, ctx: any) => Promise<Response>;

const SCHEMA = "OMEGA_GOVERNED_LOCAL_TRAINING_R221";
const RELEASE = "r221-governed-local-training-and-r195-closure";
const PIPELINE_SCHEMA = "OMEGA_R221_TRAIN_RCWA_PIPELINE";
const TRAINING_KIND = "sai_repository_index";
const TRAINING_RECEIPT_SCHEMA = "OMEGA_SAI_TRAINING_RECEIPT_R179";
const RCWA_KIND = "cross_runtime_validate";
const RCWA_CHALLENGE_SCHEMA = "OMEGA_INDEPENDENT_SOLVER_CHALLENGE_R175";
const RCWA_RESULT_SCHEMA = "OMEGA_SOVEREIGN_INDEPENDENT_SOLVER_RESULT_R175";
const RCWA_NATIVE_RESULT_SCHEMA = "OMEGA_RESULT_v1";
const RCWA_RECEIPT_SCHEMA = "OMEGA_SOVEREIGN_RCWA_RECEIPT_R175";
const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING"]);
const TERMINAL_STATES = new Set(["VERIFIED", "BLOCKED", "FAILED", "CANCELLED"]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-r221": RELEASE,
    },
  });
}

function requestFor(source: Request, pathname: string, init?: RequestInit): Request {
  const target = new URL(source.url);
  target.pathname = pathname;
  target.search = "";
  const headers = new Headers(source.headers);
  headers.delete("content-length");
  if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  return new Request(target.toString(), {
    method: init?.method || "GET",
    headers,
    body: init?.body,
  });
}

async function callJson(
  nextFetch: RuntimeFetch,
  request: Request,
  env: any,
  ctx: any,
  pathname: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const response = await nextFetch(requestFor(request, pathname, init), env, ctx);
    let data: any = null;
    try { data = await response.json(); } catch { data = null; }
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function allDevelopmentJobs(development: any): any[] {
  const recent = Array.isArray(development?.recent_jobs) ? development.recent_jobs : [];
  const active = development?.active_job || null;
  const ordered: any[] = [];
  const seen = new Set<string>();
  for (const job of [...recent, active].filter(Boolean)) {
    const id = String(job?.id || "");
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    ordered.push(job);
  }
  return ordered;
}

function isR221Training(job: any): boolean {
  return Boolean(
    job?.kind === TRAINING_KIND
      && job?.payload?.requested_by === "R221_TRAIN_LOCALLY"
      && job?.payload?.pipeline_schema === PIPELINE_SCHEMA
      && typeof job?.payload?.r221_pipeline_id === "string",
  );
}

function isR221Rcwa(job: any, pipelineId?: string | null): boolean {
  return Boolean(
    job?.kind === RCWA_KIND
      && job?.payload?.schema === RCWA_CHALLENGE_SCHEMA
      && job?.payload?.r221_stage === "RCWA_NATIVE_CALIBRATION"
      && typeof job?.payload?.r221_pipeline_id === "string"
      && (!pipelineId || job.payload.r221_pipeline_id === pipelineId),
  );
}

function verifiedTrainingReceipt(job: any): boolean {
  const evidence = job?.evidence;
  const receipt = evidence?.repository_index;
  return Boolean(
    isR221Training(job)
      && job?.state === "VERIFIED"
      && evidence?.kind === TRAINING_KIND
      && evidence?.native_execution === true
      && evidence?.canonical_mutation === false
      && receipt?.schema === TRAINING_RECEIPT_SCHEMA
      && receipt?.evaluation?.passed === true
      && receipt?.neuralWeightsTrained === false
      && receipt?.fullyTrainedClaim === false
      && typeof receipt?.receiptSha256 === "string"
      && receipt.receiptSha256.length === 64
      && typeof receipt?.artifacts?.retrievalModel === "string"
      && receipt.artifacts.retrievalModel.length > 0,
  );
}

function verifiedRcwaReceipt(job: any): boolean {
  const evidence = job?.evidence || {};
  const result = evidence?.native_result || {};
  const receipt = evidence?.native_receipt || result?.receipt || {};
  return Boolean(
    isR221Rcwa(job)
      && job?.state === "VERIFIED"
      && evidence?.schema === RCWA_RESULT_SCHEMA
      && evidence?.blocked === false
      && evidence?.native_execution === true
      && evidence?.independent_solver_family_claim === true
      && evidence?.canonical_mutation === false
      && result?.schema === RCWA_NATIVE_RESULT_SCHEMA
      && result?.solver === "rcwa"
      && result?.solver_family === "MAXWELL_RCWA"
      && typeof result?.solver_version === "string"
      && result.solver_version.startsWith("grcwa:")
      && result?.converged === true
      && result?.native_execution === true
      && result?.canonical_mutation === false
      && receipt?.schema === RCWA_RECEIPT_SCHEMA
      && receipt?.solver === "rcwa"
      && receipt?.solver_family === "MAXWELL_RCWA"
      && receipt?.converged === true
      && receipt?.native_execution === true
      && receipt?.canonical_mutation === false
      && typeof receipt?.input_sha256 === "string"
      && receipt.input_sha256.length === 64
      && typeof receipt?.result_sha256 === "string"
      && receipt.result_sha256.length === 64
      && typeof receipt?.receipt_sha256 === "string"
      && receipt.receipt_sha256.length === 64,
  );
}

function latestR221Training(jobs: any[]): any | null {
  const rows = jobs.filter(isR221Training);
  return rows.length ? rows[rows.length - 1] : null;
}

function pipelineFacts(r220: any, hybrid: any, development: any) {
  const jobs = allDevelopmentJobs(development);
  const training = latestR221Training(jobs);
  const pipelineId = training?.payload?.r221_pipeline_id || null;
  const rcwaJobs = jobs.filter(job => isR221Rcwa(job, pipelineId));
  const rcwa = rcwaJobs.length ? rcwaJobs[rcwaJobs.length - 1] : null;
  const activeTraining = training && ACTIVE_STATES.has(String(training.state || "")) ? training : null;
  const activeRcwa = rcwa && ACTIVE_STATES.has(String(rcwa.state || "")) ? rcwa : null;
  const trainingVerified = verifiedTrainingReceipt(training);
  const rcwaVerified = verifiedRcwaReceipt(rcwa);
  const linkProven = r220?.linkProven === true;
  const currentActive = development?.active_job || null;
  const currentActiveIsPipeline = Boolean(
    currentActive && (currentActive.id === training?.id || currentActive.id === rcwa?.id),
  );
  const preexistingStage = activeTraining && currentActive && currentActive.id !== activeTraining.id ? currentActive : null;
  const nextActive = rcwaVerified && currentActive && currentActive.id !== rcwa?.id ? currentActive : null;
  const mode = String(development?.mode || "");
  const heartbeatRcwa = hybrid?.proof?.rcwa || hybrid?.rcwa || null;

  let state = linkProven ? "READY_TO_TRAIN" : "LINK_REQUIRED";
  if (activeTraining && preexistingStage) state = "DRAINING_EXISTING_GOVERNED_STAGE";
  else if (activeTraining?.state === "QUEUED") state = "TRAINING_QUEUED";
  else if (["LEASED", "RUNNING"].includes(String(activeTraining?.state || ""))) state = "TRAINING_RUNNING";
  else if (training && training.state === "VERIFIED" && !trainingVerified) state = "TRAINING_RECEIPT_INVALID";
  else if (training?.state === "BLOCKED") state = "TRAINING_BLOCKED";
  else if (training?.state === "FAILED") state = "TRAINING_FAILED";
  else if (training?.state === "CANCELLED") state = "TRAINING_CANCELLED";
  else if (trainingVerified && !rcwa) state = "TRAINING_VERIFIED_RCWA_READY";
  else if (activeRcwa?.state === "QUEUED") state = "RCWA_QUEUED";
  else if (["LEASED", "RUNNING"].includes(String(activeRcwa?.state || ""))) state = "RCWA_RUNNING";
  else if (rcwa && rcwa.state === "VERIFIED" && !rcwaVerified) state = "RCWA_RECEIPT_INVALID";
  else if (rcwa?.state === "BLOCKED") state = "RCWA_BLOCKED";
  else if (rcwa?.state === "FAILED") state = "RCWA_FAILED";
  else if (rcwa?.state === "CANCELLED") state = "RCWA_CANCELLED";
  else if (rcwaVerified && mode === "MANUAL") state = "RCWA_VERIFIED_NEXT_STAGE_READY";
  else if (rcwaVerified && nextActive) state = "DEVELOPMENT_ADVANCING";
  else if (rcwaVerified) state = "RCWA_VERIFIED";

  const pipelineNeedsAdvance = Boolean(
    linkProven
      && pipelineId
      && ((trainingVerified && !rcwa) || (rcwaVerified && mode === "MANUAL")),
  );

  return {
    state,
    pipelineSchema: PIPELINE_SCHEMA,
    pipelineId,
    linkProven,
    eligibleToTrain: Boolean(linkProven && !activeTraining && !activeRcwa && !pipelineNeedsAdvance),
    pipelineNeedsAdvance,
    currentDevelopmentMode: mode || null,
    trainingActive: Boolean(activeTraining),
    trainingExecutionProven: trainingVerified,
    trainingReceiptSchema: TRAINING_RECEIPT_SCHEMA,
    trainingJobId: training?.id || null,
    trainingJob: training,
    trainingEvidence: trainingVerified ? training?.evidence || null : null,
    rcwaActive: Boolean(activeRcwa),
    rcwaExecutionProven: rcwaVerified,
    rcwaChallengeSchema: RCWA_CHALLENGE_SCHEMA,
    rcwaReceiptSchema: RCWA_RECEIPT_SCHEMA,
    rcwaJobId: rcwa?.id || null,
    rcwaJob: rcwa,
    rcwaEvidence: rcwaVerified ? rcwa?.evidence || null : null,
    rcwaDependencyAtHeartbeat: heartbeatRcwa,
    rcwaDependencyAtHeartbeatIsExecutionProof: false,
    preexistingStage,
    currentActiveIsPipeline,
    nextActiveJob: nextActive,
    nextStageWired: Boolean(rcwaVerified && (nextActive || mode !== "MANUAL")),
  };
}

function truthBoundary() {
  return {
    heartbeatIsLinkProofOnly: true,
    connectedDoesNotMeanRunning: true,
    heartbeatRcwaCapabilityIsNotRcwaExecutionProof: true,
    trainingRunningRequiresLeasedSaiRepositoryIndexJob: true,
    trainingVerifiedRequiresR179TrainingReceipt: true,
    rcwaRunningRequiresLeasedR175CrossRuntimeJob: true,
    rcwaVerifiedRequiresNativeGrcwaReceipt: true,
    noReducedOrderOrScalarFallbackPromotedAsRcwa: true,
    pipelineOrdering: [
      "AUTHENTICATED_LINK",
      "DRAIN_EXISTING_GOVERNED_STAGE",
      "R179_LOCAL_REPOSITORY_TRAINING",
      "R175_HASH_BOUND_RCWA_CALIBRATION",
      "NATIVE_GRCWA_RETURN",
      "RESTORE_DEVELOPMENT_LOOP",
      "NEXT_GOVERNED_STAGE",
    ],
    exactTrainingKind: TRAINING_KIND,
    exactTrainingReceiptSchema: TRAINING_RECEIPT_SCHEMA,
    exactRcwaKind: RCWA_KIND,
    exactRcwaChallengeSchema: RCWA_CHALLENGE_SCHEMA,
    exactRcwaReceiptSchema: RCWA_RECEIPT_SCHEMA,
    rcwaCalibrationIsNumericalPipelineProofNotFabricationOrMeasurement: true,
    trainingScope: "LOCAL_REPOSITORY_INDEX_ONLY",
    foundationModelWeightsTrainedClaim: false,
    fullyTrainedClaim: false,
    arbitraryShell: false,
    arbitraryJobKind: false,
    canonicalMutation: false,
    githubMutation: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
  };
}

function calibrationQueue(pipelineId: string, trainingJobId: string): any {
  return {
    schema: "OMEGA_FULLWAVE_QUEUE_v1",
    revision: "R221",
    job_id: `r221_rcwa_calibration_${pipelineId}`,
    source_packet_id: `r221_training_${trainingJobId}`,
    solver: "rcwa",
    geometry: {
      pitch_nm: 900,
      width_nm: 900,
      length_nm: 900,
      height_nm: 300,
      theta_deg: 0,
    },
    wavelength_nm: 1550,
    polarization: "s",
    material_model: {
      n_incident: 1.0,
      n_feature: 2.0,
      n_background: 2.0,
      n_substrate: 1.45,
    },
    numerics: {
      nx: 32,
      ny: 32,
      harmonics_low: 9,
      harmonics_high: 17,
      convergence_tolerance: 0.02,
      energy_tolerance: 0.02,
      incidence_theta_deg: 0,
      incidence_phi_deg: 0,
    },
    proof: {
      gate: "STAY",
      mode188_score: 1.05,
      scope: "R221_NATIVE_RCWA_PIPELINE_CALIBRATION_FIXTURE",
    },
    lineage: [
      `r221:${pipelineId}:training:${trainingJobId}`,
      "r221:hash-bound-calibration-fixture",
      "r175:sovereign-native-grcwa",
    ],
    calibration_fixture: true,
    external_measurement_claim: false,
    fabrication_validation_claim: false,
    physical_dimension_claim: false,
    canonical_mutation: false,
  };
}

async function statusPayload(request: Request, env: any, ctx: any, nextFetch: RuntimeFetch) {
  const [r220, development, hybrid] = await Promise.all([
    callJson(nextFetch, request, env, ctx, "/api/system/r220/status"),
    callJson(nextFetch, request, env, ctx, "/api/development/status"),
    callJson(nextFetch, request, env, ctx, "/api/hybrid/status"),
  ]);
  const facts = pipelineFacts(r220.data, hybrid.data, development.data);
  return {
    ok: r220.ok && development.ok && hybrid.ok,
    status: r220.ok && development.ok && hybrid.ok ? 200 : 503,
    payload: {
      schema: SCHEMA,
      release: RELEASE,
      canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
      ...facts,
      r220: r220.data,
      hybrid: hybrid.data,
      development: development.data,
      sourceStatus: { r220: r220.status, development: development.status, hybrid: hybrid.status },
      truthBoundary: truthBoundary(),
    },
  };
}

async function advancePipeline(
  request: Request,
  env: any,
  ctx: any,
  nextFetch: RuntimeFetch,
  requestedPipelineId?: string | null,
): Promise<Response> {
  const before = await statusPayload(request, env, ctx, nextFetch);
  const facts = before.payload;
  if (!facts.linkProven) {
    return json({ ok: false, ...facts, code: "CURRENT_AUTHENTICATED_HYBRID_LINK_REQUIRED" }, 409);
  }
  if (!facts.pipelineId || (requestedPipelineId && requestedPipelineId !== facts.pipelineId)) {
    return json({ ok: false, ...facts, code: "R221_PIPELINE_ID_MISMATCH_OR_MISSING" }, 409);
  }
  if (!facts.trainingExecutionProven) {
    return json({ ok: false, ...facts, code: "R179_TRAINING_RECEIPT_REQUIRED_BEFORE_RCWA" }, 409);
  }

  if (!facts.rcwaJob) {
    const fixture = calibrationQueue(facts.pipelineId, facts.trainingJobId);
    const prepared = await callJson(nextFetch, request, env, ctx, "/api/validate/independent/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fullwave_job: fixture }),
    });
    const challenge = prepared.data?.challenge;
    if (!prepared.ok || prepared.data?.ok !== true || challenge?.schema !== RCWA_CHALLENGE_SCHEMA) {
      return json({
        ok: false,
        schema: SCHEMA,
        release: RELEASE,
        code: "R175_RCWA_CHALLENGE_PREPARATION_FAILED",
        sourceStatus: prepared.status,
        detail: prepared.data,
        pipelineId: facts.pipelineId,
        truthBoundary: truthBoundary(),
      }, prepared.status >= 400 && prepared.status < 600 ? prepared.status : 502);
    }
    const enqueue = await callJson(nextFetch, request, env, ctx, "/api/development/enqueue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: RCWA_KIND,
        reason: "R221 post-training native RCWA calibration: execute the exact hash-bound R175 full-wave fixture with grcwa on the authenticated sovereign host. No fallback, fabrication, measurement, Canon, deployment, or promotion claim is permitted.",
        payload: {
          ...challenge,
          pipeline_schema: PIPELINE_SCHEMA,
          r221_pipeline_id: facts.pipelineId,
          r221_training_job_id: facts.trainingJobId,
          r221_stage: "RCWA_NATIVE_CALIBRATION",
          calibration_fixture: true,
          canonical_mutation: false,
          deployment_authorized: false,
          promotion_authorized: false,
        },
      }),
    });
    if (!enqueue.ok) {
      return json({
        ok: false,
        schema: SCHEMA,
        release: RELEASE,
        code: "R175_RCWA_ENQUEUE_FAILED",
        sourceStatus: enqueue.status,
        detail: enqueue.data,
        pipelineId: facts.pipelineId,
        truthBoundary: truthBoundary(),
      }, enqueue.status >= 400 && enqueue.status < 600 ? enqueue.status : 502);
    }
    const after = await statusPayload(request, env, ctx, nextFetch);
    return json({ ok: true, advanced: true, stage: "RCWA_QUEUED", job: enqueue.data, ...after.payload }, 202);
  }

  if (facts.rcwaActive) {
    return json({ ok: true, advanced: false, deduplicated: true, stage: facts.state, ...facts });
  }
  if (!facts.rcwaExecutionProven) {
    return json({
      ok: false,
      ...facts,
      code: facts.rcwaJob?.state === "VERIFIED" ? "R175_NATIVE_RCWA_RECEIPT_INVALID" : "R175_NATIVE_RCWA_NOT_VERIFIED",
      detail: facts.rcwaJob,
    }, 409);
  }

  if (facts.currentDevelopmentMode === "MANUAL") {
    const mode = await callJson(nextFetch, request, env, ctx, "/api/development/mode", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "DEVELOPMENT_LOOP" }),
    });
    if (!mode.ok) {
      return json({
        ok: false,
        schema: SCHEMA,
        release: RELEASE,
        code: "DEVELOPMENT_LOOP_RESTORE_FAILED",
        detail: mode.data,
        pipelineId: facts.pipelineId,
        truthBoundary: truthBoundary(),
      }, mode.status >= 400 && mode.status < 600 ? mode.status : 502);
    }
    const after = await statusPayload(request, env, ctx, nextFetch);
    return json({
      ok: true,
      advanced: true,
      stage: "NEXT_GOVERNED_STAGE",
      resumedDevelopmentLoop: true,
      ...after.payload,
    });
  }

  return json({ ok: true, advanced: false, stage: facts.state, ...facts });
}

export async function handleGovernedLocalTrainingR221(
  request: Request,
  env: any,
  ctx: any,
  nextFetch: RuntimeFetch,
): Promise<Response | null> {
  const url = new URL(request.url);
  const isStatus = url.pathname === "/api/system/r221/status" || url.pathname === "/api/system/r221/status/";
  const isTrain = url.pathname === "/api/system/r221/train-local" || url.pathname === "/api/system/r221/train-local/";
  const isAdvance = url.pathname === "/api/system/r221/advance" || url.pathname === "/api/system/r221/advance/";
  if (!isStatus && !isTrain && !isAdvance) return null;

  if (isStatus && request.method !== "GET") {
    return json({ ok: false, schema: SCHEMA, release: RELEASE, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  }
  if ((isTrain || isAdvance) && request.method !== "POST") {
    return json({ ok: false, schema: SCHEMA, release: RELEASE, code: "METHOD_NOT_ALLOWED", allowed: ["POST"] }, 405);
  }
  if (isStatus) {
    const current = await statusPayload(request, env, ctx, nextFetch);
    return json({ ok: current.ok, ...current.payload }, current.status);
  }

  let body: any = null;
  try { body = await request.json(); } catch { body = null; }
  if (!body || body.confirmed !== true) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "EXPLICIT_CONFIRMATION_REQUIRED",
      boundary: "R221 confirmation authorizes only the bounded sequence: drain current governed stage, local R179 repository indexing, native no-fallback R175 grcwa calibration, then restoration of the ordinary governed development loop.",
      truthBoundary: truthBoundary(),
    }, 422);
  }
  if (isAdvance) return advancePipeline(request, env, ctx, nextFetch, body.pipeline_id || body.pipelineId || null);

  const before = await statusPayload(request, env, ctx, nextFetch);
  if (!before.payload.linkProven) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "CURRENT_AUTHENTICATED_HYBRID_LINK_REQUIRED",
      state: before.payload.state,
      linkProven: false,
      r220: before.payload.r220,
      truthBoundary: truthBoundary(),
    }, 409);
  }

  const existing = before.payload;
  if (existing.trainingActive || existing.rcwaActive || existing.pipelineNeedsAdvance) {
    return json({
      ok: true,
      schema: SCHEMA,
      release: RELEASE,
      queued: true,
      deduplicated: true,
      canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
      ...existing,
      truthBoundary: truthBoundary(),
    });
  }

  const manual = await callJson(nextFetch, request, env, ctx, "/api/development/mode", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "MANUAL" }),
  });
  if (!manual.ok) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "PIPELINE_ISOLATION_FAILED",
      detail: manual.data,
      truthBoundary: truthBoundary(),
    }, manual.status >= 400 && manual.status < 600 ? manual.status : 502);
  }

  const pipelineId = `r221_${crypto.randomUUID()}`;
  const enqueue = await callJson(nextFetch, request, env, ctx, "/api/development/enqueue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: TRAINING_KIND,
      reason: "R221 explicit operator pipeline: after the already-active governed stage drains, build a fresh deterministic source-grounded local repository index on the authenticated sovereign host, then require native R175 grcwa calibration before restoring the ordinary development loop.",
      payload: {
        requested_by: "R221_TRAIN_LOCALLY",
        pipeline_schema: PIPELINE_SCHEMA,
        r221_pipeline_id: pipelineId,
        r221_stage: "R179_LOCAL_REPOSITORY_TRAINING",
        canonical_git_sha: env?.CANONICAL_GIT_SHA || null,
        training_scope: "LOCAL_REPOSITORY_INDEX_ONLY",
        next_required_stage: "R175_NATIVE_RCWA_CALIBRATION",
        foundation_model_weights_trained: false,
        canonical_mutation: false,
        github_mutation: false,
        deployment_authorized: false,
        promotion_authorized: false,
      },
    }),
  });
  if (!enqueue.ok) {
    await callJson(nextFetch, request, env, ctx, "/api/development/mode", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "DEVELOPMENT_LOOP" }),
    });
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "LOCAL_TRAINING_ENQUEUE_FAILED",
      sourceStatus: enqueue.status,
      detail: enqueue.data,
      truthBoundary: truthBoundary(),
    }, enqueue.status >= 400 && enqueue.status < 600 ? enqueue.status : 502);
  }

  const after = await statusPayload(request, env, ctx, nextFetch);
  return json({
    ok: true,
    schema: SCHEMA,
    release: RELEASE,
    queued: true,
    deduplicated: false,
    pipelineId,
    canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
    ...after.payload,
    job: enqueue.data,
    truthBoundary: truthBoundary(),
  }, 202);
}

const R221_MARKER = "OMEGA_GOVERNED_LOCAL_TRAINING_SURFACE_R221";

export async function enhanceGovernedLocalTrainingR221(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const html = await response.text();
  if (!html.includes('data-view="Hybrid"') || html.includes(R221_MARKER)) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const injection = `<script id="${R221_MARKER}">(function(){
var panel=document.querySelector('[data-view="Hybrid"]');if(!panel)return;
var controls=panel.querySelector('.controls');var rail=panel.querySelector('.buildRail');if(!controls||!rail)return;
Array.from(panel.querySelectorAll('button,a')).forEach(function(el){if(el.id!=='omegaR221TrainLocal'&&/train\\s+locally/i.test(String(el.textContent||''))){el.setAttribute('data-r221-superseded','true');el.style.display='none';}});
var button=document.createElement('button');button.className='btn primary';button.id='omegaR221TrainLocal';button.textContent='Train locally + prove RCWA';button.disabled=true;controls.appendChild(button);
var card=document.createElement('div');card.id='omegaR221Training';card.className='job';card.innerHTML='<span>R221 · TRAIN → RCWA → NEXT STAGE</span><span class="muted" id="omegaR221TrainingMessage">Checking authenticated Hybrid, training and native solver state…</span><b id="omegaR221TrainingState">CHECKING</b>';rail.insertBefore(card,rail.firstChild);
var proof=document.createElement('details');proof.className='proof';proof.innerHTML='<summary>R221 training / RCWA / next-stage proof</summary><pre id="omegaR221TrainingProof">No R221 pipeline proof loaded.</pre>';var side=panel.querySelector('.hybridStage aside.panel');if(side)side.appendChild(proof);
var advancing=false;
function setState(d){var state=String(d&&d.state||'STATUS_UNAVAILABLE');var msg='Current authenticated Hybrid proof is required before the governed pipeline can start.';
if(state==='READY_TO_TRAIN')msg='PC link is current. Start the bounded R179 training → native R175 grcwa → next governed stage pipeline.';
if(state==='DRAINING_EXISTING_GOVERNED_STAGE')msg='The prior governed stage is finishing first. R221 is in MANUAL isolation so no new generic stage can jump ahead of training.';
if(state==='TRAINING_QUEUED')msg='R179 local repository training is queued. Queueing is not execution proof.';
if(state==='TRAINING_RUNNING')msg='The authenticated sovereign host leased the R179 repository-index job and is executing it.';
if(state==='TRAINING_VERIFIED_RCWA_READY')msg='R179 receipt verified. The next wired stage is the hash-bound native R175 grcwa calibration.';
if(state==='TRAINING_RECEIPT_INVALID')msg='Host returned VERIFIED but the R179 receipt contract failed. RCWA will not be started.';
if(state==='TRAINING_BLOCKED'||state==='TRAINING_FAILED'||state==='TRAINING_CANCELLED')msg='Training did not verify. RCWA and later stages remain blocked.';
if(state==='RCWA_QUEUED')msg='R175 native RCWA calibration is queued from the exact hash-bound fixture. This is not execution proof.';
if(state==='RCWA_RUNNING')msg='The sovereign host leased the R175 challenge and is running real grcwa Maxwell-RCWA with no scalar fallback.';
if(state==='RCWA_VERIFIED_NEXT_STAGE_READY')msg='Native grcwa receipt verified. R221 is restoring DEVELOPMENT_LOOP and requiring a different next governed stage.';
if(state==='RCWA_VERIFIED')msg='Native grcwa RCWA receipt verified.';
if(state==='RCWA_RECEIPT_INVALID')msg='The host returned VERIFIED but the native grcwa/receipt contract failed; RCWA remains unproven.';
if(state==='RCWA_BLOCKED')msg='Native RCWA is BLOCKED. Inspect dependency_status and native_result; no fallback is promoted.';
if(state==='RCWA_FAILED'||state==='RCWA_CANCELLED')msg='Native RCWA did not verify. The ordinary loop remains isolated until the blocker is resolved.';
if(state==='DEVELOPMENT_ADVANCING')msg='Training and native RCWA are verified; the ordinary governed development loop is resumed on a different next stage.';
document.getElementById('omegaR221TrainingState').textContent=state;document.getElementById('omegaR221TrainingMessage').textContent=msg;button.disabled=!(d&&d.eligibleToTrain===true);document.getElementById('omegaR221TrainingProof').textContent=JSON.stringify(d,null,2);}
async function advance(d){if(advancing||!d||d.pipelineNeedsAdvance!==true||!d.pipelineId)return d;advancing=true;try{var r=await fetch('/api/system/r221/advance',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmed:true,pipeline_id:d.pipelineId}),cache:'no-store'});var a=await r.json();setState(a);return a;}catch(e){var x={state:'STATUS_UNAVAILABLE',eligibleToTrain:false,error:String(e)};setState(x);return x;}finally{advancing=false;}}
async function load(){try{var r=await fetch('/api/system/r221/status',{cache:'no-store'});var d=await r.json();setState(d);if(d.pipelineNeedsAdvance===true)await advance(d);}catch(e){setState({state:'STATUS_UNAVAILABLE',eligibleToTrain:false,error:String(e)});}}
button.addEventListener('click',async function(){button.disabled=true;button.textContent='Starting train → RCWA pipeline…';try{var r=await fetch('/api/system/r221/train-local',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmed:true}),cache:'no-store'});var d=await r.json();setState(d);button.textContent=r.ok?'Pipeline queued':'Pipeline blocked';}catch(e){setState({state:'STATUS_UNAVAILABLE',eligibleToTrain:false,error:String(e)});button.textContent='Pipeline failed';}setTimeout(function(){button.textContent='Train locally + prove RCWA';load();},1800);});
load();setInterval(function(){if(document.body.contains(panel))load();},3000);
})();</script>`;

  const rendered = html.includes("</body>") ? html.replace("</body>", injection + "</body>") : html + injection;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  headers.set("x-omega-r221-surface", "governed-training-rcwa-continuity");
  return new Response(rendered, { status: response.status, statusText: response.statusText, headers });
}
