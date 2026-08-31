from omega_genesis.conversation_memory import (
    archive_record,
    build_record,
    contextual_rank,
    importance_score,
    verify_record,
)

DIGEST = "a" * 64


def record(cid="c1", summary="We decided to keep proof before promotion and continue the build.", tags=("omega", "governance")):
    return build_record(
        conversation_id=cid,
        title="OMEGA build decision",
        summary=summary,
        turns=[
            {"role": "user", "text": "We need this to be accurate and robust."},
            {"role": "assistant", "text": "Decision recorded with rollback retained."},
        ],
        tags=tags,
        canonical_digest=DIGEST,
        created_at="2026-08-31T05:40:00Z",
    )


def test_important_conversation_is_hash_bound_and_noncanonical():
    r = record()
    assert r["canonical_mutation"] is False
    assert r["importance"]["suggest_save"] is True
    assert verify_record(r)["valid"] is True
    assert len(r["record_hash"]) == 64


def test_tamper_is_rejected():
    r = record()
    r["summary"] = "quietly changed"
    result = verify_record(r)
    assert result == {"valid": False, "reason": "record_hash_mismatch"}


def test_secret_like_material_is_redacted_before_persistence():
    r = build_record(
        conversation_id="secret-test",
        title="Credential discussion",
        summary="api_key=super-secret-value token: abcdefghijklmnop",
        turns=[{"role": "user", "text": "Bearer abcdefghijklmnopqrstuvwxyz"}],
        canonical_digest=DIGEST,
        created_at="2026-08-31T05:40:00Z",
    )
    packed = str(r)
    assert "super-secret-value" not in packed
    assert "abcdefghijklmnopqrstuvwxyz" not in packed
    assert "[REDACTED]" in packed


def test_contextual_retrieval_explains_why_memory_was_selected():
    rows = [
        record("build", "Hybrid Link build decision with proof and rollback.", ("hybrid", "build")),
        record("earth", "Earth source provenance and dataset coverage.", ("earth", "provenance")),
    ]
    result = contextual_rank("continue hybrid build proof", rows)
    assert result[0]["conversation_id"] == "build"
    assert "hybrid" in result[0]["why"]["matched_terms"]
    assert result[0]["source_class"] == "SAVED_CONVERSATION_CONTEXT"


def test_archived_memory_is_not_retrieved_and_chain_is_preserved():
    r = record()
    archived = archive_record(r)
    assert archived["archived"] is True
    assert archived["previous_hash"] == r["record_hash"]
    assert verify_record(archived)["valid"] is True
    assert contextual_rank("omega build governance", [archived]) == []


def test_importance_scoring_is_deterministic_and_explainable():
    a = importance_score("We decided this is a required goal and must continue with rollback.")
    b = importance_score("We decided this is a required goal and must continue with rollback.")
    assert a == b
    assert a["suggest_save"] is True
    assert "decision" in a["reasons"]
    assert "goal" in a["reasons"]
