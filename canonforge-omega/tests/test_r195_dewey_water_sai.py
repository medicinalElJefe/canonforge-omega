from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def read(path: str) -> str:
    return (SRC / path).read_text()


def test_r195_sai_adapter_uses_existing_provider_backed_r179_engine():
    adapter = read("sai/deweyWaterSaiR195.ts")
    entry = read("runtimeEntryR169.ts")
    assert 'import { handleSaiRequest } from "./saiRuntimeR179"' in adapter
    assert 'handleSaiRequest(new Request(nextUrl.toString()' in adapter
    assert 'nextUrl.pathname = "/api/sai/infer"' in adapter
    assert 'import { handleDeweyWaterSaiR195 } from "./sai/deweyWaterSaiR195"' in entry
    assert 'const deweyWaterSai = await handleDeweyWaterSaiR195(request, env)' in entry
    assert entry.index('const deweyWaterSai = await handleDeweyWaterSaiR195(request, env)') < entry.index('if (url.pathname.startsWith("/api/sai/"))')


def test_r195_sai_context_is_source_bound_to_real_build_sources():
    adapter = read("sai/deweyWaterSaiR195.ts")
    for source_id in (
        "12iYNtUkHqlHtjpQot46HWURGe-TI8Kdz",
        "1Q9hKgW6R7jxzDFnGoaj0BokJAHixp5OU",
        "1Flbg7drpujKdQhLKM030I_It9aPzEcPV",
    ):
        assert source_id in adapter
    assert "sourceBoundContextSha256" in adapter
    assert 'CONTEXT_NOT_MODEL_WEIGHT_TRAINING' in adapter
    assert 'SOURCE_BOUND_BUILD_TIME_CONTEXT' in adapter


def test_r195_sai_context_preserves_truth_boundaries():
    adapter = read("sai/deweyWaterSaiR195.ts")
    base = read("sai/saiRuntimeR179.ts")
    assert 'providerWeightsModified: false' in adapter
    assert 'fineTuneClaim: false' in adapter
    assert 'canonicalMutation: false' in adapter
    assert 'does not claim the conceptual Dewey/Water atlas is physical law' in adapter
    assert 'not a probability and not a claim of metaphysical inevitability' not in adapter  # exact wording belongs to compute kernel
    assert 'Inevitability may be discussed only as a bounded diagnostic' in adapter
    assert 'OPERATIONAL_INFERENCE_NOT_FULLY_FINE_TUNED' in base
    assert 'exactTrainingManifestComplete: false' in base
    assert 'loraAdapterVerified: false' in base


def test_r195_sai_default_specialists_cover_math_software_physics_data_proof_coordination():
    adapter = read("sai/deweyWaterSaiR195.ts")
    for role in ("MATHEMATICS", "SOFTWARE", "PHYSICS", "DATA", "PROOF", "COORDINATION"):
        assert f'"{role}"' in adapter
    assert 'depth: Math.max(1, Math.min(12' in adapter


def test_r195_sai_routes_manifest_and_infer_without_replacing_b059_sovereign_paths():
    adapter = read("sai/deweyWaterSaiR195.ts")
    entry = read("runtimeEntryR169.ts")
    assert '"/api/sai/r195/manifest"' in adapter
    assert '"/api/sai/r195/infer"' in adapter
    assert 'B059_SOVEREIGN_PATHS' in entry
    assert '"/api/sai/status"' in entry
    assert '"/api/sai/verify"' in entry
    assert '"/api/sai/query"' in entry
    assert '"/api/sai/traverse"' in entry
