from pathlib import Path
import json
import pytest

from omega_genesis.learning import LearningMemory


DIGEST = "a" * 64


def test_learning_memory_is_append_only_and_verifiable(tmp_path: Path):
    memory = LearningMemory(tmp_path)
    first = memory.record(state_id=7, state_digest=DIGEST, context_key="route", action="STAY", reward=0.25)
    second = memory.record(state_id=7, state_digest=DIGEST, context_key="route", action="TURN", reward=0.75)
    assert first["sequence"] == 1
    assert second["sequence"] == 2
    assert second["prev_hash"] == first["event_hash"]
    assert memory.verify()["valid"] is True
    assert memory.status()["canonical_mutation"] is False


def test_learning_prediction_is_deterministic_and_replayable(tmp_path: Path):
    memory = LearningMemory(tmp_path)
    memory.record(state_id=7, state_digest=DIGEST, context_key="route", action="TURN", reward=1.0)
    memory.record(state_id=7, state_digest=DIGEST, context_key="route", action="STAY", reward=-0.2)
    memory.record(state_id=7, state_digest=DIGEST, context_key="route", action="TURN", reward=0.5)

    now = memory.predict(state_id=7, context_key="route")
    assert now["status"] == "PASS"
    assert now["recommendation"] == "TURN"
    assert now["samples"] == 3

    historical = memory.predict(state_id=7, context_key="route", max_seq=1)
    assert historical["recommendation"] == "TURN"
    assert historical["samples"] == 1
    assert historical["replay"]["records"] == 1


def test_learning_refuses_invalid_reward_and_invalid_state(tmp_path: Path):
    memory = LearningMemory(tmp_path)
    with pytest.raises(ValueError):
        memory.record(state_id=0, state_digest=DIGEST, context_key="x", action="TURN", reward=0.0)
    with pytest.raises(ValueError):
        memory.record(state_id=1, state_digest=DIGEST, context_key="x", action="TURN", reward=2.0)


def test_learning_detects_journal_corruption(tmp_path: Path):
    memory = LearningMemory(tmp_path)
    memory.record(state_id=7, state_digest=DIGEST, context_key="route", action="TURN", reward=0.5)
    rows = memory.path.read_text(encoding="utf-8").splitlines()
    row = json.loads(rows[0])
    row["reward"] = -0.5
    memory.path.write_text(json.dumps(row) + "\n", encoding="utf-8")
    result = memory.verify()
    assert result["valid"] is False
    assert result["reason"] == "hash_mismatch"
