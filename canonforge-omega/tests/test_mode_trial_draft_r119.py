from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_trial_draft_reuses_existing_mode_dispatcher_and_trial_planner():
    attribution = (SRC / "modeOperatorEvidenceAttribution.ts").read_text()
    planner = (SRC / "operatorTrialPlanner.ts").read_text()
    assert 'operation==="TRIAL_DRAFT"' in attribution
    assert "evaluateModeOperatorPreview" in attribution
    assert "evaluatePreviewTrialDraft" in attribution
    assert "OMEGA_MODE_OPERATOR_PREREGISTERED_TRIAL_DRAFT_V1" in planner
    assert "HOLD_UNTIL_AUTHENTICATED_FUTURE_EVIDENCE" in planner
    assert "Brier score on future authenticated held-out observations" in planner


def test_trial_draft_preregisters_failure_and_rollback_before_observation():
    planner = (SRC / "operatorTrialPlanner.ts").read_text()
    for phrase in [
        "minimum_observations",
        "maximum_observations",
        "success_condition",
        "falsification_condition",
        "STOP_SUCCESS",
        "STOP_HARM",
        "STOP_BUDGET",
        "authenticated_source_required:true",
        "preregistered_before_future_observation:true",
        "rollback:{required:true",
        "automatic_execution:false",
        "automatic_weight_change:false",
        "automatic_policy_change:false",
        "canonical_state_mutation:false",
    ]:
        assert phrase in planner


def test_living_core_exposes_trial_draft_without_second_shell():
    preview = (SRC / "coreStudioModePreview.ts").read_text()
    assert "Preregister trial draft" in preview
    assert "operation:'TRIAL_DRAFT'" in preview
    assert "/api/core/mode-attribution" in preview
    assert "Open observation / trial governance" in preview
    assert "same browser packet" in preview
    assert "does not execute" in preview
    assert "does not authorize production policy changes" in preview


def test_existing_hd_instrument_and_heartbeat_authority_remain_bound():
    preview = (SRC / "coreStudioModePreview.ts").read_text()
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text()
    assert "enhanceOperationalCoreHdInstrument" in preview
    assert "enhanceOperationalCoreGeometry" in preview
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
