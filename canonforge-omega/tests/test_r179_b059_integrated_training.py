from __future__ import annotations

import json
from pathlib import Path

from omega_runtime import sai_b059


def _synthetic_release(tmp_path: Path) -> Path:
    root = tmp_path / "OMEGA_SAI_B059"
    (root / "compiled").mkdir(parents=True)
    (root / "reports").mkdir(parents=True)
    database = root / "compiled" / "omega_sai.db"
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
    # Verification only requires the exact B059 authority identity in the manifest
    # unless deep=True; fill the remaining manifest slots with inert fixture rows.
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
    assert sum(row["size"] for row in sai_b059.DRIVE_ARCHIVES) == 137_ - 0  # replaced below
