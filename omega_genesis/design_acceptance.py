from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path
import re


def _ids_from_python(text: str) -> list[str]:
    return re.findall(r'\{"id":"(CAP-\d{3})"', text)


def _ids_from_worker(text: str) -> list[str]:
    return re.findall(r'id:"(CAP-\d{3})"', text)


def evaluate_design(root: Path) -> dict:
    root = Path(root)
    design_path = root / "web" / "design-system.js"
    field_path = root / "web" / "field3d.js"
    py_caps_path = root / "omega_genesis" / "capabilities.py"
    worker_caps_path = root / "cloudflare" / "omega-genesis-worker" / "src" / "catalog.js"
    design = design_path.read_text(encoding="utf-8")
    field = field_path.read_text(encoding="utf-8")
    py_caps = py_caps_path.read_text(encoding="utf-8")
    worker_caps = worker_caps_path.read_text(encoding="utf-8")
    python_ids = _ids_from_python(py_caps)
    worker_ids = _ids_from_worker(worker_caps)

    checks = {
        "progressive_module_present": design_path.is_file(),
        "fail_open_loader": 'import("/design-system.js").catch' in field and 'BASE_FALLBACK' in field,
        "touch_target_44": "--omega-touch:44px" in design and "min-height:var(--omega-touch)" in design,
        "mobile_touch_target_46": "min-height:46px" in design,
        "keyboard_focus_visible": ":focus-visible" in design and "outline:2px solid var(--omega-cyan)" in design,
        "reduced_motion": "@media(prefers-reduced-motion:reduce)" in design,
        "high_contrast": "@media(prefers-contrast:more)" in design,
        "safe_area_support": "env(safe-area-inset-bottom)" in design and "env(safe-area-inset-top)" in design,
        "mobile_nav_scrim": "omegaNavScrim" in design and "Close navigation" in design,
        "escape_closes_nav": 'e.key==="Escape"' in design,
        "live_render_telemetry_chip": "omega-render-telemetry" in design and "FIELD · LIVE" in design,
        "network_status_is_observed": 'window.addEventListener("online"' in design and 'window.addEventListener("offline"' in design,
        "no_hardware_claim": "hardware" not in design.lower() or "not a hardware verification claim" in design.lower(),
        "worker_python_capability_parity": python_ids == worker_ids,
        "capability_024_registered": "CAP-024" in python_ids,
        "design_asset_budget": design_path.stat().st_size <= 32_000,
    }
    failures = sorted(name for name, ok in checks.items() if not ok)
    return {
        "schema": "omega.design.acceptance.v1",
        "status": "PASS" if not failures else "FAIL",
        "checks": checks,
        "failures": failures,
        "design_sha256": sha256(design_path.read_bytes()).hexdigest(),
        "capability_count": len(python_ids),
        "worker_capability_count": len(worker_ids),
        "boundary": "Deterministic source-level interaction/accessibility/design acceptance only; visual screenshot quality on real devices remains external evidence.",
    }


def main() -> int:
    result = evaluate_design(Path(__file__).resolve().parents[1])
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
