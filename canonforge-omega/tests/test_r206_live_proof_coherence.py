from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT.parent / ".github" / "workflows"
R192 = WORKFLOWS / "omega-v6-r192-navigation-home-proof.yml"
R193 = WORKFLOWS / "omega-v6-r193-full-restoration-proof.yml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r192_pr_proves_current_canonical_not_undeployed_candidate():
    text = read(R192)
    assert "pull_request:" in text
    assert "branches: [omega-v6-full-convergence]" in text
    assert 'git fetch --no-tags origin "$GITHUB_BASE_REF"' in text
    assert 'expected_sha="$(git rev-parse FETCH_HEAD)"' in text
    assert 'basis="CURRENT_PR_BASE_CANONICAL_HEAD"' in text
    assert 'basis="CANONICAL_PUSH_HEAD"' in text


def test_r192_requires_two_consecutive_coherent_snapshots_before_route_matrix():
    text = read(R192)
    assert "Wait for two consecutive coherent R192 edge snapshots" in text
    assert "api/fabric/r191/manifest?edgeProof=" in text
    assert 'x-omega-navigation: r192-navigation-home-repair' in text
    assert 'id="omegaUniversalNavR192"' in text
    assert 'id="omegaLaunch" class="hidden"' in text
    assert "api/fabric/r191/status?edgeProof=" in text
    assert "'x-omega-navigation:' not in api_headers" in text
    assert 'stable=$((stable + 1))' in text
    assert 'if [ "$stable" -ge 2 ]' in text
    assert "R192_EDGE_COHERENCE_SETTLED" in text
    assert "Verify every primary human route with bounded per-route settle" in text
    assert "R192_ROUTE_NOT_COHERENT" in text


def test_r193_pr_proves_current_canonical_and_workspace_coherence():
    text = read(R193)
    assert "pull_request:" in text
    assert 'git fetch --no-tags origin "$GITHUB_BASE_REF"' in text
    assert 'expected_sha="$(git rev-parse FETCH_HEAD)"' in text
    assert "Wait for two consecutive coherent R193 workspace snapshots" in text
    assert "api/fabric/r191/manifest?edgeProof=" in text
    assert "api/workspace/r193/manifest?edgeProof=" in text
    assert "api/workspace/r193/health?edgeProof=" in text
    assert 'x-omega-navigation: r192-navigation-home-repair' in text
    assert 'x-omega-workspace: r193-full-restoration-workspace' in text
    assert 'id="omegaUniversalNavR192"' in text
    assert 'id="omegaR193Rail"' in text
    assert 'stable=$((stable + 1))' in text
    assert 'if [ "$stable" -ge 2 ]' in text
    assert "R193_EDGE_COHERENCE_SETTLED" in text


def test_r193_route_matrix_retries_without_weakening_headers_or_dom_contracts():
    text = read(R193)
    assert "Verify restored workspace matrix with bounded per-route settle" in text
    assert "for attempt in $(seq 1 20)" in text
    assert "R193_ROUTE_NOT_COHERENT" in text
    assert "routes=(" in text
    for route in (
        '"/?app=Calculus&mode=dewey-calculus"',
        '"/?app=Memory"',
        '"/?app=Simulate"',
        '"/?app=Earth"',
        '"/?app=Assistant"',
        '"/?app=Hybrid"',
        '"/?app=Proof"',
        '"/validate/independent"',
        '"/warp/build"',
        '"/instrument"',
    ):
        assert route in text
    assert "R193 must not HTML-wrap JSON/API responses" in text


def test_edge_proofs_use_cache_busting_without_mutating_runtime_authority():
    for text in (read(R192), read(R193)):
        assert "edgeProof=$proof" in text
        assert "canonicalMutation" not in text
        assert "wrangler deploy --dry-run" in text
