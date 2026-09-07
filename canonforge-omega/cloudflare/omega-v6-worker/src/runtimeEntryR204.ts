import runtime from "./runtimeEntryR169";
import { HYBRID_RETURN_ADMISSION_R204, HYBRID_RETURN_VERIFICATION_SCHEMA_R204 } from "./omegaRuntimeR204";

// R204 replaces only the historical OMEGA_RUNTIME class implementation. The entire
// R169→R203 public fetch/render/control/mission-continuity stack remains delegated.
export { OmegaRuntime } from "./omegaRuntimeR204";
export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201";
export { OmegaHybridMissionLedgerR203 } from "./system/hybridMissionLedgerR203";
export { OmegaSwarmCell } from "./swarm/swarmCellR169";
export { OmegaSwarmCoordinatorR188 as OmegaSwarmCoordinator } from "./swarm/motionCoordinatorR188";
export { OmegaSwarmBranch, OmegaSwarmOrgan, OmegaSwarmOrganismCoordinator } from "./swarm/swarmOrganismR169";
export { OmegaSwarmAutonomicCoordinator } from "./swarm/swarmAutonomicR169";

const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function manifest(env: any): Promise<Response> {
  const core = {
    ok: true,
    schema: "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204",
    release: HYBRID_RETURN_ADMISSION_R204,
    verificationSchema: HYBRID_RETURN_VERIFICATION_SCHEMA_R204,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    upstream: [
      "R200_CANONICAL_MISSION_KERNEL",
      "R201_DURABLE_MISSION_CHAIN",
      "R202_UNIFIED_CONTINUITY_POTENTIAL",
      "R203_AUTHENTICATED_HYBRID_MISSION_CONTINUITY",
      "R33_HISTORICAL_OMEGA_RUNTIME_STORAGE_IDENTITY",
    ],
    architecture: {
      publicRuntimeDelegatedThrough: "R169_TO_R203_UNCHANGED",
      durableBinding: "OMEGA_RUNTIME",
      durableClass: "OmegaRuntime",
      storageIdentityChanged: false,
      newDurableNamespaceCreated: false,
      r201EvidenceLedgerPreserved: true,
      r203HybridMissionLedgerPreserved: true,
    },
    returnLaw: [
      "AUTHENTICATED_BRIDGE",
      "EXPLICIT_BOOLEAN_OUTCOME",
      "FULL_QUEUED_STEP_LINEAGE_FOR_SUCCESS",
      "ORDERED_STEP_IDENTITY_AND_OPERATION",
      "RELATIVE_OUTPUT_CONFINEMENT",
      "SERVER_CANONICAL_SHA256_RECEIPT",
      "OPTIONAL_HOST_CANONICAL_RECEIPT_CROSS_CHECK",
      "REPLAY_CONFLICT_DETECTION",
      "VERIFIED_SUCCESS_ONLY_MISSION_COMPLETION",
    ],
    truthBoundaries: {
      authenticatedAgentIsNotHardwareAttestation: true,
      hostHashAloneIsNotAuthority: true,
      returnedIsNotVerified: true,
      verifiedReturnIsNotCanonState: true,
      verifiedReturnIsNotPromotion: true,
      verifiedFailureDoesNotCompleteMission: true,
    },
    authority: "AUTHENTICATED_EXECUTION_RETURN_EVIDENCE_NOT_CANONSTATE",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return new Response(JSON.stringify({ ...core, receiptSha256: await sha256(core) }, null, 2), { headers: HEADERS });
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/$/, "");
    if (path === "/api/system/r204/manifest" && request.method === "GET") return manifest(env);
    return runtime.fetch(request, env, ctx);
  },
};