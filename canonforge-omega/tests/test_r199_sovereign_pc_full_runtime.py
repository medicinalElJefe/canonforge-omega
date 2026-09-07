from __future__ import annotations

import ast
import importlib.util
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
CANONICAL_ENTRY = WORKER / "src" / "runtimeEntryR169.ts"
R199_ENTRY = WORKER / "src" / "runtimeEntryR199.ts"
GATEWAY = WORKER / "src" / "sovereignPcGatewayR199.ts"
RUNTIME_DO = WORKER / "src" / "sovereignPcRuntimeR199.ts"
SURFACE = WORKER / "src" / "sovereignPcSurfaceR199.ts"
AGENT_TS = WORKER / "src" / "sovereignAgentR199.ts"
WRANGLER = WORKER / "wrangler.toml"
BRIDGE_AGENT = ROOT / "scripts" / "omega_hybrid_agent_r199.py"
TOKEN_AGENT = ROOT / "scripts" / "omega_sovereign_agent.py"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def load_bridge_agent():
    spec = importlib.util.spec_from_file_location("omega_hybrid_agent_r199_test", BRIDGE_AGENT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_python_agents_are_syntactically_valid_and_explicitly_r199():
    for path in (BRIDGE_AGENT, TOKEN_AGENT):
        source = text(path)
        ast.parse(source, filename=str(path))
        assert "R199" in source
        assert "shell=True" not in source
        assert "pip install" not in source.lower()
        assert "npm install" not in source.lower()
        assert "winget install" not in source.lower()
        assert "choco install" not in source.lower()
        assert "reg add " not in source.lower()
        assert "set-service" not in source.lower()
        assert "powercfg" not in source.lower()


def test_wrangler_preserves_canonical_identity_while_activating_r199_capability():
    source = text(WRANGLER)
    assert 'main = "src/runtimeEntryR169.ts"' in source
    assert 'BUILD_ID = "r87-semantic-edge-settle-proof"' in source
    assert 'SOVEREIGN_PC_R199_ID = "r199-project-aware-verified-return-runtime"' in source
    assert 'type = "Text"' in source and 'globs = ["**/*.py"]' in source
    for binding in (
        "OMEGA_RUNTIME",
        "OMEGA_SWARM_CELL",
        "OMEGA_SWARM_COORDINATOR",
        "OMEGA_SWARM_BRANCH",
        "OMEGA_SWARM_ORGAN",
        "OMEGA_SWARM_ORGANISM",
        "OMEGA_SWARM_AUTONOMIC",
    ):
        assert f'name = "{binding}"' in source


def test_canonical_entry_integrates_r199_without_replacing_existing_route_stack():
    source = text(CANONICAL_ENTRY)
    assert 'handleSovereignPcGatewayR199' in source
    assert 'enhanceSovereignPcSurfaceR199' in source
    assert 'export { OmegaRuntime } from "./sovereignPcRuntimeR199"' in source
    # Inherited route stack remains present.
    for inherited in ("handleEarthSarFusionR198", "handleSourceGroundingR197", "handleCloudSwarmR185", "handleComputeRequest"):
        assert inherited in source
    assert "const sovereignPc = await handleSovereignPcGatewayR199(request, env);" in source
    assert "if (sovereignPc) return sovereignPc;" in source


def test_r199_standalone_entry_remains_a_valid_wrapper_reference():
    source = text(R199_ENTRY)
    assert 'from "./runtimeEntryR169"' in source
    assert 'export { OmegaRuntime } from "./sovereignPcRuntimeR199"' in source
    assert "current.fetch(request, env, ctx)" in source
    assert "enhanceSovereignPcSurfaceR199" in source


def test_gateway_exposes_pair_download_status_job_and_receipt_routes():
    source = text(GATEWAY)
    for route in (
        "/omega-hybrid-agent.py",
        "/api/hybrid/agent-download",
        "/api/hybrid/connector-manifest",
        "/api/hybrid/status",
        "/api/hybrid/jobs",
        "/api/runtime/snapshot",
        "/api/runtime/events",
        "/api/missions",
    ):
        assert route in source
    assert "R127_ZERO_DRIFT_SHA256_PLUS_R199_VERIFIED_RETURN" in source
    assert "PC ONLINE REQUIRES CURRENT AUTHENTICATED HEARTBEAT" in source


def test_server_requires_verified_return_not_just_a_connected_agent():
    source = text(RUNTIME_DO)
    for token in (
        "RETURNED_SUCCESS",
        "RETURNED_FAILURE",
        "RETURN_VERIFIED_SUCCESS",
        "RETURN_VERIFIED_FAILURE",
        "RETURN_REJECTED",
        "resultFingerprint",
        "returnVerification",
        "receiptCanonicalJson",
        "observedHash",
        "serverReceiptSha256",
    ):
        assert token in source
    assert 'const finalStatus = returnedState === "RETURNED_SUCCESS" ? "COMPLETE" : "FAILED";' in source
    assert 'const complete = finalStatus === "COMPLETE";' in source
    assert 'status: complete ? "COMPLETE" : "HOLD_REPAIR_REQUIRED"' in source


def test_r199_agent_asset_is_hash_manifested_and_zero_drift_served():
    source = text(AGENT_TS)
    assert "omega_hybrid_agent_r199.py" in source
    assert "crypto.subtle.digest" in source
    assert "sha256" in source.lower()
    assert "OMEGA_HYBRID_CONNECTOR_MANIFEST_R199" in source
    assert "R127_ZERO_DRIFT_SHA256_PLUS_R199_VERIFIED_RETURN" in source


def test_operator_surface_exposes_full_pipeline_and_pc_protection():
    source = text(SURFACE)
    for stage in ("DISCOVER", "PREFLIGHT", "BUILD", "TEST", "PACKAGE", "RETURN", "VERIFY"):
        assert stage in source
    assert "Run full safe build" in source
    assert "SEQUENTIAL HEAVY WORK" in source
    assert "NO IMPLICIT INSTALLS" in source
    assert "NO OS TWEAKING" in source
    assert "Resource guard is blocking heavy work to protect the PC" in source
    assert "returnVerification" in source
    assert "verify.verified" in source


def test_bridge_project_discovery_selects_nested_buildable_project(tmp_path: Path):
    agent = load_bridge_agent()
    outer = tmp_path / "J"
    noise = outer / "misc" / "notes"
    project = outer / "Projects" / "canonforge-omega"
    worker = project / "cloudflare" / "omega-v6-worker"
    noise.mkdir(parents=True)
    worker.mkdir(parents=True)
    (noise / "readme.txt").write_text("not a project", encoding="utf-8")
    (project / "pyproject.toml").write_text("[project]\nname='omega'\nversion='1.0.0'\n", encoding="utf-8")
    (project / "omega_runtime").mkdir()
    (worker / "package.json").write_text(json.dumps({"scripts": {"typecheck": "tsc --noEmit"}}), encoding="utf-8")
    (worker / "wrangler.toml").write_text('name="omega"\n', encoding="utf-8")

    discovery = agent.discover_projects(outer, max_depth=7, max_dirs=100, time_budget=3.0)
    assert discovery["candidateCount"] >= 1
    assert discovery["selected"] is not None
    assert "canonforge-omega" in discovery["selected"]["relativePath"].lower()
    assert discovery["confidence"] in {"MEDIUM", "HIGH"}


def test_bridge_resource_guard_is_observational_and_non_mutating(tmp_path: Path):
    agent = load_bridge_agent()
    health = agent.host_health(tmp_path, {"candidateCount": 0, "selected": None})
    assert health["schema"] == "OMEGA_PC_RESOURCE_GUARD_R199"
    assert health["heavyOpsSequential"] is True
    assert health["implicitDependencyInstall"] is False
    assert health["systemOptimizationMutation"] is False
    assert health["rootConfinedWrites"] is True
    assert isinstance(health["disk"]["freeBytes"], int)


def test_bridge_rejects_path_escape_and_keeps_write_preconditions(tmp_path: Path):
    agent = load_bridge_agent()
    with pytest.raises(agent.AgentError):
        agent.secure_path(tmp_path, "../outside.txt")
    source = text(BRIDGE_AGENT)
    assert "expectedSha256" in source
    assert "backup" in source.lower()
    assert "os.replace" in source


def test_legacy_token_transport_is_now_project_aware_and_failure_truthful():
    source = text(TOKEN_AGENT)
    for token in (
        "discover_projects",
        "selected_project",
        "host_health",
        "require_heavy_budget",
        "BELOW_NORMAL_PRIORITY_CLASS",
        "require_success",
        "PROJECT_NOT_FOUND",
        "OMEGA_SOVEREIGN_RETURN_RECEIPT_R199",
        '"VERIFIED"',
        '"FAILED"',
    ):
        assert token in source
    assert "if int(result.get(\"exit_code\", 1)) != 0" in source
