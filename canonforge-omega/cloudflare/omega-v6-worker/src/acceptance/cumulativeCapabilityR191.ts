import { cumulativeCapabilityManifestR190 } from "./cumulativeCapabilityR190";

export const CUMULATIVE_SCHEMA_R191 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R191";
export const CUMULATIVE_REVISION_R191 = "R191";

export const R191_CURRENT_ORGANS = [
  {
    id: "R191_UNIVERSAL_SURFACE_FABRIC",
    name: "Universal surface registry, live reachability truth, authority separation and deploy-ready Vercel mirror",
    revision: "R191",
    artifacts: [
      "cloudflare/omega-v6-worker/src/federation/universalSurfaceFabricR191.ts",
      "vercel/omega-r191-universal-surface/index.html",
      "vercel/omega-r191-universal-surface/vercel.json",
      "tests/test_r191_universal_surface_fabric.py",
      ".github/workflows/omega-v6-r191-universal-surface-proof.yml",
    ],
    invariant: "Every surface must expose role, authority, reachability and promotion-control truth; reachable does not imply writable and protected external targets cannot be claimed promoted without verified project write access.",
  },
] as const;

export function cumulativeCapabilityManifestR191() {
  const predecessor = cumulativeCapabilityManifestR190();
  return {
    ok: predecessor.complete === true,
    schema: CUMULATIVE_SCHEMA_R191,
    revision: CUMULATIVE_REVISION_R191,
    predecessorSchema: predecessor.schema,
    predecessorRevision: predecessor.revision,
    predecessorCapabilityGroups: predecessor.totalCapabilityGroups,
    baseFamilyCount: predecessor.baseFamilyCount,
    inheritedR189ExtensionOrganCount: predecessor.inheritedExtensionOrganCount,
    inheritedR190OrganCount: predecessor.currentOrganCount,
    currentOrganCount: R191_CURRENT_ORGANS.length,
    totalCapabilityGroups: predecessor.totalCapabilityGroups + R191_CURRENT_ORGANS.length,
    inheritedBaseFamilies: predecessor.inheritedBaseFamilies,
    inheritedR189ExtensionOrgans: predecessor.inheritedExtensionOrgans,
    inheritedR190Organs: predecessor.currentOrgans,
    currentOrgans: R191_CURRENT_ORGANS,
    executionRegimes: predecessor.executionRegimes,
    law: {
      ...predecessor.law,
      r191: "ADD_UNIVERSAL_SURFACE_FABRIC_WITHOUT_REBRANDING_OR_FLATTENING_EXISTING_SURFACES",
      currentCanon: "R189_61_GROUP_PREDECESSOR_PLUS_R190_TRUTH_ORGAN_PLUS_R191_SURFACE_FABRIC",
      surfaceTruth: "REACHABILITY_WRITE_AUTHORITY_EXECUTION_PROOF_AND_PROMOTION_AUTHORITY_ARE_DISTINCT",
      protectedTarget: "EXTERNAL_PROJECT_WRITE_ACCESS_REQUIRED_BEFORE_SAME_URL_PROMOTION",
    },
    complete:
      predecessor.complete === true &&
      predecessor.totalCapabilityGroups === 62 &&
      predecessor.predecessorCapabilityGroups === 61 &&
      R191_CURRENT_ORGANS.length === 1,
    authority: "READ_ONLY_CUMULATIVE_CAPABILITY_TRUTH_FOR_R191_SURFACE_CONVERGENCE",
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}

export function handleCumulativeCapabilityR191(request: Request): Response | null {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (!path.startsWith("/api/canon/r191")) return null;
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, null, 2), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
  if (path === "/api/canon/r191/manifest") {
    return new Response(JSON.stringify(cumulativeCapabilityManifestR191(), null, 2), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
  return new Response(JSON.stringify({
    ok: false,
    code: "R191_CANON_ROUTE_NOT_FOUND",
    routes: ["/api/canon/r191/manifest"],
    canonicalMutation: false,
  }, null, 2), {
    status: 404,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
