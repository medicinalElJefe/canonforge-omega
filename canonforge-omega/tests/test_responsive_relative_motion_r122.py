from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'


def read(name):
    return (SRC/name).read_text(encoding='utf-8')


def test_r122_has_explicit_device_modes_and_persistence():
    s=read('launchHdNavigation.ts')
    assert 'data-device="auto"' in s
    assert 'data-device="mobile"' in s
    assert 'data-device="desktop"' in s
    assert "omega_device_mode" in s
    assert "data-omega-device" in s


def test_r122_relative_motion_is_continuous_and_state_driven():
    s=read('launchHdNavigation.ts')
    assert 'id="omegaMotionField"' in s
    assert 'requestAnimationFrame(draw)' in s
    assert "fieldState()" in s
    assert "runtime?.topology?.sovereign_pc" in s
    assert "runtime?.development?.recent_jobs" in s
    assert "pointer.x" in s and "pointer.y" in s
    assert "active==='Assistant'" in s


def test_r122_shells_change_projection_not_physical_claims():
    s=read('launchHdNavigation.ts')
    assert 'data-shell="144"' in s
    assert 'data-shell="1728"' in s
    assert 'data-shell="20736"' in s
    assert "shell===144?5:shell===1728?8:12" in s
    assert "144/1728/20736 remain software/model/interface shells, not physical-dimension claims" in s
    assert "RELATIVE PROJECTION" in s


def test_r122_preserves_single_runtime_and_protected_entrypoint():
    s=read('launchHdNavigation.ts')
    h=read('heartbeatTruth.ts')
    c=read('convergence.ts')
    assert "No second runtime, canonical packet" in s
    assert 'from "./launchHdNavigation"' in c
    assert 'main = "src/heartbeatTruth.ts"' in (ROOT/'cloudflare'/'omega-v6-worker'/'wrangler.toml').read_text(encoding='utf-8')
    assert 'PC ONLINE requires both' in h
