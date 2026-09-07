import {
  DEWEY_WATER_CONTINUITY_RELEASE_R195,
  DEWEY_WATER_CONTINUITY_SCHEMA_R195,
  type DeweyParams,
  type DeweyState,
  type GovernedModeId,
  handleDeweyWaterContinuityR195,
} from "./deweyWaterContinuityR195";

export const DEWEY_CALIBRATION_RELEASE_R196 = "r196-measured-dewey-calibration-fabric";
export const DEWEY_CALIBRATION_SCHEMA_R196 = "OMEGA_MEASURED_DEWEY_CALIBRATION_R196";
export const DEWEY_CALIBRATION_BOUNDARY_R196 =
  "R196 calibrates bounded Dewey-model parameters against declared observation rows using calibration-only optimization and untouched holdout evaluation. Exact 011/01-1 linear invariants, no-zero magnitude floors, signed orientation semantics, dimensional address boundaries, and truth boundaries are not fitted. User-supplied MEASURED labels and provenance are evidence claims, not independent authentication. Synthetic benchmarks prove numerical calibration behavior only. No calibration result mutates CanonState, production policy, model weights, or deployment authority automatically.";

const STATE_KEYS = ["continuity", "plasticity", "burden", "contradiction", "scar"] as const;
const PARAM_KEYS = [
  "dt",
  "curvature",
  "circulation",
  "constructGain",
  "pruneGain",
  "scarGain",
  "recoveryGain",
  "compoundingGain",
  "contradictionDamping",
] as const;

type StateKey = typeof STATE_KEYS[number];
type ParamKey = typeof PARAM_KEYS[number];
type EvidenceClass = "MEASURED" | "USER_DECLARED_UNVERIFIED" | "SYNTHETIC" | "DERIVED";
type Obj = Record<string, any>;

type ObservationRow = {
  id: string;
  group: string;
  observedAt: string | null;
  mode: GovernedModeId | string;
  initialState: Partial<DeweyState>;
  observedNextState: Partial<DeweyState>;
  steps: number;
  weight: number;
  evidenceClass: EvidenceClass;
  provenance: string | null;
  sourceReceiptSha256: string | null;
};

type Evaluation = {
  aggregateLoss: number;
  dataLoss: number;
  regularizationLoss: number;
  rows: number;
  channelMae: Record<StateKey, number>;
  channelRmse: Record<StateKey, number>;
};

const PARAM_BOUNDS: Record<ParamKey, [number, number]> = {
  dt: [1e-4, 0.5],
  curvature: [-4, 4],
  circulation: [-4, 4],
  constructGain: [0.01, 4],
  pruneGain: [0.01, 4],
  scarGain: [0.01, 4],
  recoveryGain: [0.01, 4],
  compoundingGain: [0.01, 4],
  contradictionDamping: [0.01, 4],
};

const DEFAULT_PARAMS: DeweyParams = {
  dt: 0.04,
  curvature: 0.42,
  circulation: 0.55,
  constructGain: 0.72,
  pruneGain: 0.68,
  scarGain: 0.34,
  recoveryGain: 0.5,
  compoundingGain: 0.44,
  contradictionDamping: 0.62,
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-authority": "calibration-candidate-computation-only",
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

function stable(value: any): any {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stable(value[key]);
      return out;
    }, {} as Obj);
  }
  return value;
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(stable(value)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
}

function evidenceClass(v: unknown): EvidenceClass {
  const key = String(v || "USER_DECLARED_UNVERIFIED").toUpperCase();
  if (key === "MEASURED" || key === "SYNTHETIC" || key === "DERIVED") return key;
  return "USER_DECLARED_UNVERIFIED";
}

function normalizeRow(raw: Obj, index: number): ObservationRow {
  const initial = raw.initialState ?? raw.initial ?? raw.state0 ?? {};
  const observed = raw.observedNextState ?? raw.observed ?? raw.state1 ?? {};
  return {
    id: String(raw.id ?? `row-${index + 1}`),
    group: String(raw.group ?? raw.series ?? raw.subject ?? raw.id ?? `row-${index + 1}`),
    observedAt: raw.observedAt || raw.observed_at || raw.time ? String(raw.observedAt ?? raw.observed_at ?? raw.time) : null,
    mode: String(raw.mode || "full-overall-canon"),
    initialState: initial && typeof initial === "object" ? initial : {},
    observedNextState: observed && typeof observed === "object" ? observed : {},
    steps: clamp(Math.trunc(finite(raw.steps, 1)), 1, 4096),
    weight: clamp(finite(raw.weight, 1), 1e-6, 1e6),
    evidenceClass: evidenceClass(raw.evidenceClass ?? raw.evidence_class),
    provenance: raw.provenance ? String(raw.provenance) : null,
    sourceReceiptSha256: raw.sourceReceiptSha256 || raw.receipt_sha256 ? String(raw.sourceReceiptSha256 ?? raw.receipt_sha256) : null,
  };
}

function validateRows(rows: ObservationRow[]): string[] {
  const errors: string[] = [];
  if (!rows.length) errors.push("OBSERVATION_ROWS_REQUIRED");
  const ids = new Set<string>();
  rows.forEach((row, index) => {
    if (ids.has(row.id)) errors.push(`DUPLICATE_ROW_ID:${row.id}`);
    ids.add(row.id);
    const observedKeys = STATE_KEYS.filter(key => Number.isFinite(Number((row.observedNextState as any)[key])));
    if (!observedKeys.length) errors.push(`ROW_${index + 1}_NO_OBSERVED_STATE_CHANNELS`);
    if (row.evidenceClass === "MEASURED" && !row.provenance) errors.push(`ROW_${index + 1}_MEASURED_REQUIRES_PROVENANCE`);
  });
  return errors;
}

async function solveR195(row: ObservationRow, params: DeweyParams) {
  const request = new Request("https://omega.internal/api/compute/dewey/r195/solve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: row.mode, state: row.initialState, params, steps: row.steps, tracePoints: 1 }),
  });
  const response = await handleDeweyWaterContinuityR195(request);
  if (!response || !response.ok) throw new Error(`R195_SOLVE_FAILED:${response?.status ?? 0}`);
  return await response.json() as Obj;
}

function huber(error: number, delta: number): number {
  const a = Math.abs(error);
  return a <= delta ? 0.5 * error * error : delta * (a - 0.5 * delta);
}

function boundedParams(raw: Obj = {}): DeweyParams {
  const out = { ...DEFAULT_PARAMS };
  for (const key of PARAM_KEYS) {
    const [lo, hi] = PARAM_BOUNDS[key];
    const v = finite(raw[key], out[key]);
    out[key] = clamp(v, lo, hi);
  }
  return out;
}

function normalizedParamDistance(candidate: DeweyParams, baseline: DeweyParams): number {
  let sum = 0;
  for (const key of PARAM_KEYS) {
    const [lo, hi] = PARAM_BOUNDS[key];
    const span = Math.max(1e-12, hi - lo);
    const d = (candidate[key] - baseline[key]) / span;
    sum += d * d;
  }
  return sum / PARAM_KEYS.length;
}

async function evaluateRows(
  rows: ObservationRow[],
  candidate: DeweyParams,
  baseline: DeweyParams,
  huberDelta: number,
  regularization: number,
): Promise<Evaluation> {
  const abs: Record<StateKey, number> = { continuity: 0, plasticity: 0, burden: 0, contradiction: 0, scar: 0 };
  const sq: Record<StateKey, number> = { continuity: 0, plasticity: 0, burden: 0, contradiction: 0, scar: 0 };
  const counts: Record<StateKey, number> = { continuity: 0, plasticity: 0, burden: 0, contradiction: 0, scar: 0 };
  let weightedLoss = 0;
  let totalWeight = 0;
  for (const row of rows) {
    const solved = await solveR195(row, candidate);
    const predicted = solved.final || {};
    let rowLoss = 0;
    let rowChannels = 0;
    for (const key of STATE_KEYS) {
      const y = Number((row.observedNextState as any)[key]);
      if (!Number.isFinite(y)) continue;
      const p = Number(predicted[key]);
      if (!Number.isFinite(p)) throw new Error(`NON_FINITE_PREDICTION:${row.id}:${key}`);
      const e = p - y;
      rowLoss += huber(e, huberDelta);
      rowChannels++;
      abs[key] += Math.abs(e) * row.weight;
      sq[key] += e * e * row.weight;
      counts[key] += row.weight;
    }
    if (rowChannels) {
      weightedLoss += (rowLoss / rowChannels) * row.weight;
      totalWeight += row.weight;
    }
  }
  const dataLoss = weightedLoss / Math.max(1e-12, totalWeight);
  const regularizationLoss = regularization * normalizedParamDistance(candidate, baseline);
  const channelMae = {} as Record<StateKey, number>;
  const channelRmse = {} as Record<StateKey, number>;
  for (const key of STATE_KEYS) {
    channelMae[key] = abs[key] / Math.max(1e-12, counts[key]);
    channelRmse[key] = Math.sqrt(sq[key] / Math.max(1e-12, counts[key]));
  }
  return {
    aggregateLoss: dataLoss + regularizationLoss,
    dataLoss,
    regularizationLoss,
    rows: rows.length,
    channelMae,
    channelRmse,
  };
}

async function splitRows(rows: ObservationRow[], policy: string, holdoutFraction: number) {
  const grouped = new Map<string, ObservationRow[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.group) || [];
    bucket.push(row);
    grouped.set(row.group, bucket);
  }
  let groups = [...grouped.entries()];
  if (policy === "temporal") {
    const invalid = rows.filter(row => !row.observedAt || !Number.isFinite(Date.parse(row.observedAt)));
    if (invalid.length) throw new Error("TEMPORAL_SPLIT_REQUIRES_VALID_OBSERVED_AT");
    groups.sort((a, b) => {
      const ta = Math.max(...a[1].map(r => Date.parse(r.observedAt || "")));
      const tb = Math.max(...b[1].map(r => Date.parse(r.observedAt || "")));
      return ta - tb || a[0].localeCompare(b[0]);
    });
  } else {
    const withHash = await Promise.all(groups.map(async entry => ({ entry, hash: await sha256(entry[0]) })));
    withHash.sort((a, b) => a.hash.localeCompare(b.hash));
    groups = withHash.map(x => x.entry);
  }
  const holdoutGroups = Math.max(1, Math.min(groups.length - 1, Math.ceil(groups.length * holdoutFraction)));
  const splitAt = Math.max(1, groups.length - holdoutGroups);
  const trainGroups = groups.slice(0, splitAt);
  const holdout = groups.slice(splitAt);
  const trainRows = trainGroups.flatMap(x => x[1]);
  const holdoutRows = holdout.flatMap(x => x[1]);
  const trainNames = new Set(trainGroups.map(x => x[0]));
  const holdoutNames = new Set(holdout.map(x => x[0]));
  const overlap = [...trainNames].filter(x => holdoutNames.has(x));
  let temporalLeakage = false;
  if (policy === "temporal" && trainRows.length && holdoutRows.length) {
    const maxTrain = Math.max(...trainRows.map(r => Date.parse(r.observedAt || "")));
    const minHoldout = Math.min(...holdoutRows.map(r => Date.parse(r.observedAt || "")));
    temporalLeakage = maxTrain > minHoldout;
  }
  return {
    trainRows,
    holdoutRows,
    proof: {
      policy: policy === "temporal" ? "GROUP_AWARE_TEMPORAL" : "GROUP_AWARE_SHA256",
      groupOverlap: overlap,
      leakageFree: overlap.length === 0 && !temporalLeakage,
      temporalLeakage,
      trainGroups: trainGroups.map(x => x[0]),
      holdoutGroups: holdout.map(x => x[0]),
      trainRowIds: trainRows.map(x => x.id),
      holdoutRowIds: holdoutRows.map(x => x.id),
    },
  };
}

function initialStep(key: ParamKey): number {
  const [lo, hi] = PARAM_BOUNDS[key];
  return (hi - lo) * 0.08;
}

function changed(candidate: DeweyParams, key: ParamKey, delta: number): DeweyParams {
  const [lo, hi] = PARAM_BOUNDS[key];
  return { ...candidate, [key]: clamp(candidate[key] + delta, lo, hi) };
}

async function calibrateRows(rows: ObservationRow[], options: Obj = {}, evidenceAuthority = "USER_REQUEST_BODY_UNVERIFIED") {
  const errors = validateRows(rows);
  if (errors.length) throw new Error(errors.join(";"));
  if (rows.length < 4) throw new Error("MINIMUM_4_ROWS_REQUIRED_FOR_CALIBRATION_AND_HOLDOUT");
  if (rows.length > 96) throw new Error("MAXIMUM_96_ROWS_PER_WORKER_CALIBRATION_REQUEST");
  if (new Set(rows.map(row => row.group)).size < 2) throw new Error("MINIMUM_2_INDEPENDENT_GROUPS_REQUIRED_FOR_HOLDOUT");

  const splitPolicy = String(options.splitPolicy || "hash").toLowerCase();
  const holdoutFraction = clamp(finite(options.holdoutFraction, 0.25), 0.1, 0.5);
  const split = await splitRows(rows, splitPolicy, holdoutFraction);
  if (!split.proof.leakageFree) throw new Error("CALIBRATION_HOLDOUT_LEAKAGE_DETECTED");

  const baseline = boundedParams(options.baselineParams || {});
  let candidate = { ...baseline };
  const huberDelta = clamp(finite(options.huberDelta, 0.1), 1e-4, 1);
  const regularization = clamp(finite(options.regularization, 0.002), 0, 1);
  const maxEvaluations = clamp(Math.trunc(finite(options.maxEvaluations, 48)), 8, 192);
  const rounds = clamp(Math.trunc(finite(options.rounds, 4)), 1, 8);
  const selectedKeys = PARAM_KEYS.filter(key => options.parameters?.[key] !== false);
  const steps = Object.fromEntries(selectedKeys.map(key => [key, initialStep(key)])) as Partial<Record<ParamKey, number>>;

  const baselineTrain = await evaluateRows(split.trainRows, baseline, baseline, huberDelta, regularization);
  let bestTrain = baselineTrain;
  let evaluations = 1;
  const audit: Obj[] = [{ evaluation: evaluations, kind: "BASELINE_TRAIN", loss: bestTrain.aggregateLoss, params: candidate }];

  for (let round = 0; round < rounds && evaluations < maxEvaluations; round++) {
    let improvedRound = false;
    for (const key of selectedKeys) {
      if (evaluations >= maxEvaluations) break;
      const step = steps[key] || initialStep(key);
      let localBest = candidate;
      let localEval = bestTrain;
      for (const direction of [-1, 1] as const) {
        if (evaluations >= maxEvaluations) break;
        const trial = changed(candidate, key, direction * step);
        const evaluation = await evaluateRows(split.trainRows, trial, baseline, huberDelta, regularization);
        evaluations++;
        audit.push({ evaluation: evaluations, kind: "TRAIN_ONLY", round, key, direction, step, loss: evaluation.aggregateLoss, params: trial });
        if (evaluation.aggregateLoss + 1e-15 < localEval.aggregateLoss) {
          localBest = trial;
          localEval = evaluation;
        }
      }
      if (localEval.aggregateLoss + 1e-15 < bestTrain.aggregateLoss) {
        candidate = localBest;
        bestTrain = localEval;
        improvedRound = true;
      } else {
        steps[key] = step * 0.5;
      }
    }
    if (!improvedRound) {
      for (const key of selectedKeys) steps[key] = (steps[key] || initialStep(key)) * 0.5;
    }
  }

  // Holdout is evaluated only after candidate selection is complete.
  const baselineHoldout = await evaluateRows(split.holdoutRows, baseline, baseline, huberDelta, 0);
  const candidateHoldout = await evaluateRows(split.holdoutRows, candidate, baseline, huberDelta, 0);
  const trainRelativeImprovement = (baselineTrain.dataLoss - bestTrain.dataLoss) / Math.max(1e-12, baselineTrain.dataLoss);
  const holdoutRelativeImprovement = (baselineHoldout.dataLoss - candidateHoldout.dataLoss) / Math.max(1e-12, baselineHoldout.dataLoss);
  const requiredRelativeImprovement = clamp(finite(options.requiredHoldoutRelativeImprovement, 0), 0, 1);
  const allMeasured = rows.every(row => row.evidenceClass === "MEASURED" && Boolean(row.provenance));
  const allMeasuredWithReceiptClaim = allMeasured && rows.every(row => Boolean(row.sourceReceiptSha256));
  const evidenceClasses = [...new Set(rows.map(row => row.evidenceClass))];
  const generalizationGap = candidateHoldout.dataLoss - bestTrain.dataLoss;
  const generalizes = holdoutRelativeImprovement > requiredRelativeImprovement + 1e-12;
  const admissibleAsModelCandidate = split.proof.leakageFree && generalizes && Number.isFinite(candidateHoldout.dataLoss);
  const empiricalAuthority = evidenceAuthority === "SERVER_VERIFIED_EVIDENCE_LEDGER";
  const evidenceStatus = empiricalAuthority && allMeasuredWithReceiptClaim
    ? "SERVER_VERIFIED_MEASURED_EVIDENCE"
    : allMeasuredWithReceiptClaim
      ? "MEASURED_WITH_RECEIPT_CLAIMS_NOT_SERVER_VERIFIED"
      : allMeasured
        ? "MEASURED_PROVENANCE_SUPPLIED_NOT_SERVER_VERIFIED"
        : evidenceClasses.includes("SYNTHETIC")
          ? "SYNTHETIC_OR_MIXED_NUMERICAL_EVIDENCE"
          : "USER_OR_DERIVED_EVIDENCE_NOT_EMPIRICALLY_VERIFIED";

  const core = {
    ok: true,
    schema: DEWEY_CALIBRATION_SCHEMA_R196,
    release: DEWEY_CALIBRATION_RELEASE_R196,
    predecessor: DEWEY_WATER_CONTINUITY_RELEASE_R195,
    engineSchema: DEWEY_WATER_CONTINUITY_SCHEMA_R195,
    optimization: {
      algorithm: "BOUNDED_DETERMINISTIC_COORDINATE_DESCENT",
      objective: "TRAIN_WEIGHTED_HUBER_PLUS_BASELINE_REGULARIZATION",
      selectedParameters: selectedKeys,
      maxEvaluations,
      evaluations,
      rounds,
      huberDelta,
      regularization,
      holdoutUsedForCandidateSelection: false,
      audit,
    },
    split: split.proof,
    baseline: { params: baseline, train: baselineTrain, holdout: baselineHoldout },
    candidate: { params: candidate, train: bestTrain, holdout: candidateHoldout },
    comparison: {
      trainRelativeImprovement,
      holdoutRelativeImprovement,
      generalizationGap,
      generalizationGapDefinition: "candidate_holdout_data_loss - candidate_train_data_loss",
      requiredHoldoutRelativeImprovement: requiredRelativeImprovement,
      generalizes,
    },
    evidence: {
      authority: evidenceAuthority,
      classes: evidenceClasses,
      allMeasured,
      allMeasuredWithReceiptClaim,
      serverVerified: empiricalAuthority,
      status: evidenceStatus,
    },
    admission: {
      modelCandidateAdmissible: admissibleAsModelCandidate,
      empiricalCalibrationVerified: admissibleAsModelCandidate && empiricalAuthority && allMeasuredWithReceiptClaim,
      canonicalMutation: false,
      productionMutation: false,
      automaticPromotion: false,
      decision: !admissibleAsModelCandidate
        ? "RETAIN_BASELINE"
        : empiricalAuthority && allMeasuredWithReceiptClaim
          ? "EMPIRICAL_CALIBRATION_CANDIDATE_FOR_GOVERNED_REVIEW"
          : "NUMERIC_CALIBRATION_CANDIDATE_REQUIRES_EVIDENCE_BINDING_AND_GOVERNED_REVIEW",
    },
    invariantsNotFitted: [
      "011_01M1_ORTHONORMAL_BASIS",
      "NO_ZERO_MAGNITUDE_FLOOR",
      "SIGMA_ORIENTATION_SEMANTICS",
      "DIMENSIONAL_ADDRESS_LEVELS",
      "WOVEN_CONTINUITY_TRUTH_BOUNDARIES",
      "37_73_REFERENCE_KERNEL_NOT_FIXED_SYMMETRY_RULE",
    ],
    boundary: DEWEY_CALIBRATION_BOUNDARY_R196,
  };
  return { ...core, receiptSha256: await sha256(core) };
}

async function evaluateRequest(body: Obj) {
  const rows = (Array.isArray(body.rows) ? body.rows : []).map(normalizeRow);
  const errors = validateRows(rows);
  if (errors.length) return { status: 422, body: { ok: false, code: "R196_INVALID_OBSERVATIONS", errors, boundary: DEWEY_CALIBRATION_BOUNDARY_R196 } };
  const params = boundedParams(body.params || {});
  const baseline = boundedParams(body.baselineParams || {});
  const evaluation = await evaluateRows(rows, params, baseline, clamp(finite(body.huberDelta, 0.1), 1e-4, 1), clamp(finite(body.regularization, 0), 0, 1));
  const core = { ok: true, schema: "OMEGA_DEWEY_EVALUATION_R196", params, evaluation, rows: rows.length, canonicalMutation: false, boundary: DEWEY_CALIBRATION_BOUNDARY_R196 };
  return { status: 200, body: { ...core, receiptSha256: await sha256(core) } };
}

async function benchmark(body: Obj) {
  const n = clamp(Math.trunc(finite(body.rows, 24)), 8, 48);
  const hidden = boundedParams({ ...DEFAULT_PARAMS, ...(body.hiddenParams || { curvature: 0.73, recoveryGain: 0.83, pruneGain: 0.92 }) });
  const rows: ObservationRow[] = [];
  for (let i = 0; i < n; i++) {
    const initialState = {
      continuity: clamp(0.45 + 0.4 * ((i % 7) / 6), 1e-12, 1),
      plasticity: clamp(0.35 + 0.5 * (((i * 5) % 11) / 10), 1e-12, 1),
      burden: clamp(0.1 + 0.45 * (((i * 3) % 13) / 12), 1e-12, 1),
      contradiction: clamp(0.08 + 0.4 * (((i * 7) % 17) / 16), 1e-12, 1),
      scar: clamp(0.03 + 0.3 * (((i * 11) % 19) / 18), 1e-12, 1),
      orientation: (i % 3 === 0 ? -1 : i % 5 === 0 ? 0 : 1) as -1 | 0 | 1,
      phase: (i % 12) * Math.PI / 6,
      shell: [12, 144, 1728, 20736, 248832][i % 5],
    };
    const proto: ObservationRow = {
      id: `synthetic-${i + 1}`,
      group: `synthetic-group-${Math.floor(i / 2) + 1}`,
      observedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
      mode: "dewey-calculus",
      initialState,
      observedNextState: {},
      steps: 4 + (i % 9),
      weight: 1,
      evidenceClass: "SYNTHETIC",
      provenance: "R196 deterministic synthetic benchmark generated by the R195 solver",
      sourceReceiptSha256: null,
    };
    const solved = await solveR195(proto, hidden);
    proto.observedNextState = solved.final;
    rows.push(proto);
  }
  const result = await calibrateRows(rows, {
    baselineParams: body.baselineParams || DEFAULT_PARAMS,
    holdoutFraction: body.holdoutFraction ?? 0.25,
    splitPolicy: body.splitPolicy || "temporal",
    maxEvaluations: body.maxEvaluations ?? 72,
    rounds: body.rounds ?? 5,
    requiredHoldoutRelativeImprovement: body.requiredHoldoutRelativeImprovement ?? 0,
  }, "R196_SYNTHETIC_BENCHMARK");
  const calibrationReceiptSha256 = result.receiptSha256;
  const { receiptSha256: _innerReceipt, ...calibration } = result;
  const core = {
    ...calibration,
    benchmark: {
      hiddenParams: hidden,
      generatedRows: n,
      authority: "SYNTHETIC_NUMERICAL_BENCHMARK_ONLY",
      physicalMeasurement: false,
      empiricalCalibration: false,
    },
    receiptChain: {
      calibrationReceiptSha256,
      envelope: "OMEGA_DEWEY_SYNTHETIC_BENCHMARK_R196",
      parentReceiptPreserved: true,
    },
  };
  return {
    ...core,
    receiptSha256: await sha256(core),
  };
}

function manifest() {
  return {
    ok: true,
    schema: DEWEY_CALIBRATION_SCHEMA_R196,
    release: DEWEY_CALIBRATION_RELEASE_R196,
    predecessor: DEWEY_WATER_CONTINUITY_RELEASE_R195,
    exactMath: {
      fitted: false,
      operator011: "(b+c)/sqrt(2)",
      operator01m1: "(b-c)/sqrt(2)",
      invariant: "b^2+c^2=011^2+01-1^2",
      orientation: "sigma in {-1,0,+1}; neutral remains neutral",
      noZero: "strict positive epsilon floor for magnitude channels",
    },
    calibratableParameters: Object.fromEntries(PARAM_KEYS.map(key => [key, { bounds: PARAM_BOUNDS[key], default: DEFAULT_PARAMS[key] }])),
    observationContract: {
      required: ["id", "initialState", "observedNextState"],
      recommended: ["group", "observedAt", "mode", "steps", "evidenceClass", "provenance", "sourceReceiptSha256"],
      evidenceClasses: ["MEASURED", "USER_DECLARED_UNVERIFIED", "SYNTHETIC", "DERIVED"],
      minimumIndependentGroupsForHoldout: 2,
      maximumRowsPerWorkerCalibration: 96,
    },
    split: {
      default: "GROUP_AWARE_SHA256",
      temporal: "GROUP_AWARE_TEMPORAL",
      holdoutUsedForCandidateSelection: false,
    },
    optimization: {
      algorithm: "bounded deterministic coordinate descent",
      maximumEvaluations: 192,
      objective: "weighted Huber data loss + baseline regularization",
      holdout: "evaluated only after candidate selection",
      admissionRequiresStrictPositiveHoldoutImprovement: true,
    },
    representations: {
      authority: "deweyRepresentationR196",
      dualRail011_01m1: true,
      t12ReversiblePhase: true,
      fixed3773SymmetryRule: false,
      automaticDecisionThresholds: false,
    },
    truthClasses: ["EXACT_MATH_INVARIANT", "NUMERICAL_BENCHMARK", "EVIDENCE_SUPPLIED_MODEL_FIT", "SERVER_VERIFIED_EMPIRICAL_EVIDENCE", "OPERATIONAL_RUNTIME_RECEIPT"],
    routes: [
      "/api/compute/dewey/r196/manifest",
      "/api/compute/dewey/r196/evaluate",
      "/api/compute/dewey/r196/calibrate",
      "/api/compute/dewey/r196/representation",
      "/api/compute/dewey/r196/benchmark",
    ],
    canonicalMutation: false,
    promotionAuthorized: false,
    boundary: DEWEY_CALIBRATION_BOUNDARY_R196,
  };
}

export async function handleDeweyCalibrationR196(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/compute/dewey/r196/")) return null;
  if (url.pathname === "/api/compute/dewey/r196/representation") return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (request.method === "GET" && url.pathname === "/api/compute/dewey/r196/manifest") {
    const core = manifest();
    return json({ ...core, receiptSha256: await sha256(core) });
  }
  if (request.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET manifest", "POST evaluate|calibrate|benchmark"] }, 405);
  const body = await request.json().catch(() => ({})) as Obj;
  try {
    if (url.pathname === "/api/compute/dewey/r196/evaluate") {
      const result = await evaluateRequest(body);
      return json(result.body, result.status);
    }
    if (url.pathname === "/api/compute/dewey/r196/calibrate") {
      const rows = (Array.isArray(body.rows) ? body.rows : []).map(normalizeRow);
      return json(await calibrateRows(rows, body.options || {}, "USER_REQUEST_BODY_UNVERIFIED"));
    }
    if (url.pathname === "/api/compute/dewey/r196/benchmark") return json(await benchmark(body));
    return json({ ok: false, code: "NOT_FOUND" }, 404);
  } catch (error) {
    return json({ ok: false, code: "R196_CALIBRATION_FAILURE", error: error instanceof Error ? error.message : String(error), canonicalMutation: false, boundary: DEWEY_CALIBRATION_BOUNDARY_R196 }, 422);
  }
}

export { calibrateRows as calibrateDeweyRowsR196 };
