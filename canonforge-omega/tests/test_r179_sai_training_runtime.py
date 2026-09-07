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


def test_r179_builds_hash_bound_retrieval_training_receipt(tmp_path: Path):
    root = tmp_path / "source"
    root.mkdir()
    (root / "canon.md").write_text("Woven Continuity preserves invariant carry and scar history across relative frames.\n", encoding="utf-8")
    (root / "runtime.py").write_text("AUTHORITY = 'PROOF_GOVERNED'\n", encoding="utf-8")
    out = tmp_path / "training"

    receipt = train(root, out)

    assert receipt["schema"] == TRAINING_SCHEMA
    assert receipt["state"] == "RETRIEVAL_READY_NEURAL_TRAINING_REQUIRED"
    assert receipt["fullyTrainedClaim"] is False
    assert receipt["neuralWeightsTrained"] is False
    assert receipt["corpus"]["schema"] == CORPUS_SCHEMA
    assert receipt["corpus"]["sourceCount"] == 2
    assert receipt["corpus"]["chunkCount"] >= 2
    assert receipt["model"]["schema"] == MODEL_SCHEMA
    assert receipt["model"]["modelAdmission"] == "RETRIEVAL_READY_NEURAL_TRAINING_UNPROVEN"
    assert receipt["evaluation"]["schema"] == EVALUATION_SCHEMA
    assert receipt["evaluation"]["passed"] is True
    assert receipt["evaluation"]["admission"] == "RETRIEVAL_ADMITTED"
    assert receipt["evaluation"]["neuralModelAdmission"] == "NOT_EVALUATED"
    assert len(receipt["receiptSha256"]) == 64

    saved = json.loads((out / "training-receipt.json").read_text(encoding="utf-8"))
    assert saved["receiptSha256"] == receipt["receiptSha256"]
    assert status(out)["receiptSha256"] == receipt["receiptSha256"]


def test_r179_status_never_invents_training(tmp_path: Path):
    result = status(tmp_path / "absent")
    assert result["state"] == "NOT_TRAINED"
    assert result["fullyTrainedClaim"] is False
