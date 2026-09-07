import canonicalRuntime from "./heartbeatTruth";
import { handleSwarmRequest } from "./swarm/swarmRouterR169";
import { handleWarpComputationRequest } from "./swarm/warpComputationR176";
import { warpComputationLabResponse } from "./swarm/warpComputationLabR176";
import { handleWarpBuildCandidateRequest } from "./swarm/warpBuildCandidateR178";
import { warpBuildCandidateLabResponse } from "./swarm/warpBuildCandidateLabR178";
import { handleSaiRequest, saiLabResponse } from "./sai/saiRuntimeR179";
import { handleSaiAiFusionR179 } from "./intelligence/saiAiFusionR179";
import { handleLiveAcceptanceR181 } from "./acceptance/liveAcceptanceR181";
import { handleComputeRequest } from "./compute/computeTruthR170";
import { handleAtlasComputeRequest } from "./compute/atlasComputeR170";
import { computeLabResponse } from "./compute/computeLabR170";
import { handleValidationRequest } from "./validation/validationFabricR172";
import { validationLabResponse } from "./validation/validationLabR172";
import { handleCrossRuntimeValidationRequest } from "./validation/crossRuntimeParityR173";
import { crossRuntimeLabResponse } from "./validation/crossRuntimeLabR173";
import { handleFederatedOrganRequest } from "./federation/federatedOrganFabricR174";
import { federatedOrganLabResponse } from "./federation/federatedOrganLabR174";
import { handleIndependentSolverValidationRequest } from "./validation/independentSolverR175";
import { independentSolverLabResponse } from "./validation/independentSolverLabR175";

export { OmegaRuntime } from "./heartbeatTruth";
export { OmegaSwarmCell } from "./swarm/swarmCellR169";
export { OmegaSwarmCoordinator } from "./swarm/swarmCoordinatorR169";
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

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/compute" || url.pathname === "/compute/") return computeLabResponse();
    if (url.pathname === "/warp" || url.pathname === "/warp/") return warpComputationLabResponse();
    if (url.pathname === "/warp/build" || url.pathname === "/warp/build/") return warpBuildCandidateLabResponse();
    if (url.pathname === "/sai" || url.pathname === "/sai/") return saiLabResponse();
    if (url.pathname === "/validate" || url.pathname === "/validate/") return validationLabResponse();
    if (url.pathname === "/validate/cross-runtime" || url.pathname === "/validate/cross-runtime/") return crossRuntimeLabResponse();
    if (url.pathname === "/validate/independent" || url.pathname === "/validate/independent/") return independentSolverLabResponse();
    if (url.pathname === "/federation" || url.pathname === "/federation/") return federatedOrganLabResponse();

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

    if (url.pathname.startsWith("/api/federation/r174/")) return handleFederatedOrganRequest(request, env);
    if (url.pathname.startsWith("/api/swarm/build/")) return handleWarpBuildCandidateRequest(request, env);
    if (url.pathname.startsWith("/api/swarm/warp/")) return handleWarpComputationRequest(request, env);
    if (url.pathname.startsWith("/api/swarm/")) return handleSwarmRequest(request, env);
    if (url.pathname.startsWith("/api/validate/independent/")) return handleIndependentSolverValidationRequest(request);
    if (url.pathname.startsWith("/api/validate/cross-runtime/")) return handleCrossRuntimeValidationRequest(request);
    if (url.pathname.startsWith("/api/validate/")) return handleValidationRequest(request);
    if (url.pathname.startsWith("/api/compute/atlas/")) return handleAtlasComputeRequest(request);
    if (url.pathname.startsWith("/api/compute/")) return handleComputeRequest(request);
    return canonical.fetch(request, env, ctx);
  },
};
