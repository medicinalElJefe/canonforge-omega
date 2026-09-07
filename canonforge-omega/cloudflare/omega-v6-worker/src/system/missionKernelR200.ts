export const MISSION_KERNEL_RELEASE_R200 = "r200-canonical-mission-kernel";
export const MISSION_KERNEL_SCHEMA_R200 = "OMEGA_CANONICAL_MISSION_R200";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;

type ModeSpec = {
  id: string;
  role: string;
  class: "LENS" | "GOVERNANCE" | "ROUTING" | "DOMAIN";
  alwaysActive: boolean;
};

type MissionTask = {
  id: string;
  phase: "OBSERVE" | "ANALYZE" | "EXECUTE" | "VERIFY" | "BUILD";
  menuId: string;
  action: string;
  payload: AnyObj;
  required: boolean;
  state: "READY" | "INPUT_REQUIRED" | "RESTORE_REQUIRED" | "WITHHELD";
  reason: string;
};

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

export const MODE_ENSEMBLE_R200: readonly ModeSpec[] = [
  { id: "FULL_OVERALL_CANON", role: "Hold the whole established canon in view before local optimization.", class: "LENS", alwaysActive: true },
  { id: "NO_NOTHING_TRUTH", role: "Suppress unsupported completion, execution, physical and authority claims.", class: "GOVERNANCE", alwaysActive: true },
  { id: "UNIFIED_COHERENCE", role: "Correlate independent organs into one state/proof interpretation.", class: "LENS", alwaysActive: true },
  { id: "DEEP_MOTHER", role: "Prefer continuity, preservation, history and scar-aware recovery.", class: "LENS", alwaysActive: true },
  { id: "HIGH_FATHER", role: "Prefer structural law, authority boundaries, validation and admission discipline.", class: "GOVERNANCE", alwaysActive: true },
  { id: "FULL_SPHERE", role: "Expand context across relevant domains, scales, frames and evidence families.", class: "LENS", alwaysActive: true },
  { id: "FORECAST", role: "Represent future alternatives separately from observed and verified state.", class: "LENS", alwaysActive: true },
  { id: "HEAVY_PRUNE", role: "Remove low-evidence, redundant, contradictory or non-actionable branches.", class: "LENS", alwaysActive: true },
  { id: "ALPHA", role: "Identify seed state, first cause, initialization and minimal viable action.", class: "LENS", alwaysActive: true },
  { id: "CRIMSON", role: "Raise priority for severe contradiction, failure, burden or urgent repair states.", class: "LENS", alwaysActive: true },
  { id: "GUIDANCE_FIELD", role: "Rank next actions by evidence, continuity, cost, reversibility and proof value.", class: "LENS", alwaysActive: true },
  { id: "MODE_188", role: "Apply S188=CΩ/(Λ+q+0.35Λq+0.05) only where source metrics exist.", class: "LENS", alwaysActive: true },
  { id: "RSC", role: "Parent→Interaction→Scar→Continuity→Compression→Skin→Interpretation→Behavior.", class: "LENS", alwaysActive: true },
  { id: "WOVEN_CONTINUITY", role: "Partition→transform→invariant carry→scar/residual carry→re-contextualize/repartition.", class: "LENS", alwaysActive: true },
  { id: "DIMENSIONAL_RELATIVITY", role: "Treat whole/part, inner/outer and representation as frame-relative roles.", class: "LENS", alwaysActive: true },
  { id: "MOTION_RELATIVITY", role: "Transform motion/time/orientation before interpreting residual change.", class: "LENS", alwaysActive: true },
  { id: "SOURCE_GROUNDING", role: "Prefer source-backed evidence and preserve provenance through synthesis.", class: "GOVERNANCE", alwaysActive: true },
  { id: "PROOF_ADMISSION", role: "Keep DISCOVERED/AUTHORIZED/AVAILABLE/INVOKED/RETURNED/VERIFIED separate.", class: "GOVERNANCE", alwaysActive: true },
  { id: "RECOVERY", role: "Route unresolved residuals and regressions into the weakest-link restoration path.", class: "ROUTING", alwaysActive: true },
  { id: "BUILD_OUT", role: "Convert admitted requirements into bounded successor/candidate work without flattening existing capability.", class: "ROUTING", alwaysActive: true },
  { id: "SWARM", role: "Use distributed workers where parallel decomposition improves execution or validation.", class: "ROUTING", alwaysActive: true },
  { id: "HYBRID", role: "Use cloud↔Genesis↔Sovereign-PC authority only when current authenticated proof exists.", class: "DOMAIN", alwaysActive: true },
  { id: "AI_SAI", role: "Use source-grounded SAI and provider AI through the existing specialist authority.", class: "DOMAIN", alwaysActive: true },
  { id: "EARTH_OBSERVATION", role: "Use real observation sources; keep observed/derived/inferred/forecast classes separate.", class: "DOMAIN", alwaysActive: true },
  { id: "OPTICAL_SOLVER", role: "Use reduced-order screening before independent/full-wave validation; never equate TMM with fabrication proof.", class: "DOMAIN", alwaysActive: true },
  { id: "TRAVERSAL", role: "Move through scale/state/address hierarchy without claiming literal physical dimensions.", class: "DOMAIN", alwaysActive: true },
] as const;

const KEYWORDS = {
  earth: ["earth", "sar", "sentinel", "nisar", "satellite", "radar", "insar", "terrain", "geospatial"],
  hybrid: ["hybrid", "pc", "device", "heartbeat", "sovereign", "host", "windows", "desktop"],
  build: ["build", "develop", "upgrade", "repair", "fix", "restore", "deploy", "package", "installer", "successor"],
  ai: ["ai", "sai", "reason", "analyze", "explain", "research", "correlate", "review", "inspect"],
  optics: ["optical", "etch", "rcwa", "fdtd", "tmm", "photon", "wave", "fabrication"],
  relativity: ["relativity", "velocity", "frame", "motion", "event"],
  continuity: ["continuity", "woven", "diffusion", "transfer", "scar", "residual"],
  proof: ["proof", "verify", "validation", "truth", "admission", "receipt"],
  recovery: ["recovery", "restore", "failed", "missing", "broken", "regression", "residual"],
  corpus: ["drive", "archive", "corpus", "ledger", "canon", "registry", "historical"],
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function includesAny(input: string, terms: readonly string[]): boolean {
  const hay = input.toLowerCase();
  return terms.some(term => hay.includes(term));
}

async function sha(value: unknown): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function readBody(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { text: raw.slice(0, 5000) }; }
}

async function verifyOperatorReceipt(result: any) {
  const given = text(result?.receiptSha256);
  if (!/^[0-9a-f]{64}$/i.test(given) || !result || typeof result !== "object") {
    return { verified: false, class: "OPERATOR_RECEIPT_SHA256_MISSING", given: given || null, recomputed: null };
  }
  const core: AnyObj = { ...result };
  delete core.receiptSha256;
  const recomputed = await sha(core);
  return {
    verified: recomputed.toLowerCase() === given.toLowerCase(),
    class: recomputed.toLowerCase() === given.toLowerCase() ? "OPERATOR_RECEIPT_SHA256_VERIFIED" : "OPERATOR_RECEIPT_SHA256_MISMATCH",
    given,
    recomputed,
  };
}

function modePriority(intent: string): string[] {
  const out: string[] = ["FULL_OVERALL_CANON", "NO_NOTHING_TRUTH", "UNIFIED_COHERENCE", "FULL_SPHERE", "PROOF_ADMISSION", "WOVEN_CONTINUITY", "GUIDANCE_FIELD"];
  const add = (...ids: string[]) => ids.forEach(id => { if (!out.includes(id)) out.push(id); });
  if (includesAny(intent, KEYWORDS.build)) add("BUILD_OUT", "RECOVERY", "HEAVY_PRUNE", "CRIMSON", "ALPHA", "SWARM");
  if (includesAny(intent, KEYWORDS.hybrid)) add("HYBRID", "MOTION_RELATIVITY", "HIGH_FATHER");
  if (includesAny(intent, KEYWORDS.earth)) add("EARTH_OBSERVATION", "DIMENSIONAL_RELATIVITY", "MOTION_RELATIVITY", "SOURCE_GROUNDING");
  if (includesAny(intent, KEYWORDS.optics)) add("OPTICAL_SOLVER", "DIMENSIONAL_RELATIVITY", "SOURCE_GROUNDING");
  if (includesAny(intent, KEYWORDS.relativity)) add("DIMENSIONAL_RELATIVITY", "MOTION_RELATIVITY");
  if (includesAny(intent, KEYWORDS.continuity)) add("RSC", "MODE_188", "DEEP_MOTHER", "RECOVERY");
  if (includesAny(intent, KEYWORDS.ai)) add("AI_SAI", "SOURCE_GROUNDING");
  if (includesAny(intent, KEYWORDS.proof)) add("HIGH_FATHER", "SOURCE_GROUNDING");
  if (includesAny(intent, KEYWORDS.recovery)) add("RECOVERY", "DEEP_MOTHER", "CRIMSON", "HEAVY_PRUNE");
  if (includesAny(intent, KEYWORDS.corpus)) add("SOURCE_GROUNDING", "MODE_188", "RSC");
  add("FORECAST");
  return out;
}

function task(id: string, phase: MissionTask["phase"], menuId: string, action: string, payload: AnyObj, required: boolean, reason: string, state: MissionTask["state"] = "READY"): MissionTask {
  return { id, phase, menuId, action, payload, required, state, reason };
}

function planTasks(intent: string, body: AnyObj): MissionTask[] {
  const tasks: MissionTask[] = [
    task("correlated-snapshot", "OBSERVE", "MENU-01", "snapshot", {}, true, "Establish one correlated runtime/state/proof baseline before specialist work."),
    task("proof-state", "VERIFY", "MENU-08", "observe", {}, true, "Read current proof/admission surface independently of later execution."),
  ];

  if (includesAny(intent, KEYWORDS.hybrid) || body.allDomains === true) {
    tasks.push(task("hybrid-host-truth", "OBSERVE", "MENU-02", "observe", {}, true, "Read V6/Genesis/Sovereign-PC convergence and authenticated heartbeat truth."));
  }
  if (includesAny(intent, KEYWORDS.corpus) || includesAny(intent, KEYWORDS.build) || body.allDomains === true) {
    tasks.push(task("corpus-registry", "ANALYZE", "MENU-03", "corpus_analyze", { table: "registry", q: text(body.corpusQuery || ""), limit: Number(body.corpusLimit || 100) }, false, "Correlate current task against recovered software/artifact corpus."));
  }
  if (includesAny(intent, KEYWORDS.recovery) || includesAny(intent, KEYWORDS.build) || body.allDomains === true) {
    tasks.push(task("recovery-residuals", "VERIFY", "MENU-11", "observe", {}, true, "Carry unresolved regressions through the preserved weakest-link restoration organ."));
  }
  if (includesAny(intent, KEYWORDS.earth) || body.earth === true || body.allDomains === true) {
    tasks.push(task("earth-observation", "OBSERVE", "MENU-03", "earth_search", {
      providers: body.earthProviders || ["sentinel1", "nisar", "umbra", "capella", "iceye"],
      days: Number(body.earthDays || 45),
      limit: Number(body.earthLimit || 16),
      ...(body.earthBbox ? { bbox: body.earthBbox } : {}),
    }, false, "Query real public SAR catalogs without promoting metadata to inferred displacement."));
  }
  if ((includesAny(intent, KEYWORDS.ai) || body.useAI !== false) && text(intent)) {
    tasks.push(task("sai-grounded-synthesis", "ANALYZE", "MENU-10", "specialist_execute", {
      operation: body.aiOperation || "sai.query",
      prompt: intent,
      ...(body.model ? { model: body.model } : {}),
      ...(body.use_sai !== undefined ? { use_sai: body.use_sai } : {}),
    }, false, "Use existing source-grounded SAI/provider authority to synthesize the mission evidence."));
  }

  const requestedOps = Array.isArray(body.operations) ? body.operations : [];
  requestedOps.forEach((op: AnyObj, i: number) => {
    const operation = text(op?.operation);
    if (!operation) return;
    const input = op?.input && typeof op.input === "object" ? op.input : {};
    const ready = Object.keys(input).length > 0 || operation.startsWith("ai.") || operation === "sai.query";
    tasks.push(task(`specialist-${i + 1}-${operation.replace(/[^a-z0-9]+/gi, "-")}`, "EXECUTE", "MENU-06", "specialist_execute", {
      operation,
      input,
      ...(op?.prompt ? { prompt: text(op.prompt) } : {}),
      ...(op?.model ? { model: op.model } : {}),
      ...(op?.use_sai !== undefined ? { use_sai: op.use_sai } : {}),
    }, Boolean(op?.required), `User-requested specialist operation ${operation}.`, ready ? "READY" : "INPUT_REQUIRED"));
  });

  if (includesAny(intent, KEYWORDS.build) || body.build === true || body.allDomains === true) {
    tasks.push(task("packaging-manifest", "BUILD", "MENU-12", "observe", {}, true, "Read governed build-candidate authority before proposing successor work."));
    const bc = body.buildCandidate && typeof body.buildCandidate === "object" ? body.buildCandidate : null;
    tasks.push(task("build-candidate", "BUILD", "MENU-12", "prepare_build_candidate", bc || {}, false,
      bc ? "Prepare a bounded R178 candidate from an exact prior warp receipt; promotion remains separate." : "Build candidate needs an exact completed warp receipt and refs before preparation.",
      bc ? "READY" : "INPUT_REQUIRED"));
  }

  return tasks;
}

async function createPlan(body: AnyObj) {
  const intent = text(body.intent || body.objective || body.prompt);
  if (!intent) throw new Error("R200_INTENT_REQUIRED");
  const createdAt = new Date().toISOString();
  const core = {
    schema: "OMEGA_MISSION_PLAN_R200",
    release: MISSION_KERNEL_RELEASE_R200,
    intent,
    createdAt,
    allModesRequested: body.allModes !== false,
    modePolicy: "ALL_CANONICAL_LENSES_ACTIVE; PRIORITY_ORDER_IS_INTENT_DEPENDENT; EXECUTION_REMAINS_SPECIALIST_ROUTED",
    modeScopeBoundary: "This registry contains the established named canonical lenses currently encoded in the runtime. Drive/corpus mode families remain source authorities and may extend the registry only through explicit recovery/admission rather than invented names.",
    activeModes: MODE_ENSEMBLE_R200.map(mode => ({ ...mode, state: "ACTIVE_LENS" })),
    priorityModes: modePriority(intent),
    tasks: planTasks(intent, body),
    truthBoundaries: {
      visualIsNotExecutionProof: true,
      returnedIsNotVerified: true,
      receiptIntegrityIsNotPhysicalValidation: true,
      modelOutputIsNotCanonState: true,
      pcOnlineRequiresAuthenticatedHeartbeat: true,
      forecastIsNotObservedState: true,
      reducedOrderIsNotFullWaveProof: true,
      buildCandidateIsNotPromotion: true,
      atlasHierarchyIsNotPhysicalDimension: true,
    },
    authority: "MISSION_PLAN_NOT_EXECUTION_NOT_CANON_MUTATION",
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, missionId: `mission_${(await sha(core)).slice(0, 24)}`, planSha256: await sha(core) };
}

async function invokeOperator(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, task: MissionTask) {
  const target = new URL(request.url);
  target.pathname = "/api/system/r199/operate";
  target.search = "";
  const started = Date.now();
  try {
    const response = await canonicalFetch(new Request(target.toString(), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ menuId: task.menuId, action: task.action, payload: task.payload }),
    }), env, ctx);
    const result = await readBody(response);
    const receiptIntegrity = await verifyOperatorReceipt(result);
    const executionState = result?.executionState || {};
    const specialistVerified = Boolean(executionState.verified || result?.verification?.verified || result?.downstream?.result?.verification?.verified || result?.downstream?.result?.executionState?.verified);
    const routeReceiptTask = task.action === "observe" || task.action === "snapshot" || task.phase === "VERIFY" || task.phase === "BUILD";
    const verified = receiptIntegrity.verified && (routeReceiptTask ? result?.downstream?.ok !== false : specialistVerified);
    return {
      task,
      status: response.status,
      ok: response.ok && result?.ok !== false && result?.downstream?.ok !== false,
      returned: Boolean(executionState.returned ?? result?.downstream?.result ?? result),
      verified,
      receiptIntegrity,
      specialistVerified,
      verificationClass: verified ? (specialistVerified ? "RECEIPT_INTEGRITY_PLUS_SPECIALIST_VERIFICATION" : "OPERATOR_ROUTE_RECEIPT_INTEGRITY") : "VERIFICATION_RESIDUAL",
      elapsedMs: Date.now() - started,
      receipt: result,
    };
  } catch (error) {
    return {
      task,
      status: 0,
      ok: false,
      returned: false,
      verified: false,
      receiptIntegrity: { verified: false, class: "OPERATOR_RECEIPT_UNAVAILABLE" },
      specialistVerified: false,
      verificationClass: "EXECUTION_ERROR",
      elapsedMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function executeMission(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, body: AnyObj) {
  const plan = await createPlan(body);
  const results: AnyObj[] = [];
  for (const t of plan.tasks as MissionTask[]) {
    if (t.state !== "READY") {
      results.push({ task: t, status: 0, ok: false, returned: false, verified: false, skipped: true, residual: t.state });
      continue;
    }
    results.push(await invokeOperator(request, env, ctx, canonicalFetch, t));
  }

  const required = results.filter(r => r.task.required);
  const requiredReturned = required.filter(r => r.returned).length;
  const requiredVerified = required.filter(r => r.verified).length;
  const receiptIntegrityVerified = results.filter(r => r.receiptIntegrity?.verified).length;
  const specialistVerified = results.filter(r => r.specialistVerified).length;
  const residuals = {
    requiredNotReturned: required.filter(r => !r.returned).map(r => r.task.id),
    requiredReturnedNotVerified: required.filter(r => r.returned && !r.verified).map(r => r.task.id),
    receiptIntegrityFailed: results.filter(r => r.task.state === "READY" && r.returned && !r.receiptIntegrity?.verified).map(r => r.task.id),
    optionalInputRequired: results.filter(r => r.task.state === "INPUT_REQUIRED").map(r => r.task.id),
    restoreRequired: results.filter(r => r.task.state === "RESTORE_REQUIRED").map(r => r.task.id),
    failed: results.filter(r => r.task.state === "READY" && !r.ok).map(r => r.task.id),
  };
  const zeroRequiredResidual = residuals.requiredNotReturned.length === 0 && residuals.requiredReturnedNotVerified.length === 0 && residuals.failed.filter(id => required.some(r => r.task.id === id)).length === 0;
  const coherence = required.length ? requiredVerified / required.length : 0;
  const core = {
    schema: MISSION_KERNEL_SCHEMA_R200,
    release: MISSION_KERNEL_RELEASE_R200,
    missionId: plan.missionId,
    planSha256: plan.planSha256,
    intent: plan.intent,
    execution: {
      progression: ["CREATED", "PLANNED", "ROUTED", "INVOKED", "RETURNED", zeroRequiredResidual ? "VERIFIED_REQUIRED_SET" : "VERIFICATION_RESIDUALS_PRESENT"],
      requiredTasks: required.length,
      requiredReturned,
      requiredVerified,
      receiptIntegrityVerified,
      specialistVerified,
      coherence,
      results,
    },
    modes: {
      allCanonicalLensesActive: true,
      activeCount: MODE_ENSEMBLE_R200.length,
      priority: plan.priorityModes,
      registry: MODE_ENSEMBLE_R200,
    },
    residuals,
    wovenContinuity: {
      operator: ["partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"],
      invariantCarry: { planSha256: plan.planSha256, requiredTaskCount: required.length },
      scarCarry: residuals,
    },
    renderProjection: {
      schema: "OMEGA_MISSION_RENDER_PROJECTION_R200",
      authority: "DERIVED_PRESENTATION_NOT_EXECUTION_AUTHORITY",
      headline: plan.intent,
      missionState: zeroRequiredResidual ? "REQUIRED_SET_VERIFIED" : "RESIDUALS_PRESENT",
      priorityModes: plan.priorityModes.slice(0, 12),
      taskStates: results.map(r => ({ id: r.task.id, phase: r.task.phase, returned: r.returned, verified: r.verified, receiptIntegrityVerified: Boolean(r.receiptIntegrity?.verified), specialistVerified: Boolean(r.specialistVerified), residual: r.residual || null })),
    },
    admission: {
      state: zeroRequiredResidual ? "ELIGIBLE_FOR_SEPARATE_ADMISSION_REVIEW" : "HOLD",
      canonicalMutation: false,
      promotionAuthorized: false,
      reason: zeroRequiredResidual ? "Required mission route receipts are integrity-verified; any specialist/physical claim still requires its specialist verification class and separate canon/promotion authority." : "Required execution/verification residuals remain.",
    },
    truthBoundaries: plan.truthBoundaries,
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, missionReceiptSha256: await sha(core) };
}

async function manifest() {
  const core = {
    ok: true,
    schema: "OMEGA_MISSION_KERNEL_MANIFEST_R200",
    release: MISSION_KERNEL_RELEASE_R200,
    purpose: "Compose one canonical mission packet above R199/R195/R178 authorities without duplicating specialist engines.",
    modes: MODE_ENSEMBLE_R200,
    modeCount: MODE_ENSEMBLE_R200.length,
    modeScopeBoundary: "Established named canonical lens registry; source corpus can extend only through explicit recovery/admission.",
    endpoints: ["/api/mission/r200/manifest", "/api/mission/r200/plan", "/api/mission/r200/execute"],
    missionFlow: ["INTENT", "CANONICAL_PLAN", "ALL_MODE_LENS_ENSEMBLE", "SPECIALIST_ROUTING", "EXECUTION_RECEIPTS", "RECEIPT_INTEGRITY_VERIFICATION", "SPECIALIST_VERIFICATION", "RESIDUAL_CARRY", "RENDER_PROJECTION", "SEPARATE_ADMISSION"],
    upstreamAuthorities: ["R199_ONE_SYSTEM_OPERATOR", "R195_SPECIALIST_EXECUTION", "R198_EARTH_SOURCES", "R178_BUILD_CANDIDATE", "R190_PROOF_ADMISSION"],
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await sha(core) };
}

export async function handleMissionKernelR200(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (!path.startsWith("/api/mission/r200")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
  try {
    if (path === "/api/mission/r200/manifest" && request.method === "GET") return json(await manifest());
    if (path === "/api/mission/r200/plan" && request.method === "POST") return json(await createPlan(await request.json().catch(() => ({})) as AnyObj), 201);
    if (path === "/api/mission/r200/execute" && request.method === "POST") return json(await executeMission(request, env, ctx, canonicalFetch, await request.json().catch(() => ({})) as AnyObj), 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ ok: false, schema: "OMEGA_MISSION_KERNEL_ERROR_R200", release: MISSION_KERNEL_RELEASE_R200, code: message === "R200_INTENT_REQUIRED" ? message : "R200_MISSION_FAILED", error: message, canonicalMutation: false, promotionAuthorized: false }, message === "R200_INTENT_REQUIRED" ? 422 : 500);
  }
  return json({ ok: false, code: "R200_ROUTE_NOT_FOUND", routes: ["/api/mission/r200/manifest", "/api/mission/r200/plan", "/api/mission/r200/execute"] }, 404);
}
