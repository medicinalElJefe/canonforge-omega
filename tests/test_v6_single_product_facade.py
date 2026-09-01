from pathlib import Path
import subprocess

from omega_genesis.capabilities import CAPABILITIES

ROOT = Path(__file__).resolve().parents[1]
LEGACY_V6 = ROOT / "cloudflare" / "omegav6-worker"
CONVERGENCE = ROOT / "cloudflare" / "omega-genesis-worker" / "src" / "convergence.js"


def test_historical_v6_compatibility_worker_still_parses():
    result = subprocess.run(["node", "--check", str(LEGACY_V6 / "src" / "index.js")], cwd=ROOT, text=True, capture_output=True, check=False)
    assert result.returncode == 0, result.stderr or result.stdout


def test_genesis_manifest_does_not_claim_v6_operational_release_authority():
    source = CONVERGENCE.read_text(encoding="utf-8")
    assert 'role:"GENESIS_DISCOVERY_EVOLUTION_AUTHORITY"' in source
    assert 'role:"V6_CANONICAL_OPERATIONAL_RUNTIME"' in source
    assert 'release_authority:"omega-v6-full-convergence"' in source
    assert 'genesis_may_deploy_v6:false' in source
    assert "Genesis owns the only forward canonical state" not in source
    assert "V6 holds no second canonical state" not in source


def test_historical_omega_runtime_class_is_preserved_without_storage_mutation():
    source = (LEGACY_V6 / "src" / "index.js").read_text(encoding="utf-8")
    assert "export class OmegaRuntime" in source
    assert "PRESERVE_NO_MUTATION" in source
    assert "state.storage" in source
    assert "state.storage.put" not in source
    assert "state.storage.delete" not in source
    assert "state.storage.deleteAll" not in source


def test_genesis_self_builder_cannot_deploy_v6():
    workflow = (ROOT / ".github" / "workflows" / "self-build.yml").read_text(encoding="utf-8")
    assert "v6-edge-deploy:" not in workflow
    assert "Deploy exact final promotion to stable OMEGA V6 product" not in workflow


def test_role_separated_convergence_capabilities_are_live_core():
    rows = {row["id"]: row for row in CAPABILITIES}
    assert rows["CAP-030"]["status"] == "LIVE_CORE"
    assert "convergence transport" in rows["CAP-030"]["name"].lower()
    assert "operational authority separation" in rows["CAP-030"]["gate"]
    assert rows["CAP-031"]["status"] == "LIVE_CORE"
    assert "OmegaRuntime" in rows["CAP-031"]["name"]
    assert "without granting Genesis V6 release authority" in rows["CAP-031"]["gate"]
    assert rows["CAP-032"]["status"] == "LIVE_CORE"
