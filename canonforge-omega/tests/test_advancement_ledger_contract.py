from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "release" / "OMEGA_V6_ADVANCEMENT_LEDGER.md"


def test_advancement_ledger_exists_and_declares_release_contract():
    text = LEDGER.read_text(encoding="utf-8")
    assert "# OMEGA V6 Advancement Ledger" in text
    assert "Canonical release branch: `omega-v6-full-convergence`" in text
    for required in (
        "status: `CANDIDATE`, `HELD`, `ADMITTED/LIVE`, or `SUPERSEDED`",
        "pull request and relevant commits",
        "public runtime links when admitted",
        "unresolved blockers or qualification notes without hiding failures",
        "Live admission requires exact-head identity",
        "user-facing completion report",
    ):
        assert required in text


def test_ledger_records_whole_active_build_without_overclaiming():
    text = LEDGER.read_text(encoding="utf-8")
    for required in (
        "## Current governed progress snapshot",
        "R216 surface binding integrity",
        "R214 spatial Earth restoration",
        "R215 navigation integrity",
        "R214 Earth + Hybrid local execution authority",
        "R214 navigation polish",
        "`CANDIDATE`",
        "`HELD`",
        "`ADMITTED/LIVE`",
    ):
        assert required in text


def test_r216_ledger_records_no_disconnected_active_surface_invariant_and_race_evidence():
    text = LEDGER.read_text(encoding="utf-8")
    start = text.index("## R216 — Fail-closed live surface binding integrity")
    end = text.index("\n---\n\n## R214 — Source-backed", start)
    r216 = text[start:end]
    for required in (
        "**Status:** `CANDIDATE`",
        "No deceptive or disconnected active surface",
        "/api/system/r211/status",
        "/api/system/r205/health",
        "CONTROLS WITHHELD",
        "runtimeEntryR169.ts",
        "test_r216_surface_binding_integrity.py",
        "5e698131-ed44-44b2-ba2f-479c0f2dd308",
        "15e9d321-924d-45a5-b2bb-bd5ea68c4f30",
        "specific writer is not assigned without evidence",
        "172-node federation proof",
    ):
        assert required in r216
    assert "**Status:** `ADMITTED/LIVE`" not in r216


def test_ledger_keeps_earth_and_hybrid_truth_boundaries_visible():
    text = LEDGER.read_text(encoding="utf-8")
    assert "https://github.com/medicinalElJefe/canonforge-omega/pull/235" in text
    assert "https://github.com/medicinalElJefe/canonforge-omega/pull/236" in text
    assert "source is canonical" in text
    assert "No part of this held candidate is reported as live" in text
