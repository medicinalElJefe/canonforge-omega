from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_context_memory_ui_is_interactive_and_truth_bounded():
    source = (ROOT / "web" / "advanced.js").read_text(encoding="utf-8")
    required = [
        'id="contextMemoryCard"',
        'data-advanced="memory-save"',
        'data-advanced="memory-score"',
        'data-advanced="memory-search"',
        'data-memory-archive=',
        'omega.context.memory.v1',
        '[REDACTED]',
        'SAVED_CONVERSATION_CONTEXT',
        'canonical_mutation:false',
        'Saved in this browser profile',
        'does not mutate canonical OMEGA state',
    ]
    for marker in required:
        assert marker in source, marker


def test_context_memory_ui_has_bounded_storage_and_relevance_explanation():
    source = (ROOT / "web" / "advanced.js").read_text(encoding="utf-8")
    assert 'rows.slice(-250)' in source
    assert 'matched_terms' in source
    assert 'importance' in source
    assert 'canonical_digest' in source
    assert 'record_hash' in source
    assert 'crypto.subtle.digest("SHA-256"' in source
