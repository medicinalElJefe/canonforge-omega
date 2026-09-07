from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github" / "workflows" / "omega-v6-r201-live-continuity-proof.yml").read_text(encoding="utf-8")


def test_r201_live_proof_waits_for_exact_deployed_sha_before_mutating_history():
    assert "Wait for exact deployed canonical SHA" in WORKFLOW
    assert "/api/acceptance/r181/manifest" in WORKFLOW
    assert "deploymentIdentityBound" in WORKFLOW
    assert "canonicalGitSha" in WORKFLOW
    assert "EXPECTED_SHA" in WORKFLOW
    assert WORKFLOW.index("Wait for exact deployed canonical SHA") < WORKFLOW.index("Execute one bounded read-only R200 mission through R201 durability")


def test_r201_live_proof_uses_only_bounded_read_only_r200_mission_tasks():
    assert "'useAI': False" in WORKFLOW
    assert "'allDomains': False" in WORKFLOW
    assert "['correlated-snapshot','proof-state']" in WORKFLOW
    assert "requiredTasks') == 2" in WORKFLOW
    assert "requiredReturned') == 2" in WORKFLOW
    assert "requiredVerified') == 2" in WORKFLOW
    for forbidden in [
        'buildCandidate', 'prepare_build_candidate', '/api/swarm/warp/', '/api/swarm/build/',
        '/api/intelligence/r179/cloud', 'targetDeviceId', 'confirmedMission',
    ]:
        assert forbidden not in WORKFLOW


def test_r201_live_proof_verifies_execute_record_reread_chain():
    for route in [
        "/api/mission/r201/manifest",
        "/api/mission/r201/summary",
        "/api/mission/r201/verify",
        "/api/mission/r201/execute",
        "/api/mission/r201/history?limit=48",
    ]:
        assert route in WORKFLOW
    for token in [
        "EXECUTED_RECORDED_CHAIN_VERIFIED",
        "OMEGA_CANONICAL_MISSION_R200",
        "OMEGA_DURABLE_MISSION_RECORD_R201",
        "OMEGA_DURABLE_MISSION_CHAIN_VERIFICATION_R201",
        "LIVE_R201_DURABLE_MISSION_CONTINUITY_VERIFIED",
    ]:
        assert token in WORKFLOW


def test_r201_live_proof_binds_persisted_entry_without_assuming_exclusive_head_ownership():
    assert "r201-proof-prev-entry-sha.txt" in WORKFLOW
    assert "missionReceiptSha256') == mission_receipt" in WORKFLOW
    assert "entrySha256') == entry_sha" in WORKFLOW
    assert "v.get('headSha256') == s.get('headSha256')" in WORKFLOW
    assert "Concurrent verified writes are permitted" in WORKFLOW
    assert "assert s.get('headSha256') == entry_sha" not in WORKFLOW


def test_r201_live_proof_preserves_authority_and_public_history_privacy():
    assert "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE" in WORKFLOW
    assert "canonicalMutation') is False" in WORKFLOW
    assert "hostStateMutation') is False" in WORKFLOW
    assert "promotionAuthorized') is False" in WORKFLOW
    assert "'intent' not in e" in WORKFLOW
    assert "'taskReceipts' not in e" in WORKFLOW
    assert "'residuals' not in e" in WORKFLOW


def test_r201_live_proof_is_reusable_and_runs_on_every_canonical_push():
    assert "workflow_call:" in WORKFLOW
    assert "workflow_dispatch:" in WORKFLOW
    assert "push:" in WORKFLOW
    assert "pull_request:" in WORKFLOW
    assert "branches: [omega-v6-full-convergence]" in WORKFLOW
    assert "cancel-in-progress: false" in WORKFLOW
    assert "actions/upload-artifact@v4" in WORKFLOW
