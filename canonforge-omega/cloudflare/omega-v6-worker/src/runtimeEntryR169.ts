import canonicalRuntime from "./heartbeatTruth";
import { handleSwarmRequest } from "./swarm/swarmRouterR169";
import { handleComputeRequest } from "./compute/computeTruthR170";

export { OmegaRuntime } from "./heartbeatTruth";
export { OmegaSwarmCell } from "./swarm/swarmCellR169";
export { OmegaSwarmCoordinator } from "./swarm/swarmCoordinatorR169";
export { OmegaSwarmBranch, OmegaSwarmOrgan, OmegaSwarmOrganismCoordinator } from "./swarm/swarmOrganismR169";
export { OmegaSwarmAutonomicCoordinator } from "./swarm/swarmAutonomicR169";

const canonical: any = canonicalRuntime;
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/swarm/")) return handleSwarmRequest(request, env);
    if (url.pathname.startsWith("/api/compute/")) return handleComputeRequest(request);
    return canonical.fetch(request, env, ctx);
  },
};
