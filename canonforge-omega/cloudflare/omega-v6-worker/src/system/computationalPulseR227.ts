export const COMPUTATIONAL_PULSE_SCHEMA_R227 = "OMEGA_COMPUTATIONAL_PULSE_R227";
export const COMPUTATIONAL_PULSE_RELEASE_R227 = "r227-proof-carrying-computational-pulse";

export type PulseOrientationR227 = -1 | 0 | 1;
export type PulseSkinR227 = 12 | 144 | 1728 | 20736 | 248832;

export interface ComputationalPulseR227 {
  schema: typeof COMPUTATIONAL_PULSE_SCHEMA_R227;
  pulseId: string;
  parentPulseId: string | null;
  sequence: number;
  address: string;
  skin: PulseSkinR227;
  orientation: PulseOrientationR227;
  phase: string;
  continuity: number;
  invariantHash: string;
  scarHash: string;
  transformId: string | null;
  priorReceiptHash: string | null;
  timestamp: string;
  classification: "DERIVED_COMPUTATIONAL_MODEL_NOT_PHYSICAL_PRIMITIVE";
}

export interface PulseTransformR227 {
  transformId: string;
  nextAddress: string;
  nextSkin: PulseSkinR227;
  nextOrientation: PulseOrientationR227;
  nextPhase: string;
  continuity: number;
  scarHash: string;
}

export interface PulseReceiptR227 {
  schema: "OMEGA_COMPUTATIONAL_PULSE_RECEIPT_R227";
  pulseId: string;
  parentPulseId: string | null;
  sequence: number;
  fromAddress: string;
  toAddress: string;
  fromSkin: PulseSkinR227;
  toSkin: PulseSkinR227;
  transformId: string;
  invariantHash: string;
  scarBefore: string;
  scarAfter: string;
  continuity: number;
  timestamp: string;
  authority: "TRACE_AND_PROOF_ONLY_NOT_CANON_MUTATION";
}

const clampContinuity = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function propagateComputationalPulseR227(
  pulse: ComputationalPulseR227,
  transform: PulseTransformR227,
  now = new Date().toISOString(),
): { pulse: ComputationalPulseR227; receipt: PulseReceiptR227 } {
  const continuity = clampContinuity(transform.continuity);
  const receipt: PulseReceiptR227 = {
    schema: "OMEGA_COMPUTATIONAL_PULSE_RECEIPT_R227",
    pulseId: pulse.pulseId,
    parentPulseId: pulse.parentPulseId,
    sequence: pulse.sequence + 1,
    fromAddress: pulse.address,
    toAddress: transform.nextAddress,
    fromSkin: pulse.skin,
    toSkin: transform.nextSkin,
    transformId: transform.transformId,
    invariantHash: pulse.invariantHash,
    scarBefore: pulse.scarHash,
    scarAfter: transform.scarHash,
    continuity,
    timestamp: now,
    authority: "TRACE_AND_PROOF_ONLY_NOT_CANON_MUTATION",
  };

  return {
    pulse: {
      ...pulse,
      sequence: receipt.sequence,
      address: transform.nextAddress,
      skin: transform.nextSkin,
      orientation: transform.nextOrientation,
      phase: transform.nextPhase,
      continuity,
      scarHash: transform.scarHash,
      transformId: transform.transformId,
      priorReceiptHash: `${pulse.pulseId}:${receipt.sequence}:${transform.transformId}:${transform.scarHash}`,
      timestamp: now,
    },
    receipt,
  };
}

export function verifyPulseContinuityR227(
  prior: ComputationalPulseR227,
  next: ComputationalPulseR227,
  receipt: PulseReceiptR227,
): boolean {
  return (
    prior.schema === COMPUTATIONAL_PULSE_SCHEMA_R227 &&
    next.schema === COMPUTATIONAL_PULSE_SCHEMA_R227 &&
    prior.pulseId === next.pulseId &&
    prior.invariantHash === next.invariantHash &&
    next.sequence === prior.sequence + 1 &&
    receipt.pulseId === prior.pulseId &&
    receipt.sequence === next.sequence &&
    receipt.fromAddress === prior.address &&
    receipt.toAddress === next.address &&
    receipt.fromSkin === prior.skin &&
    receipt.toSkin === next.skin &&
    receipt.scarBefore === prior.scarHash &&
    receipt.scarAfter === next.scarHash &&
    receipt.transformId === next.transformId &&
    receipt.authority === "TRACE_AND_PROOF_ONLY_NOT_CANON_MUTATION"
  );
}

export const COMPUTATIONAL_PULSE_BOUNDARY_R227 = {
  analogy: "Photon-like propagation is a computational analogy for discrete proof-carrying state excitation and lineage; it is not a claim that software pulses are physical photons.",
  operator: "partition -> interaction/transform -> invariant carry -> scar/residual carry -> re-contextualize -> next address",
  identityRule: "Pulse identity and invariant lineage persist across admissible transforms while state, address, skin, phase, orientation, continuity and scar may change.",
  skinRule: "12 -> 144 -> 1728 -> 20736 -> 248832 are computational address-resolution skins, not physical dimensions.",
  physicalPrimitive: false,
  canonMutationAuthority: false,
} as const;
