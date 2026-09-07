from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FUSION = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "intelligence" / "saiAiFusionR179.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"


def test_r179_invokes_real_workers_ai_binding():
    text = FUSION.read_text(encoding="utf-8")
    assert "env.AI.run" in text
    assert "@cf/meta/llama-3.3-70b-instruct-fp8-fast" in text
    assert "CLOUDFLARE_WORKERS_AI" in text
    assert "provider_model_pretrained_external: true" in text
    assert "omega_trained_provider_weights: false" in text


def test_r179_sai_grounded_claim_requires_exact_b059_receipt():
    text = FUSION.read_text(encoding="utf-8")
    assert 'B059_QUERY_SCHEMA = "OMEGA_SAI_B059_QUERY_RECEIPT_R179"' in text
    assert "packet.grounded === true" in text
    assert "packet.fully_trained_within_declared_scope === true" in text
    assert "packet.foundation_model_weights_trained === false" in text
    assert "verified_b059_evidence_required" in text


def test_r179_chat_is_mounted_before_canonical_proxy_and_keeps_route_gate():
    text = ENTRY.read_text(encoding="utf-8")
    assert 'url.pathname === "/api/chat"' in text
    assert "handleSaiAiFusionR179" in text
    fusion = FUSION.read_text(encoding="utf-8")
    assert "route_admission_required" in fusion
    assert "R179 keeps route-before-generation mandatory" in fusion


def test_workers_ai_binding_and_r179_identity_are_declared():
    text = WRANGLER.read_text(encoding="utf-8")
    assert '[ai]\nbinding = "AI"' in text
    assert 'SAI_B059_TRAINING_ID = "r179-exact-15-authority-compiled-indexed-calibrated-sai"' in text
    assert 'SAI_AI_FUSION_ID = "r179-workers-ai-plus-verified-b059-grounding"' in text
