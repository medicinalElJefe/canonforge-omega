export const COMPUTE_SCHEMA = "OMEGA_COMPUTATION_TRUTH_R170";
export const C_M_S = 299_792_458;
const TRUTH_BOUNDARY = "R170 returns DERIVED mathematical reference computation, not empirical observation. 12/144/1728/20736 are OMEGA address-resolution levels, not physical dimensions. Normal-incidence TMM is reduced-order layered-media screening, not RCWA/FDTD/FEM or fabrication-grade validation.";

type Obj = Record<string, any>;
type Vec3 = [number, number, number];
type Cx = { re: number; im: number };
type Mat2 = [[Cx, Cx], [Cx, Cx]];

const finite = (v: any, name: string): number => {
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error(`${name} must be finite`);
  return x;
};
const vec3 = (v: any, name: string): Vec3 => {
  if (!Array.isArray(v) || v.length !== 3) throw new Error(`${name} must contain exactly three values`);
  return [finite(v[0], `${name}[0]`), finite(v[1], `${name}[1]`), finite(v[2], `${name}[2]`)];
};
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm2 = (a: Vec3) => dot(a, a);
const relResidual = (a: number, b: number) => Math.abs(a - b) / Math.max(1, Math.abs(a), Math.abs(b));
const cx = (re = 0, im = 0): Cx => ({ re, im });
const cadd = (a: Cx, b: Cx): Cx => cx(a.re + b.re, a.im + b.im);
const csub = (a: Cx, b: Cx): Cx => cx(a.re - b.re, a.im - b.im);
const cmul = (a: Cx, b: Cx): Cx => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cscale = (a: Cx, s: number): Cx => cx(a.re * s, a.im * s);
const cdiv = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im;
  if (d <= 1e-36) throw new Error("complex denominator is singular");
  return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const cabs2 = (a: Cx) => a.re * a.re + a.im * a.im;
const ccos = (z: Cx): Cx => cx(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im));
const csin = (z: Cx): Cx => cx(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im));
const ciMul = (z: Cx): Cx => cx(-z.im, z.re);
const matmul = (a: Mat2, b: Mat2): Mat2 => [[cadd(cmul(a[0][0], b[0][0]), cmul(a[0][1], b[1][0])), cadd(cmul(a[0][0], b[0][1]), cmul(a[0][1], b[1][1]))], [cadd(cmul(a[1][0], b[0][0]), cmul(a[1][1], b[1][0])), cadd(cmul(a[1][0], b[0][1]), cmul(a[1][1], b[1][1]))]];

async function sha(value: any): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function json(value: any, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
}
async function derivedReceipt(kind: string, input: any, result: any): Promise<Obj> {
  const payload = { schema: "OMEGA_COMPUTE_RECEIPT_R170", kind, inputSha256: await sha(input), resultSha256: await sha(result), evidenceClass: "DERIVED", canonicalMutation: false, nativeExecution: false, truthBoundary: TRUTH_BOUNDARY };
  return { ...payload, receiptSha256: await sha(payload) };
}

function lorentzEvent(body: Obj): Obj {
  const t = finite(body.t_seconds ?? body.tSeconds, "t_seconds");
  const r = vec3(body.position_m ?? body.positionM, "position_m");
  const v = vec3(body.frame_velocity_m_s ?? body.frameVelocityMS, "frame_velocity_m_s");
  const beta: Vec3 = [v[0] / C_M_S, v[1] / C_M_S, v[2] / C_M_S];
  const beta2 = norm2(beta);
  if (beta2 >= 1) throw new Error("frame speed must be strictly less than c");
  let gamma = 1, tp = t, rp: Vec3 = [...r];
  if (beta2 > 0) {
    gamma = 1 / Math.sqrt(1 - beta2);
    const ct = C_M_S * t, bdr = dot(beta, r), ctp = gamma * (ct - bdr), factor = (gamma - 1) / beta2;
    rp = [0, 1, 2].map(i => r[i] + factor * bdr * beta[i] - gamma * beta[i] * ct) as Vec3;
    tp = ctp / C_M_S;
  }
  const before = (C_M_S * t) ** 2 - norm2(r), after = (C_M_S * tp) ** 2 - norm2(rp);
  return { schema: "OMEGA_LORENTZ_EVENT_R170", t_seconds: t, position_m: r, frame_velocity_m_s: v, gamma, beta2, transformed_t_seconds: tp, transformed_position_m: rp, interval_before_m2: before, interval_after_m2: after, invariant_relative_residual: relResidual(before, after), evidenceClass: "DERIVED", canonicalMutation: false };
}
function velocityTransform(body: Obj): Obj {
  const u = vec3(body.object_velocity_m_s ?? body.objectVelocityMS, "object_velocity_m_s"), v = vec3(body.frame_velocity_m_s ?? body.frameVelocityMS, "frame_velocity_m_s"), u2 = norm2(u), v2 = norm2(v);
  if (u2 >= C_M_S ** 2) throw new Error("object speed must be strictly less than c");
  if (v2 >= C_M_S ** 2) throw new Error("frame speed must be strictly less than c");
  let out: Vec3 = [...u], gamma = 1;
  if (v2 > 0) {
    gamma = 1 / Math.sqrt(1 - v2 / C_M_S ** 2);
    const duv = dot(u, v), denom = 1 - duv / C_M_S ** 2;
    if (denom <= 0) throw new Error("velocity transform denominator is non-positive");
    const par: Vec3 = [v[0] * duv / v2, v[1] * duv / v2, v[2] * duv / v2], perp: Vec3 = [u[0] - par[0], u[1] - par[1], u[2] - par[2]];
    out = [0, 1, 2].map(i => (par[i] - v[i] + perp[i] / gamma) / denom) as Vec3;
  }
  const fraction = Math.sqrt(norm2(out)) / C_M_S;
  if (fraction >= 1 + 1e-12) throw new Error("relativistic velocity transform exceeded c");
  return { schema: "OMEGA_RELATIVISTIC_VELOCITY_R170", object_velocity_m_s: u, frame_velocity_m_s: v, transformed_velocity_m_s: out, transformed_speed_fraction_c: fraction, gamma_frame: gamma, evidenceClass: "DERIVED", canonicalMutation: false };
}
function opticalTmm(body: Obj): Obj {
  const wl = finite(body.wavelength_nm ?? body.wavelengthNm, "wavelength_nm"), n0 = finite(body.incident_n ?? body.incidentN ?? 1, "incident_n"), ns = finite(body.substrate_n ?? body.substrateN ?? 1.5, "substrate_n");
  if (wl <= 0 || n0 <= 0 || ns <= 0) throw new Error("wavelength_nm, incident_n and substrate_n must be > 0");
  const rawLayers = Array.isArray(body.layers) ? body.layers : [];
  if (rawLayers.length > 256) throw new Error("at most 256 TMM layers are allowed per cloud reference request");
  const layers = rawLayers.map((layer: Obj, i: number) => { const n = finite(layer.n, `layers[${i}].n`), k = finite(layer.k ?? 0, `layers[${i}].k`), d = finite(layer.thickness_nm ?? layer.thicknessNm, `layers[${i}].thickness_nm`); if (n <= 0 || k < 0 || d < 0) throw new Error(`layers[${i}] requires n>0, k>=0, thickness>=0`); return { n, k, thickness_nm: d }; });
  let m: Mat2 = [[cx(1), cx()], [cx(), cx(1)]];
  for (const layer of layers) {
    const n = cx(layer.n, -layer.k), delta = cscale(n, 2 * Math.PI * layer.thickness_nm / wl), c = ccos(delta), s = csin(delta), lm: Mat2 = [[c, cdiv(ciMul(s), n)], [cmul(ciMul(n), s), c]];
    m = matmul(m, lm);
  }
  const B = cadd(m[0][0], cscale(m[0][1], ns)), C = cadd(m[1][0], cscale(m[1][1], ns)), denom = cadd(cscale(B, n0), C), r = cdiv(csub(cscale(B, n0), C), denom), t = cdiv(cx(2 * n0), denom), R = cabs2(r), T = (ns / n0) * cabs2(t), rawA = 1 - R - T, A = rawA < 0 && rawA > -1e-12 ? 0 : rawA, balance = R + T + A;
  return { schema: "OMEGA_OPTICAL_TMM_R170", wavelength_nm: wl, incident_n: n0, substrate_n: ns, layers, reflectance: R, transmittance: T, absorptance: A, raw_absorptance: rawA, energy_balance: balance, energy_balance_residual: Math.abs(1 - balance), solver: "NORMAL_INCIDENCE_TMM", solverTier: "REDUCED_ORDER_SCREENING", fabricationGrade: false, evidenceClass: "DERIVED", canonicalMutation: false, boundary: "Valid for coherent 1D passive isotropic layers at normal incidence under the documented complex-index convention; lateral patterning and full-wave validation are outside this solver." };
}
function continuityTransfer(body: Obj): Obj {
  const values = Array.isArray(body.values) ? body.values.map((v: any, i: number) => finite(v, `values[${i}]`)) : [];
  if (!values.length || values.length > 20736) throw new Error("values must contain 1..20736 entries");
  const transfers = Array.isArray(body.transfers) ? body.transfers : [], out = new Array(values.length).fill(0), delta = new Array(values.length).fill(0);
  for (let i = 0; i < transfers.length; i++) { const tr = transfers[i], a = Math.trunc(finite(tr.from ?? tr.source, `transfers[${i}].from`)), b = Math.trunc(finite(tr.to ?? tr.target, `transfers[${i}].to`)), q = finite(tr.amount, `transfers[${i}].amount`); if (a < 0 || a >= values.length || b < 0 || b >= values.length || q < 0) throw new Error(`transfers[${i}] is invalid`); out[a] += q; delta[a] -= q; delta[b] += q; }
  for (let i = 0; i < values.length; i++) if (out[i] > values[i] + 1e-12) throw new Error(`outflow exceeds available value at index ${i}`);
  const after = values.map((v: number, i: number) => v + delta[i]), beforeSum = values.reduce((a: number, b: number) => a + b, 0), afterSum = after.reduce((a: number, b: number) => a + b, 0);
  return { schema: "OMEGA_CONSERVATIVE_TRANSFER_R170", values_after: after, invariant_before: beforeSum, invariant_after: afterSum, invariant_absolute_residual: Math.abs(afterSum - beforeSum), invariant_relative_residual: relResidual(beforeSum, afterSum), min_after: Math.min(...after), max_after: Math.max(...after), operation: "SIMULTANEOUS_CONSERVATIVE_TRANSFER", evidenceClass: "DERIVED", canonicalMutation: false };
}
function graphDiffusion(body: Obj): Obj {
  const values = Array.isArray(body.values) ? body.values.map((v: any, i: number) => finite(v, `values[${i}]`)) : [];
  if (!values.length || values.length > 20736) throw new Error("values must contain 1..20736 entries");
  const alpha = finite(body.diffusivity, "diffusivity"), dt = finite(body.dt, "dt");
  if (alpha < 0 || dt <= 0) throw new Error("diffusivity >= 0 and dt > 0 are required");
  const rawEdges = Array.isArray(body.edges) ? body.edges : [];
  if (rawEdges.length > 200000) throw new Error("at most 200000 edges are allowed per cloud reference request");
  const seen = new Set<string>(), edges: [number, number][] = [], degree = new Array(values.length).fill(0);
  rawEdges.forEach((e: any, i: number) => { if (!Array.isArray(e) || e.length !== 2) throw new Error(`edges[${i}] must be [a,b]`); let a = Math.trunc(finite(e[0], `edges[${i}][0]`)), b = Math.trunc(finite(e[1], `edges[${i}][1]`)); if (a === b || a < 0 || b < 0 || a >= values.length || b >= values.length) throw new Error(`edges[${i}] invalid`); if (a > b) [a, b] = [b, a]; const key = `${a}:${b}`; if (!seen.has(key)) { seen.add(key); edges.push([a, b]); degree[a]++; degree[b]++; } });
  const maxDegree = degree.reduce((a: number, b: number) => Math.max(a, b), 0), stability = alpha * dt * maxDegree;
  if (stability > 1 + 1e-15) throw new Error("explicit diffusion violates diffusivity*dt*max_degree <= 1 stability/positivity guard");
  const delta = new Array(values.length).fill(0), factor = alpha * dt;
  edges.forEach(([a, b]) => { const flux = factor * (values[b] - values[a]); delta[a] += flux; delta[b] -= flux; });
  const after = values.map((v: number, i: number) => v + delta[i]), beforeSum = values.reduce((a: number, b: number) => a + b, 0), afterSum = after.reduce((a: number, b: number) => a + b, 0);
  return { schema: "OMEGA_GRAPH_DIFFUSION_R170", values_after: after, edge_count: edges.length, max_degree: maxDegree, stability_number: stability, invariant_before: beforeSum, invariant_after: afterSum, invariant_absolute_residual: Math.abs(afterSum - beforeSum), invariant_relative_residual: relResidual(beforeSum, afterSum), min_after: Math.min(...after), max_after: Math.max(...after), operation: "EXPLICIT_CONSERVATIVE_GRAPH_DIFFUSION", evidenceClass: "DERIVED", canonicalMutation: false };
}
function scalarWave(body: Obj): Obj {
  const u0 = Array.isArray(body.initial_displacement ?? body.initialDisplacement) ? (body.initial_displacement ?? body.initialDisplacement).map((v: any, i: number) => finite(v, `initial_displacement[${i}]`)) : [];
  if (u0.length < 3 || u0.length > 4096) throw new Error("initial_displacement requires 3..4096 grid points");
  const c = finite(body.wave_speed ?? body.waveSpeed ?? 1, "wave_speed"), dx = finite(body.dx ?? 1, "dx"), dt = finite(body.dt ?? 0.5, "dt"), steps = Math.trunc(finite(body.steps ?? 1, "steps"));
  if (c < 0 || dx <= 0 || dt <= 0 || steps < 1 || steps > 5000) throw new Error("wave_speed>=0, dx/dt>0 and steps in 1..5000 required");
  const cfl = c * dt / dx; if (cfl > 1 + 1e-15) throw new Error("1D scalar wave CFL condition c*dt/dx <= 1 is required");
  const rawVel = body.initial_velocity ?? body.initialVelocity, vel = rawVel == null ? new Array(u0.length).fill(0) : rawVel.map((v: any, i: number) => finite(v, `initial_velocity[${i}]`)); if (vel.length !== u0.length) throw new Error("initial_velocity length must match initial_displacement");
  const stride = Math.max(0, Math.trunc(finite(body.snapshot_stride ?? body.snapshotStride ?? 0, "snapshot_stride"))), lam2 = cfl * cfl, prev = [...u0], curr = [...u0], snapshots: number[][] = stride ? [[...u0]] : [];
  for (let i = 1; i < u0.length - 1; i++) curr[i] = u0[i] + dt * vel[i] + 0.5 * lam2 * (u0[i + 1] - 2 * u0[i] + u0[i - 1]); curr[0] = u0[0]; curr[curr.length - 1] = u0[u0.length - 1]; if (stride && 1 % stride === 0) snapshots.push([...curr]);
  let p = prev, q = curr;
  for (let n = 1; n < steps; n++) { const next = [...q]; for (let i = 1; i < q.length - 1; i++) next[i] = 2 * q[i] - p[i] + lam2 * (q[i + 1] - 2 * q[i] + q[i - 1]); next[0] = u0[0]; next[next.length - 1] = u0[u0.length - 1]; p = q; q = next; if (stride && (n + 1) % stride === 0 && snapshots.length < 64) snapshots.push([...q]); }
  return { schema: "OMEGA_SCALAR_WAVE_FDTD_1D_R170", wave_speed: c, dx, dt, cfl, steps, final_state: q, snapshots, max_abs_amplitude: q.reduce((m: number, v: number) => Math.max(m, Math.abs(v)), 0), solver: "SECOND_ORDER_SCALAR_WAVE_FDTD_1D", maxwellSolver: false, evidenceClass: "DERIVED", canonicalMutation: false, boundary: "This solves the 1D scalar wave equation u_tt=c^2 u_xx with fixed boundaries. It is not a Maxwell FDTD solver." };
}

export async function handleComputeRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return json({ ok: true }, 204);
  const path = new URL(request.url).pathname;
  if (request.method === "GET" && path === "/api/compute/manifest") return json({ ok: true, schema: COMPUTE_SCHEMA, revision: "R170", constants: { c_m_s: C_M_S, c_definition: "exact SI speed of light" }, solvers: { lorentz_event_3d: { physics: "special relativity", invariantCheck: "Minkowski interval" }, relativistic_velocity_3d: { physics: "special relativity", speedGuard: "strictly below c" }, normal_incidence_tmm: { physics: "1D electromagnetic layered-media screening", fabricationGrade: false }, conservative_transfer: { math: "finite conservative redistribution", invariant: "sum(values)" }, graph_diffusion: { math: "explicit graph Laplacian", guard: "diffusivity*dt*max_degree <= 1" }, scalar_wave_fdtd_1d: { physics: "scalar wave equation", guard: "CFL <= 1", maxwellSolver: false } }, hierarchy: { addressLevels: [12, 144, 1728, 20736], physicalDimensionClaim: false }, truthBoundary: TRUTH_BOUNDARY, nativeExecution: false, canonicalMutation: false });
  if (request.method !== "POST") return json({ ok: false, code: "NOT_FOUND" }, 404);
  const body = await request.json().catch(() => ({})) as Obj;
  try {
    let kind = "", result: Obj;
    if (path === "/api/compute/relativity/event") { kind = "LORENTZ_EVENT_3D"; result = lorentzEvent(body); }
    else if (path === "/api/compute/relativity/velocity") { kind = "RELATIVISTIC_VELOCITY_3D"; result = velocityTransform(body); }
    else if (path === "/api/compute/optics/tmm") { kind = "NORMAL_INCIDENCE_TMM"; result = opticalTmm(body); }
    else if (path === "/api/compute/continuity/transfer") { kind = "CONSERVATIVE_TRANSFER"; result = continuityTransfer(body); }
    else if (path === "/api/compute/continuity/diffusion") { kind = "GRAPH_DIFFUSION"; result = graphDiffusion(body); }
    else if (path === "/api/compute/wave/fdtd1d") { kind = "SCALAR_WAVE_FDTD_1D"; result = scalarWave(body); }
    else return json({ ok: false, code: "NOT_FOUND" }, 404);
    return json({ ok: true, result, receipt: await derivedReceipt(kind, body, result) });
  } catch (error) {
    return json({ ok: false, code: "INVALID_COMPUTATION_REQUEST", error: error instanceof Error ? error.message : String(error), truthBoundary: TRUTH_BOUNDARY, canonicalMutation: false }, 422);
  }
}
