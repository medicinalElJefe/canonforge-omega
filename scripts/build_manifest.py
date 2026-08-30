from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
EXCLUDE_DIRS={".git",".pytest_cache","__pycache__","node_modules","runtime-data","release"}
EXCLUDE_FILES={"omega.manifest.json","SHA256SUMS.txt"}


def selected_files():
    for p in sorted(x for x in ROOT.rglob("*") if x.is_file()):
        rel=p.relative_to(ROOT)
        if any(part in EXCLUDE_DIRS for part in rel.parts): continue
        if rel.as_posix() in EXCLUDE_FILES: continue
        if p.suffix in {".pyc",".pyo"}: continue
        yield p


def digest(path:Path): return sha256(path.read_bytes()).hexdigest()

files=[{"path":p.relative_to(ROOT).as_posix(),"sha256":digest(p),"bytes":p.stat().st_size} for p in selected_files()]
manifest={
    "name":"OMEGA Genesis",
    "version":"1.1.0",
    "authority":"one canonical packet / one proof chain / append-only state journal",
    "atlas_states":20736,
    "mode_count":36,
    "master_surfaces":12,
    "capability_contracts":18,
    "acceptance_gates":12,
    "local_runtime":"Python sovereign host",
    "cloud_runtime":"Cloudflare Worker + SQLite Durable Object",
    "private_corpus_policy":"names/hashes/contracts only; no private Drive identifiers/content published",
    "files":files,
}
(ROOT/"omega.manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
lines=[f"{row['sha256']}  {row['path']}" for row in files]
lines.append(f"{digest(ROOT/'omega.manifest.json')}  omega.manifest.json")
(ROOT/"SHA256SUMS.txt").write_text("\n".join(lines)+"\n",encoding="utf-8")
print(json.dumps({"status":"PASS","files":len(files),"manifest":"omega.manifest.json","sha256s":"SHA256SUMS.txt"},indent=2))
