export const SAI_AI_FUSION_RELEASE = "r179-ai-sai-fusion-runtime";
export const B059_QUERY_SCHEMA = "OMEGA_SAI_B059_QUERY_RECEIPT_R179";
export const FUSION_RESULT_SCHEMA = "OMEGA_AI_SAI_FUSION_RESULT_R179";
export const CLOUD_RESULT_SCHEMA = "OMEGA_CLOUD_AI_RESULT_R179";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const ALLOWED_MODELS = new Set([
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/qwen/qwen2.5-coder-32b-instruct",
  "@cf/moonshotai/kimi-k2.6",
]);

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;

type FusionEnv = {
  AI?: { run(model: string, input: any): Promise<any> };
  SWARM_MODEL_ID?: string;
  BUILD_ID?: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

async function sha256(value: unknown): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function cleanPrompt(value: unknown): string {
  return String(value ?? "").trim().slice(0, 32000);
}

function routeAdmitted(route: any): boolean {
  if (!route || typeof route !== "object") return false;
  if (route.admitted === false || route.allowed === false || route.accepted === false) return false;
  const decision = String(route.decision ?? route.admission ?? route.gate ?? "").toLowerCase();
  if (/reject|deny|denied|block|blocked|hold|fail/.test(decision)) return false;
  if (route.admitted === true || route.allowed === true || route.accepted === true || route.admission === true) return true;
  if (/\b(admit|admitted|allow|allowed|accept|accepted|approve|approved|pass|passed)\b/.test(decision)) return true;
  return route.ok === true && route.route_before_generation === true && Boolean(route.route || route.target || route.specialist || route.selected);
}

function validB059Evidence(packet: any): boolean {
  return Boolean(
    packet && typeof packet === "object" &&
    packet.schema === B059_QUERY_SCHEMA &&
    packet.grounded === true &&
    packet.fully_trained_within_declared_scope === true &&
    packet.foundation_model_weights_trained === false &&
    typeof packet.receipt_sha256 === "string" && /^[a-f0-9]{64}$/.test(packet.receipt_sha256) &&
    packet.result && Array.isArray(packet.result.evidence) && packet.result.evidence.length > 0
  );
}

function selectModel(env: FusionEnv, body: any): string {
  const requested = String(body?.model || "");
  if (ALLOWED_MODELS.has(requested)) return requested;
  const configured = String(env.SWARM_MODEL_ID || DEFAULT_MODEL);
  return ALLOWED_MODELS.has(configured) ? configured : DEFAULT_MODEL;
}

function resultText(result: any): string {
  if (typeof result === "string") return result;
  if (typeof result?.response === "string") return result.response;
  if (typeof result?.result?.response === "string") return result.result.response;
  return JSON.stringify(result);
}

async function queryLocalSai(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch | undefined, prompt: string): Promise<any | null> {
  if (!canonicalFetch) return null;
  try {
    const url = new URL(request.url);
    url.pathname = "/api/sai/query";
    url.search = "";
    const response = await canonicalFetch(new Request(url.toString(), {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ prompt, limit: 8 }),
    }), env, ctx);
    if (!response.ok) return null;
    const packet = await response.json();
    return validB059Evidence(packet) ? packet : null;
  } catch {
    return null;
  }
}

function b059EvidenceText(packet: any): string {
  const result = packet?.result || {};
  const evidence = Array.isArray(result.evidence) ? result.evidence.slice(0, 12) : [];
  return JSON.stringify({
    training_scope: packet.training_scope,
    decision: result.decision,
    confidence: result.confidence,
    grounded_answer: result.answer,
    workflow: result.workflow,
    evidence: evidence.map((row: any) => ({
      source: row.source,
      record_key: row.record_key,
      source_row: row.source_row,
      role: row.role,
      domain: row.domain,
      operator: row.operator,
      decision: row.decision,
      stability: row.stability,
      evidence_score: row.evidence_score,
      question: row.question,
      answer: row.answer,
    })),
    b059_ledger_hash: result.ledger_hash,
    b059_receipt_sha256: packet.receipt_sha256,
  });
}

async function runCloudAi(env: FusionEnv, model: string, prompt: string, sai: any | null): Promise<any> {
  if (!env.AI || typeof env.AI.run !== "function") throw new Error("Workers AI binding is unavailable");
  const grounding = sai ? b059EvidenceText(sai) : "NO_VERIFIED_B059_EVIDENCE_AVAILABLE";
  const system = sai
    ? `You are the cloud AI synthesis organ inside OMEGA R179. OMEGA SAI B059 has supplied verified source-grounded evidence. Use that evidence as the primary project authority. Distinguish B059 evidence from your own provider-model synthesis. Do not invent a source, measurement, training event, canon mutation, or proof. Preserve the B059 decision/provenance where relevant. If the evidence is insufficient, say so. B059 evidence packet:\n${grounding}`
    : "You are the cloud AI provider organ inside OMEGA R179. No verified B059 evidence was available for this turn. Give a useful provider-model response but explicitly avoid claiming that it is SAI-grounded, OMEGA-trained, measured, or canonical.";
  return env.AI.run(model, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_tokens: 1800,
    temperature: 0.35,
  });
}

export async function handleSaiAiFusionR179(request: Request, env: FusionEnv, ctx: any, canonicalFetch?: CanonicalFetch): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/api/intelligence/r179/manifest") {
    return json({
      ok: true,
      schema: "OMEGA_AI_SAI_FUSION_MANIFEST_R179",
      release: SAI_AI_FUSION_RELEASE,
      workers_ai_binding: Boolean(env.AI),
      default_model: selectModel(env, {}),
      allowed_models: [...ALLOWED_MODELS],
      b059: {
        expected_schema: B059_QUERY_SCHEMA,
        training_scope: "DETERMINISTIC_SOURCE_GROUNDED_CORPUS_COMPILED_INDEXED_CALIBRATED",
        complete_supplied_corpus_authorities: 15,
        compiled_documents: 541526,
        graph_edges: 82082,
        address_space: 20736,
        retained_traversal: 188,
      },
      authority: {
        provider_model_pretrained_external: true,
        omega_trained_provider_weights: false,
        verified_b059_required_for_sai_grounded_claim: true,
        canon_mutation: false,
      },
    });
  }

  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!["/api/intelligence/r179/cloud", "/api/intelligence/r179/fuse", "/api/chat"].includes(url.pathname)) {
    return json({ ok: false, error: "r179_intelligence_route_not_found" }, 404);
  }

  const body = await request.json().catch(() => ({})) as any;
  const prompt = cleanPrompt(body.prompt ?? body.message);
  if (!prompt) return json({ ok: false, error: "prompt_required" }, 422);
  if (url.pathname === "/api/chat" && !routeAdmitted(body.route_preview)) {
    return json({ ok: false, error: "route_admission_required", boundary: "R179 keeps route-before-generation mandatory." }, 409);
  }

  let sai = validB059Evidence(body.sai_evidence) ? body.sai_evidence : null;
  if (!sai && body.use_sai !== false) sai = await queryLocalSai(request, env, ctx, canonicalFetch, prompt);
  if (url.pathname === "/api/intelligence/r179/fuse" && !sai) {
    return json({ ok: false, error: "verified_b059_evidence_required", boundary: "Fusion cannot be labeled SAI-grounded without an exact verified B059 query receipt." }, 409);
  }

  const model = selectModel(env, body);
  const started = Date.now();
  try {
    const provider = await runCloudAi(env, model, prompt, sai);
    const answer = resultText(provider);
    const resultCore = {
      schema: sai ? FUSION_RESULT_SCHEMA : CLOUD_RESULT_SCHEMA,
      release: SAI_AI_FUSION_RELEASE,
      mode: sai ? "VERIFIED_B059_PLUS_CLOUDFLARE_AI" : "CLOUDFLARE_AI_PROVIDER_ONLY",
      answer,
      model,
      provider: "CLOUDFLARE_WORKERS_AI",
      provider_model_pretrained_external: true,
      omega_trained_provider_weights: false,
      sai_grounded: Boolean(sai),
      sai_receipt_sha256: sai?.receipt_sha256 || null,
      sai_training_scope: sai?.training_scope || null,
      b059_fully_trained_within_declared_scope: Boolean(sai?.fully_trained_within_declared_scope),
      provider_usage: provider?.usage || provider?.result?.usage || null,
      elapsed_ms: Date.now() - started,
      route_admitted: url.pathname === "/api/chat" ? true : null,
      canonical_mutation: false,
      authority: sai ? "AI_SYNTHESIS_GROUNDED_BY_VERIFIED_B059_NOT_CANON" : "PROVIDER_MODEL_SYNTHESIS_NOT_SAI_NOT_CANON",
    };
    return json({ ...resultCore, receipt_sha256: await sha256(resultCore) });
  } catch (error) {
    return json({
      ok: false,
      schema: "OMEGA_AI_PROVIDER_FAILURE_R179",
      release: SAI_AI_FUSION_RELEASE,
      model,
      sai_grounded: Boolean(sai),
      error: String(error),
      canonical_mutation: false,
    }, 503);
  }
}
