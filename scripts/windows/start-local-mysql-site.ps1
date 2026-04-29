param(
  [int]$Port = 3138
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Url = "http://127.0.0.1:$Port/login"

Set-Location $ProjectRoot
$env:HOST = "127.0.0.1"
$env:PORT = "$Port"

Write-Host ""
Write-Host "正在启动校园匹配本地 MySQL 版..." -ForegroundColor Cyan
Write-Host "网站地址：$Url" -ForegroundColor Green
Write-Host "数据库配置会从 .env.local 读取。关闭这个窗口后，本地网站也会停止。" -ForegroundColor Yellow
Write-Host ""

Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command", "Start-Sleep -Seconds 3; Start-Process '$Url'"
) | Out-Null

& npm.cmd run standalone
