import convergence, { OmegaRuntime } from "./convergence";
import type { Env } from "./index";

export { OmegaRuntime };

type GenesisBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type BoundEnv = Env & { GENESIS?: GenesisBinding };

const HEARTBEAT_TRUTH_BOUNDARY =
  "PC ONLINE requires both an upstream authenticated-online claim and a current authenticated Hybrid heartbeat; stale or absent heartbeat proof cannot be promoted to online.";
const GENESIS_TRANSPORT_BOUNDARY =
  "V6 may use an internal Cloudflare service binding to observe Genesis. Binding success proves transport reachability only; Genesis canonical state and V6 release authority remain separate.";

async function jsonFrom(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "non_json_response",
      status: response.status,
      body_preview: text.slice(0, 240),
    };
  }
}

async function genesisServiceProbe(env: BoundEnv, path: string): Promise<any | null> {
  if (!env.GENESIS) return null;
  try {
    const response = await env.GENESIS.fetch(
      new Request("https://omega-genesis.internal" + path, {
        method: "GET",
        headers: { accept: "application/json" },
      }),
    );
    return {
      reachable: response.ok,
      status: response.status,
      body: await jsonFrom(response),
      transport: "SERVICE_BINDING",
    };
  } catch (error) {
    return {
      reachable: false,
      status: 0,
      error: String(error),
      transport: "SERVICE_BINDING",
    };
  }
}

async function repairGenesisTransport(body: any, env: BoundEnv): Promise<any> {
  if (!env.GENESIS || !body || typeof body !== "object") return body;

  const [edge, health, manifestProbe, capabilitiesProbe, modesProbe] = await Promise.all([
    genesisServiceProbe(env, "/_omega/health"),
    genesisServiceProbe(env, "/api/health"),
    genesisServiceProbe(env, "/api/convergence/manifest"),
    genesisServiceProbe(env, "/api/capabilities"),
    genesisServiceProbe(env, "/api/mode?id=ALL_MODES"),
  ]);

  body.convergence = body.convergence || {};
  body.convergence.genesis_transport_boundary = GENESIS_TRANSPORT_BOUNDARY;
  body.convergence.genesis_transport = manifestProbe?.reachable
    ? "SERVICE_BINDING"
    : "SERVICE_BINDING_DEGRADED";

  const topologyGenesis = body?.topology?.genesis;
  if (topologyGenesis && typeof topologyGenesis === "object") {
    if (edge?.reachable) topologyGenesis.edge = edge;
    if (health?.reachable) topologyGenesis.health = health;
  }

  body.genesis = body.genesis || {};
  const manifest = manifestProbe?.body || {};
  const genome = manifest.capability_genome || {};
  const capabilities = capabilitiesProbe?.body || {};

  if (capabilitiesProbe?.reachable) {
    body.genesis.capability_count =
      genome.capability_count ??
      capabilities.count ??
      (Array.isArray(capabilities.capabilities) ? capabilities.capabilities.length : null);
    body.genesis.acceptance_gates = genome.acceptance_gates || capabilities.acceptance_gates || [];
    body.genesis.menus = capabilities.menus || [];
  }
  if (modesProbe?.reachable) {
    body.genesis.all_modes = modesProbe.body?.result || modesProbe.body || null;
  }
  if (manifestProbe?.reachable) {
    body.genesis.manifest = {
      reachable: true,
      status: manifestProbe.status,
      schema: manifest.schema || null,
      digest: manifest.manifest_digest || null,
      capability_ids: genome.capability_ids || [],
      mode_count: genome.mode_count ?? null,
      promotion_boundary: manifest.promotion_boundary || null,
      dimensional_boundary: manifest.dimensional_boundary || null,
      transport: "SERVICE_BINDING",
    };
    body.convergence.reciprocal_manifest_ready = Boolean(
      manifest.schema === "OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2" && manifest.manifest_digest,
    );
    body.convergence.genesis_manifest_digest = manifest.manifest_digest || null;
  }

  const v6Reachable = Boolean(body?.topology?.v6?.edge?.reachable);
  const genesisReachable = Boolean(body?.topology?.genesis?.edge?.reachable);
  body.ok = Boolean(v6Reachable && genesisReachable);
  return body;
}

async function enforceHeartbeatTruth(response: Response, env: BoundEnv): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return response;

  let body: any = await response.json();
  body = await repairGenesisTransport(body, env);

  const node = body?.topology?.sovereign_pc;
  if (!node || typeof node !== "object") {
    return Response.json(body, { status: response.status, headers: response.headers });
  }

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
  async fetch(request: Request, env: BoundEnv): Promise<Response> {
    const url = new URL(request.url);
    const response = await convergence.fetch(request, env);
    if (url.pathname !== "/api/convergence/edge") return response;
    return enforceHeartbeatTruth(response, env);
  },
};
