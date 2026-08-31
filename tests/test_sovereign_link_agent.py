from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("sovereign_link_agent", ROOT / "scripts" / "sovereign_link_agent.py")
assert SPEC and SPEC.loader
agent = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(agent)


def test_service_url_requires_https_except_localhost():
    assert agent.clean_service_url("https://omega.example/") == "https://omega.example"
    assert agent.clean_service_url("http://127.0.0.1:8787/") == "http://127.0.0.1:8787"
    with pytest.raises(ValueError):
        agent.clean_service_url("http://example.com")


def test_device_config_roundtrip_keeps_credential_local(tmp_path: Path):
    path = tmp_path / "device.json"
    payload = {
        "service_url": "https://omega.example",
        "device_id": "device-1",
        "device_token": "secret-token",
        "root": str(tmp_path),
    }
    agent.save_config(path, payload)
    loaded = agent.load_config(path)
    assert loaded["device_token"] == "secret-token"
    assert loaded["service_url"] == "https://omega.example"


def test_execute_job_uses_typed_hybrid_adapter_and_approved_root(tmp_path: Path):
    source = tmp_path / "hello.txt"
    source.write_text("sovereign", encoding="utf-8")
    config = {"root": str(tmp_path)}
    job = {"job_id": "j1", "steps": [{"op": "READ_TEXT", "path": "hello.txt"}]}
    result = agent.execute_job(config, job)
    assert result["status"] == "PASS"
    assert result["executed"] is True
    assert result["results"][0]["result"]["text"] == "sovereign"
    assert "no arbitrary shell" in result["host_boundary"]


def test_execute_job_rejects_path_escape(tmp_path: Path):
    config = {"root": str(tmp_path)}
    job = {"job_id": "j1", "steps": [{"op": "READ_TEXT", "path": "../escape.txt"}]}
    result = agent.execute_job(config, job)
    assert result["status"] == "FAIL"
    assert result["executed"] is False
