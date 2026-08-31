from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / "web" / "context-memory-ui.js"
FIELD = ROOT / "web" / "field3d.js"


def test_context_memory_ui_javascript_parses():
    result = subprocess.run(["node", "--check", str(UI)], cwd=ROOT, text=True, capture_output=True, check=False)
    assert result.returncode == 0, result.stderr or result.stdout


def test_context_memory_ui_is_loaded_fail_open():
    field = FIELD.read_text(encoding="utf-8")
    assert 'import("/context-memory-ui.js")' in field
    assert 'omegaContextMemory="LOCAL_BASE_FALLBACK"' in field


def test_cloud_first_memory_has_explicit_fallback_and_no_silent_autosave():
    source = UI.read_text(encoding="utf-8")
    required = [
        'omegaHybridControllerToken',
        'cloudMemory("SAVE"',
        'cloudMemory("SEARCH"',
        'cloudMemory("LIST"',
        'cloudMemory("ARCHIVE"',
        'MEMORY · CLOUD',
        'MEMORY · LOCAL FALLBACK',
        'SAVED_LOCAL_FALLBACK',
        'Nothing is silently autosaved',
        'data-suggestion-save',
        'data-suggestion-dismiss',
        'explicit_user_save',
        'canonical_mutation:false',
        'SAVED_CONVERSATION_CONTEXT',
    ]
    for marker in required:
        assert marker in source, marker


def test_cloud_save_requires_current_canonical_digest():
    source = UI.read_text(encoding="utf-8")
    assert 'fetch("/api/state"' in source
    assert '/^[0-9a-f]{64}$/' in source
    assert 'canonical_digest_unavailable' in source
    assert 'data.canonical_digest=await canonicalDigest()' in source


def test_context_reuse_is_explicit_and_truth_labeled():
    source = UI.read_text(encoding="utf-8")
    assert 'data-context-use' in source
    assert 'ACTIVE SAVED CONTEXT · NOT EVIDENCE' in source
    assert 'SAVED_CONVERSATION_CONTEXT — contextual memory, not evidence or canonical truth' in source
    assert 'context_used' in source
    assert 'data-context-clear' in source


def test_adaptation_is_bounded_transparent_and_user_driven():
    source = UI.read_text(encoding="utf-8")
    assert 'const BASE_THRESHOLD=.48' in source
    assert 'const MIN_THRESHOLD=.40' in source
    assert 'const MAX_THRESHOLD=.70' in source
    assert 'p.threshold=Math.max(MIN_THRESHOLD,p.threshold-.01)' in source
    assert 'p.threshold=Math.min(MAX_THRESHOLD,p.threshold+.02)' in source
    assert 'accepted' in source and 'dismissed' in source
    assert 'transparent local preference only' in source


def test_planner_interaction_can_be_captured_without_automatic_save():
    source = UI.read_text(encoding="utf-8")
    assert 'data-memory-capture-planner' in source
    assert 'function capturePlanner()' in source
    capture = source.split('function capturePlanner()', 1)[1].split('async function planWithContext', 1)[0]
    assert 'cloudMemory("SAVE"' not in capture
    assert 'localSave(' not in capture
    assert 'evaluateSuggestion()' in capture
