export const SOURCE_GROUNDING_RELEASE_R197 = "r197-source-grounded-build-canon";
export const SOURCE_GROUNDING_SCHEMA_R197 = "OMEGA_SOURCE_GROUNDED_BUILD_CANON_R197";
export const SOURCE_GROUNDING_AUTHORITY_R197 = "ADMITTED_BUILD_CANON_RETRIEVAL_NOT_B059_FULL_CORPUS";

export type RuntimeFetchR197 = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;

type Fact = {
  id: string;
  topics: string[];
  sourceRoute: string;
  sourceSchema: string | null;
  statement: string;
  data: AnyObj;
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

async function sha256(value: unknown): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function getJson(request: Request, env: any, ctx: any, runtimeFetch: RuntimeFetchR197, path: string): Promise<{ ok: boolean; status: number; body: AnyObj | null }> {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = "";
  try {
    const response = await runtimeFetch(new Request(url.toString(), { method: "GET", headers: { accept: "application/json" } }), env, ctx);
    const body = await response.json().catch(() => null) as AnyObj | null;
    return { ok: response.ok && body?.ok !== false, status: response.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: { error: error instanceof Error ? error.message : String(error) } };
  }
}

function topicHits(query: string): Set<string> {
  const q = query.toLowerCase();
  const out = new Set<string>();
  if (/(address|hierarch|dimension|shell|20736|20,736|1728|1,728|248832|248,832|\b144\b|\b12\b)/.test(q)) out.add("address");
  if (/(woven|continuity|scar|partition|exchange|transform|invariant|re-context|recontext)/.test(q)) out.add("continuity");
  if (/(37|73|symmetr|asymmetr|kernel|bias)/.test(q)) out.add("kernel");
  if (/(orientation|sigma|σ|inverse|outverse|signed)/.test(q)) out.add("orientation");
  if (/(dewey|011|01-1|01m1|pair|water|mode\s*188|mode188|calculus)/.test(q)) out.add("dewey");
  return out;
}

function buildFacts(system: AnyObj, dewey: AnyObj): Fact[] {
  const architecture = system?.architecture || {};
  const hierarchy = Array.isArray(architecture.hierarchy) ? architecture.hierarchy : [];
  const continuity = Array.isArray(architecture.continuityOperator) ? architecture.continuityOperator : [];
  const deweyContinuity = Array.isArray(dewey?.wovenContinuity) ? dewey.wovenContinuity : [];
  const shells = Array.isArray(dewey?.shells) ? dewey.shells : hierarchy;
  const facts: Fact[] = [];

  if (hierarchy.length && architecture.hierarchyBoundary) facts.push({
    id: "OMEGA_ADDRESS_HIERARCHY_R195",
    topics: ["address"],
    sourceRoute: "/api/system/r195/manifest",
    sourceSchema: system?.schema || null,
    statement: `OMEGA address hierarchy is ${hierarchy.join(" → ")}. ${String(architecture.hierarchyBoundary)}.`,
    data: { hierarchy, hierarchyBoundary: architecture.hierarchyBoundary },
  });

  if (continuity.length || deweyContinuity.length) facts.push({
    id: "WOVEN_CONTINUITY_OPERATOR_R195",
    topics: ["continuity", "dewey"],
    sourceRoute: "/api/system/r195/manifest",
    sourceSchema: system?.schema || null,
    statement: `Woven Continuity is ${[...(continuity.length ? continuity : deweyContinuity)].join(" → ")}.`,
    data: { operator: continuity.length ? continuity : deweyContinuity },
  });

  if (architecture.referenceKernel) facts.push({
    id: "REFERENCE_KERNEL_POLICY_R195",
    topics: ["kernel"],
    sourceRoute: "/api/system/r195/manifest",
    sourceSchema: system?.schema || null,
    statement: `Reference kernel values are ${(architecture.referenceKernel.values || []).join("/")}; ${String(architecture.referenceKernel.boundary || "they are reference values only")}.`,
    data: architecture.referenceKernel,
  });

  if (architecture.orientation) facts.push({
    id: "ORIENTATION_POLICY_R195",
    topics: ["orientation"],
    sourceRoute: "/api/system/r195/manifest",
    sourceSchema: system?.schema || null,
    statement: String(architecture.orientation),
    data: { orientation: architecture.orientation },
  });

  if (shells.length && dewey?.operatorBasis) facts.push({
    id: "DEWEY_OPERATOR_BASIS_R195",
    topics: ["dewey", "address"],
    sourceRoute: "/api/compute/dewey/r195/manifest",
    sourceSchema: dewey?.schema || null,
    statement: `Dewey 011 / 01-1 is an exact relational basis computation over address shells ${shells.join(" → ")}; it is not a new physical primitive or physical-dimension claim.`,
    data: { operatorBasis: dewey.operatorBasis, shells, boundary: dewey.boundary || null },
  });

  if (dewey?.referenceKernelPolicy) facts.push({
    id: "DEWEY_REFERENCE_KERNEL_GUARD_R195",
    topics: ["kernel", "dewey"],
    sourceRoute: "/api/compute/dewey/r195/manifest",
    sourceSchema: dewey?.schema || null,
    statement: String(dewey.referenceKernelPolicy.note || "Contextual symmetry/asymmetry remains frame-dependent; fixed symmetry/asymmetry constants are not admitted."),
    data: dewey.referenceKernelPolicy,
  });

  if (dewey?.waterGeometry) facts.push({
    id: "DEWEY_WATER_GEOMETRY_BOUNDARY_R195",
    topics: ["dewey"],
    sourceRoute: "/api/compute/dewey/r195/manifest",
    sourceSchema: dewey?.schema || null,
    statement: `Water geometry is ${String(dewey.waterGeometry.type || "a computational field")} with physicalClaim=${String(dewey.waterGeometry.physicalClaim === true)}.`,
    data: dewey.waterGeometry,
  });

  return facts;
}

export async function sourceGroundedQueryR197(
  request: Request,
  env: any,
  ctx: any,
  runtimeFetch: RuntimeFetchR197,
  upstreamB059Status: number | null = null,
): Promise<Response> {
  const body = await request.json().catch(() => ({})) as AnyObj;
  const query = String(body.prompt || body.query || body.message || "").trim().slice(0, 32000);
  if (!query) return json({ ok: false, code: "SOURCE_GROUNDING_PROMPT_REQUIRED", schema: SOURCE_GROUNDING_SCHEMA_R197, canonicalMutation: false }, 422);

  const [systemCall, deweyCall] = await Promise.all([
    getJson(request, env, ctx, runtimeFetch, "/api/system/r195/manifest"),
    getJson(request, env, ctx, runtimeFetch, "/api/compute/dewey/r195/manifest"),
  ]);
  const sourceReady = systemCall.ok && deweyCall.ok;
  const hits = topicHits(query);
  const facts = sourceReady ? buildFacts(systemCall.body || {}, deweyCall.body || {}) : [];
  const evidence = facts.filter(fact => fact.topics.some(topic => hits.has(topic))).slice(0, 8);
  const grounded = sourceReady && evidence.length > 0;

  if (!grounded) {
    const core = {
      ok: false,
      schema: SOURCE_GROUNDING_SCHEMA_R197,
      release: SOURCE_GROUNDING_RELEASE_R197,
      query,
      code: sourceReady ? "BUILD_CANON_SCOPE_MISS" : "BUILD_CANON_SOURCE_UNAVAILABLE",
      grounded: false,
      source_scope: "ADMITTED_LIVE_BUILD_CANON_ONLY",
      evidence_count: 0,
      sources: {
        system: { route: "/api/system/r195/manifest", status: systemCall.status, ok: systemCall.ok },
        dewey: { route: "/api/compute/dewey/r195/manifest", status: deweyCall.status, ok: deweyCall.ok },
      },
      b059_full_corpus_verified: false,
      b059_upstream_status: upstreamB059Status,
      fully_trained_within_declared_scope: false,
      foundation_model_weights_trained: false,
      authority: SOURCE_GROUNDING_AUTHORITY_R197,
      canonicalMutation: false,
      promotionAuthorized: false,
    };
    return json({ ...core, receipt_sha256: await sha256(core) }, sourceReady ? 424 : 503);
  }

  const evidenceWithDigests = await Promise.all(evidence.map(async fact => ({
    ...fact,
    evidence_sha256: await sha256({ sourceRoute: fact.sourceRoute, sourceSchema: fact.sourceSchema, data: fact.data }),
  })));
  const answer = evidenceWithDigests.map(item => item.statement).join(" ");
  const core = {
    ok: true,
    schema: SOURCE_GROUNDING_SCHEMA_R197,
    release: SOURCE_GROUNDING_RELEASE_R197,
    query,
    grounded: true,
    answer,
    result: {
      decision: "STAY",
      answer,
      authority: SOURCE_GROUNDING_AUTHORITY_R197,
    },
    source_scope: "ADMITTED_LIVE_BUILD_CANON_ONLY",
    evidence_count: evidenceWithDigests.length,
    evidence: evidenceWithDigests,
    sources: {
      system: { route: "/api/system/r195/manifest", status: systemCall.status, ok: systemCall.ok, schema: systemCall.body?.schema || null, canonicalGitSha: systemCall.body?.canonicalGitSha || null },
      dewey: { route: "/api/compute/dewey/r195/manifest", status: deweyCall.status, ok: deweyCall.ok, schema: deweyCall.body?.schema || null },
    },
    b059_full_corpus_verified: false,
    b059_upstream_status: upstreamB059Status,
    b059_fallback_used: upstreamB059Status === 503,
    sovereign_b059_required_for_full_corpus: true,
    fully_trained_within_declared_scope: false,
    foundation_model_weights_trained: false,
    authority: SOURCE_GROUNDING_AUTHORITY_R197,
    canonicalMutation: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receipt_sha256: await sha256(core) });
}

export async function handleSourceGroundingR197(request: Request, env: any, ctx: any, runtimeFetch: RuntimeFetchR197): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/sai/source-query") return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["POST"], schema: SOURCE_GROUNDING_SCHEMA_R197 }, 405);
  return sourceGroundedQueryR197(request, env, ctx, runtimeFetch, null);
}
