from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_trial_observation_reuses_existing_mode_dispatcher():
    attribution = (SRC / "modeOperatorEvidenceAttribution.ts").read_text()
    binding = (SRC / "trialObservationBinding.ts").read_text()
    assert 'operation==="TRIAL_OBSERVATION"' in attribution
    assert "evaluateTrialObservationBinding" in attribution
    assert "trialObservationBindingSchema" in attribution
    assert "OMEGA_FROZEN_TRIAL_OBSERVATION_BINDING_V1" in binding
    assert "validation-and-evidence-binding-only" in binding


def test_frozen_trial_fingerprint_and_truth_boundaries_are_preserved():
    binding = (SRC / "trialObservationBinding.ts").read_text()
    for phrase in [
        "frozen_trial_fingerprint_mismatch",
        "trial_payload_fingerprint_recomputed:true",
        "trial_terms_rewritten:false",
        "historical_predictions_rewritten:false",
        "metric_changed_after_observation:false",
        "authentication_assertion_independently_verified:false",
        "causation_claimed:false",
        "automatic_execution:false",
        "automatic_weight_change:false",
        "canonical_state_mutation:false",
        "production_policy_mutation:false",
    ]:
        assert phrase in binding


def test_binding_uses_fixed_dispatch_brier_and_requires_observed_evidence_gate():
    binding = (SRC / "trialObservationBinding.ts").read_text()
    assert 'const DISPATCH=["STAY","TURN","ESCALATE"]' in binding
    assert "normalized_multiclass_brier_3_dispatch" in binding
    assert 'evidenceClass==="OBSERVED/MEASURED"' in binding
    assert 'evidenceGate=authenticatedSource&&evidenceClass==="OBSERVED/MEASURED"' in binding
    assert 'evidenceGate?"DERIVED_FROM_OBSERVED":"NO_EVIDENCE"' in binding
    assert "remaining_until_minimum" in binding


def test_living_core_persists_frozen_draft_and_binds_later_observation_without_new_shell():
    preview = (SRC / "coreStudioModePreview.ts").read_text()
    assert "FROZEN TRIAL → LATER OBSERVATION" in preview
    assert "omega:v6:frozen-mode-trial:v1" in preview
    assert "localStorage.setItem" in preview
    assert "localStorage.getItem" in preview
    assert "Bind later observation" in preview
    assert "operation:'TRIAL_OBSERVATION'" in preview
    assert "/api/core/mode-attribution" in preview
    assert "enhanceOperationalCoreHdInstrument" in preview
    assert "enhanceOperationalCoreGeometry" in preview


def test_heartbeat_and_existing_r119_trial_contract_remain_bound():
    planner = (SRC / "operatorTrialPlanner.ts").read_text()
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text()
    assert "OMEGA_MODE_OPERATOR_PREREGISTERED_TRIAL_DRAFT_V1" in planner
    assert "HOLD_UNTIL_AUTHENTICATED_FUTURE_EVIDENCE" in planner
    assert 'main = "src/heartbeatTruth.ts"' in wrangler
