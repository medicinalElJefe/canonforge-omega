from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from omega_genesis.release import verify_manifest, sha256_file

RELEASE=ROOT/"release"
RELEASE.mkdir(exist_ok=True)
manifest=json.loads((ROOT/"omega.manifest.json").read_text(encoding="utf-8"))
verification=verify_manifest(ROOT)
if verification["status"]!="PASS": raise SystemExit(json.dumps(verification,indent=2))
name=f"OMEGA_Genesis_v{manifest['version'].replace('.','_')}_Full_Repository.zip"
out=RELEASE/name
members=[row["path"] for row in manifest["files"]]+["omega.manifest.json","SHA256SUMS.txt"]
with ZipFile(out,"w",compression=ZIP_DEFLATED,compresslevel=9) as z:
    for rel in sorted(members):
        raw=(ROOT/rel).read_bytes(); info=ZipInfo(rel,date_time=(2026,8,30,0,0,0)); info.compress_type=ZIP_DEFLATED; info.external_attr=0o644<<16
        z.writestr(info,raw)
sha=sha256_file(out)
(RELEASE/(name+".sha256")).write_text(f"{sha}  {name}\n",encoding="utf-8")
print(json.dumps({"status":"PASS","path":str(out),"bytes":out.stat().st_size,"sha256":sha,"manifest":verification},indent=2))
