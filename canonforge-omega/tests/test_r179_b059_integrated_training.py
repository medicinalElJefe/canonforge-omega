from __future__ import annotations

import json
from pathlib import Path

from omega_runtime import sai_b059


def _synthetic_release(tmp_path: Path) -> Path:
    root = tmp_path / "OMEGA_SAI_B059"
    (root / "compiled").mkdir(parents=True)
    (root / "reports").mkdir(parents=True)
    database = root / "compiled" / "omega_sai.db"
    # Sparse file: preserves exact B059 byte identity without consuming 747 MB in CI.
    with database.open("wb") as handle:
        handle.truncate(sai_b059.EXPECTED_DATABASE_BYTES)
    files = [
        {
            "path": "compiled/omega_sai.db",
            "sha256": sai_b059.EXPECTED_DATABASE_SHA256,
            "size_bytes": sai_b059.EXPECTED_DATABASE_BYTES,
        }
    ]
    files.extend(
        {"path": f"corpus/{name}", "sha256": digest, "size_bytes": 1}
        for name, digest in sai_b059.SOURCE_AUTHORITIES
    )
    while len(files) < sai_b059.EXPECTED_FILE_COUNT:
        files.append({"path": f"fixture/{len(files):02d}.txt", "sha256": "0" * 64, "size_bytes": 0})
    (root / "BUILD_MANIFEST.json").write_text(
        json.dumps(
            {
                "release": sai_b059.RELEASE,
                "file_count": sai_b059.EXPECTED_FILE_COUNT,
                "total_bytes": sai_b059.EXPECTED_TOTAL_BYTES,
                "files": files,
            }
        ),
        encoding="utf-8",
    )
    runtime_checks = [
        {"name": "all_sources", "passed": True, "detail": sai_b059.EXPECTED_SOURCE_AUTHORITIES},
        {"name": "documents", "passed": True, "detail": sai_b059.EXPECTED_DOCUMENTS},
        {"name": "edges", "passed": True, "detail": sai_b059.EXPECTED_EDGES},
    ]
    (root / "reports" / "ACCEPTANCE_REPORT.json").write_text(
        json.dumps(
            {
                "passed": True,
                "checks": [
                    {"name": "runtime_selftest", "passed": True, "detail": {"passed": True, "checks": runtime_checks}}
                ],
            }
        ),
        encoding="utf-8",
    )
    return root


def _passing_selftest():
    return {
        "passed": True,
        "checks": [
            {"name": "database_integrity", "passed": True, "detail": "ok"},
            {"name": "all_sources", "passed": True, "detail": sai_b059.EXPECTED_SOURCE_AUTHORITIES},
            {"name": "documents", "passed": True, "detail": sai_b059.EXPECTED_DOCUMENTS},
            {"name": "edges", "passed": True, "detail": sai_b059.EXPECTED_EDGES},
            {"name": "grounded_query", "passed": True, "detail": 0.4},
            {"name": "ledger_chain", "passed": True, "detail": {"passed": True}},
        ],
    }


def test_exact_drive_archive_identity_is_preserved():
    assert len(sai_b059.DRIVE_ARCHIVES) == 5
    assert sum(row["size"] for row in sai_b059.DRIVE_ARCHIVES) == 136_991_248
    assert {row["part"] for row in sai_b059.DRIVE_ARCHIVES} == {1, 2, 3, 4, 5}
    assert all(len(row["sha256"]) == 64 for row in sai_b059.DRIVE_ARCHIVES)
    assert len({row["drive_id"] for row in sai_b059.DRIVE_ARCHIVES}) == 5


def test_exact_b059_authority_identity_is_preserved():
    assert sai_b059.EXPECTED_SOURCE_AUTHORITIES == 15
    assert len(sai_b059.SOURCE_AUTHORITIES) == 15
    assert sai_b059.EXPECTED_DOCUMENTS == 541_526
    assert sai_b059.EXPECTED_EDGES == 82_082
    assert sai_b059.EXPECTED_DATABASE_SHA256 == "ee163c27c08f034989f42596e04c4b0344e62c7335d7377f27d648b1e5fdcb12"
    assert "Woven Continuity" in sai_b059.REQUIRED_MODES
    assert "Mode 188" in sai_b059.REQUIRED_MODES


def test_training_scope_can_be_proved_without_falsely_claiming_foundation_weights(tmp_path, monkeypatch):
    root = _synthetic_release(tmp_path)
    monkeypatch.setattr(sai_b059, "sha256_file", lambda path: sai_b059.EXPECTED_DATABASE_SHA256)
    monkeypatch.setattr(sai_b059, "_run_cli", lambda *args, **kwargs: _passing_selftest())
    receipt = sai_b059.verify_release(root, run_selftest=True, deep=False)
    assert receipt["passed"] is True
    assert receipt["training"]["fully_trained_within_declared_scope"] is True
    assert receipt["training"]["complete_supplied_corpus_compiled"] is True
    assert receipt["training"]["indexed"] is True
    assert receipt["training"]["calibrated"] is True
    assert receipt["training"]["foundation_model_weights_trained"] is False
    assert receipt["authority"] == "VERIFIED_LOCAL_SAI_RUNTIME_NOT_CANON"
    assert len(receipt["receipt_sha256"]) == 64


def test_query_is_grounded_and_receipt_bound_after_verified_release(tmp_path, monkeypatch):
    root = _synthetic_release(tmp_path)
    monkeypatch.setattr(sai_b059, "sha256_file", lambda path: sai_b059.EXPECTED_DATABASE_SHA256)

    def fake_cli(_root, args, timeout=180):
        if args[0] == "ask":
            return {
                "query": args[1],
                "decision": "STAY",
                "answer": "Woven Continuity carries invariant structure and scar/history across a governed transformation.",
                "evidence": [{"source": "dewey_relational_calculus_20736D_CONTINUED_FULL.csv", "record_key": "fixture:1"}],
                "all_modes": True,
                "workflow": ["SENSE", "NORMALIZE", "SCORE", "GATE", "ACT", "LEDGER"],
                "confidence": 0.8,
                "ledger_hash": "a" * 64,
            }
        return _passing_selftest()

    monkeypatch.setattr(sai_b059, "_run_cli", fake_cli)
    receipt = sai_b059.query(root, "Explain Woven Continuity.", limit=8)
    assert receipt["grounded"] is True
    assert receipt["evidence_count"] == 1
    assert receipt["fully_trained_within_declared_scope"] is True
    assert receipt["foundation_model_weights_trained"] is False
    assert receipt["result"]["decision"] == "STAY"
    assert len(receipt["receipt_sha256"]) == 64


def test_missing_release_never_becomes_trained(tmp_path):
    status = sai_b059.probe(tmp_path)
    assert status["state"] == "B059_NOT_INSTALLED"
    assert status["fully_trained_within_declared_scope"] is False
    assert status["passed"] is False
