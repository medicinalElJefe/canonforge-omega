import canonical from "./runtimeEntryR169";
import { handleEarthLiveGeospatialR214, enhanceEarthLiveGeospatialR214 } from "./earthLiveGeospatialR214";
import {
  handleHybridControlPlaneR214,
  tryLegacyHeartbeatFromDurableR214,
  migrateVerifiedLegacyHeartbeatR214,
  handleLegacyDevelopmentLeaseR214,
} from "./hybridControlPlaneR214";

export { OmegaRuntime } from "./omegaRuntimeR214";
export {
  OmegaMissionLedgerR201,
  OmegaHybridMissionLedgerR203,
  OmegaSwarmCell,
  OmegaSwarmCoordinator,
  OmegaSwarmBranch,
  OmegaSwarmOrgan,
  OmegaSwarmOrganismCoordinator,
  OmegaSwarmAutonomicCoordinator,
} from "./runtimeEntryR169";

async function fetchR214(request: Request, env: any, ctx: any): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");

  const earth = await handleEarthLiveGeospatialR214(request);
  if (earth) return earth;

  const hybrid = await handleHybridControlPlaneR214(request, env);
  if (hybrid) return hybrid;

  // Existing authenticated agents are migrated once through the already-proven R179
  // ingress. After that heartbeat/status use the Durable Object broker and no longer
  // depend on a Cloudflare -> PC request path. Migration does NOT grant execution.
  if (path === "/api/device/heartbeat" && request.method === "POST") {
    const durable = await tryLegacyHeartbeatFromDurableR214(request.clone(), env);
    if (durable) return durable;
    const verifiedLegacy = await canonical.fetch(request.clone(), env, ctx);
    if (!verifiedLegacy.ok) return verifiedLegacy;
    const migrated = await migrateVerifiedLegacyHeartbeatR214(request.clone(), env);
    return migrated || verifiedLegacy;
  }

  if (path === "/api/development/lease" && request.method === "POST") {
    const retiredLease = await handleLegacyDevelopmentLeaseR214(request.clone(), env);
    if (retiredLease) return retiredLease;
  }

  const response = await canonical.fetch(request, env, ctx);
  return enhanceEarthLiveGeospatialR214(response, request.url);
}

export default { fetch: fetchR214 };
