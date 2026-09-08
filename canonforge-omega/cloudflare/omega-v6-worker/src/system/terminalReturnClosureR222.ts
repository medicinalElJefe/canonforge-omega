export const TERMINAL_RETURN_RELEASE_R222 = "r222-terminal-return-closure";
export const TERMINAL_RETURN_SCHEMA_R222 = "OMEGA_TERMINAL_RETURN_CLOSURE_R222";

const BYPASS_HEADER = "x-omega-r222-bypass";
const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING", "INVOKED", "DISPATCHED", "EXECUTING"]);
const TERMINAL_STATES = new Set(["COMPLETE", "COMPLETED", "VERIFIED", "FAILED", "BLOCKED", "CANCELLED", "HOLD_REPAIR_REQUIRED"]);

function state(value: any): string {
  return String(value?.status ?? value?.state ?? value ?? "").trim().toUpperCase();
}

function object(value: any): Record<string, any> | null {
  return value && typeof value === "object" ? value as Record<string, any> : null;
}

function hasShaLike(value: any): boolean {
  return /^[a-f0-9]{64}$/i.test(String(value || ""));
}

function hasReturnEvidence(job: any, container?: any): boolean {
  const j = object(job) || {};
  const c = object(container) || {};
  const candidates = [
    j.returnProof,
    j.return_proof,
    j.verifiedReturn,
    j.verified_return,
    j.proof,
    j.receipt,
    j.resultReceipt,
    j.result_receipt,
    c.lastProof,
    c.last_proof,
    c.returnProof,
    c.return_proof,
    c.verifiedReturn,
    c.verified_return,
  ];
  if (candidates.some(value => value && typeof value === "object")) return true;
  return [
    j.receiptSha256,
    j.receipt_sha256,
    j.resultSha256,
    j.result_sha256,
    j.returnSha256,
    j.return_sha256,
    c.receiptSha256,
    c.receipt_sha256,
  ].some(hasShaLike);
}

function explicitVerification(job: any, container?: any): boolean {
  const j = object(job) || {};
  const c = object(container) || {};
  if (state(j) === "VERIFIED") return true;
  if (j.verified === true || j.verification?.verified === true || j.proof?.verified === true) return true;
  if (c.verified === true || c.verification?.verified === true || c.lastProof?.verified === true) return true;
  return false;
}

export type TerminalReconciliationR222 = {
  release: string;
  observedStatus: string;
  state: string;
  jobInFlight: boolean;
  terminal: boolean;
  returnEvidencePresent: boolean;
  verificationClaimed: boolean;
  requiresReturnEvidence: boolean;
  blocker: string | null;
  r204VerifiedReturnAuthorityPreserved: true;
  r141r142ExactPayloadAuthorityPreserved: true;
  r159ConvergenceRequiresVerifiedReplay: true;
  canonicalMutation: false;
  promotionAuthorized: false;
};

export function reconcileTerminalJobR222(job: any, container?: any): TerminalReconciliationR222 {
  const observedStatus = state(job);
  const jobInFlight = ACTIVE_STATES.has(observedStatus);
  const terminal = TERMINAL_STATES.has(observedStatus);
  const returnEvidencePresent = hasReturnEvidence(job, container);
  const verificationClaimed = explicitVerification(job, container);
  let reconciledState = observedStatus || "NO_HOST_JOB";
  let blocker: string | null = null;

  if (jobInFlight) reconciledState = "HOST_EXECUTING";
  else if (observedStatus === "VERIFIED" || verificationClaimed) reconciledState = "HOST_RETURN_VERIFIED";
  else if (observedStatus === "COMPLETE" || observedStatus === "COMPLETED") {
    if (returnEvidencePresent) reconciledState = "HOST_RETURNED_VERIFICATION_PENDING";
    else {
      reconciledState = "RETURN_EVIDENCE_MISSING";
      blocker = "RETURN_EVIDENCE_MISSING";
    }
  } else if (observedStatus === "FAILED" || observedStatus === "BLOCKED" || observedStatus === "HOLD_REPAIR_REQUIRED") {
    reconciledState = "HOST_TERMINAL_BLOCKED";
    blocker = observedStatus || "HOST_TERMINAL_BLOCKED";
  } else if (observedStatus === "CANCELLED") {
    reconciledState = "HOST_CANCELLED";
    blocker = "HOST_CANCELLED";
  }

  return {
    release: TERMINAL_RETURN_RELEASE_R222,
    observedStatus,
    state: reconciledState,
    jobInFlight,
    terminal,
    returnEvidencePresent,
    verificationClaimed,
    requiresReturnEvidence: terminal && !returnEvidencePresent && !verificationClaimed,
    blocker,
    r204VerifiedReturnAuthorityPreserved: true,
    r141r142ExactPayloadAuthorityPreserved: true,
    r159ConvergenceRequiresVerifiedReplay: true,
    canonicalMutation: false,
    promotionAuthorized: false,
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-terminal-return": TERMINAL_RETURN_RELEASE_R222,
    },
  });
}

function withBypass(request: Request, pathname?: string): Request {
  const url = new URL(request.url);
  if (pathname) url.pathname = pathname;
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
  return body?.active_job ?? body?.development?.active_job ?? body?.activeJob ?? body?.development?.activeJob ?? null;
}

function hybridJob(body: any): { job: any; container: any } {
  const container = body?.mission ?? body?.hybridMission ?? body;
  return {
    job: body?.currentJob ?? body?.current_job ?? container?.currentJob ?? container?.current_job ?? null,
    container,
  };
}

function normalizeDevelopment(body: any): any {
  if (!body || typeof body !== "object") return body;
  const job = developmentJob(body);
  const reconciliation = reconcileTerminalJobR222(job, body);
  const next = { ...body, terminal_reconciliation: reconciliation, r222_terminal_return_closure: reconciliation };
  if (!reconciliation.terminal) return next;

  const recent = Array.isArray(body.recent_jobs) ? [...body.recent_jobs] : Array.isArray(body.recentJobs) ? [...body.recentJobs] : [];
  if (job && !recent.some((item: any) => String(item?.id || item?.job_id || "") === String(job?.id || job?.job_id || ""))) recent.unshift(job);
  next.active_job = null;
  next.activeJob = null;
  next.terminal_job = job;
  next.recent_jobs = recent;
  if (body.development && typeof body.development === "object") {
    next.development = {
      ...body.development,
      active_job: null,
      activeJob: null,
      terminal_job: job,
      recent_jobs: Array.isArray(body.development.recent_jobs) ? body.development.recent_jobs : recent,
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
    return json(normalizeDevelopment(body), response.status);
  }

  if (url.pathname === "/api/hybrid/status") {
    const response = await next(withBypass(request), env, ctx);
    const body = await readJson(response);
    if (!body) return response;
    return json(normalizeHybrid(body), response.status);
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
    const chosen = devRecon.observedStatus ? devRecon : hybridRecon;
    return json({
      ok: development.status > 0 || hybrid.status > 0,
      schema: TERMINAL_RETURN_SCHEMA_R222,
      release: TERMINAL_RETURN_RELEASE_R222,
      state: chosen.state,
      jobInFlight: chosen.jobInFlight,
      terminal: chosen.terminal,
      returnEvidencePresent: chosen.returnEvidencePresent,
      verificationClaimed: chosen.verificationClaimed,
      requiresReturnEvidence: chosen.requiresReturnEvidence,
      blocker: chosen.blocker,
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
      },
      canonicalMutation: false,
      promotionAuthorized: false,
    });
  }
  return null;
}

const style = `<style id="omegaTerminalReturnR222Style">
#omegaTerminalReturnR222{position:fixed;right:14px;bottom:14px;z-index:99997;max-width:min(520px,calc(100vw - 28px));padding:10px 12px;border-radius:12px;border:1px solid #294457;background:#061019ed;color:#dbe8ef;box-shadow:0 18px 55px #000a;font:11px/1.42 ui-monospace,monospace}#omegaTerminalReturnR222[data-state="HOST_EXECUTING"]{border-color:#2b6970}#omegaTerminalReturnR222[data-state="HOST_RETURN_VERIFIED"]{border-color:#2c7a58}#omegaTerminalReturnR222[data-state="RETURN_EVIDENCE_MISSING"],#omegaTerminalReturnR222[data-state="HOST_TERMINAL_BLOCKED"]{border-color:#8c5a36}#omegaTerminalReturnR222 b{display:block;font-size:12px;margin-bottom:2px}.r222Sub{opacity:.72}</style>`;

const script = `<script id="omegaTerminalReturnR222Runtime">(()=>{if(document.documentElement.dataset.omegaTerminalReturnR222)return;document.documentElement.dataset.omegaTerminalReturnR222='r222';let last='';function text(n){return String(n?.textContent||'').trim().toUpperCase()}function repairLegacyLabel(s){if(s.jobInFlight)return;for(const n of Array.from(document.querySelectorAll('div,span,b,strong,p'))){if(text(n)==='HOST WORKLOAD IN FLIGHT'){n.textContent=s.state==='HOST_RETURN_VERIFIED'?'HOST RETURN VERIFIED':s.state==='HOST_RETURNED_VERIFICATION_PENDING'?'HOST RETURNED · VERIFICATION PENDING':s.state==='RETURN_EVIDENCE_MISSING'?'HOST COMPLETED · RETURN EVIDENCE MISSING':'HOST WORKLOAD TERMINAL';break}}}function render(s){repairLegacyLabel(s);let box=document.getElementById('omegaTerminalReturnR222');if(!box){box=document.createElement('div');box.id='omegaTerminalReturnR222';document.body.appendChild(box)}box.dataset.state=s.state||'';let title='HOST STATE RECONCILED';let sub='';if(s.state==='HOST_EXECUTING'){title='HOST EXECUTING';sub='Authenticated execution remains in flight.'}else if(s.state==='HOST_RETURN_VERIFIED'){title='HOST RETURN VERIFIED';sub='Explicit verification observed · replay/R159 may proceed under their own proof gates.'}else if(s.state==='HOST_RETURNED_VERIFICATION_PENDING'){title='HOST RETURNED · VERIFICATION PENDING';sub='Execution ended and return evidence exists; COMPLETE is not VERIFIED.'}else if(s.state==='RETURN_EVIDENCE_MISSING'){title='HOST COMPLETED · RETURN EVIDENCE MISSING';sub='Not in flight · not verified · returned proof packet must be recovered or re-issued.'}else if(s.state==='HOST_TERMINAL_BLOCKED'){title='HOST TERMINAL BLOCKED';sub='Execution ended with a blocker; no automatic promotion.'}else if(s.state==='HOST_CANCELLED'){title='HOST CANCELLED';sub='Terminal cancellation; no return proof inferred.'}else{title='HOST STATE · '+String(s.state||'UNKNOWN');sub='R222 observes terminal truth without manufacturing verification.'}box.innerHTML='<b>'+title+'</b><div class="r222Sub">'+sub+'</div>';last=s.state||''}async function poll(){try{const r=await fetch('/api/system/r222/status',{cache:'no-store',headers:{accept:'application/json'}});const s=await r.json();if(s&&s.state)render(s)}catch{}}poll();setInterval(poll,2500)})();</script>`;

export async function enhanceTerminalReturnClosureR222(response: Response): Promise<Response> {
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;
  let html = await response.text();
  if (!html.includes('id="omegaTerminalReturnR222Runtime"')) {
    html = html.includes("</head>") ? html.replace("</head>", style + "</head>") : style + html;
    html = html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-omega-terminal-return", TERMINAL_RETURN_RELEASE_R222);
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
