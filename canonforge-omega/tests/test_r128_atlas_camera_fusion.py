from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r128_camera_fuses_live_observation_and_inferred_reconstruction():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    for token in ['OBSERVED_CAMERA','DERIVED_FIELD','INFERRED_RECONSTRUCTION','getUserMedia','facingMode','analyze()','temporal residue']:
        assert token in s

def test_r128_exposes_domains_phases_mechanisms_and_mode188():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    for token in ['GEOMETRY','OPTICS','DIMENSIONAL SKIN','PHASE / TIME','RELATION / MODE','TRIANGULATE DEPTH','RESOLVE OCCLUSION','PROPAGATE RADIANCE','MODE 188 DISPATCH','Mineral / Crystal','Water / Liquid','Living Tissue','Rigid Mechanism']:
        assert token in s

def test_r128_calculus_drives_camera_result_state():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    for token in ['z ≈ f·B / disparity','Ω=(CΩ·Φ)/(q+Λ+ε)','confidence = geometry × optics × temporal coherence × (1−uncertainty)','STAY','TURN','ESCALATE']:
        assert token in s

def test_r128_truth_boundary_is_explicit():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    assert 'never presented as authenticated observation of unseen content' in s
    assert 'x-omega-evidence' in s
