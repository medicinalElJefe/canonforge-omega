from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "convergence.ts"


def test_v6_consumes_genesis_machine_readable_manifest():
    source = SOURCE.read_text(encoding="utf-8")
    assert 'probe(`${GENESIS}/api/convergence/manifest`)' in source
    assert '/api/convergence/manifest' in source
    assert 'genesisManifest' in source
    assert 'manifest_digest' in source


def test_v6_requires_expected_manifest_schema_before_ready():
    source = SOURCE.read_text(encoding="utf-8")
    assert 'OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V2' in source
    assert 'reciprocal_manifest_ready' in source
    assert 'genesis_manifest_digest' in source


def test_v6_keeps_release_authority_boundary_visible():
    source = SOURCE.read_text(encoding="utf-8")
    assert 'V6 remains canonical operational authority' in source
    assert 'promotion_boundary' in source
    assert 'dimensional_boundary' in source


def test_evolution_surface_exposes_manifest_digest_without_claiming_promotion():
    source = SOURCE.read_text(encoding="utf-8")
    assert 'id="manifestDigest"' in source
    assert 'manifest unavailable / not yet promoted' in source
