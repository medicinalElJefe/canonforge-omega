export const DEWEY_WATER_MOTION_RELEASE_R195 = "r195-dewey-water-motion-kernel";
export const DEWEY_WATER_MOTION_SCHEMA_R195 = "OMEGA_DEWEY_WATER_MOTION_R195";

export const DEWEY_WATER_MOTION_BOUNDARY_R195 =
  "R195 compiles the established Dewey Calculus / OMEGA operator canon into deterministic DERIVED_MODEL software computation. 011 construct and 01-1 prune are kept on separate nonnegative rails so a zero net projection cannot erase opposing carry. T12 turns are cyclic basis rotations, not sign-flip annihilation. Water Geometry is a 12-phase conservative flow kernel derived from cyclic trigonometric weights. 12→144→1728→20736→248832 are software/address representation levels, not literal physical dimensions. The kernel does not mutate CanonState, does not infer physical law from the conceptual atlas, and does not replace the existing R170 Lorentz/TMM/diffusion solvers or native RCWA evidence gates.";

type Obj = Record<string, any>;
type Rail = { outverse: number; inverse: number; scar: number };
type Address = { domain: number; phase: number; regulation: number; lens: number; context: number };

const N = 12;
const TAU = Math.PI * 2;
const EPSILON = 0.05;
const GAMMA_LAMBDA_Q = 0.35;
const STAY_THRESHOLD = 1.05;
const TURN_THRESHOLD = 0.90;
const ESCALATE_THRESHOLD = 0.75;
const TIE_THRESHOLD = 0.51;

const SOURCE_BINDINGS = Object.freeze([
  { id: "12iYNtUkHqlHtjpQot46HWURGe-TI8Kdz", title: "Dewey_Calculus_Elaborate_Whitepaper_v1.pdf", role: "ZERO_FREE_T12_LEDGER_CANON" },
  { id: "1Q9hKgW6R7jxzDFnGoaj0BokJAHixp5OU", title: "Mode188_Unified_Runtime_20736D_SYNCED.xlsx", role: "MODE188_PARAMETERS_AND_ATLAS" },
  { id: "1Flbg7drpujKdQhLKM030I_It9aPzEcPV", title: "Dewey_Calculus_20736D_Trig_Water_Force_Atlas.xlsx", role: "WATER_GEOMETRY_TRIG_MOTION_ATLAS" },
]);

export const WATER_MODES_R195 = Object.freeze([
  "Source", "Drop", "Stream", "River", "Eddy", "Wave", "Tide", "Vortex", "Flood", "Mist", "Ice", "Ocean",
]);

export const STATE_NAMES_R195 = Object.freeze([
  "Seed", "Bind", "Shape", "Flow", "Scar", "Carry", "Reflect", "Invert", "Balance", "Amplify", "Collect", "Release",
]);

export const MODE_LENSES_R195 = Object.freeze([
  ["full-overall-canon", "FULL CANON"],
  ["mode-188", "MODE 188"],
  ["unified-coherence", "COHERENCE"],
  ["forecast", "FORECAST"],
  ["full-sphere", "FULL SPHERE"],
  ["relational-skin", "SKIN"],
  ["dewey-calculus", "CALCULUS"],
  ["unified-recursion", "RECURSION"],
  ["deep-mother", "RECOVERY"],
  ["high-father", "CONSTRAINT"],
  ["heavy-prune", "PRUNE"],
  ["alpha", "ALPHA"],
  ["crimson", "CRIMSON"],
  ["no-nothing-truth", "TRUTH"],
  ["guidance-field", "GUIDANCE"],
] as const);

const finite = (v: any, name: string): number => {
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error(`${name} must be finite`);
  return x;
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mod12 = (x: number) => ((Math.trunc(x) % N) + N) % N;
const one12 = (x: any, name: string): number => {
  const n = Math.trunc(finite(x, name));
  if (n < 1 || n > 12) throw new Error(`${name} must be in 1..12`);
  return n;
};
const nonnegative = (v: any, name: string): number => {
  const x = finite(v, name);
  if (x < 0) throw new Error(`${name} must be >= 0`);
  return x;
};

function vector12(value: any, name: string, fallback = 0): number[] {
  if (value == null) return new Array(N).fill(fallback);
  if (!Array.isArray(value)) return new Array(N).fill(nonnegative(value, name));
  if (value.length !== N) throw new Error(`${name} must be a scalar or exactly 12 values`);
  return value.map((v, i) => nonnegative(v, `${name}[${i}]`));
}

function initialRails(body: Obj): Rail[] {
  if (Array.isArray(body?.state?.rails)) {
    if (body.state.rails.length !== N) throw new Error("state.rails must contain exactly 12 rails");
    return body.state.rails.map((r: Obj, i: number) => ({
      outverse: nonnegative(r?.outverse ?? 0, `state.rails[${i}].outverse`),
      inverse: nonnegative(r?.inverse ?? 0, `state.rails[${i}].inverse`),
      scar: nonnegative(r?.scar ?? 0, `state.rails[${i}].scar`),
    }));
  }
  const values = Array.isArray(body.values) ? body.values : [1, ...new Array(N - 1).fill(0)];
  if (values.length !== N) throw new Error("values must contain exactly 12 signed values");
  return values.map((v: any, i: number) => {
    const x = finite(v, `values[${i}]`);
    return { outverse: Math.max(0, x), inverse: Math.max(0, -x), scar: 0 };
  });
}

function addressFrom(body: Obj): Address {
  const a = body?.state?.address || body.address || {};
  return {
    domain: one12(a.domain ?? a.d ?? 1, "address.domain"),
    phase: one12(a.phase ?? a.p ?? body.phase ?? 1, "address.phase"),
    regulation: one12(a.regulation ?? a.r ?? 1, "address.regulation"),
    lens: one12(a.lens ?? a.l ?? 1, "address.lens"),
    context: one12(a.context ?? a.c ?? 1, "address.context"),
  };
}

function addressProjection(a: Address) {
  const d0 = a.domain - 1, p0 = a.phase - 1, r0 = a.regulation - 1, l0 = a.lens - 1, c0 = a.context - 1;
  const i12 = d0;
  const i144 = d0 * 12 + p0;
  const i1728 = i144 * 12 + r0;
  const i20736 = i1728 * 12 + l0;
  const i248832 = i20736 * 12 + c0;
  return {
    address: a,
    zeroBased: { shell12: i12, shell144: i144, shell1728: i1728, shell20736: i20736, shell248832: i248832 },
    oneBased: { shell12: i12 + 1, shell144: i144 + 1, shell1728: i1728 + 1, shell20736: i20736 + 1, shell248832: i248832 + 1 },
    physicalDimensionClaim: false,
  };
}

function relativeAddress(a: Address, frame: Obj | undefined): Address {
  const f = frame || {};
  const shift = (x: number, delta: any, name: string) => mod12((x - 1) + Math.trunc(finite(delta ?? 0, name))) + 1;
  return {
    domain: shift(a.domain, f.domain_offset ?? f.domainOffset, "frame.domain_offset"),
    phase: shift(a.phase, f.phase_offset ?? f.phaseOffset, "frame.phase_offset"),
    regulation: shift(a.regulation, f.regulation_offset ?? f.regulationOffset, "frame.regulation_offset"),
    lens: shift(a.lens, f.lens_offset ?? f.lensOffset, "frame.lens_offset"),
    context: shift(a.context, f.context_offset ?? f.contextOffset, "frame.context_offset"),
  };
}

function sums(rails: Rail[]) {
  let outverse = 0, inverse = 0, scar = 0, tension = 0;
  for (const r of rails) {
    outverse += r.outverse;
    inverse += r.inverse;
    scar += r.scar;
    tension += 2 * Math.min(r.outverse, r.inverse);
  }
  const active = outverse + inverse;
  return { outverse, inverse, scar, active, netProjection: outverse - inverse, tension, contradiction: active > 0 ? clamp01(tension / active) : 0 };
}

function rotateRails(rails: Rail[], k: number): Rail[] {
  const turn = mod12(k);
  if (!turn) return rails.map(r => ({ ...r }));
  const out = new Array<Rail>(N);
  for (let i = 0; i < N; i++) out[(i + turn) % N] = { ...rails[i] };
  return out;
}

function waterWeights(mode: number, transport: number) {
  const theta = TAU * (mode - 1) / N;
  const residenceBasis = clamp01((1 + Math.cos(theta)) / 2);
  const direction = Math.sin(theta);
  const mobilityBasis = 1 - residenceBasis;
  const moved = clamp01(transport) * mobilityBasis;
  const forwardShare = clamp01((1 + direction) / 2);
  const backwardShare = 1 - forwardShare;
  const self = 1 - moved;
  const forward = moved * forwardShare;
  const backward = moved * backwardShare;
  return {
    thetaRadians: theta,
    thetaDegrees: (mode - 1) * 30,
    residenceBasis,
    mobilityBasis,
    direction,
    self,
    forward,
    backward,
    sum: self + forward + backward,
  };
}

function waterRedistribute(rails: Rail[], mode: number, transport: number): { rails: Rail[]; weights: Obj; residual: Obj } {
  const w = waterWeights(mode, transport);
  const out = new Array(N).fill(null).map(() => ({ outverse: 0, inverse: 0, scar: 0 } as Rail));
  const before = sums(rails);
  for (let i = 0; i < N; i++) {
    const prev = (i + N - 1) % N, next = (i + 1) % N;
    for (const key of ["outverse", "inverse", "scar"] as const) {
      const v = rails[i][key];
      out[i][key] += v * w.self;
      out[next][key] += v * w.forward;
      out[prev][key] += v * w.backward;
    }
  }
  const after = sums(out);
  return {
    rails: out,
    weights: w,
    residual: {
      outverse: Math.abs(after.outverse - before.outverse),
      inverse: Math.abs(after.inverse - before.inverse),
      scar: Math.abs(after.scar - before.scar),
      total: Math.abs((after.outverse + after.inverse + after.scar) - (before.outverse + before.inverse + before.scar)),
    },
  };
}

function normalizedEntropy(rails: Rail[]): number {
  const masses = rails.map(r => r.outverse + r.inverse);
  const total = masses.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  let h = 0;
  for (const m of masses) if (m > 0) { const p = m / total; h -= p * Math.log(p); }
  return clamp01(h / Math.log(N));
}

function circulationCoherence(rails: Rail[]): number {
  const masses = rails.map(r => r.outverse + r.inverse);
  const total = masses.reduce((a, b) => a + b, 0);
  if (total <= 0) return 1;
  let variation = 0;
  for (let i = 0; i < N; i++) variation += Math.abs(masses[i] - masses[(i + 1) % N]);
  return clamp01(1 - variation / (2 * total));
}

function metrics(rails: Rail[], invariantResidual: number) {
  const s = sums(rails);
  const entropy = normalizedEntropy(rails);
  const circulation = circulationCoherence(rails);
  const scale = Math.max(EPSILON, s.active + s.scar);
  const continuity = clamp01(1 - invariantResidual / scale);
  const burden = clamp01(s.scar / scale);
  const contradiction = s.contradiction;
  const futurePlasticity = clamp01(entropy * (1 - contradiction));
  const turnBias = s.active > 0 ? Math.max(-1, Math.min(1, s.netProjection / s.active)) : 0;
  const curvatureDensity = burden;
  const omegaScore = (continuity * futurePlasticity) / (contradiction + burden + EPSILON);
  const inevitabilityProxy = omegaScore / (1 + omegaScore);
  const screeningRatio = (continuity * futurePlasticity + EPSILON) / (contradiction + burden + GAMMA_LAMBDA_Q * burden * contradiction + EPSILON);
  const dispatch = screeningRatio >= STAY_THRESHOLD ? "STAY" : screeningRatio >= ESCALATE_THRESHOLD ? "TURN" : "ESCALATE";
  const turnCorridor = screeningRatio >= TURN_THRESHOLD && screeningRatio < STAY_THRESHOLD ? "PRIMARY_TURN_CORRIDOR" : screeningRatio >= ESCALATE_THRESHOLD && screeningRatio < TURN_THRESHOLD ? "LOW_MARGIN_TURN_CORRIDOR" : null;
  return {
    C_omega: continuity,
    Phi: futurePlasticity,
    Lambda: burden,
    q: contradiction,
    omegaScore,
    inevitabilityProxy,
    inevitabilityBoundary: "bounded monotone diagnostic of the established Omega score; not a probability and not a claim of metaphysical inevitability",
    turnBias,
    curvatureDensity,
    phaseEntropy: entropy,
    circulationCoherence: circulation,
    mode188Screening: {
      gammaLambdaQ: GAMMA_LAMBDA_Q,
      epsilon: EPSILON,
      thresholds: { stay: STAY_THRESHOLD, turn: TURN_THRESHOLD, escalate: ESCALATE_THRESHOLD },
      screeningRatio,
      dispatch,
      turnCorridor,
      authority: "DERIVED_SCREENING_NOT_SOVEREIGN_MODE188",
    },
  };
}

function allModeLenses(m: Obj, state: Obj) {
  const s = sums(state.rails);
  const constructShare = s.active > 0 ? s.outverse / s.active : 0.5;
  const pruneShare = s.active > 0 ? s.inverse / s.active : 0.5;
  const residualTruth = clamp01(m.q + m.Lambda - m.q * m.Lambda);
  const guidance = Math.max(-1, Math.min(1, m.turnBias * m.circulationCoherence));
  return {
    "full-overall-canon": { score: m.omegaScore, constructShare, pruneShare, dispatch: m.mode188Screening.dispatch },
    "mode-188": { ...m.mode188Screening },
    "unified-coherence": { coherence: clamp01((m.C_omega + m.circulationCoherence + (1 - m.q)) / 3) },
    forecast: { futurePlasticity: m.Phi, boundedContinuationCapacity: clamp01(m.Phi * m.C_omega * (1 - m.q)), evidenceClass: "DERIVED_MODEL" },
    "full-sphere": { phaseEntropy: m.phaseEntropy, circulationCoherence: m.circulationCoherence, address20736: state.addressProjection.oneBased.shell20736 },
    "relational-skin": { boundaryPressure: clamp01(m.q + m.Lambda - m.q * m.Lambda), scarDensity: m.curvatureDensity },
    "dewey-calculus": { turnBias: m.turnBias, curvatureDensity: m.curvatureDensity, phaseEntropy: m.phaseEntropy, circulationCoherence: m.circulationCoherence },
    "unified-recursion": { retainedCarry: s.active, scarCarry: s.scar, turnCount: state.turnCount },
    "deep-mother": { recoveryPotential: clamp01(m.C_omega * (1 - m.Lambda) * (1 - m.q)), scarCarry: s.scar },
    "high-father": { constraintPressure: clamp01(m.Lambda + m.q - m.Lambda * m.q), screeningRatio: m.mode188Screening.screeningRatio },
    "heavy-prune": { pruneShare, inverseCarry: s.inverse, contradiction: m.q },
    alpha: { explorationPotential: clamp01(m.Phi * (1 - m.q)), phaseEntropy: m.phaseEntropy },
    crimson: { constructShare, outverseCarry: s.outverse, consequenceBurden: m.Lambda },
    "no-nothing-truth": { unresolvedOpposition: m.q, residualTruth, zeroProjectionDoesNotEraseRails: true },
    "guidance-field": { signedGuidance: guidance, suggestedTurnDirection: guidance > 0 ? "OUTVERSE" : guidance < 0 ? "INVERSE" : "TIE", dispatch: m.mode188Screening.dispatch },
  };
}

async function sha(value: any): Promise<string> {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(raw)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
}

async function runStep(body: Obj, prior?: Obj): Promise<Obj> {
  let rails = prior?.rails ? (prior.rails as Rail[]).map(r => ({ ...r })) : initialRails(body);
  let address = prior?.address ? ({ ...prior.address } as Address) : addressFrom(body);
  let turnCount = Number(prior?.turnCount || 0);
  const construct = vector12(body.construct_011 ?? body.construct011, "construct_011", 0);
  const prune = vector12(body.prune_01m1 ?? body.prune01m1 ?? body["prune_01-1"], "prune_01m1", 0);
  const scarGain = nonnegative(body.scar_gain ?? body.scarGain ?? 1, "scar_gain");
  const dt = nonnegative(body.dt ?? 1, "dt");
  const beforeInjection = sums(rails);
  for (let i = 0; i < N; i++) {
    rails[i].outverse += construct[i];
    rails[i].inverse += prune[i];
    const opposed = 2 * Math.min(rails[i].outverse, rails[i].inverse);
    rails[i].scar += opposed * scarGain * dt / 2;
  }
  const afterInjection = sums(rails);
  const injected = construct.reduce((a, b) => a + b, 0) + prune.reduce((a, b) => a + b, 0);
  const injectionResidual = Math.abs(afterInjection.active - beforeInjection.active - injected);
  const waterMode = one12(body.water_mode ?? body.waterMode ?? address.phase, "water_mode");
  const transport = clamp01(finite(body.transport ?? 1, "transport"));
  const water = waterRedistribute(rails, waterMode, transport);
  rails = water.rails;
  const preTurn = sums(rails);
  const turnRequired = preTurn.contradiction >= clamp01(finite(body.tie_threshold ?? body.tieThreshold ?? TIE_THRESHOLD, "tie_threshold"));
  const requestedTurn = body.turn_k ?? body.turnK;
  const autoTurn = body.auto_turn === true || body.autoTurn === true;
  const turnK = requestedTurn != null ? mod12(finite(requestedTurn, "turn_k")) : autoTurn && turnRequired ? 6 : 0;
  if (turnK) {
    rails = rotateRails(rails, turnK);
    address = { ...address, phase: mod12((address.phase - 1) + turnK) + 1, lens: mod12((address.lens - 1) + turnK) + 1 };
    turnCount += turnK;
  }
  const relative = relativeAddress(address, body.frame);
  const projection = addressProjection(address);
  const relativeProjection = addressProjection(relative);
  const invariantResidual = injectionResidual + water.residual.total;
  const m = metrics(rails, invariantResidual);
  const orientation = m.turnBias > 1e-12 ? 1 : m.turnBias < -1e-12 ? -1 : 0;
  const state = {
    schema: "OMEGA_DEWEY_STATE_R195",
    rails,
    address,
    relativeAddress: relative,
    addressProjection: projection,
    relativeAddressProjection: relativeProjection,
    orientation_sigma: orientation,
    turnCount,
    turnCountMod12: mod12(turnCount),
    waterMode,
    waterModeName: WATER_MODES_R195[waterMode - 1],
    stateName: STATE_NAMES_R195[address.phase - 1],
    zeroFree: {
      representation: "DUAL_RAIL_PLUS_SCAR",
      netProjection: sums(rails).netProjection,
      nullOperationAllowed: false,
      tiePreservesOpposingCarry: true,
    },
  };
  return {
    state,
    metrics: m,
    modes: allModeLenses(m, state),
    operation: {
      construct011: construct,
      prune01m1: prune,
      injectedCarry: injected,
      waterKernel: { mode: waterMode, name: WATER_MODES_R195[waterMode - 1], ...water.weights },
      turn: { required: turnRequired, appliedK: turnK, autoTurn, policy: turnK === 6 && autoTurn ? "DECLARED_ANTIPODAL_TIE_POLICY_NOT_UNIVERSAL_THEOREM" : "EXPLICIT_OR_NONE" },
      invariantResidual: { injection: injectionResidual, water: water.residual, aggregate: invariantResidual },
    },
    nextAction: turnRequired && !turnK ? "TURN_REQUIRED_OR_EXPLICITLY_WITHHELD" : m.mode188Screening.dispatch,
    evidenceClass: "DERIVED_MODEL",
    canonicalMutation: false,
    physicalDimensionClaim: false,
    boundary: DEWEY_WATER_MOTION_BOUNDARY_R195,
  };
}

async function runTrajectory(body: Obj): Promise<Obj> {
  const steps = Math.trunc(finite(body.steps ?? 12, "steps"));
  if (steps < 1 || steps > 144) throw new Error("steps must be in 1..144");
  const sequence = Array.isArray(body.sequence) ? body.sequence : [];
  let prior: Obj | undefined;
  const trace: Obj[] = [];
  let maxInvariantResidual = 0;
  for (let i = 0; i < steps; i++) {
    const override = sequence.length ? (sequence[i % sequence.length] || {}) : {};
    const stepBody = { ...body, ...override, sequence: undefined, steps: undefined };
    const result = await runStep(stepBody, prior?.state);
    maxInvariantResidual = Math.max(maxInvariantResidual, Number(result.operation?.invariantResidual?.aggregate || 0));
    trace.push({
      step: i + 1,
      address: result.state.address,
      relativeAddress: result.state.relativeAddress,
      orientation_sigma: result.state.orientation_sigma,
      waterMode: result.state.waterMode,
      waterModeName: result.state.waterModeName,
      turnAppliedK: result.operation.turn.appliedK,
      metrics: result.metrics,
      dispatch: result.metrics.mode188Screening.dispatch,
      nextAction: result.nextAction,
    });
    prior = result;
  }
  const result = {
    schema: "OMEGA_DEWEY_TRAJECTORY_R195",
    steps,
    final: prior,
    trace,
    compounding: {
      type: "OPERATOR_COMPOSITION_NOT_FINANCIAL_COMPOUNDING",
      composedTurnMod12: prior?.state?.turnCountMod12 ?? 0,
      maxInvariantResidual,
      finalOmegaScore: prior?.metrics?.omegaScore ?? null,
      finalInevitabilityProxy: prior?.metrics?.inevitabilityProxy ?? null,
    },
    evidenceClass: "DERIVED_MODEL",
    canonicalMutation: false,
    boundary: DEWEY_WATER_MOTION_BOUNDARY_R195,
  };
  return result;
}

async function receipt(kind: string, input: Obj, result: Obj) {
  const core = {
    schema: "OMEGA_DEWEY_WATER_MOTION_RECEIPT_R195",
    release: DEWEY_WATER_MOTION_RELEASE_R195,
    kind,
    inputSha256: await sha(input),
    resultSha256: await sha(result),
    evidenceClass: "DERIVED_MODEL",
    sourceBoundOperatorCanon: SOURCE_BINDINGS,
    canonicalMutation: false,
    nativeExecution: false,
    physicalDimensionClaim: false,
    boundary: DEWEY_WATER_MOTION_BOUNDARY_R195,
  };
  return { ...core, receiptSha256: await sha(core) };
}

function manifest() {
  return {
    ok: true,
    schema: DEWEY_WATER_MOTION_SCHEMA_R195,
    release: DEWEY_WATER_MOTION_RELEASE_R195,
    operatorCanon: {
      construct: "011",
      prune: "01-1",
      zeroFree: "opposition is retained on dual rails; net projection may equal zero without deleting either rail",
      turnGroup: "T12",
      turnLaw: "tau_a ∘ tau_b = tau_(a+b mod 12)",
      inverseTurn: "tau_k^-1 = tau_(12-k)",
      tieThreshold: TIE_THRESHOLD,
      autoTurnDefault: false,
      antipodalAutoTurnPolicyWhenEnabled: 6,
      wovenContinuity: ["partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"],
    },
    waterGeometry: WATER_MODES_R195.map((name, i) => ({ index: i + 1, name, degrees: i * 30, weightsAtTransport1: waterWeights(i + 1, 1) })),
    mode188: { epsilon: EPSILON, gammaLambdaQ: GAMMA_LAMBDA_Q, stayThreshold: STAY_THRESHOLD, turnThreshold: TURN_THRESHOLD, escalateThreshold: ESCALATE_THRESHOLD, authority: "DERIVED_SCREENING_NOT_SOVEREIGN_MODE188" },
    modeLenses: MODE_LENSES_R195,
    dimensions: { addressLevels: [12, 144, 1728, 20736, 248832], physicalDimensionClaim: false, frameRelativeRoles: true },
    endpoints: ["GET /api/compute/dewey/r195/manifest", "POST /api/compute/dewey/r195/step", "POST /api/compute/dewey/r195/trajectory"],
    sourceBindings: SOURCE_BINDINGS,
    trainingBoundary: "SOURCE_BOUND_EXECUTABLE_OPERATOR_CONTEXT_NOT_MODEL_FINETUNE",
    evidenceClass: "DERIVED_MODEL",
    canonicalMutation: false,
    nativeExecution: false,
    boundary: DEWEY_WATER_MOTION_BOUNDARY_R195,
  };
}

export async function handleDeweyWaterMotionR195(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/compute/dewey/r195/")) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
  try {
    if (request.method === "GET" && path === "/api/compute/dewey/r195/manifest") return json(manifest());
    if (request.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
    const body = await request.json().catch(() => ({})) as Obj;
    if (path === "/api/compute/dewey/r195/step") {
      const result = await runStep(body);
      return json({ ok: true, result, receipt: await receipt("DEWEY_WATER_MOTION_STEP", body, result) });
    }
    if (path === "/api/compute/dewey/r195/trajectory") {
      const result = await runTrajectory(body);
      return json({ ok: true, result, receipt: await receipt("DEWEY_WATER_MOTION_TRAJECTORY", body, result) });
    }
    return json({ ok: false, code: "NOT_FOUND" }, 404);
  } catch (error) {
    return json({ ok: false, code: "INVALID_DEWEY_WATER_MOTION_REQUEST", error: error instanceof Error ? error.message : String(error), evidenceClass: "DERIVED_MODEL", canonicalMutation: false, boundary: DEWEY_WATER_MOTION_BOUNDARY_R195 }, 422);
  }
}
