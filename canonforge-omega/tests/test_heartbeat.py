from datetime import datetime, timedelta, timezone
from pathlib import Path

from omega_runtime.heartbeat import HeartbeatRegistry


def test_no_heartbeat_is_not_online(tmp_path: Path):
    registry = HeartbeatRegistry(tmp_path / "heartbeat.json", ttl_seconds=45)
    status = registry.status()
    assert status["state"] == "AGENT_NOT_RUNNING_OR_UNREACHABLE"
    assert status["pc_online"] is False
    assert status["authenticated_heartbeat"] is False


def test_authenticated_current_heartbeat_proves_online(tmp_path: Path):
    registry = HeartbeatRegistry(tmp_path / "heartbeat.json", ttl_seconds=45)
    status = registry.record(
        agent_id="pc-1",
        approved_root=str(tmp_path),
        capabilities=["heartbeat", "run_tests"],
        runtime_version="r77-test",
    )
    assert status["state"] == "PC_ONLINE"
    assert status["pc_online"] is True
    assert status["authenticated_heartbeat"] is True
    assert status["proof"]["sequence"] == 1


def test_heartbeat_sequence_advances(tmp_path: Path):
    registry = HeartbeatRegistry(tmp_path / "heartbeat.json", ttl_seconds=45)
    registry.record(agent_id="pc-1", approved_root=str(tmp_path), capabilities=["heartbeat"])
    status = registry.record(agent_id="pc-1", approved_root=str(tmp_path), capabilities=["heartbeat"])
    assert status["proof"]["sequence"] == 2


def test_stale_heartbeat_is_not_online(tmp_path: Path):
    state_path = tmp_path / "heartbeat.json"
    registry = HeartbeatRegistry(state_path, ttl_seconds=45)
    registry.record(agent_id="pc-1", approved_root=str(tmp_path), capabilities=["heartbeat"])
    registry._proof.received_at = (datetime.now(timezone.utc) - timedelta(seconds=90)).isoformat()  # type: ignore[union-attr]
    status = registry.status()
    assert status["state"] == "HEARTBEAT_STALE"
    assert status["pc_online"] is False
    assert status["authenticated_heartbeat"] is True
