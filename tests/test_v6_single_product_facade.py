from pathlib import Path
import subprocess

from omega_genesis.capabilities import CAPABILITIES

ROOT = Path(__file__).resolve().parents[1]
V6 = ROOT / "cloudflare" / "omegav6-worker"


def test_v6_worker_javascript_parses():
    result = subprocess.run(["node", "--check", str(V6 / "src" / "index.js")], cwd=ROOT, text=True, capture_output=True, check=False)
    assert result.returncode == 0, result.stderr or result.stdout


def test_v6_is_public_facade_not_second_canonical_state():
    wrangler = (V6 / "wrangler.toml").read_text(encoding="utf-8")
    source = (V6 / "src" / "index.js").read_text(encoding="utf-8")
    assert 'name = "omegav6"' in wrangler
    assert 'binding = "GENESIS"' in wrangler
    assert 'service = "omega-genesis-v1"' in wrangler
    assert "durable_objects" not in wrangler
    assert "OMEGA_V6_PUBLIC_FACADE" in source
    assert "cloudflare-service-binding" in source
    assert "V6 does not maintain a second canonical state" in source
    assert "canonical_mutation: false" in source


def test_v6_deploy_requires_genesis_digest_parity_and_real_html():
    workflow = (ROOT / ".github" / "workflows" / "deploy-v6-cloudflare.yml").read_text(encoding="utf-8")
    assert "LIVE_VERIFIED_SINGLE_PRODUCT" in workflow
    assert "omega-genesis-v1.jeffdeweyeljefe.workers.dev/api/health" in workflow
    assert "vh.get('canonical_digest') == digest" in workflow
    assert "edge.get('canonical_digest') == digest" in workflow
    assert "'OMEGA' in html.upper()" in workflow


def test_v6_single_product_capability_is_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    row = rows["CAP-030"]
    assert row["status"] == "LIVE_CORE"
    assert "V6 facade" in row["name"]
    assert "no shadow state" in row["gate"]
