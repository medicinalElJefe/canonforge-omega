export const RESTORATION_PLANNER_RELEASE_R195 = "r195-residual-restoration-planner";

export type MenuProofTargetR195 = {
  menuId: string;
  apiPath: string | null;
  humanPath: string | null;
  proofClass: string;
  boundary: string;
};

export type MenuProbeR195 = MenuProofTargetR195 & {
  reachable: boolean;
  status: number;
  bodyOk: boolean;
  schema: string | null;
  release: string | null;
  elapsedMs: number | null;
  error?: string;
};

const MENU_TARGETS_R195: readonly MenuProofTargetR195[] = [
  { menuId: "01 Runtime Core", apiPath: "/_omega/health", humanPath: "/core", proofClass: "LOCAL_RUNTIME_CONTRACT", boundary: "Runtime health proves the canonical runtime cohort, not every archived runtime artifact individually." },
  { menuId: "02 Proof & Governance", apiPath: "/api/acceptance/r190/manifest", humanPath: "/truth", proofClass: "PROOF_GOVERNANCE_CONTRACT", boundary: "Whole-system acceptance proves the active proof/governance organ, not all donor console versions." },
  { menuId: "03 Traversal", apiPath: "/api/compute/atlas/manifest", humanPath: "/instrument", proofClass: "ATLAS_REFERENCE_TOPOLOGY", boundary: "Reference topology is derived software topology and not literal physical dimensionality or proof of unavailable donor edge lists." },
  { menuId: "04 Render Field", apiPath: "/api/fabric/r191/manifest", humanPath: "/fabric", proofClass: "SURFACE_FABRIC_CONTRACT", boundary: "Surface-fabric reachability is not proof that every named historical GPU/native renderer is executing." },
  { menuId: "05 Host Inputs", apiPath: "/api/workspace/r194/status", humanPath: "/?app=Hybrid", proofClass: "DUAL_PLANE_EVIDENCE_BOUNDARY", boundary: "Local host contracts remain distinct from external sovereign state, camera/device evidence and authenticated PC heartbeat." },
  { menuId: "06 AI Orchestration", apiPath: "/api/intelligence/r179/manifest", humanPath: "/sai", proofClass: "AI_SAI_PROVIDER_CONTRACT", boundary: "Provider/SAI availability does not make model output CanonState and does not prove all historical AI donor packages." },
  { menuId: "07 Data / Excel Atlas", apiPath: "/api/system/r195/manifest", humanPath: "/system", proofClass: "RECOVERED_DRIVE_CORPUS", boundary: "The embedded Drive corpus is hash-verified data; it does not itself prove native Excel automation or every historical workbook executable." },
  { menuId: "08 Audio / Signal", apiPath: null, humanPath: null, proofClass: "NO_CURRENT_EXECUTION_PROOF_ROUTE", boundary: "Audio/signal artifacts remain unproved until a live state-bound audio route and receipt are admitted." },
  { menuId: "09 World / Bio / Forecast", apiPath: "/api/workspace/r194/status", humanPath: "/?app=Earth", proofClass: "OBSERVATION_BOUNDARY", boundary: "Workspace reachability does not fabricate Earth observations, biological measurements or forecast calibration evidence." },
  { menuId: "10 Recovery / Packaging", apiPath: "/api/core/replay/schema", humanPath: "/?app=Proof", proofClass: "LOCAL_REPLAY_RECOVERY_CONTRACT", boundary: "Replay/recovery schema is not proof of Windows installer, signed EXE, repair script or package execution on the sovereign PC." },
  { menuId: "11 Archive Merge", apiPath: "/api/convergence/edge", humanPath: "/convergence", proofClass: "CONVERGENCE_CONTRACT", boundary: "Archive convergence does not admit donor code without source-binding, contract, execution, weakest-link, replay and rollback proof." },
  { menuId: "12 Operator Cockpit", apiPath: "/api/workspace/r193/health", humanPath: "/", proofClass: "WORKSPACE_REACHABILITY", boundary: "Cockpit reachability proves the active workspace surface, not every historical cockpit/control-suite artifact." },
] as const;

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizedKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function rowValue(row: Record<string, any>, candidates: readonly string[]): any {
  const map = new Map(Object.entries(row).map(([key, value]) => [normalizedKey(key), value]));
  for (const candidate of candidates) {
    const value = map.get(normalizedKey(candidate));
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function targetForMenu(menuId: string): MenuProofTargetR195 | null {
  const exact = MENU_TARGETS_R195.find(target => target.menuId === menuId);
  if (exact) return exact;
  const key = normalizedKey(menuId);
  return MENU_TARGETS_R195.find(target => normalizedKey(target.menuId) === key) ?? null;
}

function requiredEvidence(disposition: string, role: string): string[] {
  const base = ["SOURCE_BOUND", "PATH_RESOLVED", "CONTRACT_DECLARED", "EXECUTED", "RETURNED", "VERIFIED", "REPLAYABLE", "ROLLBACK_DEFINED"];
  const upperRole = role.toUpperCase();
  if (upperRole.includes("RENDER") || upperRole.includes("WORLD")) base.splice(5, 0, "STATE_BOUND_RENDER_VERIFIED");
  if (upperRole.includes("DEPLOY") || upperRole.includes("PACKAGE")) base.splice(5, 0, "INSTALL_LAUNCH_HEALTH_VERIFIED");
  if (upperRole.includes("HOST") || upperRole.includes("CAMERA")) base.splice(5, 0, "CURRENT_EXTERNAL_OBSERVATION_OR_DEVICE_EVIDENCE");
  if (upperRole.includes("AI")) base.splice(5, 0, "PROVIDER_OR_MODEL_RECEIPT_AND_EVIDENCE_BOUNDARY");
  if (disposition === "DONOR") return ["DONOR_QUARANTINED", ...base, "ADMISSION_DECISION"];
  if (disposition === "MERGE") return ["MERGE_CANDIDATE", ...base, "MERGE_ADMISSION_DECISION"];
  return base;
}

export async function probeMenuTargetsR195(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: (request: Request, env: any, ctx: any) => Promise<Response>,
): Promise<MenuProbeR195[]> {
  return Promise.all(MENU_TARGETS_R195.map(async target => {
    if (!target.apiPath) {
      return { ...target, reachable: false, status: 0, bodyOk: false, schema: null, release: null, elapsedMs: null, error: "NO_CURRENT_EXECUTION_PROOF_ROUTE" };
    }
    const url = new URL(request.url);
    url.pathname = target.apiPath;
    url.search = "";
    const started = Date.now();
    try {
      const response = await canonicalFetch(new Request(url.toString(), { method: "GET", headers: { accept: "application/json" } }), env, ctx);
      const text = await response.text();
      let body: any = null;
      try { body = JSON.parse(text); } catch { body = null; }
      return {
        ...target,
        reachable: response.ok,
        status: response.status,
        bodyOk: response.ok && body?.ok !== false,
        schema: typeof body?.schema === "string" ? body.schema : null,
        release: typeof (body?.release ?? body?.revision ?? body?.build) === "string" ? String(body?.release ?? body?.revision ?? body?.build) : null,
        elapsedMs: Date.now() - started,
      };
    } catch (error) {
      return {
        ...target,
        reachable: false,
        status: 0,
        bodyOk: false,
        schema: null,
        release: null,
        elapsedMs: Date.now() - started,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));
}

export function buildResidualRestorationPlanR195(registry: Record<string, any>[], probes: MenuProbeR195[]) {
  const probeMap = new Map(probes.map(probe => [probe.menuId, probe]));
  const artifacts = registry.map((row, index) => {
    const id = normalize(rowValue(row, ["ID", "ArtifactID", "SystemID"])) || `ROW-${String(index + 1).padStart(3, "0")}`;
    const artifact = normalize(rowValue(row, ["Software / Artifact", "Software", "Artifact", "Name"]));
    const family = normalize(rowValue(row, ["Family", "Software Family"]));
    const role = normalize(rowValue(row, ["One-System Role", "Role"]));
    const menuId = normalize(rowValue(row, ["Menu ID", "Menu", "Menu Setting"]));
    const disposition = normalize(rowValue(row, ["Disposition"])).toUpperCase() || "UNSPECIFIED";
    const target = targetForMenu(menuId);
    const probe = target ? probeMap.get(target.menuId) ?? null : null;
    let state = "ARTIFACT_PROOF_REQUIRED";
    let severity = 2;
    if (disposition === "DONOR") { state = "DONOR_NOT_ADMITTED"; severity = 5; }
    else if (disposition === "MERGE") { state = "MERGE_PENDING_ADMISSION"; severity = 4; }
    else if (!target) { state = "KEEP_WITHOUT_MAPPED_PROOF_COHORT"; severity = 5; }
    else if (!probe?.bodyOk) { state = "KEEP_COHORT_ROUTE_DEGRADED"; severity = 5; }
    else { state = "KEEP_COHORT_ROUTE_VERIFIED_ARTIFACT_RECEIPT_REQUIRED"; severity = 3; }
    return {
      index,
      id,
      artifact,
      family,
      role,
      menuId,
      disposition,
      state,
      severity,
      cohort: target ? {
        menuId: target.menuId,
        apiPath: target.apiPath,
        humanPath: target.humanPath,
        proofClass: target.proofClass,
        reachable: probe?.reachable ?? false,
        bodyOk: probe?.bodyOk ?? false,
        status: probe?.status ?? 0,
        schema: probe?.schema ?? null,
        release: probe?.release ?? null,
        boundary: target.boundary,
      } : null,
      requiredEvidence: requiredEvidence(disposition, role),
      boundary: "Cohort route proof is not artifact-level restoration proof. No artifact is promoted solely because another member of its menu cohort is reachable.",
    };
  });
  artifacts.sort((a, b) => b.severity - a.severity || a.index - b.index);
  const stateCounts: Record<string, number> = {};
  for (const artifact of artifacts) stateCounts[artifact.state] = (stateCounts[artifact.state] || 0) + 1;
  const cohortReady = probes.filter(probe => probe.bodyOk).length;
  const unresolved = artifacts.filter(artifact => artifact.state !== "KEEP_COHORT_ROUTE_VERIFIED_ARTIFACT_RECEIPT_REQUIRED").length;
  return {
    ok: true,
    schema: "OMEGA_RESIDUAL_RESTORATION_PLAN_R195",
    release: RESTORATION_PLANNER_RELEASE_R195,
    totalArtifacts: artifacts.length,
    individuallyVerifiedArtifacts: 0,
    individuallyVerifiedBoundary: "R195 intentionally reports zero artifact-level admissions unless an artifact-specific execution/verification receipt exists. Cohort reachability is not upgraded into artifact proof.",
    cohortProof: {
      total: probes.length,
      ready: cohortReady,
      degradedOrUnmapped: probes.length - cohortReady,
      probes,
    },
    residual: {
      unresolved,
      stateCounts,
      weakestFirst: artifacts.slice(0, 24),
    },
    artifacts,
    admissionSequence: ["SOURCE_BIND", "INSPECT", "CONTRACT", "EXECUTE", "ALL_MODES_WHERE_APPLICABLE", "WEAKEST_LINK", "REPLAY", "ROLLBACK", "ADMIT"],
    truth: {
      archivePresenceIsNotRestoration: true,
      menuReachabilityIsNotArtifactProof: true,
      visualPresenceIsNotExecutionProof: true,
      donorNeverBecomesAuthorityWithoutAdmission: true,
    },
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}
