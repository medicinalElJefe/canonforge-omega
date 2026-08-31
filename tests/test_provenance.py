from __future__ import annotations

from copy import deepcopy
from pathlib import Path

from omega_genesis.provenance import capability_sources, load_catalog, summary, validate_catalog

ROOT = Path(__file__).resolve().parents[1]


def test_drive_provenance_catalog_is_valid_and_private():
    report = summary(ROOT)
    assert report["status"] == "PASS"
    assert report["privacy_pass"] is True
    assert report["source_count"] >= 3
    assert report["capability_count"] >= 20
    assert len(report["catalog_digest"]) == 64


def test_provenance_capability_query_retains_evidence_boundary():
    result = capability_sources(ROOT, "HYBRID_LINK")
    assert result["status"] == "PASS"
    assert result["count"] >= 1
    assert result["matches"][0]["name"] == "OMEGA_ALL_SOFTWARE_61917364224D_FULL_BUILD_v22.xlsx"
    assert "not automatic proof" in result["boundary"]


def test_planned_canon_is_not_silently_promoted_to_implemented():
    result = capability_sources(ROOT, "GPU_RENDER")
    assert result["count"] == 1
    source = result["matches"][0]
    assert source["execution_claim"] == "PLANNED_CONTRACTS_WITH_LOCKED_INVARIANTS"
    assert "PLANNED" in source["boundary"]


def test_private_drive_identifiers_are_rejected():
    catalog = deepcopy(load_catalog(ROOT))
    catalog["sources"][0]["drive_id"] = "private-id"
    report = validate_catalog(catalog)
    assert report["status"] == "FAIL"
    assert report["privacy_pass"] is False


def test_contract_tampering_breaks_digest():
    catalog = deepcopy(load_catalog(ROOT))
    catalog["sources"][0]["contracts"]["software_systems"] = 25
    report = validate_catalog(catalog)
    assert report["status"] == "FAIL"
    assert any("contract_digest_mismatch" in error for error in report["errors"])
