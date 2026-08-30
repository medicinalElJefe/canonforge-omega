from __future__ import annotations
from dataclasses import dataclass, asdict
from hashlib import sha256
import json
from pathlib import Path

ALLOWED_OPS={"READ_FILE","WRITE_OUTPUT","HASH_TREE","INDEX_CORPUS","RUN_VERIFICATION","TRAIN_LOCAL_BOUNDED"}

@dataclass(frozen=True,slots=True)
class HybridStep:
    op:str
    path:str|None=None
    output:str|None=None
    args:dict|None=None

def validate_plan(root:Path,steps:list[HybridStep])->dict:
    root=Path(root).resolve(); errors=[]
    for i,step in enumerate(steps):
        if step.op not in ALLOWED_OPS: errors.append(f"step {i}: op not allowed: {step.op}")
        for candidate in (step.path,step.output):
            if candidate:
                p=(root/candidate).resolve()
                if root!=p and root not in p.parents: errors.append(f"step {i}: path escapes approved root")
    payload=[asdict(s) for s in steps]
    fp=sha256(json.dumps(payload,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    return {"status":"PASS" if not errors else "FAIL","errors":errors,"plan_fingerprint":fp,"policy":"typed plans only; no arbitrary shell; host writes remain inside approved root"}
