from __future__ import annotations

import argparse
import base64
import ctypes
from ctypes import wintypes
import json
import os
from pathlib import Path
import secrets
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .adapters.hybrid import HybridStep, execute_plan


class DATA_BLOB(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_byte))]


def _dpapi_protect(raw: bytes) -> str:
    if os.name != "nt":
        raise RuntimeError("DPAPI storage is Windows-only")
    blob_in = DATA_BLOB(len(raw), ctypes.cast(ctypes.create_string_buffer(raw), ctypes.POINTER(ctypes.c_byte)))
    blob_out = DATA_BLOB()
    if not ctypes.windll.crypt32.CryptProtectData(ctypes.byref(blob_in), "OMEGA Desktop Link", None, None, None, 0, ctypes.byref(blob_out)):
        raise ctypes.WinError()
    try:
        protected = ctypes.string_at(blob_out.pbData, blob_out.cbData)
        return base64.b64encode(protected).decode("ascii")
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)


def _dpapi_unprotect(encoded: str) -> bytes:
    if os.name != "nt":
        raise RuntimeError("DPAPI storage is Windows-only")
    raw = base64.b64decode(encoded)
    blob_in = DATA_BLOB(len(raw), ctypes.cast(ctypes.create_string_buffer(raw), ctypes.POINTER(ctypes.c_byte)))
    blob_out = DATA_BLOB()
    if not ctypes.windll.crypt32.CryptUnprotectData(ctypes.byref(blob_in), None, None, None, None, 0, ctypes.byref(blob_out)):
        raise ctypes.WinError()
    try:
        return ctypes.string_at(blob_out.pbData, blob_out.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)


def _post(base: str, path: str, payload: dict[str, Any], token: str | None = None, timeout: int = 30) -> dict[str, Any]:
    headers = {"Content-Type": "application/json", "User-Agent": "OMEGA-Desktop-Link/1.1"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(base.rstrip("/") + path, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try: detail = json.loads(body)
        except Exception: detail = {"detail": body}
        raise RuntimeError(f"HTTP {e.code}: {detail}") from e
    except URLError as e:
        raise RuntimeError(f"link transport unavailable: {e}") from e


def _config_path(root: Path) -> Path:
    p = root / ".omega" / "desktop-link.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def pair(root: Path, cloud: str, code: str, name: str) -> dict[str, Any]:
    if os.name != "nt":
        raise RuntimeError("Desktop Link pairing requires Windows so the device token can be DPAPI-protected")
    response = _post(cloud, "/api/link/claim", {"code": code.strip(), "device_name": name})
    token = str(response.pop("device_token"))
    cfg = {"schema":"OMEGA_DESKTOP_LINK_CONFIG_V1","cloud_url":cloud.rstrip("/"),"device_id":response["device_id"],"device_name":name,"token_dpapi":_dpapi_protect(token.encode("utf-8")),"approved_root":str(root.resolve())}
    _config_path(root).write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    return {**response, "approved_root": str(root.resolve()), "token_persisted": "WINDOWS_DPAPI_CURRENT_USER"}


def _load(root: Path) -> tuple[dict[str, Any], str]:
    cfg = json.loads(_config_path(root).read_text(encoding="utf-8"))
    if Path(cfg["approved_root"]).resolve() != root.resolve():
        raise RuntimeError("configured approved root does not match current root")
    token = _dpapi_unprotect(cfg["token_dpapi"]).decode("utf-8")
    return cfg, token


def _proof_packet(job: dict[str, Any], run: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema": "OMEGA_DESKTOP_LINK_RETURN_V1",
        "job_id": job["job_id"],
        "device_id": job["device_id"],
        "status": run.get("status"),
        "plan_fingerprint": job.get("plan_fingerprint"),
        "run_fingerprint": run.get("run_fingerprint"),
        "results": run.get("results", []),
        "hostStateMutation": False,
        "canonicalCommitAuthority": False,
        "sourceUploaded": False,
    }


def cycle(root: Path, *, once: bool = False, poll_seconds: int = 4) -> None:
    cfg, token = _load(root)
    cloud, device_id = cfg["cloud_url"], cfg["device_id"]
    stop = root / ".omega" / "STOP_DESKTOP_LINK"
    print(f"OMEGA Desktop Link online: {cfg['device_name']} · {device_id}")
    print(f"Approved root: {root}")
    print("No arbitrary shell endpoint is enabled. Ctrl+C stops the worker.")
    while True:
        if stop.exists():
            print("Emergency stop file detected; exiting.")
            return
        try:
            hb = _post(cloud, "/api/link/heartbeat", {"device_id":device_id,"capabilities":["INDEX","READ_TEXT","SEARCH_TEXT","HASH_TREE","WORKBOOK_AUDIT","BUILD","TEST","PACKAGE","SUPPORT_BUNDLE","APPLY_PATCH","TRAIN_LOCAL"]}, token)
            nxt = _post(cloud, "/api/link/next", {"device_id":device_id}, token)
            job = nxt.get("job")
            if job:
                steps = [HybridStep(str(x["op"]), x.get("path"), x.get("output"), x.get("args")) for x in job.get("steps", [])]
                run = execute_plan(root, steps)
                proof = _proof_packet(job, run)
                _post(cloud, "/api/link/complete", {"device_id":device_id,"job_id":job["job_id"],"result":proof}, token, timeout=60)
                print(json.dumps({"job":job["job_id"],"status":run.get("status"),"run_fingerprint":run.get("run_fingerprint")}, indent=2))
        except Exception as exc:
            print(f"Desktop Link cycle error: {exc}", file=sys.stderr)
        if once:
            return
        time.sleep(max(2, min(60, poll_seconds)))


def main() -> None:
    ap = argparse.ArgumentParser(description="OMEGA Genesis sovereign Windows Desktop Link")
    ap.add_argument("--root", required=True, help="One approved project/Drive-for-Desktop subtree")
    ap.add_argument("--cloud", help="OMEGA Genesis cloud URL")
    ap.add_argument("--pair-code", help="One-time pairing code from Mission Control")
    ap.add_argument("--name", default=os.environ.get("COMPUTERNAME", "OMEGA Windows Host"))
    ap.add_argument("--once", action="store_true")
    args = ap.parse_args()
    root = Path(args.root).expanduser().resolve()
    if not root.is_dir():
        raise SystemExit("approved root must be an existing directory")
    cfg_path = _config_path(root)
    if args.pair_code:
        if not args.cloud: raise SystemExit("--cloud is required while pairing")
        print(json.dumps(pair(root,args.cloud,args.pair_code,args.name),indent=2))
    elif not cfg_path.is_file():
        raise SystemExit("not paired; supply --cloud and --pair-code")
    cycle(root, once=args.once)


if __name__ == "__main__":
    main()
