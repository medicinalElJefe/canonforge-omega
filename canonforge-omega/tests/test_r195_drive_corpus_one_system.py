from __future__ import annotations

import base64
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
SYSTEM = SRC / "system"
ENTRY = SRC / "runtimeEntryR169.ts"
WRANGLER = WORKER / "wrangler.toml"
ROUTER = SYSTEM / "driveCorpusSystemR195.ts"
SNAPSHOT = SYSTEM / "driveCorpusSnapshotR195.ts"
R195 = SRC / "acceptance" / "cumulativeCapabilityR195.ts"
R193 = SRC / "workspaceManifestR193.ts"
R194 = SRC / "evidencePlaneR194.ts"
DEWEY = SRC / "compute" / "deweyWaterContinuityR195.ts"
DEWEY_SURFACE = SRC / "deweyComputeSurfaceR195.ts"
NAV195 = SYSTEM / "oneSystemNavigationR195.ts"
EXPECTED = "8b66519d36387f3a9ca3f9a10a7dd5da0b806c4fc7b29d9a4353e94e9859e655"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def nk(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def snapshot():
    encoded = ""
    for index in range(5):
        source = text(SYSTEM / f"r195SnapshotChunk{index}.ts")
        match = re.fullmatch(r'export default "([A-Za-z0-9+/=]+)";\n?', source)
        assert match, f"invalid immutable R195 chunk {index}"
        encoded += match.group(1)
    raw = gzip.decompress(base64.b64decode(encoded, validate=True))
    assert hashlib.sha256(raw).hexdigest() == EXPECTED
    return raw, json.loads(raw)


def table(data: dict, *aliases: str):
    wanted = {nk(alias) for alias in aliases}
    for key, value in data.items():
        if nk(str(key)) in wanted and isinstance(value, list):
            return value
    raise AssertionError(f"missing {aliases}; keys={list(data)}")


def value(row: dict, *aliases: str):
    wanted = {nk(alias) for alias in aliases}
    for key, cell in row.items():
        if nk(str(key)) in wanted:
            return cell
    return None


def test_r195_snapshot_is_lossless_and_matches_drive_contract():
    raw, data = snapshot()
    assert len(raw) > 100_000
    assert len(table(data, "registry", "softwareRegistry", "software")) == 100
    assert len(table(data, "menus", "menuOptions", "menu")) >= 36
    assert len(table(data, "capabilities", "capabilityRows", "capability")) >= 18
    assert len(table(data, "runtimeWiring", "wiring", "runtime")) >= 16
    assert len(table(data, "acceptanceGates", "gates", "proofGates")) >= 12
    assert len(table(data, "capacityAddressIndex", "addressIndex", "capacity")) >= 144
    assert len(table(data, "implementationSequence", "implementation", "milestones")) >= 16


def test_r195_registry_preserves_exact_keep_merge_donor_admission_classes():
    _, data = snapshot()
    counts = {}
    for row in table(data, "registry", "softwareRegistry", "software"):
        key = str(value(row, "Disposition") or "").strip().upper()
        counts[key] = counts.get(key, 0) + 1
    assert counts == {"KEEP": 63, "MERGE": 26, "DONOR": 11}


def test_r195_digest_is_measured_payload_not_stale_expected_value_and_has_drive_provenance():
    decoder = text(SNAPSHOT)
    assert f'DRIVE_CORPUS_SNAPSHOT_SHA256_R195 = "{EXPECTED}"' in decoder
    assert "d80267761320c3bf3d219b38b6293fc52a02e09182fa0825853c7202131f2746" not in decoder
    assert 'primaryLedgerId: "1tvDDlPxHFTXMPN43-rE1kPKdmJW5uYj6"' in decoder
    assert 'corroboratingLedgerId: "12w_vkhiXU1RUx5YU4C4M232fyvoqx_XN"' in decoder
    assert "crypto.subtle.digest" in decoder
    assert "R195_DRIVE_CORPUS_HASH_MISMATCH" in decoder
    assert 'DecompressionStream("gzip")' in decoder


def test_r195_applies_mode188_only_when_source_metrics_exist():
    router = text(ROUTER)
    assert 'MODE188_FORMULA_R195 = "S188=CΩ/(Λ+q+0.35Λq+0.05)"' in router
    assert "continuity / denominator" in router
    assert "SOURCE_METRICS_INCOMPLETE" in router
    assert "No STAY/TURN/ESCALATE threshold is invented" in router
    assert "[37, 73]" in router
    assert "not literal physical dimensions" in router


def test_r195_execution_truth_separates_returned_from_verified():
    router = text(ROUTER)
    for marker in (
        '"DISCOVERED"',
        '"AUTHORIZED"',
        '"AVAILABLE"',
        '"INVOKED"',
        '"RETURNED"',
        '"VERIFIED"',
        '"VERIFICATION_PENDING_OR_FAILED"',
        'class: "INVARIANT_CONSERVATION"',
        'class: "SOURCE_GROUNDED_RECEIPT"',
        'class: "RETURNED_NOT_YET_INDEPENDENTLY_VERIFIED"',
        "returnedIsNotVerified: true",
    ):
        assert marker in router
    assert "residual <= 1e-12" in router
    assert "result?.grounded === true && Boolean(result?.receipt_sha256)" in router


def test_r195_routes_existing_specialist_organs_instead_of_reimplementing_them():
    router = text(ROUTER)
    for marker in (
        '"/api/compute/relativity/event"',
        '"/api/compute/relativity/velocity"',
        '"/api/compute/optics/tmm"',
        '"/api/compute/continuity/transfer"',
        '"/api/compute/continuity/diffusion"',
        '"/api/compute/wave/fdtd1d"',
        '"/api/sai/query"',
        '"/api/intelligence/r179/cloud"',
        '"/api/intelligence/r179/fuse"',
        'OMEGA_ONE_SYSTEM_EXECUTION_RECEIPT_R195',
        'R195 routes to existing specialist authority; it does not replace it',
    ):
        assert marker in router
    assert "canonicalMutation: true" not in router


def test_r195_preserves_r192_r193_r194_wrapper_chain_and_adds_both_r195_surfaces():
    entry = text(ENTRY)
    assert "const r192 = await enhanceUniversalNavigationR192(response, new URL(request.url).pathname)" in entry
    assert "const r193 = await enhanceUniversalWorkspaceR193(r192, new URL(request.url).pathname)" in entry
    assert "const r194 = await enhanceEvidencePlaneR194(r193, new URL(request.url).pathname)" in entry
    assert "const dewey = await enhanceDeweyComputeSurfaceR195(r194, new URL(request.url).pathname)" in entry
    assert "return enhanceOneSystemNavigationR195(dewey, new URL(request.url).pathname)" in entry
    assert "handleEvidencePlaneR194(request, env, ctx, runtimeFetch)" in entry
    assert "handleDriveCorpusSystemR195(request, env, ctx, runtimeFetch)" in entry
    assert "handleRestorationPlannerR195(request, env, ctx, runtimeFetch)" in entry
    assert "handleDeweyWaterContinuityR195(request)" in entry
    assert entry.index("handleDeweyWaterContinuityR195(request)") < entry.index('url.pathname.startsWith("/api/compute/")')
    assert "return canonical.fetch(request, env, ctx)" in entry
    assert 'release: "r193-full-restoration-workspace"' in text(R193)
    assert 'EVIDENCE_PLANE_RELEASE_R194 = "r194-dual-plane-evidence-restoration"' in text(R194)
    assert 'DEWEY_WATER_CONTINUITY_RELEASE_R195 = "r195-dewey-water-continuity-compute"' in text(DEWEY)
    assert 'DEWEY_COMPUTE_SURFACE_RELEASE_R195 = "r195-dewey-compute-surface"' in text(DEWEY_SURFACE)
    assert 'ONE_SYSTEM_NAVIGATION_RELEASE_R195 = "r195-drive-corpus-one-system"' in text(NAV195)


def test_r195_cumulative_truth_counts_three_distinct_post_r191_operational_organs():
    cumulative = text(R195)
    assert 'CUMULATIVE_SCHEMA_R195 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R195"' in cumulative
    assert 'id: "R194_DUAL_PLANE_EVIDENCE_RESTORATION"' in cumulative
    assert 'id: "R195_DRIVE_CORPUS_ONE_SYSTEM"' in cumulative
    assert 'id: "R195_DEWEY_WATER_CONTINUITY_COMPUTE"' in cumulative
    assert "predecessor.totalCapabilityGroups + POST_R191_OPERATIONAL_ORGANS_R195.length" in cumulative
    assert "POST_R191_OPERATIONAL_ORGANS_R195.length === 3" in cumulative
    assert 'executionTruth: "DISCOVERED_TO_AUTHORIZED_TO_AVAILABLE_TO_INVOKED_TO_RETURNED_TO_VERIFIED_WITH_FAILURE_STATES_VISIBLE"' in cumulative
    assert "canonicalMutation: false" in cumulative
    assert "promotionAuthorized: false" in cumulative


def test_r195_release_identity_is_additive_and_preserves_existing_runtime_namespaces():
    wrangler = text(WRANGLER)
    for marker in (
        'BUILD_ID = "r87-semantic-edge-settle-proof"',
        'UNIVERSAL_SURFACE_FABRIC_R191_ID = "r191-universal-surface-fabric"',
        'UNIVERSAL_NAVIGATION_R192_ID = "r192-navigation-home-repair"',
        'UNIVERSAL_WORKSPACE_R193_ID = "r193-full-restoration-workspace"',
        'EVIDENCE_PLANE_R194_ID = "r194-dual-plane-evidence-restoration"',
        'DRIVE_CORPUS_ONE_SYSTEM_R195_ID = "r195-drive-corpus-one-system"',
        'DEWEY_WATER_CONTINUITY_R195_ID = "r195-dewey-water-continuity-compute"',
        f'DRIVE_CORPUS_SHA256_R195 = "{EXPECTED}"',
    ):
        assert marker in wrangler
    for binding in (
        'name = "OMEGA_RUNTIME"',
        'name = "OMEGA_SWARM_CELL"',
        'name = "OMEGA_SWARM_COORDINATOR"',
        'name = "OMEGA_SWARM_BRANCH"',
        'name = "OMEGA_SWARM_ORGAN"',
        'name = "OMEGA_SWARM_ORGANISM"',
        'name = "OMEGA_SWARM_AUTONOMIC"',
        'binding = "GENESIS"',
        'binding = "OMEGA_GENESIS_MACHINE"',
        'binding = "OMEGA_OPTICAL_MACHINE"',
    ):
        assert binding in wrangler
