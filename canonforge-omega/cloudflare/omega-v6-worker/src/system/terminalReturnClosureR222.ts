export const TERMINAL_RETURN_RELEASE_R222 = "r222-terminal-return-closure";
export const TERMINAL_RETURN_SCHEMA_R222 = "OMEGA_TERMINAL_RETURN_CLOSURE_R222";

const BYPASS_HEADER = "x-omega-r222-bypass";
const R204_VERIFICATION_SCHEMA = "OMEGA_HYBRID_RETURN_VERIFICATION_R204";
const R204_PACKET_SCHEMA = "OMEGA_HYBRID_RETURN_PACKET_R204";
const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING", "INVOKED", "DISPATCHED", "EXECUTING"]);
const TERMINAL_STATES = new Set([
  "COMPLETE",
  "COMPLETED",
  "VERIFIED",
  "FAILED",
  "BLOCKED",
  "CANCELLED",
  "HOLD_REPAIR_REQUIRED",
  "RETURNED",
  "RETURNED_SUCCESS",
  "RETURNED_FAILURE",
  "RETURN_REJECTED",
]);
const SUCCESS_TERMINALS = new Set(["COMPLETE", "COMPLETED", "VERIFIED", "RETURNED", "RETURNED_SUCCESS"]);
const FAILURE_TERMINALS = new Set(["FAILED", "BLOCKED", "CANCELLED", "HOLD_REPAIR_REQUIRED", "RETURNED_FAILURE", "RETURN_REJECTED"]);

function text(value: any): string {
  return String(value ?? "").trim();
}

function state(value: any): string {
  return text(value?.status ?? value?.state ?? value).toUpperCase();
}

function object(value: any): Record<string, any> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;
}

function meaningfulObject(value: any): boolean {
  const row = object(value);
  return Boolean(row && Object.keys(row).length > 0);
}

function hasShaLike(value: any): boolean {
  return /^[a-f0-9]{64}$/i.test(text(value));
}

function identity(value: any): string | null {
  const row = object(value) || {};
  return text(row.id ?? row.jobId ?? row.job_id) || null;
}

function eventTime(value: any): number | null {
  const row = object(value) || {};
  for (const candidate of [row.completedAt, row.completed_at, row.heldAt, row.held_at, row.returnedAt, row.returned_at, row.updatedAt, row.updated_at, row.leasedAt, row.leased_at, row.createdAt, row.created_at]) {
    if (candidate == null) continue;
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const parsed = Date.parse(String(candidate));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function sameCurrentJob(job: any, container?: any): boolean {
  const jid = identity(job);
  const c = object(container) || {};
  const current = text(c.currentJobId ?? c.current_job_id ?? c.currentJob?.id ?? c.current_job?.id) || null;
  return !jid || !current || jid === current;
}

type ReturnEvidenceR222 = {
  present: boolean;
  source: string | null;
};

function returnEvidence(job: any, container?: any): ReturnEvidenceR222 {
  const j = object(job) || {};
  const c = object(container) || {};
  const packet = object(j.returnPacket ?? j.return_packet);
  const directVerification = object(j.returnVerification ?? j.return_verification);

  if (packet?.schema === R204_PACKET_SCHEMA) return { present: true, source: "R204_JOB_RETURN_PACKET" };
  if (directVerification?.schema === R204_VERIFICATION_SCHEMA) return { present: true, source: "R204_JOB_RETURN_VERIFICATION" };
  if (meaningfulObject(j.evidence)) return { present: true, source: "JOB_SCOPED_EVIDENCE" };

  for (const [source, candidate] of [
    ["JOB_RETURN_PROOF", j.returnProof ?? j.return_proof],
    ["JOB_VERIFIED_RETURN", j.verifiedReturn ?? j.verified_return],
    ["JOB_PROOF", j.proof],
    ["JOB_RECEIPT", j.receipt],
    ["JOB_RESULT_RECEIPT", j.resultReceipt ?? j.result_receipt],
  ] as Array<[string, any]>) {
    if (meaningfulObject(candidate)) return { present: true, source };
  }

  if (sameCurrentJob(job, container)) {
    const lastProof = object(c.lastProof ?? c.last_proof);
    if (lastProof?.schema === R204_VERIFICATION_SCHEMA || meaningfulObject(c.returnProof ?? c.return_proof) || meaningfulObject(c.verifiedReturn ?? c.verified_return)) {
      return { present: true, source: lastProof?.schema === R204_VERIFICATION_SCHEMA ? "R204_SCOPED_MISSION_LAST_PROOF" : "SCOPED_CONTAINER_RETURN_EVIDENCE" };
    }
  }

  for (const candidate of [
    j.receiptSha256,
    j.receipt_sha256,
    j.resultSha256,
    j.result_sha256,
    j.returnSha256,
    j.return_sha256,
  ]) {
    if (hasShaLike(candidate)) return { present: true, source: "JOB_SCOPED_SHA256" };
  }
  return { present: false, source: null };
}

type VerificationR222 = {
  claimed: boolean;
  succeeded: boolean;
  failed: boolean;
  authority: string | null;
  receiptSha256: string | null;
};

function r204Verification(job: any, container?: any): Record<string, any> | null {
  const j = object(job) || {};
  const c = object(container) || {};
  const packet = object(j.returnPacket ?? j.return_packet);
  const candidates: any[] = [
    j.returnVerification,
    j.return_verification,
    packet?.verification,
  ];
  if (sameCurrentJob(job, container)) candidates.push(c.lastProof, c.last_proof);
  for (const candidate of candidates) {
    const row = object(candidate);
    if (row?.schema !== R204_VERIFICATION_SCHEMA || row?.verified !== true || !hasShaLike(row?.serverReceiptSha256 ?? row?.server_receipt_sha256)) continue;
    return row;
  }
  return null;
}

function explicitVerification(job: any, container?: any): VerificationR222 {
  const observedStatus = state(job);
  if (observedStatus === "VERIFIED") {
    return { claimed: true, succeeded: true, failed: false, authority: "JOB_STATE_VERIFIED", receiptSha256: null };
  }

  const verified = r204Verification(job, container);
  if (!verified) return { claimed: false, succeeded: false, failed: false, authority: null, receiptSha256: null };
  const verificationState = state(verified);
  const failed = observedStatus === "FAILED" || verificationState.includes("FAILURE");
  return {
    claimed: true,
    succeeded: !failed,
    failed,
    authority: "R204_AUTHENTICATED_RETURN_ADMISSION",
    receiptSha256: text(verified.serverReceiptSha256 ?? verified.server_receipt_sha256).toLowerCase() || null,
  };
}

function subject(job: any, container?: any): any {
  if (job && typeof job === "object") return job;
  const c = object(container) || {};
  return c.currentJob ?? c.current_job ?? ((c.status || c.state) ? c : null);
}

export type TerminalReconciliationR222 = {
  release: string;
  jobId: string | null;
  observedStatus: string;
  eventTime: number | null;
  state: string;
  jobInFlight: boolean;
  terminal: boolean;
  returnEvidencePresent: boolean;
  returnEvidenceSource: string | null;
  verificationClaimed: boolean;
  verificationSucceeded: boolean;
  verificationFailed: boolean;
  verificationAuthority: string | null;
  verificationReceiptSha256: string | null;
  requiresReturnEvidence: boolean;
  requiresVerification: boolean;
  replayEligible: boolean;
  blocker: string | null;
  nextAction: string;
  r204VerifiedReturnAuthorityPreserved: true;
  r141r142ExactPayloadAuthorityPreserved: true;
  r159ConvergenceRequiresVerifiedReplay: true;
  canonicalMutation: false;
  promotionAuthorized: false;
};

export function reconcileTerminalJobR222(job: any, container?: any): TerminalReconciliationR222 {
  const observed = subject(job, container);
  const observedStatus = state(observed);
  const jobInFlight = ACTIVE_STATES.has(observedStatus);
  const terminal = TERMINAL_STATES.has(observedStatus);
  const evidence = returnEvidence(observed, container);
  const verification = explicitVerification(observed, container);
  const successTerminal = SUCCESS_TERMINALS.has(observedStatus);
  const failureTerminal = FAILURE_TERMINALS.has(observedStatus);
  let reconciledState = observedStatus || "NO_HOST_JOB";
  let blocker: string | null = null;

  if (jobInFlight) {
    reconciledState = "HOST_EXECUTING";
  } else if (failureTerminal) {
    if (verification.claimed) {
      reconciledState = "HOST_RETURN_VERIFIED_FAILURE";
      blocker = "HOST_EXECUTION_FAILED_VERIFIED_RETURN";
    } else if (observedStatus === "CANCELLED") {
      reconciledState = "HOST_CANCELLED";
      blocker = "HOST_CANCELLED";
    } else {
      reconciledState = "HOST_TERMINAL_BLOCKED";
      blocker = observedStatus || "HOST_TERMINAL_BLOCKED";
    }
  } else if (successTerminal) {
    if (verification.succeeded) {
      reconciledState = "HOST_RETURN_VERIFIED";
    } else if (evidence.present) {
      reconciledState = "HOST_RETURNED_VERIFICATION_PENDING";
    } else {
      reconciledState = "RETURN_EVIDENCE_MISSING";
      blocker = "RETURN_EVIDENCE_MISSING";
    }
  } else if (verification.succeeded) {
    reconciledState = "HOST_RETURN_VERIFIED";
  } else if (evidence.present) {
    reconciledState = "HOST_RETURNED_VERIFICATION_PENDING";
  }

  const requiresReturnEvidence = terminal && successTerminal && !evidence.present && !verification.claimed;
  const requiresVerification = terminal && successTerminal && evidence.present && !verification.claimed;
  const replayEligible = verification.succeeded && verification.authority === "R204_AUTHENTICATED_RETURN_ADMISSION";
  let nextAction = "NONE";
  if (reconciledState === "HOST_EXECUTING") nextAction = "WAIT_FOR_HOST_RETURN";
  else if (reconciledState === "HOST_RETURNED_VERIFICATION_PENDING") nextAction = "VERIFY_RETURN_THROUGH_R204";
  else if (reconciledState === "RETURN_EVIDENCE_MISSING") nextAction = "RECOVER_OR_REISSUE_RETURN_PACKET";
  else if (reconciledState === "HOST_RETURN_VERIFIED" && replayEligible) nextAction = "RUN_VERIFIED_REPLAY_THEN_R159";
  else if (reconciledState === "HOST_RETURN_VERIFIED") nextAction = "ADVANCE_GOVERNED_NEXT_STAGE";
  else if (reconciledState === "HOST_RETURN_VERIFIED_FAILURE") nextAction = "REPAIR_OR_RETRY_GOVERNED_STAGE";
  else if (reconciledState === "HOST_TERMINAL_BLOCKED") nextAction = "REPAIR_TERMINAL_BLOCKER";
  else if (reconciledState === "HOST_CANCELLED") nextAction = "REISSUE_ONLY_WITH_OPERATOR_AUTHORITY";

  return {
    release: TERMINAL_RETURN_RELEASE_R222,
    jobId: identity(observed),
    observedStatus,
    eventTime: eventTime(observed),
    state: reconciledState,
    jobInFlight,
    terminal,
    returnEvidencePresent: evidence.present,
    returnEvidenceSource: evidence.source,
    verificationClaimed: verification.claimed,
    verificationSucceeded: verification.succeeded,
    verificationFailed: verification.failed,
    verificationAuthority: verification.authority,
    verificationReceiptSha256: verification.receiptSha256,
    requiresReturnEvidence,
    requiresVerification,
    replayEligible,
    blocker,
    nextAction,
    r204VerifiedReturnAuthorityPreserved: true,
    r141r142ExactPayloadAuthorityPreserved: true,
    r159ConvergenceRequiresVerifiedReplay: true,
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}

function json(data: unknown, status = 200, sourceHeaders?: Headers): Response {
  const headers = new Headers(sourceHeaders);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.delete("last-modified");
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-omega-terminal-return", TERMINAL_RETURN_RELEASE_R222);
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function withBypass(request: Request, pathname?: string): Request {
  const url = new URL(request.url);
  if (pathname) {
    url.pathname = pathname;
    url.search = "";
  }
  const headers = new Headers(request.headers);
  headers.set(BYPASS_HEADER, "1");
  return new Request(url.toString(), { method: "GET", headers });
}

async function readJson(response: Response): Promise<any | null> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

function developmentJob(body: any): any {
  return body?.active_job
    ?? body?.activeJob
    ?? body?.development?.active_job
    ?? body?.development?.activeJob
    ?? body?.terminal_job
    ?? body?.development?.terminal_job
    ?? null;
}

function hybridJob(body: any): { job: any; container: any } {
  const container = body?.mission ?? body?.hybridMission ?? body;
  return {
    job: body?.currentJob ?? body?.current_job ?? container?.currentJob ?? container?.current_job ?? null,
    container,
  };
}

function sameJob(a: any, b: any): boolean {
  const left = identity(a);
  const right = identity(b);
  return Boolean(left && right && left === right);
}

function normalizeDevelopment(body: any): any {
  if (!body || typeof body !== "object") return body;
  const job = developmentJob(body);
  const reconciliation = reconcileTerminalJobR222(job, body);
  const next = { ...body, terminal_reconciliation: reconciliation, r222_terminal_return_closure: reconciliation };
  if (!job || !reconciliation.terminal) return next;

  const recent = Array.isArray(body.recent_jobs) ? [...body.recent_jobs] : Array.isArray(body.recentJobs) ? [...body.recentJobs] : [];
  if (!recent.some((item: any) => sameJob(item, job))) recent.unshift(job);
  next.active_job = null;
  next.activeJob = null;
  next.terminal_job = job;
  next.recent_jobs = recent;
  if (body.development && typeof body.development === "object") {
    const nestedRecent = Array.isArray(body.development.recent_jobs) ? [...body.development.recent_jobs] : recent;
    if (!nestedRecent.some((item: any) => sameJob(item, job))) nestedRecent.unshift(job);
    next.development = {
      ...body.development,
      active_job: null,
      activeJob: null,
      terminal_job: job,
      recent_jobs: nestedRecent,
      terminal_reconciliation: reconciliation,
    };
  }
  return next;
}

function normalizeHybrid(body: any): any {
  if (!body || typeof body !== "object") return body;
  const { job, container } = hybridJob(body);
  const reconciliation = reconcileTerminalJobR222(job, container);
  return {
    ...body,
    jobInFlight: reconciliation.jobInFlight,
    workloadDisplayState: reconciliation.state,
    workloadNextAction: reconciliation.nextAction,
    terminalReconciliation: reconciliation,
    r222_terminal_return_closure: reconciliation,
  };
}

async function rawStatus(
  request: Request,
  env: any,
  ctx: any,
  next: (request: Request, env: any, ctx: any) => Promise<Response>,
  pathname: string,
): Promise<{ status: number; body: any | null }> {
  try {
    const response = await next(withBypass(request, pathname), env, ctx);
    return { status: response.status, body: await readJson(response) };
  } catch (error) {
    return { status: 0, body: { error: error instanceof Error ? error.message : String(error) } };
  }
}

function primaryReconciliation(
  development: TerminalReconciliationR222,
  hybrid: TerminalReconciliationR222,
): { surface: "development" | "hybrid"; reconciliation: TerminalReconciliationR222 } {
  if (development.jobId && hybrid.jobId && development.jobId === hybrid.jobId) {
    if (hybrid.verificationAuthority === "R204_AUTHENTICATED_RETURN_ADMISSION") return { surface: "hybrid", reconciliation: hybrid };
    if (development.verificationAuthority === "R204_AUTHENTICATED_RETURN_ADMISSION") return { surface: "development", reconciliation: development };
  }
  if (development.jobInFlight !== hybrid.jobInFlight) return development.jobInFlight
    ? { surface: "development", reconciliation: development }
    : { surface: "hybrid", reconciliation: hybrid };
  const dTime = development.eventTime || 0;
  const hTime = hybrid.eventTime || 0;
  if (dTime !== hTime) return dTime > hTime
    ? { surface: "development", reconciliation: development }
    : { surface: "hybrid", reconciliation: hybrid };
  const weight = (row: TerminalReconciliationR222) =>
    (row.requiresReturnEvidence ? 90 : 0)
    + (row.requiresVerification ? 80 : 0)
    + (row.verificationFailed ? 70 : 0)
    + (row.blocker ? 60 : 0)
    + (row.replayEligible ? 50 : 0)
    + (row.terminal ? 20 : 0)
    + (row.observedStatus ? 10 : 0);
  return weight(hybrid) > weight(development)
    ? { surface: "hybrid", reconciliation: hybrid }
    : { surface: "development", reconciliation: development };
}

export async function handleTerminalReturnClosureR222(
  request: Request,
  env: any,
  ctx: any,
  next: (request: Request, env: any, ctx: any) => Promise<Response>,
): Promise<Response | null> {
  if (request.headers.get(BYPASS_HEADER) === "1") return null;
  const url = new URL(request.url);
  if (request.method !== "GET") {
    if (url.pathname === "/api/system/r222/status") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
    return null;
  }

  if (url.pathname === "/api/development/status") {
    const response = await next(withBypass(request), env, ctx);
    const body = await readJson(response);
    if (!body) return response;
    return json(normalizeDevelopment(body), response.status, response.headers);
  }

  if (url.pathname === "/api/hybrid/status") {
    const response = await next(withBypass(request), env, ctx);
    const body = await readJson(response);
    if (!body) return response;
    return json(normalizeHybrid(body), response.status, response.headers);
  }

  if (url.pathname === "/api/system/r222/status") {
    const [development, hybrid] = await Promise.all([
      rawStatus(request, env, ctx, next, "/api/development/status"),
      rawStatus(request, env, ctx, next, "/api/hybrid/status"),
    ]);
    const developmentBody = normalizeDevelopment(development.body);
    const hybridBody = normalizeHybrid(hybrid.body);
    const devRecon = developmentBody?.terminal_reconciliation || reconcileTerminalJobR222(null);
    const hybridRecon = hybridBody?.terminalReconciliation || reconcileTerminalJobR222(null);
    const primary = primaryReconciliation(devRecon, hybridRecon);
    const chosen = primary.reconciliation;
    return json({
      ok: development.status > 0 || hybrid.status > 0,
      schema: TERMINAL_RETURN_SCHEMA_R222,
      release: TERMINAL_RETURN_RELEASE_R222,
      canonicalGitSha: env?.CANONICAL_GIT_SHA ?? null,
      primarySurface: primary.surface,
      jobId: chosen.jobId,
      state: chosen.state,
      jobInFlight: chosen.jobInFlight,
      terminal: chosen.terminal,
      returnEvidencePresent: chosen.returnEvidencePresent,
      returnEvidenceSource: chosen.returnEvidenceSource,
      verificationClaimed: chosen.verificationClaimed,
      verificationSucceeded: chosen.verificationSucceeded,
      verificationFailed: chosen.verificationFailed,
      verificationAuthority: chosen.verificationAuthority,
      verificationReceiptSha256: chosen.verificationReceiptSha256,
      requiresReturnEvidence: chosen.requiresReturnEvidence,
      requiresVerification: chosen.requiresVerification,
      replayEligible: chosen.replayEligible,
      blocker: chosen.blocker,
      nextAction: chosen.nextAction,
      developmentTransportStatus: development.status,
      hybridTransportStatus: hybrid.status,
      development: developmentBody,
      hybrid: hybridBody,
      authority: "TERMINAL_STATE_RECONCILIATION_NOT_RETURN_PROOF_NOT_CANON",
      boundaries: {
        completeIsNotVerified: true,
        completedIsNotVerified: true,
        r204VerifiedReturnAuthorityPreserved: true,
        r141r142ExactPayloadAuthorityPreserved: true,
        r159ConvergenceRequiresVerifiedReplay: true,
        containerVerificationDoesNotVerifyAnotherJob: true,
        r222PollingIsNotHeartbeatAuthority: true,
      },
      canonicalMutation: false,
      promotionAuthorized: false,
    });
  }
  return null;
}

const style = `<style id="omegaTerminalReturnR222Style">
#omegaTerminalReturnR222{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));z-index:99997;max-width:min(420px,calc(100vw - 20px));padding:9px 11px;border-radius:11px;border:1px solid #294457;background:#061019f2;color:#dbe8ef;box-shadow:0 14px 42px #0009;font:11px/1.42 ui-monospace,SFMono-Regular,Consolas,monospace;pointer-events:none;transition:opacity .18s ease,transform .18s ease}#omegaTerminalReturnR222[hidden]{display:none}#omegaTerminalReturnR222[data-state="HOST_EXECUTING"]{border-color:#2b6970}#omegaTerminalReturnR222[data-state="HOST_RETURN_VERIFIED"]{border-color:#2c7a58}#omegaTerminalReturnR222[data-state="HOST_RETURNED_VERIFICATION_PENDING"]{border-color:#806f35}#omegaTerminalReturnR222[data-state="RETURN_EVIDENCE_MISSING"],#omegaTerminalReturnR222[data-state="HOST_TERMINAL_BLOCKED"],#omegaTerminalReturnR222[data-state="HOST_RETURN_VERIFIED_FAILURE"]{border-color:#8c5a36}#omegaTerminalReturnR222[data-stale="1"]{opacity:.78}#omegaTerminalReturnR222 b{display:block;font-size:12px;margin-bottom:2px}.r222Sub{opacity:.76}.r222Meta{margin-top:3px;opacity:.56;font-size:10px}@media(max-width:640px){#omegaTerminalReturnR222{left:10px;right:10px;bottom:max(8px,env(safe-area-inset-bottom));max-width:none}}</style>`;

const script = `<script id="omegaTerminalReturnR222Runtime">(()=>{if(document.documentElement.dataset.omegaTerminalReturnR222)return;document.documentElement.dataset.omegaTerminalReturnR222='r222';let timer=0,busy=false,last='',failures=0;function ensure(){let box=document.getElementById('omegaTerminalReturnR222');if(box)return box;box=document.createElement('div');box.id='omegaTerminalReturnR222';box.setAttribute('role','status');box.setAttribute('aria-live','polite');const title=document.createElement('b');title.className='r222Title';const sub=document.createElement('div');sub.className='r222Sub';const meta=document.createElement('div');meta.className='r222Meta';box.append(title,sub,meta);document.body.appendChild(box);return box}function copy(box,selector,value){const n=box.querySelector(selector);if(n)n.textContent=String(value||'')}function legacy(s){if(s.jobInFlight)return;for(const n of Array.from(document.querySelectorAll('div,span,b,strong,p'))){if(String(n.textContent||'').trim().toUpperCase()==='HOST WORKLOAD IN FLIGHT'){n.textContent=s.state==='HOST_RETURN_VERIFIED'?'HOST RETURN VERIFIED':s.state==='HOST_RETURNED_VERIFICATION_PENDING'?'HOST RETURNED · VERIFICATION PENDING':s.state==='RETURN_EVIDENCE_MISSING'?'HOST COMPLETED · RETURN EVIDENCE MISSING':s.state==='HOST_RETURN_VERIFIED_FAILURE'?'HOST RETURN VERIFIED · EXECUTION FAILED':'HOST WORKLOAD TERMINAL';break}}}function render(s){if(!s||!s.state)return;legacy(s);const box=ensure();if(s.state==='NO_HOST_JOB'){box.hidden=true;return}box.hidden=false;box.dataset.state=s.state||'';box.dataset.stale='0';let title='HOST STATE RECONCILED',sub='R222 observes execution truth without manufacturing verification.';if(s.state==='HOST_EXECUTING'){title='HOST EXECUTING';sub='Authenticated execution remains in flight.'}else if(s.state==='HOST_RETURN_VERIFIED'){title='HOST RETURN VERIFIED';sub=s.replayEligible?'R204 return admission verified · replay/R159 may proceed under their own proof gates.':'Verified governed job observed · advance only through its next-stage gate.'}else if(s.state==='HOST_RETURNED_VERIFICATION_PENDING'){title='HOST RETURNED · VERIFICATION PENDING';sub='Execution ended and job-scoped return evidence exists; COMPLETE is not VERIFIED.'}else if(s.state==='RETURN_EVIDENCE_MISSING'){title='HOST COMPLETED · RETURN EVIDENCE MISSING';sub='Not in flight · not verified · recover or re-issue the job-scoped return packet.'}else if(s.state==='HOST_RETURN_VERIFIED_FAILURE'){title='HOST RETURN VERIFIED · EXECUTION FAILED';sub='The failure return is authenticated and verified; repair/retry is required, not promotion.'}else if(s.state==='HOST_TERMINAL_BLOCKED'){title='HOST TERMINAL BLOCKED';sub='Execution ended with a blocker; no automatic promotion.'}else if(s.state==='HOST_CANCELLED'){title='HOST CANCELLED';sub='Terminal cancellation; no return proof inferred.'}else{title='HOST STATE · '+String(s.state||'UNKNOWN')}const fingerprint=[s.jobId,s.state,s.blocker,s.nextAction,s.verificationReceiptSha256].join('|');if(fingerprint!==last){copy(box,'.r222Title',title);copy(box,'.r222Sub',sub);copy(box,'.r222Meta',[s.primarySurface||'',s.nextAction||'',s.jobId?('JOB '+s.jobId):''].filter(Boolean).join(' · '));last=fingerprint}}function schedule(){clearTimeout(timer);timer=setTimeout(poll,document.hidden?8000:3000)}async function poll(){if(busy){schedule();return}busy=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),2200);try{const r=await fetch('/api/system/r222/status',{cache:'no-store',headers:{accept:'application/json'},signal:controller.signal});if(!r.ok)throw new Error('status '+r.status);const s=await r.json();failures=0;render(s)}catch{failures++;if(failures>=3){const box=document.getElementById('omegaTerminalReturnR222');if(box&&!box.hidden){box.dataset.stale='1';copy(box,'.r222Meta','STATUS REFRESH DELAYED · HEARTBEAT AUTHORITY UNCHANGED')}}}finally{clearTimeout(timeout);busy=false;schedule()}}document.addEventListener('visibilitychange',()=>{clearTimeout(timer);schedule()});poll()})();</script>`;

export async function enhanceTerminalReturnClosureR222(response: Response): Promise<Response> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes('id="omegaTerminalReturnR222Runtime"')) {
    html = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
    html = html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("cache-control", "no-store");
  headers.set("x-omega-terminal-return", TERMINAL_RETURN_RELEASE_R222);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
