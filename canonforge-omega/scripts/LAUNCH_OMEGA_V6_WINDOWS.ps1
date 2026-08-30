$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
$Vpy = Join-Path $Root '.venv\Scripts\python.exe'
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir 'launcher.log'
if (-not (Test-Path $Vpy)) { throw 'OMEGA .venv missing. Run INSTALL_OMEGA_V6_WINDOWS.ps1 first.' }

$Port = 8127
while ($Port -lt 8200) {
  $busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $busy) { break }
  $Port++
}
"$(Get-Date -Format o) launching on 127.0.0.1:$Port" | Out-File $Log -Append
$proc = Start-Process -FilePath $Vpy -ArgumentList @('-m','omega_runtime.cli','--host','127.0.0.1','--port',"$Port") -WorkingDirectory $Root -RedirectStandardOutput (Join-Path $LogDir 'runtime_stdout.log') -RedirectStandardError (Join-Path $LogDir 'runtime_stderr.log') -PassThru
$Health = "http://127.0.0.1:$Port/api/health"
$Ready = $false
for ($i=0; $i -lt 80; $i++) {
  if ($proc.HasExited) { break }
  try {
    $r = Invoke-RestMethod -Uri $Health -TimeoutSec 1
    if ($r.ok) { $Ready = $true; break }
  } catch { Start-Sleep -Milliseconds 250 }
}
if (-not $Ready) {
  "$(Get-Date -Format o) launch failed pid=$($proc.Id)" | Out-File $Log -Append
  throw "OMEGA runtime did not become healthy. Review $LogDir\runtime_stderr.log"
}
"$(Get-Date -Format o) PASS healthy pid=$($proc.Id)" | Out-File $Log -Append
Start-Process "http://127.0.0.1:$Port/"
