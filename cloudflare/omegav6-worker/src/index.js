const PRODUCT = "OMEGA_V6";
const PUBLIC_URL = "https://omegav6.jeffdeweyeljefe.workers.dev/";

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-omega-product", PRODUCT);
  headers.set("x-omega-authority", "genesis-service-binding");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function readJson(response) {
  const text = await response.text();
  try { return JSON.parse(text); }
  catch { return { error: "non_json_response", preview: text.slice(0, 180) }; }
}

async function genesisFetch(env, request, pathname = null) {
  if (!env.GENESIS || typeof env.GENESIS.fetch !== "function") {
    return new Response("GENESIS service binding unavailable", { status: 503 });
  }
  if (!pathname) return env.GENESIS.fetch(request);
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return env.GENESIS.fetch(new Request(url.toString(), request));
}

// Compatibility export required by the historical OMEGA V6 Durable Object lineage.
// Existing OmegaRuntime storage is deliberately left untouched: this class never
// reads, writes, deletes, or migrates state.storage. Requests reaching a legacy
// instance are forwarded to Genesis, which is now the sole canonical authority.
export class OmegaRuntime {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const response = await genesisFetch(this.env, request);
    const headers = new Headers(response.headers);
    headers.set("x-omega-legacy-runtime", "preserved-noncanonical-compatibility");
    headers.set("x-omega-authority", "genesis-service-binding");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
}

async function compositeHealth(request, env) {
  const [healthResponse, apiResponse] = await Promise.all([
    genesisFetch(env, request, "/_omega/health"),
    genesisFetch(env, request, "/api/health")
  ]);
  const health = await readJson(healthResponse);
  const api = await readJson(apiResponse);
  const digest = api?.canonical_digest;
  const ok = healthResponse.ok && apiResponse.ok && health?.ok === true &&
    health?.authority === "durable-object-canonical" &&
    api?.status === "OK" && api?.runtime === "OMEGA_GENESIS_CLOUD" &&
    typeof digest === "string" && digest.length === 64 &&
    api?.proof?.valid === true && api?.replay?.valid === true &&
    api?.replay?.current_digest === digest;
  return {
    ok,
    status: ok ? "OK" : "DEGRADED",
    product: PRODUCT,
    runtime: "OMEGA_V6_PUBLIC_FACADE",
    public_url: PUBLIC_URL,
    canonical_authority: "OMEGA_GENESIS_CLOUD",
    authority_transport: "cloudflare-service-binding",
    legacy_runtime_class: "OmegaRuntime",
    legacy_runtime_storage_policy: "PRESERVE_NO_MUTATION",
    canonical_digest: typeof digest === "string" ? digest : null,
    proof: api?.proof || null,
    replay: api?.replay || null,
    genesis: { ok: health?.ok === true, authority: health?.authority || null },
    build: env.BUILD_ID || "omegav6",
    canonical_mutation: false
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/_omega/health" || url.pathname === "/api/health") {
      const health = await compositeHealth(request, env);
      return json(health, { status: health.ok ? 200 : 503 });
    }

    if (url.pathname === "/api/convergence/edge") {
      const health = await compositeHealth(request, env);
      return json({
        schema: "OMEGA_V6_GENESIS_EDGE_V2",
        ok: health.ok,
        product: PRODUCT,
        role: "PUBLIC_PRODUCT_FACADE",
        public_url: PUBLIC_URL,
        canonical_runtime: "OMEGA_GENESIS_CLOUD",
        authority_transport: "cloudflare-service-binding",
        legacy_runtime_class: "OmegaRuntime",
        legacy_runtime_storage_policy: "PRESERVE_NO_MUTATION",
        canonical_digest: health.canonical_digest,
        proof_valid: health.proof?.valid === true,
        replay_valid: health.replay?.valid === true,
        boundary: "V6 is the public product surface. Historical OmegaRuntime storage is preserved without mutation. Genesis owns the only forward canonical state."
      }, { status: health.ok ? 200 : 503 });
    }

    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_omega/") || url.pathname === "/stream") {
      const response = await genesisFetch(env, request);
      const headers = new Headers(response.headers);
      headers.set("x-omega-product", PRODUCT);
      headers.set("x-omega-authority", "genesis-service-binding");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }

    if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
      return new Response("OMEGA V6 assets unavailable", { status: 503 });
    }
    return env.ASSETS.fetch(request);
  }
};
