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

function Find-MySql {
  $known = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
  if (Test-Path -LiteralPath $known) {
    return $known
  }

  $command = Get-Command mysql.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "找不到 mysql.exe，请确认 MySQL Server 已安装。"
}

function New-AppPassword {
  $chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%+=".ToCharArray()
  -join (1..24 | ForEach-Object { $chars | Get-Random })
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

function Escape-SqlString {
  param([string]$Value)
  return $Value.Replace("\", "\\").Replace("'", "''")
}

function Set-EnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  $line = "$Key=$Value"
  if (!(Test-Path -LiteralPath $Path)) {
    Set-Content -LiteralPath $Path -Encoding UTF8 -Value $line
    return
  }

  $lines = [System.Collections.Generic.List[string]]::new()
  $found = $false
  foreach ($existing in Get-Content -LiteralPath $Path -Encoding UTF8) {
    if ($existing -match "^$([regex]::Escape($Key))=") {
      $lines.Add($line)
      $found = $true
    } else {
      $lines.Add($existing)
    }
  }
  if (!$found) {
    $lines.Add($line)
  }
  Set-Content -LiteralPath $Path -Encoding UTF8 -Value $lines
}

function Invoke-MySqlSql {
  param(
    [string]$MysqlExe,
    [string]$HostName,
    [string]$Port,
    [string]$RootPassword,
    [string]$Sql
  )

  $defaultsFile = [System.IO.Path]::GetTempFileName()
  try {
    @(
      "[client]",
      "host=$HostName",
      "port=$Port",
      "user=root",
      "password=$RootPassword",
      "default-character-set=utf8mb4"
    ) | Set-Content -LiteralPath $defaultsFile -Encoding ASCII

    $Sql | & $MysqlExe "--defaults-extra-file=$defaultsFile" "--binary-mode=1" "--default-character-set=utf8mb4"
    return $LASTEXITCODE
  } finally {
    Remove-Item -LiteralPath $defaultsFile -Force -ErrorAction SilentlyContinue
  }
}

function Update-WorkbenchShortcut {
  param(
    [string]$UserName,
    [string]$HostName,
    [string]$Port,
    [string]$Database
  )

  $workbench = "C:\Program Files\MySQL\MySQL Workbench 8.0 CE\MySQLWorkbench.exe"
  if (!(Test-Path -LiteralPath $workbench)) {
    return
  }

  $desktop = [Environment]::GetFolderPath("Desktop")
  $shortcutPath = Join-Path $desktop "校园项目数据库.lnk"
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $workbench
  $shortcut.Arguments = "--query `"mysql://$UserName@$HostName`:$Port/$Database`""
  $shortcut.WorkingDirectory = Split-Path $workbench
  $shortcut.IconLocation = "$workbench,0"
  $shortcut.Description = "打开校园匹配项目的本地 MySQL 数据库 $Database"
  $shortcut.Save()
}

try {
  $envValues = Read-EnvFile -Path $EnvFile
  $hostName = Get-EnvValueOrDefault -Values $envValues -Key "MYSQL_HOST" -DefaultValue "127.0.0.1"
  $port = Get-EnvValueOrDefault -Values $envValues -Key "MYSQL_PORT" -DefaultValue "3306"
  $database = Get-EnvValueOrDefault -Values $envValues -Key "MYSQL_DATABASE" -DefaultValue "campus_match"
  $appUser = "campus_app"
  $appPassword = New-AppPassword
  $mysqlExe = Find-MySql

  Write-Host "这个步骤会创建项目专用 MySQL 用户：$appUser" -ForegroundColor Cyan
  Write-Host "需要输入一次 MySQL root 密码。"
  $rootPassword = Read-SecretPlainText "MySQL root 密码"

  $safeDatabase = $database.Replace("`", "``")
  $safePassword = Escape-SqlString $appPassword
  $sql = @(
    "CREATE DATABASE IF NOT EXISTS $safeDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
    "CREATE USER IF NOT EXISTS '$appUser'@'127.0.0.1' IDENTIFIED BY '$safePassword';",
    "ALTER USER '$appUser'@'127.0.0.1' IDENTIFIED BY '$safePassword';",
    "CREATE USER IF NOT EXISTS '$appUser'@'localhost' IDENTIFIED BY '$safePassword';",
    "ALTER USER '$appUser'@'localhost' IDENTIFIED BY '$safePassword';",
    "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON $safeDatabase.* TO '$appUser'@'127.0.0.1';",
    "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON $safeDatabase.* TO '$appUser'@'localhost';",
    "FLUSH PRIVILEGES;"
  ) -join [Environment]::NewLine

  $exitCode = Invoke-MySqlSql -MysqlExe $mysqlExe -HostName $hostName -Port $port -RootPassword $rootPassword -Sql $sql
  if ($exitCode -ne 0) {
    throw "创建项目数据库用户失败，请确认 root 密码正确。"
  }

  Set-EnvValue -Path $EnvFile -Key "MYSQL_HOST" -Value $hostName
  Set-EnvValue -Path $EnvFile -Key "MYSQL_PORT" -Value $port
  Set-EnvValue -Path $EnvFile -Key "MYSQL_DATABASE" -Value $database
  Set-EnvValue -Path $EnvFile -Key "MYSQL_USER" -Value $appUser
  Set-EnvValue -Path $EnvFile -Key "MYSQL_PASSWORD" -Value $appPassword
  Update-WorkbenchShortcut -UserName $appUser -HostName $hostName -Port $port -Database $database

  $env:MYSQL_HOST = $hostName
  $env:MYSQL_PORT = $port
  $env:MYSQL_DATABASE = $database
  $env:MYSQL_USER = $appUser
  $env:MYSQL_PASSWORD = $appPassword
  & npm.cmd run sync:mysql -- --schema-only
  if ($LASTEXITCODE -ne 0) {
    throw "项目用户已创建，但初始化表结构失败。"
  }

  Write-Host ""
  Write-Host "项目数据库用户已创建，并已写入 .env.local。" -ForegroundColor Green
  Write-Host "用户名：$appUser"
  Write-Host "数据库：$database"
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


