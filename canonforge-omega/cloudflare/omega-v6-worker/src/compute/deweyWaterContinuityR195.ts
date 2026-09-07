export const DEWEY_WATER_CONTINUITY_RELEASE_R195 = "r195-dewey-water-continuity-compute";
export const DEWEY_WATER_CONTINUITY_SCHEMA_R195 = "OMEGA_DEWEY_WATER_CONTINUITY_R195";
export const DEWEY_WATER_CONTINUITY_BOUNDARY_R195 =
  "R195 is a deterministic model/computation engine. 011 and 01-1 are treated as paired relational basis operators over a declared state, not as new physical primitives. Water geometry means a divergence-free streamline-inspired computational field, not measured fluid dynamics. Dimensional levels are address/resolution shells, not literal physical dimensions. The convergence/inevitability score is a model stability index, never fate or empirical certainty.";

const EPS = 1e-12;
const SQRT2 = Math.SQRT2;
const INV_SQRT2 = 1 / SQRT2;
const MAX_STEPS = 4096;
const MAX_ENSEMBLE = 256;
const MAX_TRACE = 2048;

export type Orientation = -1 | 0 | 1;
export type GovernedModeId =
  | "full-overall-canon"
  | "mode-188"
  | "unified-coherence"
  | "forecast"
  | "full-sphere"
  | "relational-skin"
  | "dewey-calculus"
  | "unified-recursion"
  | "deep-mother"
  | "high-father"
  | "heavy-prune"
  | "alpha"
  | "crimson"
  | "no-nothing-truth"
  | "guidance-field";

type Obj = Record<string, any>;

export type DeweyState = {
  continuity: number;
  plasticity: number;
  burden: number;
  contradiction: number;
  orientation: Orientation;
  phase: number;
  scar: number;
  shell: number;
};

export type DeweyParams = {
  dt: number;
  curvature: number;
  circulation: number;
  constructGain: number;
  pruneGain: number;
  scarGain: number;
  recoveryGain: number;
  compoundingGain: number;
  contradictionDamping: number;
};

type ModeProfile = {
  id: GovernedModeId;
  label: string;
  multipliers: Partial<DeweyParams>;
};

const SHELLS = Object.freeze([12, 144, 1728, 20736, 248832]);

const MODE_PROFILES: Record<GovernedModeId, ModeProfile> = {
  "full-overall-canon": { id: "full-overall-canon", label: "FULL CANON", multipliers: {} },
  "mode-188": { id: "mode-188", label: "MODE 188", multipliers: { pruneGain: 1.18, contradictionDamping: 1.12 } },
  "unified-coherence": { id: "unified-coherence", label: "COHERENCE", multipliers: { recoveryGain: 1.12, scarGain: 0.9 } },
  "forecast": { id: "forecast", label: "FORECAST", multipliers: { compoundingGain: 1.12, circulation: 1.08 } },
  "full-sphere": { id: "full-sphere", label: "FULL SPHERE", multipliers: { circulation: 1.2, curvature: 1.08 } },
  "relational-skin": { id: "relational-skin", label: "SKIN", multipliers: { scarGain: 1.14, recoveryGain: 1.08 } },
  "dewey-calculus": { id: "dewey-calculus", label: "CALCULUS", multipliers: { curvature: 1.22, compoundingGain: 1.08 } },
  "unified-recursion": { id: "unified-recursion", label: "RECURSION", multipliers: { compoundingGain: 1.06, recoveryGain: 1.08 } },
  "deep-mother": { id: "deep-mother", label: "RECOVERY", multipliers: { recoveryGain: 1.28, scarGain: 0.82 } },
  "high-father": { id: "high-father", label: "CONSTRAINT", multipliers: { pruneGain: 1.22, contradictionDamping: 1.18 } },
  "heavy-prune": { id: "heavy-prune", label: "PRUNE", multipliers: { pruneGain: 1.35, constructGain: 0.86 } },
  "alpha": { id: "alpha", label: "ALPHA", multipliers: { constructGain: 1.24, compoundingGain: 1.16, contradictionDamping: 0.9 } },
  "crimson": { id: "crimson", label: "CRIMSON", multipliers: { constructGain: 1.16, scarGain: 1.08 } },
  "no-nothing-truth": { id: "no-nothing-truth", label: "TRUTH", multipliers: { contradictionDamping: 1.3, pruneGain: 1.14, scarGain: 1.08 } },
  "guidance-field": { id: "guidance-field", label: "GUIDANCE", multipliers: { circulation: 1.12, recoveryGain: 1.08, constructGain: 1.06 } },
};

const DEFAULT_PARAMS: DeweyParams = Object.freeze({
  dt: 0.04,
  curvature: 0.42,
  circulation: 0.55,
  constructGain: 0.72,
  pruneGain: 0.68,
  scarGain: 0.34,
  recoveryGain: 0.5,
  compoundingGain: 0.44,
  contradictionDamping: 0.62,
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-authority": "deterministic-model-computation",
    },
  });
}

function finite(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function unit(v: unknown, fallback: number): number {
  return clamp(finite(v, fallback), 0, 1);
}

function positive(v: unknown, fallback: number, floor = EPS): number {
  return Math.max(floor, finite(v, fallback));
}

function orientation(v: unknown): Orientation {
  const n = finite(v, 1);
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}

function shell(v: unknown): number {
  const n = Math.trunc(finite(v, 1728));
  if (SHELLS.includes(n)) return n;
  let best = SHELLS[0];
  let dist = Math.abs(n - best);
  for (const s of SHELLS) {
    const d = Math.abs(n - s);
    if (d < dist) { best = s; dist = d; }
  }
  return best;
}

function modeId(v: unknown): GovernedModeId {
  const id = String(v || "full-overall-canon") as GovernedModeId;
  return MODE_PROFILES[id] ? id : "full-overall-canon";
}

function safeLog(v: number): number {
  return Math.log(Math.max(EPS, v));
}

function safeExp(v: number): number {
  return Math.exp(clamp(v, -60, 60));
}

function sigmoid(v: number): number {
  if (v >= 0) { const z = Math.exp(-Math.min(60, v)); return 1 / (1 + z); }
  const z = Math.exp(Math.max(-60, v)); return z / (1 + z);
}

function normalizedState(raw: Obj = {}): DeweyState {
  return {
    continuity: unit(raw.continuity ?? raw.CΩ, 0.72),
    plasticity: unit(raw.plasticity ?? raw.future_plasticity ?? raw["Φ"], 0.68),
    burden: unit(raw.burden ?? raw["Λ"], 0.24),
    contradiction: unit(raw.contradiction ?? raw.q, 0.18),
    orientation: orientation(raw.orientation ?? raw["σ"] ?? 1),
    phase: finite(raw.phase, 0),
    scar: unit(raw.scar, 0.08),
    shell: shell(raw.shell),
  };
}

function params(raw: Obj = {}, mode: GovernedModeId): DeweyParams {
  const base: DeweyParams = {
    dt: clamp(positive(raw.dt, DEFAULT_PARAMS.dt), 1e-4, 0.5),
    curvature: clamp(finite(raw.curvature, DEFAULT_PARAMS.curvature), -4, 4),
    circulation: clamp(finite(raw.circulation, DEFAULT_PARAMS.circulation), -4, 4),
    constructGain: clamp(positive(raw.constructGain, DEFAULT_PARAMS.constructGain), 0.01, 4),
    pruneGain: clamp(positive(raw.pruneGain, DEFAULT_PARAMS.pruneGain), 0.01, 4),
    scarGain: clamp(positive(raw.scarGain, DEFAULT_PARAMS.scarGain), 0.01, 4),
    recoveryGain: clamp(positive(raw.recoveryGain, DEFAULT_PARAMS.recoveryGain), 0.01, 4),
    compoundingGain: clamp(positive(raw.compoundingGain, DEFAULT_PARAMS.compoundingGain), 0.01, 4),
    contradictionDamping: clamp(positive(raw.contradictionDamping, DEFAULT_PARAMS.contradictionDamping), 0.01, 4),
  };
  const mult = MODE_PROFILES[mode].multipliers;
  const out = { ...base };
  for (const key of Object.keys(mult) as (keyof DeweyParams)[]) {
    const m = mult[key];
    if (typeof m === "number") (out as any)[key] *= m;
  }
  return out;
}

/**
 * 011 / 01-1 relational basis.
 * For relational coordinates (b,c):
 *   construct = (b+c)/sqrt(2)
 *   prune     = (b-c)/sqrt(2)
 * This is an orthonormal transform, therefore b^2+c^2 is preserved exactly
 * up to IEEE-754 roundoff. The leading 0 means the separate anchor channel is
 * carried invariantly; it does not mean "nothing exists".
 */
export function pair011(b: number, c: number) {
  const construct = (b + c) * INV_SQRT2;
  const prune = (b - c) * INV_SQRT2;
  return {
    construct,
    prune,
    relationalEnergyBefore: b * b + c * c,
    relationalEnergyAfter: construct * construct + prune * prune,
  };
}

export function inversePair011(construct: number, prune: number) {
  return {
    b: (construct + prune) * INV_SQRT2,
    c: (construct - prune) * INV_SQRT2,
  };
}

/**
 * Water-geometry lens: Hamiltonian/stream-function field.
 * v = (dψ/dd, -dψ/ds), therefore div(v)=0 analytically for smooth ψ.
 * This is a computational streamline geometry, not a Navier-Stokes claim.
 */
export function waterVelocity(s: number, d: number, p: DeweyParams, phase: number) {
  const r2 = s * s + d * d + EPS;
  const radial = 2 * p.circulation / r2;
  const wave = 0.08 * Math.sin(phase + s - d);
  const ds = p.curvature * d + radial * d + wave;
  const dd = -p.curvature * s - radial * s + wave;
  return { ds, dd, speed: Math.hypot(ds, dd), r2 };
}

function omegaLogScore(s: DeweyState): number {
  return safeLog(s.continuity + EPS) + safeLog(s.plasticity + EPS) - safeLog(s.burden + s.contradiction + EPS);
}

function coherenceScore(s: DeweyState): number {
  const carry = Math.sqrt(Math.max(EPS, s.continuity * s.plasticity));
  const resistance = Math.sqrt(Math.max(EPS, s.burden * s.burden + s.contradiction * s.contradiction));
  return clamp(carry / (carry + resistance + EPS), 0, 1);
}

function relationalCoordinates(s: DeweyState) {
  const b = safeLog(s.continuity + EPS) + safeLog(s.plasticity + EPS);
  const c = safeLog(s.burden + s.contradiction + EPS);
  const pair = pair011(b, c);
  return { b, c, ...pair };
}

function noZeroPacket(s: DeweyState) {
  return {
    rule: "MAGNITUDE_FLOOR_PLUS_SEPARATE_ORIENTATION",
    epsilon: EPS,
    neutralOrientationAllowed: true,
    magnitudesNeverUsedAsExactZeroIn_DIV_LOG: true,
    orientation: s.orientation,
  };
}

function stateDistance(a: DeweyState, b: DeweyState): number {
  const dc = a.continuity - b.continuity;
  const dp = a.plasticity - b.plasticity;
  const db = a.burden - b.burden;
  const dq = a.contradiction - b.contradiction;
  const ds = a.scar - b.scar;
  return Math.sqrt(dc * dc + dp * dp + db * db + dq * dq + ds * ds);
}

function stepOnce(s: DeweyState, p: DeweyParams): { state: DeweyState; proof: Obj } {
  const rel = relationalCoordinates(s);
  const water = waterVelocity(rel.construct, rel.prune, p, s.phase);
  const orient = s.orientation === 0 ? 1 : s.orientation;

  const constructDrive = Math.tanh(rel.construct) * p.constructGain;
  const pruneDrive = Math.tanh(rel.prune) * p.pruneGain;
  const continuityGain = orient * (0.45 * constructDrive - 0.22 * pruneDrive + 0.08 * water.ds);
  const plasticityGain = orient * (0.38 * constructDrive + 0.16 * water.dd - 0.12 * s.scar);
  const burdenLoss = p.pruneGain * (0.34 * Math.abs(pruneDrive) + 0.18 * s.contradiction);
  const contradictionLoss = p.contradictionDamping * (0.42 * Math.abs(pruneDrive) + 0.12 * s.continuity);

  const continuity = clamp(s.continuity + p.dt * continuityGain, EPS, 1);
  const plasticity = clamp(s.plasticity + p.dt * plasticityGain, EPS, 1);
  const burden = clamp(s.burden - p.dt * burdenLoss + p.dt * 0.08 * Math.abs(water.ds), EPS, 1);
  const contradiction = clamp(s.contradiction - p.dt * contradictionLoss + p.dt * 0.06 * Math.abs(water.dd), EPS, 1);

  const predictedResidual = Math.abs(constructDrive - pruneDrive);
  const scarIn = s.scar + p.dt * p.scarGain * predictedResidual;
  const scar = clamp(scarIn - p.dt * p.recoveryGain * continuity * plasticity, EPS, 1);

  const logBefore = omegaLogScore(s);
  const coherent = coherenceScore({ ...s, continuity, plasticity, burden, contradiction, scar });
  const compoundingDelta = p.dt * p.compoundingGain * (coherent - contradiction - 0.5 * scar);
  const logAfter = clamp(logBefore + compoundingDelta, -60, 60);
  const scale = safeExp(logAfter - omegaLogScore({ ...s, continuity, plasticity, burden, contradiction, scar }));

  const scaledContinuity = clamp(continuity * Math.pow(scale, 0.5), EPS, 1);
  const scaledPlasticity = clamp(plasticity * Math.pow(scale, 0.5), EPS, 1);

  const next: DeweyState = {
    continuity: scaledContinuity,
    plasticity: scaledPlasticity,
    burden,
    contradiction,
    orientation: s.orientation,
    phase: s.phase + p.dt * orient * (1 + 0.25 * water.speed),
    scar,
    shell: s.shell,
  };

  const relNext = relationalCoordinates(next);
  const energyError = Math.abs(rel.relationalEnergyBefore - rel.relationalEnergyAfter);
  return {
    state: next,
    proof: {
      operatorPair: {
        construct_011: rel.construct,
        prune_01m1: rel.prune,
        inverse: inversePair011(rel.construct, rel.prune),
        orthonormalEnergyError: energyError,
      },
      waterGeometry: {
        kind: "DIVERGENCE_FREE_STREAM_FUNCTION_INSPIRED_MODEL",
        ds: water.ds,
        dd: water.dd,
        speed: water.speed,
        analyticalDivergence: 0,
      },
      compounding: {
        logOmegaBefore: logBefore,
        logOmegaAfter: logAfter,
        delta: compoundingDelta,
        multiplicativeScale: scale,
      },
      scarResidual: { before: s.scar, after: scar, predictedResidual },
      wovenContinuity: [
        "partition",
        "exchange/transform",
        "invariant carry",
        "scar/residual carry",
        "re-contextualize/repartition",
      ],
      nextRelational: relNext,
    },
  };
}

function trajectory(initial: DeweyState, p: DeweyParams, steps: number, traceEvery: number) {
  let state = initial;
  const trace: Obj[] = [];
  let totalDistance = 0;
  let maxEnergyError = 0;
  let maxSpeed = 0;
  for (let i = 0; i < steps; i++) {
    const before = state;
    const next = stepOnce(state, p);
    state = next.state;
    totalDistance += stateDistance(before, state);
    maxEnergyError = Math.max(maxEnergyError, Number(next.proof.operatorPair.orthonormalEnergyError || 0));
    maxSpeed = Math.max(maxSpeed, Number(next.proof.waterGeometry.speed || 0));
    if (i % traceEvery === 0 || i === steps - 1) {
      trace.push({
        step: i + 1,
        state,
        omega: safeExp(omegaLogScore(state)),
        coherence: coherenceScore(state),
        construct_011: next.proof.operatorPair.construct_011,
        prune_01m1: next.proof.operatorPair.prune_01m1,
        waterSpeed: next.proof.waterGeometry.speed,
        scarResidual: next.proof.scarResidual.after,
      });
    }
  }
  return {
    final: state,
    trace,
    diagnostics: {
      steps,
      tracePoints: trace.length,
      totalStateDistance: totalDistance,
      maxPairEnergyError: maxEnergyError,
      maxWaterSpeed: maxSpeed,
      finalOmega: safeExp(omegaLogScore(state)),
      finalCoherence: coherenceScore(state),
    },
  };
}

function perturbState(base: DeweyState, index: number, ensemble: number, amplitude: number): DeweyState {
  const t = (index + 0.5) / ensemble;
  const a = 2 * Math.PI * t;
  const b = 2 * Math.PI * (((index * 37) % ensemble) + 0.5) / ensemble;
  const jitter = (x: number, phase: number) => clamp(x + amplitude * Math.sin(phase), EPS, 1);
  return {
    ...base,
    continuity: jitter(base.continuity, a),
    plasticity: jitter(base.plasticity, b),
    burden: jitter(base.burden, a + Math.PI / 2),
    contradiction: jitter(base.contradiction, b + Math.PI / 2),
    scar: jitter(base.scar, a - b),
    phase: base.phase + amplitude * Math.cos(a + b),
  };
}

function ensembleConvergence(initial: DeweyState, p: DeweyParams, steps: number, ensemble: number, amplitude: number) {
  const finals: DeweyState[] = [];
  const omegas: number[] = [];
  const coherences: number[] = [];
  for (let i = 0; i < ensemble; i++) {
    const start = perturbState(initial, i, ensemble, amplitude);
    const out = trajectory(start, p, steps, Math.max(1, steps));
    finals.push(out.final);
    omegas.push(out.diagnostics.finalOmega);
    coherences.push(out.diagnostics.finalCoherence);
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const variance = (xs: number[], m: number) => xs.reduce((a, b) => a + (b - m) * (b - m), 0) / Math.max(1, xs.length);
  const meanOmega = mean(omegas);
  const meanCoherence = mean(coherences);
  const omegaCv = Math.sqrt(variance(omegas, meanOmega)) / Math.max(EPS, Math.abs(meanOmega));
  const coherenceStd = Math.sqrt(variance(coherences, meanCoherence));
  const contradictionMean = mean(finals.map(x => x.contradiction));
  const scarMean = mean(finals.map(x => x.scar));
  const sensitivityPenalty = clamp(0.5 * omegaCv + coherenceStd, 0, 4);
  const convergenceMargin = meanCoherence - 0.55 * contradictionMean - 0.4 * scarMean - sensitivityPenalty;
  const inevitabilityIndex = sigmoid(convergenceMargin * 5);
  return {
    ensemble,
    amplitude,
    meanOmega,
    meanCoherence,
    omegaCoefficientOfVariation: omegaCv,
    coherenceStd,
    contradictionMean,
    scarMean,
    sensitivityPenalty,
    convergenceMargin,
    inevitabilityIndex,
    interpretation: "MODEL_CONVERGENCE_INDEX_NOT_FATE",
  };
}

function addressShell(shellValue: number, state: DeweyState, mode: GovernedModeId) {
  const exponent = Math.round(Math.log(shellValue) / Math.log(12));
  const dims = Math.max(1, exponent);
  const seed = [
    state.continuity,
    state.plasticity,
    1 - state.burden,
    1 - state.contradiction,
    state.scar,
    (state.phase % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI),
  ];
  const digits: number[] = [];
  for (let i = 0; i < dims; i++) {
    const v = seed[i % seed.length];
    const digit = 1 + Math.min(11, Math.floor(clamp(v, 0, 0.999999999) * 12));
    digits.push(digit);
  }
  return {
    shell: shellValue,
    base: 12,
    exponent: dims,
    address: digits,
    mode,
    boundary: "address/resolution only",
  };
}

function manifest() {
  return {
    ok: true,
    schema: DEWEY_WATER_CONTINUITY_SCHEMA_R195,
    release: DEWEY_WATER_CONTINUITY_RELEASE_R195,
    authority: "DETERMINISTIC_MODEL_COMPUTATION_NOT_MEASUREMENT",
    operatorBasis: {
      construct_011: [0, INV_SQRT2, INV_SQRT2],
      prune_01m1: [0, INV_SQRT2, -INV_SQRT2],
      invariant: "b^2+c^2 = construct^2+prune^2",
      inverse: "b=(construct+prune)/sqrt(2), c=(construct-prune)/sqrt(2)",
      anchorCarry: "first coordinate is carried separately; leading zero is operator selectivity, not ontological nothingness",
    },
    noZeroMath: {
      epsilon: EPS,
      rule: "positive magnitude floor for log/division + separate signed orientation σ∈{-1,0,+1}",
      compounding: "log-space accumulation with bounded exponentiation",
    },
    waterGeometry: {
      type: "Hamiltonian stream-function inspired field",
      velocity: "v=(∂ψ/∂d,-∂ψ/∂s)",
      analyticalDivergence: 0,
      physicalClaim: false,
    },
    wovenContinuity: ["partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"],
    shells: SHELLS,
    modes: Object.values(MODE_PROFILES).map(x => ({ id: x.id, label: x.label, multipliers: x.multipliers })),
    bounds: { maxSteps: MAX_STEPS, maxEnsemble: MAX_ENSEMBLE, maxTracePoints: MAX_TRACE },
    boundary: DEWEY_WATER_CONTINUITY_BOUNDARY_R195,
  };
}

function solve(body: Obj) {
  const mode = modeId(body.mode);
  const initial = normalizedState(body.state || body);
  const p = params(body.params || body, mode);
  const steps = clamp(Math.trunc(finite(body.steps, 256)), 1, MAX_STEPS);
  const tracePoints = clamp(Math.trunc(finite(body.tracePoints, 256)), 1, MAX_TRACE);
  const traceEvery = Math.max(1, Math.ceil(steps / tracePoints));
  const out = trajectory(initial, p, steps, traceEvery);
  const rel = relationalCoordinates(out.final);
  return {
    ok: true,
    schema: DEWEY_WATER_CONTINUITY_SCHEMA_R195,
    release: DEWEY_WATER_CONTINUITY_RELEASE_R195,
    mode: MODE_PROFILES[mode],
    shell: addressShell(out.final.shell, out.final, mode),
    initial,
    params: p,
    final: out.final,
    relational: rel,
    omega: safeExp(omegaLogScore(out.final)),
    coherence: coherenceScore(out.final),
    noZero: noZeroPacket(out.final),
    trace: out.trace,
    diagnostics: out.diagnostics,
    authority: "USER_DEFINED_MODEL_OR_DERIVED_COMPUTATION",
    canonicalMutation: false,
    physicalMeasurement: false,
    boundary: DEWEY_WATER_CONTINUITY_BOUNDARY_R195,
  };
}

function ensemble(body: Obj) {
  const mode = modeId(body.mode);
  const initial = normalizedState(body.state || body);
  const p = params(body.params || body, mode);
  const steps = clamp(Math.trunc(finite(body.steps, 256)), 8, MAX_STEPS);
  const count = clamp(Math.trunc(finite(body.ensemble, 64)), 4, MAX_ENSEMBLE);
  const amplitude = clamp(positive(body.amplitude, 0.03), 1e-6, 0.25);
  const result = ensembleConvergence(initial, p, steps, count, amplitude);
  return {
    ok: true,
    schema: DEWEY_WATER_CONTINUITY_SCHEMA_R195,
    release: DEWEY_WATER_CONTINUITY_RELEASE_R195,
    mode: MODE_PROFILES[mode],
    initial,
    params: p,
    result,
    authority: "ENSEMBLE_MODEL_STABILITY_NOT_EMPIRICAL_INEVITABILITY",
    canonicalMutation: false,
    boundary: DEWEY_WATER_CONTINUITY_BOUNDARY_R195,
  };
}

function pair(body: Obj) {
  const b = finite(body.b, 0.7);
  const c = finite(body.c, 0.2);
  const p = pair011(b, c);
  const inv = inversePair011(p.construct, p.prune);
  return {
    ok: true,
    schema: "OMEGA_011_01M1_PAIR_R195",
    input: { b, c },
    output: p,
    inverse: inv,
    reconstructionError: Math.hypot(inv.b - b, inv.c - c),
    authority: "EXACT_LINEAR_BASIS_COMPUTATION",
    physicalClaim: false,
  };
}

export async function handleDeweyWaterContinuityR195(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/compute/dewey/r195/")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
  if (request.method === "GET" && url.pathname === "/api/compute/dewey/r195/manifest") return json(manifest());
  if (request.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET manifest", "POST pair|solve|ensemble"] }, 405);
  const body = await request.json().catch(() => ({})) as Obj;
  if (url.pathname === "/api/compute/dewey/r195/pair") return json(pair(body));
  if (url.pathname === "/api/compute/dewey/r195/solve") return json(solve(body));
  if (url.pathname === "/api/compute/dewey/r195/ensemble") return json(ensemble(body));
  return json({ ok: false, code: "NOT_FOUND" }, 404);
}
