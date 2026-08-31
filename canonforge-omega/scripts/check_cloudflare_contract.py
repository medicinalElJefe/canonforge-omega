from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def exported_classes(source_root: Path) -> set[str]:
    found: set[str] = set()
    pattern = re.compile(r"\bexport\s+class\s+([A-Za-z_$][\w$]*)\b")
    for path in source_root.rglob("*"):
        if path.suffix not in {".ts", ".js", ".mjs", ".mts"} or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        found.update(pattern.findall(text))
    return found


def evaluate(contract_path: Path, source_root: Path) -> dict:
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    required = set(contract.get("required_exports") or [])
    exported = exported_classes(source_root)
    missing = sorted(required - exported)
    return {
        "status": "PASS" if not missing else "HOLD",
        "compatible": not missing,
        "required_exports": sorted(required),
        "observed_exports": sorted(exported),
        "missing_exports": missing,
        "boundary": "HOLD means do not deploy over the canonical Worker until live Durable Object exports are behaviorally recovered and preserved.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check a Worker candidate against the observed live Cloudflare contract")
    parser.add_argument("--contract", default="config/cloudflare_live_contract.json")
    parser.add_argument("--source", default="cloudflare/omega-v6-worker/src")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    result = evaluate(Path(args.contract), Path(args.source))
    print(json.dumps(result, sort_keys=True))
    return 1 if args.strict and not result["compatible"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
