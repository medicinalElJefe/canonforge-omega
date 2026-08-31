from __future__ import annotations

from pathlib import Path

from omega_genesis.cloud_selfbuild import Gate, atomic_json, sha256_file


def test_cloud_selfbuild_gate_public_shape():
    gate = Gate("x", "PASS", "ok", 12, "abc")
    assert gate.public() == {
        "name": "x",
        "status": "PASS",
        "detail": "ok",
        "duration_ms": 12,
        "digest": "abc",
    }


def test_cloud_selfbuild_atomic_status(tmp_path: Path):
    path = tmp_path / "self-build" / "status.json"
    atomic_json(path, {"decision": "PASS", "n": 1})
    assert '"decision": "PASS"' in path.read_text(encoding="utf-8")


def test_cloud_selfbuild_sha256(tmp_path: Path):
    path = tmp_path / "x.bin"
    path.write_bytes(b"omega")
    assert sha256_file(path) == "304b4a90a76a1cbe4c112e074b30e75181f54df43d60f883597457844293b341"
