from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
SYSTEM = SRC / "system"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r195_residual_planner_covers_all_twelve_master_menu_cohorts():
    planner = read(SYSTEM / "restorationPlannerR195.ts")
    for menu in (
        "01 Runtime Core",
        "02 Proof & Governance",
        "03 Traversal",
        "04 Render Field",
        "05 Host Inputs",
        "06 AI Orchestration",
        "07 Data / Excel Atlas",
        "08 Audio / Signal",
        "09 World / Bio / Forecast",
        "10 Recovery / Packaging",
        "11 Archive Merge",
        "12 Operator Cockpit",
    ):
        assert f'menuId: "{menu}"' in planner


def test_r195_planner_never_promotes_cohort_reachability_into_artifact_admission():
    planner = read(SYSTEM / "restorationPlannerR195.ts")
    for marker in (
        'state = "DONOR_NOT_ADMITTED"',
        'state = "MERGE_PENDING_ADMISSION"',
        'state = "KEEP_WITHOUT_MAPPED_PROOF_COHORT"',
        'state = "KEEP_COHORT_ROUTE_DEGRADED"',
        'state = "KEEP_COHORT_ROUTE_VERIFIED_ARTIFACT_RECEIPT_REQUIRED"',
        "const individuallyVerifiedArtifacts = 0;",
        "const unresolved = artifacts.length - individuallyVerifiedArtifacts;",
        "Cohort route proof is not artifact-level restoration proof",
        "menuReachabilityIsNotArtifactProof: true",
        "donorNeverBecomesAuthorityWithoutAdmission: true",
    ):
        assert marker in planner


def test_r195_planner_encodes_source_bind_execute_weakest_link_replay_rollback_admission_sequence():
    planner = read(SYSTEM / "restorationPlannerR195.ts")
    for marker in (
        '"SOURCE_BIND"',
        '"INSPECT"',
        '"CONTRACT"',
        '"EXECUTE"',
        '"ALL_MODES_WHERE_APPLICABLE"',
        '"WEAKEST_LINK"',
        '"REPLAY"',
        '"ROLLBACK"',
        '"ADMIT"',
    ):
        assert marker in planner
    assert '"DONOR_QUARANTINED"' in planner
    assert '"INSTALL_LAUNCH_HEALTH_VERIFIED"' in planner
    assert '"STATE_BOUND_RENDER_VERIFIED"' in planner
    assert '"CURRENT_EXTERNAL_OBSERVATION_OR_DEVICE_EVIDENCE"' in planner


def test_r195_planner_route_is_bounded_and_filterable():
    route = read(SYSTEM / "restorationRouteR195.ts")
    assert 'url.pathname !== "/api/system/r195/restoration"' in route
    assert 'state = (url.searchParams.get("state") || "").trim()' in route
    assert 'disposition = (url.searchParams.get("disposition") || "").trim().toUpperCase()' in route
    assert "Math.min(100" in route
    assert "handleRestorationPlannerR195" in read(SRC / "runtimeEntryR169.ts")


def test_r195_system_surface_displays_weakest_link_queue_not_only_recovered_count():
    nav = read(SYSTEM / "oneSystemNavigationR195.ts")
    for marker in (
        "RESIDUAL RESTORATION / WEAKEST-LINK QUEUE",
        "Individually verified",
        "Unresolved",
        "Cohorts ready",
        "/api/system/r195/restoration?limit=24",
        "requiredEvidence",
        "r195ResidualState",
    ):
        assert marker in nav
