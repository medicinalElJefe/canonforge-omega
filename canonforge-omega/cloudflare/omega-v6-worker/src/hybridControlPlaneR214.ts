export const HYBRID_CONTROL_PLANE_R214 = "r214-durable-outbound-hybrid-control-plane";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });

type DurableStub = { fetch(input: Request | string | URL, init?: RequestInit): Promise<Response> };
type DurableNamespace = { idFromName(name: string): unknown; get(id: unknown): DurableStub };
type HybridEnv = { OMEGA_RUNTIME?: DurableNamespace; SOVEREIGN_GATEWAY_TOKEN?: string };

const AGENT_SOURCE = String.raw`from __future__ import annotations
import argparse, hashlib, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

OPS = ["READ_TEXT","SEARCH_TEXT","HASH_TREE","BUILD","TEST","PACKAGE","SUPPORT_BUNDLE","OPEN_URL","WAIT"]

def req(base, path, secret, payload=None, extra=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    r = urllib.request.Request(base.rstrip("/")+path, data=data, method="GET" if payload is None else "POST")
    r.add_header("accept","application/json")
    if data is not None: r.add_header("content-type","application/json")
    if secret: r.add_header("x-omega-bridge-secret", secret); r.add_header("x-omega-agent-token", secret)
    for k,v in (extra or {}).items(): r.add_header(k,v)
    with urllib.request.urlopen(r, timeout=30) as response: return json.loads(response.read().decode("utf-8"))

def run(cmd, cwd, timeout=600):
    p = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True, timeout=timeout)
    return {"exit_code":p.returncode,"stdout_tail":p.stdout[-16000:],"stderr_tail":p.stderr[-16000:]}

def rel(root, raw):
    p=(root / str(raw or ".")).resolve(); rr=root.resolve()
    try: p.relative_to(rr)
    except ValueError: raise RuntimeError("path escapes approved root")
    return p

def hash_tree(root, path="."):
    base=rel(root,path); h=hashlib.sha256(); count=0
    for p in sorted(x for x in base.rglob("*") if x.is_file() and ".git" not in x.parts):
        rp=p.relative_to(root).as_posix().encode(); h.update(rp+b"\0")
        try:
            with p.open("rb") as f:
                while True:
                    b=f.read(1024*1024)
                    if not b: break
                    h.update(b)
        except OSError: continue
        count+=1
        if count>=10000: break
    return {"sha256":h.hexdigest(),"files":count,"path":str(base)}

def execute_step(root, step):
    op=str(step.get("op","")).upper(); path=step.get("path") or step.get("projectPath") or "."; cwd=rel(root,path)
    if op=="READ_TEXT":
        if not cwd.is_file(): raise RuntimeError("READ_TEXT requires a file")
        return {"text":cwd.read_text(encoding="utf-8",errors="replace")[:40000],"path":str(cwd)}
    if op=="SEARCH_TEXT":
        needle=str(step.get("query") or step.get("text") or ""); out=[]
        if not needle: raise RuntimeError("SEARCH_TEXT requires query")
        for p in root.rglob("*"):
            if not p.is_file() or ".git" in p.parts: continue
            try: s=p.read_text(encoding="utf-8",errors="ignore")
            except OSError: continue
            if needle.lower() in s.lower(): out.append(str(p.relative_to(root)))
            if len(out)>=200: break
        return {"query":needle,"matches":out}
    if op=="HASH_TREE": return hash_tree(root,path)
    if op=="WAIT": time.sleep(min(30,max(0,float(step.get("seconds") or 1)))); return {"waited":True}
    if op=="OPEN_URL":
        url=str(step.get("url") or "")
        if not url.startswith("https://"): raise RuntimeError("HTTPS required")
        if os.name=="nt": subprocess.Popen(["cmd","/c","start","",url], cwd=str(root)); return {"opened":url}
        return {"opened":False,"reason":"OPEN_URL Windows execution only"}
    if op=="TEST":
        profile=str(step.get("profile") or "PYTHON_TEST")
        cmd=[sys.executable,"-m","pytest","-q"] if profile in {"PYTHON_TEST","AUTO_BUILD"} else ["npm","test","--","--runInBand"]
        return run(cmd,cwd)
    if op=="BUILD":
        profile=str(step.get("profile") or "AUTO_BUILD")
        if profile=="DOTNET_BUILD": cmd=["dotnet","build"]
        elif (cwd/"package.json").exists(): cmd=["npm","run","build"]
        else: cmd=[sys.executable,"-m","compileall","-q",str(cwd)]
        return run(cmd,cwd)
    if op in {"PACKAGE","SUPPORT_BUNDLE"}: return {"blocked":True,"reason":op+" requires a separately declared packaging manifest; no implicit archive is fabricated"}
    return {"blocked":True,"reason":"operation not installed in R214 bootstrap agent: "+op}

def main():
    ap=argparse.ArgumentParser(description="OMEGA R214 explicit-authority outbound Hybrid agent")
    ap.add_argument("--server",default=os.getenv("OMEGA_SERVER","https://omegav6.jeffdeweyeljefe.workers.dev")); ap.add_argument("--token",default=os.getenv("OMEGA_TOKEN",os.getenv("OMEGA_AGENT_TOKEN","")))
    ap.add_argument("--root",default=os.getenv("OMEGA_APPROVED_ROOT",str(Path.cwd()))); ap.add_argument("--agent-id",default=os.getenv("OMEGA_AGENT_ID",os.environ.get("COMPUTERNAME","omega-pc"))); ap.add_argument("--interval",type=float,default=5.0)
    a=ap.parse_args(); root=Path(a.root.strip('"')).resolve()
    if not a.token: print("PAIRING REQUIRED: no bridge credential",file=sys.stderr); return 3
    if not root.is_dir(): print("APPROVED ROOT INVALID: "+str(root),file=sys.stderr); return 2
    print("OMEGA R214 Hybrid Link")
    print("Canonical server:",a.server); print("Approved root:",root); print("Device:",a.agent_id)
    print("Connection/heartbeat does NOT grant execution authority.")
    legacy={"agent_id":a.agent_id,"approved_root":str(root),"capabilities":OPS,"runtime_version":"r214-durable-outbound-agent","last_job_id":None}
    try: req(a.server,"/api/device/heartbeat",a.token,legacy)
    except Exception as e: print("Bridge migration probe:",e)
    req(a.server,"/api/hybrid/agent/register",a.token,{"deviceId":a.agent_id,"name":"OMEGA Sovereign PC","platform":sys.platform,"version":"R214","capabilities":OPS,"rootLabel":str(root)})
    req(a.server,"/api/hybrid/agent/heartbeat",a.token,{"deviceId":a.agent_id,"version":"R214"})
    print("\nOMEGA can execute only the displayed bounded operations inside this root.")
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
                proofs.append({"id":sid,"op":op,"ok":ok,"result":result}); logs.append(json.dumps({"id":sid,"op":op,"ok":ok,"result":result},default=str)[-8000:]); success=success and ok
                if not ok: break
            receipt={"schema":"OMEGA_HOST_RETURN_RECEIPT_R214","jobId":job.get("id"),"deviceId":a.agent_id,"ok":success,"returnedState":"RETURNED_SUCCESS" if success else "RETURNED_FAILURE","stepCount":len(proofs),"stepReceipts":[{"id":p["id"],"op":p["op"],"ok":p["ok"],"proofSha256":hashlib.sha256(json.dumps(p,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()} for p in proofs],"outputPaths":outputs}
            canonical=json.dumps(receipt,sort_keys=True,separators=(",",":")); fingerprint=hashlib.sha256(canonical.encode()).hexdigest()
            req(a.server,"/api/hybrid/agent/result",a.token,{"jobId":job.get("id"),"deviceId":a.agent_id,"ok":success,"returnedState":receipt["returnedState"],"stepProofs":proofs,"outputPaths":outputs,"log":"\n".join(logs)[-12000:],"resultFingerprint":fingerprint,"receiptCanonicalJson":canonical})
            print("job",job.get("id"),"COMPLETE" if success else "FAILED")
    except KeyboardInterrupt: print("\nStopping OMEGA Hybrid agent.")
    finally:
        try: req(a.server,"/api/hybrid/authority/revoke",a.token,{"deviceId":a.agent_id})
        except Exception: pass
    return 0
if __name__=="__main__": raise SystemExit(main())
`;

function runtimeStub(env: HybridEnv): DurableStub | null {
  const ns = env.OMEGA_RUNTIME;
  if (!ns) return null;
  return ns.get(ns.idFromName("OMEGA_CANONICAL_HYBRID_R214"));
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
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { ok: false, raw: text.slice(0, 1000) }; }
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
    heartbeatCurrent: Boolean(online), heartbeatStale: false, heartbeatAgeSeconds: online ? Math.max(0, (Date.now() - Number(online.lastSeen || Date.now())) / 1000) : null,
    heartbeatTtlSeconds: 30, nativeExecutionClaimed: Boolean(online && authority.active), pcOnline: Boolean(online), pc_online: Boolean(online),
    proof: online ? { agent_id: online.id, approved_root: online.rootLabel, capabilities: online.capabilities, lastSeen: online.lastSeen } : null,
    executionAuthority: authority,
    controlPlane: "DURABLE_OBJECT_OUTBOUND_AGENT_POLL",
    inboundSovereignGatewayRequired: false,
    badGatewayFallbackUsed: false,
    boundary: "PC ONLINE requires a current authenticated outbound heartbeat. Native execution additionally requires explicit local authority; connection alone never grants control.",
  }, raw.ok ? 200 : raw.status);
}

export async function handleHybridControlPlaneR214(request: Request, env: HybridEnv): Promise<Response | null> {
  const url = new URL(request.url), path = url.pathname.replace(/\/$/, ""), stub = runtimeStub(env);
  if (path === "/api/hybrid/agent" && request.method === "GET") {
    return new Response(AGENT_SOURCE, { headers: { "content-type": "text/x-python; charset=utf-8", "content-disposition": "attachment; filename=omega_sovereign_agent_r214.py", "cache-control": "no-store", "x-omega-hybrid-control-plane": HYBRID_CONTROL_PLANE_R214 } });
  }
  if (!stub) {
    if (path.startsWith("/api/hybrid/")) return json({ ok: false, code: "OMEGA_RUNTIME_BINDING_MISSING", badGatewayFallbackUsed: false }, 503);
    return null;
  }
  if (path === "/api/hybrid/status" && request.method === "GET") return hybridStatusR214(request, env);
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
