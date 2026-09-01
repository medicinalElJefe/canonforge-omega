from pathlib import Path

SRC = Path('cloudflare/omega-v6-worker/src/launchHdNavigation.ts')

def test_mobile_launch_isolated_and_navigable():
    text = SRC.read_text()
    assert 'z-index:2147483000' in text
    assert 'isolation:isolate' in text
    assert 'omegaLaunchOpen' in text
    assert 'body.omegaLaunchOpen>main.work' in text
    assert 'body.omegaLaunchOpen>#omegaDock' in text
    assert '.launchPanel{display:block' in text
    assert '.launchActions{grid-template-columns:1fr 1fr' in text
    assert '@media(max-width:430px)' in text
    assert "document.body.classList.remove('omegaLaunchOpen')" in text
    assert 'env(safe-area-inset-top)' in text
    assert 'env(safe-area-inset-bottom)' in text
