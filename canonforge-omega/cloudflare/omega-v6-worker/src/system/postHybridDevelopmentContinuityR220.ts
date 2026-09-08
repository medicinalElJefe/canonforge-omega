type RuntimeFetch = (request: Request, env: any, ctx: any) => Promise<Response>;

const SCHEMA = "OMEGA_POST_HYBRID_DEVELOPMENT_CONTINUITY_R220";
const RELEASE = "r220-post-hybrid-development-continuity";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-omega-r220": RELEASE,
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

function linkProof(hybrid: any): boolean {
  return Boolean(
    hybrid &&
      hybrid.heartbeatCurrent === true &&
      (hybrid.authenticated === true || hybrid.agentAuthenticated === true) &&
      hybrid.pcOnline === true,
  );
}

function developmentFacts(hybrid: any, development: any) {
  const provenLink = linkProof(hybrid);
  const active = development?.active_job || null;
  const recent = Array.isArray(development?.recent_jobs) ? development.recent_jobs : [];
  const verified = recent.filter((job: any) => job?.state === "VERIFIED" && job?.evidence && Object.keys(job.evidence).length > 0);
  const latestTerminal = [...recent].reverse().find((job: any) => ["VERIFIED", "FAILED", "BLOCKED", "CANCELLED"].includes(String(job?.state || ""))) || null;
  const activeState = String(active?.state || "");
  const latestVerified = verified.length ? verified[verified.length - 1] : null;
  const advancedAfterReturn = Boolean(
    provenLink &&
      latestVerified &&
      active &&
      active.id &&
      active.id !== latestVerified.id,
  );

  let state = "LINK_UNPROVEN";
  if (hybrid?.heartbeatStale === true) state = "LINK_STALE";
  if (provenLink) state = "LINK_AUTHENTICATED";
  if (provenLink && activeState === "QUEUED") state = verified.length ? "DEVELOPMENT_ADVANCING" : "DEVELOPMENT_QUEUED";
  if (provenLink && (activeState === "LEASED" || activeState === "RUNNING")) state = "HOST_EXECUTING";
  if (provenLink && !active && latestTerminal?.state === "VERIFIED") state = "HOST_RETURNED";
  if (provenLink && latestTerminal && (latestTerminal.state === "FAILED" || latestTerminal.state === "BLOCKED")) state = "BLOCKED";
  if (advancedAfterReturn) state = "DEVELOPMENT_ADVANCING";

  return {
    state,
    linkProven: provenLink,
    eligibleToResume: provenLink,
    developmentActive: Boolean(active),
    hostExecutionProven: verified.length > 0,
    continuityProven: advancedAfterReturn,
    verifiedHostResults: verified.length,
    activeJob: active,
    latestVerified,
    latestTerminal,
    developmentMode: development?.mode || null,
    approvedRoot: development?.approved_root || hybrid?.proof?.approved_root || null,
  };
}

function truthBoundary(facts: ReturnType<typeof developmentFacts>) {
  return {
    heartbeatIsNotExecution: true,
    linkProvenIsNotHostExecutionProof: facts.linkProven && !facts.hostExecutionProven,
    hostExecutionRequiresReturnedVerifiedJobEvidence: true,
    continuityRequiresVerifiedReturnPlusDifferentNextActiveJob: true,
    typedAllowListedJobsOnly: true,
    arbitraryShell: false,
    canonicalMutation: false,
    githubMutation: false,
    deploymentAuthorized: false,
    promotionAuthorized: false,
    automaticProductionMutation: false,
  };
}

export async function handlePostHybridDevelopmentR220(
  request: Request,
  env: any,
  ctx: any,
  nextFetch: RuntimeFetch,
): Promise<Response | null> {
  const url = new URL(request.url);
  const isStatus = url.pathname === "/api/system/r220/status" || url.pathname === "/api/system/r220/status/";
  const isResume = url.pathname === "/api/system/r220/resume" || url.pathname === "/api/system/r220/resume/";
  if (!isStatus && !isResume) return null;

  if (isStatus && request.method !== "GET") {
    return json({ ok: false, schema: SCHEMA, release: RELEASE, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
  }
  if (isResume && request.method !== "POST") {
    return json({ ok: false, schema: SCHEMA, release: RELEASE, code: "METHOD_NOT_ALLOWED", allowed: ["POST"] }, 405);
  }

  const hybridResult = await callJson(nextFetch, request, env, ctx, "/api/hybrid/status");
  const developmentResult = await callJson(nextFetch, request, env, ctx, "/api/development/status");
  const facts = developmentFacts(hybridResult.data, developmentResult.data);

  if (isStatus) {
    return json({
      ok: hybridResult.ok && developmentResult.ok,
      schema: SCHEMA,
      release: RELEASE,
      canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
      ...facts,
      hybrid: hybridResult.data,
      development: developmentResult.data,
      sourceStatus: {
        hybrid: hybridResult.status,
        development: developmentResult.status,
      },
      truthBoundary: truthBoundary(facts),
    }, hybridResult.ok && developmentResult.ok ? 200 : 503);
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
      boundary: "resume is bounded to the existing allow-listed development loop and does not authorize arbitrary shell, source mutation, GitHub mutation, deployment, or promotion",
    }, 422);
  }

  if (!facts.linkProven) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "CURRENT_AUTHENTICATED_HYBRID_LINK_REQUIRED",
      state: facts.state,
      linkProven: false,
      hybrid: hybridResult.data,
      truthBoundary: truthBoundary(facts),
    }, 409);
  }

  const modeResult = await callJson(nextFetch, request, env, ctx, "/api/development/mode", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "DEVELOPMENT_LOOP" }),
  });
  if (!modeResult.ok) {
    return json({
      ok: false,
      schema: SCHEMA,
      release: RELEASE,
      code: "DEVELOPMENT_LOOP_RESUME_FAILED",
      sourceStatus: modeResult.status,
      detail: modeResult.data,
      truthBoundary: truthBoundary(facts),
    }, 502);
  }

  const afterResult = await callJson(nextFetch, request, env, ctx, "/api/development/status");
  const afterFacts = developmentFacts(hybridResult.data, afterResult.data);
  return json({
    ok: afterResult.ok,
    schema: SCHEMA,
    release: RELEASE,
    resumed: true,
    canonicalGitSha: env?.CANONICAL_GIT_SHA || null,
    ...afterFacts,
    development: afterResult.data,
    truthBoundary: truthBoundary(afterFacts),
  }, afterResult.ok ? 200 : 502);
}

const R220_MARKER = "OMEGA_POST_HYBRID_DEVELOPMENT_SURFACE_R220";

export async function enhancePostHybridDevelopmentR220(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const html = await response.text();
  if (!html.includes('data-view="Hybrid"') || html.includes(R220_MARKER)) {
    return new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
  }

  const injection = `<script id="${R220_MARKER}">(function(){
var panel=document.querySelector('[data-view="Hybrid"]');if(!panel)return;
var controls=panel.querySelector('.controls');var rail=panel.querySelector('.buildRail');if(!controls||!rail)return;
var card=document.createElement('div');card.id='omegaR220Continuity';card.className='job';card.innerHTML='<span>POST-HYBRID</span><span class="muted" id="omegaR220Message">Proving link → execution → return → next development stage…</span><b id="omegaR220State">CHECKING</b>';rail.insertBefore(card,rail.firstChild);
var button=document.createElement('button');button.className='btn primary';button.id='omegaR220Resume';button.textContent='Resume governed development';button.disabled=true;controls.appendChild(button);
var proof=document.createElement('details');proof.className='proof';proof.innerHTML='<summary>Post-Hybrid continuity proof</summary><pre id="omegaR220Proof">No R220 proof loaded.</pre>';var side=panel.querySelector('.hybridStage aside.panel');if(side)side.appendChild(proof);
function setState(d){var state=String(d&&d.state||'STATUS_UNAVAILABLE');var msg='Hybrid link is not yet proven.';if(state==='LINK_AUTHENTICATED')msg='Authenticated link proven. Development can resume on the bounded allow-list.';if(state==='DEVELOPMENT_QUEUED')msg='A governed development job is queued for the authenticated host.';if(state==='HOST_EXECUTING')msg='The authenticated host has leased or is running a governed development job.';if(state==='HOST_RETURNED')msg='Verified host evidence returned; waiting for the next bounded stage.';if(state==='DEVELOPMENT_ADVANCING')msg='Verified host evidence returned and a different next development stage is active.';if(state==='BLOCKED')msg='Development returned a blocked/failed terminal state. Inspect the returned evidence before continuing.';if(state==='LINK_STALE')msg='Heartbeat is stale; execution and development claims are withheld.';document.getElementById('omegaR220State').textContent=state;document.getElementById('omegaR220Message').textContent=msg;button.disabled=!(d&&d.eligibleToResume===true);document.getElementById('omegaR220Proof').textContent=JSON.stringify(d,null,2);}
async function load(){try{var r=await fetch('/api/system/r220/status',{cache:'no-store'});var d=await r.json();setState(d);}catch(e){setState({state:'STATUS_UNAVAILABLE',eligibleToResume:false,error:String(e)});}}
button.addEventListener('click',async function(){button.disabled=true;button.textContent='Resuming governed development…';try{var r=await fetch('/api/system/r220/resume',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({confirmed:true}),cache:'no-store'});var d=await r.json();setState(d);button.textContent=r.ok?'Development loop active':'Resume blocked';}catch(e){setState({state:'STATUS_UNAVAILABLE',eligibleToResume:false,error:String(e)});button.textContent='Resume failed';}setTimeout(function(){button.textContent='Resume governed development';load();},1800);});
load();setInterval(function(){if(document.body.contains(panel))load();},4000);
})();</script>`;

  const rendered = html.includes("</body>") ? html.replace("</body>", injection + "</body>") : html + injection;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  headers.set("x-omega-r220-surface", "post-hybrid-development-continuity");
  return new Response(rendered, { status: response.status, statusText: response.statusText, headers });
}
