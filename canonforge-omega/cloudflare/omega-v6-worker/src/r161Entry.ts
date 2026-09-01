import heartbeatTruth, { OmegaRuntime } from "./heartbeatTruth";
import { enhanceIntelligenceAuthorityRuntime } from "./intelligenceAuthorityRuntime";

export { OmegaRuntime };

export default {
  async fetch(request: Request, env: Parameters<typeof heartbeatTruth.fetch>[1]): Promise<Response> {
    const response = await heartbeatTruth.fetch(request, env);
    return enhanceIntelligenceAuthorityRuntime(response);
  },
};
