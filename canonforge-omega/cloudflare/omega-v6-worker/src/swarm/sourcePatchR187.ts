import { AnyObj, SwarmEnv, clip, jsonResponse, modelText, sha } from "./swarmCoreR169";

export const SOURCE_PATCH_REVISION_R187 = "R187";
export const SOURCE_PATCH_DRAFT_SCHEMA_R187 = "OMEGA_SOURCE_PATCH_DRAFT_R187";
export const SOURCE_PATCH_SELECTION_SCHEMA_R187 = "OMEGA_SOURCE_PATCH_SELECTION_R187";
export const SOURCE_PATCH_MODEL_R187 = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const SOURCE_PATCH_MAX_FILES_R187 = 6;
export const SOURCE_PATCH_MAX_SOURCE_CHARS_R187 = 120000;

const ALLOWED_PREFIXES = [
  "omega_runtime/",
  "cloudflare/omega-v6-worker/src/",
  "tests/",
  "web/",
  "docs/",
];
const FORBIDDEN_PARTS = ["/.git/", "/.github/", "/node_modules/", "/__pycache__/", "/secrets/", "/credentials/"];
const FORBIDDEN_EXACT = new Set([".env", ".env.local", "pyproject.toml", "cloudflare/omega-v6-worker/wrangler.toml"]);
const FORBIDDEN_SUFFIX = [".pem", ".key", ".p12", ".pfx", ".crt", ".cer", ".sqlite", ".db", ".zip", ".exe", ".dll"];

const hash64 = (v: any) => /^[a-f0-9]{64}$/i.test(String(v || ""));
const gitSha = (v: any) => /^[a-f0-9]{40}([a-f0-9]{24})?$/i.test(String(v || ""));

function normalizedPath(raw: any): string | null {
  const value = String(raw || "").replaceAll("\\", "/").replace(/^\.\//, "").trim();
  if (!value || value.startsWith("/") || value.split("/").includes("..")) return null;
  const framed = `/${value.toLowerCase()}/`;
  if (FORBIDDEN_PARTS.some((part) => framed.includes(part))) return null;
  if (FORBIDDEN_EXACT.has(value.toLowerCase())) return null;
  if (FORBIDDEN_SUFFIX.some((suffix) => value.toLowerCase().endsWith(suffix))) return null;
  return ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix)) ? value : null;
}

function tokens(value: string): string[] {
  return [...new Set(String(value || "").toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 3))].slice(0, 80);
}

function pathScore(path: string, objective: string): number {
  const objectiveTokens = tokens(objective);
  const pathTokens = new Set(tokens(path));
  let score = objectiveTokens.reduce((sum, token) => sum + (pathTokens.has(token) ? 6 : path.toLowerCase().includes(token) ? 2 : 0), 0);
  if (/test|verify|proof|regress/.test(objective.toLowerCase()) && path.startsWith("tests/")) score += 8;
  if (/cloud|worker|swarm|federat/.test(objective.toLowerCase()) && path.startsWith("cloudflare/omega-v6-worker/src/")) score += 8;
  if (/sovereign|python|agent|runtime|patch/.test(objective.toLowerCase()) && path.startsWith("omega_runtime/")) score += 8;
  if (/visual|interface|ui|mobile|desktop/.test(objective.toLowerCase()) && path.startsWith("web/")) score += 7;
  if (/document|architecture|spec/.test(objective.toLowerCase()) && path.startsWith("docs/")) score += 4;
  return score;
}

function evidenceMission(body: AnyObj): { objective: string; evidenceSha256: string; predecessorGitSha: string; continuation: AnyObj } {
  const evidence = body.evidence || {};
  if (evidence.schema !== "OMEGA_EXECUTION_DERIVED_SUCCESSOR_EVIDENCE_R186") throw new Error("R186_EXECUTION_EVIDENCE_REQUIRED");
  if (!hash64(evidence.receiptSha256)) throw new Error("R186_EVIDENCE_HASH_REQUIRED");
  if (evidence.state !== "CONTINUE_SELF_DEVELOPMENT") throw new Error("R187_ONLY_CONSUMES_CONTINUATION_EVIDENCE");
  const continuation = evidence.continuation || evidence.improvementDiscovery?.continuation || evidence.successorEvaluation?.continuation || {};
  const objective = clip(body.objective || continuation.intent || continuation.objective || evidence.improvementDiscovery?.nextAction, 6000);
  if (!objective) throw new Error("CONTINUATION_OBJECTIVE_REQUIRED");
  const predecessorGitSha = String(body.predecessorGitSha || evidence.successorGitSha || evidence.designOutput?.sourceCommitSha || "").trim();
  if (!gitSha(predecessorGitSha)) throw new Error("EXACT_PREDECESSOR_GIT_SHA_REQUIRED");
  return { objective, evidenceSha256: String(evidence.receiptSha256).toLowerCase(), predecessorGitSha, continuation };
}

function inventoryRows(raw: any): AnyObj[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: AnyObj[] = [];
  for (const item of raw.slice(0, 2000)) {
    const path = normalizedPath(item?.path);
    if (!path || seen.has(path)) continue;
    const sha256 = String(item?.sha256 || "").toLowerCase();
    if (!hash64(sha256)) continue;
    seen.add(path);
    out.push({ path, sha256, bytes: Math.max(0, Number(item?.bytes || 0) || 0) });
  }
  return out;
}

function extractJson(text: string): AnyObj | null {
  const cleaned = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch {}
  }
  return null;
}

async function selectPaths(body: AnyObj, env: SwarmEnv): Promise<AnyObj> {
  const mission = evidenceMission(body);
  const inventory = inventoryRows(body.inventory);
  if (!inventory.length) throw new Error("SOURCE_INVENTORY_REQUIRED");
  const deterministic: AnyObj[] = [...inventory]
    .map((row: AnyObj): AnyObj => ({ ...row, score: pathScore(String(row.path), mission.objective) }))
    .sort((a: AnyObj, b: AnyObj) => Number(b.score) - Number(a.score) || Number(a.bytes) - Number(b.bytes) || String(a.path).localeCompare(String(b.path)))
    .slice(0, SOURCE_PATCH_MAX_FILES_R187);

  let selected = deterministic.map((row: AnyObj) => String(row.path));
  let selectionMethod = "DETERMINISTIC_LEXICAL_SOURCE_ROUTER";
  let modelReceipt: AnyObj | null = null;
  if (env.AI) {
    const shortlist: AnyObj[] = [...inventory]
      .map((row: AnyObj): AnyObj => ({ path: String(row.path), bytes: Number(row.bytes || 0), score: pathScore(String(row.path), mission.objective) }))
      .sort((a: AnyObj, b: AnyObj) => Number(b.score) - Number(a.score) || String(a.path).localeCompare(String(b.path)))
      .slice(0, 120);
    const prompt = [
      "You are the bounded OMEGA R187 source-file selector.",
      "Choose only files from the supplied shortlist that are most likely required to implement the exact objective.",
      `Choose 1-${SOURCE_PATCH_MAX_FILES_R187} paths. Prefer the smallest sufficient change set and include a directly relevant regression test when available.`,
      "Do not choose workflows, deployment config, secrets, credentials, package config, or files outside the shortlist.",
      'Return JSON only: {"paths":["..."],"reason":"..."}',
      `OBJECTIVE:\n${mission.objective}`,
      `SHORTLIST:\n${JSON.stringify(shortlist)}`,
    ].join("\n\n");
    try {
      const raw = await env.AI.run(String(env.SWARM_MODEL_ID || SOURCE_PATCH_MODEL_R187), { messages: [{ role: "user", content: prompt }], max_tokens: 1200, temperature: 0.05 });
      const parsed = extractJson(modelText(raw));
      const permitted = new Set(shortlist.map((x: AnyObj) => String(x.path)));
      const modelPaths = Array.isArray(parsed?.paths) ? parsed.paths.map(normalizedPath).filter((x): x is string => Boolean(x && permitted.has(x))).slice(0, SOURCE_PATCH_MAX_FILES_R187) : [];
      if (modelPaths.length) {
        selected = [...new Set(modelPaths)];
        selectionMethod = "WORKERS_AI_BOUNDED_SELECTION";
        modelReceipt = { model: String(env.SWARM_MODEL_ID || SOURCE_PATCH_MODEL_R187), reason: clip(parsed?.reason, 1600), rawTextSha256: await sha(modelText(raw)) };
      }
    } catch (error) {
      modelReceipt = { modelUnavailable: true, error: error instanceof Error ? error.message : String(error), fallback: selectionMethod };
    }
  }

  const inventoryMap = new Map(inventory.map((x: AnyObj) => [String(x.path), x]));
  const selectedRows = selected.map((path) => inventoryMap.get(path)).filter(Boolean);
  const core = {
    schema: SOURCE_PATCH_SELECTION_SCHEMA_R187,
    revision: SOURCE_PATCH_REVISION_R187,
    objective: mission.objective,
    predecessorGitSha: mission.predecessorGitSha,
    sourceEvidenceSha256: mission.evidenceSha256,
    continuation: mission.continuation,
    method: selectionMethod,
    selected: selectedRows,
    modelReceipt,
    maxFiles: SOURCE_PATCH_MAX_FILES_R187,
    authority: "SOURCE_SELECTION_NOT_MUTATION_AUTHORITY",
    canonicalMutation: false,
  };
  return { ...core, selectionSha256: await sha(JSON.stringify(core)) };
}

function sourceRows(body: AnyObj, selected: Set<string>): AnyObj[] {
  if (!Array.isArray(body.sources)) throw new Error("SELECTED_SOURCE_CONTENT_REQUIRED");
  const out: AnyObj[] = [];
  let chars = 0;
  for (const item of body.sources) {
    const path = normalizedPath(item?.path);
    if (!path || !selected.has(path)) continue;
    const content = String(item?.content ?? "");
    const digest = String(item?.sha256 || "").toLowerCase();
    if (!hash64(digest)) throw new Error(`SOURCE_HASH_REQUIRED:${path}`);
    chars += content.length;
    if (chars > SOURCE_PATCH_MAX_SOURCE_CHARS_R187) throw new Error("R187_SOURCE_CONTEXT_LIMIT_EXCEEDED");
    out.push({ path, sha256: digest, content });
  }
  if (!out.length || out.length !== selected.size) throw new Error("EVERY_SELECTED_SOURCE_MUST_BE_SUPPLIED_EXACTLY_ONCE");
  return out;
}

async function proposePatch(body: AnyObj, env: SwarmEnv): Promise<AnyObj> {
  if (!env.AI) throw new Error("WORKERS_AI_REQUIRED_FOR_SOURCE_SYNTHESIS");
  const mission = evidenceMission(body);
  const selection = body.selection || {};
  if (selection.schema !== SOURCE_PATCH_SELECTION_SCHEMA_R187 || !hash64(selection.selectionSha256)) throw new Error("R187_SELECTION_RECEIPT_REQUIRED");
  if (selection.predecessorGitSha !== mission.predecessorGitSha || selection.sourceEvidenceSha256 !== mission.evidenceSha256) throw new Error("R187_SELECTION_LINEAGE_MISMATCH");
  const selectedPaths = new Set<string>((selection.selected || []).map((x: AnyObj) => normalizedPath(x?.path)).filter(Boolean));
  if (!selectedPaths.size || selectedPaths.size > SOURCE_PATCH_MAX_FILES_R187) throw new Error("R187_SELECTION_EMPTY_OR_TOO_LARGE");
  const sources = sourceRows(body, selectedPaths);
  for (const row of sources) {
    const actual = await sha(row.content);
    if (actual !== row.sha256) throw new Error(`SOURCE_CONTENT_HASH_MISMATCH:${row.path}`);
  }

  const prompt = [
    "You are OMEGA R187 bounded source-patch synthesis.",
    "Implement the exact objective with the smallest coherent change. Preserve all unrelated behavior and existing public surfaces.",
    "You may modify only the supplied files. Do not invent credentials, deployment authority, hidden bypasses, shell commands, network exfiltration, workflow edits, package changes, or production mutation.",
    "Return COMPLETE UTF-8 replacement content only for files that actually need changes. If a supplied test file is relevant, update/add coverage inside that selected file.",
    'Return strict JSON only: {"changes":[{"path":"selected/path","content":"complete file text"}],"summary":"...","risks":["..."]}',
    `OBJECTIVE:\n${mission.objective}`,
    `CONTINUATION:\n${JSON.stringify(mission.continuation)}`,
    `SOURCES:\n${JSON.stringify(sources)}`,
  ].join("\n\n");
  const raw = await env.AI.run(String(env.SWARM_MODEL_ID || SOURCE_PATCH_MODEL_R187), { messages: [{ role: "user", content: prompt }], max_tokens: 12000, temperature: 0.08 });
  const text = modelText(raw);
  const parsed = extractJson(text);
  if (!parsed || !Array.isArray(parsed.changes)) throw new Error("R187_MODEL_DID_NOT_RETURN_VALID_PATCH_JSON");
  const sourceMap = new Map(sources.map((x) => [x.path, x]));
  const changes: AnyObj[] = [];
  const seen = new Set<string>();
  for (const rawChange of parsed.changes.slice(0, SOURCE_PATCH_MAX_FILES_R187)) {
    const path = normalizedPath(rawChange?.path);
    if (!path || !selectedPaths.has(path) || seen.has(path)) continue;
    const source = sourceMap.get(path);
    if (!source) continue;
    const content = String(rawChange?.content ?? "");
    if (!content || content === source.content) continue;
    if (content.length > 240000) throw new Error(`R187_PROPOSED_FILE_TOO_LARGE:${path}`);
    seen.add(path);
    changes.push({ path, beforeSha256: source.sha256, afterSha256: await sha(content), content, bytes: new TextEncoder().encode(content).length });
  }
  if (!changes.length) throw new Error("R187_MODEL_PROPOSED_NO_MATERIAL_SOURCE_DELTA");

  const core = {
    schema: SOURCE_PATCH_DRAFT_SCHEMA_R187,
    revision: SOURCE_PATCH_REVISION_R187,
    state: "PATCH_DRAFT_READY_FOR_SOVEREIGN_HASH_BINDING",
    objective: mission.objective,
    predecessorGitSha: mission.predecessorGitSha,
    sourceEvidenceSha256: mission.evidenceSha256,
    selectionSha256: selection.selectionSha256,
    changes,
    summary: clip(parsed.summary, 3000),
    risks: Array.isArray(parsed.risks) ? parsed.risks.map((x: any) => clip(x, 800)).slice(0, 12) : [],
    modelReceipt: { model: String(env.SWARM_MODEL_ID || SOURCE_PATCH_MODEL_R187), outputSha256: await sha(text) },
    requiredSovereignSequence: ["build R187 capsule", "verify exact predecessor/file hashes", "materialize", "apply approved worktree", "full pytest", "typecheck", "wrangler dry-run", "verify", "rollback on any failure"],
    gitCommitAuthorized: false,
    gitPushAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
    canonicalMutation: false,
    authority: "AI_GENERATED_SOURCE_PATCH_DRAFT_NOT_EXECUTION_AUTHORITY",
    truthBoundary: "Cloud AI may synthesize a bounded source draft from exact supplied source snapshots, but only the authenticated Sovereign host can hash-bind and apply it after predecessor verification. Failure must roll back; no commit, push, deploy or Canon promotion is granted here.",
  };
  return { ...core, draftSha256: await sha(JSON.stringify(core)) };
}

export async function handleSourcePatchR187(request: Request, env: SwarmEnv): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/swarm/patch/r187/manifest") return jsonResponse({
    ok: true,
    schema: "OMEGA_SOURCE_PATCH_MANIFEST_R187",
    revision: SOURCE_PATCH_REVISION_R187,
    consumes: "OMEGA_EXECUTION_DERIVED_SUCCESSOR_EVIDENCE_R186",
    requiresContinuationState: "CONTINUE_SELF_DEVELOPMENT",
    selection: "bounded source inventory -> deterministic/Workers AI path selection",
    synthesis: "exact source snapshots -> Workers AI complete-file patch draft",
    sovereignExecution: "exact predecessor/file hash check -> materialize -> apply -> regression -> rollback on failure",
    allowedPrefixes: ALLOWED_PREFIXES,
    maxFiles: SOURCE_PATCH_MAX_FILES_R187,
    automaticGitCommit: false,
    automaticGitPush: false,
    automaticDeployment: false,
    automaticCanonPromotion: false,
    canonicalMutation: false,
  });
  if (request.method === "POST" && path === "/api/swarm/patch/r187/select") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    try { return jsonResponse({ ok: true, ...(await selectPaths(body, env)) }); }
    catch (error) { return jsonResponse({ ok: false, revision: SOURCE_PATCH_REVISION_R187, code: error instanceof Error ? error.message : String(error), canonicalMutation: false }, 400); }
  }
  if (request.method === "POST" && path === "/api/swarm/patch/r187/propose") {
    const body = await request.json().catch(() => ({})) as AnyObj;
    try { return jsonResponse({ ok: true, ...(await proposePatch(body, env)) }); }
    catch (error) { return jsonResponse({ ok: false, revision: SOURCE_PATCH_REVISION_R187, code: error instanceof Error ? error.message : String(error), canonicalMutation: false }, 400); }
  }
  return jsonResponse({ ok: false, code: "R187_SOURCE_PATCH_ROUTE_NOT_FOUND", canonicalMutation: false }, 404);
}
