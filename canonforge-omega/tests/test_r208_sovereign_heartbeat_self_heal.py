from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "system" / "sovereignHeartbeatRecoveryR208.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
HEARTBEAT = ROOT / "omega_runtime" / "heartbeat.py"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r208_reuses_agent_only_when_heartbeat_auth_and_pairing_generation_are_current():
    text = read(LAUNCHER)
    assert "[switch]$ForceRepair" in text
    assert "[string]$RootOverride" in text
    assert "[string]$AgentScriptOverride" in text
    assert "agent-pairing-generation.txt" in text
    assert "$heartbeatBefore" in text
    assert "$authenticatedBefore" in text
    assert "$generationBound" in text
    assert "$reuseAgent = [bool]($agentProcess -and -not $ForceRepair -and $heartbeatBefore -and $authenticatedBefore -and $generationBound)" in text
    assert "Stop-OmegaAgent $agentProcess $reason" in text
    assert "pairing generation changed or unbound" in text


def test_r208_rotates_pairing_locally_and_runs_only_verified_venv_agent():
    text = read(LAUNCHER)
    assert "Join-Path $Root '.venv\\Scripts\\python.exe'" in text
    assert "$HybridLauncher = \"$Base/api/hybrid/launcher\"" in text
    assert "requesting fresh one-time pairing envelope from local sovereign runtime" in text
    assert "set \"OMEGA_TOKEN=([^\"\\r\\n]+)\"" in text
    assert "Remove-Item $PairingEnvelope" in text
    assert "Set-Content -Path $PairingGenerationFile" in text
    assert "Start-Process -FilePath $Vpy" in text
    assert "--token" in text and "--root" in text and "--interval" in text
    assert "Start-Process -FilePath $env:ComSpec" not in text
    assert "where py" not in text.lower()


def test_r208_fails_closed_when_repaired_heartbeat_does_not_arrive():
    text = read(LAUNCHER)
    assert "current authenticated generation-bound heartbeat" in text
    assert "new/current heartbeat proof did not arrive" in text
    assert "Remove-Item $PairingGenerationFile" in text
    assert "PC ONLINE is not claimed" in text
    assert "throw \"OMEGA runtime is healthy, but an authenticated generation-bound heartbeat did not become current." in text


def test_r208_public_bootstrap_is_exact_sha_token_free_and_does_not_claim_execution():
    text = read(WORKER)
    assert "OMEGA_SOVEREIGN_HEARTBEAT_RECOVERY_MANIFEST_R208" in text
    assert '"/api/hybrid/launcher"' in text
    assert "CANONICAL_GIT_SHA" in text
    assert "raw.githubusercontent.com/medicinalElJefe/canonforge-omega/${gitSha}/canonforge-omega" in text
    assert "canonical-root.txt" in text
    assert "LAUNCH_OMEGA_V6_WINDOWS.ps1" in text
    assert "omega_sovereign_agent.py" in text
    assert "-RootOverride" in text and "-AgentScriptOverride" in text and "-ForceRepair" in text
    assert "OMEGA_TOKEN=" not in text
    assert "cloudBootstrapDoesNotIssuePairingCredential: true" in text
    assert "cloudBootstrapDoesNotExecuteOnUserPcByItself: true" in text
    assert "currentAuthenticatedHeartbeatRequiredForPcOnline: true" in text
    assert "canonicalMutation: false" in text
    assert "promotionAuthorized: false" in text


def test_r208_handler_precedes_existing_r205_and_canonical_fallback_without_entrypoint_change():
    text = read(ENTRY)
    assert 'import { handleSovereignHeartbeatRecoveryR208 } from "./system/sovereignHeartbeatRecoveryR208";' in text
    recovery = text.index("const sovereignRecoveryR208 = await handleSovereignHeartbeatRecoveryR208(request, env);")
    r205 = text.index("const wholeSystemR205 = await handleWholeSystemControlR205(request, env, ctx, runtimeFetch);")
    fallback = text.index("return canonical.fetch(request, env, ctx);")
    assert recovery < r205 < fallback
    assert 'export { OmegaRuntime } from "./heartbeatTruth";' in text


def test_r208_adds_no_durable_object_and_preserves_r169_r204_deployment_contract():
    text = read(WRANGLER)
    assert 'main = "src/runtimeEntryR169.ts"' in text
    assert '"./convergence" = "./src/convergenceRuntimeAliasR204.ts"' in text
    assert 'SOVEREIGN_HEARTBEAT_RECOVERY_R208_ID = "r208-sovereign-heartbeat-self-heal"' in text
    assert "class_name = \"OmegaHeartbeatRecoveryR208\"" not in text
    assert "R208 adds no Durable Object" in text


def test_r208_keeps_existing_heartbeat_persistence_schema_unchanged():
    text = read(HEARTBEAT)
    assert "class HeartbeatProof:" in text
    assert "pairing_generation" not in text
    assert '"PC_ONLINE" if current else "HEARTBEAT_STALE"' in text
    assert "PC_ONLINE requires authenticated current heartbeat proof" in text


def test_r208_installer_promotes_only_after_r208_recovery_tests_and_keeps_headless_continuity():
    text = read(INSTALLER)
    assert 'Log "OMEGA V6 R208 install root=$Root"' in text
    assert "test_r207_windows_verified_venv_launch.py" in text
    assert "test_r208_sovereign_heartbeat_self_heal.py" in text
    assert "omega_runtime.rcwa_solver --probe" in text
    assert "OMEGA V6 Sovereign Continuity.lnk" in text
    assert "-NoBrowser" in text
    assert "self-heal authenticated sovereign heartbeat" in text
