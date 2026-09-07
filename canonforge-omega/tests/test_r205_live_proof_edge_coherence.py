from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT.parent / ".github" / "workflows"
R201 = WORKFLOWS / "omega-v6-r201-live-continuity-proof.yml"
R204 = WORKFLOWS / "omega-v6-r204-live-proof.yml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r201_pr_self_test_targets_deployed_canonical_base_not_candidate_sha():
    text = read(R201)
    assert "pull_request:" in text
    assert "branches: [omega-v6-full-convergence]" in text
    assert ".github/workflows/omega-v6-r201-live-continuity-proof.yml" in text
    assert "canonforge-omega/tests/test_r205_live_proof_edge_coherence.py" in text
    assert "EXPECTED_SHA: ${{ inputs.expected_sha || github.event.pull_request.base.sha || github.sha }}" in text


def test_r201_waits_for_a_coherent_exact_sha_route_set_twice():
    text = read(R201)
    assert "Wait for exact deployed canonical SHA and coherent R201 route set" in text
    assert 'api/acceptance/r181/manifest?edgeProof=' in text
    assert 'api/mission/r201/manifest?edgeProof=' in text
    assert 'api/mission/r201/summary?edgeProof=' in text
    assert 'api/mission/r201/verify?edgeProof=' in text
    assert 'stable=$((stable + 1))' in text
    assert 'if [ "$stable" -ge 2 ]' in text
    assert "R201_EDGE_COHERENCE_SETTLED" in text
    assert "OMEGA_LIVE_ACCEPTANCE_MANIFEST_R181" in text
    assert "OMEGA_DURABLE_MISSION_ROUTE_MANIFEST_R201" in text
    assert "OMEGA_DURABLE_MISSION_CHAIN_VERIFICATION_R201" in text


def test_r201_preserves_truth_boundaries_and_explicit_ai_off():
    text = read(R201)
    assert "'useAI': False" in text
    assert "['correlated-snapshot','proof-state']" in text
    assert "DURABLE_EVIDENCE_HISTORY_NOT_HOSTSTATE_NOT_CANONSTATE" in text
    assert "canonicalMutation') is False" in text
    assert "hostStateMutation') is False" in text
    assert "promotionAuthorized') is False" in text
    assert "historical OMEGA_RUNTIME/OmegaRuntime binding is unchanged" in text


def test_r201_post_write_proof_is_concurrency_safe_but_receipt_bound():
    text = read(R201)
    assert "r201-proof-prev-entry-sha.txt" in text
    assert "prevEntrySha256" in text
    assert "history?limit=48&edgeProof=" in text
    assert "missionReceiptSha256') == mission_receipt" in text
    assert "entrySha256') == entry_sha" in text
    assert "v.get('headSha256') == s.get('headSha256')" in text
    assert "Concurrent verified writes are permitted" in text
    assert "ourEntryIsCurrentHead" in text
    assert "assert s.get('headSha256') == entry_sha" not in text
    assert "assert latest.get('missionId') == mission_id" not in text


def test_r204_requires_manifest_health_and_convergence_coherence_twice():
    text = read(R204)
    assert "Wait for two consecutive coherent exact-SHA R204 route sets" in text
    assert 'api/system/r204/manifest?edgeProof=' in text
    assert '_omega/health?edgeProof=' in text
    assert 'api/convergence/edge?edgeProof=' in text
    assert 'stable=$((stable + 1))' in text
    assert 'if [ "$stable" -ge 2 ]' in text
    assert "R204_EDGE_COHERENCE_SETTLED" in text
    assert "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204" in text
    assert "authority_contract_ready" in text
    assert "v6_release_authority" in text
    assert "genesis_may_deploy_v6" in text


def test_r204_does_not_weaken_verified_return_or_storage_authority():
    text = read(R204)
    assert "canonicalEntrypoint') != 'src/runtimeEntryR169.ts'" in text
    assert "durableBinding') != 'OMEGA_RUNTIME'" in text
    assert "durableClass') != 'OmegaRuntime'" in text
    assert "newDurableNamespaceCreated') is not False" in text
    assert "r201EvidenceLedgerPreserved') is not True" in text
    assert "r203HybridMissionLedgerPreserved') is not True" in text
    assert "AUTHENTICATED_EXECUTION_RETURN_EVIDENCE_NOT_CANONSTATE" in text
    assert "verifiedReturnIsNotCanonState" in text
    assert "verifiedReturnIsNotPromotion" in text
    assert "canonicalMutation') is not False" in text
    assert "hostStateMutation') is not False" in text
    assert "promotionAuthorized') is not False" in text
