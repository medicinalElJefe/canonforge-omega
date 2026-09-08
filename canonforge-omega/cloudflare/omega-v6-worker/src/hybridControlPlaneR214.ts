export const HYBRID_CONTROL_PLANE_R214 = "r214-durable-outbound-hybrid-control-plane";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });

type DurableStub = { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };
type DurableNamespace = { idFromName(name: string): unknown; get(id: unknown): DurableStub };
type HybridEnv = { OMEGA_RUNTIME?: DurableNamespace; SOVEREIGN_GATEWAY_TOKEN?: string };

// R203 established this exact singleton string. R214 must reuse it or Durable Object
// storage continuity would be false even if the binding name stayed unchanged.
const CANONICAL_HYBRID_SINGLETON_R214 = "OMEGA_RUNTIME";

const LAUNCHER_BOOTSTRAP = String.raw`@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "OMEGA_LOCAL=http://127.0.0.1:8127"
set "OMEGA_LOCAL_LAUNCHER=%TEMP%\OMEGA_R214_LOCAL_LAUNCHER.cmd"
echo OMEGA R214 Sovereign PC Link Bootstrap
echo This bootstrap obtains the pairing credential only from your localhost OMEGA runtime.
echo It does not issue a public cloud pairing credential.
echo [1/3] Checking local sovereign runtime...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_LOCAL%/api/hybrid/status' -TimeoutSec 8 ^| Out-Null" || goto :local_error
echo [2/3] Requesting locally minted secure launcher...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '%OMEGA_LOCAL%/api/hybrid/launcher' -OutFile '%OMEGA_LOCAL_LAUNCHER%' -TimeoutSec 12" || goto :launcher_error
findstr /C:"OMEGA Sovereign PC Link" "%OMEGA_LOCAL_LAUNCHER%" >nul || goto :launcher_error
echo [3/3] Starting local-authority Hybrid session...
call "%OMEGA_LOCAL_LAUNCHER%"
set "RC=%ERRORLEVEL%"
del /q "%OMEGA_LOCAL_LAUNCHER%" >nul 2>nul
exit /b %RC%
:local_error
echo LOCAL RUNTIME REQUIRED: http://127.0.0.1:8127 is not responding.
echo Start the installed OMEGA V6 Windows runtime first. No cloud-to-PC fallback was attempted.
pause
exit /b 31
:launcher_error
echo LOCAL LAUNCHER ERROR: localhost did not return a valid OMEGA launcher.
echo No public credential was substituted and no inbound PC gateway was attempted.
pause
exit /b 32
`;

const AGENT_SOURCE = String.raw`from __future__ import annotations
# OMEGA sovereign heartbeat - R214 outbound agent compatibility marker.
import argparse, hashlib, json, os, shutil, subprocess, sys, time, urllib.request, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

OPS = ["TRAIN_LOCAL","INDEX","READ_TEXT","SEARCH_TEXT","HASH_TREE","SAFE_IMPORT","WORKBOOK_AUDIT","BUILD","TEST","PACKAGE","SUPPORT_BUNDLE","OPEN_URL","WAIT"]

def req(base, path, secret, payload=None, extra=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    r = urllib.request.Request(base.rstrip("/")+path, data=data, method="GET" if payload is None else "POST")
    r.add_header("accept","application/json")
    if data is not None: r.add_header("content-type","application/json")
    if secret:
        r.add_header("x-omega-bridge-secret", secret)
        r.add_header("x-omega-agent-token", secret)
    for k,v in (extra or {}).items(): r.add_header(k,v)
    with urllib.request.urlopen(r, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))

def run(cmd, cwd, timeout=900):
    p = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, timeout=timeout)
    return {"exit_code":p.returncode,"stdout_tail":p.stdout[-16000:],"stderr_tail":p.stderr[-16000:],"command":[str(x) for x in cmd]}

def rel(root, raw):
    p=(root / str(raw or ".")).resolve(); rr=root.resolve()
    try: p.relative_to(rr)
    except ValueError: raise RuntimeError("path escapes approved root")
    return p

def relative_string(root, path):
    return path.resolve().relative_to(root.resolve()).as_posix()

def sha_file(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        while True:
            b=f.read(1024*1024)
            if not b: break
            h.update(b)
    return h.hexdigest()

def hash_tree(root, path="."):
    base=rel(root,path); h=hashlib.sha256(); count=0
    for p in sorted(x for x in base.rglob("*") if x.is_file() and ".git" not in x.parts):
        h.update(relative_string(root,p).encode()+b"\0")
        try:
            with p.open("rb") as f:
                while True:
                    b=f.read(1024*1024)
                    if not b: break
                    h.update(b)
        except OSError: continue
        count+=1
        if count>=10000: break
    return {"sha256":h.hexdigest(),"files":count,"path":relative_string(root,base)}

def index_tree(root, path="."):
    base=rel(root,path); rows=[]
    for p in sorted(x for x in base.rglob("*") if x.is_file() and ".git" not in x.parts):
        try: st=p.stat()
        except OSError: continue
        rows.append({"path":relative_string(root,p),"bytes":st.st_size,"mtime_ns":st.st_mtime_ns})
        if len(rows)>=5000: break
    digest=hashlib.sha256(json.dumps(rows,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    return {"files":rows,"count":len(rows),"index_sha256":digest,"truncated":len(rows)>=5000}

def safe_import(root, step):
    src=rel(root,step.get("source") or step.get("from") or "")
    dst=rel(root,step.get("destination") or step.get("to") or "")
    if not src.exists(): raise RuntimeError("SAFE_IMPORT source missing")
    if src.is_dir():
        if dst.exists(): raise RuntimeError("SAFE_IMPORT destination already exists")
        shutil.copytree(src,dst)
    else:
        dst.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(src,dst)
    return {"source":relative_string(root,src),"destination":relative_string(root,dst),"copied":True}

def workbook_audit(root, path):
    p=rel(root,path)
    if p.suffix.lower() not in {".xlsx",".xlsm"} or not zipfile.is_zipfile(p): raise RuntimeError("WORKBOOK_AUDIT requires an OOXML workbook")
    with zipfile.ZipFile(p) as z:
        names=set(z.namelist()); sheets=[]
        if "xl/workbook.xml" in names:
            tree=ET.fromstring(z.read("xl/workbook.xml"))
            for el in tree.iter():
                if el.tag.endswith("}sheet"): sheets.append({"name":el.attrib.get("name"),"state":el.attrib.get("state","visible")})
        macros="xl/vbaProject.bin" in names
        external=sorted(x for x in names if x.startswith("xl/externalLinks/"))
        formulas=0
        for name in sorted(x for x in names if x.startswith("xl/worksheets/") and x.endswith(".xml")):
            try:
                raw=z.read(name); formulas+=raw.count(b"<f")
            except Exception: pass
    return {"path":relative_string(root,p),"sha256":sha_file(p),"sheets":sheets,"sheet_count":len(sheets),"formula_tag_count":formulas,"vba_present":macros,"external_link_parts":external,"mutation":False}

def make_zip(root, source, output, limit=6000):
    src=rel(root,source); out=rel(root,output); out.parent.mkdir(parents=True,exist_ok=True)
    files=[src] if src.is_file() else sorted(x for x in src.rglob("*") if x.is_file() and ".git" not in x.parts)
    count=0
    with zipfile.ZipFile(out,"w",compression=zipfile.ZIP_DEFLATED) as z:
        for p in files:
            if p.resolve()==out.resolve(): continue
            z.write(p,relative_string(root,p)); count+=1
            if count>=limit: break
    return {"outputPath":relative_string(root,out),"sha256":sha_file(out),"files":count,"truncated":count>=limit}

def find_training(root):
    exact=root/"canonforge-omega"/"scripts"/"omega_sai_train.py"
    if exact.is_file(): return exact
    for p in root.rglob("omega_sai_train.py"):
        if p.is_file() and ".git" not in p.parts: return p
    return None

def execute_step(root, step):
    op=str(step.get("op","")).upper(); path=step.get("path") or step.get("projectPath") or "."; cwd=rel(root,path)
    if op=="READ_TEXT":
        if not cwd.is_file(): raise RuntimeError("READ_TEXT requires a file")
        return {"text":cwd.read_text(encoding="utf-8",errors="replace")[:40000],"path":relative_string(root,cwd)}
    if op=="SEARCH_TEXT":
        needle=str(step.get("query") or step.get("text") or ""); out=[]
        if not needle: raise RuntimeError("SEARCH_TEXT requires query")
        for p in root.rglob("*"):
            if not p.is_file() or ".git" in p.parts: continue
            try: s=p.read_text(encoding="utf-8",errors="ignore")
            except OSError: continue
            if needle.lower() in s.lower(): out.append(relative_string(root,p))
            if len(out)>=200: break
        return {"query":needle,"matches":out,"truncated":len(out)>=200}
    if op=="HASH_TREE": return hash_tree(root,path)
    if op=="INDEX": return index_tree(root,path)
    if op=="SAFE_IMPORT": return safe_import(root,step)
    if op=="WORKBOOK_AUDIT": return workbook_audit(root,path)
    if op=="WAIT": time.sleep(min(30,max(0,float(step.get("seconds") or 1)))); return {"waited":True}
    if op=="OPEN_URL":
        url=str(step.get("url") or "")
        if not url.startswith("https://"): raise RuntimeError("HTTPS required")
        if os.name=="nt": subprocess.Popen(["cmd","/c","start","",url], cwd=str(root)); return {"opened":url}
        return {"blocked":True,"reason":"OPEN_URL is only installed for the Windows host in R214"}
    if op=="TRAIN_LOCAL":
        script=find_training(root)
        if not script: return {"blocked":True,"reason":"omega_sai_train.py is not present inside the approved root"}
        return run([sys.executable,str(script)],script.parent,1800)
    if op=="TEST":
        profile=str(step.get("profile") or "PYTHON_TEST")
        if profile in {"PYTHON_TEST","AUTO_BUILD"}: cmd=[sys.executable,"-m","pytest","-q"]
        elif (cwd/"package.json").exists(): cmd=["npm","test","--","--runInBand"]
        else: return {"blocked":True,"reason":"No truthful TEST adapter was detected for this project path"}
        return run(cmd,cwd)
    if op=="BUILD":
        profile=str(step.get("profile") or "AUTO_BUILD")
        if profile=="DOTNET_BUILD" or (cwd.glob("*.csproj") and any(cwd.glob("*.csproj"))): cmd=["dotnet","build"]
        elif (cwd/"package.json").exists(): cmd=["npm","run","build"]
        elif any(cwd.rglob("*.py")): cmd=[sys.executable,"-m","compileall","-q",str(cwd)]
        else: return {"blocked":True,"reason":"No truthful BUILD adapter was detected for this project path"}
        return run(cmd,cwd)
    if op=="PACKAGE":
        output=step.get("output") or ".omega/r214/package.zip"
        return make_zip(root,path,output)
    if op=="SUPPORT_BUNDLE":
        paths=step.get("supportPaths") or step.get("paths") or []
        if not isinstance(paths,list) or not paths: return {"blocked":True,"reason":"SUPPORT_BUNDLE requires explicit supportPaths; R214 will not sweep unrelated host data"}
        output=step.get("output") or ".omega/r214/support-bundle.zip"; out=rel(root,output); out.parent.mkdir(parents=True,exist_ok=True); count=0
        with zipfile.ZipFile(out,"w",compression=zipfile.ZIP_DEFLATED) as z:
            for raw in paths[:40]:
                p=rel(root,raw)
                if p.is_file(): z.write(p,relative_string(root,p)); count+=1
        return {"outputPath":relative_string(root,out),"sha256":sha_file(out),"files":count}
    return {"blocked":True,"reason":"operation is not installed in the R214 agent: "+op}

def main():
    ap=argparse.ArgumentParser(description="OMEGA R214 explicit-authority outbound Hybrid agent")
    ap.add_argument("--server",default=os.getenv("OMEGA_SERVER","https://omegav6.jeffdeweyeljefe.workers.dev")); ap.add_argument("--token",default=os.getenv("OMEGA_TOKEN",os.getenv("OMEGA_AGENT_TOKEN","")))
    ap.add_argument("--root",default=os.getenv("OMEGA_APPROVED_ROOT",str(Path.cwd()))); ap.add_argument("--agent-id",default=os.getenv("OMEGA_AGENT_ID",os.environ.get("COMPUTERNAME","omega-pc"))); ap.add_argument("--interval",type=float,default=5.0)
    a=ap.parse_args(); root=Path(a.root.strip('"')).resolve()
    if not a.token: print("PAIRING REQUIRED: no locally minted bridge credential",file=sys.stderr); return 3
    if not root.is_dir(): print("APPROVED ROOT INVALID: "+str(root),file=sys.stderr); return 2
    print("OMEGA R214 Hybrid Link")
    print("Canonical server:",a.server); print("Approved root:",root); print("Device:",a.agent_id)
    print("Installed operation envelope:",", ".join(OPS))
    print("Connection/heartbeat does NOT grant execution authority.")
    legacy={"agent_id":a.agent_id,"approved_root":str(root),"capabilities":OPS,"runtime_version":"r214-durable-outbound-agent","last_job_id":None}
    try:
        migrated=req(a.server,"/api/device/heartbeat",a.token,legacy)
        print("Bridge migration:",migrated.get("state") or migrated.get("serverRevision") or "verified")
    except Exception as e:
        print("Bridge migration not yet verified:",e,file=sys.stderr)
        print("The agent will not claim PC ONLINE or execution authority until authenticated enrollment succeeds.",file=sys.stderr)
        return 4
    req(a.server,"/api/hybrid/agent/register",a.token,{"deviceId":a.agent_id,"name":"OMEGA Sovereign PC","platform":sys.platform,"version":"R214","capabilities":OPS,"rootLabel":str(root)})
    req(a.server,"/api/hybrid/agent/heartbeat",a.token,{"deviceId":a.agent_id,"version":"R214"})
    print("\nOMEGA can execute only the displayed bounded operations inside this exact root.")
    answer=input("Grant governed execution control for this PC session for up to 4 hours? [y/N]: ").strip().lower()
    if answer not in {"y","yes"}:
        print("Authority NOT granted. Heartbeat/status mode only. Re-run when you want to authorize execution.")
        granted=False
    else:
        auth=req(a.server,"/api/hybrid/authority/grant",a.token,{"localApproval":True,"approvalMethod":"LOCAL_CONSOLE_EXPLICIT_YES","deviceId":a.agent_id,"approvedRoot":str(root),"allowedOps":OPS,"expiresSeconds":14400})
        granted=bool(auth.get("active")); print("Authority:",auth.get("state"),"expires in",auth.get("secondsRemaining"),"seconds")
    last_hb=0.0
    try:
        while True:
            if time.time()-last_hb>8:
                req(a.server,"/api/hybrid/agent/heartbeat",a.token,{"deviceId":a.agent_id,"version":"R214"}); last_hb=time.time()
            if not granted: time.sleep(max(3,a.interval)); continue
            pol=req(a.server,"/api/hybrid/agent/poll",a.token,{"deviceId":a.agent_id}); job=pol.get("job")
            if not job: time.sleep(max(2,a.interval)); continue
            proofs=[]; outputs=[]; logs=[]; success=True
            for i,step in enumerate(job.get("steps") or []):
                sid=str(step.get("id") or "S%02d"%(i+1)); op=str(step.get("op") or "").upper()
                try:
                    result=execute_step(root,step); ok=not bool(result.get("blocked")) and int(result.get("exit_code",0))==0
                except Exception as e: result={"error":str(e)}; ok=False
                if result.get("outputPath"): outputs.append(str(result["outputPath"]))
                proof={"id":sid,"op":op,"ok":ok,"result":result}; proofs.append(proof); logs.append(json.dumps(proof,default=str,sort_keys=True)[-8000:]); success=success and ok
                if not ok: break
            receipt={"schema":"OMEGA_HOST_RETURN_RECEIPT_R214","jobId":job.get("id"),"deviceId":a.agent_id,"ok":success,"returnedState":"RETURNED_SUCCESS" if success else "RETURNED_FAILURE","stepCount":len(proofs),"stepReceipts":[{"id":p["id"],"op":p["op"],"ok":p["ok"],"proofSha256":hashlib.sha256(json.dumps(p,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()} for p in proofs],"outputPaths":outputs}
            canonical=json.dumps(receipt,sort_keys=True,separators=(",",":")); fingerprint=hashlib.sha256(canonical.encode()).hexdigest()
            returned=req(a.server,"/api/hybrid/agent/result",a.token,{"jobId":job.get("id"),"deviceId":a.agent_id,"ok":success,"returnedState":receipt["returnedState"],"stepProofs":proofs,"outputPaths":outputs,"log":"\n".join(logs)[-12000:],"resultFingerprint":fingerprint,"receiptCanonicalJson":canonical})
            print("job",job.get("id"),"VERIFIED" if returned.get("ok") else "RETURN REJECTED",returned.get("code") or "")
    except KeyboardInterrupt: print("\nStopping OMEGA Hybrid agent.")
    finally:
        if granted:
            try: req(a.server,"/api/hybrid/authority/revoke",a.token,{"deviceId":a.agent_id})
            except Exception: pass
    return 0
if __name__=="__main__": raise SystemExit(main())
`;

function runtimeStub(env: HybridEnv): DurableStub | null {
  const ns = env.OMEGA_RUNTIME;
  if (!ns) return null;
  return ns.get(ns.idFromName(CANONICAL_HYBRID_SINGLETON_R214));
}

function bridgeRequest(request: Request, targetPath: string, body?: unknown): Request {
  const url = new URL(request.url);
  url.pathname = targetPath;
  url.search = "";
  const headers = new Headers(request.headers);
  const old = headers.get("x-omega-agent-token");
  if (old && !headers.get("x-omega-bridge-secret")) headers.set("x-omega-bridge-secret", old);
  headers.set("accept", "application/json");
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers.set("content-type", "application/json");
    payload = JSON.stringify(body);
  } else if (!["GET","HEAD"].includes(request.method)) payload = request.body || undefined;
  return new Request(url.toString(), { method: request.method, headers, body: payload, redirect: "manual" });
}

async function bodyJson(response: Response): Promise<any> {
  const raw = await response.text();
  try { return JSON.parse(raw); } catch { return { ok: false, raw: raw.slice(0, 1000) }; }
}

export async function hybridStatusR214(request: Request, env: HybridEnv): Promise<Response> {
  const stub = runtimeStub(env);
  if (!stub) return json({ ok: false, code: "OMEGA_RUNTIME_BINDING_MISSING", badGatewayFallbackUsed: false }, 503);
  const raw = await stub.fetch(bridgeRequest(request, "/status"));
  const d = await bodyJson(raw);
  const devices = Array.isArray(d.devices) ? d.devices : [];
  const online = devices.find((x: any) => x.online && !x.revoked) || null;
  const authority = d.executionAuthority || {};
  return json({
    ok: raw.ok,
    state: online ? "VERIFIED_DEVICE_ONLINE" : d.paired ? "DEVICE_PROOF_REQUIRED" : "PAIRING_REQUIRED",
    serverRevision: d.serverRevision || HYBRID_CONTROL_PLANE_R214,
    browserCredentialReady: Boolean(d.paired), pairingConfigured: Boolean(d.paired),
    agentRunning: Boolean(online), agentReachable: Boolean(online), authenticated: Boolean(online), agentAuthenticated: Boolean(online),
    heartbeatCurrent: Boolean(online), heartbeatStale: false,
    heartbeatAgeSeconds: online ? Math.max(0, (Date.now() - Number(online.lastSeen || Date.now())) / 1000) : null,
    heartbeat_age_seconds: online ? Math.max(0, (Date.now() - Number(online.lastSeen || Date.now())) / 1000) : null,
    heartbeatTtlSeconds: 30,
    nativeExecutionClaimed: Boolean(online && authority.active), pcOnline: Boolean(online), pc_online: Boolean(online),
    proof: online ? { agent_id: online.id, approved_root: online.rootLabel, capabilities: online.capabilities, lastSeen: online.lastSeen } : null,
    executionAuthority: authority,
    controlPlane: "DURABLE_OBJECT_OUTBOUND_AGENT_POLL",
    durableBinding: "OMEGA_RUNTIME", durableSingleton: CANONICAL_HYBRID_SINGLETON_R214,
    inboundSovereignGatewayRequired: false,
    badGatewayFallbackUsed: false,
    boundary: "PC ONLINE requires a current authenticated outbound heartbeat. Native execution additionally requires explicit local authority; connection alone never grants control.",
  }, raw.ok ? 200 : raw.status);
}

async function developmentStatusR214(request: Request, env: HybridEnv): Promise<Response> {
  const stub = runtimeStub(env);
  if (!stub) return json({ ok: false, code: "OMEGA_RUNTIME_BINDING_MISSING", active_job: null, recent_jobs: [], badGatewayFallbackUsed: false }, 503);
  const raw = await stub.fetch(bridgeRequest(request, "/status"));
  const d = await bodyJson(raw);
  const jobs = Array.isArray(d.jobs) ? d.jobs : [];
  const normalized = jobs.map((row: any) => ({
    id: row.id || null,
    kind: row.action || row.profile || "HYBRID_JOB",
    reason: row.instructions || "Governed Durable Object Hybrid job",
    state: row.status || "UNKNOWN",
    targetDeviceId: row.targetDeviceId || null,
    queuedAt: row.queuedAt || null,
    startedAt: row.startedAt || null,
    completedAt: row.completedAt || null,
    returnVerification: row.returnVerification || null,
  }));
  const active = [...normalized].reverse().find((row: any) => ["QUEUED","RUNNING"].includes(String(row.state))) || null;
  return json({
    ok: raw.ok,
    release: HYBRID_CONTROL_PLANE_R214,
    mode: "DURABLE_OUTBOUND_AGENT",
    active_job: active,
    recent_jobs: normalized.slice(-12),
    executionAuthority: d.executionAuthority || null,
    queueBoundary: "No new native job can queue or be claimed without the explicit local R214 execution lease.",
    inboundSovereignGatewayRequired: false,
    badGatewayFallbackUsed: false,
  }, raw.ok ? 200 : raw.status);
}

export async function handleHybridControlPlaneR214(request: Request, env: HybridEnv): Promise<Response | null> {
  const url = new URL(request.url), path = url.pathname.replace(/\/$/, ""), stub = runtimeStub(env);
  if (path === "/api/hybrid/launcher" && request.method === "GET") {
    return new Response(LAUNCHER_BOOTSTRAP, { headers: { "content-type": "application/octet-stream", "content-disposition": "attachment; filename=START_OMEGA_PC_LINK_R214.cmd", "cache-control": "no-store", "x-omega-hybrid-control-plane": HYBRID_CONTROL_PLANE_R214 } });
  }
  if (path === "/api/hybrid/agent" && request.method === "GET") {
    return new Response(AGENT_SOURCE, { headers: { "content-type": "text/x-python; charset=utf-8", "content-disposition": "attachment; filename=omega_sovereign_agent_r214.py", "cache-control": "no-store", "x-omega-hybrid-control-plane": HYBRID_CONTROL_PLANE_R214 } });
  }
  if (!stub) {
    if (path.startsWith("/api/hybrid/") || path === "/api/development/status") return json({ ok: false, code: "OMEGA_RUNTIME_BINDING_MISSING", badGatewayFallbackUsed: false }, 503);
    return null;
  }
  if (path === "/api/hybrid/status" && request.method === "GET") return hybridStatusR214(request, env);
  if (path === "/api/development/status" && request.method === "GET") return developmentStatusR214(request, env);
  const direct: Record<string,string> = {
    "/api/hybrid/authority/status": "/authority/status",
    "/api/hybrid/authority/grant": "/authority/grant",
    "/api/hybrid/authority/revoke": "/authority/revoke",
    "/api/hybrid/agent/register": "/agent/register",
    "/api/hybrid/agent/heartbeat": "/agent/heartbeat",
    "/api/hybrid/agent/poll": "/agent/poll",
    "/api/hybrid/agent/result": "/agent/result",
    "/api/hybrid/jobs": "/jobs",
    "/api/hybrid/missions": "/missions",
    "/api/hybrid/events": "/events",
    "/api/hybrid/thread": "/thread",
    "/api/hybrid/turn": "/turn",
  };
  if (direct[path]) return stub.fetch(bridgeRequest(request, direct[path]));
  return null;
}

export async function tryLegacyHeartbeatFromDurableR214(request: Request, env: HybridEnv): Promise<Response | null> {
  const stub = runtimeStub(env); if (!stub) return null;
  const body = await request.clone().json().catch(() => ({})) as any;
  const deviceId = String(body.agent_id || body.deviceId || "").trim(); if (!deviceId) return null;
  const register = await stub.fetch(bridgeRequest(request, "/agent/register", { deviceId, name: "OMEGA Sovereign PC", platform: "Windows", version: body.runtime_version || "legacy-migrated-r214", capabilities: body.capabilities || [], rootLabel: body.approved_root || "approved root" }));
  if (register.status === 401) return null;
  if (!register.ok) return register;
  const hb = await stub.fetch(bridgeRequest(request, "/agent/heartbeat", { deviceId, version: body.runtime_version || "legacy-migrated-r214" }));
  if (!hb.ok) return hb;
  return hybridStatusR214(request, env);
}

export async function migrateVerifiedLegacyHeartbeatR214(request: Request, env: HybridEnv): Promise<Response | null> {
  const stub = runtimeStub(env), key = String(env.SOVEREIGN_GATEWAY_TOKEN || "");
  if (!stub || !key) return null;
  const body = await request.clone().json().catch(() => ({})) as any;
  const secret = request.headers.get("x-omega-agent-token") || "";
  const deviceId = String(body.agent_id || "").trim();
  if (!secret || !deviceId) return null;
  const u = new URL(request.url); u.pathname = "/enroll-existing"; u.search = "";
  const enrolled = await stub.fetch(new Request(u.toString(), { method: "POST", headers: { "content-type": "application/json", "accept": "application/json", "x-omega-enrollment-key": key }, body: JSON.stringify({ secret, deviceId, name: "OMEGA Sovereign PC", platform: "Windows", version: body.runtime_version || "legacy-migrated-r214", capabilities: body.capabilities || [], approvedRoot: body.approved_root || "approved root" }) }));
  if (!enrolled.ok) return enrolled;
  return hybridStatusR214(request, env);
}

export async function handleLegacyDevelopmentLeaseR214(request: Request, env: HybridEnv): Promise<Response | null> {
  const stub = runtimeStub(env); if (!stub) return null;
  const auth = await stub.fetch(bridgeRequest(request, "/authority/status"));
  const d = await bodyJson(auth);
  if (!d || d.state === "LOCAL_APPROVAL_REQUIRED") return null;
  return json({ ok: true, job: null, migration_required: true, executionAuthority: d, boundary: "R214 does not issue new work through the retired inbound sovereign-gateway development lease. Relaunch the canonical R214 agent to use Durable Object outbound polling." });
}
