param(
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$EnvFile = Join-Path $ProjectRoot ".env.local"
$Desktop = [Environment]::GetFolderPath("Desktop")
$BackupDir = Join-Path $Desktop "campus-match-db-backups"

Set-Location $ProjectRoot

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

function Read-SecretPlainText {
  param([string]$Prompt)
  $secure = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Find-MySqlDump {
  $known = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
  if (Test-Path -LiteralPath $known) {
    return $known
  }

  $command = Get-Command mysqldump.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "找不到 mysqldump.exe，请确认 MySQL Server 已安装。"
}

function Get-EnvValueOrDefault {
  param(
    [hashtable]$Values,
    [string]$Key,
    [string]$DefaultValue
  )

  if ($Values.ContainsKey($Key) -and $Values[$Key]) {
    return $Values[$Key]
  }
  return $DefaultValue
}

function Invoke-Backup {
  param(
    [string]$DumpExe,
    [string]$HostName,
    [string]$Port,
    [string]$UserName,
    [string]$Password,
    [string]$Database,
    [string]$OutputFile
  )

  $defaultsFile = [System.IO.Path]::GetTempFileName()
  try {
    @(
      "[client]",
      "host=$HostName",
      "port=$Port",
      "user=$UserName",
      "password=$Password",
      "default-character-set=utf8mb4"
    ) | Set-Content -LiteralPath $defaultsFile -Encoding ASCII

    & $DumpExe "--defaults-extra-file=$defaultsFile" "--single-transaction" "--routines" "--events" "--databases" $Database "--result-file=$OutputFile"
    return $LASTEXITCODE
  } finally {
    Remove-Item -LiteralPath $defaultsFile -Force -ErrorAction SilentlyContinue
  }
}

try {
  $envValues = Read-EnvFile -Path $EnvFile
  $hostName = Get-EnvValueOrDefault -Values $envValues -Key "MYSQL_HOST" -DefaultValue "127.0.0.1"
  $port = Get-EnvValueOrDefault -Values $envValues -Key "MYSQL_PORT" -DefaultValue "3306"
  $userName = Get-EnvValueOrDefault -Values $envValues -Key "MYSQL_USER" -DefaultValue "root"
  $password = $envValues["MYSQL_PASSWORD"]
  $database = Get-EnvValueOrDefault -Values $envValues -Key "MYSQL_DATABASE" -DefaultValue "campus_match"
  $dumpExe = Find-MySqlDump

  New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $outputFile = Join-Path $BackupDir "$database-$stamp.sql"

  Write-Host "正在备份 MySQL 数据库 $database..." -ForegroundColor Cyan
  $exitCode = Invoke-Backup -DumpExe $dumpExe -HostName $hostName -Port $port -UserName $userName -Password $password -Database $database -OutputFile $outputFile
  if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "第一次备份没成功。请输入 MySQL 密码后我再试一次。" -ForegroundColor Yellow
    $password = Read-SecretPlainText "MySQL 密码"
    $exitCode = Invoke-Backup -DumpExe $dumpExe -HostName $hostName -Port $port -UserName $userName -Password $password -Database $database -OutputFile $outputFile
  }

  if ($exitCode -ne 0) {
    throw "数据库备份失败，请检查密码和 MySQL 服务。"
  }

  Write-Host ""
  Write-Host "备份完成：$outputFile" -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host $_ -ForegroundColor Red
  exit 1
} finally {
  if (!$NoPause.IsPresent) {
    Write-Host ""
    Read-Host "按 Enter 关闭窗口"
  }
}


