from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LAUNCHER = ROOT / "scripts" / "LAUNCH_OMEGA_V6_WINDOWS.ps1"
INSTALLER = ROOT / "scripts" / "INSTALL_OMEGA_V6_WINDOWS.ps1"
PROVER = ROOT / "scripts" / "PROVE_OMEGA_V6_WINDOWS.ps1"
WORKER = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "system" / "sovereignHeartbeatRecoveryR209.ts"
ENTRY = ROOT / "cloudflare" / "omega-v6-worker" / "src" / "runtimeEntryR169.ts"
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
HEARTBEAT = ROOT / "omega_runtime" / "heartbeat.py"


def read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_r209_reuses_agent_only_with_current_authenticated_hosted_generation_bound_proof():
    text = read(LAUNCHER)
    assert "[switch]$ForceRepair" in text
    assert "[string]$RootOverride" in text
    assert "[string]$AgentScriptOverride" in text
    assert "[string]$AcceptanceProverOverride" in text
    assert "[string]$CloudBase = 'https://omegav6.jeffdeweyeljefe.workers.dev'" in text
    assert "[string]$PairingEnvelopePath = '/api/hybrid/pairing-envelope'" in text
    assert "hosted-pairing-generation.txt" in text
    assert "$hostedBefore" in text
    assert "$heartbeatBefore" in text
    assert "$authenticatedBefore" in text
    assert "$generationBound" in text
    assert "$reuseAgent = [bool]($null -ne $agentProcess -and -not $ForceRepair -and $heartbeatBefore -and $authenticatedBefore -and $generationBound)" in text
    assert "Stop-OmegaAgent $agentProcess $reason" in text
    assert "hosted heartbeat stale or absent" in text
    assert "hosted heartbeat authentication incomplete" in text
    assert "hosted pairing generation changed or is not bound to this agent launch" in text


def test_r209_pairing_uses_hosted_authority_but_executes_only_verified_venv_locally():
    text = read(LAUNCHER)
    assert "Join-Path $Root '.venv\\Scripts\\python.exe'" in text
    assert '$HostedHybridStatus = "$CloudBase/api/hybrid/status"' in text
    assert '$HostedPairingEnvelope = "$CloudBase$PairingEnvelopePath"' in text
    assert "requesting fresh hosted one-time pairing envelope" in text
    assert "set \"OMEGA_TOKEN=([^\"\\r\\n]+)\"" in text
    assert "set \"OMEGA_SERVER=([^\"\\r\\n]+)\"" in text
    assert "Remove-Item $PairingEnvelope" in text
    assert "Set-Content -Path $PairingGenerationFile" in text
    assert "Start-Process -FilePath $Vpy" in text
    assert "--token" in text and "--root" in text and "--interval" in text
    assert "Start-Process -FilePath $env:ComSpec" not in text
    assert "where py" not in text.lower()
    assert "Get-HostedHybridStatus" in text


def test_r209_fails_closed_and_withholds_r208_deep_acceptance_without_hosted_heartbeat():
    text = read(LAUNCHER)
    assert "current authenticated hosted generation-bound heartbeat did not arrive" in text
    assert "Remove-Item $PairingGenerationFile" in text
    assert "PC ONLINE is not claimed and R208 deep acceptance is withheld" in text
    assert "authenticated hosted generation-bound heartbeat did not become current" in text
    heartbeat_gate = text.index("if (-not $heartbeatCurrent)")
    r208_proof = text.index("running preserved R208 physical sovereign acceptance proof after R209 hosted heartbeat recovery")
    assert heartbeat_gate < r208_proof


def test_r209_preserves_complete_r208_physical_acceptance_closure_and_root_binding():
    launcher = read(LAUNCHER)
    prover = read(PROVER)
    required = [
        "OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208",
        "/api/acceptance/r181/manifest",
        "/api/acceptance/r181/probe",
        "deep_b059 = $true",
        "query_b059 = $true",
        "OMEGA_LIVE_AI_SAI_SOVEREIGN_ACCEPTANCE_R181",
        "LIVE_ACCEPTANCE_RECEIPT_NOT_CANON",
        "fullyTrainedWithinDeclaredScope",
        "b059GroundedQuery.grounded",
        "hybrid.heartbeatCurrent",
        "LOCAL_OPERATOR_ACCEPTANCE_OBSERVATION_NOT_CANON",
        "canonicalMutation = $false",
        "promotionAuthorized = $false",
        "windowsCiIsPhysicalPcProof = $false",
        "providerWeightsAreOmegaTrained = $false",
    ]
    for token in required:
        assert token in prover, token
    assert "[string]$RootOverride = ''" in prover
    assert "$Root = (Resolve-Path $RootOverride).Path" in prover
    assert "PROVE_OMEGA_V6_WINDOWS.ps1" in launcher
    assert "-RootOverride $Root -ProductionBase $CloudBase" in launcher
    assert "R208 acceptance receipt" in launcher
    assert "hosted heartbeat remains proven but no full-acceptance success claim is promoted" in launcher


def test_r209_public_bootstrap_is_exact_sha_and_contains_no_pairing_credential():
    text = read(WORKER)
    assert "OMEGA_SOVEREIGN_HEARTBEAT_RECOVERY_MANIFEST_R209" in text
    assert '"/api/hybrid/launcher"' in text
    assert "CANONICAL_GIT_SHA" in text
    assert "raw.githubusercontent.com/medicinalElJefe/canonforge-omega/${gitSha}/canonforge-omega" in text
    assert "canonical-root.txt" in text
    assert "LAUNCH_OMEGA_V6_WINDOWS.ps1" in text
    assert "omega_sovereign_agent.py" in text
    assert "PROVE_OMEGA_V6_WINDOWS.ps1" in text
    assert "-RootOverride" in text
    assert "-AgentScriptOverride" in text
    assert "-AcceptanceProverOverride" in text
    assert '-CloudBase "${origin}"' in text
    assert "-ForceRepair" in text
    start = text.index("const cmd = `")
    end = text.index("return new Response(cmd", start)
    bootstrap_source = text[start:end]
    assert "OMEGA_TOKEN=" not in bootstrap_source
    assert "cloudBootstrapDoesNotIssuePairingCredential: true" in text
    assert "cloudBootstrapDoesNotExecuteOnUserPcByItself: true" in text
    assert "currentAuthenticatedHeartbeatRequiredForPcOnline: true" in text
    assert "r208FullAcceptanceStillRequiresR181RcwaB059Conjunction: true" in text
    assert "canonicalMutation: false" in text
    assert "promotionAuthorized: false" in text


def test_r209_pairing_envelope_is_ephemeral_delegation_to_preserved_canonical_authority():
    text = read(WORKER)
    assert 'import canonicalRuntime from "../heartbeatTruth";' in text
    assert '"/api/hybrid/pairing-envelope"' in text
    assert "pairingEnvelope(request, env, ctx)" in text
    assert 'target.pathname = "/api/hybrid/launcher"' in text
    assert "canonical.fetch" in text
    assert 'body.includes("OMEGA_TOKEN=")' in text
    assert 'body.includes("OMEGA_SERVER=")' in text
    assert 'headers.set("cache-control", "no-store")' in text
    assert 'headers.set("pragma", "no-cache")' in text
    assert 'headers.set("x-omega-pairing-envelope", "hosted-canonical-ephemeral-r209")' in text
    assert "hostedPairingEnvelopeIsCredentialBearingEphemeral: true" in text
    assert "hostedPairingCredentialIsNotCanon: true" in text


def test_r209_handler_precedes_existing_r205_and_canonical_fallback_without_authority_change():
    text = read(ENTRY)
    assert 'import { handleSovereignHeartbeatRecoveryR209 } from "./system/sovereignHeartbeatRecoveryR209";' in text
    recovery = text.index("const sovereignRecoveryR209 = await handleSovereignHeartbeatRecoveryR209(request, env);")
    r205 = text.index("const wholeSystemR205 = await handleWholeSystemControlR205(request, env, ctx, runtimeFetch);")
    fallback = text.index("return canonical.fetch(request, env, ctx);")
    assert recovery < r205 < fallback
    assert 'export { OmegaRuntime } from "./heartbeatTruth";' in text
    assert 'export { OmegaMissionLedgerR201 } from "./system/omegaRuntimeR201";' in text
    assert 'export { OmegaHybridMissionLedgerR203 } from "./system/hybridMissionLedgerR203";' in text


def test_r209_adds_no_durable_object_and_preserves_r169_r204_entry_contract():
    text = read(WRANGLER)
    assert 'main = "src/runtimeEntryR169.ts"' in text
    assert '"./convergence" = "./src/convergenceRuntimeAliasR204.ts"' in text
    assert 'SOVEREIGN_HEARTBEAT_RECOVERY_R209_ID = "r209-sovereign-heartbeat-self-heal"' in text
    assert "class_name = \"OmegaHeartbeatRecoveryR209\"" not in text
    assert "R209 adds no Durable Object" in text


def test_r209_does_not_mutate_existing_heartbeat_persistence_schema():
    text = read(HEARTBEAT)
    assert "class HeartbeatProof:" in text
    assert "pairing_generation" not in text
    assert '"PC_ONLINE" if current else "HEARTBEAT_STALE"' in text
    assert "PC_ONLINE requires authenticated current heartbeat proof" in text


def test_r209_installer_gates_on_r208_and_r209_and_keeps_headless_self_heal():
    text = read(INSTALLER)
    assert 'Log "OMEGA V6 R209 install root=$Root"' in text
    assert "test_r207_windows_verified_venv_launch.py" in text
    assert "test_r208_physical_sovereign_acceptance.py" in text
    assert "test_r209_sovereign_heartbeat_self_heal.py" in text
    assert "omega_runtime.rcwa_solver --probe" in text
    assert "OMEGA V6 Sovereign Continuity.lnk" in text
    assert "-NoBrowser -SkipAcceptanceProof" in text
    assert "self-heal the authenticated sovereign heartbeat" in text
