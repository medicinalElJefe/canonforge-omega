import { AnyObj, SwarmEnv, cellId, cellIndex, clip, evidence, jsonResponse, laneIndex, modelText, sha } from "../swarm/swarmCoreR169";

export const SAI_REVISION_R179 = "R179";
export const SAI_SCHEMA_R179 = "OMEGA_SAI_REAL_INTELLIGENCE_R179";
export const SAI_MODEL_R179 = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const SAI_SYNTHESIS_AUTHORITY_R179 = "MODEL_SYNTHESIS_NOT_CANON";
export const SAI_TRUTH_BOUNDARY_R179 = "R179 turns SAI from presentation-only context into a real, provider-backed, proof-receipted multi-agent inference surface. Workers AI and swarm-cell execution are real when their bindings return successful receipts. OMEGA-specific fine-tuning is not called complete unless an exact source-bound training corpus, train/eval split, adapter identity and regression gates are independently recorded. Model output cannot mutate CanonState or silently promote itself.";

const DESIGN_RULES = [
  "Single runtime spine controls state; renderer, menus, AI, forecast, camera, data and packaging remain governed submodules.",
  "12 x 12 x 12 = 1728 addressed swarm cells; x12 seed/layer lanes = 20736 execution positions. These are software address/execution-resolution levels, not physical dimensions.",
  "Partition -> exchange/transform -> invariant carry -> scar/residual carry -> re-contextualize/repartition.",
  "Operator remains authority. AI may plan, route, synthesize, critique and verify; canonical mutation and release promotion remain separate proof-gated actions.",
  "Archive, training partitions and Full Canon remain distinct source classes. Package partitions are not training bins.",
  "STAY / TURN / ESCALATE and Mode188 are governed decision layers; evidence authority must never be upgraded by language generation.",
  "Preserve prior capabilities additively; do not flatten working subsystems while improving another subsystem.",
];

const CORPUS_SOURCES = Object.freeze([
  { id: "12w_vkhiXU1RUx5YU4C4M232fyvoqx_XN", title: "OMEGA_ONE_SYSTEM_J_DRIVE_1728D_AUTOPING_LEDGER.xlsx", class: "SYSTEM_LEDGER", binding: "SOURCE_BOUND_BUILD_TIME" },
  { id: "1tvDDlPxHFTXMPN43-rE1kPKdmJW5uYj6", title: "OMEGA_ONE_SYSTEM_FULL_SOFTWARE_MENU_LEDGER.xlsx", class: "SOFTWARE_MENU_LEDGER", binding: "SOURCE_BOUND_BUILD_TIME" },
  { id: "1IXywRh1_hkw3bYi30q4EHk9K7txCw9mk", title: "METHODOLOGY.md", class: "METHODOLOGY", binding: "SOURCE_BOUND_BUILD_TIME" },
  { id: "118j4a7zwQUtZ8MR4hASpPQkYTHz3dzMO", title: "final_12_to_1_merge_workbook.xlsx", class: "MERGE_CONTROL", binding: "SOURCE_BOUND_BUILD_TIME" },
  { id: "1Q9hKgW6R7jxzDFnGoaj0BokJAHixp5OU", title: "Mode188_Unified_Runtime_20736D_SYNCED.xlsx", class: "MODE188_RUNTIME", binding: "SOURCE_BOUND_BUILD_TIME" },
]);

const UNRESOLVED_TRAINING_SOURCES = Object.freeze([
  "28_BIN_AI_TRAINING_EXACT_MANIFEST",
  "CRIMSON_ONE_EXACT_TRAINING_MANIFEST",
  "SEVEN_STAR_EXACT_TRAINING_MANIFEST",
]);

const SPECIALISTS = Object.freeze([
  { role: "PLANNER", domain: 0, phase: 0, regulation: 2, purpose: "decompose intent and preserve operator constraints" },
  { role: "SOFTWARE", domain: 1, phase: 9, regulation: 4, purpose: "implementation architecture, integration and regression risk" },
  { role: "RESEARCH", domain: 2, phase: 10, regulation: 10, purpose: "source/evidence differentiation and unresolved claims" },
  { role: "MATHEMATICS", domain: 3, phase: 2, regulation: 5, purpose: "formal structure, invariants and consistency" },
  { role: "PHYSICS", domain: 4, phase: 10, regulation: 5, purpose: "physical interpretation without upgrading model claims into measurement" },
  { role: "VISUAL", domain: 5, phase: 8, regulation: 7, purpose: "visual computation and interaction requirements" },
  { role: "DATA", domain: 6, phase: 1, regulation: 10, purpose: "corpus, schemas, provenance and data integrity" },
  { role: "FORECAST", domain: 7, phase: 7, regulation: 2, purpose: "bounded forecast and uncertainty separation" },
  { role: "TOOLS", domain: 8, phase: 9, regulation: 4, purpose: "tool execution plan and capability routing" },
  { role: "SOVEREIGN", domain: 9, phase: 9, regulation: 10, purpose: "authenticated PC/local compute handoff and execution boundaries" },
  { role: "PROOF", domain: 10, phase: 11, regulation: 10, purpose: "adversarial verification, proof gates and rollback" },
  { role: "COORDINATION", domain: 11, phase: 6, regulation: 7, purpose: "reconvergence, dependency ordering and whole-system continuity" },
]);

function trainingStatus(env: SwarmEnv): AnyObj {
  return {
    state: "OPERATIONAL_INFERENCE_NOT_FULLY_FINE_TUNED",
    workersAiBound: Boolean(env.AI?.run),
    swarmCellsBound: Boolean(env.OMEGA_SWARM_CELL),
    sourceBoundCorpusEntries: CORPUS_SOURCES.length,
    exactTrainingManifestComplete: false,
    unresolvedTrainingSources: [...UNRESOLVED_TRAINING_SOURCES],
    adaptation: {
      current: "SOURCE_BOUND_POLICY_CONTEXT_PLUS_MULTI_AGENT_INFERENCE",
      loraAdapterVerified: false,
      vectorCorpusVerified: false,
      trainEvalSplitVerified: false,
      regressionGateVerified: false,
    },
    completionRule: "Do not label OMEGA SAI fully trained until exact training sources are resolved, hashed, partitioned without leakage, an adapter or explicitly declared retrieval strategy is built, and held-out regression/adversarial gates pass.",
  };
}

function roleSelection(body: AnyObj): typeof SPECIALISTS[number][] {
  const requested = Array.isArray(body.roles) ? body.roles.map((x: any) => String(x || "").toUpperCase()) : [];
  const filtered = requested.length ? SPECIALISTS.filter(x => requested.includes(x.role)) : [...SPECIALISTS];
  const depth = Math.max(1, Math.min(12, Math.trunc(Number(body.depth || body.specialists || 6))));
  return filtered.slice(0, depth);
}

async function designEvidence(): Promise<AnyObj> {
  const summary = DESIGN_RULES.join(" ");
  return {
    id: "OMEGA_DESIGN_CANON_R179",
    type: "SOURCE_BOUND_DESIGN_RULES",
    sha256: await sha(summary),
    summary,
    authority: "BUILD_TIME_SOURCE_BOUND_DESIGN_RULES_NOT_MODEL_TRAINING_PROOF",
  };
}

async function runSpecialist(env: SwarmEnv, missionId: string, spec: typeof SPECIALISTS[number], prompt: string, ev: AnyObj[]): Promise<AnyObj> {
  if (!env.OMEGA_SWARM_CELL) return { ok: false, role: spec.role, code: "SWARM_CELL_BINDING_UNAVAILABLE" };
  const index = cellIndex(spec.domain, spec.phase, spec.regulation);
  const address = { domain: spec.domain, phase: spec.phase, regulation: spec.regulation, index };
  const id = cellId(address);
  const lane = laneIndex(address, spec.domain);
  const taskId = `${missionId}:${spec.role.toLowerCase()}`;
  const stub = env.OMEGA_SWARM_CELL.get(env.OMEGA_SWARM_CELL.idFromName(id));
  const task = {
    schema: "OMEGA_SAI_SPECIALIST_TASK_R179",
    missionId,
    taskId,
    cellId: id,
    index,
    lane,
    executor: "WORKERS_AI",
    intent: `SAI ROLE ${spec.role}. PURPOSE: ${spec.purpose}.\n\nOPERATOR INTENT:\n${prompt}`,
    evidence: ev,
    lineage: [`omega-v6:sai:${missionId}`, `role:${spec.role}`, `cell:${id}`],
  };
  try {
    const response = await stub.fetch(new Request("https://sai-cell.internal/task", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(task),
    }));
    const data = await response.json().catch(() => null) as AnyObj | null;
    const result = data?.result || {};
    return {
      ok: response.ok && data?.ok === true && result?.kind === "WORKERS_AI_CELL_SYNTHESIS",
      status: response.status,
      role: spec.role,
      purpose: spec.purpose,
      cellId: id,
      index,
      lane,
      provider: result?.provider || null,
      text: clip(result?.summary, 4200),
      receipt: data?.receipt ? {
        resultSha256: data.receipt.resultSha256 || null,
        runtimeMs: data.receipt.runtimeMs ?? null,
        evidence: data.receipt.evidence || [],
        canonicalMutation: data.receipt.canonicalMutation === true,
      } : null,
      authority: result?.authority || "NO_RESULT_FABRICATED",
    };
  } catch (error) {
    return { ok: false, role: spec.role, cellId: id, index, lane, code: "SPECIALIST_EXECUTION_FAILED", error: error instanceof Error ? error.message : String(error) };
  }
}

async function runGenesisProposal(env: SwarmEnv, missionId: string, prompt: string, ev: AnyObj[]): Promise<AnyObj | null> {
  if (!env.OMEGA_GENESIS_MACHINE?.fetch) return null;
  try {
    const response = await env.OMEGA_GENESIS_MACHINE.fetch(new Request("https://genesis.internal/api/federation/propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: prompt, evidence: ev, ceremony_id: missionId }),
    }));
    const data = await response.json().catch(() => null) as AnyObj | null;
    return { ok: response.ok, status: response.status, provider: "OMEGA_GENESIS_MACHINE", data, authority: "PROPOSAL_NOT_CANON" };
  } catch (error) {
    return { ok: false, status: 0, provider: "OMEGA_GENESIS_MACHINE", error: error instanceof Error ? error.message : String(error), authority: "NO_RESULT_FABRICATED" };
  }
}

async function infer(body: AnyObj, env: SwarmEnv): Promise<Response> {
  const prompt = clip(body.prompt || body.message || body.intent, 12000);
  if (!prompt) return jsonResponse({ ok: false, code: "SAI_PROMPT_REQUIRED", revision: SAI_REVISION_R179, canonicalMutation: false }, 400);
  if (!env.AI?.run) return jsonResponse({ ok: false, code: "SAI_WORKERS_AI_BINDING_UNAVAILABLE", training: trainingStatus(env), canonicalMutation: false }, 503);
  if (!env.OMEGA_SWARM_CELL) return jsonResponse({ ok: false, code: "SAI_SWARM_CELL_BINDING_UNAVAILABLE", training: trainingStatus(env), canonicalMutation: false }, 503);

  const selected = roleSelection(body);
  const baseEvidence = evidence(body.evidence);
  const canonEvidence = await designEvidence();
  const ev = [canonEvidence, ...baseEvidence].slice(0, 16);
  const missionSeed = await sha(`${prompt}|${selected.map(x => x.role).join(",")}|${canonEvidence.sha256}`);
  const missionId = `sai_${Date.now().toString(36)}_${missionSeed.slice(0, 12)}`;
  const startedAt = Date.now();

  const [specialists, genesis] = await Promise.all([
    Promise.all(selected.map(spec => runSpecialist(env, missionId, spec, prompt, ev))),
    runGenesisProposal(env, missionId, prompt, ev),
  ]);
  const successful = specialists.filter(x => x.ok && x.text);
  if (!successful.length) {
    return jsonResponse({
      ok: false,
      schema: SAI_SCHEMA_R179,
      revision: SAI_REVISION_R179,
      missionId,
      code: "SAI_NO_SPECIALIST_OUTPUT",
      specialists,
      genesis,
      training: trainingStatus(env),
      canonicalMutation: false,
      truthBoundary: SAI_TRUTH_BOUNDARY_R179,
    }, 502);
  }

  const contributionText = successful.map(x => `[${x.role} | ${x.cellId} | ${x.provider}]\n${x.text}`).join("\n\n").slice(0, 26000);
  const genesisText = genesis?.ok ? `\n\nGENESIS PROPOSAL (PROPOSAL_NOT_CANON):\n${clip(JSON.stringify(genesis.data), 6000)}` : "";
  const system = `You are the OMEGA SAI reconvergence runtime. Produce a useful whole-system answer from independently addressed specialist contributions. Preserve disagreements, evidence classes, unresolved source gaps and operator authority. Do not claim that OMEGA-specific fine-tuning is complete unless the training status proves exact corpus hashes, split, adapter identity and held-out regression gates. Do not claim physical measurement, native PC execution or CanonState mutation without explicit receipts. Preserve the established OMEGA runtime rather than flattening capabilities. The governing design rules are:\n- ${DESIGN_RULES.join("\n- ")}`;
  const raw = await env.AI.run(SAI_MODEL_R179, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: `OPERATOR INTENT:\n${prompt}\n\nSPECIALIST CONTRIBUTIONS:\n${contributionText}${genesisText}` },
    ],
    max_tokens: Math.max(512, Math.min(1800, Math.trunc(Number(body.maxTokens || 1200)))),
    temperature: 0.18,
    top_p: 0.9,
  });
  const text = modelText(raw);
  if (!text) return jsonResponse({ ok: false, code: "SAI_RECONVERGENCE_EMPTY", missionId, specialists, genesis, canonicalMutation: false }, 502);

  const completedAt = Date.now();
  const resultCore = {
    schema: SAI_SCHEMA_R179,
    revision: SAI_REVISION_R179,
    missionId,
    provider: SAI_MODEL_R179,
    answer: text.slice(0, 12000),
    specialistCount: selected.length,
    successfulSpecialists: successful.length,
    failedSpecialists: selected.length - successful.length,
    roles: selected.map(x => x.role),
    contributionHashes: successful.map(x => ({ role: x.role, cellId: x.cellId, resultSha256: x.receipt?.resultSha256 || null })),
    genesis: genesis ? { ok: genesis.ok, status: genesis.status, authority: genesis.authority } : { ok: false, status: null, authority: "BINDING_UNAVAILABLE" },
    corpus: { sourceBoundEntries: CORPUS_SOURCES.length, designRulesSha256: canonEvidence.sha256, unresolvedTrainingSources: [...UNRESOLVED_TRAINING_SOURCES] },
    authority: SAI_SYNTHESIS_AUTHORITY_R179,
    canonicalMutation: false,
    promotionAuthorized: false,
    startedAt,
    completedAt,
    runtimeMs: completedAt - startedAt,
  };
  const receipt = {
    schema: "OMEGA_SAI_INFERENCE_RECEIPT_R179",
    missionId,
    resultSha256: await sha(resultCore),
    evidenceSha256: await sha(ev),
    specialistReceiptSha256: await sha(successful.map(x => x.receipt?.resultSha256 || null)),
    provider: SAI_MODEL_R179,
    providerBacked: true,
    swarmBacked: true,
    sourceBoundPolicy: true,
    canonicalMutation: false,
    authority: "RETURNED_NOT_ADMITTED",
  };

  return jsonResponse({
    ok: true,
    result: resultCore,
    receipt: { ...receipt, receiptSha256: await sha(receipt) },
    specialists,
    genesis,
    training: trainingStatus(env),
    truthBoundary: SAI_TRUTH_BOUNDARY_R179,
  });
}

export async function handleSaiRequest(request: Request, env: SwarmEnv): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/sai/manifest") return jsonResponse({
    ok: true,
    schema: "OMEGA_SAI_MANIFEST_R179",
    revision: SAI_REVISION_R179,
    runtime: "REAL_PROVIDER_BACKED_MULTI_AGENT_INFERENCE",
    model: SAI_MODEL_R179,
    specialists: SPECIALISTS,
    hierarchy: { seed: 1, organs: 12, branches: 144, cells: 1728, lanes: 20736 },
    corpusSources: CORPUS_SOURCES,
    designRules: DESIGN_RULES,
    training: trainingStatus(env),
    operationalIntelligenceReady: Boolean(env.AI?.run && env.OMEGA_SWARM_CELL),
    canonicalMutation: false,
    truthBoundary: SAI_TRUTH_BOUNDARY_R179,
  });
  if (request.method === "GET" && path === "/api/sai/training/status") return jsonResponse({ ok: true, schema: "OMEGA_SAI_TRAINING_STATUS_R179", revision: SAI_REVISION_R179, training: trainingStatus(env), corpusSources: CORPUS_SOURCES, canonicalMutation: false, truthBoundary: SAI_TRUTH_BOUNDARY_R179 });
  if (request.method === "POST" && path === "/api/sai/infer") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    try { return await infer(body, env); }
    catch (error) { return jsonResponse({ ok: false, schema: "OMEGA_SAI_ERROR_R179", revision: SAI_REVISION_R179, code: "SAI_INFERENCE_FAILED", error: error instanceof Error ? error.message : String(error), canonicalMutation: false, truthBoundary: SAI_TRUTH_BOUNDARY_R179 }, 500); }
  }
  return jsonResponse({ ok: false, code: "NOT_FOUND", revision: SAI_REVISION_R179, canonicalMutation: false }, 404);
}

export function saiLabResponse(): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMEGA SAI R179</title><style>body{margin:0;background:#05070b;color:#eef4ff;font:14px/1.45 system-ui}.wrap{max-width:1180px;margin:auto;padding:22px}.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.card{border:1px solid #2c4058;border-radius:18px;background:#09111b;padding:16px}.ey{font:800 10px ui-monospace,monospace;letter-spacing:.12em;color:#8399b4}h1{font-size:clamp(2rem,5vw,4rem);margin:6px 0 10px}textarea{width:100%;min-height:180px;box-sizing:border-box;background:#03070c;color:#eef4ff;border:1px solid #34516e;border-radius:13px;padding:12px}button{margin-top:9px;border:1px solid #50749a;border-radius:11px;background:#11243a;color:#fff;padding:10px 14px;font-weight:800;cursor:pointer}pre{white-space:pre-wrap;word-break:break-word;max-height:620px;overflow:auto}.good{color:#6ed89f}.warn{color:#e2bd65}@media(max-width:820px){.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap"><div class="ey">OMEGA · REAL SAI EXECUTION</div><h1>SAI is an execution surface now, not an animation label.</h1><div class="grid"><section class="card"><div class="ey">OPERATOR INTENT</div><textarea id="p" placeholder="Give OMEGA SAI a real task…"></textarea><button id="run">RUN 6 SPECIALISTS + RECONVERGE</button><pre id="out">No inference run yet.</pre></section><aside class="card"><div class="ey">R179 MANIFEST / TRAINING TRUTH</div><pre id="status">Loading…</pre></aside></div></main><script>const q=s=>document.querySelector(s);async function status(){try{let r=await fetch('/api/sai/manifest',{cache:'no-store'}),d=await r.json();q('#status').textContent=JSON.stringify(d,null,2)}catch(e){q('#status').textContent=String(e)}}q('#run').onclick=async()=>{let p=q('#p').value.trim();if(!p)return;q('#run').disabled=true;q('#out').textContent='Executing provider-backed specialist cells…';try{let r=await fetch('/api/sai/infer',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:p,depth:6})}),d=await r.json();q('#out').textContent=JSON.stringify(d,null,2)}catch(e){q('#out').textContent=String(e)}q('#run').disabled=false;status()};status();</script></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
