import canonicalRuntime from "./heartbeatTruth";
import { handleSwarmRequest } from "./swarm/swarmRouterR169";
import { handleComputeRequest } from "./compute/computeTruthR170";
import { handleAtlasComputeRequest } from "./compute/atlasComputeR170";
import { computeLabResponse } from "./compute/computeLabR170";
import { handleValidationRequest } from "./validation/validationFabricR172";
import { validationLabResponse } from "./validation/validationLabR172";
import { handleCrossRuntimeValidationRequest } from "./validation/crossRuntimeParityR173";
import { crossRuntimeLabResponse } from "./validation/crossRuntimeLabR173";

export { OmegaRuntime } from "./heartbeatTruth";
export { OmegaSwarmCell } from "./swarm/swarmCellR169";
export { OmegaSwarmCoordinator } from "./swarm/swarmCoordinatorR169";
export { OmegaSwarmBranch, OmegaSwarmOrgan, OmegaSwarmOrganismCoordinator } from "./swarm/swarmOrganismR169";
export { OmegaSwarmAutonomicCoordinator } from "./swarm/swarmAutonomicR169";

const canonical: any = canonicalRuntime;
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/compute" || url.pathname === "/compute/") return computeLabResponse();
    if (url.pathname === "/validate" || url.pathname === "/validate/") return validationLabResponse();
    if (url.pathname === "/validate/cross-runtime" || url.pathname === "/validate/cross-runtime/") return crossRuntimeLabResponse();
    if (url.pathname.startsWith("/api/swarm/")) return handleSwarmRequest(request, env);
    if (url.pathname.startsWith("/api/validate/cross-runtime/")) return handleCrossRuntimeValidationRequest(request);
    if (url.pathname.startsWith("/api/validate/")) return handleValidationRequest(request);
    if (url.pathname.startsWith("/api/compute/atlas/")) return handleAtlasComputeRequest(request);
    if (url.pathname.startsWith("/api/compute/")) return handleComputeRequest(request);
    return canonical.fetch(request, env, ctx);
  },
};
