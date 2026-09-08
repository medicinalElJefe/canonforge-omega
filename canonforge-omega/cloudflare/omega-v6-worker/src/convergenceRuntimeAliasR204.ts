import convergence from "./system/../convergence";
import { HYBRID_RETURN_ADMISSION_R204, HYBRID_RETURN_VERIFICATION_SCHEMA_R204 } from "./omegaRuntimeR204";
import { EARTH_LIVE_GEOSPATIAL_R214, handleEarthLiveGeospatialR214, enhanceEarthLiveGeospatialR214 } from "./earthLiveGeospatialR214";
import {
  HYBRID_CONTROL_PLANE_R214,
  handleHybridControlPlaneR214,
  tryLegacyHeartbeatFromDurableR214,
  migrateVerifiedLegacyHeartbeatR214,
  handleLegacyDevelopmentLeaseR214,
} from "./hybridControlPlaneR214";
import { HYBRID_LOCAL_AUTHORITY_R214 } from "./omegaRuntimeR214";

// Wrangler still aliases heartbeatTruth's exact "./convergence" import to this file.
// R214 intentionally preserves that R204 alias path and the R169 canonical entrypoint.
// New live-Earth and outbound-Hybrid behavior is additive; all other traffic delegates
// to the original convergence implementation.
export { OmegaRuntime } from "./omegaRuntimeR214";

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
      storageIdentityChanged: false,
      newDurableNamespaceCreated: false,
      r201EvidenceLedgerPreserved: true,
      r203HybridMissionLedgerPreserved: true,
      r214AdditiveControlPlane: HYBRID_CONTROL_PLANE_R214,
      r214LocalAuthority: HYBRID_LOCAL_AUTHORITY_R214,
      r214EarthLive: EARTH_LIVE_GEOSPATIAL_R214,
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
      pcOnlineIsNotExecutionAuthority: true,
      remoteBrowserMayNotGrantLocalExecutionAuthority: true,
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

    const earth = await handleEarthLiveGeospatialR214(request);
    if (earth) return earth;

    const hybrid = await handleHybridControlPlaneR214(request, env);
    if (hybrid) return hybrid;

    if (path === "/api/device/heartbeat" && request.method === "POST") {
      const durable = await tryLegacyHeartbeatFromDurableR214(request.clone(), env);
      if (durable) return durable;
      const verifiedLegacy = await convergence.fetch(request.clone(), env);
      if (!verifiedLegacy.ok) return verifiedLegacy;
      const migrated = await migrateVerifiedLegacyHeartbeatR214(request.clone(), env);
      return migrated || verifiedLegacy;
    }

    if (path === "/api/development/lease" && request.method === "POST") {
      const retiredLease = await handleLegacyDevelopmentLeaseR214(request.clone(), env);
      if (retiredLease) return retiredLease;
    }

    const response = await convergence.fetch(request, env);
    return enhanceEarthLiveGeospatialR214(response, request.url);
  },
};
