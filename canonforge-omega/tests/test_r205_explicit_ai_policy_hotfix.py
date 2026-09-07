from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MISSION = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "system" / "missionKernelR200.ts"
R201_WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-r201-live-continuity-proof.yml"


def source() -> str:
    return MISSION.read_text(encoding="utf-8")


def test_explicit_ai_false_overrides_keyword_inference():
    text = source()
    assert "const aiRequested = body.useAI === true || (body.useAI !== false && includesAny(intent, KEYWORDS.ai));" in text
    assert "if (aiRequested && text(intent))" in text
    assert "if ((includesAny(intent, KEYWORDS.ai) || body.useAI !== false) && text(intent))" not in text


def test_explicit_ai_true_still_forces_sai_task_and_default_can_infer():
    text = source()
    assert 'task("sai-grounded-synthesis", "ANALYZE", "MENU-10", "specialist_execute"' in text
    assert "body.useAI === true" in text
    assert "body.useAI !== false && includesAny(intent, KEYWORDS.ai)" in text


def test_r201_live_proof_explicitly_requests_no_ai_and_two_core_tasks():
    text = R201_WORKFLOW.read_text(encoding="utf-8")
    assert "'useAI': False" in text
    assert "['correlated-snapshot','proof-state']" in text
    assert "requiredTasks') == 2" in text
    assert "requiredReturned') == 2" in text
    assert "requiredVerified') == 2" in text


def test_r205_hotfix_does_not_change_ai_or_sai_authority_boundaries():
    text = source()
    assert 'modelOutputIsNotCanonState: true' in text
    assert 'authority: "MISSION_PLAN_NOT_EXECUTION_NOT_CANON_MUTATION"' in text
    assert 'canonicalMutation: false' in text
    assert 'promotionAuthorized: false' in text
