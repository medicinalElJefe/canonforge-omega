import { AnyObj, SwarmEnv, clip, jsonResponse } from "./swarmCoreR169";
import { handleWarpComputationRequest } from "./warpComputationR176";

export const WARP_BUILD_CANDIDATE_REVISION_R178 = "R178";
export const WARP_BUILD_CANDIDATE_SCHEMA_R178 = "OMEGA_WARP_BUILD_CANDIDATE_R178";
export const WARP_BUILD_IMPORT_SCHEMA_R178 = "OMEGA_SOVEREIGN_WARP_CANDIDATE_JOB_R178";
export const WARP_BUILD_CANDIDATE_AUTHORITY_R178 = "CANDIDATE_NOT_CANON";
export const WARP_BUILD_CANDIDATE_BOUNDARY_R178 = "R178 converts an exactly accounted R177 software-warp receipt into a bounded candidate capsule. The capsule may enter the existing authenticated Sovereign allow-listed validation loop, but it grants no source mutation, GitHub mutation, deployment, CanonState mutation, or promotion authority. 12/144/1728/20736 remain software address/execution-resolution levels, not physical dimensions.";

export const R178_CANDIDATE_ACTIONS = Object.freeze([
  "prepare_candidate",
  "run_tests",
  "build_vite",
  "wrangler_dry_run",
  "verify_candidate",
]);

export const R178_EXECUTABLE_IMPORT_ACTIONS = Object.freeze([
  "run_tests",
  "build_vite",
  "wrangler_dry_run",
  "verify_candidate",
]);

export const R178_CAPABILITY_DIMENSIONS = Object.freeze([
  "SOFTWARE",
  "TEST",
  "UI",
  "FEDERATION",
  "SOVEREIGN",
  "PROOF",
  "DATA",
  "RESEARCH",
  "VISUAL",
  "COMPUTE",
  "RECOVERY",
  "COORDINATION",
]);

function stableValue(value: any): any {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    const out: AnyObj = {};
    for (const key of Object.keys(value).sort()) out[key] = stableValue(value[key]);
    return out;
  }
  return value;
}

export function canonicalJsonR178(value: any): string {
  return JSON.stringify(stableValue(value));
}

export async function canonicalShaR178(value: any): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJsonR178(value)));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function isHash64(value: any): boolean {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}

function desiredDimensions(raw: any): string[] {
  const allow = new Set<string>(R178_CAPABILITY_DIMENSIONS as readonly string[]);
  const source = Array.isArray(raw) ? raw : R178_CAPABILITY_DIMENSIONS;
  const out: string[] = [];
  for (const item of source) {
    const value = String(item || "").trim().toUpperCase();
    if (allow.has(value) && !out.includes(value)) out.push(value);
  }
  return out.length ? out : [...R178_CAPABILITY_DIMENSIONS];
}

function strictSourceGate(status: AnyObj): { ok: boolean; reason?: string; receipt?: AnyObj } {
  if (!status || status.ok !== true) return { ok: false, reason: "SOURCE_WARP_STATUS_UNAVAILABLE" };
  if (status.state !== "COMPLETE") return { ok: false, reason: `SOURCE_WARP_NOT_COMPLETE:${String(status.state || "UNKNOWN")}` };
  if (status.integrityRevision !== "R177") return { ok: false, reason: "SOURCE_WARP_NOT_R177_INTEGRITY" };
  const total = Number(status.totalCells || 0), completed = Number(status.completedCells || 0), failed = Number(status.failedCells || 0);
  if (!(total > 0) || completed !== total || failed !== 0) return { ok: false, reason: `SOURCE_WARP_NOT_EXACT:${completed}+${failed}/${total}` };
  const invariant = status.completionInvariant || {};
  if (invariant.strict !== true || invariant.allShardsAccounted !== true || Number(invariant.accountedCells) !== total || Number(invariant.delta) !== 0 || Number(invariant.invalidShardCount) !== 0) return { ok: false, reason: "SOURCE_WARP_COMPLETION_INVARIANT_INVALID" };
  const receipt = status.receipt || {};
  if (receipt.schema !== "OMEGA_WARP_EXECUTION_RECEIPT_R176" || receipt.integrityRevision !== "R177" || receipt.strictCompletionInvariant !== true) return { ok: false, reason: "SOURCE_WARP_RECEIPT_NOT_R177_STRICT" };
  if (receipt.totalCells !== total || receipt.completedCells !== total || Number(receipt.failedCells || 0) !== 0) return { ok: false, reason: "SOURCE_WARP_RECEIPT_ACCOUNTING_MISMATCH" };
  if (receipt.proofState !== "RETURNED_NOT_ADMITTED" || receipt.authority !== "WARP_EXECUTION_RECEIPT_NOT_CANON" || receipt.canonicalMutation !== false) return { ok: false, reason: "SOURCE_WARP_RECEIPT_AUTHORITY_INVALID" };
  if (receipt.performanceGuaranteeClaim !== false || receipt.physicalDimensionClaim !== false) return { ok: false, reason: "SOURCE_WARP_RECEIPT_TRUTH_BOUNDARY_INVALID" };
  if (!isHash64(receipt.resultMerkleRoot) || !isHash64(receipt.receiptSha256)) return { ok: false, reason: "SOURCE_WARP_RECEIPT_HASH_IDENTITY_INVALID" };
  return { ok: true, receipt };
}

async function statusFromSession(body: AnyObj, env: SwarmEnv): Promise<AnyObj> {
  const session = {
    warpId: clip(body.warpId || body.warp_id, 220),
    profile: clip(body.profile, 24) || "PULSE",
    purpose: clip(body.purpose, 24) || "BUILD",
    refs: Array.isArray(body.refs) ? body.refs : [],
  };
  const response = await handleWarpComputationRequest(new Request("https://omega.internal/api/swarm/warp/status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(session),
  }), env);
  return await response.json().catch(() => ({ ok: false, state: "STATUS_DECODE_FAILED" })) as AnyObj;
}

function actionReason(kind: string): string {
  const reasons: Record<string, string> = {
    prepare_candidate: "Persist the immutable R178 capsule identity as candidate state; no source edit or deployment authority is granted.",
    run_tests: "Run the complete Sovereign Python regression suite against the approved workspace.",
    build_vite: "Reconfirm the Cloudflare/Vite TypeScript interface boundary.",
    wrangler_dry_run: "Package the Worker with Wrangler dry-run only; never deploy from this candidate stage.",
    verify_candidate: "Re-run candidate verification, computation truth and workspace evidence for separate release review.",
  };
  return reasons[kind] || "Governed candidate validation stage.";
}

async function createCandidate(body: AnyObj, env: SwarmEnv): Promise<Response> {
  const objective = clip(body.objective || body.intent, 6000);
  if (!objective) return jsonResponse({ ok: false, code: "R178_OBJECTIVE_REQUIRED", canonicalMutation: false }, 400);
  if (!Array.isArray(body.refs) || !body.refs.length) return jsonResponse({ ok: false, code: "R178_WARP_SESSION_REFS_REQUIRED", canonicalMutation: false }, 400);

  const sourceStatus = await statusFromSession(body, env);
  const gate = strictSourceGate(sourceStatus);
  if (!gate.ok || !gate.receipt) return jsonResponse({
    ok: false,
    schema: "OMEGA_WARP_BUILD_CANDIDATE_GATE_R178",
    revision: WARP_BUILD_CANDIDATE_REVISION_R178,
    code: "R178_SOURCE_RECEIPT_REJECTED",
    reason: gate.reason,
    sourceStatus: {
      warpId: sourceStatus?.warpId || null,
      state: sourceStatus?.state || null,
      integrityRevision: sourceStatus?.integrityRevision || null,
      totalCells: sourceStatus?.totalCells ?? null,
      completedCells: sourceStatus?.completedCells ?? null,
      failedCells: sourceStatus?.failedCells ?? null,
    },
    canonicalMutation: false,
    truthBoundary: WARP_BUILD_CANDIDATE_BOUNDARY_R178,
  }, 409);

  const receipt = gate.receipt;
  const objectiveSha256 = await canonicalShaR178(objective);
  const sourceReceiptCanonicalSha256 = await canonicalShaR178(receipt);
  const candidateId = `warp_candidate_${String(receipt.receiptSha256).slice(0, 12)}_${objectiveSha256.slice(0, 12)}`;
  const capabilities = desiredDimensions(body.desiredCapabilities || body.capabilityDimensions);
  const source = {
    warpId: receipt.warpId,
    profile: receipt.profile,
    purpose: receipt.purpose,
    integrityRevision: "R177",
    totalCells: receipt.totalCells,
    completedCells: receipt.completedCells,
    failedCells: receipt.failedCells,
    shardCount: receipt.shardCount,
    resultMerkleRoot: receipt.resultMerkleRoot,
    receiptSha256: receipt.receiptSha256,
  };
  const actions = R178_CANDIDATE_ACTIONS.map((kind, index) => ({
    order: index + 1,
    kind,
    authority: "ALLOW_LISTED_SOVEREIGN_JOB_NOT_RELEASE_AUTHORITY",
    reason: actionReason(kind),
  }));
  const core: AnyObj = {
    schema: WARP_BUILD_CANDIDATE_SCHEMA_R178,
    revision: WARP_BUILD_CANDIDATE_REVISION_R178,
    candidateId,
    objective,
    objectiveSha256,
    source,
    sourceReceipt: receipt,
    sourceReceiptCanonicalSha256,
    capabilityDelta: {
      targetDimensions: capabilities,
      requestedCount: capabilities.length,
      mode: "ADDITIVE_SUCCESSOR",
      preserveExistingCapabilities: true,
      noFlattening: true,
    },
    actions,
    validationPlan: {
      sequence: [...R178_CANDIDATE_ACTIONS],
      requiresAuthenticatedSovereignHost: true,
      sourceMutationDuringPreparation: false,
      deploymentDuringValidation: false,
      promotionRequiresSeparateAuthority: true,
    },
    lineage: {
      sourceWarpId: receipt.warpId,
      sourceResultMerkleRoot: receipt.resultMerkleRoot,
      sourceReceiptSha256: receipt.receiptSha256,
      sourceReceiptCanonicalSha256,
      continuity: "strict R177 receipt -> R178 candidate capsule -> sovereign allow-listed validation -> separate promotion decision",
    },
    authority: WARP_BUILD_CANDIDATE_AUTHORITY_R178,
    canonicalMutation: false,
    sourceMutationAuthorized: false,
    githubMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
    physicalDimensionClaim: false,
    performanceGuaranteeClaim: false,
    truthBoundary: WARP_BUILD_CANDIDATE_BOUNDARY_R178,
  };
  const candidate = { ...core, capsuleSha256: await canonicalShaR178(core) };
  const firstExecutableIndex = 1;
  const sovereignPayload = {
    schema: WARP_BUILD_IMPORT_SCHEMA_R178,
    revision: WARP_BUILD_CANDIDATE_REVISION_R178,
    candidate_id: candidate.candidateId,
    candidate_sha256: candidate.capsuleSha256,
    source_warp_id: candidate.source.warpId,
    source_receipt_sha256: candidate.source.receiptSha256,
    sequence: [...R178_CANDIDATE_ACTIONS],
    sequence_index: firstExecutableIndex,
    candidate,
    canonical_mutation: false,
    deployment_authorized: false,
    promotion_authorized: false,
  };
  const sovereignEnqueue = {
    method: "POST",
    path: "/api/development/enqueue",
    body: {
      kind: R178_CANDIDATE_ACTIONS[firstExecutableIndex],
      reason: "R178 validate this strict R177 warp-derived candidate lineage through the authenticated Sovereign regression pipeline before any source mutation is considered.",
      payload: sovereignPayload,
    },
    requiresSovereignGateway: true,
    automaticSubmission: false,
    authority: "BOUNDED_ENQUEUE_CONTRACT_NOT_EXECUTION_PROOF",
  };
  return jsonResponse({
    ok: true,
    schema: "OMEGA_WARP_BUILD_CANDIDATE_RESPONSE_R178",
    revision: WARP_BUILD_CANDIDATE_REVISION_R178,
    sourceGate: {
      exactCompletion: true,
      strictR177Integrity: true,
      zeroFailedCells: true,
      sourceReceiptCanonicalSha256,
    },
    candidate,
    sovereignEnqueue,
    executableValidationSequence: [...R178_EXECUTABLE_IMPORT_ACTIONS],
    canonicalMutation: false,
    sourceMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
    truthBoundary: WARP_BUILD_CANDIDATE_BOUNDARY_R178,
  }, 201);
}

export async function handleWarpBuildCandidateRequest(request: Request, env: SwarmEnv): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/swarm/build/manifest") return jsonResponse({
    ok: true,
    schema: "OMEGA_WARP_BUILD_CANDIDATE_MANIFEST_R178",
    revision: WARP_BUILD_CANDIDATE_REVISION_R178,
    sourceRequirement: "exact R177 strict warp receipt with completedCells == totalCells and failedCells == 0",
    candidateSchema: WARP_BUILD_CANDIDATE_SCHEMA_R178,
    sourceReceiptSchema: "OMEGA_WARP_EXECUTION_RECEIPT_R176",
    sourceIntegrityRevision: "R177",
    capabilityDimensions: R178_CAPABILITY_DIMENSIONS,
    candidateActions: R178_CANDIDATE_ACTIONS,
    executableImportActions: R178_EXECUTABLE_IMPORT_ACTIONS,
    sovereignEnqueuePath: "/api/development/enqueue",
    canonicalMutation: false,
    sourceMutationAuthorized: false,
    githubMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
    truthBoundary: WARP_BUILD_CANDIDATE_BOUNDARY_R178,
  });
  if (request.method === "POST" && path === "/api/swarm/build/candidate") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    try { return await createCandidate(body, env); }
    catch (error) {
      return jsonResponse({
        ok: false,
        schema: "OMEGA_WARP_BUILD_CANDIDATE_ERROR_R178",
        revision: WARP_BUILD_CANDIDATE_REVISION_R178,
        code: "R178_CANDIDATE_BUILD_FAILED",
        error: error instanceof Error ? error.message : String(error),
        canonicalMutation: false,
        truthBoundary: WARP_BUILD_CANDIDATE_BOUNDARY_R178,
      }, 400);
    }
  }
  return jsonResponse({ ok: false, code: "NOT_FOUND", revision: WARP_BUILD_CANDIDATE_REVISION_R178, canonicalMutation: false }, 404);
}
