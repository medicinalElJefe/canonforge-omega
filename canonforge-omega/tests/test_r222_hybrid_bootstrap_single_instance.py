from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r222_local_runtime_adds_signed_outbound_enrollment_without_replacing_app():
    cli = read(ROOT / "omega_runtime" / "cli.py")
    local = read(ROOT / "api" / "runtime_r222.py")
    assert 'uvicorn.run("api.runtime_r222:app"' in cli
    assert "from api.app import APPROVED_BUILD_ROOT, GATEWAY_TOKEN, _pairing, app" in local
    assert '@app.get("/api/hybrid/enrollment")' in local
    assert '@app.get("/api/hybrid/r222/local-contract")' in local
    assert "hmac.new(GATEWAY_TOKEN.encode" in local
    assert "LOCAL_GATEWAY_ENROLLMENT_KEY_NOT_CONFIGURED" in local
    assert "inboundCloudToPcRequired" in local
    assert "executionAuthorityGranted" in local


def test_r222_successor_api_routes_are_reordered_ahead_of_inherited_catch_all_ui_mount():
    # Keep this regression source-only so generic historical non-regression jobs do not
    # acquire a new FastAPI installation requirement. The R207 Windows integration proof
    # starts the real runtime and is the executable route-reachability proof.
    local = read(ROOT / "api" / "runtime_r222.py")
    enrollment = local.index('@app.get("/api/hybrid/enrollment")')
    contract = local.index('@app.get("/api/hybrid/r222/local-contract")')
    reorder_def = local.index("def _ensure_successor_api_precedes_ui_mount")
    reorder_call = local.rindex("_ensure_successor_api_precedes_ui_mount()")

    assert enrollment < reorder_def
    assert contract < reorder_def
    assert reorder_def < reorder_call
    assert "from starlette.routing import Mount" in local
    assert 'isinstance(route, Mount) and getattr(route, "name", None) == "ui"' in local
    assert "app.router.routes.remove(route)" in local
    assert "app.router.routes.append(route)" in local
    assert "does not replace the app" in local


def test_r222_preserves_exact_durable_object_identity_and_removes_hybrid_gateway_fallback():
    alias = read(WORKER / "convergenceRuntimeAliasR204.ts")
    control = read(WORKER / "hybridControlPlaneR222.ts")
    runtime = read(WORKER / "omegaRuntimeR222.ts")
    assert 'export { OmegaRuntime } from "./omegaRuntimeR222";' in alias
    assert 'export { OmegaRuntime } from "./omegaRuntimeR204";' in alias  # historical marker retained
    assert 'const CANONICAL_SINGLETON = "OMEGA_RUNTIME";' in control
    assert 'idFromName(CANONICAL_SINGLETON)' in control
    assert "SOVEREIGN_ORIGIN" not in control
    assert "badGatewayFallbackUsed: false" in control
    assert "inboundSovereignGatewayRequired: false" in control
    assert "CLOUDFLARE_DURABLE_OBJECT_OUTBOUND_AGENT_POLL" in control
    assert "R204OmegaRuntime" in runtime
    assert 'await this.put("bridgeSecretHash", tokenSha256)' in runtime
    assert "ENROLLMENT_REPLAY_REJECTED" in runtime
    assert "ENROLLMENT_SIGNATURE_INVALID" in runtime


def test_r222_link_is_not_execution_authority_and_browser_cannot_grant_it():
    runtime = read(WORKER / "omegaRuntimeR222.ts")
    control = read(WORKER / "hybridControlPlaneR222.ts")
    assert "LOCAL_APPROVAL_REQUIRED" in runtime
    assert "remoteBrowserMayGrant: false" in runtime
    assert 'body.localApproval !== true' in runtime
    assert "CURRENT_AUTHENTICATED_HEARTBEAT_REQUIRED" in runtime
    assert "LOCAL_EXECUTION_AUTHORITY_ACTIVE" in runtime
    assert "nativeExecutionClaimed: Boolean(online && authority.active)" in control
    assert "public browser cannot grant that lease by itself" in control


def test_r222_development_loop_is_durable_allow_listed_and_evidence_separated():
    runtime = read(WORKER / "omegaRuntimeR222.ts")
    assert 'const DEV_JOBS_KEY = "developmentJobsR222"' in runtime
    assert '"inspect_workspace"' in runtime
    assert '"compute_truth_suite"' in runtime
    assert '"build_vite"' in runtime
    assert '"wrangler_dry_run"' in runtime
    assert '"verify_candidate"' in runtime
    assert "UNSUPPORTED_OR_UNAUTHORIZED_JOB_KIND" in runtime
    assert "LOCAL_EXECUTION_AUTHORITY_REQUIRED" in runtime
    assert 'state: "QUEUED"' in runtime
    assert 'state: "LEASED"' in runtime
    assert 'state === "VERIFIED"' in runtime
    assert "canonicalMutation: false" in runtime
    assert "deploymentAuthorized: false" in runtime
    assert "promotionAuthorized: false" in runtime


def test_r222_windows_setup_is_single_instance_and_every_wrapper_uses_stable_gateway():
    ps1 = read(ROOT / "scripts" / "START_OMEGA_R222_FULL_HYBRID.ps1")
    cmd = read(ROOT / "scripts" / "START_OMEGA_R222_FULL_HYBRID.cmd")
    stable_ps1 = read(ROOT / "scripts" / "START_OMEGA_SOVEREIGN.ps1")
    stable_cmd = read(ROOT / "scripts" / "START_OMEGA_SOVEREIGN.cmd")
    assert "OMEGA_R222_FULL_HYBRID_SINGLE_INSTANCE" in ps1
    assert "WaitOne(0" in ps1
    assert "No duplicate launcher was started" in ps1
    assert "Stop-OwnedAgents" in ps1
    assert "Get-OwnedAgents" in ps1
    assert "-WindowStyle Hidden" in ps1
    assert "LOCAL ENROLLMENT KEY MISSING" in ps1
    assert "/api/hybrid/enrollment" in ps1
    assert "/api/hybrid/enroll" in ps1
    assert "/api/hybrid/authority/grant" in ps1
    assert "/api/development/mode" in ps1
    assert "duplicateLauncherStarted = $false" in ps1
    assert "Start-Process -FilePath $Vpy" in ps1
    assert "START_OMEGA_R222_FULL_HYBRID.ps1" in stable_ps1
    assert "START_OMEGA_SOVEREIGN.ps1" in stable_cmd
    assert "START_OMEGA_SOVEREIGN.cmd" in cmd
    assert 'start "OMEGA Sovereign Agent"' not in cmd
    assert "omega_sovereign_agent.py" not in cmd
    assert "omega_runtime.cli" not in cmd


def test_public_hybrid_launcher_bootstraps_exact_canonical_source_without_embedding_pair_secret():
    control = read(WORKER / "hybridControlPlaneR222.ts")
    r222_cmd = read(ROOT / "scripts" / "START_OMEGA_R222_FULL_HYBRID.cmd")
    assert 'path === "/api/hybrid/launcher"' in control
    assert "CANONICAL_GIT_SHA" in control
    assert "git checkout --detach %OMEGA_CANONICAL_SHA%" in control
    assert "START_OMEGA_R222_FULL_HYBRID.cmd" in control
    assert "START_OMEGA_SOVEREIGN.cmd" in r222_cmd
    launcher_section = control.split("function bootstrapCmd", 1)[1].split("export async function handleHybridControlPlaneR222", 1)[0]
    assert "OMEGA_TOKEN=" not in launcher_section
    assert "bridgeSecretHash" not in launcher_section
