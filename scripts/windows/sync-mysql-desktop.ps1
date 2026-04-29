param(
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$EnvFile = Join-Path $ProjectRoot ".env.local"

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

function Invoke-MysqlSync {
  Write-Host ""
  Write-Host "正在同步网站数据到 MySQL..." -ForegroundColor Cyan
  & npm.cmd run sync:mysql
  return $LASTEXITCODE
}

try {
  $envValues = Read-EnvFile -Path $EnvFile
  foreach ($key in $envValues.Keys) {
    [Environment]::SetEnvironmentVariable($key, $envValues[$key], "Process")
  }

  $exitCode = Invoke-MysqlSync
  if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "第一次连接 MySQL 没成功。请输入 MySQL 密码后我再试一次。" -ForegroundColor Yellow
    $env:MYSQL_PASSWORD = Read-SecretPlainText "MySQL 密码"
    $exitCode = Invoke-MysqlSync
  }

  if ($exitCode -ne 0) {
    throw "MySQL 同步失败，请检查密码、MySQL 服务和 .env.local 配置。"
  }

  Write-Host ""
  Write-Host "同步完成。现在可以用桌面的“校园项目数据库”打开 Workbench 查看 campus_match。" -ForegroundColor Green
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


