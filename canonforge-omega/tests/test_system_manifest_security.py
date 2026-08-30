from omega_runtime.security import gateway_authorized, is_loopback
from omega_runtime.system_manifest import FamilyStatus, manifest, summary


def test_all_24_source_defined_software_families_are_bound():
    families = manifest()
    assert len(families) == 24
    assert {f.family_id for f in families} == {f"F{i:02d}" for i in range(24)}
    assert summary()["complete_manifest"] is True
    assert all(f.name and f.invariant and f.purpose and f.evidence_boundary for f in families)


def test_full_system_does_not_pretend_planned_adapters_are_live_core():
    by_id = {f.family_id: f for f in manifest()}
    assert by_id["F09"].status is FamilyStatus.PLANNED_WITH_BOUNDARY  # Earth source adapters required
    assert by_id["F10"].status is FamilyStatus.PLANNED_WITH_BOUNDARY  # biological evidence adapters required
    assert by_id["F17"].status is FamilyStatus.PLANNED_WITH_BOUNDARY  # sonification boundary
    assert by_id["F12"].status is FamilyStatus.RECOVERY_ONLY          # seed is not release authority


def test_gateway_security_local_and_remote_boundaries():
    assert is_loopback("127.0.0.1")
    assert is_loopback("::1")
    assert is_loopback("localhost")
    assert gateway_authorized(client_host="127.0.0.1", presented_token=None, configured_token=None)
    assert not gateway_authorized(client_host="10.0.0.20", presented_token=None, configured_token=None)
    assert not gateway_authorized(client_host="10.0.0.20", presented_token="bad", configured_token="correct")
    assert gateway_authorized(client_host="10.0.0.20", presented_token="correct", configured_token="correct")
