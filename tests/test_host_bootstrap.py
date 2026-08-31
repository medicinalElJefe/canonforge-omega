from __future__ import annotations

from pathlib import Path
import pytest

from omega_genesis.host_bootstrap import (
    bootstrap_record,
    parse_env_text,
    render_systemd_unit,
    validate_domain,
    validate_install_root,
    watcher_environment,
)


def test_domain_validation_is_dns_only():
    assert validate_domain("OMEGA.Example.COM.") == "omega.example.com"
    with pytest.raises(ValueError):
        validate_domain("https://omega.example.com")
    with pytest.raises(ValueError):
        validate_domain("localhost")


def test_environment_parser_and_watcher_secret_minimization():
    env = parse_env_text(
        "OMEGA_DOMAIN=omega.example.com\n"
        "OMEGA_GATEWAY_TOKEN=abc_123-XYZ\n"
        "OMEGA_CLOUD_ADMIN_TOKEN=do-not-copy\n"
        "OMEGA_SESSION_SECRET=do-not-copy-either\n"
    )
    watcher = watcher_environment(
        env,
        health_url="http://127.0.0.1:8127/api/health",
        state_dir="/var/lib/omega-deploy",
    )
    assert "OMEGA_GATEWAY_TOKEN=abc_123-XYZ" in watcher
    assert "do-not-copy" not in watcher
    assert "OMEGA_CLOUD_ADMIN_TOKEN" not in watcher
    assert "OMEGA_SESSION_SECRET" not in watcher


def test_parser_rejects_duplicate_or_invalid_environment_keys():
    with pytest.raises(ValueError):
        parse_env_text("OMEGA_X=1\nOMEGA_X=2\n")
    with pytest.raises(ValueError):
        parse_env_text("bad-key=value\n")


def test_systemd_unit_is_bound_to_explicit_repo_and_minimal_env(tmp_path: Path):
    root = tmp_path / "omega"
    root.mkdir()
    env_path = tmp_path / "etc" / "omega-watch.env"
    text = render_systemd_unit(root, env_path)
    assert f"WorkingDirectory={root}" in text
    assert f"ExecStart=/usr/bin/python3 {root}/scripts/cloud_watch.py --watch" in text
    assert f"EnvironmentFile=-{env_path}" in text
    assert "docker.sock" not in text


def test_install_root_rejects_root_or_whitespace(tmp_path: Path):
    with pytest.raises(ValueError):
        validate_install_root(Path("/"))
    spaced = tmp_path / "omega root"
    with pytest.raises(ValueError):
        validate_install_root(spaced)


def test_bootstrap_record_contains_no_secret_material(tmp_path: Path):
    root = tmp_path / "omega"
    root.mkdir()
    record = bootstrap_record(
        domain="omega.example.com",
        install_root=root,
        state_dir=tmp_path / "state",
        branch="omega-genesis-v1-full",
        source_sha="a" * 40,
        watcher_enabled=True,
    )
    assert record["status"] == "PASS"
    assert record["watcher_enabled"] is True
    assert "token" not in str(record).lower()
