import pytest

from omega_genesis.world import WorldObservation, reconstruct_points


CANON = "a" * 64


def obs(source, x, sigma=1.0, frame="EPSG:4978", units="m", evidence="IMPORTED"):
    return WorldObservation.from_dict({
        "source_id": source,
        "authority": "test-source",
        "evidence_class": evidence,
        "observed_at": "2026-08-31T03:00:00+00:00",
        "frame": frame,
        "units": units,
        "x": x,
        "y": 0.0,
        "z": 0.0,
        "sigma": sigma,
    })


def test_world_reconstruction_is_source_bound_and_deterministic():
    rows = [obs("a", 0.0), obs("b", 2.0)]
    first = reconstruct_points(rows, canonical_digest=CANON)
    second = reconstruct_points(rows, canonical_digest=CANON)
    assert first == second
    assert first["centroid"]["x"] == 1.0
    assert first["residual_rms"] == 1.0
    assert first["source_bound"] is True
    assert first["synthetic_transform_used"] is False
    assert len(first["source_set_digest"]) == 64
    assert len(first["reconstruction_digest"]) == 64


def test_world_reconstruction_respects_uncertainty_weights():
    result = reconstruct_points([obs("strong", 0.0, 1.0), obs("weak", 10.0, 10.0)], canonical_digest=CANON)
    assert result["centroid"]["x"] < 1.0
    assert result["sample_count"] == 2


def test_world_reconstruction_refuses_mixed_frames_and_units():
    with pytest.raises(ValueError, match="mixed coordinate frames"):
        reconstruct_points([obs("a", 0.0), obs("b", 1.0, frame="LOCAL")], canonical_digest=CANON)
    with pytest.raises(ValueError, match="mixed units"):
        reconstruct_points([obs("a", 0.0), obs("b", 1.0, units="km")], canonical_digest=CANON)


def test_world_reconstruction_refuses_unproven_transform():
    with pytest.raises(ValueError, match="transform evidence required"):
        reconstruct_points([obs("a", 0.0), obs("b", 1.0)], canonical_digest=CANON, target_frame="LOCAL")


def test_world_observation_requires_provenance_and_time():
    with pytest.raises(ValueError):
        WorldObservation.from_dict({
            "source_id": "",
            "authority": "x",
            "observed_at": "2026-08-31T03:00:00+00:00",
            "frame": "LOCAL",
            "units": "m",
            "x": 0,
            "y": 0,
            "z": 0,
        })


def test_world_reconstruction_is_input_order_invariant():
    rows = [obs("b", 2.0), obs("a", 0.0)]
    forward = reconstruct_points(rows, canonical_digest=CANON)
    reverse = reconstruct_points(list(reversed(rows)), canonical_digest=CANON)
    assert forward == reverse
