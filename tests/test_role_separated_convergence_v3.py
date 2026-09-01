from pathlib import Path

from omega_genesis.capabilities import CAPABILITIES


ROOT = Path(__file__).resolve().parents[1]
CONVERGENCE = ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "convergence.js"
CATALOG = ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "catalog.js"


def test_v3_manifest_preserves_v6_operational_release_authority():
    text = CONVERGENCE.read_text(encoding="utf-8")
    assert 'schema:"OMEGA_RECURSIVE_CONVERGENCE_MANIFEST_V3"' in text
    assert 'authority_contract:"OMEGA_ROLE_SEPARATED_CONVERGENCE_V1"' in text
    assert 'role:"GENESIS_DISCOVERY_EVOLUTION_AUTHORITY"' in text
    assert 'role:"V6_CANONICAL_OPERATIONAL_RUNTIME"' in text
    assert 'release_authority:"omega-v6-full-convergence"' in text
    assert 'genesis_may_deploy_v6:false' in text
    assert 'operational_release_authority:false' in text
    assert "Genesis owns canonical state and governed evolution" not in text
    assert "V6 holds no second canonical state" not in text


def test_capability_registry_records_role_separation_without_parity_drift():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-032"]["status"] == "LIVE_CORE"
    assert "Role-separated" in rows["CAP-032"]["name"]
    assert "facade over Genesis canonical authority" not in rows["CAP-030"]["name"]
    catalog = CATALOG.read_text(encoding="utf-8")
    for cap_id in rows:
        assert f'id:"{cap_id}"' in catalog
