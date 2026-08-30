from __future__ import annotations
from dataclasses import dataclass, asdict
from hashlib import sha256
import json
from pathlib import Path
from typing import Any

from ..corpus import write_catalog
from ..release import hash_tree, sha256_file, verify_manifest

ALLOWED_OPS={"READ_FILE","WRITE_OUTPUT","HASH_TREE","INDEX_CORPUS","RUN_VERIFICATION","TRAIN_LOCAL_BOUNDED"}
MAX_READ_BYTES=2*1024*1024
MAX_WRITE_BYTES=2*1024*1024
MAX_TRAIN_FILES=2000
MAX_TRAIN_BYTES=32*1024*1024

@dataclass(frozen=True,slots=True)
class HybridStep:
    op:str
    path:str|None=None
    output:str|None=None
    args:dict|None=None


def _safe(root:Path,candidate:str|None)->Path|None:
    if not candidate: return None
    root=Path(root).resolve(); p=(root/candidate).resolve()
    if root!=p and root not in p.parents: raise ValueError("path escapes approved root")
    return p


def validate_plan(root:Path,steps:list[HybridStep])->dict:
    root=Path(root).resolve(); errors=[]
    for i,step in enumerate(steps):
        if step.op not in ALLOWED_OPS: errors.append(f"step {i}: op not allowed: {step.op}")
        for candidate in (step.path,step.output):
            if candidate:
                try: _safe(root,candidate)
                except ValueError: errors.append(f"step {i}: path escapes approved root")
        if step.op=="WRITE_OUTPUT":
            content=str((step.args or {}).get("content",""))
            if len(content.encode("utf-8"))>MAX_WRITE_BYTES: errors.append(f"step {i}: output exceeds {MAX_WRITE_BYTES} bytes")
    payload=[asdict(s) for s in steps]
    fp=sha256(json.dumps(payload,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()
    return {"status":"PASS" if not errors else "FAIL","errors":errors,"plan_fingerprint":fp,"policy":"typed plans only; no arbitrary shell; host writes remain inside approved root"}


def _bounded_training_profile(root:Path,path:Path|None,output:Path|None,args:dict[str,Any])->dict[str,Any]:
    base=path or root
    if not base.exists(): raise FileNotFoundError(str(base))
    suffixes={str(x).lower() for x in args.get("suffixes",[".txt",".md",".csv",".json",".py",".js",".html",".css"])}
    counts:dict[str,int]={}; files=0; total_bytes=0
    targets=[base] if base.is_file() else sorted(p for p in base.rglob("*") if p.is_file())
    for p in targets:
        if p.suffix.lower() not in suffixes: continue
        size=p.stat().st_size
        if size>MAX_READ_BYTES or total_bytes+size>MAX_TRAIN_BYTES or files>=MAX_TRAIN_FILES: continue
        text=p.read_text(encoding="utf-8",errors="ignore").lower(); files+=1; total_bytes+=size
        token=""
        for ch in text:
            if ch.isalnum() or ch in "_-": token+=ch
            else:
                if len(token)>=3: counts[token]=counts.get(token,0)+1
                token=""
        if len(token)>=3: counts[token]=counts.get(token,0)+1
    vocab=sorted(counts.items(),key=lambda kv:(-kv[1],kv[0]))[:5000]
    model={"model_type":"OMEGA_BOUNDED_LEXICAL_PROFILE_V1","files":files,"bytes":total_bytes,"vocabulary":[{"term":k,"count":v} for k,v in vocab]}
    model["fingerprint"]=sha256(json.dumps(model,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    if output:
        output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(model,indent=2),encoding="utf-8")
        model["output"]=str(output.relative_to(root))
    return model


def execute_plan(root:Path,steps:list[HybridStep])->dict[str,Any]:
    root=Path(root).resolve(); validation=validate_plan(root,steps)
    if validation["status"]!="PASS": return {**validation,"executed":False,"results":[]}
    results=[]
    try:
        for i,step in enumerate(steps):
            args=dict(step.args or {}); path=_safe(root,step.path); output=_safe(root,step.output)
            if step.op=="READ_FILE":
                if path is None or not path.is_file(): raise FileNotFoundError(str(path))
                size=path.stat().st_size
                if size>MAX_READ_BYTES: raise ValueError(f"read exceeds {MAX_READ_BYTES} bytes")
                raw=path.read_bytes(); result={"path":str(path.relative_to(root)),"bytes":size,"sha256":sha256(raw).hexdigest(),"text":raw.decode(args.get("encoding","utf-8"),errors="replace")}
            elif step.op=="WRITE_OUTPUT":
                if output is None: raise ValueError("WRITE_OUTPUT requires output")
                content=str(args.get("content","")); raw=content.encode(args.get("encoding","utf-8"))
                if len(raw)>MAX_WRITE_BYTES: raise ValueError(f"write exceeds {MAX_WRITE_BYTES} bytes")
                output.parent.mkdir(parents=True,exist_ok=True); tmp=output.with_suffix(output.suffix+".tmp"); tmp.write_bytes(raw); tmp.replace(output)
                result={"output":str(output.relative_to(root)),"bytes":len(raw),"sha256":sha256_file(output)}
            elif step.op=="HASH_TREE":
                result=hash_tree(path or root,max_files=int(args.get("max_files",25000))); result.pop("entries",None)
            elif step.op=="INDEX_CORPUS":
                if output is None: raise ValueError("INDEX_CORPUS requires output")
                report=write_catalog(path or root,output); result={"output":str(output.relative_to(root)),"items":len(report["items"]),**report["dedupe"]}
            elif step.op=="RUN_VERIFICATION":
                verify_root=path or root; result=verify_manifest(verify_root)
                if result["status"]!="PASS": raise ValueError(f"release verification failed: {result['errors']}")
            elif step.op=="TRAIN_LOCAL_BOUNDED":
                result=_bounded_training_profile(root,path,output,args)
            else:
                raise ValueError(f"unsupported op {step.op}")
            results.append({"step":i,"op":step.op,"status":"PASS","result":result})
    except Exception as exc:
        results.append({"step":len(results),"op":steps[len(results)].op if len(results)<len(steps) else "UNKNOWN","status":"FAIL","error":type(exc).__name__,"detail":str(exc)})
        return {**validation,"status":"FAIL","executed":True,"results":results,"failure_step":len(results)-1}
    run_fp=sha256(json.dumps(results,sort_keys=True,separators=(",",":"),default=str).encode()).hexdigest()
    return {**validation,"status":"PASS","executed":True,"results":results,"run_fingerprint":run_fp}
