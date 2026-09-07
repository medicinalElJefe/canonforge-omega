import { reconstituteOneSystemR199, ONE_SYSTEM_CORRELATION_RELEASE_R199 } from "./oneSystemCorrelationR199";

// Historical release identity is retained for preservation tests and cumulative canon.
export const ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system";

/**
 * R199 changes the role of this boundary from "add ONE SYSTEM to the R193 rail"
 * to "make the one-system operator shell the sole visible global navigation".
 *
 * R192/R193/R194/R195/R196 remain upstream donor/restoration layers so their
 * capabilities and domain content are preserved. R199 suppresses their competing
 * global chrome and projects them through one 12-function operator boundary.
 * Specialist engines remain authoritative for their own execution; presentation
 * is not allowed to fabricate VERIFIED state or a second HostState/CanonState.
 */
export async function enhanceOneSystemNavigationR195(response: Response, pathname: string): Promise<Response> {
  const correlated = await reconstituteOneSystemR199(response, pathname);
  const headers = new Headers(correlated.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-one-system", ONE_SYSTEM_NAVIGATION_RELEASE_R195);
  headers.set("x-omega-one-system-correlation", ONE_SYSTEM_CORRELATION_RELEASE_R199);
  return new Response(await correlated.arrayBuffer(), {
    status: correlated.status,
    statusText: correlated.statusText,
    headers,
  });
}
