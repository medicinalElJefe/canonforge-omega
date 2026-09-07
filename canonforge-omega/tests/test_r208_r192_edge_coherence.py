from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-r192-navigation-home-proof.yml"


def read() -> str:
    return WORKFLOW.read_text(encoding="utf-8")


def test_r208_r192_pr_targets_current_canonical_authority():
    text = read()
    assert "branches: [omega-v6-full-convergence]" in text
    assert 'git fetch --no-tags origin "$GITHUB_BASE_REF"' in text
    assert 'expected_sha="$(git rev-parse FETCH_HEAD)"' in text
    assert 'basis="CURRENT_PR_BASE_CANONICAL_HEAD"' in text
    assert 'basis="CANONICAL_PUSH_HEAD"' in text


def test_r208_r192_requires_two_consecutive_coherent_edge_snapshots():
    text = read()
    assert "Wait for two consecutive coherent R192 edge snapshots" in text
    assert "api/fabric/r191/manifest?edgeProof=" in text
    assert "api/fabric/r191/status?edgeProof=" in text
    assert 'x-omega-navigation: r192-navigation-home-repair' in text
    assert 'id="omegaUniversalNavR192"' in text
    assert 'id="omegaLaunch" class="hidden"' in text
    assert "'x-omega-navigation:' in api_headers" in text
    assert 'stable=$((stable + 1))' in text
    assert 'if [ "$stable" -ge 2 ]' in text
    assert "R192_EDGE_COHERENCE_SETTLED" in text


def test_r208_r192_route_matrix_retries_without_weakening_contract():
    text = read()
    assert "Verify every primary human route with bounded per-route settle" in text
    assert "for attempt in $(seq 1 20)" in text
    assert "R192_ROUTE_NOT_COHERENT" in text
    for route in ("/fabric", "/instrument", "/truth", "/clouds", "/sai", "/compute", "/validate", "/convergence"):
        assert route in text
    assert "grep -qi '^content-type: text/html'" in text
    assert "grep -qi '^x-omega-navigation: r192-navigation-home-repair'" in text
    assert "grep -F 'id=\"omegaUniversalNavR192\"'" in text


def test_r208_r192_cache_busts_live_observations_without_runtime_mutation():
    text = read()
    assert "edgeProof=$proof" in text
    assert "canonicalMutation" not in text
    assert "promotionAuthorized" not in text
    assert "wrangler deploy --dry-run" in text
