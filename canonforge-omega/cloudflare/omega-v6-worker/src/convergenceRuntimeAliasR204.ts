import convergence from "./system/../convergence";
import { HYBRID_RETURN_ADMISSION_R204, HYBRID_RETURN_VERIFICATION_SCHEMA_R204 } from "./omegaRuntimeR204";
import { handleHybridControlPlaneR222 } from "./hybridControlPlaneR222";
import { HYBRID_OUTBOUND_R222 } from "./omegaRuntimeR222";

// Wrangler aliases heartbeatTruth's exact "./convergence" import to this module.
// The alternate spelling above resolves the preserved original convergence module
// without re-entering the alias. Default behavior remains the canonical convergence
// implementation. R222 is additive: it reuses the exact OMEGA_RUNTIME namespace and
// intercepts only the Hybrid/development bootstrap/control routes before delegating.
// Historical compatibility marker: export { OmegaRuntime } from "./omegaRuntimeR204";
export { OmegaRuntime } from "./omegaRuntimeR222";

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
      canonicalEntrypoint: "src/runtimeEntryR169.ts",
      heartbeatImportAlias: "./convergence",
      aliasTarget: "src/convergenceRuntimeAliasR204.ts",
      underlyingConvergencePreserved: true,
      durableBinding: "OMEGA_RUNTIME",
      durableClass: "OmegaRuntime",
      durableSingleton: "OMEGA_RUNTIME",
      storageIdentityChanged: false,
      newDurableNamespaceCreated: false,
      r201EvidenceLedgerPreserved: true,
      r203HybridMissionLedgerPreserved: true,
      r222OutboundHybrid: HYBRID_OUTBOUND_R222,
      r222InboundPcGatewayRequired: false,
      r222LocalExecutionAuthorityRequired: true,
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
      heartbeatIsNotExecutionAuthority: true,
      publicBrowserMayGrantNativeExecution: false,
    },
    authority: "AUTHENTICATED_EXECUTION_RETURN_EVIDENCE_NOT_CANONSTATE",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return new Response(JSON.stringify({ ...core, receiptSha256: await sha256(core) }, null, 2), { headers: HEADERS });
}

export default {
  async fetch(request: Request, env: any, ctx?: any): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/$/, "");
    if (path === "/api/system/r204/manifest" && request.method === "GET") return manifest(env);
    const hybrid = await handleHybridControlPlaneR222(request, env);
    if (hybrid) return hybrid;
    return convergence.fetch(request, env, ctx);
  },
};
