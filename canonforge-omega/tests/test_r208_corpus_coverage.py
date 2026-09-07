import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
COVERAGE = SRC / "system" / "corpusCoverageR208.ts"
NAV = SRC / "universalNavigationR192.ts"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r208_covers_exactly_the_24_charted_software_families():
    text = read(COVERAGE)
    ids = re.findall(r'\{ id: "(S\d\d)"', text)
    assert ids == [f"S{i:02d}" for i in range(24)]
    roles = (
        "SOVEREIGN_TRAVERSAL_OS", "STATE_TO_FIELD_COMPILER", "ONE_PACKET_TYPE",
        "BRIDGE_VERIFY_RETURN", "CANON_RECURSION_ENGINE", "VERIFIED_GEOMETRIC_CIVILIZATION_LOGIC",
        "ATLAS_STATE_COMPILER", "LOCAL_1_PLUS_6_SHELL_RUNTIME", "CONTINUITY_VISUALIZATION",
        "WGS84_GIS_LIDAR_GATE", "BIO_SCALE_TRAVERSAL", "DELTA_REPAIR_RUNTIME",
        "COMPRESSED_SOVEREIGN_SEED", "PERSISTENT_COHERENCE_FIELD", "STAY_TURN_ESCALATE_OPERATOR",
        "TRUTH_AUDIT_SPINE", "SPREADSHEET_CONTROL_PLANE", "PHASE_COHERENT_AUDIO_FIELD",
        "SEMANTIC_PACKET_LANGUAGE", "MOVING_RELATIVE_ORIGIN", "ARTIFACT_TRIAGE_GOVERNANCE",
        "IMAGE_SNAPSHOT_OF_SUBSTRATE", "DESKTOP_STARTUP_PACKAGER", "LIVE_STATE_TRANSPORT",
    )
    for role in roles:
        assert f'role: "{role}"' in text


def test_r208_mapped_source_paths_exist_in_the_canonical_tree():
    text = read(COVERAGE)
    paths = sorted(set(re.findall(r'"((?:cloudflare|scripts|tests)/[^"\n]+)"', text)))
    assert len(paths) >= 40
    missing = [path for path in paths if not (ROOT / path).exists()]
    assert missing == []
    assert "tests/test_r207_windows_verified_venv_launch.py" in paths


def test_r208_keeps_unimplemented_audio_as_archive_residual_not_fake_integration():
    text = read(COVERAGE)
    line = next(line for line in text.splitlines() if 'id: "S17"' in line)
    assert 'integration: "ARCHIVE_RESIDUAL"' in line
    assert "sourcePaths: []" in line
    assert "liveProbe: null" in line
    assert "rather than fabricate integration" in line


def test_r208_preserves_hybrid_and_physical_pc_truth_boundaries():
    text = read(COVERAGE)
    s03 = next(line for line in text.splitlines() if 'id: "S03"' in line)
    s22 = next(line for line in text.splitlines() if 'id: "S22"' in line)
    assert "hostDependent: true" in s03
    assert "PC ONLINE remain withheld without a current authenticated sovereign heartbeat and verified return" in s03
    assert "hostDependent: true" in s22
    assert "Windows CI verifies the transport/install contract; physical-PC installation and heartbeat state require host evidence" in s22
    assert "whole=await probe('/api/system/r205/health')" in text
    assert "pcOnline=whole?.body?.hybrid?.pcOnline===true" in text
    assert "authenticated heartbeat ≠ hardware attestation" in text
    assert "verified return ≠ CanonState" in text


def test_r208_preserves_earth_measurement_truth_and_atlas_semantics():
    text = read(COVERAGE)
    s09 = next(line for line in text.splitlines() if 'id: "S09"' in line)
    assert "earthSarTruthFusionR198.ts" in s09
    assert "catalog metadata is not promoted to InSAR displacement or fabricated geometry" in s09
    assert "rendering ≠ measurement" in text
    assert "12→144→1728→20,736→248,832 remain atlas/address resolution levels, not literal physical dimensions" in text


def test_r208_is_a_system_surface_enhancer_not_a_second_runtime_authority():
    coverage = read(COVERAGE)
    nav = read(NAV)
    assert 'pathname !== "/system" && pathname !== "/system/"' in coverage
    assert 'headers.set("x-omega-corpus-coverage", CORPUS_COVERAGE_RELEASE_R208)' in coverage
    assert 'id="omegaCorpusCoverageR208Data"' in coverage
    assert 'import { enhanceCorpusCoverageR208 } from "./system/corpusCoverageR208"' in nav
    assert 'href="/system">CORPUS COVERAGE' in nav
    assert "enhanceCorpusCoverageR208(navigated, pathname)" in nav
    assert "canonicalMutation" not in coverage
    assert "promotionAuthorized" not in coverage


def test_r208_drive_archive_and_genesis_remain_evidence_not_competing_authority():
    text = read(COVERAGE)
    assert "Drive/archive universe remains evidence and design input under one canonical runtime" in text
    assert "Workbook corpus is evidence/control data, not an independent runtime authority" in text
    assert "Genesis remains a separate discovery/evolution authority; this coverage view does not collapse its remote deployment into V6 authority" in text
    assert "donor/archive data requires admission" in text
