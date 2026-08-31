from __future__ import annotations

import pytest

from omega_genesis.selfbuild import (
    BuildGate,
    SelfBuildPolicy,
    assert_automatic_write,
    path_is_automatically_writable,
    promotion_decision,
    source_fingerprint,
    validate_policy,
)


def policy() -> SelfBuildPolicy:
    return SelfBuildPolicy(
        schema_version=1,
        authority="OMEGA Cloud canonical self-build authority",
        source_mutation_mode="proposal_only",
        automatic_write_paths=("omega.manifest.json", "SHA256SUMS.txt", "release/**", "cloud/omega-cloud/promotion.json"),
        mandatory_gates=(
            "python_compile",
            "python_tests",
            "manifest_rebuild",
            "manifest_verify",
            "release_build",
            "release_reproducibility",
            "worker_check",
            "cloud_container_build",
        ),
        publish_container=True,
        promote_latest=True,
        cloud_authority_required=True,
    )


def test_policy_is_bounded_and_cloud_authoritative():
    p = policy()
    validate_policy(p)
    assert path_is_automatically_writable("omega.manifest.json", p)
    assert path_is_automatically_writable("release/self-build-report.json", p)
    assert path_is_automatically_writable("cloud/omega-cloud/promotion.json", p)
    assert not path_is_automatically_writable("omega_genesis/runtime.py", p)
    with pytest.raises(PermissionError):
        assert_automatic_write("omega_genesis/runtime.py", p)


def test_promotion_requires_every_gate():
    p = policy()
    passing = [BuildGate(name, "PASS") for name in p.mandatory_gates]
    assert promotion_decision(passing, p) == ("PROMOTE", [])
    failing = passing[:-1] + [BuildGate("cloud_container_build", "FAIL")]
    decision, failures = promotion_decision(failing, p)
    assert decision == "QUARANTINE"
    assert failures == ["cloud_container_build:FAIL"]


def test_repaired_build_ledger_is_admissible():
    p = policy()
    gates = [BuildGate(name, "PASS") for name in p.mandatory_gates]
    gates[2] = BuildGate("manifest_rebuild", "REPAIRED")
    assert promotion_decision(gates, p)[0] == "PROMOTE"


def test_source_fingerprint_is_order_invariant():
    one = {"files": [
        {"path": "b", "sha256": "2", "bytes": 2},
        {"path": "a", "sha256": "1", "bytes": 1},
    ]}
    two = {"files": list(reversed(one["files"]))}
    assert source_fingerprint(one) == source_fingerprint(two)


def test_source_mutation_cannot_be_automatic():
    p = policy()
    broken = SelfBuildPolicy(
        **{**p.__dict__, "source_mutation_mode": "automatic"}
    )
    with pytest.raises(ValueError):
        validate_policy(broken)
