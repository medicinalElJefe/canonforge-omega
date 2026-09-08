from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "release" / "OMEGA_V6_ADVANCEMENT_LEDGER.md"


def test_advancement_ledger_exists_and_declares_release_contract():
    text = LEDGER.read_text()
    assert "# OMEGA V6 Advancement Ledger" in text
    assert "Canonical release branch: `omega-v6-full-convergence`" in text
    for required in (
        "status: `CANDIDATE`, `HELD`, `ADMITTED/LIVE`, or `SUPERSEDED`",
        "pull request and relevant commits",
        "public runtime links when admitted",
        "unresolved blockers or qualification notes without hiding failures",
        "Live admission requires exact-head identity",
        "user-facing completion report",
        "source/PR, proof run, admitted runtime when applicable",
    ):
        assert required in text


def test_advancement_ledger_records_r214_navigation_with_proof_and_runtime_links():
    text = LEDGER.read_text()
    for required in (
        "## R214 — Governed navigation polish and submenu reachability",
        "`5ab6981bd2a50bce6b9c6b6deeb27b1e54732e38`",
        "https://github.com/medicinalElJefe/canonforge-omega/pull/238",
        "https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34174039597",
        "https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34174039636",
        "https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34174039663",
        "https://omegav6.jeffdeweyeljefe.workers.dev",
        "all 172 R185 federation nodes",
        "rollback path after successful admission evidence",
    ):
        assert required in text


def test_advancement_ledger_records_current_earth_merge_without_false_live_admission():
    text = LEDGER.read_text()
    start = text.index("## R214 — Source-backed spatial Earth restoration and truthful surface repair")
    end = text.index("\n---\n\n## R215", start)
    earth = text[start:end]
    for required in (
        "**Status:** `CANDIDATE` after canonical-source merge",
        "`e15d61d7c2f71c0c60ac22ba248c0b96ae35993b`",
        "https://github.com/medicinalElJefe/canonforge-omega/pull/235",
        "https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34178356206",
        "https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34178356218",
        "USGS earthquake events",
        "NASA GIBS",
        "NASA EONET",
        "NOAA SWPC",
        "source is now canonical",
    ):
        assert required in earth
    assert "**Status:** `ADMITTED/LIVE`" not in earth


def test_advancement_ledger_records_r215_as_candidate_and_requires_new_canonical_reconciliation():
    text = LEDGER.read_text()
    start = text.index("## R215 — Complete navigation integrity and submenu route proof")
    end = text.index("\n---\n\n## R214 — Governed navigation", start)
    r215 = text[start:end]
    for required in (
        "**Status:** `CANDIDATE`",
        "https://github.com/medicinalElJefe/canonforge-omega/pull/239",
        "`e15d61d7c2f71c0c60ac22ba248c0b96ae35993b`",
        "https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34178250422",
        "https://github.com/medicinalElJefe/canonforge-omega/actions/runs/34178250403",
        "tests/test_r195_one_system.py",
        "tests/test_r195_drive_corpus_one_system.py",
        "all 20 declared SYSTEMS destinations",
        "all 8 workspace deep links",
        "must reconcile",
    ):
        assert required in r215
    assert "**Status:** `ADMITTED/LIVE`" not in r215


def test_advancement_ledger_holds_stale_hybrid_authority_candidate_instead_of_overclaiming_it():
    text = LEDGER.read_text()
    start = text.index("## R214 — Earth + Hybrid explicit local execution authority candidate")
    end = text.index("\n---\n\n## Pre-ledger continuity note", start)
    hybrid = text[start:end]
    for required in (
        "**Status:** `HELD`",
        "`5171dfb728e263cfcdabaa6fb16d96df3b140e28`",
        "https://github.com/medicinalElJefe/canonforge-omega/pull/236",
        "explicit local console consent",
        "operation allow-list",
        "OMEGA_RUNTIME",
        "behind the canonical R214 navigation and Earth restoration lineage",
        "first legacy pairing migration",
        "No part of this held candidate is reported as live",
    ):
        assert required in hybrid
    assert "**Status:** `ADMITTED/LIVE`" not in hybrid


def test_ledger_has_whole_active_build_progress_snapshot():
    text = LEDGER.read_text()
    for required in (
        "## Current governed progress snapshot",
        "R214 navigation polish",
        "R214 spatial Earth restoration",
        "R215 navigation integrity",
        "R214 Earth + Hybrid local execution authority",
        "merged to canonical source",
        "must reconcile/reprove",
    ):
        assert required in text


def test_ledger_requires_user_facing_completion_reporting():
    text = LEDGER.read_text()
    assert "user-facing completion report" in text
    assert "release completion is incomplete until this ledger" in text
