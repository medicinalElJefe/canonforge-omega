from omega_genesis.capabilities import CAPABILITIES


def test_build_context_guard_capability_is_registered_live_core():
    row = next(item for item in CAPABILITIES if item["id"] == "CAP-025")
    assert row["status"] == "LIVE_CORE"
    assert "build-context" in row["name"].lower()
