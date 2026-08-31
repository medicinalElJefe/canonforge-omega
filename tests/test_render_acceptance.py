from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES
from omega_genesis.render_acceptance import evaluate_renderer


ROOT = Path(__file__).resolve().parents[1]


def test_renderer_passes_state_bound_performance_contract():
    result = evaluate_renderer(ROOT)
    assert result["status"] == "PASS", result["failures"]
    assert result["point_count"] == 20736
    assert len(result["renderer_sha256"]) == 64
    assert result["checks"]["dpr_capped"] is True
    assert result["checks"]["offscreen_pause"] is True
    assert result["checks"]["active_buffer_reuse"] is True
    assert result["checks"]["telemetry_emitted"] is True
    assert result["checks"]["hardware_truth_boundary"] is True
    assert "hardware GPU execution" in result["boundary"]


def test_adaptive_render_controller_is_live_core_without_promoting_gpu_adapter():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-023"]["status"] == "LIVE_CORE"
    assert rows["CAP-008"]["status"] == "ADAPTER"
    assert "WebGL" in rows["CAP-023"]["name"]
