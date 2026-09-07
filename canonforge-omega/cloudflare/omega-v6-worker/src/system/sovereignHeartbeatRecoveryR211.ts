import canonicalRuntime from "../heartbeatTruth";

export const SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R211 = "r211-sovereign-heartbeat-self-heal";
export const SOVEREIGN_HEARTBEAT_RECOVERY_SCHEMA_R211 = "OMEGA_SOVEREIGN_HEARTBEAT_RECOVERY_MANIFEST_R211";

const canonical: any = canonicalRuntime;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" };
function json(value: unknown, status = 200): Response { return new Response(JSON.stringify(value, null, 2), { status, headers: JSON_HEADERS }); }
function canonicalSha(env: any): string | null { const value=String(env?.CANONICAL_GIT_SHA??"").trim().toLowerCase(); return /^[0-9a-f]{40}$/.test(value)?value:null; }
async function sha256(value: unknown): Promise<string> { const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value))); return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join(""); }

async function manifest(env:any): Promise<Response> {
  const gitSha=canonicalSha(env);
  const core={
    ok:true,
    schema:SOVEREIGN_HEARTBEAT_RECOVERY_SCHEMA_R211,
    release:SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R211,
    canonicalGitSha:gitSha,
    deploymentIdentityBound:Boolean(gitSha),
    predecessor:"R210_CONTENT_ADDRESSED_SOVEREIGN_PROOF_ARCHIVE",
    preserved:["R209_BOUNDED_SOVEREIGN_CONVERGENCE","R208_PHYSICAL_SOVEREIGN_ACCEPTANCE","R181_LIVE_ACCEPTANCE","R210_CONTENT_ADDRESSED_RETENTION"],
    purpose:"Repair stale or generation-unbound Sovereign Windows heartbeat state before R209 convergence diagnostics, R208/R181 truth acceptance, and R210 evidence retention execute.",
    recoveryLaw:[
      "PUBLIC_BOOTSTRAP_IS_EXACT_SHA_AND_CREDENTIAL_FREE",
      "HOSTED_CANONICAL_PAIRING_AUTHORITY_ISSUES_SHORT_LIVED_CREDENTIAL",
      "LOCALHOST_RUNTIME_REMAINS_FIXED_127_0_0_1_8127",
      "VERIFIED_VENV_REMAINS_EXECUTION_AUTHORITY",
      "REUSE_AGENT_ONLY_WITH_CURRENT_AUTHENTICATED_HOSTED_HEARTBEAT_AND_GENERATION_BINDING",
      "STOP_ONLY_MATCHING_STALE_CANONICAL_AGENT",
      "DELETE_PAIRING_ENVELOPE_IMMEDIATELY_AFTER_PARSE",
      "PERSIST_ONLY_NON_SECRET_HOSTED_PAIRING_GENERATION",
      "FAIL_CLOSED_IF_HOSTED_HEARTBEAT_DOES_NOT_RETURN",
      "RUN_R209_CONVERGENCE_ONLY_AFTER_R211_HEARTBEAT_RECOVERY",
      "R209_CONTINUES_TO_WRAP_R208_R181_TRUTH",
      "R210_CONTINUES_TO_CONTENT_ADDRESS_VALIDATED_R208_R209_RECEIPTS"
    ],
    publicBootstrap:{endpoint:"/api/hybrid/launcher",credentialBearing:false,exactDeployedShaSources:["scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1","scripts/omega_sovereign_agent.py","scripts/PROVE_OMEGA_V6_R209_WINDOWS.ps1","scripts/PROVE_OMEGA_V6_WINDOWS.ps1","scripts/ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1"],canonicalRootPointer:"%LOCALAPPDATA%\\OMEGA\\canonical-root.txt",invokesForceRepair:true},
    hostedPairingEnvelope:{endpoint:"/api/hybrid/pairing-envelope",credentialBearing:true,ephemeral:true,cacheable:false,delegatesToPreservedCanonicalPairingAuthority:true},
    boundaries:{windowsCiIsPhysicalPcProof:false,currentAuthenticatedHeartbeatRequiredForPcOnline:true,retriesDoNotCreateAcceptance:true,r208R181RemainAcceptanceAuthority:true,r210ArchiveIsNotCanon:true,cloudBootstrapDoesNotIssuePairingCredential:true,publicBootstrapContainsPairingToken:false,hostedPairingCredentialIsNotCanon:true,noFallbackToSystemPythonAfterVerifiedVenvExists:true,noPortDriftFrom8127:true,canonicalMutation:false,promotionAuthorized:false}
  };
  return json({...core,receiptSha256:await sha256(core)});
}

async function pairingEnvelope(request:Request,env:any,ctx?:any):Promise<Response>{
  const target=new URL(request.url); target.pathname="/api/hybrid/launcher"; target.search="";
  const upstream=await canonical.fetch(new Request(target.toString(),{method:"GET",headers:request.headers}),env,ctx);
  const body=await upstream.text();
  if(!upstream.ok||!body.includes("OMEGA Sovereign PC Link")||!body.includes("OMEGA_TOKEN=")||!body.includes("OMEGA_SERVER=")) return json({ok:false,code:"R211_HOSTED_PAIRING_CONTRACT_INVALID",upstreamStatus:upstream.status,boundary:"No credential is substituted when preserved canonical pairing fails.",canonicalMutation:false,promotionAuthorized:false},502);
  let generation:number|null=null;
  try{const u=new URL(request.url);u.pathname="/api/hybrid/status";u.search="";const r=await canonical.fetch(new Request(u.toString(),{method:"GET",headers:{accept:"application/json"}}),env,ctx);if(r.ok){const d:any=await r.json();const raw=d?.pairingGeneration;if(Number.isInteger(Number(raw)))generation=Number(raw);}}catch{generation=null;}
  const headers=new Headers({"content-type":"application/octet-stream","content-disposition":'attachment; filename="OMEGA_PAIRING_ENVELOPE_R211.cmd"',"cache-control":"no-store","pragma":"no-cache","x-omega-pairing-envelope":"hosted-canonical-ephemeral-r211"});
  if(generation!==null)headers.set("x-omega-pairing-generation",String(generation));
  return new Response(body,{status:200,headers});
}

function bootstrap(request:Request,env:any):Response{
  const gitSha=canonicalSha(env); if(!gitSha)return json({ok:false,code:"R211_CANONICAL_SHA_REQUIRED",canonicalMutation:false,promotionAuthorized:false},503);
  const origin=new URL(request.url).origin; const short=gitSha.slice(0,12); const raw=`https://raw.githubusercontent.com/medicinalElJefe/canonforge-omega/${gitSha}/canonforge-omega`;
  const cmd=`@echo off\r\nsetlocal EnableExtensions\r\nchcp 65001 >nul\r\nset "OMEGA_R211_SHA=${gitSha}"\r\nset "OMEGA_ROOT_FILE=%LOCALAPPDATA%\\OMEGA\\canonical-root.txt"\r\nset "OMEGA_TMP=%TEMP%\\OMEGA-R211-${short}"\r\necho OMEGA R211 Sovereign Heartbeat Self-Heal\r\necho Canonical SHA: %OMEGA_R211_SHA%\r\necho Hosted authority: ${origin}\r\necho This bootstrap contains no pairing credential.\r\nif not exist "%OMEGA_ROOT_FILE%" goto :install_required\r\nfor /f "usebackq delims=" %%R in ("%OMEGA_ROOT_FILE%") do if not defined OMEGA_ROOT set "OMEGA_ROOT=%%R"\r\nif not defined OMEGA_ROOT goto :install_required\r\nif not exist "%OMEGA_ROOT%\\.venv\\Scripts\\python.exe" goto :install_required\r\nif not exist "%OMEGA_TMP%" mkdir "%OMEGA_TMP%"\r\necho [1/7] Fetching exact R211 launcher...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${raw}/scripts/LAUNCH_OMEGA_V6_WINDOWS.ps1' -OutFile '%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1' -TimeoutSec 30" || goto :download_error\r\necho [2/7] Fetching exact sovereign agent...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${raw}/scripts/omega_sovereign_agent.py' -OutFile '%OMEGA_TMP%\\omega_sovereign_agent.py' -TimeoutSec 30" || goto :download_error\r\necho [3/7] Fetching exact R209 convergence prover...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${raw}/scripts/PROVE_OMEGA_V6_R209_WINDOWS.ps1' -OutFile '%OMEGA_TMP%\\PROVE_OMEGA_V6_R209_WINDOWS.ps1' -TimeoutSec 30" || goto :download_error\r\necho [4/7] Fetching exact R208 truth prover...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${raw}/scripts/PROVE_OMEGA_V6_WINDOWS.ps1' -OutFile '%OMEGA_TMP%\\PROVE_OMEGA_V6_WINDOWS.ps1' -TimeoutSec 30" || goto :download_error\r\necho [5/7] Fetching exact R210 proof archiver...\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri '${raw}/scripts/ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1' -OutFile '%OMEGA_TMP%\\ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1' -TimeoutSec 30" || goto :download_error\r\nfindstr /C:"R211 launch requested" "%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1" >nul || goto :contract_error\r\nfindstr /C:"OMEGA_SOVEREIGN_CONVERGENCE_R209" "%OMEGA_TMP%\\PROVE_OMEGA_V6_R209_WINDOWS.ps1" >nul || goto :contract_error\r\nfindstr /C:"OMEGA_PHYSICAL_SOVEREIGN_ACCEPTANCE_R208" "%OMEGA_TMP%\\PROVE_OMEGA_V6_WINDOWS.ps1" >nul || goto :contract_error\r\nfindstr /C:"OMEGA_SOVEREIGN_PROOF_ARCHIVE_RESULT_R210" "%OMEGA_TMP%\\ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1" >nul || goto :contract_error\r\necho [6/7] Repairing hosted heartbeat with short-lived pairing...\r\npowershell -NoProfile -ExecutionPolicy Bypass -File "%OMEGA_TMP%\\LAUNCH_OMEGA_V6_WINDOWS.ps1" -RootOverride "%OMEGA_ROOT%" -AgentScriptOverride "%OMEGA_TMP%\\omega_sovereign_agent.py" -ConvergenceProverOverride "%OMEGA_TMP%\\PROVE_OMEGA_V6_R209_WINDOWS.ps1" -R208ProverOverride "%OMEGA_TMP%\\PROVE_OMEGA_V6_WINDOWS.ps1" -R210ArchiverOverride "%OMEGA_TMP%\\ARCHIVE_OMEGA_SOVEREIGN_PROOF_R210.ps1" -CloudBase "${origin}" -ForceRepair || goto :repair_error\r\necho [7/7] R211 heartbeat recovery completed; R209/R208/R210 proof stack executed separately.\r\nexit /b 0\r\n:install_required\r\necho INSTALL REQUIRED: canonical root pointer or verified OMEGA venv missing.\r\nexit /b 30\r\n:download_error\r\necho DOWNLOAD ERROR: exact canonical recovery sources could not be retrieved.\r\nexit /b 31\r\n:contract_error\r\necho CONTRACT ERROR: exact-source markers failed; nothing executed.\r\nexit /b 32\r\n:repair_error\r\necho RECOVERY FAILED: current authenticated hosted heartbeat was not established. PC ONLINE is not claimed.\r\nexit /b 33\r\n`;
  return new Response(cmd,{status:200,headers:{"content-type":"application/octet-stream","content-disposition":'attachment; filename="START_OMEGA_PC_LINK_R211.cmd"',"cache-control":"no-store","x-omega-hybrid-bootstrap":SOVEREIGN_HEARTBEAT_RECOVERY_RELEASE_R211,"x-omega-canonical-sha":gitSha}});
}

export async function handleSovereignHeartbeatRecoveryR211(request:Request,env:any,ctx?:any):Promise<Response|null>{
  const url=new URL(request.url);
  if(url.pathname==="/api/system/r211/manifest"||url.pathname==="/api/system/r211/manifest/"){if(request.method!=="GET")return json({ok:false,code:"METHOD_NOT_ALLOWED"},405);return manifest(env);}
  if(url.pathname==="/api/hybrid/launcher"||url.pathname==="/api/hybrid/launcher/"){if(request.method!=="GET")return json({ok:false,code:"METHOD_NOT_ALLOWED"},405);return bootstrap(request,env);}
  if(url.pathname==="/api/hybrid/pairing-envelope"||url.pathname==="/api/hybrid/pairing-envelope/"){if(request.method!=="GET")return json({ok:false,code:"METHOD_NOT_ALLOWED"},405);return pairingEnvelope(request,env,ctx);}
  return null;
}
