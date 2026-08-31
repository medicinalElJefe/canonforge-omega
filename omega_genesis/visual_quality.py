from __future__ import annotations

from pathlib import Path
from typing import Any


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def evaluate_visual_quality(root: Path) -> dict[str, Any]:
    """Trusted static visual/accessibility contract for candidate comparison.

    This is intentionally conservative. It does not claim aesthetic perfection; it
    only creates deterministic, source-derived signals that candidates can improve
    without inventing browser evidence. Real screenshot/device evidence remains a
    separate external acceptance boundary.
    """
    root = Path(root).resolve()
    index = _read(root / "web" / "index.html")
    css = _read(root / "web" / "styles.css")
    app = _read(root / "web" / "app.js")
    field = _read(root / "web" / "field3d.js")

    checks = [
        ("semantic_main", "<main" in index.lower()),
        ("semantic_nav", "<nav" in index.lower()),
        ("mobile_menu_label", "aria-label=" in index.lower() and "mobilemenu" in index.lower()),
        ("mobile_menu_controls", "aria-controls=" in index.lower()),
        ("mobile_menu_state", "aria-expanded" in index.lower() or "aria-expanded" in app.lower()),
        ("keyboard_focus_visible", ":focus-visible" in css.lower()),
        ("reduced_motion_contract", "prefers-reduced-motion" in css.lower()),
        ("touch_target_contract", "min-height:44px" in css.replace(" ", "").lower() or "min-height: 44px" in css.lower()),
        ("responsive_mobile_breakpoint", "@media(max-width:760px)" in css.replace(" ", "").lower()),
        ("responsive_mid_breakpoint", "@media(max-width:1120px)" in css.replace(" ", "").lower()),
        ("state_bound_webgl", "requestanimationframe" in field.lower() and "getSnapshot" in field),
        ("viewport_contract", "name=\"viewport\"" in index.lower() or "name='viewport'" in index.lower()),
    ]
    passed = sum(1 for _, ok in checks if ok)
    total = len(checks)
    return {
        "schema": "omega.visual.quality.v1",
        "score": round(passed / total, 6) if total else 0.0,
        "passed": passed,
        "total": total,
        "checks": [{"id": name, "status": "PASS" if ok else "GAP"} for name, ok in checks],
        "boundary": "static source quality only; real browser screenshots and device usability remain external evidence",
    }
