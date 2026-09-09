export const PROBE_BUDGET_RELEASE_R223 = "r223-recursive-probe-budget";
export const PROBE_BUDGET_SCHEMA_R223 = "OMEGA_RECURSIVE_PROBE_BUDGET_R223";

export type CanonicalFetchR223Budgeted = (request: Request, env: any, ctx: any) => Promise<Response>;

const DEPTH_HEADER = "x-omega-r223-probe-depth";
const BUDGET_HEADER = "x-omega-r223-probe-budget";
const ROOT_HEADER = "x-omega-r223-probe-root";
const DEFAULT_BUDGET = 64;
const MAX_DEPTH = 6;

function integerHeader(request: Request, name: string, fallback: number): number {
  const parsed = Number.parseInt(request.headers.get(name) || "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function json(value: unknown, status: number): Response {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-probe-budget": PROBE_BUDGET_RELEASE_R223,
    },
  });
}

function blocked(reason: "DEPTH_EXHAUSTED" | "BUDGET_EXHAUSTED", root: string, depth: number, remaining: number, target: string): Response {
  return json({
    ok: false,
    schema: PROBE_BUDGET_SCHEMA_R223,
    release: PROBE_BUDGET_RELEASE_R223,
    code: "BLOCKED_RESOURCE_BUDGET_R223",
    state: "BLOCKED_RESOURCE_BUDGET",
    reason,
    root,
    depth,
    remaining,
    target,
    policy: {
      maxDepth: MAX_DEPTH,
      initialBudget: DEFAULT_BUDGET,
      nestedBurstFanoutProhibited: true,
      platformTerminationIsNotAcceptedAsDiagnostic: true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  }, 429);
}

export function createProbeBudgetFetchR223(parentRequest: Request, next: CanonicalFetchR223Budgeted): CanonicalFetchR223Budgeted {
  const inheritedDepth = integerHeader(parentRequest, DEPTH_HEADER, 0);
  let remaining = integerHeader(parentRequest, BUDGET_HEADER, DEFAULT_BUDGET);
  const root = parentRequest.headers.get(ROOT_HEADER) || `${new URL(parentRequest.url).pathname}:${Date.now().toString(36)}`;

  return async (request: Request, env: any, ctx: any): Promise<Response> => {
    const nextDepth = inheritedDepth + 1;
    const target = new URL(request.url).pathname;
    if (nextDepth > MAX_DEPTH) return blocked("DEPTH_EXHAUSTED", root, nextDepth, remaining, target);
    if (remaining <= 0) return blocked("BUDGET_EXHAUSTED", root, nextDepth, remaining, target);

    remaining -= 1;
    const headers = new Headers(request.headers);
    headers.set(DEPTH_HEADER, String(nextDepth));
    headers.set(BUDGET_HEADER, String(remaining));
    headers.set(ROOT_HEADER, root);
    headers.set("x-omega-r223-probe-policy", PROBE_BUDGET_RELEASE_R223);

    return next(new Request(request, { headers }), env, ctx);
  };
}

export function probeBudgetStateR223(request: Request) {
  return {
    schema: PROBE_BUDGET_SCHEMA_R223,
    release: PROBE_BUDGET_RELEASE_R223,
    depth: integerHeader(request, DEPTH_HEADER, 0),
    remaining: integerHeader(request, BUDGET_HEADER, DEFAULT_BUDGET),
    root: request.headers.get(ROOT_HEADER) || null,
    maxDepth: MAX_DEPTH,
    initialBudget: DEFAULT_BUDGET,
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}
