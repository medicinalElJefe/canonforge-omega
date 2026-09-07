import { AnyObj, jsonResponse } from "./swarmCoreR169";
import { canonicalShaR178 } from "./warpBuildCandidateR178";

export const SUCCESSOR_REVISION_R183 = "R183";
export const SUCCESSOR_SCHEMA_R183 = "OMEGA_SUCCESSOR_SUPERIORITY_R183";
export const SUCCESSOR_PROMOTION_SCHEMA_R183 = "OMEGA_SUCCESSOR_PROMOTION_PACKET_R183";
export const SUCCESSOR_SCAR_SCHEMA_R183 = "OMEGA_SUCCESSOR_SCAR_PACKET_R183";

export const SUCCESSOR_METRIC_WEIGHTS_R183 = Object.freeze({
  correctness: 0.18,
  regressionSafety: 0.14,
  missionFit: 0.13,
  proofCoverage: 0.12,
  capabilityCoverage: 0.10,
  interactiveEfficiency: 0.08,
  resourceEfficiency: 0.06,
  recoverability: 0.06,
  continuity: 0.06,
  federationConnectivity: 0.04,
  sovereignConnectivity: 0.03,
});

const HARD_NON_REGRESSION_METRICS = Object.freeze([
  "correctness",
  "regressionSafety",
  "proofCoverage",
  "recoverability",
  "continuity",
  "federationConnectivity",
  "sovereignConnectivity",
]);

const REQUIRED_VERIFICATION_STAGES = Object.freeze([
  "run_tests",
  "build_vite",
  "wrangler_dry_run",
  "verify_candidate",
]);

const REQUIRED_CONNECTIONS = Object.freeze([
  "canonicalEdge",
  "swarm",
  "genesisMachine",
  "opticalMachine",
  "sovereignHost",
  "sai",
]);

function clamp01(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : NaN;
}
function isHash64(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}
function isGitSha(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{40,64}$/i.test(value);
}
function uniqueStrings(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const value = String(item || "").trim();
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
}
function metricVector(raw: AnyObj = {}): { values: AnyObj; missing: string[] } {
  const values: AnyObj = {}, missing: string[] = [];
  for (const key of Object.keys(SUCCESSOR_METRIC_WEIGHTS_R183)) {
    const value = clamp01(raw?.[key]);
    if (!Number.isFinite(value)) missing.push(key);
    else values[key] = value;
  }
  return { values, missing };
}
function weightedScore(values: AnyObj): number {
  let score = 0;
  for (const [key, weight] of Object.entries(SUCCESSOR_METRIC_WEIGHTS_R183)) score += Number(values[key] || 0) * Number(weight);
  return score;
}

async function candidateIdentity(candidate: AnyObj): Promise<{ ok: boolean; reasons: string[]; hash: string | null }> {
  const reasons: string[] = [];
  if (candidate?.schema !== "OMEGA_WARP_BUILD_CANDIDATE_R178") reasons.push("CANDIDATE_SCHEMA_NOT_R178");
  if (candidate?.revision !== "R178") reasons.push("CANDIDATE_REVISION_NOT_R178");
  if (candidate?.authority !== "CANDIDATE_NOT_CANON") reasons.push("CANDIDATE_AUTHORITY_INVALID");
  for (const field of ["canonicalMutation", "sourceMutationAuthorized", "githubMutationAuthorized", "deploymentAuthorized", "promotionAuthorized"]) {
    if (candidate?.[field] !== false) reasons.push(`CANDIDATE_${field.toUpperCase()}_MUST_BE_FALSE`);
  }
  const supplied = candidate?.capsuleSha256;
  if (!isHash64(supplied)) reasons.push("CANDIDATE_CAPSULE_HASH_INVALID");
  else {
    const core = { ...candidate };
    delete core.capsuleSha256;
    const calculated = await canonicalShaR178(core);
    if (calculated !== supplied) reasons.push("CANDIDATE_CAPSULE_HASH_MISMATCH");
  }
  return { ok: reasons.length === 0, reasons, hash: isHash64(supplied) ? String(supplied) : null };
}

function verificationTruth(raw: AnyObj = {}): AnyObj {
  const stages = Array.isArray(raw?.stages) ? raw.stages : [];
  const byKind = new Map<string, AnyObj>();
  for (const row of stages) if (row && typeof row === "object") byKind.set(String(row.kind || ""), row);
  const missing: string[] = [], invalidEvidence: string[] = [];
  for (const kind of REQUIRED_VERIFICATION_STAGES) {
    const row = byKind.get(kind);
    if (!row || String(row.state || "").toUpperCase() !== "VERIFIED") missing.push(kind);
    else if (!isHash64(row.evidenceSha256)) invalidEvidence.push(kind);
  }
  return {
    complete: missing.length === 0 && invalidEvidence.length === 0,
    required: [...REQUIRED_VERIFICATION_STAGES],
    missing,
    invalidEvidence,
    evidenceHashes: REQUIRED_VERIFICATION_STAGES.map(kind => byKind.get(kind)?.evidenceSha256 || null),
  };
}

function connectionTruth(raw: AnyObj = {}): AnyObj {
  const missing = REQUIRED_CONNECTIONS.filter(key => raw?.[key] !== true);
  return { complete: missing.length === 0, required: [...REQUIRED_CONNECTIONS], missing, observed: Object.fromEntries(REQUIRED_CONNECTIONS.map(key => [key, raw?.[key] === true])) };
}

function buildContinuation(deficits: string[], candidate: AnyObj, scoreDelta: number, scarSeverity: number): AnyObj {
  const target = deficits.length ? deficits.join(", ") : "material mission-fit improvement";
  return {
    continueDevelopment: true,
    nextMission: {
      priority: "DEVELOPMENT",
      projection: "BUILD",
      mode: scarSeverity >= 0.35 ? "PULSE" : "AUTO",
      requestedCells: scarSeverity >= 0.35 ? 12 : 144,
      providerBudget: scarSeverity >= 0.35 ? 0 : 2,
      branchConcurrency: scarSeverity >= 0.35 ? 1 : 3,
      allowFullAuto: false,
      operatorAuthorizedFull: false,
      intent: `Advance ${String(candidate?.candidateId || "R178 candidate")} as an additive successor. Preserve every admitted capability and resolve these measured deficits before re-evaluation: ${target}. Current weighted successor delta=${scoreDelta.toFixed(6)}. Return proof receipts; do not mutate Canon or self-promote.`,
      expansionProof: { previousStageVerified: false },
    },
    authority: "CONTINUATION_PROPOSAL_THROUGH_R180_GOVERNOR_NOT_EXECUTION_AUTHORITY",
  };
}

export async function evaluateSuccessorR183(body: AnyObj = {}): Promise<AnyObj> {
  const candidate = body?.candidate || {};
  const predecessor = body?.predecessor || {};
  const successor = body?.successor || {};
  const policy = body?.policy || {};
  const regressionTolerance = Math.max(0, Math.min(0.05, Number(policy.regressionTolerance ?? 0.005)));
  const improvementFloor = Math.max(0.0001, Math.min(0.25, Number(policy.improvementFloor ?? 0.005)));

  const identity = await candidateIdentity(candidate);
  const predecessorMetrics = metricVector(predecessor.metrics || {});
  const successorMetrics = metricVector(successor.metrics || {});
  const predecessorCapabilities = uniqueStrings(predecessor.capabilities);
  const successorCapabilities = uniqueStrings(successor.capabilities);
  const capabilityLoss = predecessorCapabilities.filter(x => !successorCapabilities.includes(x));
  const capabilityGain = successorCapabilities.filter(x => !predecessorCapabilities.includes(x));
  const predecessorIdentityValid = isGitSha(predecessor.canonicalGitSha);
  const verification = verificationTruth(successor.verification || {});
  const connections = connectionTruth(successor.connections || {});

  const missingMetrics = [...new Set([...predecessorMetrics.missing, ...successorMetrics.missing])];
  const deltas: AnyObj = {}, regressions: AnyObj[] = [], improvements: AnyObj[] = [], tradeoffs: AnyObj[] = [];
  for (const key of Object.keys(SUCCESSOR_METRIC_WEIGHTS_R183)) {
    if (missingMetrics.includes(key)) continue;
    const delta = Number(successorMetrics.values[key]) - Number(predecessorMetrics.values[key]);
    deltas[key] = delta;
    if (delta < -regressionTolerance) {
      const row = { metric: key, delta, hard: HARD_NON_REGRESSION_METRICS.includes(key as any) };
      regressions.push(row);
      if (!row.hard) tradeoffs.push(row);
    }
    if (delta > regressionTolerance) improvements.push({ metric: key, delta });
  }

  const predecessorScore = missingMetrics.length ? NaN : weightedScore(predecessorMetrics.values);
  const successorScore = missingMetrics.length ? NaN : weightedScore(successorMetrics.values);
  const scoreDelta = Number.isFinite(predecessorScore) && Number.isFinite(successorScore) ? successorScore - predecessorScore : NaN;
  const hardRegressions = regressions.filter(row => row.hard);
  const materialImprovement = Number.isFinite(scoreDelta) && scoreDelta >= improvementFloor && (improvements.length > 0 || capabilityGain.length > 0);

  const blockers: string[] = [];
  if (!identity.ok) blockers.push(...identity.reasons);
  if (!predecessorIdentityValid) blockers.push("PREDECESSOR_CANONICAL_GIT_SHA_INVALID");
  if (missingMetrics.length) blockers.push(`MISSING_METRICS:${missingMetrics.join(",")}`);
  if (capabilityLoss.length) blockers.push(`CAPABILITY_REGRESSION:${capabilityLoss.join(",")}`);
  if (hardRegressions.length) blockers.push(`HARD_METRIC_REGRESSION:${hardRegressions.map(x => x.metric).join(",")}`);
  if (!materialImprovement) blockers.push("MATERIAL_IMPROVEMENT_NOT_PROVED");
  if (!verification.complete) blockers.push(`VERIFICATION_INCOMPLETE:${[...verification.missing, ...verification.invalidEvidence].join(",")}`);
  if (!connections.complete) blockers.push(`CONNECTION_PROOF_INCOMPLETE:${connections.missing.join(",")}`);

  const superior = identity.ok && predecessorIdentityValid && !missingMetrics.length && !capabilityLoss.length && !hardRegressions.length && materialImprovement;
  const promotionReady = superior && verification.complete && connections.complete;
  const scarSeverity = Math.min(1, hardRegressions.reduce((m, row) => Math.max(m, Math.abs(Number(row.delta || 0))), 0) + capabilityLoss.length * 0.1 + missingMetrics.length * 0.02);

  const base = {
    schema: SUCCESSOR_SCHEMA_R183,
    revision: SUCCESSOR_REVISION_R183,
    candidateId: candidate?.candidateId || null,
    candidateSha256: identity.hash,
    predecessorCanonicalGitSha: predecessor?.canonicalGitSha || null,
    superior,
    promotionReady,
    metricWeights: SUCCESSOR_METRIC_WEIGHTS_R183,
    hardNonRegressionMetrics: HARD_NON_REGRESSION_METRICS,
    policy: { regressionTolerance, improvementFloor },
    scores: {
      predecessor: Number.isFinite(predecessorScore) ? predecessorScore : null,
      successor: Number.isFinite(successorScore) ? successorScore : null,
      delta: Number.isFinite(scoreDelta) ? scoreDelta : null,
    },
    deltas,
    improvements,
    regressions,
    tradeoffs,
    capabilities: { predecessor: predecessorCapabilities, successor: successorCapabilities, gained: capabilityGain, lost: capabilityLoss, preserved: capabilityLoss.length === 0 },
    verification,
    connections,
    blockers,
    authority: "SUCCESSOR_EVALUATION_NOT_CANON",
    canonicalMutation: false,
    githubMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
  };

  if (promotionReady) {
    const promotionCore = {
      schema: SUCCESSOR_PROMOTION_SCHEMA_R183,
      revision: SUCCESSOR_REVISION_R183,
      predecessorCanonicalGitSha: predecessor.canonicalGitSha,
      candidateId: candidate.candidateId,
      candidateSha256: identity.hash,
      weightedImprovementDelta: scoreDelta,
      improvedDimensions: improvements,
      capabilityGain,
      verificationEvidenceHashes: verification.evidenceHashes,
      connections: connections.observed,
      targetReleaseAuthority: "omega-v6-full-convergence",
      nextAction: "OPEN_RELEASE_PR_THEN_RUN_CANONICAL_VERIFY_DEPLOY_AND_POST_DEPLOY_PROOFS",
      authority: "PROMOTION_CANDIDATE_PACKET_NOT_RELEASE_AUTHORITY",
      canonicalMutation: false,
      githubMutationAuthorized: false,
      deploymentAuthorized: false,
      promotionAuthorized: false,
    };
    return { ok: true, ...base, state: "SUPERIOR_SUCCESSOR_READY_FOR_RELEASE", promotionPacket: { ...promotionCore, packetSha256: await canonicalShaR178(promotionCore) }, scarPacket: null, continuation: null };
  }

  const scarCore = {
    schema: SUCCESSOR_SCAR_SCHEMA_R183,
    revision: SUCCESSOR_REVISION_R183,
    candidateId: candidate?.candidateId || null,
    candidateSha256: identity.hash,
    predecessorCanonicalGitSha: predecessor?.canonicalGitSha || null,
    blockers,
    hardRegressions,
    capabilityLoss,
    missingMetrics,
    missingVerification: [...verification.missing, ...verification.invalidEvidence],
    missingConnections: connections.missing,
    severity: scarSeverity,
    carryForward: true,
    authority: "SUCCESSOR_SCAR_EVIDENCE_NOT_CANON",
    canonicalMutation: false,
  };
  const continuation = buildContinuation(blockers, candidate, Number.isFinite(scoreDelta) ? scoreDelta : 0, scarSeverity);
  return { ok: true, ...base, state: superior ? "SUPERIOR_BUT_PROOF_INCOMPLETE_CONTINUE" : "NOT_YET_SUPERIOR_CONTINUE", promotionPacket: null, scarPacket: { ...scarCore, packetSha256: await canonicalShaR178(scarCore) }, continuation };
}

export async function handleSuccessorGateR183(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/swarm/successor/r183/manifest") return jsonResponse({
    ok: true,
    schema: "OMEGA_SUCCESSOR_SUPERIORITY_MANIFEST_R183",
    revision: SUCCESSOR_REVISION_R183,
    metrics: SUCCESSOR_METRIC_WEIGHTS_R183,
    hardNonRegressionMetrics: HARD_NON_REGRESSION_METRICS,
    requiredVerificationStages: REQUIRED_VERIFICATION_STAGES,
    requiredConnections: REQUIRED_CONNECTIONS,
    states: ["SUPERIOR_SUCCESSOR_READY_FOR_RELEASE", "SUPERIOR_BUT_PROOF_INCOMPLETE_CONTINUE", "NOT_YET_SUPERIOR_CONTINUE"],
    continuousDevelopment: true,
    automaticCanonicalPromotion: false,
    boundary: "R183 evaluates a hash-bound R178 candidate against an identified predecessor. A successor must preserve admitted capabilities, avoid hard regressions, prove material weighted improvement, complete Sovereign validation, and return connection evidence. Failure emits a scar-driven next DEVELOPMENT mission instead of stopping. Passing emits a promotion packet, not release authority.",
    canonicalMutation: false,
    promotionAuthorized: false,
  });
  if (request.method === "POST" && path === "/api/swarm/successor/r183/evaluate") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    try { return jsonResponse(await evaluateSuccessorR183(body)); }
    catch (error) { return jsonResponse({ ok: false, schema: SUCCESSOR_SCHEMA_R183, revision: SUCCESSOR_REVISION_R183, error: error instanceof Error ? error.message : String(error), canonicalMutation: false, promotionAuthorized: false }, 400); }
  }
  return jsonResponse({ ok: false, code: "NOT_FOUND", revision: SUCCESSOR_REVISION_R183, canonicalMutation: false }, 404);
}
