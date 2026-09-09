// R211 compatibility adapter: runtimeEntryR169 retains the already-reviewed additive
// import/call shape from the superseded provenance candidate while public identity moves
// forward because canonical R210 is now the sovereign proof archive.
//
// R223 uses this already-central request hook to repair only the proven live deep-path
// failures (R195 status, R190 full acceptance, R211 status). All other requests fall
// through to the preserved R211 implementation. This adds no runtime or authority owner.
import { handleOperationalProvenanceR211 } from "./operationalProvenanceFabricR211";
import { handleLiveSystemSurfaceClosureR223 } from "./liveSystemSurfaceClosureR223";

export async function handleOperationalProvenanceR210(request: Request, env: any, ctx: any, canonicalFetch: (request: Request, env: any, ctx: any) => Promise<Response>): Promise<Response | null> {
  const r223 = await handleLiveSystemSurfaceClosureR223(request, env, ctx, canonicalFetch);
  if (r223) return r223;
  return handleOperationalProvenanceR211(request, env, ctx, canonicalFetch);
}
