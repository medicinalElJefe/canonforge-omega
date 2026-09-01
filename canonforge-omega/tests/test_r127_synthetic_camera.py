from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def read(name): return (SRC/name).read_text(encoding='utf-8')

def test_camera_route_preserves_heartbeat_entrypoint():
    h=read('heartbeatTruth.ts')
    assert 'syntheticCameraResponse' in h
    assert 'url.pathname === "/camera"' in h
    w=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text(encoding='utf-8')
    assert 'main = "src/heartbeatTruth.ts"' in w

def test_camera_exposes_domains_phases_and_dimensional_skins():
    s=read('syntheticCamera.ts')
    for token in ['Geometry','Optics','Material / dimensional skin','Relativity / phase-time','ACQUIRE PRIORS','TRIANGULATE DEPTH','RESOLVE OCCLUSION','SOLVE SURFACE FIELD','APPLY SKIN RESPONSE','PROPAGATE LIGHT','PHASE / MOTION WARP','INTEGRATE RELATIONS','RENDER + CONFIDENCE','Mineral / crystal','Water / liquid','Plant / living tissue','Dynamic mechanism']:
        assert token in s

def test_camera_has_actual_reconstruction_math_and_motion():
    s=read('syntheticCamera.ts')
    for token in ['z ≈ f·B / disparity','radiance','parallax','confidence','requestAnimationFrame(render)','relational samples / frame','phase warp','occlusion','skin response']:
        assert token in s

def test_camera_never_claims_observed_image():
    s=read('syntheticCamera.ts')
    assert 'INFERRED MODEL VIEW' in s
    assert 'not a photograph' in s
    assert 'not an authenticated observation' in s
    assert 'cannot be presented as seeing an unseen scene' in s
