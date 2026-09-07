import { readDriveCorpusSnapshotR195 } from "./driveCorpusSnapshotR195";
import { buildResidualRestorationPlanR195, probeMenuTargetsR195 } from "./restorationPlannerR195";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

function nk(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function registryRows(snapshot: any): Record<string, any>[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const aliases = new Set(["registry", "softwareRegistry", "software_registry", "software"].map(nk));
  for (const [key, value] of Object.entries(snapshot)) {
    if (!aliases.has(nk(key))) continue;
    if (Array.isArray(value)) return value as Record<string, any>[];
    if (value && typeof value === "object" && Array.isArray((value as any).rows)) {
      return (value as any).rows as Record<string, any>[];
    }
  }
  return [];
}

export async function handleRestorationPlannerR195(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: CanonicalFetch,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/system/r195/restoration") return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  try {
    const snapshot = await readDriveCorpusSnapshotR195();
    const registry = registryRows(snapshot);
    const probes = await probeMenuTargetsR195(request, env, ctx, canonicalFetch);
    const plan = buildResidualRestorationPlanR195(registry, probes);
    const state = (url.searchParams.get("state") || "").trim();
    const disposition = (url.searchParams.get("disposition") || "").trim().toUpperCase();
    const limit = Math.min(100, Math.max(1, Math.trunc(Number(url.searchParams.get("limit") || 100) || 100)));
    const offset = Math.max(0, Math.trunc(Number(url.searchParams.get("offset") || 0) || 0));
    const selected = plan.artifacts.filter(artifact => (!state || artifact.state === state) && (!disposition || artifact.disposition === disposition));
    return json({
      ...plan,
      artifacts: selected.slice(offset, offset + limit),
      selection: { state: state || null, disposition: disposition || null, matched: selected.length, offset, limit },
    });
  } catch (error) {
    return json({
      ok: false,
      code: "R195_RESTORATION_PLANNER_FAILURE",
      error: error instanceof Error ? error.message : String(error),
      canonicalMutation: false,
    }, 500);
  }
}
