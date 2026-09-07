import currentRuntime from "./runtimeEntryR169";

// R201 changes only the OmegaRuntime Durable Object admission semantics.
// The complete R169→R200.1 public routing/render stack is delegated unchanged.
export { OmegaRuntime } from "./omegaRuntimeR201";
export { OmegaSwarmCell } from "./swarm/swarmCellR169";
export { OmegaSwarmCoordinatorR188 as OmegaSwarmCoordinator } from "./swarm/motionCoordinatorR188";
export { OmegaSwarmBranch, OmegaSwarmOrgan, OmegaSwarmOrganismCoordinator } from "./swarm/swarmOrganismR169";
export { OmegaSwarmAutonomicCoordinator } from "./swarm/swarmAutonomicR169";

const current: any = currentRuntime;

export default {
  fetch(request: Request, env: any, ctx: any): Promise<Response> {
    return current.fetch(request, env, ctx);
  },
};
