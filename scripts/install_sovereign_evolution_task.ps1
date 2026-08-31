param(
    [string]$TaskName = "OMEGA Sovereign Evolution",
    [string]$PythonPath = "",
    [string]$RepoPath = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoPath)) {
    $RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

if ([string]::IsNullOrWhiteSpace($PythonPath)) {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) {
        throw "Python was not found on PATH. Re-run with -PythonPath pointing to python.exe."
    }
    $PythonPath = $python.Source
}

$cycle = Join-Path $RepoPath "scripts\sovereign_evolution_host.py"
if (-not (Test-Path $cycle)) {
    throw "Sovereign evolution host script not found: $cycle"
}

$now = Get-Date
$firstRun = Get-Date -Hour $now.Hour -Minute 37 -Second 0
if ($firstRun -le $now) {
    $firstRun = $firstRun.AddHours(1)
}

$argument = ('"{0}" --once' -f $cycle)
$action = New-ScheduledTaskAction -Execute $PythonPath -Argument $argument -WorkingDirectory $RepoPath
$trigger = New-ScheduledTaskTrigger -Once -At $firstRun -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 50)
$description = "Runs OMEGA's proof-gated sovereign local AI evolution cycle every hour. Uses the local model host only; no paid external AI fallback is automatic."

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description $description -Force | Out-Null

Write-Host "Installed scheduled task: $TaskName"
Write-Host "Repository: $RepoPath"
Write-Host "Python: $PythonPath"
Write-Host "Cycle: $cycle"
Write-Host "First run: $firstRun"
Write-Host "Cadence: hourly at minute 37."
Write-Host "Local model endpoint defaults to http://127.0.0.1:11434 (Ollama-compatible)."
Write-Host "No OPENAI_API_KEY is required."
