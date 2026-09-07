export const SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R209 = "r209-sovereign-heartbeat-self-heal";
export const SOVEREIGN_HEARTBEAT_RECOVERY_SCHEMA_R209 = "OMEGA_SOVEREIGN_HEARTBEAT_RECOVERY_MANIFEST_R209";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS });
}

function canonicalSha(env: any): string | null {
  const value = String(env?.CANONICAL_GIT_SHA ?? "").trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(value) ? value : null;
}

async function sha256(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function manifest(env: any): Promise<Response> {
  const gitSha = canonicalSha(env);
  const core = {
    ok: true,
    schema: SOVEREIGN_HEARTBEAT_RECOVERY_SCHEMA_R209,
    release: SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R209,
    canonicalGitSha: gitSha,
    deploymentIdentityBound: Boolean(gitSha),
    predecessor: "R208_PHYSICAL_SOVEREIGN_ACCEPTANCE_CLOSURE",
    purpose: "Make the R208 physical-acceptance prerequisite self-healing when an old sovereign agent process survives with stale authentication or a superseded pairing generation.",
    recoveryLaw: [
      "PRESERVE_R208_PHYSICAL_ACCEPTANCE_PROVER",
      "PRESERVE_FIXED_LOCALHOST_127_0_0_1_8127",
      "PRESERVE_INSTALLER_VERIFIED_VENV",
      "OBSERVE_AGENT_PROCESS_AND_HYBRID_STATUS",
      "REUSE_ONLY_CURRENT_AUTHENTICATED_GENERATION_BOUND_AGENT",
      "SCOPED_TERMINATION_ONLY_OF_MATCHING_CANONICAL_STALE_AGENT",
      "ROTATE_PAIRING_ONLY_THROUGH_LOCAL_SOVEREIGN_RUNTIME",
      "DELETE_ONE_TIME_CREDENTIAL_ENVELOPE_IMMEDIATELY",
      "PERSIST_ONLY_NON_SECRET_PAIRING_GENERATION_METADATA",
      "RESTART_EXACT_AGENT_WITH_VERIFIED_VENV",
      "FAIL_CLOSED_IF_CURRENT_AUTHENTICATED_HEARTBEAT_DOES_NOT_RETURN",
      "RUN_R208_DEEP_ACCEPTANCE_ONLY_AFTER_HEARTBEAT_CURRENT_UNLESS_EXPLICITLY_SKIPPED_FOR_HEADLESS_CONTINUITY",
    ],
    publicBootstrap: {
      endpoint: "/api/hybrid/launcher",
      credentialBearing: false,
      sourceRepository: "medicinalElJefe/canonforge-omega",
      exactDeployedShaSources: [
        "scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1",
        "scripts/omega_sovereign_agent.py",
        "scripts/PROVE_OMEGA_V6_WINDOWS.ps1",
      ],
      canonicalRootPointer: "%LOCALAPPDATA%\\OMEGA\\canonical-root.txt",
      invokesForceRepair: true,
      executesOnUserPcByItself: false,
    },
    boundaries: {
      browserCredentialIsNotPcProof: true,
      windowsCiIsNotOperatorPcAcceptance: true,
      currentAuthenticatedHeartbeatRequiredForPcOnline: true,
      r208FullAcceptanceStillRequiresR181RcwaB059Conjunction: true,
      cloudBootstrapDoesNotIssuePairingCredential: true,
      cloudBootstrapDoesNotExecuteOnUserPcByItself: true,
      publicBootstrapContainsPairingToken: false,
      noFallbackToSystemPythonAfterVerifiedVenvExists: true,
      noPortDriftFrom8127: true,
      canonicalMutation: false,
      hostStateMutationByManifest: false,
      promotionAuthorized: false,
    },
  };
  return json({ ...core, receiptSha256: await sha256(core) });
}

function bootstrap(env: any): Response {
  const gitSha = canonicalSha(env);
  if (!gitSha) {
    return json({
      ok: false,
      code: "R209_CANONICAL_SHA_REQUIRED",
      release: SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R209,
      boundary: "The public recovery bootstrap is never emitted without an exact deployed canonical Git SHA.",
      canonicalMutation: false,
      promotionAuthorized: false,
    }, 503);
  }

  const shortSha = gitSha.slice(0, 12);
  const rawRoot = `https://raw.githubusercontent.com/medicinalElJefe/canonforge-omega/${gitSha}/canonforge-omega`;
  const cmd = `@echo off\r\nsetlocal EnableExtensions\r\nchcp 65001 >nul\r\nset "OMEGA_R209_SHA=${gitSha}"\r\nset "OMEGA_ROOT_FILE=%LOCALAPPDATA%\\OMEGA\\canonical-root.txt"\r\nset "OMEGA_TMP=%TEMP%\\OMEGA-R209-${shortSha}"\r\necho OMEGA R209 Sovereign Heartbeat Self-Heal\r\necho Canonical SHA: %OMEGA_R209_SHA%\r\necho This bootstrap contains no pairing credential. PC ONLINE remains current-heartbeat proof gated.\r\nif not exist "%OMEGA_ROOT_FILE%" goto :install_required\r\nfor /f "usebackq delims=" %%R in ("%OMEGA_ROOT_FILE%") do if not defined OMEGA_ROOT set "OMEGA_ROOT=%%R"\r\nif not defined OMEGA_ROOT goto :install_required\r\nif not exist "%OMEGA_ROOT%\\.venv\\Scripts\\python.exe" goto :install_required\r\nif not exist "%OMEGA_TMP%" mkdir "%OMEGA_TMP%"\r\necho [1/5] Fetching exact deployed recovery launcher...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${rawRoot}/scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1' -OutFile '%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1' -TimeoutSec 30" || goto :download_error\r\necho [2/5] Fetching exact deployed sovereign agent...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${rawRoot}/scripts/omega_sovereign_agent.py' -OutFile '%OMEGA_TMP%\\omega_sovereign_agent.py' -TimeoutSec 30" || goto :download_error\r\necho [3/5] Fetching exact deployed R208 acceptance prover...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${rawRoot}/scripts/PROVE_OMEGA_V6_WINDOWS.ps1' -OutFile '%OMEGA_TMP%\\PROVE_OMEGA_V6_WINDOWS.ps1' -TimeoutSec 30" || goto :download_error\r\nfindstr /C:"R209 launch requested" "%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1" >nul || goto :contract_error\r\nfindstr /C:"PC ONLINE will only be claimed" "%OMEGA_TMP%\\omega_sovereign_agent.py" >nul || goto :contract_error\r\nfindstr /C:"OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208" "%OMEGA_TMP%\\PROVE_OMEGA_V6_WINDOWS.ps1" >nul || goto :contract_error\r\necho [4/5] Repairing stale or generation-unbound sovereign heartbeat state...\r\npowershell -NoProfile -ExecutionPolicy Bypass -File "%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1" -RootOverride "%OMEGA_ROOT%" -AgentScriptOverride "%OMEGA_TMP%\\omega_sovereign_agent.py" -AcceptanceProverOverride "%OMEGA_TMP%\\PROVE_OMEGA_V6_WINDOWS.ps1" -ForceRepair || goto :repair_error\r\necho [5/5] R209 returned after current authenticated generation-bound heartbeat proof.\r\necho R208 physical acceptance was then evaluated separately against production truth; inspect OMEGA logs for its exact result.\r\nexit /b 0\r\n:install_required\r\necho INSTALL REQUIRED: canonical-root.txt or the verified OMEGA .venv is missing.\r\necho Run the canonical INSTALL_OMEGA_V6_WINDOWS.ps1 from the installed repository first.\r\nexit /b 30\r\n:download_error\r\necho DOWNLOAD ERROR: exact canonical recovery sources could not be retrieved. No older source was substituted.\r\nexit /b 31\r\n:contract_error\r\necho CONTRACT ERROR: downloaded files did not match the R209/R208 recovery contract. Nothing was executed.\r\nexit /b 32\r\n:repair_error\r\necho RECOVERY FAILED: localhost runtime may be healthy, but current authenticated heartbeat proof was not established.\r\necho Review the installed OMEGA logs. PC ONLINE is not claimed by this bootstrap.\r\nexit /b 33\r\n`;

  return new Response(cmd, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": 'attachment; filename="START_OMEGA_PC_LINK_R209.cmd"',
      "cache-control": "no-store",
      "x-omega-hybrid-bootstrap": SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R209,
      "x-omega-canonical-sha": gitSha,
    },
  });
}

export async function handleSovereignHeartbeatRecoveryR209(request: Request, env: any): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/system/r209/manifest" || url.pathname === "/api/system/r209/manifest/") {
    if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
    return manifest(env);
  }
  if (url.pathname === "/api/hybrid/launcher" || url.pathname === "/api/hybrid/launcher/") {
    if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
    return bootstrap(env);
  }
  return null;
}
