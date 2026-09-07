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
import { handleSourceGroundingR197, sourceGroundedQueryR197 } from "./sai/sourceGroundingR197";
import { handleSaiAiFusionR179 } from "./intelligence/saiAiFusionR179";
import { handleLiveAcceptanceR181 } from "./acceptance/liveAcceptanceR181";
import { handleWholeSystemAcceptanceR190, wholeSystemTruthR190 } from "./acceptance/wholeSystemAcceptanceR190";
import { cumulativeCapabilityManifestR190 } from "./acceptance/cumulativeCapabilityR190";
import { handleCumulativeCapabilityR191 } from "./acceptance/cumulativeCapabilityR191";
import { handleCumulativeCapabilityR195 } from "./acceptance/cumulativeCapabilityR195";
import { handleDriveCorpusSystemR195 } from "./system/driveCorpusSystemR195";
import { handleRestorationPlannerR195 } from "./system/restorationRouteR195";
import { handleComputeRequest } from "./compute/computeTruthR170";
import { handleAtlasComputeRequest } from "./compute/atlasComputeR170";
import { handleDeweyWaterContinuityR195 } from "./compute/deweyWaterContinuityR195";
import { handleDeweyCalibrationR196 } from "./compute/deweyCalibrationR196";
import { handleDeweyCalibrationGuardR196 } from "./compute/deweyCalibrationGuardR196";
import { handleDeweyRepresentationR196 } from "./compute/deweyRepresentationR196";
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
import { enhanceUniversalNavigationR192 } from "./universalNavigationR192";
import { enhanceUniversalWorkspaceR193 } from "./universalWorkspaceR193";
import { handleWorkspaceManifestR193 } from "./workspaceManifestR193";
import { enhanceEvidencePlaneR194, handleEvidencePlaneR194 } from "./evidencePlaneR194";
import { enhanceDeweyComputeSurfaceR195 } from "./deweyComputeSurfaceR195";
import { enhanceDeweyCalibrationSurfaceR196 } from "./deweyCalibrationSurfaceR196";
import { enhanceOneSystemNavigationR195 } from "./system/oneSystemNavigationR195";
import { handleEarthSarFusionR198 } from "./earthSarTruthFusionR198";
import { enhanceEarthSarIntegratedRepairR198_1 } from "./earthSarIntegratedRepairR198_1";
import { enhanceEarthSarVisualContextR198_2 } from "./earthSarVisualContextR198_2";

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

  const earthSarR198 = await handleEarthSarFusionR198(request);
  if (earthSarR198) return earthSarR198;

  const restorationPlanner = await handleRestorationPlannerR195(request, env, ctx, runtimeFetch);
  if (restorationPlanner) return restorationPlanner;

  const driveCorpusSystem = await handleDriveCorpusSystemR195(request, env, ctx, runtimeFetch);
  if (driveCorpusSystem) return driveCorpusSystem;

  const sourceGrounding = await handleSourceGroundingR197(request, env, ctx, runtimeFetch);
  if (sourceGrounding) return sourceGrounding;

  const r195Canon = handleCumulativeCapabilityR195(request);
  if (r195Canon) return r195Canon;

  const deweyCalibrationGuard = await handleDeweyCalibrationGuardR196(request);
  if (deweyCalibrationGuard) return deweyCalibrationGuard;

  const deweyRepresentation = await handleDeweyRepresentationR196(request);
  if (deweyRepresentation) return deweyRepresentation;

  const deweyCalibration = await handleDeweyCalibrationR196(request);
  if (deweyCalibration) return deweyCalibration;

  const deweyCompute = await handleDeweyWaterContinuityR195(request);
  if (deweyCompute) return deweyCompute;

  const evidencePlane = await handleEvidencePlaneR194(request, env, ctx, runtimeFetch);
  if (evidencePlane) return evidencePlane;

  const workspaceManifest = handleWorkspaceManifestR193(request);
  if (workspaceManifest) return workspaceManifest;

  const universalSurfaceFabric = await handleUniversalSurfaceFabricR191(request, env);
  if (universalSurfaceFabric) return universalSurfaceFabric;

  const r191Canon = handleCumulativeCapabilityR191(request);
  if (r191Canon) return r191Canon;

  const wholeInstrument = handleWholeInstrumentR189(request);
  if (wholeInstrument) return wholeInstrument;

  if (url.pathname === "/truth" || url.pathname === "/truth/") return wholeSystemTruthR190();
  if (url.pathname.startsWith("/api/acceptance/r190/")) {
    return handleWholeSystemAcceptanceR190(request, env, ctx, runtimeFetch);
  }

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

  if (url.pathname === "/cloud" || url.pathname === "/clouds" || url.pathname.startsWith("/cloud/") || url.pathname.startsWith("/api/clouds/r185/")) {
    return handleCloudSwarmR185(request, env);
  }

  if (url.pathname.startsWith("/api/acceptance/r181/")) {
    return handleLiveAcceptanceR181(request, env, ctx, (nextRequest, nextEnv, nextCtx) => canonical.fetch(nextRequest, nextEnv, nextCtx));
  }

  if (url.pathname === "/api/chat" || url.pathname.startsWith("/api/intelligence/r179/")) {
    return handleSaiAiFusionR179(request, env, ctx, (nextRequest, nextEnv, nextCtx) => canonical.fetch(nextRequest, nextEnv, nextCtx));
  }
  if (url.pathname === "/api/sai/b059/manifest") return canonical.fetch(b059ManifestAlias(request), env, ctx);
  if (url.pathname === "/api/sai/query") {
    const fallbackRequest = request.clone();
    const b059 = await canonical.fetch(request, env, ctx);
    if (b059.status !== 503) return b059;
    return sourceGroundedQueryR197(fallbackRequest, env, ctx, runtimeFetch, b059.status);
  }
  if (B059_SOVEREIGN_PATHS.has(url.pathname)) return canonical.fetch(request, env, ctx);
  if (url.pathname.startsWith("/api/sai/")) return handleSaiRequest(request, env);

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

async function publicFetch(request: Request, env: any, ctx: any): Promise<Response> {
  const response = await runtimeFetch(request, env, ctx);
  const r192 = await enhanceUniversalNavigationR192(response, new URL(request.url).pathname);
  const r193 = await enhanceUniversalWorkspaceR193(r192, new URL(request.url).pathname);
  const r194 = await enhanceEvidencePlaneR194(r193, new URL(request.url).pathname);
  const dewey = await enhanceDeweyComputeSurfaceR195(r194, new URL(request.url).pathname);
  const calibrated = await enhanceDeweyCalibrationSurfaceR196(dewey, new URL(request.url).pathname);

  const requestUrl = new URL(request.url);
  const earthApp = (requestUrl.searchParams.get("app") || "").toLowerCase() === "earth" || requestUrl.pathname === "/earth" || requestUrl.pathname.startsWith("/earth/");
  if (earthApp) {
    const earthBase = calibrated !== dewey ? calibrated : dewey;
    const oneSystemEarth = await enhanceOneSystemNavigationR195(earthBase, new URL(request.url).pathname);
    const nativeSarEarth = await enhanceEarthSarIntegratedRepairR198_1(oneSystemEarth, request.url);
    return enhanceEarthSarVisualContextR198_2(nativeSarEarth, request.url);
  }

  if (calibrated !== dewey) return enhanceOneSystemNavigationR195(calibrated, new URL(request.url).pathname);
  return enhanceOneSystemNavigationR195(dewey, new URL(request.url).pathname);
}

export default { fetch: publicFetch };
