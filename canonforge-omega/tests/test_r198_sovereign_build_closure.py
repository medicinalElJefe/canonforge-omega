from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
AGENT_PATH = ROOT / "scripts" / "omega_hybrid_agent_r198.py"
TS_AGENT_PATH = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "sovereignAgentR198.ts"
RUNTIME_ENTRY_PATH = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WRANGLER_PATH = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def load_agent():
    spec = importlib.util.spec_from_file_location("omega_hybrid_agent_r198", AGENT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_agent_compiles_and_preserves_zero_drift_transport_identity():
    source = AGENT_PATH.read_text(encoding="utf-8")
    compile(source, str(AGENT_PATH), "exec")
    assert "VERSION='R34.1'" in source
    assert "CAPABILITY_REVISION='R132'" in source
    assert "SOVEREIGN_CLOSURE_REVISION='R198'" in source
    assert "DISCOVER_PROJECT" in source
    assert "PROJECT_AUTO_RESOLVE" in source
    assert "RESOURCE_GUARD_R198" in source


def test_project_discovery_selects_buildable_omega_worker(tmp_path: Path):
    agent = load_agent()
    worker = tmp_path / "archive" / "canonforge-omega" / "cloudflare" / "omega-v6-worker"
    worker.mkdir(parents=True)
    (worker / "package.json").write_text(json.dumps({"scripts": {"build": "echo build", "test": "echo test"}}), encoding="utf-8")
    (worker / "wrangler.toml").write_text('name = "omegav6"', encoding="utf-8")
    weak = tmp_path / "misc"
    weak.mkdir()
    (weak / "requirements.txt").write_text("", encoding="utf-8")

    discovery = agent.discover_projects(tmp_path)
    assert discovery["candidateCount"] >= 1
    assert discovery["selected"]["relativePath"].endswith("omega-v6-worker")
    assert discovery["selected"]["score"] > 40
    assert discovery["directoriesVisited"] <= agent.MAX_DISCOVERY_DIRS
    assert discovery["elapsedSeconds"] <= agent.DISCOVERY_TIME_BUDGET + 1


def test_build_and_test_auto_resolve_to_declared_project(tmp_path: Path):
    agent = load_agent()
    worker = tmp_path / "omega-v6-worker"
    worker.mkdir()
    (worker / "package.json").write_text(json.dumps({"scripts": {"build": "echo build", "check": "echo check"}}), encoding="utf-8")
    (worker / "wrangler.toml").write_text('name = "omegav6"', encoding="utf-8")
    discovery = agent.discover_projects(tmp_path)

    build_path, build_meta = agent.resolve_step_path({"op": "BUILD", "path": "."}, tmp_path, discovery)
    test_path, test_meta = agent.resolve_step_path({"op": "TEST", "path": "."}, tmp_path, discovery)
    assert build_path == worker.resolve()
    assert test_path == worker.resolve()
    assert build_meta["mode"] == "PROJECT_AUTO_RESOLVE_R198"
    assert test_meta["mode"] == "PROJECT_AUTO_RESOLVE_R198"


def test_no_project_is_truthful_hold_not_fake_success(tmp_path: Path):
    agent = load_agent()
    discovery = agent.discover_projects(tmp_path)
    assert discovery["selected"] is None
    with pytest.raises(agent.AgentError, match="PROJECT_NOT_FOUND"):
        agent.resolve_step_path({"op": "BUILD", "path": "."}, tmp_path, discovery)


def test_path_confinement_remains_enforced(tmp_path: Path):
    agent = load_agent()
    with pytest.raises(agent.AgentError, match="escapes approved root"):
        agent.secure_path(tmp_path, "../outside")


def test_read_only_health_and_discovery_job_returns_r198_receipt(tmp_path: Path):
    agent = load_agent()
    worker = tmp_path / "canonforge-omega" / "worker"
    worker.mkdir(parents=True)
    (worker / "package.json").write_text(json.dumps({"scripts": {"build": "echo build"}}), encoding="utf-8")
    packet = agent.execute_job({"id": "job_r198_test", "steps": [{"id": "discover", "op": "DISCOVER_PROJECT"}, {"id": "health", "op": "PC_HEALTH"}]}, tmp_path)
    assert packet["ok"] is True
    assert packet["returnedState"] == "RETURNED_SUCCESS"
    assert packet["schema"] == "OMEGA_HYBRID_RETURN_R198"
    assert packet["heavyOperationsSequential"] is True
    assert packet["implicitDependencyInstall"] is False
    assert packet["systemOptimizationMutation"] is False
    assert len(packet["resultFingerprint"]) == 64


def test_served_agent_digest_is_exactly_pinned_and_route_is_successor_owned():
    source_bytes = AGENT_PATH.read_bytes()
    digest = hashlib.sha256(source_bytes).hexdigest()
    ts = TS_AGENT_PATH.read_text(encoding="utf-8")
    runtime = RUNTIME_ENTRY_PATH.read_text(encoding="utf-8")
    wrangler = WRANGLER_PATH.read_text(encoding="utf-8")
    assert digest == "1d90b82422c4b7b9f4cfd216a3704d6a3f53b43a6fda520b24e2766242fd3760"
    assert digest in ts
    assert "omega_hybrid_agent_r198.py" in ts
    assert 'url.pathname === "/omega-hybrid-agent.py"' in runtime
    assert "sovereignAgentR198Response" in runtime
    assert 'type = "Text"' in wrangler
    assert 'globs = [ "**/*.py" ]' in wrangler


def test_agent_does_not_implicitly_install_or_mutate_os_optimization_state():
    source = AGENT_PATH.read_text(encoding="utf-8").lower()
    forbidden = ["pip install", "npm install", "npm ci", "winget install", "choco install", "reg add ", "set-itemproperty hklm", "powercfg /setactive"]
    for token in forbidden:
        assert token not in source
    assert "below_normal_priority_class" in source
    assert "heavyopssequential" in source
    assert "systemoptimizationmutation" in source
