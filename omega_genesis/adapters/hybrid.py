from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Any
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

from ..corpus import write_catalog
from ..release import hash_tree, sha256_file, verify_manifest
from ..training import train_local
from ..reality import RealityConfig, analyze_delimited
from .workbook import inspect_workbook

ALLOWED_OPS={
    "READ_FILE","READ_TEXT","WRITE_OUTPUT","HASH_TREE","INDEX_CORPUS","INDEX","SEARCH_TEXT",
    "SAFE_IMPORT","WORKBOOK_AUDIT","RUN_VERIFICATION","TRAIN_LOCAL_BOUNDED","TRAIN_LOCAL",
    "BUILD","TEST","PACKAGE","SUPPORT_BUNDLE","APPLY_PATCH","REALITY_ANALYZE"
}
MAX_READ_BYTES=2*1024*1024
MAX_WRITE_BYTES=2*1024*1024
MAX_SEARCH_FILES=5000
MAX_SEARCH_MATCHES=500
MAX_PACKAGE_FILES=10_000
MAX_PACKAGE_BYTES=256*1024*1024
MAX_LOG_CHARS=16_000
BUILD_TIMEOUT=20*60
EXCLUDED_PARTS={".git","node_modules","dist","build",".venv",".omega-venv","__pycache__",".pytest_cache","release"}
TEXT_SUFFIXES={".txt",".md",".csv",".json",".jsonl",".py",".js",".ts",".tsx",".jsx",".html",".css",".toml",".yaml",".yml",".xml",".ps1",".bat",".cmd"}

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


def _rel(root:Path,path:Path)->str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def _fingerprint(value:Any)->str:
    return sha256(json.dumps(value,sort_keys=True,separators=(",",":"),default=str).encode("utf-8")).hexdigest()


def validate_plan(root:Path,steps:list[HybridStep])->dict:
    root=Path(root).resolve(); errors=[]; warnings=[]
    for i,step in enumerate(steps):
        if step.op not in ALLOWED_OPS: errors.append(f"step {i}: op not allowed: {step.op}")
        for candidate in (step.path,step.output):
            if candidate:
                try: _safe(root,candidate)
                except ValueError: errors.append(f"step {i}: path escapes approved root")
        args=step.args or {}
        if step.op=="WRITE_OUTPUT":
            content=str(args.get("content",""))
            if len(content.encode("utf-8"))>MAX_WRITE_BYTES: errors.append(f"step {i}: output exceeds {MAX_WRITE_BYTES} bytes")
        if step.op in {"BUILD","TEST"} and not bool(args.get("confirmed",False)):
            errors.append(f"step {i}: {step.op} requires confirmed=true")
        if step.op=="APPLY_PATCH":
            if not args.get("before_sha256"): errors.append(f"step {i}: APPLY_PATCH requires before_sha256")
            if "content" not in args: errors.append(f"step {i}: APPLY_PATCH requires replacement content")
        if step.op in {"BUILD","TEST"} and (step.path in (None,"",".")):
            errors.append(f"step {i}: broad-root {step.op} forbidden; discover a child project first")
    payload=[asdict(s) for s in steps]
    fp=_fingerprint(payload)
    return {"status":"PASS" if not errors else "FAIL","errors":errors,"warnings":warnings,"plan_fingerprint":fp,"policy":"typed plans only; approved-root containment; no arbitrary shell; build/test require explicit confirmation; host writes remain reversible or output-scoped"}


def _read_text(path:Path)->dict[str,Any]:
    if not path.is_file(): raise FileNotFoundError(str(path))
    size=path.stat().st_size
    if size>MAX_READ_BYTES: raise ValueError(f"read exceeds {MAX_READ_BYTES} bytes")
    raw=path.read_bytes()
    return {"bytes":size,"sha256":sha256(raw).hexdigest(),"text":raw.decode("utf-8",errors="replace")}


def _search(root:Path,base:Path,pattern:str)->dict[str,Any]:
    if not pattern: raise ValueError("SEARCH_TEXT requires args.pattern")
    case=bool(False)
    matches=[]; scanned=0
    targets=[base] if base.is_file() else sorted(p for p in base.rglob("*") if p.is_file())
    needle=pattern if case else pattern.lower()
    for p in targets:
        if scanned>=MAX_SEARCH_FILES or len(matches)>=MAX_SEARCH_MATCHES: break
        if p.suffix.lower() not in TEXT_SUFFIXES or p.stat().st_size>MAX_READ_BYTES: continue
        if any(part in EXCLUDED_PARTS for part in p.relative_to(root).parts): continue
        scanned+=1
        text=p.read_text(encoding="utf-8",errors="ignore")
        for line_no,line in enumerate(text.splitlines(),1):
            hay=line if case else line.lower()
            if needle in hay:
                matches.append({"path":_rel(root,p),"line":line_no,"text":line[:500],"source_sha256":sha256_file(p)})
                if len(matches)>=MAX_SEARCH_MATCHES: break
    return {"pattern":pattern,"scanned_files":scanned,"matches":matches,"truncated":len(matches)>=MAX_SEARCH_MATCHES}


def _iter_package_files(base:Path):
    targets=[base] if base.is_file() else sorted(p for p in base.rglob("*") if p.is_file())
    for p in targets:
        rel=p.relative_to(base if base.is_dir() else base.parent)
        if any(part in EXCLUDED_PARTS for part in rel.parts): continue
        yield p,rel


def _deterministic_zip(base:Path,output:Path)->dict[str,Any]:
    rows=[]; total=0
    for p,rel in _iter_package_files(base):
        if len(rows)>=MAX_PACKAGE_FILES: raise ValueError("package file limit exceeded")
        size=p.stat().st_size; total+=size
        if total>MAX_PACKAGE_BYTES: raise ValueError("package byte limit exceeded")
        rows.append((p,rel))
    output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,"w",compression=ZIP_DEFLATED,compresslevel=9) as z:
        for p,rel in rows:
            info=ZipInfo(rel.as_posix(),date_time=(2026,8,30,0,0,0)); info.compress_type=ZIP_DEFLATED; info.external_attr=0o644<<16
            z.writestr(info,p.read_bytes())
    return {"output":str(output),"files":len(rows),"source_bytes":total,"package_bytes":output.stat().st_size,"sha256":sha256_file(output)}


def _run_profile(project:Path,op:str,profile:str)->dict[str,Any]:
    profile=(profile or "AUTO_BUILD").upper()
    if profile=="AUTO_BUILD":
        if (project/"package.json").is_file(): profile="NODE_BUILD"
        elif any(project.glob("*.sln")): profile="DOTNET_BUILD"
        elif (project/"pyproject.toml").is_file() or (project/"setup.py").is_file(): profile="PYTHON_TEST" if op=="TEST" else "PYTHON_COMPILE"
        else: raise ValueError("no recognized project marker; run INDEX first")
    commands={
        ("BUILD","NODE_BUILD"):["npm","run","build"],
        ("TEST","NODE_BUILD"):["npm","test","--","--runInBand"],
        ("BUILD","DOTNET_BUILD"):["dotnet","build","--nologo"],
        ("TEST","DOTNET_BUILD"):["dotnet","test","--nologo"],
        ("BUILD","PYTHON_COMPILE"):[sys.executable,"-m","compileall","-q","."],
        ("TEST","PYTHON_TEST"):[sys.executable,"-m","pytest","-q"],
    }
    cmd=commands.get((op,profile))
    if not cmd: raise ValueError(f"unsupported fixed profile {profile} for {op}")
    proc=subprocess.run(cmd,cwd=project,capture_output=True,text=True,timeout=BUILD_TIMEOUT,shell=False)
    log=(proc.stdout+"\n"+proc.stderr)[-MAX_LOG_CHARS:]
    result={"profile":profile,"argv":cmd,"exit_code":proc.returncode,"bounded_log":log,"status":"PASS" if proc.returncode==0 else "FAIL"}
    result["result_fingerprint"]=_fingerprint(result)
    return result


def _support_bundle(root:Path,output:Path)->dict[str,Any]:
    allow=["omega.manifest.json","SHA256SUMS.txt","runtime-data/proof.jsonl","runtime-data/state_history.jsonl","runtime-data/canonical_state.json"]
    tmp=[]
    for rel in allow:
        p=(root/rel).resolve()
        if p.is_file() and (root==p or root in p.parents): tmp.append((p,Path(rel)))
    output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,"w",compression=ZIP_DEFLATED,compresslevel=9) as z:
        for p,rel in tmp:
            info=ZipInfo(rel.as_posix(),date_time=(2026,8,30,0,0,0)); info.compress_type=ZIP_DEFLATED; info.external_attr=0o644<<16
            z.writestr(info,p.read_bytes())
        policy={"schema":"OMEGA_SUPPORT_BUNDLE_V1","credentials_included":False,"environment_included":False,"files":[r.as_posix() for _,r in tmp],"boundary":"diagnostics/proof only; no credentials, unrestricted source, .env or tokens"}
        info=ZipInfo("SUPPORT_POLICY.json",date_time=(2026,8,30,0,0,0)); info.compress_type=ZIP_DEFLATED; info.external_attr=0o644<<16
        z.writestr(info,json.dumps(policy,indent=2).encode())
    return {"output":_rel(root,output),"sha256":sha256_file(output),"files":len(tmp)+1,"redaction_boundary":"no credentials/.env/tokens/unrestricted source"}


def _apply_patch(root:Path,path:Path,args:dict[str,Any])->dict[str,Any]:
    if not path.is_file(): raise FileNotFoundError(str(path))
    before=sha256_file(path)
    if before!=str(args["before_sha256"]).lower(): raise ValueError("before_sha256 mismatch; patch held")
    raw=str(args["content"]).encode("utf-8")
    if len(raw)>MAX_WRITE_BYTES: raise ValueError("replacement exceeds write limit")
    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup=(root/".omega"/"backups"/stamp/path.relative_to(root)).resolve(); backup.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(path,backup)
    tmp=path.with_suffix(path.suffix+".tmp"); tmp.write_bytes(raw); tmp.replace(path)
    after=sha256_file(path)
    return {"path":_rel(root,path),"pre_hash":before,"post_hash":after,"backup_path":_rel(root,backup),"rollback_path":_rel(root,backup),"reversible":True}


def execute_plan(root:Path,steps:list[HybridStep])->dict[str,Any]:
    root=Path(root).resolve(); validation=validate_plan(root,steps)
    if validation["status"]!="PASS": return {**validation,"executed":False,"results":[]}
    results=[]
    try:
        for i,step in enumerate(steps):
            args=dict(step.args or {}); path=_safe(root,step.path); output=_safe(root,step.output)
            op=step.op
            if op in {"READ_FILE","READ_TEXT"}:
                if path is None: raise ValueError(f"{op} requires path")
                result={"path":_rel(root,path),**_read_text(path)}
            elif op=="WRITE_OUTPUT":
                if output is None: raise ValueError("WRITE_OUTPUT requires output")
                raw=str(args.get("content","")).encode("utf-8"); output.parent.mkdir(parents=True,exist_ok=True); tmp=output.with_suffix(output.suffix+".tmp"); tmp.write_bytes(raw); tmp.replace(output)
                result={"output":_rel(root,output),"bytes":len(raw),"sha256":sha256_file(output)}
            elif op=="HASH_TREE":
                result=hash_tree(path or root,max_files=int(args.get("max_files",25000))); result.pop("entries",None)
            elif op in {"INDEX_CORPUS","INDEX"}:
                dest=output or root/".omega"/"index"/"corpus.json"; report=write_catalog(path or root,dest); result={"output":_rel(root,dest),"items":len(report["items"]),**report["dedupe"]}
            elif op=="SEARCH_TEXT":
                result=_search(root,path or root,str(args.get("pattern","")))
            elif op=="SAFE_IMPORT":
                if path is None or output is None: raise ValueError("SAFE_IMPORT requires path and output")
                if not path.is_file(): raise FileNotFoundError(str(path))
                output.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(path,output)
                result={"source":_rel(root,path),"quarantine_copy":_rel(root,output),"sha256":sha256_file(output),"executed":False,"classification":"QUARANTINE"}
            elif op=="WORKBOOK_AUDIT":
                if path is None: raise ValueError("WORKBOOK_AUDIT requires path")
                result=inspect_workbook(root,_rel(root,path)); result["status"]="PASS"
            elif op=="RUN_VERIFICATION":
                result=verify_manifest(path or root)
                if result["status"]!="PASS": raise ValueError(f"release verification failed: {result['errors']}")
            elif op=="REALITY_ANALYZE":
                if path is None: raise ValueError("REALITY_ANALYZE requires path")
                text=_read_text(path)["text"]
                cfg=RealityConfig(**dict(args.get("config") or {}))
                result=analyze_delimited(text,cfg)
            elif op in {"TRAIN_LOCAL_BOUNDED","TRAIN_LOCAL"}:
                rel=_rel(root,path) if path else "."
                result=train_local(root,rel,proof_lessons=list(args.get("proof_lessons",[])))
                if result.get("status")!="PASS":
                    raise ValueError(f"training held: {result.get('reason')}")
                if output is not None:
                    output.parent.mkdir(parents=True,exist_ok=True)
                    profile={
                        "schema":"OMEGA_LOCAL_TRAINING_PROFILE_V1",
                        "status":"PASS",
                        "corpus_fingerprint":result.get("corpus_fingerprint"),
                        "model_fingerprint":result.get("model_fingerprint"),
                        "training_receipt":result.get("fingerprint"),
                        "release_id":result.get("release_id"),
                        "source_files":result.get("source_files"),
                        "source_bytes":result.get("source_bytes"),
                        "foundationWeightsChanged":False,
                        "sourceUploaded":False,
                    }
                    tmp=output.with_suffix(output.suffix+".tmp")
                    tmp.write_text(json.dumps(profile,indent=2),encoding="utf-8")
                    tmp.replace(output)
                    result["profile_output"]=_rel(root,output)
                    result["profile_sha256"]=sha256_file(output)
            elif op in {"BUILD","TEST"}:
                if path is None or not path.is_dir(): raise ValueError(f"{op} requires a project directory")
                result=_run_profile(path,op,str(args.get("profile","AUTO_BUILD")))
                if result["status"]!="PASS": raise ValueError(f"{op} failed with exit code {result['exit_code']}")
            elif op=="PACKAGE":
                if path is None or output is None: raise ValueError("PACKAGE requires path and output")
                result=_deterministic_zip(path,output); result["output"]=_rel(root,output)
            elif op=="SUPPORT_BUNDLE":
                dest=output or root/".omega"/"support"/"OMEGA_SUPPORT.zip"; result=_support_bundle(root,dest)
            elif op=="APPLY_PATCH":
                if path is None: raise ValueError("APPLY_PATCH requires path")
                result=_apply_patch(root,path,args)
            else:
                raise ValueError(f"unsupported op {op}")
            results.append({"step":i,"op":op,"status":"PASS","result":result})
    except Exception as exc:
        results.append({"step":len(results),"op":steps[len(results)].op if len(results)<len(steps) else "UNKNOWN","status":"FAIL","error":type(exc).__name__,"detail":str(exc)})
        return {**validation,"status":"FAIL","executed":True,"results":results,"failure_step":len(results)-1}
    run_fp=_fingerprint(results)
    return {**validation,"status":"PASS","executed":True,"results":results,"run_fingerprint":run_fp}
