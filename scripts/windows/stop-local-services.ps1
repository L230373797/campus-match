param(
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

function Stop-ProcessIfAlive {
  param([int]$ProcessId)

  if ($ProcessId -eq $PID) {
    return
  }

  $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  }
}

$targetPids = New-Object System.Collections.Generic.HashSet[int]

foreach ($port in @(3000, 3138, 18789)) {
  Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object { [void]$targetPids.Add([int]$_.OwningProcess) }
}

$escapedRoot = [regex]::Escape($ProjectRoot.Path)
$processes = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match '^(cmd|node|npm|netlify)\.exe$' -and (
    $_.CommandLine -match $escapedRoot -or
    $_.CommandLine -match 'server/index\.mjs' -or
    $_.CommandLine -match 'vite.*--port 3138' -or
    $_.CommandLine -match 'openclaw.*gateway' -or
    $_.CommandLine -match 'gateway --port 18789'
  )
}

foreach ($process in $processes) {
  [void]$targetPids.Add([int]$process.ProcessId)
}

$stopped = 0
foreach ($targetPid in @($targetPids)) {
  Stop-ProcessIfAlive -ProcessId $targetPid
  $stopped += 1
}

Start-Sleep -Milliseconds 600

$remainingPorts = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -in @(3000, 3138, 18789) }

if ($remainingPorts) {
  Write-Host "仍有服务占用端口：" -ForegroundColor Yellow
  $remainingPorts | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize
} else {
  Write-Host "本地网站、接口和 OpenClaw 网关已停止。" -ForegroundColor Green
}

if (!$NoPause.IsPresent) {
  Write-Host ""
  Write-Host "按任意键关闭窗口..."
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
