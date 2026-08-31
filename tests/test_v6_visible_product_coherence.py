from pathlib import Path
import subprocess

from omega_genesis.capabilities import CAPABILITIES

ROOT = Path(__file__).resolve().parents[1]
SURFACE = ROOT / "web" / "product-surface.js"
FIELD = ROOT / "web" / "field3d.js"


def test_product_surface_javascript_parses():
    result = subprocess.run(["node", "--check", str(SURFACE)], cwd=ROOT, text=True, capture_output=True, check=False)
    assert result.returncode == 0, result.stderr or result.stdout


def test_product_surface_is_loaded_fail_open():
    text = FIELD.read_text(encoding="utf-8")
    assert 'import("/product-surface.js")' in text
    assert 'dataset.omegaProduct="BASE_FALLBACK"' in text


def test_visible_surface_uses_live_product_truth_not_stale_static_identity():
    text = SURFACE.read_text(encoding="utf-8")
    assert 'OMEGA V6 · Sovereign Computational Environment' in text
    assert 'V6 · GENESIS CORE' in text
    assert 'readJson("/api/health")' in text
    assert 'readJson("/api/capabilities")' in text
    assert 'EXPECTED_PRODUCT="OMEGA_V6"' in text
    assert 'EXPECTED_AUTHORITY="OMEGA_GENESIS_CLOUD"' in text
    assert 'health?.proof?.valid===true' in text
    assert 'health?.replay?.current_digest===digest' in text
    assert 'liveCapabilityCount' in text
    assert 'V6 LIVE' in text


def test_visible_surface_has_direct_real_navigation():
    text = SURFACE.read_text(encoding="utf-8")
    for view in ('host', 'ai', 'render', 'world'):
        assert f'data-product-nav="{view}"' in text
    assert 'button.click()' in text


def test_visible_product_coherence_capability_is_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    row = rows["CAP-032"]
    assert row["status"] == "LIVE_CORE"
    assert "visible product coherence" in row["name"]
    assert "live capability count" in row["gate"]
