export type AnyObj = Record<string, any>;
export type DurableBinding = {
  idFromName(name: string): any;
  get(id: any): { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };
};
export type SwarmEnv = AnyObj & {
  OMEGA_SWARM_CELL?: DurableBinding;
  OMEGA_SWARM_COORDINATOR?: DurableBinding;
  OMEGA_SWARM_BRANCH?: DurableBinding;
  OMEGA_SWARM_ORGAN?: DurableBinding;
  OMEGA_SWARM_ORGANISM?: DurableBinding;
  OMEGA_SWARM_AUTONOMIC?: DurableBinding;
  AI?: { run(model: string, input: AnyObj): Promise<any> };
  OMEGA_GENESIS_MACHINE?: { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };
  OMEGA_OPTICAL_MACHINE?: { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };
};

export const SWARM_SCHEMA = "OMEGA_SWARM_R121";
export const SWARM_RECOVERY_REVISION = "R169";
export const SWARM_SOURCE_COMMIT = "1b587801ce6e8e465a74cf5426fcc88a411bc824";
export const SWARM_AXIS = 12;
export const SWARM_CELL_COUNT = SWARM_AXIS ** 3;
export const SWARM_LANE_COUNT = SWARM_AXIS ** 4;
export const SWARM_MODEL_R121 = "@cf/google/gemma-4-26b-a4b-it";
export const ORGANISM_REVISION = "R123";
export const AUTONOMIC_REVISION = "R125";
export const CONTINUITY_LAW = "partition -> exchange/transform -> invariant carry -> scar/residual carry -> re-contextualize/repartition";
export const TRUTH_BOUNDARY = "12/144/1728/20736 are OMEGA address and execution-resolution levels, not physical dimensions. Swarm computation, model synthesis, execution quorum, and build capsules remain candidate/receipt state until admitted by canonical OMEGA authority.";

export const SWARM_DOMAIN_ROLES = Object.freeze([
  "ORCHESTRATION", "SOFTWARE", "RESEARCH", "MATHEMATICS", "PHYSICS", "VISUAL",
  "DATA", "FORECAST", "TOOLS", "SOVEREIGN", "PROOF", "COORDINATION",
]);
export const SWARM_PHASE_ROLES = Object.freeze([
  "FRAME", "PARTITION", "TRANSFORM", "EXCHANGE", "INVARIANT_CARRY", "SCAR_CARRY",
  "RECONTEXTUALIZE", "FORECAST", "SYNTHESIZE", "EXECUTE", "OBSERVE", "PROVE",
]);
export const SWARM_REGULATION_ROLES = Object.freeze([
  "EXPAND", "PRUNE", "STAY", "TURN", "ESCALATE", "CONSENSUS",
  "DIVERGE", "MERGE", "CACHE", "REPLAY", "AUDIT", "RECOVER",
]);
export const SWARM_MODES = Object.freeze(["SOLO", "FLOCK", "TREE", "PIPELINE", "CONSENSUS", "MIRROR", "FULL"]);
export const PROJECTIONS = Object.freeze([
  "FIELD", "MATTER", "TRAVERSAL", "FORECAST", "RELATIVITY", "INFINITY",
  "SCALE", "CONVERGENCE", "EARTH", "OPTICAL", "PROOF", "BUILD",
]);
export const DOMAIN_PREFERENCE: Record<string, number[]> = {
  FIELD: [0, 2, 6, 10, 11], MATTER: [4, 3, 6, 5, 10], TRAVERSAL: [0, 3, 8, 9, 10],
  FORECAST: [7, 6, 2, 10, 3], RELATIVITY: [3, 4, 2, 5, 10], INFINITY: [3, 2, 0, 10, 11],
  SCALE: [3, 5, 6, 10, 0], CONVERGENCE: [11, 0, 10, 6, 2], EARTH: [6, 7, 2, 5, 10],
  OPTICAL: [4, 3, 2, 10, 6], PROOF: [10, 6, 11, 0, 2], BUILD: [1, 8, 10, 11, 0],
};
export const MODE_COUNT: Record<string, number> = { SOLO: 1, MIRROR: 2, PIPELINE: 12, CONSENSUS: 12, FLOCK: 24, TREE: 144, FULL: 1728 };

export const clip = (v: any, n = 12000) => String(v ?? "").trim().slice(0, n);
export const num = (v: any, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
export const clamp = (v: any, a: number, b: number) => Math.max(a, Math.min(b, Math.trunc(num(v, a))));
export const c01 = (v: any) => Math.max(0, Math.min(1, num(v, 0)));

export function jsonResponse(value: any, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-swarm-runtime": "R121",
      "x-omega-organism-runtime": ORGANISM_REVISION,
      "x-omega-autonomic-runtime": AUTONOMIC_REVISION,
      "x-omega-swarm-recovery": SWARM_RECOVERY_REVISION,
    },
  });
}
export async function sha(value: any): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}
export async function merkle(leaves: any[]): Promise<string> {
  let level = (leaves || []).filter(Boolean).map(String).sort();
  if (!level.length) return sha("OMEGA_EMPTY_MERKLE_R169");
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(await sha(`${level[i]}|${level[i + 1] || level[i]}`));
    level = next;
  }
  return level[0];
}
export function modelText(result: any): string {
  if (typeof result === "string") return result;
  if (typeof result?.response === "string") return result.response;
  if (typeof result?.result?.response === "string") return result.result.response;
  const content = result?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}
export function stableSeed(value: any): number {
  let h = 2166136261 >>> 0;
  for (const ch of String(value ?? "")) { h ^= ch.codePointAt(0) || 0; h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
const validAxis = (v: number) => Number.isInteger(v) && v >= 0 && v < SWARM_AXIS;
export function cellIndex(domain: number, phase: number, regulation: number): number {
  if (![domain, phase, regulation].every(validAxis)) throw new Error("INVALID_SWARM_ADDRESS");
  return domain * 144 + phase * 12 + regulation;
}
export function decodeCell(index: any): AnyObj {
  const i = clamp(index, 0, SWARM_CELL_COUNT - 1), domain = Math.floor(i / 144), rem = i % 144;
  return { domain, phase: Math.floor(rem / 12), regulation: rem % 12, index: i };
}
export function cellId(a: AnyObj): string {
  return `omega-cell-${String(a.domain + 1).padStart(2, "0")}-${String(a.phase + 1).padStart(2, "0")}-${String(a.regulation + 1).padStart(2, "0")}`;
}
export function parseCellId(value: any): AnyObj | null {
  const m = String(value || "").match(/^omega-cell-(\d{2})-(\d{2})-(\d{2})$/i);
  if (!m) return null;
  const domain = Number(m[1]) - 1, phase = Number(m[2]) - 1, regulation = Number(m[3]) - 1;
  if (![domain, phase, regulation].every(validAxis)) return null;
  return { domain, phase, regulation, index: cellIndex(domain, phase, regulation), id: cellId({ domain, phase, regulation }) };
}
export function laneIndex(a: AnyObj, seed: number): number {
  return (((a.domain * 12 + a.phase) * 12 + a.regulation) * 12 + clamp(seed, 0, 11));
}
export function capabilityProfile(a: AnyObj): AnyObj {
  return { domainRole: SWARM_DOMAIN_ROLES[a.domain], phaseRole: SWARM_PHASE_ROLES[a.phase], regulationRole: SWARM_REGULATION_ROLES[a.regulation], address: { domain: a.domain, phase: a.phase, regulation: a.regulation }, cellId: cellId(a), lanes: 12 };
}
export function evidence(input: any): AnyObj[] {
  return (Array.isArray(input) ? input : []).slice(0, 16).map((x: any, i: number) => ({
    id: clip(x?.id || `evidence-${i + 1}`, 100), type: clip(x?.type || "OPERATOR_CONTEXT", 80),
    sha256: /^[a-f0-9]{64}$/i.test(String(x?.sha256 || "")) ? String(x.sha256).toLowerCase() : null,
    summary: clip(x?.summary || x?.text || "", 1200), authority: clip(x?.authority || "OPERATOR_SUPPLIED_NOT_INDEPENDENTLY_VERIFIED", 140),
  }));
}
function addUnique(out: number[], seen: Set<number>, value: number): void {
  const i = ((value % SWARM_CELL_COUNT) + SWARM_CELL_COUNT) % SWARM_CELL_COUNT;
  if (!seen.has(i)) { seen.add(i); out.push(i); }
}
function fill(out: number[], seen: Set<number>, count: number, seed: number): number[] {
  let x = seed % SWARM_CELL_COUNT, step = 137;
  while (out.length < count) { addUnique(out, seen, x); x = (x + step) % SWARM_CELL_COUNT; if (out.length < 2 && x === seed % SWARM_CELL_COUNT) step = 139; }
  return out;
}
export function selectCellIndices(mode: string, count: number, seed = 0): number[] {
  const m = mode.toUpperCase(), target = clamp(count, 1, SWARM_CELL_COUNT), out: number[] = [], seen = new Set<number>();
  if (m === "FULL") return Array.from({ length: SWARM_CELL_COUNT }, (_, i) => i);
  if (m === "SOLO") { addUnique(out, seen, seed); return out; }
  if (m === "MIRROR") { addUnique(out, seen, seed); addUnique(out, seen, seed + 864); return fill(out, seen, target, seed + 1); }
  if (m === "PIPELINE") { for (let d = 0; d < 12 && out.length < target; d++) addUnique(out, seen, cellIndex(d, (seed + d) % 12, (seed + 2 * d) % 12)); return fill(out, seen, target, seed + 17); }
  if (m === "CONSENSUS") { const d = seed % 12, p = Math.floor(seed / 12) % 12; for (let r = 0; r < 12 && out.length < target; r++) addUnique(out, seen, cellIndex(d, p, r)); return fill(out, seen, target, seed + 29); }
  if (m === "TREE") { for (let d = 0; d < 12 && out.length < target; d++) for (let p = 0; p < 12 && out.length < target; p++) addUnique(out, seen, cellIndex(d, p, (seed + d + p) % 12)); return fill(out, seen, target, seed + 43); }
  const stride = Math.max(1, Math.floor(SWARM_CELL_COUNT / target));
  for (let i = 0; i < target; i++) addUnique(out, seen, seed + i * stride);
  return fill(out, seen, target, seed + 59);
}
export function planMission(input: AnyObj = {}): AnyObj {
  const intent = clip(input.intent || input.text); if (!intent) throw new Error("INTENT_REQUIRED");
  const requestedMode = String(input.mode || "").toUpperCase(), mode = SWARM_MODES.includes(requestedMode) ? requestedMode : "TREE";
  const requestedCells = mode === "FULL" ? SWARM_CELL_COUNT : clamp(input.requestedCells ?? input.cells ?? MODE_COUNT[mode] ?? 144, 1, SWARM_CELL_COUNT);
  const seed = stableSeed(`${intent}|${input.seed ?? ""}`), indices = selectCellIndices(mode, requestedCells, seed), providerBudget = clamp(input.providerBudget ?? input.aiCells ?? Math.min(4, indices.length), 0, 12);
  const selected = indices.map((index, order) => { const address = decodeCell(index), profile = capabilityProfile(address); return { order, index, id: profile.cellId, address, profile, providerEligible: order < providerBudget, lane: laneIndex(address, (seed + order) % 12) }; });
  return { schema: "OMEGA_SWARM_PLAN_R121", intent, mode, requestedCells, providerBudget, seed, selected, organCounts: Array.from({ length: 12 }, (_, d) => selected.filter(x => x.address.domain === d).length), hierarchy: { seed: 1, organs: 12, branches: 144, cells: SWARM_CELL_COUNT, lanes: SWARM_LANE_COUNT }, continuityLaw: CONTINUITY_LAW, truthBoundary: TRUTH_BOUNDARY };
}
export function compactPlan(p: AnyObj): AnyObj {
  return { schema: p.schema, intent: p.intent, mode: p.mode, requestedCells: p.requestedCells, providerBudget: p.providerBudget, seed: p.seed, organCounts: p.organCounts, hierarchy: p.hierarchy, continuityLaw: p.continuityLaw, truthBoundary: p.truthBoundary, sampleCells: p.selected.slice(0, 24).map((x: AnyObj) => ({ id: x.id, index: x.index, address: x.address, profile: x.profile, lane: x.lane, providerEligible: x.providerEligible })) };
}
export async function schedule(storage: any, delayMs: number): Promise<void> {
  if (typeof storage?.setAlarm === "function") await storage.setAlarm(Date.now() + delayMs);
}
export function publicMission(m: AnyObj | null): AnyObj | null {
  if (!m) return null;
  const { pending, queue, providerOutputs, providerContributions, ...rest } = m;
  const total = num(m.total || m.totalCells), done = num(m.completed || m.completedCells) + num(m.failed || m.failedCells);
  return { ...rest, pendingCount: Array.isArray(pending) ? pending.length : undefined, queueDepth: Array.isArray(queue) ? queue.length : undefined, providerOutputCount: Array.isArray(providerOutputs) ? providerOutputs.length : undefined, providerContributionCount: Array.isArray(providerContributions) ? providerContributions.length : undefined, progress: total ? Math.round((done / total) * 1000) / 10 : 0 };
}
export const branchKey = (domain: number, phase: number) => `${String(domain + 1).padStart(2, "0")}:${String(phase + 1).padStart(2, "0")}`;
