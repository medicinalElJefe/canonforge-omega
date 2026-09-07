import { inversePair011, pair011 } from "./deweyWaterContinuityR195";

export const DEWEY_REPRESENTATION_RELEASE_R196 = "r196-dewey-dual-rail-t12";

function finite(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function nonnegative(value: unknown): number {
  return Math.max(0, finite(value));
}

function rail(positive: number, negative: number) {
  return {
    positive,
    negative,
    net: positive - negative,
    total: positive + negative,
    opposition: Math.min(positive, negative),
  };
}

export function dualRailTransformR196(body: Record<string, any> = {}) {
  const hasRails = ["bPositive", "bNegative", "cPositive", "cNegative"].some(key => body[key] !== undefined);
  const b = finite(body.b, 0.7);
  const c = finite(body.c, 0.2);
  const bp = hasRails ? nonnegative(body.bPositive) : Math.max(b, 0);
  const bn = hasRails ? nonnegative(body.bNegative) : Math.max(-b, 0);
  const cp = hasRails ? nonnegative(body.cPositive) : Math.max(c, 0);
  const cn = hasRails ? nonnegative(body.cNegative) : Math.max(-c, 0);
  const bNet = bp - bn;
  const cNet = cp - cn;
  const inv = 1 / Math.SQRT2;
  const exact = pair011(bNet, cNet);
  const construct = rail((bp + cp) * inv, (bn + cn) * inv);
  const prune = rail((bp + cn) * inv, (bn + cp) * inv);
  const inverse = inversePair011(construct.net, prune.net);
  return {
    input: { b: rail(bp, bn), c: rail(cp, cn) },
    exactNetBasis: exact,
    rails: { construct, prune },
    railNetResidual: Math.hypot(construct.net - exact.construct, prune.net - exact.prune),
    inverseFromNet: inverse,
    inverseResidual: Math.hypot(inverse.b - bNet, inverse.c - cNet),
    cancellationEvidencePreserved:
      Math.min(bp, bn) > 0 || Math.min(cp, cn) > 0 || construct.opposition > 0 || prune.opposition > 0,
    boundary:
      "Positive and negative contributions are transported separately through the exact linear 011/01-1 transform. Their net remains the orthonormal basis result while cancellation/opposition remains observable as history. This is a representation envelope, not a new physical primitive.",
  };
}

export function t12R196(phase: number, turns: number) {
  const k = Math.trunc(finite(turns));
  const input = ((finite(phase) % 12) + 12) % 12;
  const output = ((input + k) % 12 + 12) % 12;
  const inverse = ((output - k) % 12 + 12) % 12;
  return {
    inputPhase: input,
    turns: k,
    outputPhase: output,
    inversePhase: inverse,
    reversibleError: Math.abs(inverse - input),
    boundary:
      "T12 is a reversible cyclic phase/address operator. It does not assert twelve physical dimensions and does not encode an automatic STAY/TURN/ESCALATE policy.",
  };
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
}

export async function handleDeweyRepresentationR196(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/compute/dewey/r196/representation") return null;
  if (request.method !== "POST") {
    return Response.json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["POST"] }, { status: 405 });
  }
  const body = await request.json().catch(() => ({})) as Record<string, any>;
  const core = {
    ok: true,
    schema: "OMEGA_DEWEY_DUAL_RAIL_T12_REPRESENTATION_R196",
    release: DEWEY_REPRESENTATION_RELEASE_R196,
    dualRail: dualRailTransformR196(body.rails && typeof body.rails === "object" ? { ...body, ...body.rails } : body),
    t12: t12R196(finite(body.phase), finite(body.turns)),
    canonicalMutation: false,
    physicalPrimitiveAdded: false,
  };
  return Response.json({ ...core, receiptSha256: await sha256(core) }, {
    headers: { "cache-control": "no-store", "x-omega-authority": "exact-representation-computation" },
  });
}
