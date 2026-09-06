const NODE_COUNT = 20_736;
const DEGREE = 7;
const EXPECTED_UNDIRECTED_EDGES = 72_576;
const BOUNDARY = "The 20,736-node graph is the transparent OMEGA reference topology: six cyclic D/P/R shell neighbors at fixed layer plus the recovered full-sphere antipode. It is a derived software topology, not a claim of 20,736 physical dimensions and not a byte-identical reconstruction of any unavailable donor edge list.";

type Edge = [number, number];
type Obj = Record<string, any>;
let edgeCache: Edge[] | null = null;

function finite(v: any, name: string): number {
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error(`${name} must be finite`);
  return x;
}
function address0(index: number): [number, number, number, number] {
  if (!Number.isInteger(index) || index < 0 || index >= NODE_COUNT) throw new Error("index must be in 0..20735");
  const d = Math.floor(index / 1728), r1 = index % 1728;
  const p = Math.floor(r1 / 144), r2 = r1 % 144;
  const r = Math.floor(r2 / 12), l = r2 % 12;
  return [d, p, r, l];
}
function index0(d: number, p: number, r: number, l: number): number {
  const w = (x: number) => ((x % 12) + 12) % 12;
  return (((w(d) * 12 + w(p)) * 12 + w(r)) * 12 + w(l));
}
function neighbors(index: number): number[] {
  const [d, p, r, l] = address0(index);
  return [
    index0(d + 1, p, r, l), index0(d - 1, p, r, l),
    index0(d, p + 1, r, l), index0(d, p - 1, r, l),
    index0(d, p, r + 1, l), index0(d, p, r - 1, l),
    index0(d + 6, 11 - p, 11 - r, l + 6),
  ];
}
function edges(): Edge[] {
  if (edgeCache) return edgeCache;
  const out: Edge[] = [];
  for (let source = 0; source < NODE_COUNT; source++) {
    for (const target of neighbors(source)) if (source < target) out.push([source, target]);
  }
  if (out.length !== EXPECTED_UNDIRECTED_EDGES) throw new Error(`reference edge count mismatch: ${out.length}`);
  edgeCache = out;
  return out;
}
async function sha(value: any): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(raw)].map(x => x.toString(16).padStart(2, "0")).join("");
}
const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" };
function json(value: any, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...cors } });
}
async function topologyManifest(): Promise<Obj> {
  const es = edges();
  return {
    schema: "OMEGA_ATLAS_REFERENCE_TOPOLOGY_R170",
    nodes: NODE_COUNT,
    undirected_edges: es.length,
    directed_neighbor_relations: NODE_COUNT * DEGREE,
    degree: DEGREE,
    shell_neighbors: 6,
    antipode_neighbors: 1,
    physical_dimension_claim: false,
    boundary: BOUNDARY,
    topology_sha256: await sha(es),
    evidenceClass: "DERIVED",
    canonicalMutation: false,
  };
}
async function diffuse(body: Obj): Promise<Obj> {
  const alpha = finite(body.diffusivity ?? 0.1, "diffusivity"), dt = finite(body.dt ?? 1, "dt"), steps = Math.trunc(finite(body.steps ?? 1, "steps")), topK = Math.trunc(finite(body.top_k ?? body.topK ?? 24, "top_k")), eps = finite(body.support_epsilon ?? body.supportEpsilon ?? 1e-15, "support_epsilon");
  if (alpha < 0 || dt <= 0 || steps < 1 || steps > 12 || topK < 1 || topK > 256 || eps < 0) throw new Error("require diffusivity>=0, dt>0, steps 1..12, top_k 1..256, support_epsilon>=0");
  const stability = alpha * dt * DEGREE;
  if (stability > 1 + 1e-15) throw new Error("explicit atlas diffusion requires diffusivity*dt*7 <= 1");
  const rawImpulses = Array.isArray(body.impulses) ? body.impulses : [];
  if (!rawImpulses.length || rawImpulses.length > 2048) throw new Error("impulses must contain 1..2048 entries");
  let values = new Float64Array(NODE_COUNT);
  for (let i = 0; i < rawImpulses.length; i++) {
    const raw = rawImpulses[i];
    const index = Math.trunc(finite(Array.isArray(raw) ? raw[0] : raw.index, `impulses[${i}].index`));
    const value = finite(Array.isArray(raw) ? raw[1] : raw.value, `impulses[${i}].value`);
    if (index < 0 || index >= NODE_COUNT || value < 0) throw new Error(`impulses[${i}] requires index 0..20735 and value >= 0`);
    values[index] += value;
  }
  const sum = (v: Float64Array) => { let s = 0; for (let i = 0; i < v.length; i++) s += v[i]; return s; };
  const invariantBefore = sum(values), factor = alpha * dt, es = edges(), stepResiduals: number[] = [];
  for (let step = 0; step < steps; step++) {
    const before = sum(values), delta = new Float64Array(NODE_COUNT);
    for (let e = 0; e < es.length; e++) {
      const [a, b] = es[e], flux = factor * (values[b] - values[a]);
      delta[a] += flux; delta[b] -= flux;
    }
    const next = new Float64Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) next[i] = values[i] + delta[i];
    values = next;
    stepResiduals.push(Math.abs(sum(values) - before));
  }
  const invariantAfter = sum(values);
  let min = Infinity, max = -Infinity, l2sq = 0, support = 0, entropy = 0;
  const ranking: [number, number][] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const v = values[i]; min = Math.min(min, v); max = Math.max(max, v); l2sq += v * v; if (v > eps) support++;
    if (v > 0 && invariantAfter > 0) { const p = v / invariantAfter; entropy -= p * Math.log(p); }
    ranking.push([i, v]);
  }
  ranking.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const topStates = ranking.slice(0, topK).map(([index, value]) => ({ index, address: address0(index).map(x => x + 1), value }));
  const result = {
    schema: "OMEGA_ATLAS_REFERENCE_DIFFUSION_R170",
    nodes: NODE_COUNT,
    undirected_edges: es.length,
    degree: DEGREE,
    diffusivity: alpha,
    dt,
    stability_number: stability,
    steps,
    invariant_before: invariantBefore,
    invariant_after: invariantAfter,
    invariant_absolute_residual: Math.abs(invariantAfter - invariantBefore),
    min_value: min,
    max_value: max,
    l2_norm: Math.sqrt(l2sq),
    normalized_entropy: invariantAfter > 0 ? entropy / Math.log(NODE_COUNT) : 0,
    support_above_epsilon: support,
    top_states: topStates,
    step_residuals: stepResiduals,
    boundary: BOUNDARY,
    evidenceClass: "DERIVED",
    canonicalMutation: false,
  };
  const receiptCore = { schema: "OMEGA_ATLAS_COMPUTE_RECEIPT_R170", kind: "ATLAS_REFERENCE_DIFFUSION_20736", inputSha256: await sha(body), resultSha256: await sha(result), evidenceClass: "DERIVED", canonicalMutation: false, nativeExecution: false, boundary: BOUNDARY };
  return { result, receipt: { ...receiptCore, receiptSha256: await sha(receiptCore) } };
}

export async function handleAtlasComputeRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return json(null, 204);
  const path = new URL(request.url).pathname;
  try {
    if (request.method === "GET" && path === "/api/compute/atlas/manifest") return json({ ok: true, topology: await topologyManifest() });
    if (request.method === "POST" && path === "/api/compute/atlas/diffusion") {
      const body = await request.json().catch(() => ({})) as Obj;
      return json({ ok: true, ...(await diffuse(body)) });
    }
    return json({ ok: false, code: "NOT_FOUND" }, 404);
  } catch (error) {
    return json({ ok: false, code: "INVALID_ATLAS_COMPUTATION", error: error instanceof Error ? error.message : String(error), boundary: BOUNDARY, canonicalMutation: false }, 422);
  }
}
