import {
  AnyObj,
  DurableBinding,
  SwarmEnv,
  SWARM_CELL_COUNT,
  SWARM_DOMAIN_ROLES,
  SWARM_LANE_COUNT,
  SWARM_PHASE_ROLES,
  SWARM_REGULATION_ROLES,
  CONTINUITY_LAW,
  TRUTH_BOUNDARY,
  cellId,
  cellIndex,
  jsonResponse,
  sha,
} from "../swarm/swarmCoreR169";

type ServiceBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type FederatedEnv = SwarmEnv & {
  GENESIS?: ServiceBinding;
  OMEGA_GENESIS_MACHINE?: ServiceBinding;
  OMEGA_OPTICAL_MACHINE?: ServiceBinding;
  OMEGA_SWARM_COORDINATOR?: DurableBinding;
};

export const FEDERATED_ORGAN_RELEASE_R174 = "r174-federated-organ-fabric";
export const FEDERATED_ORGAN_SCHEMA_R174 = "OMEGA_FEDERATED_ORGAN_FABRIC_R174";
export const FEDERATED_MISSION_SCHEMA_R174 = "OMEGA_FEDERATED_ORGAN_MISSION_R174";
export const FEDERATED_OPTICAL_RECEIPT_SCHEMA_R174 = "OMEGA_FEDERATED_OPTICAL_RECEIPT_R174";
export const FEDERATED_ORGAN_BOUNDARY_R174 =
  "R174 binds previously deployed Genesis and Optical machine services into the live 1728-cell OMEGA organism, but service reachability, proposal generation, scalar screening, Workers AI synthesis, redundant swarm execution, and queued full-wave requests remain role-bounded evidence. Canonical admission still belongs to OMEGA V6. FULL_FEDERATION_PROVED remains false until a current authenticated Sovereign host executes the required independent full-wave job and the returned receipt passes the applicable validation gates. 12/144/1728/20736 are software address/execution-resolution levels, not physical dimensions.";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  headers.set("x-omega-federated-organ-release", FEDERATED_ORGAN_RELEASE_R174);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function clip(value: any, max = 5000): string {
  return String(value ?? "").trim().slice(0, max);
}

async function readJson(response: Response): Promise<AnyObj> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : { value: parsed };
  } catch {
    return { ok: false, code: "NON_JSON_SERVICE_RESPONSE", status: response.status, preview: text.slice(0, 600) };
  }
}

async function probe(binding: ServiceBinding | undefined, service: string, path: string): Promise<AnyObj> {
  if (!binding?.fetch) return { service, bound: false, reachable: false, status: 0, transport: "SERVICE_BINDING_UNAVAILABLE" };
  try {
    const response = await binding.fetch(new Request(`https://${service}.internal${path}`, {
      method: "GET",
      headers: { accept: "application/json" },
    }));
    const body = await readJson(response);
    return {
      service,
      bound: true,
      reachable: response.ok && body?.ok !== false,
      status: response.status,
      authority: body?.authority || body?.runtime?.role || null,
      version: body?.version || body?.revision || null,
      transport: "CLOUDFLARE_SERVICE_BINDING",
      body,
    };
  } catch (error) {
    return {
      service,
      bound: true,
      reachable: false,
      status: 0,
      transport: "CLOUDFLARE_SERVICE_BINDING",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function organProvider(domain: number): AnyObj {
  const providers: AnyObj[] = [
    { primary: "OMEGA_SWARM_COORDINATOR", secondary: "GENESIS_MACHINE", role: "intent framing + mission decomposition" },
    { primary: "SWARM_CELLS", secondary: "WORKERS_AI", role: "software/build analysis and bounded synthesis" },
    { primary: "GENESIS_MACHINE", secondary: "GENESIS", role: "proposal/discovery generation" },
    { primary: "R170_REFERENCE_COMPUTE", secondary: "WORKERS_AI", role: "deterministic mathematics + interpretation" },
    { primary: "OPTICAL_MACHINE", secondary: "SOVEREIGN_PC", role: "screening + full-wave escalation" },
    { primary: "OMEGA_V6_VISUAL_SURFACES", secondary: "SWARM_CELLS", role: "instrumentation and visual projection" },
    { primary: "EVIDENCE_PACKETS", secondary: "OPERATOR_CONNECTORS", role: "hashed data/evidence intake; no hidden cloud-drive authority" },
    { primary: "FORECAST_SURFACES", secondary: "WORKERS_AI", role: "projection under explicit uncertainty" },
    { primary: "HYBRID_LINK", secondary: "SWARM_CELLS", role: "tool/action routing under governed permissions" },
    { primary: "SOVEREIGN_PC", secondary: "HYBRID_LINK", role: "native heavy compute and local execution" },
    { primary: "VALIDATION_FABRIC", secondary: "PROOF_LEDGER", role: "evidence grading and admission gating" },
    { primary: "OMEGA_SWARM_ORGANISM", secondary: "OMEGA_V6", role: "reconvergence, lineage, and coordination" },
  ];
  return providers[domain] || { primary: "UNASSIGNED", role: "unassigned" };
}

function organMap(): AnyObj[] {
  return SWARM_DOMAIN_ROLES.map((role, domain) => ({
    domain,
    organ: role,
    provider: organProvider(domain),
    branches: SWARM_PHASE_ROLES.map((phase, phaseIndex) => ({
      phaseIndex,
      phase,
      cells: SWARM_REGULATION_ROLES.map((regulation, regulationIndex) => ({
        regulationIndex,
        regulation,
        index: cellIndex(domain, phaseIndex, regulationIndex),
        cellId: cellId({ domain, phase: phaseIndex, regulation: regulationIndex }),
        lanes: 12,
      })),
    })),
  }));
}

async function health(env: FederatedEnv): Promise<AnyObj> {
  const [genesisHuman, genesisMachine, opticalMachine] = await Promise.all([
    probe(env.GENESIS, "omega-genesis-v1", "/_omega/health"),
    probe(env.OMEGA_GENESIS_MACHINE, "omega-genesis-machine-r115", "/api/health"),
    probe(env.OMEGA_OPTICAL_MACHINE, "omega-optical-machine-r115", "/api/health"),
  ]);
  const infrastructure = {
    workersAI: Boolean(env.AI?.run),
    swarmCoordinator: Boolean(env.OMEGA_SWARM_COORDINATOR),
    swarmCells: Boolean(env.OMEGA_SWARM_CELL),
    swarmBranches: Boolean(env.OMEGA_SWARM_BRANCH),
    swarmOrgans: Boolean(env.OMEGA_SWARM_ORGAN),
    swarmOrganism: Boolean(env.OMEGA_SWARM_ORGANISM),
    swarmAutonomic: Boolean(env.OMEGA_SWARM_AUTONOMIC),
  };
  const federationReady = Boolean(
    genesisMachine.reachable &&
    opticalMachine.reachable &&
    infrastructure.swarmCoordinator &&
    infrastructure.swarmCells
  );
  return {
    ok: federationReady,
    schema: "OMEGA_FEDERATED_ORGAN_HEALTH_R174",
    revision: "R174",
    release: FEDERATED_ORGAN_RELEASE_R174,
    federationReady,
    fullFederationProved: false,
    services: { genesisHuman, genesisMachine, opticalMachine },
    infrastructure,
    hierarchy: { seed: 1, organs: 12, branches: 144, cells: SWARM_CELL_COUNT, lanes: SWARM_LANE_COUNT },
    currentFullWaveGate: "CURRENT_AUTHENTICATED_SOVEREIGN_INDEPENDENT_SOLVER_RECEIPT_REQUIRED",
    hybridStatusRoute: "/api/hybrid/status",
    crossRuntimeValidationRoute: "/api/validate/cross-runtime",
    boundary: FEDERATED_ORGAN_BOUNDARY_R174,
    canonicalMutation: false,
  };
}

async function callJson(binding: ServiceBinding, service: string, path: string, body: AnyObj): Promise<{ response: Response; data: AnyObj }> {
  const response = await binding.fetch(new Request(`https://${service}.internal${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  }));
  return { response, data: await readJson(response) };
}

async function directOpticalChain(body: AnyObj, env: FederatedEnv): Promise<Response> {
  const intent = clip(body.intent || body.text, 4000);
  if (!intent) return jsonResponse({ ok: false, code: "INTENT_REQUIRED", canonicalMutation: false }, 400);
  if (!env.OMEGA_GENESIS_MACHINE?.fetch || !env.OMEGA_OPTICAL_MACHINE?.fetch) {
    return jsonResponse({
      ok: false,
      code: "FEDERATION_MACHINE_BINDINGS_UNAVAILABLE",
      bindings: {
        genesisMachine: Boolean(env.OMEGA_GENESIS_MACHINE?.fetch),
        opticalMachine: Boolean(env.OMEGA_OPTICAL_MACHINE?.fetch),
      },
      canonicalMutation: false,
      boundary: FEDERATED_ORGAN_BOUNDARY_R174,
    }, 503);
  }
  const missionSeed = await sha({ intent, evidence: body.evidence || [], release: FEDERATED_ORGAN_RELEASE_R174 });
  const missionId = clip(body.mission_id || body.missionId, 180) || `r174_optical_${missionSeed.slice(0, 20)}`;
  const proposed = await callJson(env.OMEGA_GENESIS_MACHINE, "omega-genesis-machine-r115", "/api/federation/propose", {
    intent,
    ceremony_id: missionId,
    evidence: Array.isArray(body.evidence) ? body.evidence : [],
  });
  const proposal = proposed.data?.packet || proposed.data?.proposal;
  if (!proposed.response.ok || proposal?.schema !== "OMEGA_PACKET_v1") {
    return jsonResponse({
      ok: false,
      code: "GENESIS_PROPOSAL_FAILED",
      missionId,
      stage: "PROPOSE",
      status: proposed.response.status,
      genesis: proposed.data,
      authority: "NO_RESULT_FABRICATED",
      canonicalMutation: false,
      boundary: FEDERATED_ORGAN_BOUNDARY_R174,
    }, 502);
  }
  const screened = await callJson(env.OMEGA_OPTICAL_MACHINE, "omega-optical-machine-r115", "/api/federation/screen", {
    proposal,
    evidence: Array.isArray(body.evidence) ? body.evidence : [],
  });
  const screenedPacket = screened.data?.screened_packet || screened.data?.packet || null;
  if (!screened.response.ok || !screenedPacket) {
    return jsonResponse({
      ok: false,
      code: "OPTICAL_SCREEN_FAILED",
      missionId,
      stage: "SCREEN",
      status: screened.response.status,
      proposal,
      optical: screened.data,
      authority: "NO_RESULT_FABRICATED",
      canonicalMutation: false,
      boundary: FEDERATED_ORGAN_BOUNDARY_R174,
    }, 502);
  }
  const tier2Job = screened.data?.tier2_job || null;
  const receiptCore = {
    schema: FEDERATED_OPTICAL_RECEIPT_SCHEMA_R174,
    revision: "R174",
    missionId,
    intentSha256: await sha(intent),
    proposalPacketId: proposal.packet_id || null,
    proposalSha256: await sha(proposal),
    screenedPacketId: screenedPacket.packet_id || null,
    screenedPacketSha256: await sha(screenedPacket),
    tier2JobSha256: tier2Job ? await sha(tier2Job) : null,
    screeningGate: screenedPacket?.proof?.gate || null,
    requestedSolver: screenedPacket?.requested_solver || null,
    tier2Ready: Boolean(tier2Job),
    lineage: [
      `omega-v6:r174:${missionId}:intent`,
      "omega-genesis-machine:r115:propose",
      "omega-optical-machine:r115:screen",
      tier2Job ? "omega-v6:r174:sovereign-fullwave-required" : "omega-v6:r174:screen-returned",
    ],
    authority: tier2Job ? "FULLWAVE_REQUEST_CANDIDATE_NOT_VALIDATION" : "SCREENING_RESULT_NOT_VALIDATION",
    fullFederationProved: false,
    canonicalMutation: false,
    boundary: FEDERATED_ORGAN_BOUNDARY_R174,
  };
  return jsonResponse({
    ok: true,
    schema: "OMEGA_FEDERATED_OPTICAL_CHAIN_R174",
    missionId,
    proposal,
    screen: screened.data,
    tier2_job: tier2Job,
    nextAction: tier2Job
      ? "ROUTE_TO_CURRENT_AUTHENTICATED_SOVEREIGN_FULLWAVE_SOLVER"
      : "RETURN_TO_GENESIS_OR_OPTICAL_FOR_REFINEMENT",
    receipt: { ...receiptCore, receiptSha256: await sha(receiptCore) },
    canonicalMutation: false,
  });
}

async function forwardCoordinator(env: FederatedEnv, path: string, method: string, body?: AnyObj): Promise<Response> {
  const binding = env.OMEGA_SWARM_COORDINATOR;
  if (!binding) return jsonResponse({ ok: false, code: "SWARM_COORDINATOR_UNAVAILABLE", canonicalMutation: false }, 503);
  const stub = binding.get(binding.idFromName("omega-swarm-coordinator-root"));
  const init: RequestInit = { method, headers: { "content-type": "application/json", accept: "application/json" } };
  if (body !== undefined && !["GET", "HEAD"].includes(method)) init.body = JSON.stringify(body);
  return stub.fetch(new Request(`https://swarm-coordinator.internal${path}`, init));
}

async function launchOrganismMission(body: AnyObj, env: FederatedEnv): Promise<Response> {
  const intent = clip(body.intent || body.text, 7000);
  if (!intent) return jsonResponse({ ok: false, code: "INTENT_REQUIRED", canonicalMutation: false }, 400);
  const requestedProfile = String(body.profile || body.executionProfile || "ORGANISM").toUpperCase();
  const profile = ["FOCUSED", "ORGANISM", "FULL"].includes(requestedProfile) ? requestedProfile : "ORGANISM";
  const mode = profile === "FULL" ? "FULL" : profile === "FOCUSED" ? "FLOCK" : "TREE";
  const requestedCells = profile === "FULL" ? 1728 : profile === "FOCUSED" ? 24 : 144;
  const providerBudget = Math.max(0, Math.min(12, Math.trunc(Number(body.providerBudget ?? body.aiCells ?? 6))));
  const missionInput = {
    intent,
    mode,
    requestedCells,
    providerBudget,
    evidence: Array.isArray(body.evidence) ? body.evidence : [],
    seed: body.seed,
  };
  const response = await forwardCoordinator(env, "/missions", "POST", missionInput);
  const data = await readJson(response);
  const mission = data?.mission || null;
  return jsonResponse({
    ok: response.ok && data?.ok === true,
    schema: FEDERATED_MISSION_SCHEMA_R174,
    revision: "R174",
    profile,
    execution: missionInput,
    mission,
    plan: data?.plan || null,
    federationExecutors: [
      "GENESIS_MACHINE@ORCHESTRATION/FRAME",
      "OPTICAL_CHAIN@PHYSICS/EXECUTE",
      "WORKERS_AI@PROVIDER_ELIGIBLE_CELLS",
      "DETERMINISTIC@REMAINDER",
    ],
    statusRoute: mission?.id ? `/api/federation/r174/missions/${encodeURIComponent(String(mission.id))}` : null,
    swarmStatusRoute: mission?.id ? `/api/swarm/missions/${encodeURIComponent(String(mission.id))}` : null,
    canonicalMutation: false,
    fullFederationProved: false,
    boundary: FEDERATED_ORGAN_BOUNDARY_R174,
  }, response.ok ? 202 : response.status);
}

async function missionStatus(path: string, request: Request, env: FederatedEnv): Promise<Response> {
  const prefix = "/api/federation/r174/missions/";
  const rest = path.slice(prefix.length);
  const parts = rest.split("/").filter(Boolean);
  if (!parts[0]) return jsonResponse({ ok: false, code: "MISSION_ID_REQUIRED" }, 400);
  const missionId = decodeURIComponent(parts[0]);
  const tick = parts[1] === "tick";
  const method = tick ? "POST" : "GET";
  if (tick && request.method !== "POST") return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  if (!tick && request.method !== "GET") return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  const response = await forwardCoordinator(env, `/missions/${encodeURIComponent(missionId)}${tick ? "/tick" : ""}`, method);
  const data = await readJson(response);
  return jsonResponse({
    ...data,
    schema: "OMEGA_FEDERATED_MISSION_STATUS_R174",
    revision: "R174",
    missionId,
    canonicalMutation: false,
    boundary: FEDERATED_ORGAN_BOUNDARY_R174,
  }, response.status);
}

export async function handleFederatedOrganRequest(request: Request, env: FederatedEnv): Promise<Response> {
  if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
  const path = new URL(request.url).pathname;
  try {
    if (request.method === "GET" && path === "/api/federation/r174/manifest") {
      const current = await health(env);
      return withCors(jsonResponse({
        ok: true,
        schema: FEDERATED_ORGAN_SCHEMA_R174,
        revision: "R174",
        release: FEDERATED_ORGAN_RELEASE_R174,
        health: current,
        organs: organMap(),
        hierarchy: { seed: 1, organs: 12, branches: 144, cells: SWARM_CELL_COUNT, lanes: SWARM_LANE_COUNT },
        executionProfiles: {
          FOCUSED: { mode: "FLOCK", cells: 24 },
          ORGANISM: { mode: "TREE", cells: 144 },
          FULL: { mode: "FULL", cells: 1728 },
        },
        continuityLaw: CONTINUITY_LAW,
        inheritedTruthBoundary: TRUTH_BOUNDARY,
        boundary: FEDERATED_ORGAN_BOUNDARY_R174,
        canonicalMutation: false,
      }));
    }
    if (request.method === "GET" && path === "/api/federation/r174/health") {
      return withCors(jsonResponse(await health(env)));
    }
    if (request.method === "POST" && path === "/api/federation/r174/optical-chain") {
      return withCors(await directOpticalChain(await request.json().catch(() => ({})) as AnyObj, env));
    }
    if (request.method === "POST" && path === "/api/federation/r174/missions") {
      return withCors(await launchOrganismMission(await request.json().catch(() => ({})) as AnyObj, env));
    }
    if (path.startsWith("/api/federation/r174/missions/")) {
      return withCors(await missionStatus(path, request, env));
    }
    return withCors(jsonResponse({ ok: false, code: "NOT_FOUND", path, canonicalMutation: false }, 404));
  } catch (error) {
    return withCors(jsonResponse({
      ok: false,
      code: "R174_FEDERATED_ORGAN_ERROR",
      error: error instanceof Error ? error.message : String(error),
      canonicalMutation: false,
      boundary: FEDERATED_ORGAN_BOUNDARY_R174,
    }, 500));
  }
}
