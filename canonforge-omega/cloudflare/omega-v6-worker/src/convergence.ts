import base, { type Env } from "./index";
import { enhanceHdLaunchNavigation } from "./launchHdNavigation";
export { OmegaRuntime } from "./omegaRuntimeR203";

const GENESIS = "https://omega-genesis-v1.jeffdeweyeljefe.workers.dev";

async function jsonFrom(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { ok: false, error: "non_json_response", status: response.status, body_preview: text.slice(0, 240) }; }
}

async function probe(url: string): Promise<any> {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    const body = await jsonFrom(response);
    return { reachable: response.ok, status: response.status, body };
  } catch (error) {
    return { reachable: false, status: 0, error: String(error) };
  }
}

async function baseProbe(request: Request, env: Env, path: string): Promise<any> {
  try {
    const u = new URL(request.url); u.pathname = path; u.search = "";
    const response = await base.fetch(new Request(u.toString(), { method: "GET", headers: { accept: "application/json" } }), env);
    const body = await jsonFrom(response);
    return { reachable: response.ok, status: response.status, body };
  } catch (error) {
    return { reachable: false, status: 0, error: String(error) };
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/convergence/edge") {
      const [v6, genesis, hybrid] = await Promise.all([
        baseProbe(request, env, "/_omega/health"),
        probe(GENESIS + "/api/convergence/manifest"),
        baseProbe(request, env, "/api/omega/state"),
      ]);
      return new Response(JSON.stringify({
        ok: Boolean(v6.reachable && genesis.reachable),
        timestamp: new Date().toISOString(),
        topology: {
          v6: { edge: v6 },
          genesis: { edge: genesis },
          sovereign_pc: hybrid.body?.topology?.sovereign_pc || hybrid.body?.sovereign_pc || {},
        },
        convergence: {
          genesis_transport: genesis.reachable ? "PUBLIC_HTTPS" : "UNPROVEN",
          reciprocal_manifest_ready: Boolean(genesis.body?.ok),
          authority_contract_ready: Boolean(genesis.body?.authority_contract || genesis.body?.authorityContract),
          genesis_manifest_digest: genesis.body?.manifest_digest || genesis.body?.digest || null,
          authority_boundary: "V6 remains operational/release authority; Genesis remains discovery/evolution authority; authenticated Hybrid heartbeat remains required for PC ONLINE.",
        },
        development: hybrid.body?.development || {},
      }, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    }
    return enhanceHdLaunchNavigation(await base.fetch(request, env, ctx), url.pathname);
  },
};