from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES
from omega_genesis.ui_acceptance import evaluate_ui


ROOT = Path(__file__).resolve().parents[1]


def test_current_cockpit_passes_static_responsive_guard():
    result = evaluate_ui(ROOT)
    assert result["status"] == "PASS", result["failures"]
    assert len(result["asset_fingerprint"]) == 64
    assert result["checks"]["offcanvas_mobile_sidebar"] is True
    assert result["checks"]["mobile_cards_single_column"] is True
    assert result["checks"]["mobile_render_bounded"] is True
    assert result["checks"]["css_budget"] is True
    assert result["checks"]["js_budget"] is True
    assert "does not claim real-device screenshot QA" in result["boundary"]


def test_responsive_guard_is_registered_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-022"]["status"] == "LIVE_CORE"
    assert "responsive" in rows["CAP-022"]["name"].lower()
