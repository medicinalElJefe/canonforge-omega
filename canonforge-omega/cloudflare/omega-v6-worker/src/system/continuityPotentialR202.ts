export const CONTINUITY_POTENTIAL_RELEASE_R202 = "r202-unified-continuity-potential";
export const CONTINUITY_POTENTIAL_SCHEMA_R202 = "OMEGA_UNIFIED_CONTINUITY_POTENTIAL_R202";

type CanonicalFetch = (request: Request, env: any, ctx: any) => Promise<Response>;
type AnyObj = Record<string, any>;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization,x-omega-bridge-secret",
};

const MENU_MODE_GUIDANCE: Record<string, readonly string[]> = {
  "01 Runtime Core": ["FULL_OVERALL_CANON", "NO_NOTHING_TRUTH", "PROOF_ADMISSION", "WOVEN_CONTINUITY"],
  "02 Proof & Governance": ["HIGH_FATHER", "NO_NOTHING_TRUTH", "PROOF_ADMISSION", "HEAVY_PRUNE"],
  "03 Traversal": ["TRAVERSAL", "DIMENSIONAL_RELATIVITY", "MOTION_RELATIVITY", "WOVEN_CONTINUITY"],
  "04 Render Field": ["UNIFIED_COHERENCE", "WOVEN_CONTINUITY", "DIMENSIONAL_RELATIVITY", "SOURCE_GROUNDING"],
  "05 Host Inputs": ["HYBRID", "SOURCE_GROUNDING", "MOTION_RELATIVITY", "PROOF_ADMISSION"],
  "06 AI Orchestration": ["AI_SAI", "SOURCE_GROUNDING", "GUIDANCE_FIELD", "PROOF_ADMISSION"],
  "07 Data / Excel Atlas": ["MODE_188", "RSC", "GUIDANCE_FIELD", "SOURCE_GROUNDING"],
  "08 Audio / Signal": ["RECOVERY", "BUILD_OUT", "SOURCE_GROUNDING", "PROOF_ADMISSION"],
  "09 World / Bio / Forecast": ["EARTH_OBSERVATION", "FORECAST", "DIMENSIONAL_RELATIVITY", "SOURCE_GROUNDING"],
  "10 Recovery / Packaging": ["RECOVERY", "HEAVY_PRUNE", "CRIMSON", "BUILD_OUT"],
  "11 Archive Merge": ["HYBRID", "RECOVERY", "HEAVY_PRUNE", "SOURCE_GROUNDING"],
  "12 Operator Cockpit": ["FULL_SPHERE", "FULL_OVERALL_CANON", "GUIDANCE_FIELD", "UNIFIED_COHERENCE"],
};

const INTENT_MENU_TERMS: Record<string, readonly string[]> = {
  "01 Runtime Core": ["runtime", "kernel", "state", "hoststate", "canonstate", "service"],
  "02 Proof & Governance": ["proof", "verify", "truth", "canon", "admission", "receipt", "governance"],
  "03 Traversal": ["traversal", "atlas", "relativity", "motion", "continuity", "calculus", "optical", "rcwa", "fdtd"],
  "04 Render Field": ["render", "visual", "field", "canvas", "webgpu", "display", "skin"],
  "05 Host Inputs": ["host", "pc", "device", "heartbeat", "camera", "windows", "desktop", "hybrid"],
  "06 AI Orchestration": ["ai", "sai", "agent", "reason", "research", "orchestration", "swarm"],
  "07 Data / Excel Atlas": ["drive", "excel", "workbook", "data", "corpus", "atlas", "csv", "ledger"],
  "08 Audio / Signal": ["audio", "signal", "sound", "soma", "sonification", "music"],
  "09 World / Bio / Forecast": ["earth", "sar", "sentinel", "nisar", "world", "bio", "forecast", "satellite", "terrain"],
  "10 Recovery / Packaging": ["repair", "recovery", "restore", "package", "installer", "deploy", "patch", "rollback"],
  "11 Archive Merge": ["archive", "donor", "merge", "hybrid", "recovery board", "import", "converge"],
  "12 Operator Cockpit": ["cockpit", "operator", "menu", "control", "workspace", "ui", "navigation"],
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: HEADERS });
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function bool(value: unknown): boolean {
  return value === true;
}

function asArray<T = AnyObj>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const out = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(out)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function readBody(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { return { ok: false, code: "NON_JSON_RESPONSE", status: response.status, bodyPreview: raw.slice(0, 1200) }; }
}

async function invoke(
  request: Request,
  env: any,
  ctx: any,
  canonicalFetch: CanonicalFetch,
  path: string,
  method: "GET" | "POST" = "GET",
  payload?: unknown,
) {
  const target = new URL(request.url);
  const [pathname, query = ""] = path.split("?", 2);
  target.pathname = pathname;
  target.search = query ? `?${query}` : "";
  const started = Date.now();
  try {
    const response = await canonicalFetch(new Request(target.toString(), {
      method,
      headers: { accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}) },
      body: method === "POST" ? JSON.stringify(payload ?? {}) : undefined,
    }), env, ctx);
    const body = await readBody(response);
    return {
      path: `${target.pathname}${target.search}`,
      status: response.status,
      ok: response.ok && body?.ok !== false,
      body,
      elapsedMs: Date.now() - started,
    };
  } catch (error) {
    return {
      path: `${target.pathname}${target.search}`,
      status: 0,
      ok: false,
      body: null,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - started,
    };
  }
}

function residualCountFromLatest(summary: any): number {
  const n = Number(summary?.latest?.residualCount ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function intentMatches(menuId: string, intent: string): boolean {
  if (!intent) return false;
  const hay = intent.toLowerCase();
  return (INTENT_MENU_TERMS[menuId] || []).some(term => hay.includes(term));
}

function menuRecommendation(cohort: any, mergeDonor: number, artifactProofGap: number) {
  if (!cohort?.apiPath) return "RESTORE_LIVE_EXECUTION_SURFACE_AND_RECEIPT";
  if (!cohort?.bodyOk) return "REPAIR_COHORT_ROUTE_THEN_REPROVE_BEFORE_EXPANSION";
  if (mergeDonor > 0) return "TRIAGE_DONOR_AND_MERGE_CANDIDATES_WITH_ARTIFACT_LEVEL_RECEIPTS";
  if (artifactProofGap > 0) return "INCREASE_ARTIFACT_LEVEL_EXECUTION_REPLAY_AND_ROLLBACK_PROOF";
  return "PRESERVE_AND_EXTEND_ONLY_WITH_NEW_VERIFIED_CAPABILITY";
}

function buildMenuPotential(restoration: any, intent: string) {
  const rows = asArray<AnyObj>(restoration?.artifacts);
  const grouped = new Map<string, AnyObj[]>();
  for (const row of rows) {
    const menuId = text(row?.menuId) || "UNMAPPED";
    const list = grouped.get(menuId) || [];
    list.push(row);
    grouped.set(menuId, list);
  }

  const menus = [...grouped.entries()].map(([menuId, artifacts]) => {
    const cohort = artifacts.find(row => row?.cohort)?.cohort || null;
    const keep = artifacts.filter(row => text(row?.disposition).toUpperCase() === "KEEP").length;
    const merge = artifacts.filter(row => text(row?.disposition).toUpperCase() === "MERGE").length;
    const donor = artifacts.filter(row => text(row?.disposition).toUpperCase() === "DONOR").length;
    const mergeDonor = merge + donor;
    const degraded = !cohort?.apiPath || !bool(cohort?.bodyOk);
    const noExecutionRoute = !cohort?.apiPath;
    const artifactProofGap = artifacts.length;
    const matched = intentMatches(menuId, intent);
    const potentialClass = noExecutionRoute
      ? "RESTORE_EXECUTION_PROOF"
      : degraded
        ? "REPAIR_LIVE_COHORT"
        : mergeDonor > 0
          ? "BOUNDED_ADMISSION_OPPORTUNITY"
          : artifactProofGap > 0
            ? "ARTIFACT_PROOF_EXPANSION"
            : "PRESERVE_VERIFIED_COHORT";
    return {
      menuId,
      artifactCount: artifacts.length,
      disposition: { keep, merge, donor, unadmitted: mergeDonor },
      cohort: cohort ? {
        apiPath: cohort.apiPath ?? null,
        humanPath: cohort.humanPath ?? null,
        proofClass: cohort.proofClass ?? null,
        status: cohort.status ?? 0,
        reachable: bool(cohort.reachable),
        bodyOk: bool(cohort.bodyOk),
        schema: cohort.schema ?? null,
        release: cohort.release ?? null,
        boundary: cohort.boundary ?? null,
      } : null,
      evidenceState: noExecutionRoute ? "NO_CURRENT_EXECUTION_PROOF_ROUTE" : degraded ? "COHORT_ROUTE_DEGRADED" : "COHORT_ROUTE_REACHABLE_ARTIFACT_PROOF_STILL_REQUIRED",
      potentialClass,
      intentMatched: matched,
      priorityVector: {
        intentMatched: matched ? 1 : 0,
        blocking: degraded ? 1 : 0,
        noExecutionRoute: noExecutionRoute ? 1 : 0,
        unadmittedArtifacts: mergeDonor,
        artifactProofGap,
      },
      recommendedAction: menuRecommendation(cohort, mergeDonor, artifactProofGap),
      modeGuidance: MENU_MODE_GUIDANCE[menuId] || ["FULL_OVERALL_CANON", "NO_NOTHING_TRUTH", "PROOF_ADMISSION"],
      truthBoundary: "Drive/corpus classification and cohort reachability guide engineering priority; neither constitutes artifact-level execution proof or CanonState admission.",
    };
  });

  menus.sort((a, b) =>
    b.priorityVector.intentMatched - a.priorityVector.intentMatched ||
    b.priorityVector.blocking - a.priorityVector.blocking ||
    b.priorityVector.noExecutionRoute - a.priorityVector.noExecutionRoute ||
    b.priorityVector.unadmittedArtifacts - a.priorityVector.unadmittedArtifacts ||
    b.priorityVector.artifactProofGap - a.priorityVector.artifactProofGap ||
    a.menuId.localeCompare(b.menuId)
  );
  return menus.map((menu, index) => ({ ...menu, priorityRank: index + 1 }));
}

async function manifest(env: any) {
  const core = {
    ok: true,
    schema: "OMEGA_UNIFIED_CONTINUITY_POTENTIAL_MANIFEST_R202",
    release: CONTINUITY_POTENTIAL_RELEASE_R202,
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    purpose: "Close the loop from current capability truth and Drive/corpus design evidence through durable mission history into evidence-ranked next-action potential without creating shadow authority.",
    flow: [
      "R190_CAPABILITY_TRUTH",
      "R195_DRIVE_CORPUS_AND_RESTORATION_EVIDENCE",
      "R199_CORRELATED_OPERATOR_STATE",
      "R200_ALL_MODE_MISSION_KERNEL",
      "R201_DURABLE_MISSION_CHAIN",
      "R202_GAP_CORRELATION",
      "R202_BOUNDED_NEXT_ACTION",
      "OPTIONAL_R201_DURABLE_MISSION_EXECUTION",
      "R202_RECALIBRATION",
      "SEPARATE_ADMISSION",
    ],
    sourceClasses: {
      liveRouteProbe: "CURRENT_EXECUTION_EVIDENCE",
      durableMissionHistory: "HASH_CHAINED_MISSION_EVIDENCE",
      driveCorpus: "HASH_VERIFIED_DESIGN_AND_ARCHIVE_CORPUS_NOT_EXECUTION_TRUTH",
      capabilityManifest: "IMPLEMENTATION_AND_ADMISSION_CONTRACT",
      modeRegistry: "R200_CANONICAL_LENS_POLICY",
    },
    endpoints: [
      "/api/system/r202/manifest",
      "/api/system/r202/potential",
      "/api/system/r202/resolve",
      "/api/mission/r202/execute",
    ],
    rankingLaw: "LEXICOGRAPHIC_EVIDENCE_PRIORITY_NOT_PHYSICAL_SCORE: intent relevance -> live blocker -> missing execution route -> unadmitted donor/merge pressure -> artifact proof gap.",
    modeLaw: "R200 mode ensemble remains authoritative; R202 attaches mode guidance to evidence gaps but does not create an independent mode authority.",
    driveBoundary: "Workbook metrics, Mode188 rows, address spaces and menu classifications are corpus/design evidence. They are never upgraded into live implementation, physical measurement or admission solely by R202.",
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await digest(core) };
}

async function buildPotentialSnapshot(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch, intent = "") {
  const [r190, r195, r199, r200, r201Summary, r201Verify, restoration] = await Promise.all([
    invoke(request, env, ctx, canonicalFetch, "/api/acceptance/r190/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/system/r195/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/system/r199/snapshot"),
    invoke(request, env, ctx, canonicalFetch, "/api/mission/r200/manifest"),
    invoke(request, env, ctx, canonicalFetch, "/api/mission/r201/summary"),
    invoke(request, env, ctx, canonicalFetch, "/api/mission/r201/verify"),
    invoke(request, env, ctx, canonicalFetch, "/api/system/r195/restoration?limit=100"),
  ]);

  const dependencies = { r190, r195, r199, r200, r201Summary, r201Verify, restoration };
  const dependencyTruth = Object.fromEntries(Object.entries(dependencies).map(([id, row]) => [id, {
    ok: row.ok,
    status: row.status,
    path: row.path,
    schema: row.body?.schema ?? null,
    release: row.body?.release ?? row.body?.revision ?? null,
  }]));
  const menus = buildMenuPotential(restoration.body, intent);
  const recentMissionResiduals = residualCountFromLatest(r201Summary.body);
  const blockers = menus.filter(row => row.priorityVector.blocking === 1);
  const noExecutionProofRoutes = menus.filter(row => row.priorityVector.noExecutionRoute === 1);
  const unadmittedArtifacts = menus.reduce((n, row) => n + row.priorityVector.unadmittedArtifacts, 0);
  const artifactProofGap = menus.reduce((n, row) => n + row.priorityVector.artifactProofGap, 0);
  const allDependenciesReady = Object.values(dependencies).every(row => row.ok === true);

  const core = {
    ok: allDependenciesReady,
    schema: CONTINUITY_POTENTIAL_SCHEMA_R202,
    release: CONTINUITY_POTENTIAL_RELEASE_R202,
    generatedAt: new Date().toISOString(),
    canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
    intent: intent || null,
    dependencies: dependencyTruth,
    currentTruth: {
      capabilityTruthReady: r190.ok,
      driveCorpusReady: r195.ok,
      operatorSnapshotReady: r199.ok,
      r200ModeCount: Number(r200.body?.modeCount ?? 0) || null,
      durableMissionLedgerReady: r201Summary.ok,
      durableMissionChainVerified: r201Verify.ok && r201Verify.body?.verified === true,
      restorationEvidenceReady: restoration.ok,
    },
    continuity: {
      recentMissionResiduals,
      durableEntryCount: Number(r201Summary.body?.entryCount ?? r201Summary.body?.summary?.entryCount ?? 0) || 0,
      durableHeadSha256: r201Summary.body?.headSha256 ?? r201Summary.body?.summary?.headSha256 ?? null,
      chainVerified: r201Verify.body?.verified === true,
      operator: ["partition", "exchange/transform", "invariant carry", "scar/residual carry", "re-contextualize/repartition"],
    },
    potential: {
      menuCount: menus.length,
      blockingMenuCount: blockers.length,
      noExecutionProofRouteCount: noExecutionProofRoutes.length,
      unadmittedArtifactCount: unadmittedArtifacts,
      artifactProofGapCount: artifactProofGap,
      highestPriority: menus.slice(0, 6),
      menus,
    },
    nextActionLaw: {
      order: ["LIVE_BLOCKER", "MISSING_EXECUTION_PROOF_ROUTE", "DONOR_OR_MERGE_ADMISSION", "ARTIFACT_LEVEL_PROOF", "VERIFIED_CAPABILITY_EXPANSION"],
      modeOverlay: "Use each menu's R200 modeGuidance while preserving R200 as the mode authority.",
      mutationBoundary: "R202 recommends and can invoke R201 durable mission execution; it cannot mutate CanonState, HostState, source, GitHub or deployment state directly.",
    },
    truthBoundaries: {
      chartedIsNotExecuted: true,
      cohortReachabilityIsNotArtifactProof: true,
      workbookScoreIsNotPhysicalTruth: true,
      durableHistoryIsNotCanonState: true,
      returnedIsNotVerified: true,
      recommendationIsNotAuthorization: true,
      buildCandidateIsNotPromotion: true,
    },
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return { ...core, receiptSha256: await digest(core) };
}

async function resolvePotential(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const input = await request.json().catch(() => ({})) as AnyObj;
  const intent = text(input.intent || input.objective || input.prompt);
  if (!intent) return json({ ok: false, code: "R202_INTENT_REQUIRED", canonicalMutation: false, promotionAuthorized: false }, 422);
  const snapshot = await buildPotentialSnapshot(request, env, ctx, canonicalFetch, intent);
  const limit = Math.max(1, Math.min(12, Math.trunc(Number(input.limit || 6) || 6)));
  const recommendations = snapshot.potential.menus.slice(0, limit).map((row: AnyObj, index: number) => ({
    sequence: index + 1,
    menuId: row.menuId,
    potentialClass: row.potentialClass,
    action: row.recommendedAction,
    modeGuidance: row.modeGuidance,
    evidenceState: row.evidenceState,
    authority: "RECOMMENDATION_NOT_EXECUTION_AUTHORIZATION",
  }));
  const core = {
    ok: snapshot.ok,
    schema: "OMEGA_CONTINUITY_POTENTIAL_RESOLUTION_R202",
    release: CONTINUITY_POTENTIAL_RELEASE_R202,
    intent,
    snapshotReceiptSha256: snapshot.receiptSha256,
    recommendations,
    residualCarry: snapshot.continuity,
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await digest(core) }, snapshot.ok ? 200 : 503);
}

async function executeClosedLoop(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch) {
  const input = await request.json().catch(() => ({})) as AnyObj;
  const intent = text(input.intent || input.objective || input.prompt);
  if (!intent) return json({ ok: false, code: "R202_INTENT_REQUIRED", canonicalMutation: false, promotionAuthorized: false }, 422);

  const durableMission = await invoke(request, env, ctx, canonicalFetch, "/api/mission/r201/execute", "POST", input);
  const recalibrated = await buildPotentialSnapshot(request, env, ctx, canonicalFetch, intent);
  const durableVerified = durableMission.ok && durableMission.body?.durableVerified === true;
  const chainVerified = recalibrated.currentTruth.durableMissionChainVerified === true;
  const core = {
    ok: durableVerified && chainVerified && recalibrated.ok,
    schema: "OMEGA_CLOSED_LOOP_CONTINUITY_EXECUTION_R202",
    release: CONTINUITY_POTENTIAL_RELEASE_R202,
    intent,
    progression: [
      "R200_PLAN_AND_EXECUTE",
      "R201_RECEIPT_VERIFY_AND_RECORD",
      "R201_CHAIN_VERIFY",
      "R202_RESCAN_CAPABILITY_AND_CORPUS_GAPS",
      "R202_RECALIBRATE_NEXT_ACTION",
      "SEPARATE_ADMISSION_REQUIRED",
    ],
    durableMission: {
      status: durableMission.status,
      ok: durableMission.ok,
      durableRecorded: durableMission.body?.durableRecorded === true,
      durableVerified,
      missionId: durableMission.body?.mission?.missionId ?? null,
      missionReceiptSha256: durableMission.body?.mission?.missionReceiptSha256 ?? null,
      continuityHeadSha256: durableMission.body?.continuity?.ledger?.headSha256 ?? durableMission.body?.verification?.headSha256 ?? null,
      admissionState: durableMission.body?.mission?.admission?.state ?? null,
    },
    recalibratedPotential: {
      receiptSha256: recalibrated.receiptSha256,
      chainVerified,
      recentMissionResiduals: recalibrated.continuity.recentMissionResiduals,
      highestPriority: recalibrated.potential.highestPriority,
    },
    admission: {
      state: durableVerified && chainVerified ? "EVIDENCE_LOOP_VERIFIED_SEPARATE_ADMISSION_STILL_REQUIRED" : "HOLD",
      reason: durableVerified && chainVerified
        ? "Mission execution, durable receipt record and evidence-chain verification succeeded; this does not authorize CanonState mutation, source mutation, deployment or successor promotion."
        : "The durable execution/evidence loop retains unresolved verification state.",
    },
    canonicalMutation: false,
    hostStateMutation: false,
    sourceMutationAuthorized: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
  };
  return json({ ...core, receiptSha256: await digest(core) }, core.ok ? 201 : 503);
}

export async function handleContinuityPotentialR202(request: Request, env: any, ctx: any, canonicalFetch: CanonicalFetch): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const relevant = path.startsWith("/api/system/r202") || path.startsWith("/api/mission/r202");
  if (!relevant) return null;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });

  if (path === "/api/system/r202/manifest" && request.method === "GET") return json(await manifest(env));
  if (path === "/api/system/r202/potential" && request.method === "GET") {
    const intent = text(url.searchParams.get("intent"));
    const snapshot = await buildPotentialSnapshot(request, env, ctx, canonicalFetch, intent);
    return json(snapshot, snapshot.ok ? 200 : 503);
  }
  if (path === "/api/system/r202/resolve" && request.method === "POST") return resolvePotential(request, env, ctx, canonicalFetch);
  if (path === "/api/mission/r202/execute" && request.method === "POST") return executeClosedLoop(request, env, ctx, canonicalFetch);

  return json({
    ok: false,
    code: "R202_ROUTE_NOT_FOUND",
    routes: ["/api/system/r202/manifest", "/api/system/r202/potential", "/api/system/r202/resolve", "/api/mission/r202/execute"],
    canonicalMutation: false,
    hostStateMutation: false,
    promotionAuthorized: false,
  }, 404);
}