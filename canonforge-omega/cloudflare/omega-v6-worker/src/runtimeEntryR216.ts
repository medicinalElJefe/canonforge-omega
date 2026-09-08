import runtimeR169 from "./runtimeEntryR169";
import { enhanceSurfaceBindingIntegrityR216 } from "./surfaceBindingIntegrityR216";

// Preserve every Durable Object/class export from the canonical R169 composition.
export * from "./runtimeEntryR169";

const canonicalR169: any = runtimeR169;

async function fetchR216(request: Request, env: any, ctx: any): Promise<Response> {
  const response = await canonicalR169.fetch(request, env, ctx);
  return enhanceSurfaceBindingIntegrityR216(response, env?.CANONICAL_GIT_SHA ?? null);
}

// R216 is an outer admission interlock only. It does not replace R169 execution authority,
// create a second runtime, mutate CanonState, or infer host/solver/cloud execution.
export default { fetch: fetchR216 };
