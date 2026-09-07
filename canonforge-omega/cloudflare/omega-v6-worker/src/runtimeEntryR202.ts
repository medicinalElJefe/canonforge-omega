import currentRuntime from "./runtimeEntryR169";

// R202 is a narrow deployment wrapper. The entire R169→R201 public route/render
// stack remains delegated unchanged; only the historical OMEGA_RUNTIME class export
// gains stricter authenticated return admission.
export { OmegaRuntime } from "./omegaRuntimeR202";
export { OmegaRuntime as OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201";
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
