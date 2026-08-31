from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def read(name): return (SRC/name).read_text(encoding='utf-8')

def test_r121_root_launch_is_additive_and_governed():
    s=read('launchHdNavigation.ts')
    assert 'HD_LAUNCH_NAVIGATION_BOUNDARY' in s
    assert 'pathname!=="/"' in s
    assert 'id="omegaLaunch"' in s
    assert 'id="omegaDock"' in s
    assert 'id="omegaPalette"' in s
    assert '/core' in s
    assert 'second canonical packet' in s
    assert 'new execution authority' in s
    assert 'new evidence authority' in s

def test_r121_workspace_navigation_uses_existing_surfaces():
    s=read('launchHdNavigation.ts')
    for name in ['Field','Earth','Assistant','Hybrid','Proof']:
        assert name in s
    assert ".navbtn[data-app]" in s
    assert 'btn.click()' in s
    assert 'Ctrl/⌘ K for palette' in s
    assert 'prefers-reduced-motion' in s

def test_r121_is_bound_through_existing_convergence_wrapper():
    s=read('convergence.ts')
    assert 'enhanceHdLaunchNavigation' in s
    assert 'await injectEvolutionLink(response)' in s
    assert 'url.pathname' in s

def test_r121_preserves_protected_worker_entrypoint():
    w=(ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text(encoding='utf-8')
    assert 'main = "src/heartbeatTruth.ts"' in w
    h=read('heartbeatTruth.ts')
    assert 'PC ONLINE requires both an upstream authenticated-online claim and a current authenticated Hybrid heartbeat' in h
