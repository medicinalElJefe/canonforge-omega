from hashlib import sha256

import pytest

from omega_genesis.adapters.earth import EarthSource, GeoPoint, haversine_m, traversal_packet


def _source(**overrides):
    values = {
        "source_id": "public-dem-snapshot-v1",
        "dataset_kind": "DEM_RASTER",
        "source_class": "CANONICAL_EVIDENCE",
        "content_sha256": sha256(b"deterministic public fixture").hexdigest(),
        "min_lat": 31.0,
        "min_lon": -112.0,
        "max_lat": 33.0,
        "max_lon": -109.0,
    }
    values.update(overrides)
    return EarthSource(**values)


def test_source_envelope_is_deterministic_and_sanitized():
    source = _source()
    first = source.envelope()
    second = source.envelope()
    assert first == second
    assert len(first["binding_sha256"]) == 64
    assert first["external_authority_verified"] is False
    assert first["private_locator_published"] is False
    assert "url" not in first
    assert "account" not in first
    assert "token" not in first


def test_invalid_source_contract_is_rejected():
    with pytest.raises(ValueError):
        _source(source_id="private id with spaces")
    with pytest.raises(ValueError):
        _source(dataset_kind="SYNTHETIC_IMAGE")
    with pytest.raises(ValueError):
        _source(source_class="OBSERVED_BUT_UNVERIFIED")
    with pytest.raises(ValueError):
        _source(content_sha256="not-a-digest")
    with pytest.raises(ValueError):
        _source(content_sha256=sha256(b"x").hexdigest().upper())
    with pytest.raises(ValueError):
        _source(min_lat=33.0, max_lat=31.0)


def test_traversal_without_coverage_holds_ground_claims():
    start = GeoPoint(32.2217, -110.9265)
    packet = traversal_packet(start, 0.0, 1_000.0, 1.0)
    assert packet["ground_evidence"]["decision"] == "HOLD"
    assert packet["ground_evidence"]["status"] == "NO_EVIDENCE"
    assert packet["ground_evidence"]["observed_ground_claim"] is False
    assert packet["canonical_mutation"] is False


def test_traversal_binds_matching_source_without_inventing_observation():
    start = GeoPoint(32.2217, -110.9265)
    source = _source()
    packet = traversal_packet(start, 0.0, 1_000.0, 1.0, sources=[source])
    assert packet["ground_evidence"]["decision"] == "PASS"
    assert packet["ground_evidence"]["status"] == "SOURCE_BOUND"
    assert packet["ground_evidence"]["covering_source_ids"] == [source.source_id]
    assert packet["ground_evidence"]["observed_ground_claim"] is False
    assert packet["geometry_evidence"] == "DERIVED_VIEW"
    assert len(packet["packet_sha256"]) == 64


def test_source_order_does_not_change_packet_fingerprint():
    start = GeoPoint(32.2217, -110.9265)
    a = _source(source_id="a")
    b = _source(source_id="b", dataset_kind="GIS_VECTOR", content_sha256=sha256(b"b").hexdigest())
    forward = traversal_packet(start, 1.0, 100.0, 2.0, sources=[a, b])
    reverse = traversal_packet(start, 1.0, 100.0, 2.0, sources=[b, a])
    assert forward == reverse


def test_geodesic_distance_matches_requested_short_traversal():
    start = GeoPoint(32.2217, -110.9265)
    packet = traversal_packet(start, 0.75, 2_500.0, 1.0)
    target = GeoPoint(**packet["target"])
    assert haversine_m(start, target) == pytest.approx(2_500.0, abs=0.01)
