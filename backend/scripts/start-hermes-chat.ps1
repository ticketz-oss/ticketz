param(
  [string]$HermesHome = (Join-Path $env:LOCALAPPDATA 'hermes')
)
$ErrorActionPreference = 'Stop'
$bridgePath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'hermes-chat-bridge.py'))
$privateEnvPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.env.hermes.local'))
if (!(Test-Path -LiteralPath $privateEnvPath)) { throw 'Configure backend/.env.hermes.local antes de iniciar.' }
foreach ($line in [System.IO.File]::ReadAllLines($privateEnvPath)) {
  if ($line -match '^(HERMES_CHAT_BRIDGE_KEY|HERMES_AGENT_TOOLS_URL)=(.+)$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
  }
}
if (!$env:HERMES_CHAT_BRIDGE_KEY -or $env:HERMES_CHAT_BRIDGE_KEY.Length -lt 32) { throw 'Chave local ausente ou inválida.' }
$listener = Get-NetTCPConnection -LocalPort 8643 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $existingBridge = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener[0].OwningProcess)"
  if ($existingBridge.CommandLine -like "*$bridgePath*") {
    Write-Output "Conexão Hermes já ativa na porta 8643 (PID $($existingBridge.ProcessId))."
    exit 0
  }
  throw 'Porta 8643 ocupada por outro processo.'
}
$python = Get-ChildItem -LiteralPath (Join-Path $HermesHome 'tools') -Directory |
  Where-Object { $_.Name -like 'python-*' } |
  ForEach-Object { Join-Path $_.FullName 'python.exe' } |
  Where-Object { Test-Path -LiteralPath $_ } |
  Select-Object -First 1
if (!$python) { throw 'Python do Hermes não encontrado.' }
$env:HERMES_CHAT_HOME = $HermesHome
$logPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.hermes-chat-bridge.log'))
$errorLogPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.hermes-chat-bridge.error.log'))
$bridgeProcess = Start-Process -FilePath $python -ArgumentList @('-I', ('"' + $bridgePath + '"')) -WindowStyle Hidden -PassThru -RedirectStandardOutput $logPath -RedirectStandardError $errorLogPath
Write-Output "Conexão Hermes iniciada (PID $($bridgeProcess.Id)), em 127.0.0.1:8643."
