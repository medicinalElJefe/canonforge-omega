from __future__ import annotations

from dataclasses import dataclass, asdict
from hashlib import sha256
import json
from pathlib import Path
import re
from typing import Iterable

@dataclass(frozen=True, slots=True)
class CorpusItem:
    path: str
    name: str
    size: int
    sha256: str
    disposition: str
    authority: int
    role: str
    reason: str

RULES = [
    (r"OMEGA_ONE_SYSTEM_FULL_SOFTWARE_MENU_LEDGER", "KEEP", 100, "CONTROL_LEDGER", "One-system menu/capability/acceptance design authority."),
    (r"OMEGA_ALL_SOFTWARE_61917364224D_FULL_BUILD", "KEEP", 98, "SOFTWARE_LEDGER", "High-capacity software inventory/design map."),
    (r"Math_Atlas_20736D_FullCanon_GraphEdges", "KEEP", 98, "ATLAS_GRAPH", "20,736 address/graph source."),
    (r"canon_relational_geometry_mode188", "KEEP", 97, "MODE188_CALCULUS", "Mode-188 relational geometry source."),
    (r"HYBRID_LINK.*BRIDGE|HYBRID_LINK_61917364224D", "MERGE", 94, "HYBRID_LINK", "Governed host bridge donor."),
    (r"CORRESPONDENCE_LEDGER|ACCEPTANCE|QA|VERIFY", "KEEP", 95, "PROOF_QA", "Evidence, regression or acceptance authority."),
    (r"CanonConsole|Canon.?Forge|Sovereign Runtime", "MERGE", 86, "RUNTIME_DONOR", "Executable governance/runtime donor."),
    (r"Renderer|Mandala|Traversal|WorldEngine|ApexWorld", "MERGE", 80, "VISUAL_DONOR", "Projection/traversal donor; render cannot own truth."),
    (r"PATCHED|FIXED|FIX\d|repair", "DONOR", 64, "REPAIR_DONOR", "Repair descendant requiring comparison, never automatic authority."),
    (r"prototype|old|legacy|archive", "DONOR", 45, "HISTORICAL", "Historical/prototype source."),
]

def classify_name(name: str) -> tuple[str,int,str,str]:
    for pattern, disposition, authority, role, reason in RULES:
        if re.search(pattern, name, re.I): return disposition, authority, role, reason
    return "QUARANTINE", 0, "UNKNOWN", "No explicit authority rule; inspect before admission."

def hash_file(path: Path) -> str:
    h=sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""): h.update(block)
    return h.hexdigest()

def index_root(root: Path) -> list[CorpusItem]:
    root=Path(root).resolve(); out=[]
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        disp,authority,role,reason=classify_name(path.name)
        out.append(CorpusItem(str(path.relative_to(root)), path.name, path.stat().st_size, hash_file(path), disp, authority, role, reason))
    return out

def deduplicate(items: Iterable[CorpusItem]) -> dict[str, object]:
    groups={}
    for item in items: groups.setdefault(item.sha256,[]).append(item)
    duplicate_groups=[v for v in groups.values() if len(v)>1]
    return {"unique_hashes":len(groups),"duplicate_groups":len(duplicate_groups),"duplicate_files":sum(len(g)-1 for g in duplicate_groups)}

def write_catalog(root: Path, destination: Path) -> dict[str, object]:
    items=index_root(root); report={"root":str(Path(root).resolve()),"items":[asdict(x) for x in items],"dedupe":deduplicate(items)}
    Path(destination).parent.mkdir(parents=True,exist_ok=True); Path(destination).write_text(json.dumps(report,indent=2),encoding="utf-8")
    return report

def main() -> None:
    import argparse
    p=argparse.ArgumentParser(); p.add_argument("root"); p.add_argument("--out",default="runtime-data/corpus.json"); a=p.parse_args()
    report=write_catalog(Path(a.root),Path(a.out)); print(json.dumps({"items":len(report["items"]),**report["dedupe"]},indent=2))
