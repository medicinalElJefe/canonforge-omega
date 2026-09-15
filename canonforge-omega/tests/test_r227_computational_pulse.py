from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "cloudflare/omega-v6-worker/src/system/computationalPulseR227.ts"


def test_r227_pulse_is_derived_computational_model_not_physical_primitive():
    text = SOURCE.read_text(encoding="utf-8")
    assert 'DERIVED_COMPUTATIONAL_MODEL_NOT_PHYSICAL_PRIMITIVE' in text
    assert 'physicalPrimitive: false' in text
    assert 'canonMutationAuthority: false' in text
    assert 'not a claim that software pulses are physical photons' in text


def test_r227_pulse_carries_identity_invariant_scar_and_receipt_lineage():
    text = SOURCE.read_text(encoding="utf-8")
    for token in [
        'pulseId', 'parentPulseId', 'sequence', 'address', 'skin', 'orientation',
        'phase', 'continuity', 'invariantHash', 'scarHash', 'transformId',
        'priorReceiptHash', 'OMEGA_COMPUTATIONAL_PULSE_RECEIPT_R227',
        'TRACE_AND_PROOF_ONLY_NOT_CANON_MUTATION', 'verifyPulseContinuityR227'
    ]:
        assert token in text


def test_r227_preserves_canonical_address_skin_boundary():
    text = SOURCE.read_text(encoding="utf-8")
    assert '12 | 144 | 1728 | 20736 | 248832' in text
    assert 'computational address-resolution skins, not physical dimensions' in text
    assert 'partition -> interaction/transform -> invariant carry -> scar/residual carry -> re-contextualize -> next address' in text
