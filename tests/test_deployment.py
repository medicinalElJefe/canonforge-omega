from pathlib import Path
import json
import pytest

from omega_genesis.deployment import deployment_state, require_immutable_image, validate_health_payload

IMAGE = "ghcr.io/medicinaleljefe/canonforge-omega/omega-cloud@sha256:" + "a" * 64
PREV = "ghcr.io/medicinaleljefe/canonforge-omega/omega-cloud@sha256:" + "b" * 64


def healthy():
    return {
        "status": "OK",
        "canonical_digest": "state-digest",
        "state_id": 7,
        "proof": {"valid": True},
        "replay": {"valid": True},
    }


def test_requires_digest_pinned_image():
    assert require_immutable_image(IMAGE) == IMAGE
    with pytest.raises(ValueError):
        require_immutable_image("ghcr.io/x/omega-cloud:genesis-latest")
    with pytest.raises(ValueError):
        require_immutable_image("ghcr.io/x/omega-cloud:sha-deadbeef")


def test_health_requires_proof_replay_and_canonical_state():
    ok, errors = validate_health_payload(healthy())
    assert ok and errors == []
    broken = healthy()
    broken["replay"] = {"valid": False}
    ok, errors = validate_health_payload(broken)
    assert not ok and "replay_invalid" in errors


def test_promotion_state_retains_previous_and_observed_identity():
    state = deployment_state(IMAGE, PREV, healthy())
    assert state["active_image"] == IMAGE
    assert state["previous_image"] == PREV
    assert state["canonical_digest"] == "state-digest"
    assert state["state_id"] == 7


def test_unhealthy_state_cannot_be_promoted():
    broken = healthy()
    broken["proof"] = {"valid": False}
    with pytest.raises(ValueError):
        deployment_state(IMAGE, None, broken)
