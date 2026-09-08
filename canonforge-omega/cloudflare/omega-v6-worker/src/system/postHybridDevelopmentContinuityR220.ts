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

function windowsSetup(request: Request): Response {
  const origin = new URL(request.url).origin;
  const cmd = `@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "OMEGA_SERVER=${origin}"
set "OMEGA_HOME=%LOCALAPPDATA%\\OMEGA"
set "OMEGA_AGENT=%OMEGA_HOME%\\omega_sovereign_agent.py"
set "OMEGA_PAIRING=%TEMP%\\omega_r220_pairing_%RANDOM%.cmd"
set "OMEGA_TOKEN_FILE=%TEMP%\\omega_r220_token_%RANDOM%.txt"
if not exist "%OMEGA_HOME%" mkdir "%OMEGA_HOME%"

echo ============================================================
echo OMEGA R220 FULL HYBRID + SOVEREIGN DEVELOPMENT SETUP
echo ============================================================
echo Canonical: %OMEGA_SERVER%
echo.

echo [1/10] Resolving the canonical approved workspace...
set "OMEGA_ROOT="
set "OMEGA_SERVER_ROOT="
for /f "delims=" %%R in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $d=Invoke-RestMethod -Uri '%OMEGA_SERVER%/api/development/status' -TimeoutSec 20; if($d.approved_root){[Console]::Out.Write([string]$d.approved_root)}" 2^>nul') do set "OMEGA_SERVER_ROOT=%%R"
if defined OMEGA_SERVER_ROOT if exist "%OMEGA_SERVER_ROOT%\\pyproject.toml" set "OMEGA_ROOT=%OMEGA_SERVER_ROOT%"
if not defined OMEGA_ROOT if exist "%OMEGA_HOME%\\canonical-root.txt" set /p OMEGA_ROOT=<"%OMEGA_HOME%\\canonical-root.txt"
if defined OMEGA_ROOT if not exist "%OMEGA_ROOT%\\pyproject.toml" set "OMEGA_ROOT="
if not defined OMEGA_ROOT if exist "%~dp0pyproject.toml" set "OMEGA_ROOT=%~dp0"
if not defined OMEGA_ROOT goto :root_error
if not exist "%OMEGA_ROOT%\\scripts\\omega_sovereign_agent.py" goto :root_error
if not exist "%OMEGA_ROOT%\\cloudflare\\omega-v6-worker" goto :root_error
>"%OMEGA_HOME%\\canonical-root.txt" echo %OMEGA_ROOT%
echo Approved root: %OMEGA_ROOT%

echo [2/10] Verifying required development toolchain...
where git >nul 2>nul || goto :git_error
where npm >nul 2>nul || goto :node_error
where npx >nul 2>nul || goto :node_error

echo [3/10] Selecting Python 3.10+...
set "PYBOOT="
py -3.12 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3.12"
if not defined PYBOOT py -3.11 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3.11"
if not defined PYBOOT py -3.10 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3.10"
if not defined PYBOOT py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=py -3"
if not defined PYBOOT python -c "import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)" >nul 2>nul && set "PYBOOT=python"
if not defined PYBOOT goto :python_error

echo [4/10] Establishing the verified OMEGA virtual environment...
set "OMEGA_PY=%OMEGA_ROOT%\\.venv\\Scripts\\python.exe"
if not exist "%OMEGA_PY%" (
  %PYBOOT% -m venv "%OMEGA_ROOT%\\.venv" || goto :venv_error
)
"%OMEGA_PY%" -m pip install --upgrade pip || goto :dependency_error
"%OMEGA_PY%" -m pip install -e "%OMEGA_ROOT%[dev,rcwa]" || goto :dependency_error

echo [5/10] Proving native RCWA and sovereign runtime imports...
"%OMEGA_PY%" -c "import omega_runtime, grcwa; print('OMEGA_RUNTIME_AND_GRCWA_READY')" || goto :dependency_error
"%OMEGA_PY%" -m omega_runtime.rcwa_solver --probe > "%OMEGA_HOME%\\r220_rcwa_probe.json" || goto :rcwa_error
findstr /C:"\"available\": true" "%OMEGA_HOME%\\r220_rcwa_probe.json" >nul || goto :rcwa_error

echo [6/10] Requesting a fresh one-time pairing credential...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_SERVER%/api/hybrid/launcher' -OutFile '%OMEGA_PAIRING%' -TimeoutSec 30" || goto :pair_error
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $t=Get-Content -Raw -LiteralPath '%OMEGA_PAIRING%'; $m=[regex]::Match($t,'set \"\"OMEGA_TOKEN=([^\"\"]+)\"\"'); if(-not $m.Success){throw 'pairing token missing'}; Set-Content -NoNewline -Encoding ascii -LiteralPath '%OMEGA_TOKEN_FILE%' -Value $m.Groups[1].Value" || goto :pair_error
set /p OMEGA_TOKEN=<"%OMEGA_TOKEN_FILE%"
del /q "%OMEGA_PAIRING%" "%OMEGA_TOKEN_FILE%" >nul 2>nul
if not defined OMEGA_TOKEN goto :pair_error

echo [7/10] Downloading the exact canonical sovereign agent...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_SERVER%/api/hybrid/agent' -OutFile '%OMEGA_AGENT%' -TimeoutSec 30" || goto :download_error
findstr /C:"bounded recursive development agent" "%OMEGA_AGENT%" >nul || goto :download_error

echo [8/10] Starting authenticated Hybrid heartbeat + governed executor...
start "OMEGA Sovereign Agent" /min "%OMEGA_PY%" "%OMEGA_AGENT%" --server "%OMEGA_SERVER%" --token "%OMEGA_TOKEN%" --root "%OMEGA_ROOT%" --interval 8

echo [9/10] Waiting for current authenticated PC proof...
set "OMEGA_LINKED="
for /L %%I in (1,1,40) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $d=Invoke-RestMethod -Uri '%OMEGA_SERVER%/api/system/r220/status' -TimeoutSec 10; if($d.linkProven -eq $true){exit 0}else{exit 1}" >nul 2>nul
  if not errorlevel 1 set "OMEGA_LINKED=1"
  if defined OMEGA_LINKED goto :linked
  timeout /t 2 /nobreak >nul
)
goto :link_error

:linked
echo Hybrid link authenticated and current.
echo [10/10] Resuming governed development and proving post-link continuity...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $body=@{confirmed=$true}|ConvertTo-Json -Compress; $d=Invoke-RestMethod -Method Post -Uri '%OMEGA_SERVER%/api/system/r220/resume' -ContentType 'application/json' -Body $body -TimeoutSec 20; $d|ConvertTo-Json -Depth 20|Set-Content -Encoding utf8 '%OMEGA_HOME%\\r220_resume.json'; if($d.resumed -ne $true){exit 2}" || goto :resume_error
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=Invoke-RestMethod -Uri '%OMEGA_SERVER%/api/system/r220/status' -TimeoutSec 20; $d|ConvertTo-Json -Depth 30|Set-Content -Encoding utf8 '%OMEGA_HOME%\\r220_status.json'; Write-Host ('R220 state: '+$d.state); Write-Host ('Link proven: '+$d.linkProven); Write-Host ('Host execution proven: '+$d.hostExecutionProven); Write-Host ('Continuity proven: '+$d.continuityProven); if($d.activeJob){Write-Host ('Active job: '+$d.activeJob.kind+' / '+$d.activeJob.state)}"
echo.
echo OMEGA R220 FULL HYBRID SETUP IS ACTIVE.
echo The agent stays running and continuously leases only governed allow-listed jobs.
echo Proof files: %OMEGA_HOME%\\r220_status.json and r220_resume.json
echo Re-open the Hybrid surface to watch LINK -^> EXECUTION -^> RETURN -^> NEXT STAGE.
pause
exit /b 0

:root_error
echo ROOT ERROR: OMEGA could not locate the canonical repository workspace.
echo Run this setup on the same PC that contains canonforge-omega, or run the repository Windows installer once so %%LOCALAPPDATA%%\\OMEGA\\canonical-root.txt exists.
goto :fail
:git_error
echo TOOLCHAIN ERROR: Git is required for convergence and workspace lineage proof.
goto :fail
:node_error
echo TOOLCHAIN ERROR: Node.js npm/npx are required for TypeScript validation and Wrangler dry-run.
goto :fail
:python_error
echo TOOLCHAIN ERROR: Python 3.10+ was not found.
goto :fail
:venv_error
echo VENV ERROR: the verified OMEGA virtual environment could not be created.
goto :fail
:dependency_error
echo DEPENDENCY ERROR: OMEGA Python/dev/RCWA dependencies did not install or import correctly.
goto :fail
:rcwa_error
echo RCWA ERROR: native grcwa acceptance probe failed. No fallback is promoted as full-wave RCWA.
goto :fail
:pair_error
echo PAIRING ERROR: a fresh authenticated Hybrid credential could not be issued or parsed.
goto :fail
:download_error
echo AGENT ERROR: canonical sovereign agent download or contract validation failed.
goto :fail
:link_error
echo LINK ERROR: the agent started but current authenticated PC proof did not arrive within the bounded window.
goto :fail
:resume_error
echo DEVELOPMENT ERROR: Hybrid linked, but the governed development loop could not be resumed.
goto :fail
:fail
del /q "%OMEGA_PAIRING%" "%OMEGA_TOKEN_FILE%" >nul 2>nul
pause
exit /b 1
`;
  return new Response(cmd, {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": 'attachment; filename="START_OMEGA_R220_FULL_HYBRID.cmd"',
      "cache-control": "no-store",
      "x-omega-r220-setup": "verified-venv-pairing-auto-resume",
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
  const isSetup = url.pathname === "/api/system/r220/setup" || url.pathname === "/api/system/r220/setup/";
  if (!isStatus && !isResume && !isSetup) return null;

  if (isSetup) {
    if (request.method !== "GET") return json({ ok: false, schema: SCHEMA, release: RELEASE, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
    return windowsSetup(request);
  }
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
      setupDownload: "/api/system/r220/setup",
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
    setupDownload: "/api/system/r220/setup",
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
var setup=document.createElement('a');setup.className='btn primary';setup.id='omegaR220Setup';setup.href='/api/system/r220/setup';setup.setAttribute('download','START_OMEGA_R220_FULL_HYBRID.cmd');setup.textContent='Download full Hybrid setup';controls.insertBefore(setup,controls.firstChild);
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