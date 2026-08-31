from pathlib import Path

import pytest

from omega_runtime.self_build import BuildMode, JobState, SovereignBuildController


def test_development_loop_queues_bounded_convergence_first(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "state.json", tmp_path / "omega-root")
    status = controller.status()
    assert status["mode"] == "DEVELOPMENT_LOOP"
    assert status["active_job"]["kind"] == "convergence_scan"
    assert status["active_job"]["state"] == "QUEUED"
    assert status["recursive_convergence"]["enabled"] is True
    assert status["recursive_convergence"]["canonical_ref"] == "omega-v6-full-convergence"
    assert status["recursive_convergence"]["genesis_ref"] == "omega-genesis-v1-full"
    assert "promotion" in status["promotion_boundary"].lower()


def test_agent_lease_and_verified_result_requires_evidence(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "state.json", tmp_path / "omega-root")
    job = controller.lease_next("pc-1")
    assert job is not None
    assert job.state == "LEASED"
    assert job.lease_owner == "pc-1"

    with pytest.raises(ValueError):
        controller.update_job(job.id, JobState.VERIFIED, {})

    done = controller.update_job(job.id, JobState.VERIFIED, {"convergence": "PASS", "changed_files": []})
    assert done.state == "VERIFIED"
    status = controller.status()
    assert status["active_job"] is not None
    assert status["active_job"]["id"] != job.id
    assert status["active_job"]["kind"] == "inspect_workspace"


def test_manual_mode_does_not_autostart_work(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "state.json", tmp_path / "omega-root")
    controller.jobs.clear()
    controller.set_mode(BuildMode.MANUAL)
    assert controller.status()["active_job"] is None


def test_arbitrary_shell_job_is_rejected(tmp_path: Path):
    controller = SovereignBuildController(tmp_path / "state.json", tmp_path / "omega-root")
    with pytest.raises(ValueError):
        controller.enqueue("shell", "do anything", {"command": "rm -rf /"})
