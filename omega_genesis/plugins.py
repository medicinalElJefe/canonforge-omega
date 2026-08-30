from __future__ import annotations
import json, subprocess, sys
from pathlib import Path
from typing import Any

ALLOWED_PERMISSIONS={"read_project","write_output","atlas_query","render_submit","network_local","corpus_query","state_read","state_propose"}
ALLOWED_CAPABILITIES={"atlas.query","render.submit","corpus.search","state.read","state.propose","forecast.evaluate","audio.render","host.observe"}
FORBIDDEN_MUTATIONS={"canonical.commit","evidence.promote","proof.rewrite","shell.exec","arbitrary.network"}
REQUIRED={"id","name","version","entry","permissions","capabilities","api_version"}

def validate_manifest(data: dict[str,Any]) -> dict[str,Any]:
    missing=sorted(REQUIRED-set(data)); permissions=set(data.get("permissions",[])); capabilities=set(data.get("capabilities",[])); mutations=set(data.get("mutations",[]))
    errors=[]
    if missing: errors.append(f"missing fields: {', '.join(missing)}")
    unknown_p=sorted(permissions-ALLOWED_PERMISSIONS)
    unknown_c=sorted(capabilities-ALLOWED_CAPABILITIES)
    forbidden=sorted(mutations & FORBIDDEN_MUTATIONS)
    if unknown_p: errors.append(f"unknown permissions: {', '.join(unknown_p)}")
    if unknown_c: errors.append(f"unknown capabilities: {', '.join(unknown_c)}")
    if forbidden: errors.append(f"forbidden mutations: {', '.join(forbidden)}")
    return {"status":"PASS" if not errors else "FAIL","errors":errors,"manifest_id":data.get("id")}

def inspect_plugin(plugin_dir: Path) -> dict[str,Any]:
    plugin_dir=Path(plugin_dir).resolve(); manifest_path=plugin_dir/"plugin.json"
    if not manifest_path.is_file(): return {"status":"FAIL","errors":["plugin.json missing"]}
    data=json.loads(manifest_path.read_text(encoding="utf-8")); check=validate_manifest(data)
    if check["status"]!="PASS": return {**check,"manifest":data}
    entry=(plugin_dir/data["entry"]).resolve()
    if plugin_dir not in entry.parents: return {"status":"FAIL","errors":["entry escapes plugin directory"],"manifest":data}
    return {"status":"PASS","manifest":data,"entry":str(entry)}

def run_isolated(plugin_dir: Path, payload: dict[str,Any], timeout: int=30) -> dict[str,Any]:
    inspection=inspect_plugin(plugin_dir)
    if inspection["status"]!="PASS": return inspection
    manifest=inspection["manifest"]; entry=inspection["entry"]
    env={"PYTHONIOENCODING":"utf-8","OMEGA_PLUGIN_PERMISSIONS":json.dumps(manifest["permissions"]),"OMEGA_PLUGIN_CAPABILITIES":json.dumps(manifest["capabilities"]),"OMEGA_CANONICAL_COMMIT":"DENIED"}
    proc=subprocess.run([sys.executable,entry],input=json.dumps(payload),capture_output=True,text=True,timeout=timeout,env=env,cwd=str(Path(plugin_dir).resolve()))
    return {"status":"PASS" if proc.returncode==0 else "FAIL","returncode":proc.returncode,"stdout":proc.stdout[-12000:],"stderr":proc.stderr[-12000:],"manifest":manifest}
