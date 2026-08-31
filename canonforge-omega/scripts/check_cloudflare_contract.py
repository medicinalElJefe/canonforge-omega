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


def evaluate(contract_path: Path, source_root: Path, wrangler_path: Path | None = None) -> dict:
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    required = set(contract.get("required_exports") or [])
    exported = exported_classes(source_root)
    missing = sorted(required - exported)

    recovery = contract.get("recovery") or {}
    required_markers = list(recovery.get("behavior_markers") or [])
    source_text = "\n".join(
        path.read_text(encoding="utf-8")
        for path in source_root.rglob("*")
        if path.is_file() and path.suffix in {".ts", ".js", ".mjs", ".mts"}
    )
    missing_markers = sorted(marker for marker in required_markers if marker not in source_text)

    binding_name = recovery.get("binding_name")
    migration_tag = recovery.get("migration_tag")
    if wrangler_path is None:
        candidate = source_root.parent / "wrangler.toml"
        wrangler_path = candidate if candidate.exists() else None
    wrangler = wrangler_path.read_text(encoding="utf-8") if wrangler_path and wrangler_path.exists() else ""
    binding_preserved = True
    migration_preserved = True
    if binding_name:
        binding_preserved = (
            f'name = "{binding_name}"' in wrangler
            and 'class_name = "OmegaRuntime"' in wrangler
        )
    if migration_tag:
        migration_preserved = (
            f'tag = "{migration_tag}"' in wrangler
            and 'new_sqlite_classes = ["OmegaRuntime"]' in wrangler
        )

    compatible = not missing and not missing_markers and binding_preserved and migration_preserved
    return {
        "status": "PASS" if compatible else "HOLD",
        "compatible": compatible,
        "required_exports": sorted(required),
        "observed_exports": sorted(exported),
        "missing_exports": missing,
        "required_behavior_markers": required_markers,
        "missing_behavior_markers": missing_markers,
        "binding_preserved": binding_preserved,
        "migration_preserved": migration_preserved,
        "boundary": "HOLD means do not deploy over the canonical Worker until live Durable Object exports, recovered behavior markers, binding identity, and migration identity are preserved.",
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
