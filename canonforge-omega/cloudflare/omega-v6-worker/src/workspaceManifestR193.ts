export const WORKSPACE_MANIFEST_R193 = {
  schema: "OMEGA_V6_R193_FULL_RESTORATION_V1",
  release: "r193-full-restoration-workspace",
  predecessor: "r192-navigation-home-repair",
  authority: "V6_CANONICAL_OPERATIONAL_RUNTIME",
  mutation: false,
  execution_claim: false,
  boundary: "R193 restores reachability and orchestration over the existing canonical runtime. It does not create a second state authority, convert model projections into measurements, or promote external PC/native solver execution without current proof.",
  canonical_sequence: [
    "OBSERVE/SENSE",
    "NORMALIZE",
    "INVENTORY/RELATE",
    "PRUNE",
    "TRANSLATE",
    "FORECAST/COMPUTE",
    "GATE/DECIDE",
    "ACT/RENDER",
    "PROVE",
    "LEDGER",
    "OBSERVE RESULT",
  ],
  woven_continuity_operator: [
    "partition",
    "exchange/transform",
    "invariant carry",
    "scar/residual carry",
    "re-contextualize/repartition",
  ],
  state_variables: {
    continuity: "CΩ",
    future_plasticity: "Φ",
    burden: "Λ",
    contradiction: "q",
    orientation: "σ ∈ {-1,0,+1}",
  },
  representation_shells: [12, 144, 1728, 20736, 248832],
  interactive_shells: [144, 1728, 20736],
  dimensional_boundary: "12→144→1728→20,736→248,832 are atlas/address resolution levels, not literal physical dimensions.",
  workspaces: [
    { id: "Field", route: "/?app=Field", purpose: "living governed field" },
    { id: "Calculus", route: "/?app=Calculus&mode=dewey-calculus", purpose: "trajectory / curvature / sensitivity" },
    { id: "Memory", route: "/?app=Memory", purpose: "continuity + scar graph" },
    { id: "Simulate", route: "/?app=Simulate", purpose: "create / branch / compare" },
    { id: "Earth", route: "/?app=Earth", purpose: "observed Earth + derived layers" },
    { id: "Assistant", route: "/?app=Assistant", purpose: "route-before-generation intelligence" },
    { id: "Hybrid", route: "/?app=Hybrid", purpose: "sovereign PC / bounded execution" },
    { id: "Proof", route: "/?app=Proof", purpose: "evidence / rollback" },
  ],
  systems: [
    ["state", "/workbench"], ["relation", "/relations"], ["forecast_calibration", "/calibration"],
    ["capabilities", "/capabilities"], ["core", "/core"], ["sai", "/sai"], ["compute", "/compute"],
    ["validation", "/validate"], ["cross_runtime", "/validate/cross-runtime"], ["independent_solver", "/validate/independent"],
    ["clouds", "/clouds"], ["warp", "/warp"], ["build", "/warp/build"], ["federation", "/federation"],
    ["evolution", "/evolution"], ["truth", "/truth"], ["convergence", "/convergence"], ["fabric", "/fabric"], ["instrument", "/instrument"],
  ],
  governed_modes: [
    ["full-overall-canon", "FULL CANON"], ["mode-188", "MODE 188"], ["unified-coherence", "COHERENCE"],
    ["forecast", "FORECAST"], ["full-sphere", "FULL SPHERE"], ["relational-skin", "SKIN"],
    ["dewey-calculus", "CALCULUS"], ["unified-recursion", "RECURSION"], ["deep-mother", "RECOVERY"],
    ["high-father", "CONSTRAINT"], ["heavy-prune", "PRUNE"], ["alpha", "ALPHA"], ["crimson", "CRIMSON"],
    ["no-nothing-truth", "TRUTH"], ["guidance-field", "GUIDANCE"],
  ],
  performance_policy: {
    navigation_status_poll_ms: 20000,
    route_model: "single canonical worker + existing specialist handlers",
    duplicate_runtime_authority: false,
    duplicate_state_authority: false,
    api_html_wrapping: false,
    client_deep_link_activation: true,
  },
} as const;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-omega-authority": "manifest-only" } });
}

export function handleWorkspaceManifestR193(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.pathname !== "/api/workspace/r193/manifest" && url.pathname !== "/api/workspace/r193/health") return null;
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  if (url.pathname.endsWith("/health")) return json({ ok: true, release: WORKSPACE_MANIFEST_R193.release, schema: WORKSPACE_MANIFEST_R193.schema, workspaces: WORKSPACE_MANIFEST_R193.workspaces.length, systems: WORKSPACE_MANIFEST_R193.systems.length, modes: WORKSPACE_MANIFEST_R193.governed_modes.length, interactive_shells: WORKSPACE_MANIFEST_R193.interactive_shells });
  return json({ ok: true, ...WORKSPACE_MANIFEST_R193 });
}
