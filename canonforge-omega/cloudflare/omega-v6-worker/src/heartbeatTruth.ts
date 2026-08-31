import convergence, { OmegaRuntime } from "./convergence";
import type { Env } from "./index";

export { OmegaRuntime };

const HEARTBEAT_TRUTH_BOUNDARY =
  "PC ONLINE requires both an upstream authenticated-online claim and a current authenticated Hybrid heartbeat; stale or absent heartbeat proof cannot be promoted to online.";

async function enforceHeartbeatTruth(response: Response): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return response;

  const body: any = await response.json();
  const node = body?.topology?.sovereign_pc;
  if (!node || typeof node !== "object") return Response.json(body, { status: response.status, headers: response.headers });

  const upstreamOnline = Boolean(node.pc_online);
  const heartbeatCurrent = Boolean(node.heartbeat_current);
  node.pc_online = Boolean(upstreamOnline && heartbeatCurrent);
  node.heartbeat_required_for_pc_online = true;
  node.upstream_online_claim = upstreamOnline;
  node.truth_boundary = HEARTBEAT_TRUTH_BOUNDARY;

  if (!heartbeatCurrent && upstreamOnline) node.state = "HEARTBEAT_STALE_OR_UNPROVEN";

  body.convergence = body.convergence || {};
  body.convergence.hybrid_truth_boundary = HEARTBEAT_TRUTH_BOUNDARY;
  body.convergence.pc_online_requires_current_heartbeat = true;

  return Response.json(body, { status: response.status, headers: response.headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const response = await convergence.fetch(request, env);
    if (url.pathname !== "/api/convergence/edge") return response;
    return enforceHeartbeatTruth(response);
  },
};
