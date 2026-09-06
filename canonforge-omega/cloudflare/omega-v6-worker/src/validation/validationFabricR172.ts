import { C_M_S, handleComputeRequest } from "../compute/computeTruthR170";

type Obj = Record<string, any>;
type Vec3 = [number, number, number];
type Cx = { re: number; im: number };

export const VALIDATION_SCHEMA_R172 = "OMEGA_HETEROGENEOUS_VALIDATION_R172";
export const VALIDATION_BOUNDARY_R172 = "Validation is evidence about a computation, not a new physical observation. Replica agreement, independent identities, cross-runtime parity, independent solver families, and external measurement are distinct evidence classes and must not be collapsed into one confidence number. 12/144/1728/20736 remain software address/execution-resolution levels, not physical dimensions.";
export const VALIDATION_LEVELS = Object.freeze([
  { level: 0, id: "REPLICA_CONSISTENCY", meaning: "same implementation replicated; useful for execution/fault divergence only" },
  { level: 1, id: "INVARIANT_IDENTITY", meaning: "independent conserved quantity, stability condition, or algebraic identity" },
  { level: 2, id: "INDEPENDENT_FORMULATION", meaning: "different formulation/algorithm for the same physical model" },
  { level: 3, id: "CROSS_RUNTIME_PARITY", meaning: "independent runtime/language implementation of the same model" },
  { level: 4, id: "INDEPENDENT_SOLVER_FAMILY", meaning: "different numerical/physical solver family with overlapping validity" },
  { level: 5, id: "EXTERNAL_MEASUREMENT", meaning: "instrument or trusted observed-source comparison" },
]);

const finite = (v: any, name: string): number => {
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error(`${name} must be finite`);
  return x;
};
const vec3 = (v: any, name: string): Vec3 => {
  if (!Array.isArray(v) || v.length !== 3) throw new Error(`${name} must contain exactly three finite values`);
  return [finite(v[0], `${name}[0]`), finite(v[1], `${name}[1]`), finite(v[2], `${name}[2]`)];
};
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b));
const cx = (re = 0, im = 0): Cx => ({ re, im });
const cadd = (a: Cx, b: Cx): Cx => cx(a.re + b.re, a.im + b.im);
const cmul = (a: Cx, b: Cx): Cx => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cdiv = (a: Cx, b: Cx): Cx => { const d = b.re * b.re + b.im * b.im; if (d <= 1e-36) throw new Error("complex denominator is singular"); return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const cabs2 = (a: Cx) => a.re * a.re + a.im * a.im;
async function sha(value: any): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(raw)].map(x => x.toString(16).padStart(2, "0")).join("");
}
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" };
function json(value: any, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });
}
function check(id: string, method: string, passed: boolean, residual: number | null, tolerance: number | null, detail: Obj = {}): Obj {
  return { id, method, passed, residual, tolerance, ...detail };
}

function lorentzMatrixValidation(input: Obj, result: Obj): Obj[] {
  const t = finite(input.t_seconds ?? input.tSeconds, "t_seconds"), r = vec3(input.position_m ?? input.positionM, "position_m"), v = vec3(input.frame_velocity_m_s ?? input.frameVelocityMS, "frame_velocity_m_s");
  const beta: Vec3 = [v[0] / C_M_S, v[1] / C_M_S, v[2] / C_M_S], beta2 = dot(beta, beta);
  if (beta2 >= 1) throw new Error("frame speed must be strictly less than c");
  const gamma = 1 / Math.sqrt(1 - beta2), x = [C_M_S * t, r[0], r[1], r[2]], L = Array.from({ length: 4 }, () => Array(4).fill(0));
  L[0][0] = gamma;
  for (let i = 0; i < 3; i++) { L[0][i + 1] = -gamma * beta[i]; L[i + 1][0] = -gamma * beta[i]; }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) L[i + 1][j + 1] = (i === j ? 1 : 0) + (beta2 > 0 ? (gamma - 1) * beta[i] * beta[j] / beta2 : 0);
  const y = L.map(row => row.reduce((s, a, i) => s + a * x[i], 0)), expectedT = y[0] / C_M_S, expectedR = y.slice(1), actualR = Array.isArray(result.transformed_position_m) ? result.transformed_position_m.map(Number) : [];
  const diffs = [rel(expectedT, Number(result.transformed_t_seconds)), ...expectedR.map((a, i) => rel(a, Number(actualR[i])))], maxDiff = Math.max(...diffs), before = x[0] * x[0] - r.reduce((s, a) => s + a * a, 0), after = y[0] * y[0] - expectedR.reduce((s, a) => s + a * a, 0), invariant = rel(before, after);
  return [
    check("LORENTZ_MATRIX_PARITY", "LORENTZ_4X4_MATRIX", maxDiff < 2e-12, maxDiff, 2e-12, { validationLevel: 2, formulation: "4x4 matrix multiplication versus vector-decomposition reference" }),
    check("MINKOWSKI_INVARIANT", "INVARIANT_IDENTITY", invariant < 2e-12, invariant, 2e-12, { validationLevel: 1 }),
  ];
}

function recursiveLosslessOptics(input: Obj, result: Obj): Obj[] {
  const wl = finite(input.wavelength_nm ?? input.wavelengthNm, "wavelength_nm"), n0 = finite(input.incident_n ?? input.incidentN ?? 1, "incident_n"), ns = finite(input.substrate_n ?? input.substrateN ?? 1.5, "substrate_n"), layers = Array.isArray(input.layers) ? input.layers : [];
  const passiveLossless = layers.every((layer: Obj) => Number(layer.k ?? 0) === 0 && Number(layer.n) > 0 && Number(layer.thickness_nm ?? layer.thicknessNm) >= 0);
  const out: Obj[] = [check("TMM_ENERGY_BALANCE", "ENERGY_IDENTITY", Number(result.energy_balance_residual) < 2e-12, Number(result.energy_balance_residual), 2e-12, { validationLevel: 1 })];
  if (!passiveLossless || wl <= 0 || n0 <= 0 || ns <= 0) return out;
  let Y: Cx = cx(ns);
  for (let i = layers.length - 1; i >= 0; i--) {
    const n = finite(layers[i].n, `layers[${i}].n`), d = finite(layers[i].thickness_nm ?? layers[i].thicknessNm, `layers[${i}].thickness_nm`), delta = 2 * Math.PI * n * d / wl, c = Math.cos(delta), s = Math.sin(delta);
    const numerator = cadd(cx(Y.re * c, Y.im * c), cx(0, n * s)), denominator = cadd(cx(c), cmul(cx(0, s / n), Y));
    Y = cdiv(numerator, denominator);
  }
  const r = cdiv(cx(n0 - Y.re, -Y.im), cx(n0 + Y.re, Y.im)), recursiveR = cabs2(r), tmmR = Number(result.reflectance), parity = rel(recursiveR, tmmR);
  out.push(check("OPTICAL_RECURSIVE_PARITY", "ADMITTANCE_RECURSION", parity < 2e-11, parity, 2e-11, { validationLevel: 2, recursiveReflectance: recursiveR, tmmReflectance: tmmR, formulation: "recursive input-admittance versus 2x2 characteristic matrix" }));
  return out;
}

function continuityValidation(input: Obj, result: Obj): Obj[] {
  const values = Array.isArray(input.values) ? input.values.map(Number) : [], after = Array.isArray(result.values_after) ? result.values_after.map(Number) : [], beforeSum = values.reduce((a, b) => a + b, 0), afterSum = after.reduce((a, b) => a + b, 0), residual = rel(beforeSum, afterSum);
  return [check("CONSERVATIVE_SUM", "INVARIANT_IDENTITY", residual < 2e-12, residual, 2e-12, { validationLevel: 1, independentlyRecomputedBefore: beforeSum, independentlyRecomputedAfter: afterSum })];
}
function diffusionValidation(result: Obj): Obj[] {
  const residual = Number(result.invariant_relative_residual ?? result.invariant_absolute_residual), stability = Number(result.stability_number), min = Number(result.min_after ?? result.min_value ?? 0);
  return [
    check("DIFFUSION_CONSERVATION", "INVARIANT_IDENTITY", Number.isFinite(residual) && residual < 2e-12, residual, 2e-12, { validationLevel: 1 }),
    check("DIFFUSION_STABILITY", "STABILITY_BOUND", Number.isFinite(stability) && stability <= 1 + 1e-15, Number.isFinite(stability) ? Math.max(0, stability - 1) : null, 1e-15, { validationLevel: 1, stabilityNumber: stability, nonnegativeMinimum: min }),
  ];
}
function waveValidation(result: Obj): Obj[] {
  const cfl = Number(result.cfl), state = Array.isArray(result.final_state) ? result.final_state.map(Number) : [], finiteState = state.length > 0 && state.every(Number.isFinite);
  return [check("SCALAR_WAVE_CFL", "STABILITY_BOUND", Number.isFinite(cfl) && cfl <= 1 + 1e-15 && finiteState, Number.isFinite(cfl) ? Math.max(0, cfl - 1) : null, 1e-15, { validationLevel: 1, cfl, finiteState, note: "This validates the declared scalar-wave scheme boundary; it is not Maxwell validation." })];
}
function atlasValidation(result: Obj): Obj[] {
  const residual = Number(result.invariant_absolute_residual), stability = Number(result.stability_number), nodes = Number(result.nodes), edges = Number(result.undirected_edges), degree = Number(result.degree);
  return [
    check("ATLAS_TOPOLOGY_IDENTITY", "TOPOLOGY_INVARIANT", nodes === 20736 && edges === 72576 && degree === 7, nodes === 20736 && edges === 72576 && degree === 7 ? 0 : 1, 0, { validationLevel: 1, nodes, edges, degree }),
    check("ATLAS_DIFFUSION_CONSERVATION", "INVARIANT_IDENTITY", Number.isFinite(residual) && residual < 2e-12 && stability <= 1 + 1e-15, residual, 2e-12, { validationLevel: 1, stabilityNumber: stability }),
  ];
}
function validatorsFor(path: string, input: Obj, result: Obj): Obj[] {
  if (path === "/api/compute/relativity/event") return lorentzMatrixValidation(input, result);
  if (path === "/api/compute/optics/tmm") return recursiveLosslessOptics(input, result);
  if (path === "/api/compute/continuity/transfer") return continuityValidation(input, result);
  if (path === "/api/compute/continuity/diffusion") return diffusionValidation(result);
  if (path === "/api/compute/wave/fdtd1d") return waveValidation(result);
  if (path === "/api/compute/atlas/diffusion") return atlasValidation(result);
  return [check("SUPPORTED_REFERENCE_OUTPUT", "SCHEMA_BOUNDARY", Boolean(result && typeof result === "object"), null, null, { validationLevel: 0 })];
}
function highestLevel(validators: Obj[]): number { return validators.reduce((m, v) => v.passed ? Math.max(m, Number(v.validationLevel) || 0) : m, 0); }

async function referenceValidation(body: Obj): Promise<Response> {
  const path = String(body.path || body.computation?.path || ""), input = (body.input || body.computation?.input || {}) as Obj;
  if (!path.startsWith("/api/compute/")) return json({ ok: false, code: "COMPUTE_PATH_REQUIRED", canonicalMutation: false }, 400);
  const computationResponse = await handleComputeRequest(new Request(`https://compute.internal${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) })), computation = await computationResponse.json().catch(() => null) as Obj | null;
  if (!computationResponse.ok || !computation?.ok || !computation?.result) return json({ ok: false, code: "REFERENCE_COMPUTATION_FAILED", path, computation, canonicalMutation: false }, computationResponse.status || 422);
  const validators = validatorsFor(path, input, computation.result), passed = validators.every(v => v.passed), level = highestLevel(validators), label = VALIDATION_LEVELS.find(x => x.level === level)?.id || "REPLICA_CONSISTENCY", core = { schema: VALIDATION_SCHEMA_R172, path, computationReceiptSha256: computation.receipt?.receiptSha256 || null, computationResultSha256: computation.receipt?.resultSha256 || null, validators, status: passed ? "PASS" : "HOLD", validationTier: { level, id: label }, evidenceClass: "DERIVED_VALIDATION", canonicalMutation: false, nativeExecution: false, authority: "VALIDATION_RECEIPT_NOT_CANON", boundary: VALIDATION_BOUNDARY_R172 }, receipt = { ...core, receiptSha256: await sha(core) };
  return json({ ok: passed, validation: receipt, computation: { schema: computation.result.schema, result: computation.result, receipt: computation.receipt } }, passed ? 200 : 422);
}

async function compareSupplied(body: Obj): Promise<Response> {
  const packets = (Array.isArray(body.packets) ? body.packets : []).slice(0, 24).map((p: Obj, i: number) => ({ id: String(p.id || `packet-${i + 1}`).slice(0, 120), source: String(p.source || "UNKNOWN").slice(0, 120), methodFamily: String(p.methodFamily || p.method || "UNKNOWN").slice(0, 120), resultSha256: /^[a-f0-9]{64}$/i.test(String(p.resultSha256 || "")) ? String(p.resultSha256).toLowerCase() : null, receiptSha256: /^[a-f0-9]{64}$/i.test(String(p.receiptSha256 || "")) ? String(p.receiptSha256).toLowerCase() : null, declaredAuthority: String(p.authority || "SUPPLIED_UNVERIFIED").slice(0, 160) }));
  if (!packets.length) return json({ ok: false, code: "PACKETS_REQUIRED" }, 400);
  const hashes = packets.map(p => p.resultSha256).filter(Boolean) as string[], counts = new Map<string, number>(); hashes.forEach(h => counts.set(h, (counts.get(h) || 0) + 1)); const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]), consensusHash = ordered[0]?.[0] || null, consensusCount = ordered[0]?.[1] || 0, result = { schema: "OMEGA_SUPPLIED_VALIDATION_COMPARISON_R172", packetCount: packets.length, hashedPacketCount: hashes.length, distinctSources: new Set(packets.map(p => p.source)).size, distinctDeclaredMethods: new Set(packets.map(p => p.methodFamily)).size, consensusHash, consensusCount, consensusRatio: packets.length ? consensusCount / packets.length : 0, packets, verifiedDiversity: false, evidenceClass: "OPERATOR_SUPPLIED_COMPARISON", canonicalMutation: false, authority: "SUPPLIED_COMPARISON_NOT_VALIDATION", boundary: "Source and method labels in this endpoint are caller-supplied. They are not promoted to cross-runtime, independent-solver, or measurement validation without a trusted execution/measurement receipt." };
  return json({ ok: true, comparison: { ...result, receiptSha256: await sha(result) } });
}

export async function handleValidationRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return json(null, 204);
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/validate/manifest") return json({ ok: true, schema: "OMEGA_VALIDATION_MANIFEST_R172", revision: "R172", levels: VALIDATION_LEVELS, internalValidators: ["LORENTZ_4X4_MATRIX", "MINKOWSKI_INVARIANT", "ADMITTANCE_RECURSION", "ENERGY_IDENTITY", "CONSERVATIVE_SUM", "DIFFUSION_STABILITY", "SCALAR_WAVE_CFL", "ATLAS_TOPOLOGY_IDENTITY"], crossRuntimeStatus: "REQUIRES_TRUSTED_NATIVE_RECEIPT", independentFullWaveStatus: "REQUIRES_RCWA_OR_MAXWELL_FDTD_RECEIPT", externalMeasurementStatus: "REQUIRES_OBSERVED_SOURCE_RECEIPT", canonicalMutation: false, boundary: VALIDATION_BOUNDARY_R172 });
  try {
    const body = await request.json().catch(() => ({})) as Obj;
    if (request.method === "POST" && path === "/api/validate/reference") return referenceValidation(body);
    if (request.method === "POST" && path === "/api/validate/compare") return compareSupplied(body);
    return json({ ok: false, code: "NOT_FOUND" }, 404);
  } catch (error) {
    return json({ ok: false, code: "VALIDATION_ERROR", error: error instanceof Error ? error.message : String(error), canonicalMutation: false, boundary: VALIDATION_BOUNDARY_R172 }, 422);
  }
}
