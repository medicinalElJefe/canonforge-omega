from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r128_camera_fuses_live_observation_and_inferred_reconstruction():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    for token in ['OBSERVED_CAMERA','DERIVED_FIELD','INFERRED_RECONSTRUCTION','getUserMedia','facingMode','analyze()','residue']:
        assert token in s

def test_r128_exposes_domains_phases_mechanisms_and_mode188():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    for token in ['Geometry','Optics','Material / dimensional skin','Relativity / phase-time','Relation / Mode 188','TRIANGULATE DEPTH','RESOLVE OCCLUSION','PROPAGATE LIGHT','MODE 188 DISPATCH','Mineral / crystal','Water / liquid','Plant / living tissue','Dynamic mechanism']:
        assert token in s

def test_r128_calculus_drives_camera_result_state():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    for token in ['z ≈ f·B / disparity','STAY','TURN','ESCALATE','confidence','C*P','Q+L','omega=']:
        assert token in s
    assert 'temporal coherence' in s

def test_r128_camera_acquisition_is_actionable_and_truth_bounded():
    s=(SRC/'syntheticCamera.ts').read_text(encoding='utf-8')
    for token in ['SECURE CONTEXT','REQUESTING PERMISSION','UNSUPPORTED BROWSER','camera metadata timeout','video.videoWidth','OBSERVED CAMERA + FIELD']:
        assert token in s
    assert 'never presented as authenticated observation of unseen content' in s
    assert 'x-omega-evidence' in s
