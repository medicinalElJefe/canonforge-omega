from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
EXCLUDE_DIRS={".git",".pytest_cache","__pycache__","node_modules","runtime-data","release",".venv",".omega-venv"}
EXCLUDE_FILES={"omega.manifest.json","SHA256SUMS.txt","cloud/omega-cloud/promotion.json"}


def selected_files():
    for p in sorted(x for x in ROOT.rglob("*") if x.is_file()):
        rel=p.relative_to(ROOT)
        if any(part in EXCLUDE_DIRS or part.endswith(".egg-info") for part in rel.parts):
            continue
        if rel.as_posix() in EXCLUDE_FILES:
            continue
        if p.suffix in {".pyc",".pyo"}:
            continue
        yield p


def digest(path:Path):
    return sha256(path.read_bytes()).hexdigest()


files=[{"path":p.relative_to(ROOT).as_posix(),"sha256":digest(p),"bytes":p.stat().st_size} for p in selected_files()]
manifest={
    "name":"OMEGA Genesis",
    "version":"1.1.0",
    "authority":"one canonical packet / one proof chain / append-only state journal",
    "canonical_states":20736,
    "atlas_states":20736,
    "capacity_145152":145152,
    "design_capacity":61917364224,
    "design_capacity_formula":"12^10 = 2^20 × 3^10",
    "software_systems":24,
    "software_families":6,
    "mode_count":36,
    "master_surfaces":12,
    "capability_contracts":18,
    "acceptance_gates":12,
    "local_runtime":"optional desktop/node runtime; not required for canonical cloud survival",
    "cloud_runtime":"OMEGA Cloud canonical Python host + persistent volume + authenticated HTTPS/WebSocket; Cloudflare Worker remains an optional edge adapter",
    "self_build":"governed deterministic self-build with ledger repair, reproducibility gates, cloud-container publication, quarantine, and promotion",
    "self_build_policy_version":1,
    "provenance_schema_version":1,
    "autodeploy_policy_version":1,
    "autodeploy":"host pull-based governed promotion ledger -> immutable digest deploy -> live proof/replay/provenance gate -> rollback",
    "cloud_host_bootstrap":"provider-neutral one-time Linux host initialization with secret minimization, first governed deploy, and persistent systemd watcher",
    "lineage_provenance":"sanitized Drive-derived contracts + capability lineage + evidence boundaries; validated before cloud promotion",
    "evolution_policy_version":1,
    "continuous_evolution":"observe -> diagnose -> candidate-only development -> strict no-regression comparison -> proof-gated promotion -> deploy -> observe",
    "adaptive_learning":"append-only hash-chained outcome memory with deterministic replay/recommendation; subordinate to canonical state",
    "private_corpus_policy":"names/hashes/contracts only; no private Drive identifiers/content published",
    "truth_boundary":"high-capacity values are software representation/design spaces unless independent evidence establishes a physical interpretation",
    "files":files,
}
(ROOT/"omega.manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
lines=[f"{row['sha256']}  {row['path']}" for row in files]
lines.append(f"{digest(ROOT/'omega.manifest.json')}  omega.manifest.json")
(ROOT/"SHA256SUMS.txt").write_text("\n".join(lines)+"\n",encoding="utf-8")
print(json.dumps({"status":"PASS","files":len(files),"manifest":"omega.manifest.json","sha256s":"SHA256SUMS.txt"},indent=2))
