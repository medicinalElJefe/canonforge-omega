from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
from pathlib import Path
import re
from typing import Any


@dataclass(frozen=True)
class UiBudget:
    max_css_bytes: int = 96_000
    max_js_bytes_each: int = 160_000
    mobile_breakpoint_max_px: int = 800
    min_touch_target_px: int = 40
    max_mobile_render_height_px: int = 440


REQUIRED_MOBILE_RULES = (
    ".app-shell{grid-template-columns:1fr}",
    ".sidebar{position:fixed",
    ".mobile-menu{display:block}",
    ".grid.three,.section-grid{grid-template-columns:1fr}",
    ".form2{grid-template-columns:1fr}",
    ".render-surface{height:390px}",
)


def _compact_css(text: str) -> str:
    return re.sub(r"\s+", "", text)


def _asset_digest(paths: list[Path]) -> str:
    h = sha256()
    for path in sorted(paths, key=lambda p: p.name):
        h.update(path.name.encode("utf-8"))
        h.update(b"\0")
        h.update(path.read_bytes())
        h.update(b"\0")
    return h.hexdigest()


def evaluate_ui(root: Path, budget: UiBudget | None = None) -> dict[str, Any]:
    root = Path(root)
    budget = budget or UiBudget()
    web = root / "web"
    html = (web / "index.html").read_text(encoding="utf-8")
    css_path = web / "styles.css"
    css = css_path.read_text(encoding="utf-8")
    compact = _compact_css(css)
    js_paths = sorted(web.glob("*.js"))

    checks: dict[str, bool] = {}
    checks["viewport_declared"] = 'name="viewport"' in html and "width=device-width" in html
    checks["single_column_mobile_shell"] = REQUIRED_MOBILE_RULES[0] in compact
    checks["offcanvas_mobile_sidebar"] = REQUIRED_MOBILE_RULES[1] in compact and ".sidebar.open{left:0}" in compact
    checks["mobile_menu_reachable"] = REQUIRED_MOBILE_RULES[2] in compact
    checks["mobile_cards_single_column"] = REQUIRED_MOBILE_RULES[3] in compact
    checks["mobile_forms_single_column"] = REQUIRED_MOBILE_RULES[4] in compact
    checks["mobile_render_bounded"] = REQUIRED_MOBILE_RULES[5] in compact
    checks["root_grid_minmax_zero"] = "minmax(0,1fr)" in compact and ".workspace{min-width:0}" in compact
    checks["tables_scroll_in_container"] = ".table-wrap{overflow:auto" in compact
    checks["raw_results_scroll"] = ".raw,.result{" in compact and "max-height:440px;overflow:auto" in compact
    checks["buttons_are_real_elements"] = html.count("<button") >= 10 and "href=\"#\"" not in html
    checks["render_surface_present"] = 'id="renderSurface"' in html
    checks["mobile_breakpoint_present"] = bool(re.search(r"@media\(max-width:(\d+)px\)", compact))
    checks["css_budget"] = css_path.stat().st_size <= budget.max_css_bytes
    checks["js_budget"] = all(p.stat().st_size <= budget.max_js_bytes_each for p in js_paths)

    media_widths = [int(x) for x in re.findall(r"@media\(max-width:(\d+)px\)", compact)]
    smallest_mobile = min(media_widths) if media_widths else None
    checks["narrow_mobile_rule_present"] = smallest_mobile is not None and smallest_mobile <= budget.mobile_breakpoint_max_px

    failures = sorted(name for name, ok in checks.items() if not ok)
    assets = [web / "index.html", css_path, *js_paths]
    return {
        "schema": "omega.ui.acceptance.v1",
        "status": "PASS" if not failures else "FAIL",
        "checks": checks,
        "failures": failures,
        "asset_fingerprint": _asset_digest(assets),
        "budgets": {
            "css_bytes": css_path.stat().st_size,
            "max_css_bytes": budget.max_css_bytes,
            "largest_js_bytes": max((p.stat().st_size for p in js_paths), default=0),
            "max_js_bytes_each": budget.max_js_bytes_each,
            "mobile_breakpoints_px": media_widths,
            "min_touch_target_px": budget.min_touch_target_px,
            "max_mobile_render_height_px": budget.max_mobile_render_height_px,
        },
        "boundary": "Static deterministic layout/performance acceptance only; this does not claim real-device screenshot QA or hardware rendering evidence.",
    }


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    result = evaluate_ui(root)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
