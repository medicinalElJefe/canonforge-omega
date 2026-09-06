from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r136_calculus_is_direct_state_bound_and_non_authoritative():
    text=(SRC/'calculusInstrument.ts').read_text(encoding='utf-8')
    for token in ['DIRECT MANIPULABLE CALCULUS','Trajectory / Curvature / Phase Consequence','/api/omega/state','Display phase','Curvature κ','Shell resolution','ALPHA','BASE','CONSTRUCT','PRUNE','OMEGA']:
        assert token in text
    assert 'never mutate canonical state' in text
    assert 'representational shells only' in text

def test_r136_calculus_is_wired_into_existing_visual_pipeline():
    text=(SRC/'spatialCommandCore.ts').read_text(encoding='utf-8')
    assert 'enhanceCalculusInstrument' in text
    assert 'enhanceLivePhaseVisual' in text
    assert '/?view=Calculus' in text
