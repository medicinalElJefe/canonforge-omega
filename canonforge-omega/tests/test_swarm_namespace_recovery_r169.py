from pathlib import Path
import json
import re

from scripts.check_cloudflare_contract import evaluate


ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
SRC = WORKER / "src"
WRANGLER = WORKER / "wrangler.toml"
CONTRACT = ROOT / "config" / "cloudflare_live_contract.json"
ENTRY = SRC / "runtimeEntryR169.ts"
ROUTER = SRC / "swarm" / "swarmRouterR169.ts"
CELL = SRC / "swarm" / "swarmCellR169.ts"
AUTONOMIC = SRC / "swarm" / "swarmAutonomicR169.ts"

EXPECTED = {
    "OmegaRuntime": "OMEGA_RUNTIME",
    "OmegaSwarmCell": "OMEGA_SWARM_CELL",
    "OmegaSwarmCoordinator": "OMEGA_SWARM_COORDINATOR",
    "OmegaSwarmBranch": "OMEGA_SWARM_BRANCH",
    "OmegaSwarmOrgan": "OMEGA_SWARM_ORGAN",
    "OmegaSwarmOrganismCoordinator": "OMEGA_SWARM_ORGANISM",
    "OmegaSwarmAutonomicCoordinator": "OMEGA_SWARM_AUTONOMIC",
}


def test_r169_preserves_every_observed_live_namespace_without_replay_or_tombstone():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    for class_name, binding in EXPECTED.items():
        assert f'name = "{binding}"' in wrangler
        assert f'class_name = "{class_name}"' in wrangler
        assert f'[exports.{class_name}]' in wrangler
    assert wrangler.count('storage = "sqlite"') >= len(EXPECTED)
    assert '[[migrations]]' not in wrangler
    assert re.search(r"(?m)^\s*new_sqlite_classes\s*=", wrangler) is None
    assert 'state = "deleted"' not in wrangler


def test_r169_additive_entrypoint_keeps_canonical_runtime_and_exports_swarm_classes():
    entry = ENTRY.read_text(encoding="utf-8")
    assert 'import canonicalRuntime from "./heartbeatTruth"' in entry
    assert 'export { OmegaRuntime } from "./heartbeatTruth"' in entry
    for class_name in EXPECTED:
        if class_name != "OmegaRuntime":
            assert class_name in entry
    assert 'pathname.startsWith("/api/swarm/")' in entry
    assert 'return canonical.fetch(request, env, ctx)' in entry


def test_r169_public_swarm_surface_preserves_hierarchy_and_authority_boundary():
    source = "\n".join(p.read_text(encoding="utf-8") for p in (ROUTER, CELL, AUTONOMIC))
    for marker in (
        "/api/swarm/manifest",
        "/api/swarm/autonomic",
        "/api/swarm/organism",
        "OMEGA_SWARM_CELL_STATE_R121",
        "OMEGA_AUTONOMIC_MISSION_R125",
        "OMEGA_EXECUTION_QUORUM_R125",
        "OMEGA_SELF_BUILD_CAPSULE_R125",
        "AUTONOMIC_RESULT_FABRIC_NOT_CANON",
        "EXECUTION_QUORUM_NOT_TRUTH",
    ):
        assert marker in source
    assert "canonicalMutation: false" in source
    assert "1728" in source or "SWARM_CELL_COUNT" in source
    assert "20736" in source or "SWARM_LANE_COUNT" in source


def test_r169_contract_is_satisfied_by_exact_candidate():
    result = evaluate(CONTRACT, SRC, WRANGLER)
    assert result["status"] == "PASS", json.dumps(result, indent=2)
    assert result["compatible"] is True
    assert result["missing_exports"] == []
    assert result["missing_behavior_markers"] == []
    assert result["binding_preserved"] is True
    assert result["lifecycle_preserved"] is True
    assert result["no_legacy_replay"] is True
    assert result["no_required_tombstones"] is True
    assert set(result["class_checks"]) == set(EXPECTED)


def test_r169_contract_holds_if_a_historical_binding_is_removed(tmp_path: Path):
    wrangler = WRANGLER.read_text(encoding="utf-8").replace('name = "OMEGA_SWARM_CELL"', 'name = "OMEGA_SWARM_CELL_MISSING"', 1)
    candidate = tmp_path / "wrangler.toml"
    candidate.write_text(wrangler, encoding="utf-8")
    result = evaluate(CONTRACT, SRC, candidate)
    assert result["status"] == "HOLD"
    assert result["class_checks"]["OmegaSwarmCell"]["binding_preserved"] is False


def test_r169_contract_holds_if_required_namespace_is_tombstoned(tmp_path: Path):
    wrangler = WRANGLER.read_text(encoding="utf-8").replace(
        '[exports.OmegaSwarmAutonomicCoordinator]\ntype = "durable-object"\nstorage = "sqlite"',
        '[exports.OmegaSwarmAutonomicCoordinator]\ntype = "durable-object"\nstorage = "sqlite"\nstate = "deleted"',
    )
    candidate = tmp_path / "wrangler.toml"
    candidate.write_text(wrangler, encoding="utf-8")
    result = evaluate(CONTRACT, SRC, candidate)
    assert result["status"] == "HOLD"
    assert result["no_required_tombstones"] is False


def test_r169_recovery_uses_public_lineage_and_does_not_alias_genesis_to_machine_authority():
    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    recovery = contract["swarm_recovery"]
    assert recovery["status"] == "PUBLIC_R121_R123_R125_LINEAGE_RECOVERED"
    assert recovery["source_repo"] == "medicinalElJefe/OMEGAv6"
    assert recovery["source_commit"] == "1b587801ce6e8e465a74cf5426fcc88a411bc824"
    cell = CELL.read_text(encoding="utf-8")
    assert "OMEGA_GENESIS_MACHINE" in cell
    assert "OMEGA_OPTICAL_MACHINE" in cell
    assert "GENESIS as OMEGA_GENESIS_MACHINE" not in cell
    assert "Genesis proposal-machine binding unavailable" in cell
