from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
ACCEPTANCE = WORKER / "src" / "acceptance" / "liveAcceptanceR181.ts"
ENTRY = WORKER / "src" / "runtimeEntryR169.ts"


def text(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r181_never_equates_presence_with_full_training():
    source = text(ACCEPTANCE)
    assert 'quickB059PresenceMayBeCalledFullyTrained: false' in source
    assert 'b059DeepVerificationRequiredForFullyTrainedScope: true' in source
    assert 'b059GroundedQueryRequiredForFullAcceptance: true' in source
    assert 'foundationModelWeightsTrained === false' in source
    assert 'documents === 541526' in source
    assert 'edges === 82082' in source
    assert 'sourceAuthorityCount === 15' in source


def test_r181_requires_current_authenticated_sovereign_heartbeat():
    source = text(ACCEPTANCE)
    assert 'currentAuthenticatedHeartbeatRequiredForSovereignAcceptance: true' in source
    assert 'current && authenticated && heartbeatCurrent' in source
    assert 'CLOUD_OPERATIONAL_SOVEREIGN_ACCEPTANCE_PENDING_CURRENT_HEARTBEAT' in source


def test_r181_full_acceptance_requires_grounded_receipt_and_keeps_authority_separate():
    source = text(ACCEPTANCE)
    assert 'b059Query.grounded' in source
    assert 'b059Query.evidenceCount > 0' in source
    assert 'LIVE_ACCEPTANCE_RECEIPT_NOT_CANON' in source
    assert 'canonicalMutation: false' in source
    assert 'promotionAuthorized: false' in source
    assert 'providerModelWeightsAreExternalPretrainingNotOmegaTraining: true' in source


def test_r181_route_is_additive_to_existing_ai_sai_runtime():
    entry = text(ENTRY)
    assert 'handleLiveAcceptanceR181' in entry
    assert 'url.pathname.startsWith("/api/acceptance/r181/")' in entry
    assert 'handleSaiAiFusionR179' in entry
    assert 'B059_SOVEREIGN_PATHS' in entry
    assert 'handleSaiRequest' in entry
