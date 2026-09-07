import { AnyObj, jsonResponse } from "./swarmCoreR169";
import { canonicalShaR178 } from "./warpBuildCandidateR178";
import { evaluateSuccessorR183, SUCCESSOR_METRIC_WEIGHTS_R183 } from "./successorGateR183";

export const IMPROVEMENT_REVISION_R184 = "R184";
export const IMPROVEMENT_SCHEMA_R184 = "OMEGA_IMPROVEMENT_DISCOVERY_R184";
export const DESIGN_OUTPUT_SCHEMA_R184 = "OMEGA_IMPROVEMENT_DESIGN_OUTPUT_R184";
export const RELEASE_INTENT_SCHEMA_R184 = "OMEGA_IMMEDIATE_RELEASE_INTENT_R184";

const REQUIRED_CONNECTIONS = Object.freeze([
  "canonicalEdge",
  "swarm",
  "genesisMachine",
  "opticalMachine",
  "sovereignHost",
  "sai",
]);

function hash64(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}
function gitSha(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{40,64}$/i.test(value);
}
function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(x => String(x || "").trim()).filter(Boolean))];
}

async function validateDesignOutputR184(body: AnyObj, evaluation: AnyObj): Promise<AnyObj> {
  const mission = body?.mission || {};
  const candidate = body?.candidate || {};
  const predecessor = body?.predecessor || {};
  const design = body?.designOutput || {};
  const blockers: string[] = [];
  const expectedMissionSha = await canonicalShaR178(mission);

  if (mission?.exactBuildDevelopment !== true) blockers.push("MISSION_NOT_EXACT_BUILD_DEVELOPMENT");
  if (!String(mission?.objective || "").trim()) blockers.push("MISSION_OBJECTIVE_REQUIRED");
  if (design?.schema !== DESIGN_OUTPUT_SCHEMA_R184) blockers.push("DESIGN_OUTPUT_SCHEMA_INVALID");
  if (!gitSha(design?.sourceCommitSha)) blockers.push("DESIGN_SOURCE_COMMIT_SHA_INVALID");
  if (!String(design?.sourceBranch || "").trim()) blockers.push("DESIGN_SOURCE_BRANCH_REQUIRED");
  if (design?.sourceCommitSha === predecessor?.canonicalGitSha) blockers.push("DESIGN_SOURCE_MUST_DIFFER_FROM_PREDECESSOR");
  if (design?.predecessorCanonicalGitSha !== predecessor?.canonicalGitSha) blockers.push("DESIGN_PREDECESSOR_SHA_MISMATCH");
  if (design?.candidateSha256 !== candidate?.capsuleSha256) blockers.push("DESIGN_CANDIDATE_HASH_MISMATCH");
  if (design?.missionSha256 !== expectedMissionSha) blockers.push("DESIGN_MISSION_HASH_MISMATCH");
  if (!hash64(design?.diffSha256)) blockers.push("DESIGN_DIFF_HASH_INVALID");
  if (!hash64(design?.artifactSha256)) blockers.push("DESIGN_ARTIFACT_HASH_INVALID");
  const changedFiles = strings(design?.changedFiles);
  if (!changedFiles.length) blockers.push("DESIGN_CHANGED_FILES_REQUIRED");
  const evidence = strings(design?.evidenceSha256);
  if (!evidence.length || evidence.some(x => !hash64(x))) blockers.push("DESIGN_EVIDENCE_HASHES_INVALID");

  const metricEvidence = design?.metricEvidence || {};
  const missingMetricEvidence = Object.keys(SUCCESSOR_METRIC_WEIGHTS_R183).filter(key => !hash64(metricEvidence?.[key]));
  if (missingMetricEvidence.length) blockers.push(`METRIC_EVIDENCE_INCOMPLETE:${missingMetricEvidence.join(",")}`);

  const connectionEvidence = design?.connectionEvidence || {};
  const missingConnectionEvidence = REQUIRED_CONNECTIONS.filter(key => !hash64(connectionEvidence?.[key]));
  if (missingConnectionEvidence.length) blockers.push(`CONNECTION_EVIDENCE_INCOMPLETE:${missingConnectionEvidence.join(",")}`);

  for (const field of ["canonicalMutation", "githubMutationAuthorized", "deploymentAuthorized", "promotionAuthorized"]) {
    if (design?.[field] !== false) blockers.push(`DESIGN_${field.toUpperCase()}_MUST_BE_FALSE`);
  }
  if (evaluation?.predecessorCanonicalGitSha !== design?.predecessorCanonicalGitSha) blockers.push("EVALUATION_PREDECESSOR_IDENTITY_MISMATCH");
  if (evaluation?.candidateSha256 !== design?.candidateSha256) blockers.push("EVALUATION_CANDIDATE_IDENTITY_MISMATCH");

  const core = {
    schema: "OMEGA_DESIGN_OUTPUT_VALIDATION_R184",
    revision: IMPROVEMENT_REVISION_R184,
    valid: blockers.length === 0,
    missionSha256: expectedMissionSha,
    sourceBranch: design?.sourceBranch || null,
    sourceCommitSha: design?.sourceCommitSha || null,
    predecessorCanonicalGitSha: design?.predecessorCanonicalGitSha || null,
    candidateSha256: design?.candidateSha256 || null,
    diffSha256: design?.diffSha256 || null,
    artifactSha256: design?.artifactSha256 || null,
    changedFiles,
    evidenceSha256: evidence,
    metricEvidenceComplete: missingMetricEvidence.length === 0,
    connectionEvidenceComplete: missingConnectionEvidence.length === 0,
    blockers,
    authority: "DESIGN_OUTPUT_VALIDATION_NOT_CANON",
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await canonicalShaR178(core) };
}

function designContinuation(validation: AnyObj, candidate: AnyObj): AnyObj {
  return {
    continueDevelopment: true,
    nextMission: {
      priority: "DEVELOPMENT",
      projection: "BUILD",
      mode: "PULSE",
      requestedCells: 12,
      providerBudget: 0,
      branchConcurrency: 1,
      allowFullAuto: false,
      operatorAuthorizedFull: false,
      expansionProof: { previousStageVerified: false },
      intent: `Complete the exact R184 design-output identity for ${String(candidate?.candidateId || "candidate")}. Resolve: ${(validation?.blockers || []).join(", ")}. Preserve the predecessor and all admitted capabilities; return hash-bound evidence and do not self-promote.`,
    },
    authority: "R184_DESIGN_CONTINUATION_THROUGH_R180_GOVERNOR_NOT_EXECUTION_AUTHORITY",
  };
}

export async function discoverImprovementR184(body: AnyObj = {}): Promise<AnyObj> {
  const evaluation = await evaluateSuccessorR183(body);
  const designValidation = await validateDesignOutputR184(body, evaluation);
  const releaseReady = evaluation?.promotionReady === true && designValidation.valid === true;

  const base = {
    ok: true,
    schema: IMPROVEMENT_SCHEMA_R184,
    revision: IMPROVEMENT_REVISION_R184,
    state: releaseReady ? "DISCOVERED_SUPERIOR_DESIGN_OUTPUT" : "CONTINUE_SHAPING",
    discoveredSuperiorDesign: releaseReady,
    successorEvaluation: evaluation,
    designValidation,
    continuousDevelopment: !releaseReady,
    canonicalMutation: false,
    githubMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
    authority: "IMPROVEMENT_DISCOVERY_RECEIPT_NOT_CANON",
  };

  if (!releaseReady) {
    return {
      ...base,
      releaseIntent: null,
      continuation: evaluation?.continuation || designContinuation(designValidation, body?.candidate || {}),
    };
  }

  const design = body.designOutput;
  const mission = body.mission;
  const releaseCore = {
    schema: RELEASE_INTENT_SCHEMA_R184,
    revision: IMPROVEMENT_REVISION_R184,
    missionSha256: designValidation.missionSha256,
    missionObjective: String(mission.objective),
    predecessorCanonicalGitSha: design.predecessorCanonicalGitSha,
    sourceBranch: design.sourceBranch,
    sourceCommitSha: design.sourceCommitSha,
    candidateSha256: design.candidateSha256,
    diffSha256: design.diffSha256,
    artifactSha256: design.artifactSha256,
    changedFiles: designValidation.changedFiles,
    evidenceSha256: designValidation.evidenceSha256,
    metricEvidence: design.metricEvidence,
    connectionEvidence: design.connectionEvidence,
    successorPromotionPacket: evaluation.promotionPacket,
    targetReleaseAuthority: "omega-v6-full-convergence",
    nextAction: "OPEN_OR_UPDATE_RELEASE_PR_FOR_EXACT_SOURCE_COMMIT_THEN_R182_VERIFY_DEPLOY_EXACT_SHA_AND_POST_DEPLOY_PROOF",
    authority: "RELEASE_INTENT_NOT_RELEASE_AUTHORITY",
    canonicalMutation: false,
    githubMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
  };
  return {
    ...base,
    releaseIntent: { ...releaseCore, packetSha256: await canonicalShaR178(releaseCore) },
    continuation: null,
  };
}

export async function handleImprovementDiscoveryR184(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/swarm/improvement/r184/manifest") return jsonResponse({
    ok: true,
    schema: "OMEGA_IMPROVEMENT_DISCOVERY_MANIFEST_R184",
    revision: IMPROVEMENT_REVISION_R184,
    designOutputSchema: DESIGN_OUTPUT_SCHEMA_R184,
    releaseIntentSchema: RELEASE_INTENT_SCHEMA_R184,
    synchronousDiscoveryOnEvaluationReceipt: true,
    exactMissionHashRequired: true,
    exactPredecessorShaRequired: true,
    exactCandidateHashRequired: true,
    exactSourceCommitAndDiffRequired: true,
    allR183MetricEvidenceRequired: true,
    requiredConnectionEvidence: REQUIRED_CONNECTIONS,
    continuousShapingOnFailure: true,
    automaticCanonicalPromotion: false,
    boundary: "R184 turns a superior R183 successor into an exact, hash-bound design-output release intent synchronously when the evidence arrives. It cannot fabricate improvement, mutate GitHub/Canon, or deploy itself. Incomplete or inferior states return a bounded continuation mission rather than stopping.",
    canonicalMutation: false,
    promotionAuthorized: false,
  });
  if (request.method === "POST" && path === "/api/swarm/improvement/r184/discover") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    try { return jsonResponse(await discoverImprovementR184(body)); }
    catch (error) { return jsonResponse({ ok: false, schema: IMPROVEMENT_SCHEMA_R184, revision: IMPROVEMENT_REVISION_R184, error: error instanceof Error ? error.message : String(error), canonicalMutation: false, promotionAuthorized: false }, 400); }
  }
  return jsonResponse({ ok: false, code: "NOT_FOUND", revision: IMPROVEMENT_REVISION_R184, canonicalMutation: false }, 404);
}
