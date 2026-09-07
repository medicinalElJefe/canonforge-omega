import canonicalRuntime from "./heartbeatTruth";
import { handleSwarmRequest } from "./swarm/swarmRouterR169";
import { handleWarpComputationRequest } from "./swarm/warpComputationR176";
import { warpComputationLabResponse } from "./swarm/warpComputationLabR176";
import { handleWarpBuildCandidateRequest } from "./swarm/warpBuildCandidateR178";
import { warpBuildCandidateLabResponse } from "./swarm/warpBuildCandidateLabR178";
import { handleSuccessorGateR183 } from "./swarm/successorGateR183";
import { handleImprovementDiscoveryR184 } from "./swarm/improvementDiscoveryR184";
import { handleCloudSwarmR185 } from "./swarm/cloudSwarmR185";
import { handleSuccessorEvidenceR186 } from "./swarm/successorEvidenceR186";
import { handleSourcePatchR187 } from "./swarm/sourcePatchR187";
import { handleMotionTimeR188 } from "./swarm/motionTimeR188";
import { handleCumulativeCapabilityR189 } from "./cumulativeCapabilityR189";
import { handleSaiRequest, saiLabResponse } from "./sai/saiRuntimeR179";
import { handleSaiAiFusionR179 } from "./intelligence/saiAiFusionR179";
import { handleLiveAcceptanceR181 } from "./acceptance/liveAcceptanceR181";
import { handleWholeSystemAcceptanceR190, wholeSystemTruthR190 } from "./acceptance/wholeSystemAcceptanceR190";
import { cumulativeCapabilityManifestR190 } from "./acceptance/cumulativeCapabilityR190";
import { handleCumulativeCapabilityR191 } from "./acceptance/cumulativeCapabilityR191";
import { handleComputeRequest } from "./compute/computeTruthR170";
import { handleAtlasComputeRequest } from "./compute/atlasComputeR170";
import { computeLabResponse } from "./compute/computeLabR170";
import { handleValidationRequest } from "./validation/validationFabricR172";
import { validationLabResponse } from "./validation/validationLabR172";
import { handleCrossRuntimeValidationRequest } from "./validation/crossRuntimeParityR173";
import { crossRuntimeLabResponse } from "./validation/crossRuntimeLabR173";
import { handleFederatedOrganRequest } from "./federation/federatedOrganFabricR174";
import { federatedOrganLabResponse } from "./federation/federatedOrganLabR174";
import { handleUniversalSurfaceFabricR191 } from "./federation/universalSurfaceFabricR191";
import { handleIndependentSolverValidationRequest } from "./validation/independentSolverR175";
import { independentSolverLabResponse } from "./validation/independentSolverLabR175";
import { handleWholeInstrumentR189 } from "./wholeInstrumentR189";

export { OmegaRuntime } from "./heartbeatTruth";
export { OmegaSwarmCell } from "./swarm/swarmCellR169";
export { OmegaSwarmCoordinatorR188 as OmegaSwarmCoordinator } from "./swarm/motionCoordinatorR188";
export { OmegaSwarmBranch, OmegaSwarmOrgan, OmegaSwarmOrganismCoordinator } from "./swarm/swarmOrganismR169";
export { OmegaSwarmAutonomicCoordinator } from "./swarm/swarmAutonomicR169";

const canonical: any = canonicalRuntime;
const B059_SOVEREIGN_PATHS = new Set([
  "/api/sai/status",
  "/api/sai/verify",
  "/api/sai/query",
  "/api/sai/traverse",
]);

function b059ManifestAlias(request: Request): Request {
  const target = new URL(request.url);
  target.pathname = "/api/sai/manifest";
  return new Request(target.toString(), { method: "GET", headers: request.headers });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function runtimeFetch(request: Request, env: any, ctx: any): Promise<Response> {
  const url = new URL(request.url);

  // R191 is an additive universal surface registry. It does not create another
  // Canon authority or shadow any inherited specialized route.
  const universalSurfaceFabric = await handleUniversalSurfaceFabricR191(request, env);
  if (universalSurfaceFabric) return universalSurfaceFabric;

  const r191Canon = handleCumulativeCapabilityR191(request);
  if (r191Canon) return r191Canon;

  // R189 remains the admitted additive whole-instrument surface.
  const wholeInstrument = handleWholeInstrumentR189(request);
  if (wholeInstrument) return wholeInstrument;

  // R190 does not create another runtime. It proves the existing dispatcher and
  // exposes its capability truth through the same route authority.
  if (url.pathname === "/truth" || url.pathname === "/truth/") return wholeSystemTruthR190();
  if (url.pathname.startsWith("/api/acceptance/r190/")) {
    return handleWholeSystemAcceptanceR190(request, env, ctx, runtimeFetch);
  }

  // R190 cumulative Canon extends the immutable R189 61-group predecessor with
  // the capability-truth admission organ. It is read-only and has no promotion authority.
  if (url.pathname === "/api/canon/r190/manifest" || url.pathname === "/api/canon/r190/manifest/") {
    if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
    return json(cumulativeCapabilityManifestR190());
  }

  if (url.pathname === "/compute" || url.pathname === "/compute/") return computeLabResponse();
  if (url.pathname === "/warp" || url.pathname === "/warp/") return warpComputationLabResponse();
  if (url.pathname === "/warp/build" || url.pathname === "/warp/build/") return warpBuildCandidateLabResponse();
  if (url.pathname === "/sai" || url.pathname === "/sai/") return saiLabResponse();
  if (url.pathname === "/validate" || url.pathname === "/validate/") return validationLabResponse();
  if (url.pathname === "/validate/cross-runtime" || url.pathname === "/validate/cross-runtime/") return crossRuntimeLabResponse();
  if (url.pathname === "/validate/independent" || url.pathname === "/validate/independent/") return independentSolverLabResponse();
  if (url.pathname === "/federation" || url.pathname === "/federation/") return federatedOrganLabResponse();

  // R185 exposes the 172-cloud federation as both human-readable node links and machine surfaces.
  if (url.pathname === "/cloud" || url.pathname === "/clouds" || url.pathname.startsWith("/cloud/") || url.pathname.startsWith("/api/clouds/r185/")) {
    return handleCloudSwarmR185(request, env);
  }

  if (url.pathname.startsWith("/api/acceptance/r181/")) {
    return handleLiveAcceptanceR181(request, env, ctx, (nextRequest, nextEnv, nextCtx) => canonical.fetch(nextRequest, nextEnv, nextCtx));
  }

  // R179 provider-backed cloud SAI remains a first-class organ.
  // B059 deterministic SAI remains Sovereign authority and must not be shadowed
  // by the cloud /api/sai namespace.
  if (url.pathname === "/api/chat" || url.pathname.startsWith("/api/intelligence/r179/")) {
    return handleSaiAiFusionR179(request, env, ctx, (nextRequest, nextEnv, nextCtx) => canonical.fetch(nextRequest, nextEnv, nextCtx));
  }
  if (url.pathname === "/api/sai/b059/manifest") return canonical.fetch(b059ManifestAlias(request), env, ctx);
  if (B059_SOVEREIGN_PATHS.has(url.pathname)) return canonical.fetch(request, env, ctx);
  if (url.pathname.startsWith("/api/sai/")) return handleSaiRequest(request, env);

  // Preserve R189 accumulated capability canon unchanged as predecessor history.
  if (url.pathname.startsWith("/api/canon/r189/")) return handleCumulativeCapabilityR189(request);

  if (url.pathname.startsWith("/api/federation/r174/")) return handleFederatedOrganRequest(request, env);
  if (url.pathname.startsWith("/api/swarm/motion/r188/")) return handleMotionTimeR188(request, env);
  if (url.pathname.startsWith("/api/swarm/patch/r187/")) return handleSourcePatchR187(request, env);
  if (url.pathname.startsWith("/api/swarm/evidence/r186/")) return handleSuccessorEvidenceR186(request, env, ctx, (nextRequest, nextEnv, nextCtx) => canonical.fetch(nextRequest, nextEnv, nextCtx));
  if (url.pathname.startsWith("/api/swarm/improvement/r184/")) return handleImprovementDiscoveryR184(request);
  if (url.pathname.startsWith("/api/swarm/successor/r183/")) return handleSuccessorGateR183(request);
  if (url.pathname.startsWith("/api/swarm/build/")) return handleWarpBuildCandidateRequest(request, env);
  if (url.pathname.startsWith("/api/swarm/warp/")) return handleWarpComputationRequest(request, env);
  if (url.pathname.startsWith("/api/swarm/")) return handleSwarmRequest(request, env);
  if (url.pathname.startsWith("/api/validate/independent/")) return handleIndependentSolverValidationRequest(request);
  if (url.pathname.startsWith("/api/validate/cross-runtime/")) return handleCrossRuntimeValidationRequest(request);
  if (url.pathname.startsWith("/api/validate/")) return handleValidationRequest(request);
  if (url.pathname.startsWith("/api/compute/atlas/")) return handleAtlasComputeRequest(request);
  if (url.pathname.startsWith("/api/compute/")) return handleComputeRequest(request);
  return canonical.fetch(request, env, ctx);
}

export default { fetch: runtimeFetch };
