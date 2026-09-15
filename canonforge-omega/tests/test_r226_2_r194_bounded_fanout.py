from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "cloudflare/omega-v6-worker/src/evidencePlaneR194.ts"


def test_r194_preserves_all_evidence_sources_and_bounds_recursive_fanout():
    text = SOURCE.read_text(encoding="utf-8")
    assert "PROBE_BATCH_SIZE_R226_2=3" in text
    assert "probeBoundedR226_2" in text
    expected = [
        "/api/state/workbench/schema",
        "/api/core/evidence-ledger/schema",
        "/api/core/replay/schema",
        "/api/sai/manifest",
        "/api/convergence/edge",
        "/api/omega/state",
        "/api/omega/proof?limit=1",
        "/api/restoration",
        "/api/earth/catalog",
        "/api/sai/status",
        "/api/hybrid/status",
    ]
    for path in expected:
        assert path in text
    assert "localVerified>=4" in text
    assert "localTotal:5" in text
    assert "externalTotal:6" in text
    assert 'allEvidenceSourcesPreserved:true' in text
    assert 'classification:"TRANSPORT_PRESSURE_REPAIR_ONLY"' in text


def test_r194_does_not_reclassify_external_evidence_or_authority():
    text = SOURCE.read_text(encoding="utf-8")
    assert "localWorkerContractIsNotSovereignState:true" in text
    assert "localProofSchemaIsNotSovereignProofHistory:true" in text
    assert "localReplaySchemaIsNotSovereignRestorationState:true" in text
    assert "pcOnlineRequiresCurrentHeartbeat:true" in text
    assert "nativeRcwaNotInferred:true" in text
