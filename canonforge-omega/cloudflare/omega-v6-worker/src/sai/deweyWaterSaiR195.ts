import { handleSaiRequest } from "./saiRuntimeR179";
import { AnyObj, SwarmEnv, jsonResponse, sha } from "../swarm/swarmCoreR169";

export const DEWEY_WATER_SAI_RELEASE_R195 = "r195-source-bound-dewey-water-sai";
export const DEWEY_WATER_SAI_BOUNDARY_R195 = "R195 provides a source-bound executable context adapter over the existing provider-backed R179 SAI. It does not alter provider weights, does not prove fine-tuning, does not claim the conceptual Dewey/Water atlas is physical law, and cannot mutate CanonState. The adapter preserves the original R179 inference receipt and adds a deterministic context digest identifying the build-time source-bound rules injected into the mission.";

const SOURCES = Object.freeze([
  { id: "12iYNtUkHqlHtjpQot46HWURGe-TI8Kdz", title: "Dewey_Calculus_Elaborate_Whitepaper_v1.pdf", role: "ZERO_FREE_T12_LEDGER_CANON" },
  { id: "1Q9hKgW6R7jxzDFnGoaj0BokJAHixp5OU", title: "Mode188_Unified_Runtime_20736D_SYNCED.xlsx", role: "MODE188_PARAMETERS_AND_ATLAS" },
  { id: "1Flbg7drpujKdQhLKM030I_It9aPzEcPV", title: "Dewey_Calculus_20736D_Trig_Water_Force_Atlas.xlsx", role: "WATER_GEOMETRY_TRIG_MOTION_ATLAS" },
]);

const RULES = Object.freeze([
  "Treat 011 as constructive carry and 01-1 as pruning/inverse carry; preserve both separately when their net projection is zero.",
  "No-Nothing / zero-free semantics prohibit erasing opposed state by algebraic cancellation; retain opposition, scar/history and provenance, then require or explicitly withhold a turn when the declared tie threshold is met.",
  "T12 turns are cyclic basis rotations: tau_a composed with tau_b equals tau_(a+b mod 12); inverse tau_k is tau_(12-k). A turn is not a sign-flip annihilation.",
  "Woven continuity is partition -> exchange/transform -> invariant carry -> scar/residual carry -> re-contextualize/repartition.",
  "12, 144, 1728, 20736 and 248832 are software/address representation levels. Never call them literal physical dimensions.",
  "Water Geometry uses the declared sequence Source, Drop, Stream, River, Eddy, Wave, Tide, Vortex, Flood, Mist, Ice, Ocean across 30-degree phase increments. Treat this as a model/geometry operator unless independently tied to empirical physics.",
  "Mode188 source-bound parameters for this R195 adapter are epsilon=0.05, gamma_LambdaQ=0.35, STAY=1.05, TURN corridor threshold=0.90 and ESCALATE threshold=0.75. Any R195 dispatch computed from these is DERIVED_SCREENING_NOT_SOVEREIGN_MODE188.",
  "Use the existing R170 Lorentz, velocity, TMM, conservative transfer, diffusion and wave solvers for their documented mathematical/physical domains; do not substitute Dewey conceptual operators for those equations.",
  "Inevitability may be discussed only as a bounded diagnostic of accumulated coherence under the declared model. It is not probability, destiny or proof of physical inevitability.",
  "Provider output is proposal/synthesis, not CanonState. Preserve receipts, unresolved evidence gaps, external PC/RCWA truth gates and operator authority.",
]);

async function contextManifest() {
  const context = { release: DEWEY_WATER_SAI_RELEASE_R195, sources: SOURCES, rules: RULES };
  return {
    ok: true,
    schema: "OMEGA_DEWEY_WATER_SAI_CONTEXT_R195",
    release: DEWEY_WATER_SAI_RELEASE_R195,
    sourceBoundContextSha256: await sha(context),
    sources: SOURCES,
    rules: RULES,
    adaptation: "SOURCE_BOUND_CONTEXT_ADAPTER_OVER_R179_PROVIDER_BACKED_MULTI_AGENT_INFERENCE",
    providerWeightsModified: false,
    fineTuneClaim: false,
    canonicalMutation: false,
    evidenceClass: "SOURCE_BOUND_BUILD_TIME_CONTEXT",
    boundary: DEWEY_WATER_SAI_BOUNDARY_R195,
  };
}

export async function handleDeweyWaterSaiR195(request: Request, env: SwarmEnv): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/sai/r195/")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
  if (request.method === "GET" && path === "/api/sai/r195/manifest") return jsonResponse(await contextManifest());
  if (request.method !== "POST" || path !== "/api/sai/r195/infer") return jsonResponse({ ok: false, code: "NOT_FOUND", release: DEWEY_WATER_SAI_RELEASE_R195 }, 404);
  const body = await request.json().catch(() => ({})) as AnyObj;
  const operatorPrompt = String(body.prompt || body.message || body.intent || "").trim();
  if (!operatorPrompt) return jsonResponse({ ok: false, code: "SAI_PROMPT_REQUIRED", release: DEWEY_WATER_SAI_RELEASE_R195 }, 400);
  const manifest = await contextManifest();
  const sourceContext = [
    "R195 SOURCE-BOUND DEWEY/WATER COMPUTATION CONTEXT:",
    ...RULES.map((r, i) => `${i + 1}. ${r}`),
    "SOURCE IDENTITIES:",
    ...SOURCES.map(s => `- ${s.id} | ${s.title} | ${s.role}`),
    `CONTEXT SHA256: ${manifest.sourceBoundContextSha256}`,
    "OPERATOR INTENT:",
    operatorPrompt,
  ].join("\n");
  const nextUrl = new URL(request.url);
  nextUrl.pathname = "/api/sai/infer";
  const nextBody: AnyObj = {
    ...body,
    prompt: sourceContext,
    roles: Array.isArray(body.roles) && body.roles.length ? body.roles : ["MATHEMATICS", "SOFTWARE", "PHYSICS", "DATA", "PROOF", "COORDINATION"],
    depth: Math.max(1, Math.min(12, Math.trunc(Number(body.depth || 6)))),
    evidence: [
      ...(Array.isArray(body.evidence) ? body.evidence : []),
      { id: "OMEGA_DEWEY_WATER_CONTEXT_R195", type: "SOURCE_BOUND_BUILD_TIME_CONTEXT", sha256: manifest.sourceBoundContextSha256, sources: SOURCES.map(s => s.id), authority: "CONTEXT_NOT_MODEL_WEIGHT_TRAINING" },
    ],
  };
  const upstream = await handleSaiRequest(new Request(nextUrl.toString(), { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(nextBody) }), env);
  const raw = await upstream.clone().json().catch(() => null) as AnyObj | null;
  if (!raw) return upstream;
  return jsonResponse({
    ...raw,
    r195: {
      sourceBoundContextSha256: manifest.sourceBoundContextSha256,
      sourceCount: SOURCES.length,
      ruleCount: RULES.length,
      providerWeightsModified: false,
      fineTuneClaim: false,
      canonicalMutation: false,
      boundary: DEWEY_WATER_SAI_BOUNDARY_R195,
    },
  }, upstream.status);
}
