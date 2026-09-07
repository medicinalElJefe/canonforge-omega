export const SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R208 = "r208-sovereign-heartbeat-self-heal";
export const SOVEREIGN_HEARTBEAT_RECOVERY_SCHEMA_R208 = "OMEGA_SOVEREIGN_HEARTBEAT_RECOVERY_MANIFEST_R208";

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
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function manifest(env: any): Promise<Response> {
  const gitSha = canonicalSha(env);
  const core = {
    ok: true,
    schema: SOVEREIGN_HEARTBEAT_RECOVERY_SCHEMA_R208,
    release: SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R208,
    canonicalGitSha: gitSha,
    deploymentIdentityBound: Boolean(gitSha),
    predecessor: "R207_WINDOWS_VERIFIED_VENV_SOVEREIGN_LOOPBACK",
    purpose: "Repair stale or generation-unbound Sovereign Windows agents without weakening the current-authenticated-heartbeat truth boundary.",
    recoveryLaw: [
      "PRESERVE_FIXED_LOCALHOST_127_0_0_1_8127",
      "PRESERVE_INSTALLER_VERIFIED_VENV",
      "OBSERVE_EXISTING_AGENT_AND_HYBRID_STATUS",
      "REUSE_AGENT_ONLY_WITH_CURRENT_AUTHENTICATED_HEARTBEAT",
      "REUSE_AGENT_ONLY_WHEN_NON_SECRET_PAIRING_GENERATION_MATCHES",
      "SCOPED_TERMINATION_OF_MATCHING_STALE_CANONICAL_AGENT",
      "ROTATE_ONE_TIME_PAIRING_LOCALLY",
      "DELETE_CREDENTIAL_ENVELOPE_IMMEDIATELY",
      "RESTART_CANONICAL_AGENT_WITH_VERIFIED_VENV",
      "REQUIRE_CURRENT_AUTHENTICATED_GENERATION_BOUND_HEARTBEAT",
      "FAIL_CLOSED_WITHOUT_PC_ONLINE_CLAIM",
    ],
    publicBootstrap: {
      endpoint: "/api/hybrid/launcher",
      credentialBearing: false,
      exactShaSource: true,
      sourceRepository: "medicinalElJefe/canonforge-omega",
      canonicalRootPointer: "%LOCALAPPDATA%\\OMEGA\\canonical-root.txt",
      temporarySourceOnly: true,
      invokesForceRepair: true,
    },
    boundaries: {
      browserCredentialIsNotPcProof: true,
      windowsCiIsNotOperatorPcAcceptance: true,
      currentAuthenticatedHeartbeatRequiredForPcOnline: true,
      pairingTokenPersistedByBootstrap: false,
      pairingGenerationIsNonSecretContinuityMetadata: true,
      cloudBootstrapDoesNotIssuePairingCredential: true,
      cloudBootstrapDoesNotExecuteOnUserPcByItself: true,
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
      code: "R208_CANONICAL_SHA_REQUIRED",
      release: SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R208,
      boundary: "A public recovery bootstrap is never emitted without an exact deployed canonical Git SHA.",
      canonicalMutation: false,
      promotionAuthorized: false,
    }, 503);
  }

  const shortSha = gitSha.slice(0, 12);
  const rawRoot = `https://raw.githubusercontent.com/medicinalElJefe/canonforge-omega/${gitSha}/canonforge-omega`;
  const cmd = `@echo off\r\nsetlocal EnableExtensions\r\nchcp 65001 >nul\r\nset "OMEGA_R208_SHA=${gitSha}"\r\nset "OMEGA_ROOT_FILE=%LOCALAPPDATA%\\OMEGA\\canonical-root.txt"\r\nset "OMEGA_TMP=%TEMP%\\OMEGA-R208-${shortSha}"\r\necho OMEGA R208 Sovereign Heartbeat Self-Heal\r\necho Canonical SHA: %OMEGA_R208_SHA%\r\necho This bootstrap carries no pairing token. PC ONLINE remains heartbeat-proof gated.\r\nif not exist "%OMEGA_ROOT_FILE%" goto :install_required\r\nfor /f "usebackq delims=" %%R in ("%OMEGA_ROOT_FILE%") do if not defined OMEGA_ROOT set "OMEGA_ROOT=%%R"\r\nif not defined OMEGA_ROOT goto :install_required\r\nif not exist "%OMEGA_ROOT%\\.venv\\Scripts\\python.exe" goto :install_required\r\nif not exist "%OMEGA_TMP%" mkdir "%OMEGA_TMP%"\r\necho [1/4] Fetching exact canonical R208 recovery launcher...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${rawRoot}/scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1' -OutFile '%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1' -TimeoutSec 30" || goto :download_error\r\necho [2/4] Fetching exact canonical sovereign agent...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${rawRoot}/scripts/omega_sovereign_agent.py' -OutFile '%OMEGA_TMP%\\omega_sovereign_agent.py' -TimeoutSec 30" || goto :download_error\r\nfindstr /C:"R208 launch requested" "%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1" >nul || goto :contract_error\r\nfindstr /C:"PC ONLINE will only be claimed" "%OMEGA_TMP%\\omega_sovereign_agent.py" >nul || goto :contract_error\r\necho [3/4] Repairing stale or generation-unbound sovereign agent state...\r\npowershell -NoProfile -ExecutionPolicy Bypass -File "%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1" -RootOverride "%OMEGA_ROOT%" -AgentScriptOverride "%OMEGA_TMP%\\omega_sovereign_agent.py" -ForceRepair || goto :repair_error\r\necho [4/4] R208 launcher returned only after current authenticated generation-bound heartbeat proof.\r\necho OMEGA PC link recovery verified locally. Cloud acceptance will update only while the heartbeat remains current.\r\nexit /b 0\r\n:install_required\r\necho INSTALL REQUIRED: canonical-root.txt or the verified OMEGA .venv is missing.\r\necho Run the canonical INSTALL_OMEGA_V6_WINDOWS.ps1 from the installed repository before using recovery.\r\nexit /b 30\r\n:download_error\r\necho DOWNLOAD ERROR: exact canonical recovery sources could not be retrieved. No older source was substituted.\r\nexit /b 31\r\n:contract_error\r\necho CONTRACT ERROR: downloaded files did not match the R208 recovery contract. Nothing was executed.\r\nexit /b 32\r\n:repair_error\r\necho RECOVERY FAILED: localhost runtime may be healthy, but current authenticated heartbeat proof was not established.\r\necho Review the installed OMEGA logs. PC ONLINE is not claimed.\r\nexit /b 33\r\n`;

  return new Response(cmd, {
    status: 200,
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": 'attachment; filename="START_OMEGA_PC_LINK_R208.cmd"',
      "cache-control": "no-store",
      "x-omega-hybrid-bootstrap": SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R208,
      "x-omega-canonical-sha": gitSha,
    },
  });
}

export async function handleSovereignHeartbeatRecoveryR208(request: Request, env: any): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/system/r208/manifest" || url.pathname === "/api/system/r208/manifest/") {
    if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
    return manifest(env);
  }
  if (url.pathname === "/api/hybrid/launcher" || url.pathname === "/api/hybrid/launcher/") {
    if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED", allowed: ["GET"] }, 405);
    return bootstrap(env);
  }
  return null;
}
