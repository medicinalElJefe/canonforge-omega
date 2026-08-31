from __future__ import annotations

from copy import deepcopy
from pathlib import Path

from omega_genesis.autodeploy import (
    deployment_decision,
    load_policy,
    promotion_digest,
    validate_promotion,
)

ROOT = Path(__file__).resolve().parents[1]
REPO = "ghcr.io/medicinaleljefe/canonforge-omega/omega-cloud"
IMAGE_A = REPO + "@sha256:" + "a" * 64
IMAGE_B = REPO + "@sha256:" + "b" * 64


def promotion():
    return {
        "schema": "omega.cloud.promotion.v1",
        "decision": "PROMOTE",
        "image": IMAGE_A,
        "source_sha": "1" * 40,
        "trigger_sha": "2" * 40,
        "manifest_sha256": "3" * 64,
        "release_sha256": "4" * 64,
        "workflow_run_id": "12345",
        "boundary": "candidate only; deployment requires live proof",
    }


def test_cloud_autodeploy_policy_is_bounded():
    policy = load_policy(ROOT)
    assert policy.schema_version == 1
    assert policy.require_governed_promotion is True
    assert policy.require_immutable_image is True
    assert policy.poll_seconds >= 60
    assert policy.failure_backoff_seconds >= policy.poll_seconds


def test_governed_promotion_requires_exact_immutable_repository():
    out = validate_promotion(promotion(), REPO)
    assert out["status"] == "PASS"
    assert out["image"] == IMAGE_A
    assert len(out["promotion_digest"]) == 64

    bad = deepcopy(promotion())
    bad["image"] = "ghcr.io/other/omega@sha256:" + "a" * 64
    assert validate_promotion(bad, REPO)["status"] == "FAIL"

    tag = deepcopy(promotion())
    tag["image"] = REPO + ":genesis-latest"
    assert validate_promotion(tag, REPO)["status"] == "FAIL"


def test_promotion_digest_detects_change():
    a = promotion()
    b = deepcopy(a)
    b["release_sha256"] = "5" * 64
    assert promotion_digest(a) != promotion_digest(b)


def test_autodeploy_skips_current_and_backs_off_failed_candidate():
    decision, _ = deployment_decision(IMAGE_A, IMAGE_A, None, None, 1000, 300)
    assert decision == "SKIP_CURRENT"

    decision, _ = deployment_decision(IMAGE_A, IMAGE_B, IMAGE_A, 900, 1000, 300)
    assert decision == "BACKOFF"

    decision, _ = deployment_decision(IMAGE_A, IMAGE_B, IMAGE_A, 600, 1000, 300)
    assert decision == "DEPLOY"
