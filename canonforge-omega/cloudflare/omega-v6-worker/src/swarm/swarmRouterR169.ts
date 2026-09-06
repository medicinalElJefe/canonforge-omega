import { DurableBinding, SwarmEnv, AUTONOMIC_REVISION, CONTINUITY_LAW, ORGANISM_REVISION, SWARM_CELL_COUNT, SWARM_DOMAIN_ROLES, SWARM_LANE_COUNT, SWARM_PHASE_ROLES, SWARM_RECOVERY_REVISION, SWARM_REGULATION_ROLES, SWARM_SOURCE_COMMIT, TRUTH_BOUNDARY, jsonResponse } from "./swarmCoreR169";

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

export async function handleSwarmRequest(request: Request, env: SwarmEnv): Promise<Response> {
  if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
  const path = new URL(request.url).pathname;
  if (path === "/api/swarm/manifest") return withCors(jsonResponse({ ok: true, schema: "OMEGA_SWARM_RECOVERY_MANIFEST_R169", recoveryRevision: SWARM_RECOVERY_REVISION, historicalRuntime: { cell: "R121", organism: ORGANISM_REVISION, autonomic: AUTONOMIC_REVISION, sourceRepo: "medicinalElJefe/OMEGAv6", sourceCommit: SWARM_SOURCE_COMMIT }, hierarchy: { seed: 1, organs: 12, branches: 144, cells: SWARM_CELL_COUNT, lanes: SWARM_LANE_COUNT }, roles: { domains: SWARM_DOMAIN_ROLES, phases: SWARM_PHASE_ROLES, regulations: SWARM_REGULATION_ROLES }, continuityLaw: CONTINUITY_LAW, preservedNamespaces: ["OmegaSwarmCell", "OmegaSwarmCoordinator", "OmegaSwarmBranch", "OmegaSwarmOrgan", "OmegaSwarmOrganismCoordinator", "OmegaSwarmAutonomicCoordinator"], truthBoundary: TRUTH_BOUNDARY, canonicalMutation: false }));
  let response: Response;
  if (path.startsWith("/api/swarm/autonomic")) response = await forward(env.OMEGA_SWARM_AUTONOMIC, "omega-swarm-autonomic-root", path.slice("/api/swarm/autonomic".length) || "/status", request);
  else if (path.startsWith("/api/swarm/organism")) response = await forward(env.OMEGA_SWARM_ORGANISM, "omega-swarm-organism-root", path.slice("/api/swarm/organism".length) || "/status", request);
  else response = await forward(env.OMEGA_SWARM_COORDINATOR, "omega-swarm-coordinator-root", path.slice("/api/swarm".length) || "/status", request);
  return withCors(response);
}
