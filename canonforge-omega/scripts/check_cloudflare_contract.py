from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

SOURCE_SUFFIXES = {".ts", ".js", ".mjs", ".mts"}
CANONICAL_REF = "refs/heads/omega-v6-full-convergence"


def exported_classes(source_root: Path) -> set[str]:
    found: set[str] = set()
    pattern = re.compile(r"\bexport\s+class\s+([A-Za-z_$][\w$]*)\b")
    for path in source_root.rglob("*"):
        if path.suffix not in SOURCE_SUFFIXES or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        found.update(pattern.findall(text))
    return found


def source_text(source_root: Path) -> str:
    parts: list[str] = []
    for path in source_root.rglob("*"):
        if path.is_file() and path.suffix in SOURCE_SUFFIXES:
            try:
                parts.append(path.read_text(encoding="utf-8"))
            except UnicodeDecodeError:
                pass
    return "\n".join(parts)


def _binding_blocks(wrangler: str) -> list[str]:
    starts = [m.start() for m in re.finditer(r"(?m)^\[\[durable_objects\.bindings\]\]\s*$", wrangler)]
    blocks: list[str] = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(wrangler)
        candidate = wrangler[start:end]
        next_section = re.search(r"(?m)^\[(?!\[)", candidate[len("[[durable_objects.bindings]]"):])
        if next_section:
            end2 = len("[[durable_objects.bindings]]") + next_section.start()
            candidate = candidate[:end2]
        blocks.append(candidate)
    return blocks


def _binding_preserved(wrangler: str, binding_name: str, class_name: str) -> bool:
    for block in _binding_blocks(wrangler):
        if f'name = "{binding_name}"' in block and f'class_name = "{class_name}"' in block:
            return True
    return False


def _export_section(wrangler: str, class_name: str) -> str:
    match = re.search(
        rf"(?ms)^\[exports\.{re.escape(class_name)}\]\s*$([\s\S]*?)(?=^\[|\Z)",
        wrangler,
    )
    return match.group(1) if match else ""


def release_lineage_guard() -> dict:
    """Hold automatic production promotion for ordinary direct pushes.

    GitHub administration/branch-protection permissions are not assumed here. This guard
    therefore protects the deployment lane itself: a canonical push must be a two-parent
    merge whose first parent is the exact previously observed canonical head in the push
    event. Pull-request test runs and local checks are unaffected.
    """
    enforced = (
        os.environ.get("GITHUB_ACTIONS") == "true"
        and os.environ.get("GITHUB_EVENT_NAME") == "push"
        and os.environ.get("GITHUB_REF") == CANONICAL_REF
    )
    if not enforced:
        return {
            "enforced": False,
            "ok": True,
            "status": "NOT_APPLICABLE",
            "reason": "release-lineage guard applies only to canonical GitHub Actions push promotion",
        }

    sha = os.environ.get("GITHUB_SHA") or "HEAD"
    try:
        parts = subprocess.check_output(
            ["git", "rev-list", "--parents", "-n", "1", sha],
            text=True,
            stderr=subprocess.STDOUT,
        ).strip().split()
    except Exception as exc:
        return {
            "enforced": True,
            "ok": False,
            "status": "HOLD",
            "reason": f"could not resolve canonical promotion commit lineage: {exc}",
        }

    parents = parts[1:]
    event_before = None
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if event_path:
        try:
            payload = json.loads(Path(event_path).read_text(encoding="utf-8"))
            event_before = str(payload.get("before") or "").strip() or None
        except Exception:
            event_before = None

    exactly_two_parents = len(parents) == 2
    preserves_previous_head = bool(event_before and parents and parents[0] == event_before)
    ok = exactly_two_parents and preserves_previous_head
    return {
        "enforced": True,
        "ok": ok,
        "status": "PASS" if ok else "HOLD",
        "commit": parts[0] if parts else sha,
        "parents": parents,
        "event_before": event_before,
        "exactly_two_parents": exactly_two_parents,
        "preserves_previous_head": preserves_previous_head,
        "reason": (
            "canonical deployment commit is a merge over the exact prior canonical head"
            if ok
            else "canonical automatic deployment requires a two-parent merge over the exact prior canonical head; ordinary direct pushes are held"
        ),
    }


def evaluate(contract_path: Path, source_root: Path, wrangler_path: Path | None = None) -> dict:
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    required = set(contract.get("required_exports") or [])
    exported = exported_classes(source_root)
    missing = sorted(required - exported)

    recovery = contract.get("recovery") or {}
    swarm_recovery = contract.get("swarm_recovery") or {}
    required_markers = list(recovery.get("behavior_markers") or []) + list(swarm_recovery.get("behavior_markers") or [])
    text = source_text(source_root)
    missing_markers = sorted(marker for marker in required_markers if marker not in text)

    if wrangler_path is None:
        candidate = source_root.parent / "wrangler.toml"
        wrangler_path = candidate if candidate.exists() else None
    wrangler = wrangler_path.read_text(encoding="utf-8") if wrangler_path and wrangler_path.exists() else ""

    durable_contract = contract.get("durable_object_contract") or {}
    class_checks: dict[str, dict] = {}
    for class_name in sorted(required):
        spec = durable_contract.get(class_name) or {}
        # Compatibility with the R168 contract shape, which described the
        # OmegaRuntime lifecycle only inside recovery rather than per-class.
        if not spec and class_name == "OmegaRuntime" and recovery.get("lifecycle_mode") == "exports":
            spec = {
                "binding_name": recovery.get("binding_name"),
                "storage_backend": recovery.get("storage_backend") or "sqlite",
            }
        binding_name = spec.get("binding_name")
        storage_backend = str(spec.get("storage_backend") or "sqlite")
        binding_ok = True if not binding_name else _binding_preserved(wrangler, str(binding_name), class_name)
        lifecycle_ok = True
        lifecycle_reason = "not declared by contract"
        if spec:
            section = _export_section(wrangler, class_name)
            lifecycle_ok = bool(section) and all((
                'type = "durable-object"' in section,
                f'storage = "{storage_backend}"' in section,
                'state = "deleted"' not in section,
            ))
            lifecycle_reason = f"declarative exports / {storage_backend} / live"
        class_checks[class_name] = {
            "binding_name": binding_name,
            "binding_preserved": binding_ok,
            "storage_backend": storage_backend,
            "lifecycle_preserved": lifecycle_ok,
            "lifecycle_reason": lifecycle_reason,
        }

    # Legacy replay is never allowed once the live namespaces already exist.
    no_legacy_replay = "[[migrations]]" not in wrangler and re.search(r"(?m)^\s*new_sqlite_classes\s*=", wrangler) is None
    no_required_tombstones = all('state = "deleted"' not in _export_section(wrangler, class_name) for class_name in required)
    binding_preserved = all(item["binding_preserved"] for item in class_checks.values())
    lifecycle_preserved = all(item["lifecycle_preserved"] for item in class_checks.values()) and no_legacy_replay and no_required_tombstones
    release_lineage = release_lineage_guard()

    compatible = not missing and not missing_markers and binding_preserved and lifecycle_preserved and release_lineage["ok"]
    return {
        "status": "PASS" if compatible else "HOLD",
        "compatible": compatible,
        "required_exports": sorted(required),
        "observed_exports": sorted(exported),
        "missing_exports": missing,
        "required_behavior_markers": required_markers,
        "missing_behavior_markers": missing_markers,
        "binding_preserved": binding_preserved,
        "lifecycle_mode": "exports" if durable_contract else str(recovery.get("lifecycle_mode") or "unspecified"),
        "lifecycle_preserved": lifecycle_preserved,
        "lifecycle_reason": "declarative exports / sqlite" if (durable_contract or recovery.get("lifecycle_mode") == "exports") else "not declared by contract",
        "migration_preserved": lifecycle_preserved,
        "no_legacy_replay": no_legacy_replay,
        "no_required_tombstones": no_required_tombstones,
        "class_checks": class_checks,
        "release_lineage": release_lineage,
        "boundary": "HOLD means do not deploy over the canonical Worker until every observed live Durable Object export, binding, recovered behavior marker, storage lifecycle, and canonical release-lineage gate is preserved without replay or tombstone.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check a Worker candidate against the observed live Cloudflare contract")
    parser.add_argument("--contract", default="config/cloudflare_live_contract.json")
    parser.add_argument("--source", default="cloudflare/omega-v6-worker/src")
    parser.add_argument("--wrangler", default=None)
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    result = evaluate(Path(args.contract), Path(args.source), Path(args.wrangler) if args.wrangler else None)
    print(json.dumps(result, sort_keys=True))
    return 1 if args.strict and not result["compatible"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
