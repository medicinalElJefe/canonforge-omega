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
R192 = SRC / "acceptance" / "cumulativeCapabilityR192.ts"
ROUTER = SYSTEM / "driveCorpusSystemR192.ts"
SNAPSHOT = SYSTEM / "driveCorpusSnapshotR192.ts"
EXPECTED_SHA256 = "d80267761320c3bf3d219b38b6293fc52a02e09182fa0825853c7202131f2746"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def load_snapshot() -> tuple[bytes, dict]:
    encoded = ""
    for index in range(5):
        source = text(SYSTEM / f"r192SnapshotChunk{index}.ts")
        match = re.fullmatch(r'export default "([A-Za-z0-9+/=]+)";\n?', source)
        assert match, f"R192 snapshot chunk {index} is not a single immutable base64 export"
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


def test_r192_snapshot_is_lossless_hash_verified_and_contains_the_recovered_one_system_contract():
    raw, snapshot = load_snapshot()
    assert len(raw) > 100_000
    registry = find_table(snapshot, "registry", "softwareRegistry", "software_registry")
    menus = find_table(snapshot, "menus", "menuOptions", "menu_options")
    capabilities = find_table(snapshot, "capabilities", "capabilityRows", "capability_rows")
    wiring = find_table(snapshot, "runtimeWiring", "runtime_wiring", "wiring")
    gates = find_table(snapshot, "acceptanceGates", "acceptance_gates", "gates")
    addresses = find_table(snapshot, "capacityAddressIndex", "capacity_address_index", "addressIndex")
    implementation = find_table(snapshot, "implementationSequence", "implementation_sequence", "implementation")
    assert len(registry) == 100
    assert len(menus) >= 36
    assert len(capabilities) >= 18
    assert len(wiring) >= 16
    assert len(gates) >= 12
    assert len(addresses) >= 144
    assert len(implementation) >= 16


def test_r192_registry_preserves_recovered_keep_merge_donor_disposition_instead_of_flattening_donors_into_authority():
    _, snapshot = load_snapshot()
    registry = find_table(snapshot, "registry", "softwareRegistry", "software_registry")
    counts: dict[str, int] = {}
    for row in registry:
        disposition = str(row_value(row, "Disposition") or "").strip().upper()
        counts[disposition] = counts.get(disposition, 0) + 1
    assert counts.get("KEEP") == 63, counts
    assert counts.get("MERGE") == 26, counts
    assert counts.get("DONOR") == 11, counts
    assert sum(counts.values()) == 100


def test_r192_router_applies_calculus_to_evidence_rows_and_never_invents_missing_thresholds():
    router = text(ROUTER)
    assert 'MODE188_FORMULA_R192 = "S188=CΩ/(Λ+q+0.35Λq+0.05)"' in router
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


def test_r192_exposes_one_system_cockpit_corpus_status_and_real_specialist_execution_routes():
    router = text(ROUTER)
    for marker in (
        '"/system"',
        '"/api/system/r192/manifest"',
        '"/api/system/r192/status"',
        '"/api/system/r192/execute"',
        '"/api/system/r192/analyze"',
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


def test_r192_dispatcher_is_additive_and_preserves_all_inherited_authorities():
    entry = text(ENTRY)
    assert 'handleDriveCorpusSystemR192' in entry
    assert 'handleCumulativeCapabilityR192' in entry
    assert 'handleUniversalSurfaceFabricR191' in entry
    assert 'handleWholeInstrumentR189' in entry
    assert 'handleWholeSystemAcceptanceR190' in entry
    assert 'handleSaiAiFusionR179' in entry
    assert 'handleComputeRequest' in entry
    assert 'handleValidationRequest' in entry
    assert 'handleFederatedOrganRequest' in entry
    assert 'handleSwarmRequest' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry


def test_r192_extends_63_group_r191_canon_to_exactly_64_without_rewriting_history():
    r191 = text(R191)
    r192 = text(R192)
    assert 'CUMULATIVE_SCHEMA_R191 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R191"' in r191
    assert 'CUMULATIVE_SCHEMA_R192 = "OMEGA_CUMULATIVE_CAPABILITY_CANON_R192"' in r192
    assert 'import { cumulativeCapabilityManifestR191 } from "./cumulativeCapabilityR191"' in r192
    assert 'id: "R192_DRIVE_CORPUS_ONE_SYSTEM"' in r192
    assert 'predecessor.totalCapabilityGroups === 63' in r192
    assert 'predecessor.predecessorCapabilityGroups === 62' in r192
    assert 'predecessor.totalCapabilityGroups + R192_CURRENT_ORGANS.length' in r192
    assert 'canonicalMutation: false' in r192
    assert 'promotionAuthorized: false' in r192


def test_r192_release_identity_is_registered_without_changing_protected_base_build_or_durable_object_namespaces():
    wrangler = text(WRANGLER)
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in wrangler
    assert 'UNIVERSAL_SURFACE_FABRIC_R191_ID = "r191-universal-surface-fabric"' in wrangler
    assert 'DRIVE_CORPUS_ONE_SYSTEM_R192_ID = "r192-drive-corpus-one-system"' in wrangler
    assert f'DRIVE_CORPUS_SHA256_R192 = "{EXPECTED_SHA256}"' in wrangler
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


def test_r192_decoder_verifies_the_uncompressed_corpus_before_json_admission():
    decoder = text(SNAPSHOT)
    assert "crypto.subtle.digest" in decoder
    assert "R192_DRIVE_CORPUS_HASH_MISMATCH" in decoder
    assert "DecompressionStream(\"gzip\")" in decoder
    assert EXPECTED_SHA256 in decoder
