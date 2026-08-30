from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from dataclasses import asdict
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json, mimetypes, os, math
from .runtime import OmegaRuntime
from .schema import Address20736, CanonicalMetrics, EvidenceClass
from .modes import catalog as mode_catalog, evaluate as evaluate_mode
from .capabilities import CAPABILITIES, MENUS, GATES
from .corpus import classify_name
from .forecast import frozen_prior
from .plugins import inspect_plugin, run_isolated
from .adapters.hybrid import HybridStep, validate_plan, execute_plan
from .adapters.workbook import inspect_workbook, roundtrip_workbook
from .adapters.earth import GeoPoint, destination, haversine_m
from .calculus import quantize_heading
from .orchestrator import evaluate_all
from .release import verify_manifest

ROOT=Path(__file__).resolve().parents[1]; WEB=ROOT/"web"
DATA=Path(os.environ.get("OMEGA_DATA",ROOT/"runtime-data")); RUNTIME=OmegaRuntime(DATA)
PLUGIN_ROOT=(ROOT/"plugins").resolve()


def _approved_hybrid_roots():
    raw=os.environ.get("OMEGA_HYBRID_ROOTS",str(ROOT))
    parts=[x.strip() for x in raw.replace(os.pathsep,";").split(";") if x.strip()]
    return [Path(x).expanduser().resolve() for x in parts] or [ROOT.resolve()]

def _resolve_approved_root(requested):
    approved=_approved_hybrid_roots()
    if not requested: return approved[0]
    p=Path(str(requested)).expanduser().resolve()
    for root in approved:
        if p==root or root in p.parents: return p
    raise PermissionError("requested root is outside OMEGA_HYBRID_ROOTS")

def _plugin_catalog():
    out=[]
    if not PLUGIN_ROOT.is_dir(): return out
    for manifest in sorted(PLUGIN_ROOT.rglob("plugin.json")):
        info=inspect_plugin(manifest.parent)
        row={"path":str(manifest.parent.relative_to(PLUGIN_ROOT)),"status":info.get("status","FAIL")}
        if "manifest" in info:
            m=info["manifest"]
            row.update({k:m.get(k) for k in ("id","name","version","api_version","permissions","capabilities","mutations","deterministic")})
        if info.get("errors"): row["errors"]=info["errors"]
        out.append(row)
    return out

def _plugin_by_id(plugin_id):
    matches=[]
    for manifest in PLUGIN_ROOT.rglob("plugin.json") if PLUGIN_ROOT.is_dir() else []:
        try:
            data=json.loads(manifest.read_text(encoding="utf-8"))
            if data.get("id")==plugin_id: matches.append(manifest.parent.resolve())
        except Exception: pass
    if len(matches)!=1: return None
    return matches[0]

def _json_safe(value):
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {k:_json_safe(v) for k,v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    return value

class Handler(BaseHTTPRequestHandler):
    server_version="OmegaGenesis/1.1"
    def _json(self,status,obj,head_only=False):
        raw=json.dumps(_json_safe(obj),ensure_ascii=False,default=str,allow_nan=False,separators=(",",":")).encode()
        self.send_response(status)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(raw)))
        self.send_header("Cache-Control","no-store")
        self.end_headers()
        if not head_only: self.wfile.write(raw)
    def _body(self):
        n=int(self.headers.get("Content-Length","0") or 0); return json.loads(self.rfile.read(n) or b"{}")
    def _auth(self):
        token=os.environ.get("OMEGA_GATEWAY_TOKEN"); host=self.client_address[0]
        return host in {"127.0.0.1","::1"} or (token and self.headers.get("X-Omega-Gateway-Token")==token)
    def do_HEAD(self):
        u=urlparse(self.path); p=u.path
        if p.startswith("/api/"):
            if not self._auth(): return self._json(401,{"error":"unauthorized_sovereign_ingress"},head_only=True)
            if p=="/api/health": return self._json(200,{"status":"OK","runtime":"OMEGA_GENESIS","version":"1.1.0"},head_only=True)
            return self._json(405,{"error":"head_not_supported_for_endpoint"},head_only=True)
        return self._static(p,head_only=True)
    def do_GET(self):
        u=urlparse(self.path); p=u.path; q=parse_qs(u.query)
        if p.startswith("/api/") and not self._auth(): return self._json(401,{"error":"unauthorized_sovereign_ingress"})
        if p=="/api/health": return self._json(200,{"status":"OK","runtime":"OMEGA_GENESIS","version":"1.1.0","canonical_digest":RUNTIME.state.digest,"state_id":RUNTIME.state.address.state_id,"proof":RUNTIME.ledger.verify()})
        if p=="/api/state": return self._json(200,RUNTIME.snapshot())
        if p=="/api/modes": return self._json(200,{"modes":mode_catalog()})
        if p=="/api/orchestrate": return self._json(200,evaluate_all(RUNTIME.state))
        if p=="/api/capabilities": return self._json(200,{"menus":MENUS,"capabilities":CAPABILITIES,"acceptance_gates":GATES})
        if p=="/api/plugins": return self._json(200,{"policy":"plugins propose/read/render within declared leases; kernel retains commit authority","plugins":_plugin_catalog()})
        if p=="/api/proof": return self._json(200,{"verify":RUNTIME.ledger.verify(),"replay":RUNTIME.verify_replay(),"records":RUNTIME.ledger.read()[-100:]})
        if p=="/api/replay": return self._json(200,RUNTIME.verify_replay())
        if p=="/api/forecast": return self._json(200,{**asdict(frozen_prior(RUNTIME.state,int(q.get("horizon",[1])[0]))),"evidence_class":"FORECAST"})
        if p=="/api/mode": return self._json(200,{"mode":q.get("id",["MODE188"])[0],"result":evaluate_mode(q.get("id",["MODE188"])[0],RUNTIME.state),"state_digest":RUNTIME.state.digest})
        if p=="/api/atlas":
            i=max(0,min(20735,int(q.get("index",[RUNTIME.state.address.index0])[0]))); a=Address20736.from_index0(i)
            return self._json(200,{"index0":i,"state_id":a.state_id,"address":a.as_tuple(),"opposite":((a.domain+5)%12+1,(a.phase+5)%12+1,(a.regulation+5)%12+1,(a.lens+5)%12+1),"phase_portal_size":12**3})
        if p=="/api/corpus/classify":
            name=q.get("name",[""])[0]; d,a,r,why=classify_name(name); return self._json(200,{"name":name,"disposition":d,"authority":a,"role":r,"reason":why})
        if p=="/api/release/verify": return self._json(200,verify_manifest(ROOT))
        if p=="/api/host/status":
            import platform
            return self._json(200,{"status":"PASS","host":platform.node(),"platform":platform.platform(),"python":platform.python_version(),"cpu_count":os.cpu_count(),"hybrid_roots":[str(x) for x in _approved_hybrid_roots()],"canonical_digest":RUNTIME.state.digest})
        return self._static(p)
    def do_POST(self):
        p=urlparse(self.path).path
        if p.startswith("/api/") and not self._auth(): return self._json(401,{"error":"unauthorized_sovereign_ingress"})
        try: body=self._body()
        except Exception as e: return self._json(400,{"error":"invalid_json","detail":str(e)})
        try:
            if p=="/api/transition":
                a=Address20736(*body["address"]); m=CanonicalMetrics(**body["metrics"]); e=EvidenceClass(body.get("evidence_class","DERIVED")); return self._json(200,RUNTIME.propose(a,m,e,mode=body.get("mode","MODE188"),payload=body.get("payload"),allow_conditional=bool(body.get("allow_conditional",False))))
            if p=="/api/dewey-bal/validate": return self._json(200,RUNTIME.validate_dewey_bal_contract(int(body["source_state"]),int(body["target_state"]),float(body["source_burden"]),float(body["target_burden"]),str(body["edge"])))
            if p=="/api/plugins/run":
                plugin_id=str(body.get("id","")); plugin_dir=_plugin_by_id(plugin_id)
                if not plugin_dir: return self._json(404,{"error":"plugin_not_found_or_ambiguous","id":plugin_id})
                payload=dict(body.get("payload") or {}); payload.setdefault("state_id",RUNTIME.state.address.state_id); payload.setdefault("state_digest",RUNTIME.state.digest)
                result=run_isolated(plugin_dir,payload,timeout=min(30,max(1,int(body.get("timeout",10)))))
                return self._json(200,result)
            if p=="/api/hybrid/validate":
                root=_resolve_approved_root(body.get("root"))
                steps=[HybridStep(str(x["op"]),x.get("path"),x.get("output"),x.get("args")) for x in body.get("steps",[])]
                return self._json(200,{**validate_plan(root,steps),"root":str(root)})
            if p=="/api/hybrid/run":
                root=_resolve_approved_root(body.get("root"))
                steps=[HybridStep(str(x["op"]),x.get("path"),x.get("output"),x.get("args")) for x in body.get("steps",[])]
                result=execute_plan(root,steps); result["root"]=str(root)
                return self._json(200 if result.get("status")=="PASS" else 422,result)
            if p=="/api/workbook/inspect":
                root=_resolve_approved_root(body.get("root"))
                return self._json(200,inspect_workbook(root,str(body["path"])))
            if p=="/api/workbook/roundtrip":
                root=_resolve_approved_root(body.get("root"))
                result=roundtrip_workbook(root,str(body["path"]),str(body["output"]))
                return self._json(200 if result.get("status")=="PASS" else 422,result)
            if p=="/api/earth/destination":
                origin=GeoPoint(float(body["lat"]),float(body["lon"]))
                bearing=float(body.get("bearing_rad",0)); distance_m=float(body.get("distance_m",0))
                target=destination(origin,bearing,distance_m)
                return self._json(200,{"origin":asdict(origin),"destination":asdict(target),"requested_distance_m":distance_m,"computed_distance_m":haversine_m(origin,target),"bearing_rad":bearing,"quantized_heading_rad":quantize_heading(bearing),"evidence_class":"DERIVED","boundary":"geodesic computation only; not a claim about current ground conditions"})
        except Exception as e: return self._json(422,{"error":type(e).__name__,"detail":str(e)})
        self._json(404,{"error":"not_found"})
    def _static(self,p,head_only=False):
        rel="index.html" if p in {"/",""} else p.lstrip("/")
        f=(WEB/rel).resolve()
        if WEB.resolve()!=f and WEB.resolve() not in f.parents:
            return self._json(403,{"error":"forbidden"},head_only=head_only)
        if not f.is_file():
            return self._json(404,{"error":"static_not_found","path":p},head_only=head_only)
        raw=f.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type",mimetypes.guess_type(str(f))[0] or "application/octet-stream")
        self.send_header("Content-Length",str(len(raw)))
        self.send_header("Cache-Control","no-store")
        self.end_headers()
        if not head_only: self.wfile.write(raw)
    def log_message(self,fmt,*args): pass

def main():
    host=os.environ.get("OMEGA_HOST","127.0.0.1"); port=int(os.environ.get("OMEGA_PORT","8127")); print(f"OMEGA Genesis → http://{host}:{port}")
    ThreadingHTTPServer((host,port),Handler).serve_forever()

if __name__=="__main__": main()
