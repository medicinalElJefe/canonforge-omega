import runtime from "./runtimeEntryR169";
import { HYBRID_RETURN_ADMISSION_R203, HYBRID_RETURN_VERIFICATION_SCHEMA_R203 } from "./omegaRuntimeR203";

// R203 changes only the historical OMEGA_RUNTIME class implementation. The complete
// R169→R202 public fetch/render/control stack remains delegated unchanged.
export { OmegaRuntime } from "./omegaRuntimeR203";
export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201";
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

async function r203Manifest(env: any): Promise<Response> {
  const core = {
    ok: true,
    schema: "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R203",
    release: HYBRID_RETURN_ADMISSION_R203,
    verificationSchema: HYBRID_RETURN_VERIFICATION_SCHEMA_R203,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    architecture: {
      publicRuntimeDelegatedThrough: "R169_TO_R202_UNCHANGED",
      durableBinding: "OMEGA_RUNTIME",
      durableClass: "OmegaRuntime",
      storageIdentityChanged: false,
      newDurableNamespaceCreated: false,
      r201EvidenceLedgerPreserved: true,
      r202ContinuityPotentialPreserved: true,
    },
    returnLaw: [
      "AUTHENTICATED_BRIDGE",
      "EXPLICIT_OUTCOME",
      "FULL_STEP_LINEAGE_FOR_SUCCESS",
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
      failedReturnCanBeVerifiedAsFailureWithoutCompletingMission: true,
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
    if (path === "/api/system/r203/manifest" && request.method === "GET") return r203Manifest(env);
    return runtime.fetch(request, env, ctx);
  },
};