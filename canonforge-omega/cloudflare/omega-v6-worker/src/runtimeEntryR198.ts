import runtimeR197 from "./runtimeEntryR169";
import { handleEarthSarFusionR198, enhanceEarthSarTruthR198 } from "./earthSarTruthFusionR198";

export { OmegaRuntime } from "./runtimeEntryR169";
export { OmegaSwarmCell } from "./runtimeEntryR169";
export { OmegaSwarmCoordinator } from "./runtimeEntryR169";
export { OmegaSwarmBranch } from "./runtimeEntryR169";
export { OmegaSwarmOrgan } from "./runtimeEntryR169";
export { OmegaSwarmOrganismCoordinator } from "./runtimeEntryR169";
export { OmegaSwarmAutonomicCoordinator } from "./runtimeEntryR169";

const prior: any = runtimeR197;

async function publicFetchR198(request: Request, env: any, ctx: any): Promise<Response> {
  const sar = await handleEarthSarFusionR198(request);
  if (sar) return sar;

  const priorResponse = await prior.fetch(request, env, ctx);
  return enhanceEarthSarTruthR198(priorResponse, new URL(request.url).pathname);
}

export default { fetch: publicFetchR198 };
