from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'
WRANGLER=ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml'


def text(p): return p.read_text(encoding='utf-8')


def test_r130_preserves_protected_runtime_and_composes_beneath_r129():
    w=text(WRANGLER); shell=text(SRC/'sovereignVisualShell.ts'); core=text(SRC/'spatialCommandCore.ts')
    assert 'main = "src/heartbeatTruth.ts"' in w
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in w
    assert 'enhanceSpatialCommandCore' in shell
    assert 'enhanceSovereignVisualShell' in shell
    assert 'interaction/composition layer' in core
    assert 'no visual state grants execution or canonical mutation authority' in core


def test_r130_routes_only_to_real_v6_surfaces_and_real_evidence():
    core=text(SRC/'spatialCommandCore.ts')
    for token in ['/?view=Field','/?view=Earth','/?view=Assistant','/?view=Hybrid','/?view=Proof','/camera','/evolution','/convergence']:
        assert token in core
    for token in ['/api/convergence/edge','/api/hybrid/status','/api/development/status','authority_contract_ready','pc_online','capability_count']:
        assert token in core


def test_r130_is_spatial_responsive_and_accessible():
    core=text(SRC/'spatialCommandCore.ts')
    for token in ['omegaSpatialCore','omegaSpatialCanvas','COMMAND / NAVIGATE','prefers-reduced-motion','@media(max-width:650px)','aria-label="OMEGA spatial command core"']:
        assert token in core
