type RuntimeFetch = (request: Request, env: any, ctx: any) => Promise<Response>;

const SCHEMA = "OMEGA_GOVERNED_LOCAL_TRAINING_R221";
const RELEASE = "r221-governed-local-training-and-r195-closure";
const TRAINING_KIND = "sai_repository_index";
const ACTIVE_STATES = new Set(["QUEUED", "LEASED", "RUNNING"]);
const TERMINAL_STATES = new Set(["VERIFIED", "BLOCKED", "FAILED", "CANCELLED"]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-r221": RELEASE,
    },
  });
}

function requestFor(source: Request, pathname: string, init?: RequestInit): Request {
  const target = new URL(source.url);
  target.pathname = pathname;
  target.search = "";
  const headers = new Headers(source.headers);
  headers.delete("content-length");
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  return new Request(target.toString(), {
    method: init?.method || "GET",
    headers,
    body: init?.body,
  });
}

async function callJson(
  nextFetch: RuntimeFetch,
  request: Request,
  env: any,
  ctx: any,
  pathname: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const response = await nextFetch(requestFor(request, pathname, init), env, ctx);
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function allDevelopmentJobs(development: any): any[] {
  const recent = Array.isArray(development?.recent_jobs) ? development.recent_jobs : [];
  const active = development?.active_job || null;
  const ordered: any[] = [];
  const seen = new Set<string>();
  for (const job of [...recent, active].filter(Boolean)) {
    const id = String(job?.id || "");
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    ordered.push(job);
  }
  return ordered;
}

function trainingFacts(r220: any, development: any) {
  const jobs = allDevelopmentJobs(development).filter(job => job?.kind === TRAINING_KIND);
  const activeTraining = [...jobs].reverse().find(job => ACTIVE_STATES.has(String(job?.state || ""))) || null;
  const latestTraining = jobs.length ? jobs[jobs.length - 1] : null;
  const latestTerminal = [...jobs].reverse().find(job => TERMINAL_STATES.has(String(job?.state || ""))) || null;
  const linkProven = r220?.linkProven === true;
  const latestVerified = [...jobs].reverse().find(
    job => job?.state === "VERIFIED" && job?.evidence && Object.keys(job.evidence).length > 0,
  ) || null;

  let state = linkProven ? "READY_TO_TRAIN" : "LINK_REQUIRED";
  const activeState = String(activeTraining?.state || "");
  if (activeState === "QUEUED") state = "TRAINING_QUEUED";
  if (activeState === "LEASED" || activeState === "RUNNING") state = "TRAINING_RUNNING";
  if (!activeTraining && latestTerminal?.state === "VERIFIED" && latestVerified?.id === latestTerminal.id) state = "TRAINING_VERIFIED";
  if (!activeTraining && latestTerminal?.state === "BLOCKED") state = "TRAINING_BLOCKED";
  if (!activeTraining && latestTerminal?.state === "FAILED") state = "TRAINING_FAILED";
  if (!activeTraining && latestTerminal?.state === "CANCELLED") state = "TRAINING_CANCELLED";

  return {
    state,
    linkProven,
    eligibleToTrain: linkProven && !activeTraining,
    trainingActive: Boolean(activeTraining),
    trainingExecutionProven: Boolean(latestVerified),
    trainingJobId: activeTraining?.id || latestTraining?.id || null,
    activeTrainingJob: activeTraining,
    latestTrainingJob: latestTraining,
    latestVerifiedTraining: latestVerified,
    latestTrainingEvidence: latestVerified?.evidence || null,
  };
}

function truthBoundary() {
  return {
    heartbeatIsLinkProofOnly: true,
    connectedDoesNotMeanRunning: true,
    runningRequiresLeasedSaiRepositoryIndexJob: true,
    verifiedRequiresReturnedEvidence: true,
    exactTrainingKind: TRAINING_KIND,
    trainingScope: "LOCAL_REPOSITORY_INDEX_ONLY",
    foundationModelWeightsTrainedClaim: false,
    arbitraryShell: false,
    arbitraryJobKind: false,
    canonicalMutation: false,
    githubMutation: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
  };
}

async function statusPayload(request: Request, env: any, ctx: any, nextFetch: RuntimeFetch) {
  const r220 = await callJson(nextFetch, request, env, ctx, "/api/system/r220/status");
  const development = await callJson(nextFetch, request, env, ctx, "/api/development/status");
  const facts = trainingFacts(r220.data, development.data);
  return {
    ok: r220.ok && development.ok,
    status: r220.ok && development.ok ? 200 : 503,
    payload: {
      schema: SCHEMA,
      release: RELEASE,
      canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
      ...facts,
      r220: r220.data,
      development: development.data,
      sourceStatus: { r220: r220.status, development: development.status },
      truthBoundary: truthBoundary(),
    },
  };
}

export async function handleGovernedLocalTrainingR221(
  request: Request,
  env: any,
  ctx: any,
  nextFetch: RuntimeFetch,
): Promise<Response | null> {
  const url = new URL(request.url);
  const isStatus = url.pathname === "/api/system/r221/status" || url.pathname === "/api/system/r221/status/";
  const isTrain = url.pathname === "/api/system/r221/train-local" || url.pathname === "/api/system/r221/train-local/";
  if (!isStatus && !isTrain) return null;

  if (isStatus && request.method !== "GET") {
    return json({ ok: false, schema: SCHEMA, release: RELEASE, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  }
  if (isTrain && request.method !== "POST") {
    return json({ ok: false, schema: SCHEMA, release: RELEASE, code: "METHOD_NOT_ALLOWED", allowed: ["POST"] }, 405);
  }

  if (isStatus) {
    const current = await statusPayload(request, env, ctx, nextFetch);
    return json({ ok: current.ok, ...current.payload }, current.status);
  }

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  if (!body || body.confirmed !== true) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "EXPLICIT_CONFIRMATION_REQUIRED",
      boundary: "Train locally dispatches only the allow-listed sai_repository_index job to the authenticated sovereign host.",
      truthBoundary: truthBoundary(),
    }, 422);
  }

  const before = await statusPayload(request, env, ctx, nextFetch);
  const beforeFacts = trainingFacts(before.payload.r220, before.payload.development);
  if (!beforeFacts.linkProven) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "CURRENT_AUTHENTICATED_HYBRID_LINK_REQUIRED",
      state: beforeFacts.state,
      linkProven: false,
      r220: before.payload.r220,
      truthBoundary: truthBoundary(),
    }, 409);
  }

  if (beforeFacts.activeTrainingJob) {
    return json({
      ok: true,
      schema: SCHEMA,
      release: RELEASE,
      queued: true,
      deduplicated: true,
      canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
      ...beforeFacts,
      job: beforeFacts.activeTrainingJob,
      truthBoundary: truthBoundary(),
    });
  }

  const enqueue = await callJson(nextFetch, request, env, ctx, "/api/development/enqueue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: TRAINING_KIND,
      reason: "R221 explicit operator request: build a fresh deterministic source-grounded local repository index on the authenticated sovereign host and return evidence before representing training as verified.",
      payload: {
        requested_by: "R221_TRAIN_LOCALLY",
        canonical_git_sha: env?.CANONICAL_GIT_SHA || null,
        training_scope: "LOCAL_REPOSITORY_INDEX_ONLY",
        foundation_model_weights_trained: false,
        canonical_mutation: false,
        github_mutation: false,
        deployment_authorized: false,
        promotion_authorized: false,
      },
    }),
  });
  if (!enqueue.ok) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "LOCAL_TRAINING_ENQUEUE_FAILED",
      sourceStatus: enqueue.status,
      detail: enqueue.data,
      truthBoundary: truthBoundary(),
    }, enqueue.status >= 400 && enqueue.status < 600 ? enqueue.status : 502);
  }

  const after = await statusPayload(request, env, ctx, nextFetch);
  const afterFacts = trainingFacts(after.payload.r220, after.payload.development);
  return json({
    ok: true,
    schema: SCHEMA,
    release: RELEASE,
    queued: true,
    deduplicated: false,
    canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
    ...afterFacts,
    job: enqueue.data,
    development: after.payload.development,
    truthBoundary: truthBoundary(),
  }, 202);
}

const R221_MARKER = "OMEGA_GOVERNED_LOCAL_TRAINING_SURFACE_R221";

export async function enhanceGovernedLocalTrainingR221(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const html = await response.text();
  if (!html.includes('data-view="Hybrid"') || html.includes(R221_MARKER)) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const injection = `<script id="${R221_MARKER}">(function(){
var panel=document.querySelector('[data-view="Hybrid"]');if(!panel)return;
var controls=panel.querySelector('.controls');var rail=panel.querySelector('.buildRail');if(!controls||!rail)return;
Array.from(panel.querySelectorAll('button,a')).forEach(function(el){if(el.id!=='omegaR221TrainLocal'&&/train\\s+locally/i.test(String(el.textContent||''))){el.setAttribute('data-r221-superseded','true');el.style.display='none';}});
var button=document.createElement('button');button.className='btn primary';button.id='omegaR221TrainLocal';button.textContent='Train locally now';button.disabled=true;controls.appendChild(button);
var card=document.createElement('div');card.id='omegaR221Training';card.className='job';card.innerHTML='<span>LOCAL SAI TRAINING</span><span class="muted" id="omegaR221TrainingMessage">Waiting for current authenticated Hybrid proof…</span><b id="omegaR221TrainingState">CHECKING</b>';rail.insertBefore(card,rail.firstChild);
var proof=document.createElement('details');proof.className='proof';proof.innerHTML='<summary>Local training dispatch proof</summary><pre id="omegaR221TrainingProof">No R221 training proof loaded.</pre>';var side=panel.querySelector('.hybridStage aside.panel');if(side)side.appendChild(proof);
function setState(d){var state=String(d&&d.state||'STATUS_UNAVAILABLE');var msg='Current authenticated Hybrid proof is required before local training can be queued.';if(state==='READY_TO_TRAIN')msg='PC link is current. Train locally will enqueue the real sai_repository_index job.';if(state==='TRAINING_QUEUED')msg='Local SAI repository indexing is queued; this is not execution proof.';if(state==='TRAINING_RUNNING')msg='The authenticated sovereign host leased the local SAI repository-index job and is executing it.';if(state==='TRAINING_VERIFIED')msg='Local SAI repository indexing returned VERIFIED evidence from the sovereign host.';if(state==='TRAINING_BLOCKED')msg='Local training is BLOCKED. Inspect the returned job evidence/error and repair the stated prerequisite.';if(state==='TRAINING_FAILED')msg='Local training FAILED. Inspect the returned job evidence/error before retrying.';if(state==='TRAINING_CANCELLED')msg='Local training was cancelled and is not verified.';document.getElementById('omegaR221TrainingState').textContent=state;document.getElementById('omegaR221TrainingMessage').textContent=msg;button.disabled=!(d&&d.eligibleToTrain===true);document.getElementById('omegaR221TrainingProof').textContent=JSON.stringify(d,null,2);}
async function load(){try{var r=await fetch('/api/system/r221/status',{cache:'no-store'});var d=await r.json();setState(d);}catch(e){setState({state:'STATUS_UNAVAILABLE',eligibleToTrain:false,error:String(e)});}}
button.addEventListener('click',async function(){button.disabled=true;button.textContent='Queueing local training…';try{var r=await fetch('/api/system/r221/train-local',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmed:true}),cache:'no-store'});var d=await r.json();setState(d);button.textContent=r.ok?'Local training queued':'Training blocked';}catch(e){setState({state:'STATUS_UNAVAILABLE',eligibleToTrain:false,error:String(e)});button.textContent='Training failed';}setTimeout(function(){button.textContent='Train locally now';load();},1800);});
load();setInterval(function(){if(document.body.contains(panel))load();},4000);
})();</script>`;

  const rendered = html.includes("</body>") ? html.replace("</body>", injection + "</body>") : html + injection;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  headers.set("x-omega-r221-surface", "governed-local-training");
  return new Response(rendered, { status: response.status, statusText: response.statusText, headers });
}
