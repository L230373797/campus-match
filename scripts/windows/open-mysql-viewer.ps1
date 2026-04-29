param(
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$EnvFile = Join-Path $ProjectRoot ".env.local"
$HeidiPath = Join-Path $env:LOCALAPPDATA "Programs\HeidiSQL\heidisql.exe"

function Read-EnvFile {
  param([string]$Path)
  $values = @{}
  if (!(Test-Path -LiteralPath $Path)) {
    return $values
  }

  foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
    $trimmed = $line.Trim()
    if (!$trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $match = [regex]::Match($trimmed, "^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")
    if (!$match.Success) {
      continue
    }

    $value = $match.Groups[2].Value.Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $values[$match.Groups[1].Value] = $value
  }
  return $values
}

function Quote-ProcessArgument {
  param([string]$Value)
  if ($Value -notmatch '[\s"]') {
    return $Value
  }
  return '"' + $Value.Replace('"', '\"') + '"'
}

$envValues = Read-EnvFile -Path $EnvFile
$hostName = $envValues["MYSQL_HOST"]
$port = $envValues["MYSQL_PORT"]
$database = $envValues["MYSQL_DATABASE"]
$user = $envValues["MYSQL_USER"]
$password = $envValues["MYSQL_PASSWORD"]

if (!$hostName) { $hostName = "127.0.0.1" }
if (!$port) { $port = "3306" }
if (!$database) { $database = "campus_match" }
if (!$user) { $user = "campus_app" }

if (!$password) {
  throw "MYSQL_PASSWORD is missing in .env.local. Run the desktop MySQL setup shortcut or update .env.local first."
}

if (!(Test-Path -LiteralPath $HeidiPath)) {
  throw "HeidiSQL was not found: $HeidiPath"
}

Write-Host "Database connection:" -ForegroundColor Cyan
Write-Host "  Host: $hostName"
Write-Host "  Port: $port"
Write-Host "  Database: $database"
Write-Host "  User: $user"

if ($CheckOnly.IsPresent) {
  Write-Host "Viewer config OK." -ForegroundColor Green
  exit 0
}

$arguments = @(
  "-d=CampusMatchDB",
  "-n=0",
  "-h=$hostName",
  "-u=$user",
  "-p=$password",
  "-P=$port",
  "-db=$database"
) | ForEach-Object { Quote-ProcessArgument $_ }

Start-Process -FilePath $HeidiPath -ArgumentList ($arguments -join " ") -WorkingDirectory (Split-Path $HeidiPath)
