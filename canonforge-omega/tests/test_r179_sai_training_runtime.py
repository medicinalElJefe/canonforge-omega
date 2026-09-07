from __future__ import annotations

import json
from pathlib import Path

from omega_runtime.sai_training import (
    CORPUS_SCHEMA,
    EVALUATION_SCHEMA,
    MODEL_SCHEMA,
    TRAINING_SCHEMA,
    status,
    train,
)


def test_r179_builds_hash_bound_repository_retrieval_receipt(tmp_path: Path):
    root = tmp_path / "source"
    root.mkdir()
    (root / "canon.md").write_text("Woven Continuity preserves invariant carry and scar history across relative frames.\n", encoding="utf-8")
    (root / "runtime.py").write_text("AUTHORITY = 'PROOF_GOVERNED'\n", encoding="utf-8")
    out = tmp_path / "training"

    receipt = train(root, out)

    assert receipt["schema"] == TRAINING_SCHEMA
    assert receipt["state"] == "REPOSITORY_RETRIEVAL_READY_B059_AUTHORITY_REQUIRED"
    assert receipt["fullyTrainedClaim"] is False
    assert receipt["neuralWeightsTrained"] is False
    assert receipt["corpus"]["schema"] == CORPUS_SCHEMA
    assert receipt["corpus"]["sourceCount"] == 2
    assert receipt["corpus"]["chunkCount"] >= 2
    assert "repository retrieval bootstrap" in receipt["corpus"]["trainingMeaning"].lower()
    assert receipt["model"]["schema"] == MODEL_SCHEMA
    assert receipt["model"]["modelAdmission"] == "REPOSITORY_RETRIEVAL_BOOTSTRAP_NOT_SAI_AUTHORITY"
    assert receipt["evaluation"]["schema"] == EVALUATION_SCHEMA
    assert receipt["evaluation"]["passed"] is True
    assert receipt["evaluation"]["admission"] == "REPOSITORY_RETRIEVAL_ADMITTED"
    assert receipt["evaluation"]["saiB059Admission"] == "SEPARATE_EXACT_RELEASE_VERIFICATION_REQUIRED"
    assert len(receipt["receiptSha256"]) == 64

    saved = json.loads((out / "training-receipt.json").read_text(encoding="utf-8"))
    assert saved["receiptSha256"] == receipt["receiptSha256"]
    assert status(out)["receiptSha256"] == receipt["receiptSha256"]


def test_r179_status_never_invents_repository_index_or_b059_training(tmp_path: Path):
    result = status(tmp_path / "absent")
    assert result["state"] == "NOT_INDEXED"
    assert result["fullyTrainedClaim"] is False
    assert "b059" in result
