param(
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$SourcePath = Join-Path $PSScriptRoot "CampusMatchManagerLauncher.cs"

if (!$OutputPath) {
  $OutputPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "校园匹配管理器.exe"
}

$CompilerCandidates = @(
  "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
  "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

$Compiler = $CompilerCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$Compiler) {
  throw "Cannot find csc.exe. .NET Framework compiler is required."
}

$OutputDir = Split-Path -Parent $OutputPath
if ($OutputDir) {
  New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

& $Compiler `
  /nologo `
  /target:winexe `
  /platform:anycpu `
  /codepage:65001 `
  /reference:System.Windows.Forms.dll `
  /out:$OutputPath `
  $SourcePath

if ($LASTEXITCODE -ne 0) {
  throw "Failed to build Campus Match Manager exe."
}

Write-Host "Built: $OutputPath"
