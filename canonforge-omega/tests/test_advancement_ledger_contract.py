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
    ):
        assert required in text


def test_advancement_ledger_records_r214_with_proof_and_runtime_links():
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


def test_advancement_ledger_records_r215_as_candidate_without_false_admission():
    text = LEDGER.read_text()
    start = text.index("## R215 — Complete navigation integrity and submenu route proof")
    end = text.index("\n---\n\n## R214", start)
    r215 = text[start:end]
    for required in (
        "**Status:** `CANDIDATE`",
        "https://github.com/medicinalElJefe/canonforge-omega/pull/239",
        "tests/test_r195_one_system.py",
        "tests/test_r195_drive_corpus_one_system.py",
        "all 20 declared SYSTEMS destinations",
        "all 8 workspace deep links",
    ):
        assert required in r215
    assert "**Status:** `ADMITTED/LIVE`" not in r215


def test_ledger_requires_user_facing_completion_reporting():
    text = LEDGER.read_text()
    assert "user-facing completion report" in text
    assert "release completion is incomplete until this ledger" in text
