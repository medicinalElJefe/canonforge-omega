import { AnyObj, SwarmEnv, jsonResponse, sha } from "./swarmCoreR169";
import { canonicalShaR178 } from "./warpBuildCandidateR178";
import { evaluateSuccessorR183, SUCCESSOR_METRIC_WEIGHTS_R183 } from "./successorGateR183";
import { discoverImprovementR184 } from "./improvementDiscoveryR184";

export const SUCCESSOR_EVIDENCE_REVISION_R186 = "R186";
export const SUCCESSOR_EVIDENCE_SCHEMA_R186 = "OMEGA_EXECUTION_DERIVED_SUCCESSOR_EVIDENCE_R186";

const REQUIRED_CONNECTIONS = ["canonicalEdge", "swarm", "genesisMachine", "opticalMachine", "sovereignHost", "sai"] as const;
const VERIFY_STAGES = ["run_tests", "build_vite", "wrangler_dry_run", "verify_candidate"] as const;

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;

const clamp01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
const arr = (v: any): string[] => Array.isArray(v) ? [...new Set(v.map((x) => String(x || "").trim()).filter(Boolean))] : [];
const exitOk = (v: any): boolean => Boolean(v && (Number(v.exit_code) === 0 || v.passed === true || v.ok === true || String(v.state || "").toUpperCase() === "VERIFIED"));
const elapsed = (v: any): number => Math.max(0, Number(v?.elapsed_seconds || v?.elapsedSeconds || 0) || 0);

async function callCanonical(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, path: string): Promise<AnyObj> {
  try {
    const u = new URL(request.url); u.pathname = path; u.search = "";
    const response = await canonicalFetch(new Request(u.toString(), { method: "GET", headers: { accept: "application/json" } }), env, ctx);
    const body = await response.json().catch(() => null) as AnyObj | null;
    return { reachable: response.ok, status: response.status, body };
  } catch (error) {
    return { reachable: false, status: 0, error: error instanceof Error ? error.message : String(error), body: null };
  }
}

async function callService(binding: any, service: string): Promise<AnyObj> {
  if (!binding?.fetch) return { reachable: false, service, code: "SERVICE_BINDING_UNAVAILABLE" };
  try {
    const response = await binding.fetch(new Request(`https://${service}.internal/api/health`, { method: "GET", headers: { accept: "application/json" } }));
    const body = await response.json().catch(() => null) as AnyObj | null;
    return { reachable: response.ok && body?.ok === true, status: response.status, service, body };
  } catch (error) {
    return { reachable: false, status: 0, service, error: error instanceof Error ? error.message : String(error) };
  }
}

async function swarmProbe(env: SwarmEnv): Promise<AnyObj> {
  if (!env.OMEGA_SWARM_CELL) return { reachable: false, code: "OMEGA_SWARM_CELL_BINDING_UNAVAILABLE" };
  try {
    const binding = env.OMEGA_SWARM_CELL;
    const stub = binding.get(binding.idFromName("omega-cloud-r185-001"));
    const response = await stub.fetch(new Request("https://r186.internal/state", { method: "GET" }));
    const body = await response.json().catch(() => null) as AnyObj | null;
    return { reachable: response.ok, status: response.status, body };
  } catch (error) {
    return { reachable: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function collectLiveConnectionsR186(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<AnyObj> {
  const [hybrid, saiStatus, genesis, optical, swarm] = await Promise.all([
    callCanonical(request, env, ctx, canonicalFetch, "/api/hybrid/status"),
    callCanonical(request, env, ctx, canonicalFetch, "/api/sai/status"),
    callService(env.OMEGA_GENESIS_MACHINE, "omega-genesis-machine-r115"),
    callService(env.OMEGA_OPTICAL_MACHINE, "omega-optical-machine-r115"),
    swarmProbe(env),
  ]);
  const hb = hybrid.body || {};
  const sai = saiStatus.body || {};
  const canonicalGitSha = String(env?.CANONICAL_GIT_SHA || "").trim();
  const observed = {
    canonicalEdge: /^[a-f0-9]{40,64}$/i.test(canonicalGitSha),
    swarm: swarm.reachable === true,
    genesisMachine: genesis.reachable === true,
    opticalMachine: optical.reachable === true,
    sovereignHost: Boolean(hb.pcOnline ?? hb.pc_online) && Boolean(hb.authenticated ?? hb.proof?.authenticated ?? hb.authenticated_heartbeat),
    sai: Boolean(sai.passed === true || sai.state === "B059_PRESENT_VERIFICATION_REQUIRED" || sai.release === "OMEGA SAI B059"),
  };
  const receipts: AnyObj = { canonicalEdge: { canonicalGitSha }, swarm, genesisMachine: genesis, opticalMachine: optical, sovereignHost: hybrid, sai: saiStatus };
  const evidence: AnyObj = {};
  for (const key of REQUIRED_CONNECTIONS) if ((observed as AnyObj)[key] === true) evidence[key] = await canonicalShaR178({ key, observed: true, receipt: receipts[key] });
  return { observed, receipts, evidence, complete: REQUIRED_CONNECTIONS.every((key) => (observed as AnyObj)[key] === true) };
}

function executionMetrics(raw: AnyObj, capabilities: string[], changedFiles: string[], objective: string, connections: AnyObj): AnyObj {
  const tests = raw.run_tests || raw.tests || {};
  const typecheck = raw.build_vite || raw.typecheck || {};
  const dry = raw.wrangler_dry_run || raw.dryRun || {};
  const verify = raw.verify_candidate || raw.verifyCandidate || {};
  const testsOk = exitOk(tests), typeOk = exitOk(typecheck), dryOk = exitOk(dry), verifyOk = exitOk(verify);
  const proofPasses = [testsOk, typeOk, dryOk, verifyOk].filter(Boolean).length;
  const totalElapsed = elapsed(tests) + elapsed(typecheck) + elapsed(dry);
  const federation = ["canonicalEdge", "swarm", "genesisMachine", "opticalMachine"].filter((k) => connections[k] === true).length / 4;
  const continuityPresent = capabilities.some((x) => /R182|CONTINUITY/i.test(x)) && capabilities.some((x) => /R183|SUCCESSOR/i.test(x));
  const maxCapabilities = Math.max(1, Number(raw.capabilityScale || 32));
  return {
    correctness: testsOk ? 1 : 0,
    regressionSafety: [testsOk, typeOk, dryOk].filter(Boolean).length / 3,
    missionFit: objective.trim() && changedFiles.length ? 1 : 0,
    proofCoverage: proofPasses / 4,
    capabilityCoverage: clamp01(capabilities.length / maxCapabilities),
    interactiveEfficiency: 1 / (1 + totalElapsed / 120),
    resourceEfficiency: 1 / (1 + totalElapsed / 300),
    recoverability: raw.cleanWorkspace === true && testsOk ? 1 : 0,
    continuity: continuityPresent && testsOk ? 1 : 0,
    federationConnectivity: federation,
    sovereignConnectivity: connections.sovereignHost === true ? 1 : 0,
  };
}

async function stageTruth(raw: AnyObj): Promise<AnyObj> {
  const map: AnyObj = {
    run_tests: raw.run_tests || raw.tests || {},
    build_vite: raw.build_vite || raw.typecheck || {},
    wrangler_dry_run: raw.wrangler_dry_run || raw.dryRun || {},
    verify_candidate: raw.verify_candidate || raw.verifyCandidate || {},
  };
  const stages: AnyObj[] = [];
  for (const kind of VERIFY_STAGES) {
    const evidence = map[kind];
    stages.push({ kind, state: exitOk(evidence) ? "VERIFIED" : "FAILED", evidenceSha256: await canonicalShaR178(evidence) });
  }
  return { stages, complete: stages.every((x) => x.state === "VERIFIED") };
}

export async function collectSuccessorEvidenceR186(body: AnyObj, request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<AnyObj> {
  const candidate = body.candidate || {};
  const predecessor = body.predecessor || {};
  const source = body.source || {};
  const predecessorExecution = body.predecessorExecution || {};
  const successorExecution = body.successorExecution || {};
  const objective = String(candidate.objective || body.objective || "").trim();
  const changedFiles = arr(source.changedFiles);
  const predecessorCaps = arr(predecessor.capabilities);
  const successorCaps = arr(body.successorCapabilities);
  const live = await collectLiveConnectionsR186(request, env, ctx, canonicalFetch);
  const predecessorMetrics = executionMetrics(predecessorExecution, predecessorCaps, [], "", live.observed);
  const successorMetrics = executionMetrics(successorExecution, successorCaps, changedFiles, objective, live.observed);
  const verification = await stageTruth(successorExecution);
  const metricEvidence: AnyObj = {};
  for (const key of Object.keys(SUCCESSOR_METRIC_WEIGHTS_R183)) metricEvidence[key] = await canonicalShaR178({ metric: key, predecessor: predecessorMetrics[key], successor: successorMetrics[key], basis: "R186_EXECUTION_DERIVED" });

  const mission = {
    schema: "OMEGA_EXACT_BUILD_MISSION_R186",
    revision: SUCCESSOR_EVIDENCE_REVISION_R186,
    exactBuildDevelopment: true,
    objective,
    candidateSha256: candidate.capsuleSha256 || null,
    predecessorCanonicalGitSha: predecessor.canonicalGitSha || null,
  };
  const missionSha256 = await canonicalShaR178(mission);
  const diffText = String(source.diff || "");
  const diffSha256 = await sha(diffText);
  const stageHashes = verification.stages.map((x: AnyObj) => x.evidenceSha256);
  const artifactSha256 = await canonicalShaR178({ sourceCommitSha: source.commitSha, candidateSha256: candidate.capsuleSha256, changedFiles, diffSha256, stageHashes });
  const designOutput = {
    schema: "OMEGA_IMPROVEMENT_DESIGN_OUTPUT_R184",
    sourceBranch: source.branch || null,
    sourceCommitSha: source.commitSha || null,
    predecessorCanonicalGitSha: predecessor.canonicalGitSha || null,
    candidateSha256: candidate.capsuleSha256 || null,
    missionSha256,
    diffSha256,
    artifactSha256,
    changedFiles,
    evidenceSha256: stageHashes,
    metricEvidence,
    connectionEvidence: live.evidence,
    canonicalMutation: false,
    githubMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
  };
  const evaluationPayload = {
    candidate,
    predecessor: { canonicalGitSha: predecessor.canonicalGitSha, metrics: predecessorMetrics, capabilities: predecessorCaps },
    successor: { metrics: successorMetrics, capabilities: successorCaps, verification: { stages: verification.stages }, connections: live.observed },
    mission,
    designOutput,
    policy: body.policy || {},
  };
  const successorEvaluation = await evaluateSuccessorR183(evaluationPayload);
  const improvementDiscovery = await discoverImprovementR184(evaluationPayload);
  const core = {
    schema: SUCCESSOR_EVIDENCE_SCHEMA_R186,
    revision: SUCCESSOR_EVIDENCE_REVISION_R186,
    state: improvementDiscovery.discoveredSuperiorDesign === true ? "SUPERIOR_DESIGN_DISCOVERED" : "CONTINUE_SELF_DEVELOPMENT",
    executionDerivedMetrics: true,
    liveConnectionCollection: true,
    predecessorMetrics,
    successorMetrics,
    verification,
    liveConnections: live,
    metricEvidence,
    designOutput,
    successorEvaluation,
    improvementDiscovery,
    continuation: improvementDiscovery.continuation || successorEvaluation.continuation || null,
    canonicalMutation: false,
    promotionAuthorized: false,
    authority: "R186_EXECUTION_DERIVED_EVIDENCE_NOT_RELEASE_AUTHORITY",
    boundary: "R186 derives scores from raw execution receipts and current live connection probes. Raw predecessor/successor execution receipts and source identity are inputs; callers cannot directly supply R183 metric scores. Release remains proof-gated.",
  };
  return { ok: true, ...core, receiptSha256: await canonicalShaR178(core) };
}

export async function handleSuccessorEvidenceR186(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/swarm/evidence/r186/manifest") return jsonResponse({
    ok: true,
    schema: "OMEGA_SUCCESSOR_EVIDENCE_MANIFEST_R186",
    revision: SUCCESSOR_EVIDENCE_REVISION_R186,
    derivesMetricsFromRawExecutionReceipts: true,
    collectsLiveConnections: REQUIRED_CONNECTIONS,
    feedsSuccessorGate: "R183",
    feedsImprovementDiscovery: "R184",
    continuationOnIncompleteOrInferior: true,
    automaticProductionPromotion: false,
    canonicalMutation: false,
  });
  if (request.method === "POST" && path === "/api/swarm/evidence/r186/collect") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    try { return jsonResponse(await collectSuccessorEvidenceR186(body, request, env, ctx, canonicalFetch)); }
    catch (error) { return jsonResponse({ ok: false, schema: SUCCESSOR_EVIDENCE_SCHEMA_R186, revision: SUCCESSOR_EVIDENCE_REVISION_R186, error: error instanceof Error ? error.message : String(error), canonicalMutation: false, promotionAuthorized: false }, 400); }
  }
  return jsonResponse({ ok: false, code: "R186_EVIDENCE_ROUTE_NOT_FOUND", canonicalMutation: false }, 404);
}
