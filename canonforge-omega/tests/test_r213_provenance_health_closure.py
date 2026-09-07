from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FABRIC = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "system" / "operationalProvenanceFabricR211.ts"


def read() -> str:
    return FABRIC.read_text(encoding="utf-8")


def test_release_aliases_accept_legacy_revision_and_build_contracts():
    text = read()
    assert 'if (key === "release") return deepHas(body, "release") || deepHas(body, "revision") || deepHas(body, "build")' in text
    assert 'revisionBuildAliasesAreValidReleaseIdentity: true' in text


def test_degraded_live_source_is_not_mislabeled_unavailable():
    text = read()
    assert '"DEGRADED" | "UNAVAILABLE"' in text
    assert 'return "DEGRADED"' in text
    assert 'degradedIsNotUnavailable: true' in text
    assert 'valid OMEGA schema but reports a degraded internal state is DEGRADED, not UNAVAILABLE' in text


def test_required_whole_system_health_still_controls_aggregate_ok():
    text = read()
    assert '"wholeSystem"' in text
    assert 'requiredCalls.every(call => call.ok)' in text
    assert 'pcOnlineRequiresCurrentAuthenticatedHeartbeat: true' in text


def test_truth_and_authority_boundaries_remain_non_mutating():
    text = read()
    for token in (
        'driveSnapshotIsNotLiveDriveTelemetry: true',
        'publicSarCatalogIsNotRealTimeRadar: true',
        'sarMetadataIsNotInSarDeformation: true',
        'solverAvailableIsNotSolverExecuted: true',
        'returnedIsNotVerified: true',
        'verifiedReturnIsNotCanonState: true',
        'canonicalMutation: false',
        'hostStateMutation: false',
        'promotionAuthorized: false',
    ):
        assert token in text
