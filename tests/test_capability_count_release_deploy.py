from omega_genesis.capabilities import CAPABILITIES


def test_release_aware_deployment_capability_is_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-020"]["status"] == "LIVE_CORE"
    assert "deployment" in rows["CAP-020"]["name"].lower()
