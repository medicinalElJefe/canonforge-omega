import runtime from "./runtimeEntryR169";
import { enhanceUniversalNavigationR192 } from "./universalNavigationR192";

export {
  OmegaRuntime,
  OmegaSwarmCell,
  OmegaSwarmCoordinator,
  OmegaSwarmBranch,
  OmegaSwarmOrgan,
  OmegaSwarmOrganismCoordinator,
  OmegaSwarmAutonomicCoordinator,
} from "./runtimeEntryR169";

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const response = await runtime.fetch(request, env, ctx);
    return enhanceUniversalNavigationR192(response, new URL(request.url).pathname);
  },
};
