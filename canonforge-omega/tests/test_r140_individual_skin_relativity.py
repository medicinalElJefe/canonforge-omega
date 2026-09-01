from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "cloudflare" / "omega-v6-worker" / "src"


def test_r140_binds_individual_skin_layer_over_root_without_new_authority():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    skin = (SRC / "individualSkinRelativity.ts").read_text(encoding="utf-8")
    assert 'enhanceRootSovereignField(response)' in wrapper
    assert 'enhanceIndividualSkinRelativity(rendered)' in wrapper
    assert '61,917,364,224' in skin
    assert 'CONTROL=20736' in skin
    for name in ["PARENT", "INTERACTION", "SCAR", "CONTINUITY", "COMPRESSION", "SKIN", "INTERPRETATION", "BEHAVIOR"]:
        assert name in skin
    assert 'state authority' in skin
    assert 'not a new physical law' in skin


def test_r140_uses_active_address_depth_for_above_below_relativity():
    skin = (SRC / "individualSkinRelativity.ts").read_text(encoding="utf-8")
    assert 'LEVELS=10' in skin
    assert 'function depthDigits()' in skin
    assert 'function hierarchy(i,active)' in skin
    assert 'A↕B' in skin
    assert 'omegaActiveAddressDigits' in skin
