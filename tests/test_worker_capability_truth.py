from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_worker_capability_endpoint_uses_governed_registry():
    index = (ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "index.js").read_text(encoding="utf-8")
    catalog = (ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "catalog.js").read_text(encoding="utf-8")
    assert "ER,CAPABILITIES" in index
    assert 'count:CAPABILITIES.length,capabilities:CAPABILITIES' in index
    assert 'Array.from({length:18}' not in index
    assert 'id:"CAP-021"' in catalog
