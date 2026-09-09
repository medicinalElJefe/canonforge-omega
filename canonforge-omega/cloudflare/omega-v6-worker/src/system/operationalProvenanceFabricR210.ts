// R211 compatibility adapter: runtimeEntryR169 retains the already-reviewed additive
// import/call shape from the superseded provenance candidate while public identity moves
// forward because canonical R210 is now the sovereign proof archive.
//
// R223 uses this already-central request hook to repair proven recursive-resource and
// readiness-coupling defects before their predecessor owners run. It does not create a
// second runtime or authority plane: unclaimed requests still fall through to R211.
import { handleOperationalProvenanceR211 } from "./operationalProvenanceFabricR211";
import { handleLiveSystemSurfaceClosureR223 } from "./liveSystemSurfaceClosureR223";
import { handleCapabilityAdmissionR223 } from "./capabilityAdmissionR223";

export async function handleOperationalProvenanceR210(request: Request, env: any, ctx: any, canonicalFetch: (request: Request, env: any, ctx: any) => Promise<Response>): Promise<Response | null> {
  const capabilityScoped = await handleCapabilityAdmissionR223(request, env, ctx, canonicalFetch);
  if (capabilityScoped) return capabilityScoped;
  const r223 = await handleLiveSystemSurfaceClosureR223(request, env, ctx, canonicalFetch);
  if (r223) return r223;
  return handleOperationalProvenanceR211(request, env, ctx, canonicalFetch);
}
