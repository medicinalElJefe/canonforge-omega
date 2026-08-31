import heartbeatTruth, { OmegaRuntime } from "./heartbeatTruth";
import type { Env } from "./index";

export { OmegaRuntime };

type GenesisBinding = {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
};

type BoundEnv = Env & { GENESIS?: GenesisBinding };

const GENESIS_PUBLIC = "https://omega-genesis-v1.jeffdeweyeljefe.workers.dev";
const SUPPORTED_MANIFEST_SCHEMAS = new Set([
  "OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2",
  "OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3",
]);
const AUTHORITY_BOUNDARY =
  "V6 is canonical operational/release authority. Genesis is discovery, archive recovery and bounded candidate-evolution authority. A peer manifest may describe Genesis-owned Genesis state, but cannot promote Genesis into V6 release/canonical authority or make V6 a state facade.";

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { ok: false, error: "non_json_response", status: response.status, body_preview: text.slice(0, 240) }; }
}

async function readGenesisManifest(env: BoundEnv): Promise<{ reachable: boolean; status: number; body: any; transport: string }> {
  try {
    const request = new Request("https://omega-genesis.internal/api/convergence/manifest", {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (env.GENESIS) {
      const response = await env.GENESIS.fetch(request);
      return { reachable: response.ok, status: response.status, body: await readJson(response), transport: "SERVICE_BINDING" };
    }
    const response = await fetch(`${GENESIS_PUBLIC}/api/convergence/manifest`, { headers: { accept: "application/json" } });
    return { reachable: response.ok, status: response.status, body: await readJson(response), transport: "PUBLIC_FALLBACK" };
  } catch (error) {
    return { reachable: false, status: 0, body: { error: String(error) }, transport: "UNREACHABLE" };
  }
}

function authorityConflicts(manifest: any): string[] {
  const runtimeRole = String(manifest?.runtime?.role || "");
  const productRole = String(manifest?.public_product?.role || "");
  const stateRule = String(manifest?.public_product?.state_rule || "");
  const promotionBoundary = String(manifest?.promotion_boundary || "");
  const combined = `${runtimeRole}\n${productRole}\n${stateRule}\n${promotionBoundary}`.toLowerCase();
  const conflicts: string[] = [];
  if (runtimeRole === "GENESIS_CANONICAL_AUTHORITY") conflicts.push("Genesis manifest declares GENESIS_CANONICAL_AUTHORITY");
  if (productRole === "V6_PUBLIC_PRODUCT_FACADE") conflicts.push("Genesis manifest declares V6_PUBLIC_PRODUCT_FACADE");
  if (combined.includes("v6 holds no second canonical state") || combined.includes("state authority resolves to genesis")) conflicts.push("Genesis manifest routes V6 canonical state authority to Genesis");
  if (combined.includes("genesis owns canonical state")) conflicts.push("Genesis manifest claims canonical-state ownership beyond its discovery/evolution role");
  return conflicts;
}

async function applyManifestContract(response: Response, env: BoundEnv): Promise<Response> {
  if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) return response;
  const body = await readJson(response);
  if (!body || typeof body !== "object") return Response.json(body, { status: response.status, headers: response.headers });

  const probe = await readGenesisManifest(env);
  const manifest = probe.body || {};
  const schema = String(manifest.schema || body?.genesis?.manifest?.schema || "");
  const digest = manifest.manifest_digest || body?.genesis?.manifest?.digest || null;
  const schemaSupported = SUPPORTED_MANIFEST_SCHEMAS.has(schema);
  const conflicts = probe.reachable ? authorityConflicts(manifest) : ["Full Genesis manifest unavailable for authority verification"];
  const authorityCompatible = probe.reachable && conflicts.length === 0;

  body.genesis = body.genesis || {};
  body.genesis.manifest = body.genesis.manifest || {};
  body.genesis.manifest.schema = schema || null;
  body.genesis.manifest.digest = digest;
  body.genesis.manifest.transport = probe.transport;
  body.genesis.manifest.schema_supported = schemaSupported;
  body.genesis.manifest.authority_compatible = authorityCompatible;

  body.convergence = body.convergence || {};
  body.convergence.supported_manifest_schemas = [...SUPPORTED_MANIFEST_SCHEMAS];
  body.convergence.manifest_schema_supported = schemaSupported;
  body.convergence.authority_compatible = authorityCompatible;
  body.convergence.authority_conflicts = conflicts;
  body.convergence.authority_boundary = AUTHORITY_BOUNDARY;
  body.convergence.genesis_manifest_digest = digest;
  body.convergence.reciprocal_manifest_ready = Boolean(probe.reachable && schemaSupported && digest && authorityCompatible);

  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-manifest-schema", schema || "UNKNOWN");
  headers.set("x-omega-authority-compatible", String(authorityCompatible));
  return Response.json(body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: BoundEnv): Promise<Response> {
    const url = new URL(request.url);
    const response = await heartbeatTruth.fetch(request, env);
    if (url.pathname === "/api/convergence/edge") return applyManifestContract(response, env);
    return response;
  },
};
