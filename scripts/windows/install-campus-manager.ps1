param(
  [string]$ProjectRoot,
  [string]$InstallDir,
  [switch]$NoDesktopShortcut,
  [switch]$NoStartMenuShortcut
)

$ErrorActionPreference = "Stop"

function Resolve-DefaultProjectRoot {
  $repoCandidate = Resolve-Path (Join-Path $PSScriptRoot "..\..") -ErrorAction SilentlyContinue
  if ($repoCandidate -and (Test-Path -LiteralPath (Join-Path $repoCandidate "scripts\windows\campus-manager-app.ps1"))) {
    return $repoCandidate.Path
  }

  $cwd = (Get-Location).Path
  if (Test-Path -LiteralPath (Join-Path $cwd "scripts\windows\campus-manager-app.ps1")) {
    return $cwd
  }

  return ""
}

if (!$ProjectRoot) {
  $ProjectRoot = Resolve-DefaultProjectRoot
}

if (!$ProjectRoot) {
  throw "请提供 ProjectRoot，例如：.\install-campus-manager.ps1 -ProjectRoot C:\Users\你\Documents\校园项目\campus-match-dist"
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$AppScript = Join-Path $ProjectRoot "scripts\windows\campus-manager-app.ps1"
if (!(Test-Path -LiteralPath $AppScript)) {
  throw "这个目录不是校园匹配项目根目录：$ProjectRoot"
}

if (!$InstallDir) {
  $InstallDir = Join-Path $env:LOCALAPPDATA "CampusMatchManager"
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$ConfigDir = Join-Path $env:APPDATA "CampusMatchManager"
New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
Set-Content -Path (Join-Path $ConfigDir "project-root.txt") -Value $ProjectRoot -Encoding UTF8

$InstalledExe = Join-Path $InstallDir "校园匹配管理器.exe"
$PackagedExe = Join-Path $PSScriptRoot "校园匹配管理器.exe"

if (Test-Path -LiteralPath $PackagedExe) {
  Copy-Item -LiteralPath $PackagedExe -Destination $InstalledExe -Force
} else {
  $BuildScript = Join-Path $ProjectRoot "scripts\windows\build-campus-manager-exe.ps1"
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File $BuildScript -OutputPath $InstalledExe
}

function New-Shortcut {
  param(
    [string]$ShortcutPath,
    [string]$TargetPath,
    [string]$WorkingDirectory
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($ShortcutPath)
  $shortcut.TargetPath = $TargetPath
  $shortcut.WorkingDirectory = $WorkingDirectory
  $shortcut.Description = "校园匹配管理器"
  $shortcut.Save()
}

if (!$NoDesktopShortcut.IsPresent) {
  $DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "校园匹配管理器.lnk"
  New-Shortcut -ShortcutPath $DesktopShortcut -TargetPath $InstalledExe -WorkingDirectory $ProjectRoot
}

if (!$NoStartMenuShortcut.IsPresent) {
  $StartMenuDir = Join-Path ([Environment]::GetFolderPath("Programs")) "校园匹配"
  New-Item -ItemType Directory -Force -Path $StartMenuDir | Out-Null
  New-Shortcut -ShortcutPath (Join-Path $StartMenuDir "校园匹配管理器.lnk") -TargetPath $InstalledExe -WorkingDirectory $ProjectRoot
}

Write-Host "安装完成：$InstalledExe"
Write-Host "项目目录：$ProjectRoot"
Write-Host "配置文件：$(Join-Path $ConfigDir "project-root.txt")"
