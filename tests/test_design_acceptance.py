from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES
from omega_genesis.design_acceptance import evaluate_design


ROOT = Path(__file__).resolve().parents[1]


def test_ultra_ui_design_contract_passes():
    result = evaluate_design(ROOT)
    assert result["status"] == "PASS", result["failures"]
    assert result["checks"]["touch_target_44"] is True
    assert result["checks"]["keyboard_focus_visible"] is True
    assert result["checks"]["reduced_motion"] is True
    assert result["checks"]["mobile_nav_scrim"] is True
    assert result["checks"]["worker_python_capability_parity"] is True
    assert result["capability_count"] == 27
    assert result["worker_capability_count"] == 27
    assert "real devices remains external evidence" in result["boundary"]


def test_ultra_ui_capability_is_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-024"]["status"] == "LIVE_CORE"
    assert "Ultra UI" in rows["CAP-024"]["name"]


def test_contextual_memory_capability_is_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-026"]["status"] == "LIVE_CORE"
    assert "conversation memory" in rows["CAP-026"]["name"].lower()


def test_cloud_context_memory_capability_is_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-027"]["status"] == "LIVE_CORE"
    assert "controller-scoped" in rows["CAP-027"]["name"].lower()
