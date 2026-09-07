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
R191 = SRC / "acceptance" / "cumulativeCapabilityR191.ts"
R193 = SRC / "acceptance" / "cumulativeCapabilityR193.ts"
R192_NAV = SRC / "universalNavigationR192.ts"
R193_NAV = SYSTEM / "systemNavigationR193.ts"
ROUTER = SYSTEM / "driveCorpusSystemR193.ts"
SNAPSHOT = SYSTEM / "driveCorpusSnapshotR193.ts"
EXPECTED_SHA256 = "d80267761320c3bf3d219b38b6293fc52a02e09182fa0825853c7202131f2746"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def load_snapshot() -> tuple[bytes, dict]:
    encoded = ""
    for index in range(5):
        source = text(SYSTEM / f"r193SnapshotChunk{index}.ts")
        match = re.fullmatch(r'export default "([A-Za-z0-9+/=]+)";\n?', source)
        assert match, f"R193 snapshot chunk {index} must remain one immutable base64 export"
        encoded += match.group(1)
    compressed = base64.b64decode(encoded, validate=True)
    raw = gzip.decompress(compressed)
    assert hashlib.sha256(raw).hexdigest() == EXPECTED_SHA256
    return raw, json.loads(raw)


def find_table(snapshot: dict, *aliases: str) -> list:
    wanted = {normalize_key(alias) for alias in aliases}
    for key, value in snapshot.items():
        if normalize_key(str(key)) in wanted and isinstance(value, list):
            return value
    raise AssertionError(f"missing corpus table aliases={aliases}; keys={list(snapshot)}")


def row_value(row: dict, *aliases: str):
    wanted = {normalize_key(alias) for alias in aliases}
    for key, value in row.items():
        if normalize_key(str(key)) in wanted:
            return value
    return None


def test_r193_snapshot_is_lossless_hash_verified_and_contains_recovered_one_system_contract():
    raw, snapshot = load_snapshot()
    assert len(raw) > 100_000
    registry = find_table(snapshot, "registry", "softwareRegistry", "software_registry", "software")
    menus = find_table(snapshot, "menus", "menuOptions", "menu_options", "menu")
    capabilities = find_table(snapshot, "capabilities", "capabilityRows", "capability_rows", "capability")
    wiring = find_table(snapshot, "runtimeWiring", "runtime_wiring", "wiring", "runtime")
    gates = find_table(snapshot, "acceptanceGates", "acceptance_gates", "gates", "proofGates")
    addresses = find_table(snapshot, "capacityAddressIndex", "capacity_address_index", "addressIndex", "capacity")
    implementation = find_table(snapshot, "implementationSequence", "implementation_sequence", "implementation", "milestones")
    assert len(registry) == 100
    assert len(menus) >= 36
    assert len(capabilities) >= 18
    assert len(wiring) >= 16
    assert len(gates) >= 12
    assert len(addresses) >= 144
    assert len(implementation) >= 16


def test_r193_registry_preserves_keep_merge_donor_disposition_without_flattening_donor_authority():
    _, snapshot = load_snapshot()
    registry = find_table(snapshot, "registry", "softwareRegistry", "software_registry", "software")
    counts: dict[str, int] = {}
    for row in registry:
        disposition = str(row_value(row, "Disposition") or "").strip().upper()
        counts[disposition] = counts.get(disposition, 0) + 1
    assert counts.get("KEEP") == 63, counts
    assert counts.get("MERGE") == 26, counts
    assert counts.get("DONOR") == 11, counts
    assert sum(counts.values()) == 100


def test_r193_applies_calculus_only_to_source_metrics_and_preserves_truth_boundaries():
    router = text(ROUTER)
    assert 'MODE188_FORMULA_R193 = "S188=CΩ/(Λ+q+0.35Λq+0.05)"' in router
    assert "continuity / denominator" in router
    assert "does not invent STAY/TURN/ESCALATE thresholds" in router
    assert "embeddedOrChartedIsNotExecuted: true" in router
    assert "visualStateIsNotExecutionProof: true" in router
    assert "modelOutputIsNotCanonState: true" in router
    assert "reducedOrderOpticalScreeningIsNotRcwaFdtdFemValidation: true" in router
    assert "pcOnlineRequiresCurrentAuthenticatedSovereignHeartbeat: true" in router
    assert "37, 73" in router
    assert "frame-dependent" in router
    assert "not literal physical dimensions" in router


def test_r193_exposes_real_one_system_control_plane_not_static_inventory():
    router = text(ROUTER)
    for marker in (
        '"/system"',
        '"/api/system/r193/manifest"',
        '"/api/system/r193/status"',
        '"/api/system/r193/execute"',
        '"/api/system/r193/analyze"',
        '"/api/compute/relativity/event"',
        '"/api/compute/optics/tmm"',
        '"/api/compute/continuity/transfer"',
        '"/api/compute/wave/fdtd1d"',
        '"/api/sai/query"',
        '"/api/intelligence/r179/cloud"',
        '"/api/intelligence/r179/fuse"',
        "Execute through real specialist route",
        "Recovered Drive corpus",
        "setInterval(loadStatus,30000)",
    ):
        assert marker in router
    assert "SPECIALIST_AUTHORITY" in router
    assert "canonicalMutation: true" not in router


def test_r193_preserves_r192_navigation_and_adds_one_system_access_without_rewriting_r192():
    entry = text(ENTRY)
    nav192 = text(R192_NAV)
    nav193 = text(R193_NAV)
    assert 'UNIVERSAL_NAVIGATION_RELEASE_R192 = "r192-navigation-home-repair"' in nav192
    assert 'SYSTEM_NAVIGATION_RELEASE_R193 = "r193-drive-corpus-one-system"' in nav193
    assert 'href="/system">ONE SYSTEM</a>' in nav193
    assert 'handleDriveCorpusSystemR193' in entry
    assert 'handleCumulativeCapabilityR193' in entry
    assert 'enhanceUniversalNavigationR192' in entry
    assert 'enhanceSystemNavigationR193' in entry
    assert "const navigated = await enhanceUniversalNavigationR192" in entry
    assert "return enhanceSystemNavigationR193(navigated, pathname)" in entry
    for marker in (
        "handleUniversalSurfaceFabricR191",
        "handleWholeInstrumentR189",
        "handleWholeSystemAcceptanceR190",
        "handleSaiAiFusionR179",
        "handleComputeRequest",
        "handleValidationRequest",
        "handleFederatedOrganRequest",
        "handleSwarmRequest",
        "return canonical.fetch(request, env, ctx)",
    ):
        assert marker in entry


def test_r193_extends_r191_63_group_cumulative_canon_to_64_while_recording_r192_projection_predecessor():
    r191 = text(R191)
    r193 = text(R193)
    assert 'CUMULATIVE_SCHEMA_R191 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R191"' in r191
    assert 'CUMULATIVE_SCHEMA_R193 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R193"' in r193
    assert 'import { cumulativeCapabilityManifestR191 } from "./cumulativeCapabilityR191"' in r193
    assert 'UNIVERSAL_NAVIGATION_RELEASE_R192' in r193
    assert 'id: "R193_DRIVE_CORPUS_ONE_SYSTEM"' in r193
    assert 'predecessor.totalCapabilityGroups === 63' in r193
    assert 'predecessor.predecessorCapabilityGroups === 62' in r193
    assert 'predecessor.totalCapabilityGroups + R193_CURRENT_ORGANS.length' in r193
    assert 'canonicalMutation: false' in r193
    assert 'promotionAuthorized: false' in r193


def test_r193_release_identity_preserves_protected_base_and_all_existing_namespaces():
    wrangler = text(WRANGLER)
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'UNIVERSAL_SURFACE_FABRIC_R191_ID = "r191-universal-surface-fabric"' in wrangler
    assert 'UNIVERSAL_NAVIGATION_R192_ID = "r192-navigation-home-repair"' in wrangler
    assert 'DRIVE_CORPUS_ONE_SYSTEM_R193_ID = "r193-drive-corpus-one-system"' in wrangler
    assert f'DRIVE_CORPUS_SHA256_R193 = "{EXPECTED_SHA256}"' in wrangler
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


def test_r193_decoder_verifies_uncompressed_corpus_before_json_admission():
    decoder = text(SNAPSHOT)
    assert "crypto.subtle.digest" in decoder
    assert "R193_DRIVE_CORPUS_HASH_MISMATCH" in decoder
    assert "DecompressionStream(\"gzip\")" in decoder
    assert EXPECTED_SHA256 in decoder
