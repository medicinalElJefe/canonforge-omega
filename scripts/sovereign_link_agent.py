from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import socket
import sys
import time
import urllib.error
import urllib.request
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omega_genesis.adapters.hybrid import HybridStep, execute_plan
from omega_genesis.link_protocol import verify_job
from omega_genesis.sovereign_status import read_status

DEFAULT_SERVICE = "https://omega-genesis-v1.jeffdeweyeljefe.workers.dev"
DEFAULT_CONFIG = Path.home() / ".omega" / "link-device.json"
STATUS_PATH = ROOT / "release" / "sovereign-host" / "status.json"
CLOUD_CAPABILITIES = ["BUILD","TEST","INDEX","READ_TEXT","SEARCH_TEXT","HASH_TREE","WORKBOOK_AUDIT","PACKAGE","SUPPORT_BUNDLE","APPLY_PATCH","TRAIN_LOCAL","REALITY_ANALYZE"]
_SEEN_NONCES: set[str] = set()


def clean_service_url(value: str) -> str:
    url = str(value or "").strip().rstrip("/")
    if not url.startswith("https://") and not url.startswith("http://127.0.0.1") and not url.startswith("http://localhost"):
        raise ValueError("service URL must use HTTPS except for explicit localhost development")
    return url


def request_json(service: str, path: str, *, body: dict[str, Any] | None = None, token: str | None = None, timeout: int = 30) -> dict[str, Any]:
    data = None if body is None else json.dumps(body, separators=(",", ":")).encode("utf-8")
    headers = {"Accept": "application/json"}
    if data is not None: headers["Content-Type"] = "application/json"
    if token: headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(service + path, data=data, method="POST" if data is not None else "GET", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
            if not isinstance(payload, dict): raise RuntimeError("OMEGA Link returned non-object JSON")
            return payload
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:2000]
        raise RuntimeError(f"OMEGA Link HTTP {exc.code}: {detail}") from exc


def save_config(path: Path, payload: dict[str, Any]) -> None:
    path = Path(path).expanduser(); path.parent.mkdir(parents=True, exist_ok=True); tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    try: os.chmod(tmp, 0o600)
    except OSError: pass
    tmp.replace(path)
    try: os.chmod(path, 0o600)
    except OSError: pass


def load_config(path: Path) -> dict[str, Any]:
    payload = json.loads(Path(path).expanduser().read_text(encoding="utf-8")); required = ("service_url","device_id","device_token","root")
    missing = [key for key in required if not str(payload.get(key, "")).strip()]
    if missing: raise ValueError("link config missing: " + ", ".join(missing))
    payload["service_url"] = clean_service_url(payload["service_url"]); return payload


def claim_pair(service: str, pair_code: str, config_path: Path, root: Path, device_name: str) -> dict[str, Any]:
    service = clean_service_url(service); root = Path(root).expanduser().resolve()
    if not root.is_dir(): raise ValueError(f"approved root does not exist: {root}")
    reply = request_json(service, "/api/link/claim", body={"code": pair_code.strip().upper(), "device_name": device_name})
    if reply.get("schema") != "OMEGA_LINK_DEVICE_V1" or not reply.get("device_id") or not reply.get("device_token"): raise RuntimeError("pair claim did not return a device credential")
    config = {"schema":"omega.sovereign.link.device.v1","service_url":service,"device_id":reply["device_id"],"device_token":reply["device_token"],"device_name":reply.get("device_name",device_name),"root":str(root),"authority":"SOVEREIGN_HOST_EXECUTOR","canonical_mutation":False}
    save_config(config_path, config); return {key:value for key,value in config.items() if key != "device_token"}


def heartbeat_payload(config: dict[str, Any]) -> dict[str, Any]:
    return {"device_id":config["device_id"],"capabilities":list(CLOUD_CAPABILITIES),"host":{"hostname":socket.gethostname()[:120],"platform":sys.platform},"sovereign_evolution":read_status(STATUS_PATH),"execution_protocol":"SIGNED_ENVELOPE_V1"}


def heartbeat(config: dict[str, Any]) -> dict[str, Any]:
    return request_json(config["service_url"], "/api/link/heartbeat", body=heartbeat_payload(config), token=config["device_token"])


def next_job(config: dict[str, Any]) -> dict[str, Any] | None:
    reply = request_json(config["service_url"], "/api/link/next", body={"device_id":config["device_id"]}, token=config["device_token"])
    envelope = reply.get("envelope")
    if not isinstance(envelope, dict): return None
    verified = verify_job(envelope, config["device_token"], seen_nonces=_SEEN_NONCES)
    if not verified.get("valid"): raise RuntimeError(f"signed job rejected: {verified.get('reason')}")
    return verified["job"]


def execute_job(config: dict[str, Any], job: dict[str, Any]) -> dict[str, Any]:
    root = Path(config["root"]).expanduser().resolve()
    if not root.is_dir(): return {"status":"FAIL","executed":False,"error":"approved_root_missing"}
    raw_steps = job.get("steps") or []
    if not isinstance(raw_steps, list) or not raw_steps: return {"status":"FAIL","executed":False,"error":"job_has_no_typed_steps"}
    steps = [HybridStep(op=str(row.get("op","")),path=row.get("path"),output=row.get("output"),args=dict(row.get("args") or {})) for row in raw_steps if isinstance(row,dict)]
    if len(steps) != len(raw_steps): return {"status":"FAIL","executed":False,"error":"invalid_step_shape"}
    result = execute_plan(root, steps); result["host_boundary"] = "signed, replay-protected job executed only through the typed Hybrid adapter under the paired approved root; no arbitrary shell endpoint"; return result


def complete_job(config: dict[str, Any], job_id: str, result: dict[str, Any]) -> dict[str, Any]:
    return request_json(config["service_url"], "/api/link/complete", body={"device_id":config["device_id"],"job_id":job_id,"result":result}, token=config["device_token"])


def cycle(config: dict[str, Any]) -> dict[str, Any]:
    hb=heartbeat(config); job=next_job(config)
    if not job: return {"status":"ONLINE","heartbeat":hb,"job":None}
    result=execute_job(config,job); receipt=complete_job(config,str(job["job_id"]),result)
    return {"status":"JOB_COMPLETED" if result.get("status")=="PASS" else "JOB_FAILED","heartbeat":hb,"job_id":job["job_id"],"result":result,"receipt":receipt}


def main() -> int:
    parser=argparse.ArgumentParser(description="OMEGA sovereign PC Hybrid Link agent"); parser.add_argument("--service",default=DEFAULT_SERVICE); parser.add_argument("--config",default=str(DEFAULT_CONFIG)); parser.add_argument("--root",default=str(ROOT)); parser.add_argument("--device-name",default=f"OMEGA Sovereign Host · {socket.gethostname()}"); parser.add_argument("--claim",metavar="PAIR_CODE"); parser.add_argument("--once",action="store_true"); parser.add_argument("--watch",action="store_true"); parser.add_argument("--interval",type=int,default=15); args=parser.parse_args(); config_path=Path(args.config).expanduser()
    if args.claim:
        visible=claim_pair(args.service,args.claim,config_path,Path(args.root),args.device_name); print(json.dumps({"status":"PAIRED","device":visible,"config":str(config_path),"secret_printed":False},indent=2)); return 0
    config=load_config(config_path)
    if args.once or not args.watch: print(json.dumps(cycle(config),indent=2,default=str)); return 0
    interval=max(5,min(60,args.interval))
    while True:
        try: print(json.dumps(cycle(config),indent=2,default=str),flush=True)
        except Exception as exc: print(json.dumps({"status":"LINK_DEGRADED","error":f"{type(exc).__name__}: {exc}","canonical_mutation":False}),flush=True)
        time.sleep(interval)


if __name__ == "__main__": raise SystemExit(main())
