from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "system" / "driveCorpusSnapshotR195.ts"


def test_r220_r195_corpus_inflation_is_single_flight_without_weakening_integrity():
    source = SNAPSHOT.read_text(encoding="utf-8")
    assert "let inflating: Promise<string> | null = null" in source
    assert "if (inflating !== null) return inflating" in source
    assert "inflating = (async () =>" in source
    assert "return await inflating" in source
    assert "inflating = null" in source
    assert 'DecompressionStream("gzip")' in source
    assert "crypto.subtle.digest" in source
    assert "R195_DRIVE_CORPUS_HASH_MISMATCH" in source
    assert 'runtimeInflation: "SINGLE_FLIGHT_PER_WORKER_ISOLATE"' in source
    assert 'DRIVE_CORPUS_SNAPSHOT_SHA256_R195 = "8b66519d36387f3a9ca3f9a10a7dd5da0b806c4fc7b29d9a4353e94e9859e655"' in source


def test_r220_r195_corpus_cache_is_assigned_only_after_hash_validation():
    source = SNAPSHOT.read_text(encoding="utf-8")
    mismatch = source.index("R195_DRIVE_CORPUS_HASH_MISMATCH")
    cache_text = source.index("cachedText = text")
    cache_digest = source.index("cachedDigest = digest")
    assert mismatch < cache_text < cache_digest
