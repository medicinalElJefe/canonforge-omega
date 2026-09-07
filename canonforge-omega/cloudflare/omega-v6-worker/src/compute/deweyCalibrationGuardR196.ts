import { handleDeweyCalibrationR196 } from "./deweyCalibrationR196";

export const DEWEY_CALIBRATION_GUARD_RELEASE_R196 = "r196-calibration-leakage-guard";

type Obj = Record<string, any>;

function finite(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

function error(code: string, detail?: unknown): Response {
  return Response.json({
    ok: false,
    schema: "OMEGA_DEWEY_CALIBRATION_GUARD_R196",
    release: DEWEY_CALIBRATION_GUARD_RELEASE_R196,
    code,
    detail: detail ?? null,
    canonicalMutation: false,
    promotionAuthorized: false,
  }, { status: 422, headers: { "cache-control": "no-store", "x-omega-authority": "calibration-input-guard" } });
}

function rowGroup(row: Obj, index: number): string {
  return String(row.group ?? row.series ?? row.subject ?? row.id ?? `row-${index + 1}`);
}

function rowTime(row: Obj): number | null {
  const raw = row.observedAt ?? row.observed_at ?? row.time;
  if (!raw) return null;
  const time = Date.parse(String(raw));
  return Number.isFinite(time) ? time : null;
}

function receiptClaimIsSha256(row: Obj): boolean {
  const raw = row.sourceReceiptSha256 ?? row.receipt_sha256;
  if (!raw) return false;
  return /^[a-f0-9]{64}$/i.test(String(raw));
}

export async function handleDeweyCalibrationGuardR196(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/compute/dewey/r196/calibrate" || request.method !== "POST") return null;
  const body = await request.json().catch(() => ({})) as Obj;
  const rows = Array.isArray(body.rows) ? body.rows.filter(row => row && typeof row === "object") as Obj[] : [];
  if (rows.length < 4) return error("MINIMUM_4_ROWS_REQUIRED_FOR_CALIBRATION_AND_HOLDOUT");
  if (rows.length > 96) return error("MAXIMUM_96_ROWS_PER_WORKER_CALIBRATION_REQUEST");

  const groups = new Set(rows.map(rowGroup));
  if (groups.size < 2) return error("MINIMUM_2_INDEPENDENT_GROUPS_REQUIRED_FOR_HOLDOUT", { groups: [...groups] });

  const splitPolicy = String(body.options?.splitPolicy || "hash").toLowerCase();
  let temporalInputValidated = true;
  if (splitPolicy === "temporal") {
    const invalid = rows.map((row, index) => ({ id: String(row.id ?? `row-${index + 1}`), time: rowTime(row) })).filter(row => row.time === null);
    temporalInputValidated = invalid.length === 0;
    if (invalid.length) return error("TEMPORAL_SPLIT_REQUIRES_VALID_OBSERVED_AT", invalid.map(row => row.id));
  }

  const measuredRows = rows.filter(row => String(row.evidenceClass ?? row.evidence_class ?? "").toUpperCase() === "MEASURED");
  const measuredWithoutProvenance = measuredRows.filter(row => !String(row.provenance ?? "").trim());
  if (measuredWithoutProvenance.length) {
    return error("MEASURED_ROWS_REQUIRE_PROVENANCE", measuredWithoutProvenance.map((row, index) => String(row.id ?? `measured-${index + 1}`)));
  }

  // Validate receipt formatting without promoting request-body claims into server verification.
  const measuredWithInvalidReceipt = measuredRows.filter(row => {
    const claim = row.sourceReceiptSha256 ?? row.receipt_sha256;
    return claim !== undefined && claim !== null && claim !== "" && !receiptClaimIsSha256(row);
  });
  if (measuredWithInvalidReceipt.length) return error("MEASURED_RECEIPT_CLAIM_MUST_BE_SHA256");

  const holdoutFraction = finite(body.options?.holdoutFraction, 0.25);
  if (!(holdoutFraction >= 0.1 && holdoutFraction <= 0.5)) return error("HOLDOUT_FRACTION_MUST_BE_0_1_TO_0_5");

  const forwarded = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(body),
  });
  const response = await handleDeweyCalibrationR196(forwarded);
  if (!response) return error("R196_CALIBRATION_HANDLER_UNAVAILABLE");
  const text = await response.text();
  let result: Obj;
  try { result = JSON.parse(text); } catch { return new Response(text, { status: response.status, headers: response.headers }); }

  const calibrationReceiptSha256 = typeof result?.receiptSha256 === "string" ? result.receiptSha256 : null;
  if (result?.comparison && result?.candidate?.holdout && result?.candidate?.train) {
    result.comparison.generalizationGap =
      Number(result.candidate.holdout.dataLoss) - Number(result.candidate.train.dataLoss);
    result.comparison.generalizationGapDefinition = "candidate_holdout_data_loss - candidate_train_data_loss";
  }
  delete result.receiptSha256;
  result.guard = {
    release: DEWEY_CALIBRATION_GUARD_RELEASE_R196,
    independentGroups: groups.size,
    temporalInputValidated,
    requestBodyMeasurementClaimsAreNotServerAuthentication: true,
    holdoutMustRemainSelectionIndependent: true,
  };
  result.canonicalMutation = false;
  result.receiptChain = {
    calibrationReceiptSha256,
    guardedEnvelope: "OMEGA_DEWEY_CALIBRATION_GUARD_R196",
    parentReceiptPreserved: Boolean(calibrationReceiptSha256),
    receiptScope: "guarded-result-with-parent-calibration-receipt",
  };
  const guardedReceiptSha256 = await sha256(result);
  return Response.json({
    ...result,
    receiptSha256: guardedReceiptSha256,
    receiptChain: { ...result.receiptChain, guardedReceiptSha256 },
  }, {
    status: response.status,
    headers: { "cache-control": "no-store", "x-omega-authority": "guarded-calibration-candidate-computation" },
  });
}
