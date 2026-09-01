import heartbeatTruth, { OmegaRuntime } from "./heartbeatTruth";
import type { Env } from "./index";

export { OmegaRuntime };

type GenesisBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type BoundEnv = Env & { GENESIS?: GenesisBinding };

const GENESIS_SCHEMA_V3 = "OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3";
const AUTHORITY_CONTRACT = "OMEGA_ROLE_SEPARATED_CONVERGENCE_V1";
const GENESIS_ROLE = "GENESIS_DISCOVERY_EVOLUTION_AUTHORITY";
const V6_ROLE = "V6_CANONICAL_OPERATIONAL_RUNTIME";
const V6_RELEASE_BRANCH = "omega-v6-full-convergence";

function authorityCompatible(manifest: any): boolean {
  if (!manifest || typeof manifest !== "object") return false;
  const runtime = manifest.runtime || {};
  const product = manifest.public_product || {};
  return Boolean(
    manifest.schema === GENESIS_SCHEMA_V3 &&
    manifest.authority_contract === AUTHORITY_CONTRACT &&
    runtime.role === GENESIS_ROLE &&
    runtime.operational_release_authority === false &&
    product.role === V6_ROLE &&
    product.release_authority === V6_RELEASE_BRANCH &&
    product.genesis_may_deploy_v6 === false &&
    typeof manifest.manifest_digest === "string" &&
    manifest.manifest_digest.length === 64
  );
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { ok: false, error: "non_json_response", status: response.status, body_preview: text.slice(0, 240) }; }
}

async function observeGenesisManifest(env: BoundEnv): Promise<any | null> {
  if (!env.GENESIS) return null;
  try {
    const response = await env.GENESIS.fetch(new Request("https://omega-genesis.internal/api/convergence/manifest", {
      method: "GET",
      headers: { accept: "application/json" },
    }));
    if (!response.ok) return null;
    return await readJson(response);
  } catch {
    return null;
  }
}

async function enforceRoleContract(response: Response, env: BoundEnv): Promise<Response> {
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return response;

  const body: any = await response.json();
  const manifest = await observeGenesisManifest(env);
  const compatible = authorityCompatible(manifest);

  body.convergence = body.convergence || {};
  body.genesis = body.genesis || {};
  body.genesis.manifest = body.genesis.manifest || {};

  if (manifest) {
    const runtime = manifest.runtime || {};
    const product = manifest.public_product || {};
    body.genesis.manifest.schema = manifest.schema || null;
    body.genesis.manifest.digest = manifest.manifest_digest || null;
    body.genesis.manifest.authority_contract = manifest.authority_contract || null;
    body.genesis.manifest.runtime_role = runtime.role || null;
    body.genesis.manifest.operational_release_authority = runtime.operational_release_authority ?? null;
    body.genesis.manifest.public_product_role = product.role || null;
    body.genesis.manifest.release_authority = product.release_authority || null;
    body.genesis.manifest.genesis_may_deploy_v6 = product.genesis_may_deploy_v6 ?? null;
    body.genesis.manifest.authority_boundary = manifest.authority_boundary || null;
  }

  body.convergence.reciprocal_manifest_ready = compatible;
  body.convergence.authority_contract_ready = compatible;
  body.convergence.authority_contract = manifest?.authority_contract || null;
  body.convergence.authority_boundary = "Genesis may discover, recover, test and propose. OMEGA V6 alone owns the operational/release lifecycle on omega-v6-full-convergence.";
  body.convergence.genesis_may_deploy_v6 = false;
  body.convergence.v6_release_authority = V6_RELEASE_BRANCH;

  return Response.json(body, { status: response.status, headers: response.headers });
}

export default {
  async fetch(request: Request, env: BoundEnv): Promise<Response> {
    const response = await heartbeatTruth.fetch(request, env);
    const path = new URL(request.url).pathname;
    if (path === "/api/convergence/edge") return enforceRoleContract(response, env);
    return response;
  },
};
