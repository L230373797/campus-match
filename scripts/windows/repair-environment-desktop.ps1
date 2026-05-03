param(
  [switch]$NoOpen,
  [switch]$NoPause
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Desktop = [Environment]::GetFolderPath("Desktop")
$ProjectDesktopDir = Join-Path $Desktop "校园项目"
$BackupDir = Join-Path $ProjectDesktopDir "数据备份"
$InstallerDir = Join-Path $ProjectDesktopDir "安装包"
$ReportDir = Join-Path $ProjectDesktopDir "环境检查"
$ConfigDir = Join-Path $env:APPDATA "CampusMatchManager"
$ConfigFile = Join-Path $ConfigDir "project-root.txt"
$EnvFile = Join-Path $ProjectRoot ".env.local"
$EnvExample = Join-Path $ProjectRoot ".env.example"

$script:Rows = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [string]$Name,
    [string]$Level,
    [string]$Detail,
    [string]$Fix = ""
  )

  $script:Rows.Add([PSCustomObject]@{
    Name = $Name
    Level = $Level
    Detail = $Detail
    Fix = $Fix
  }) | Out-Null
}

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

function Get-MysqlCliPath {
  $candidates = @(
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  $command = Get-Command mysql.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  return ""
}

function Test-CommandVersion {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  $found = Get-Command $Command -ErrorAction SilentlyContinue
  if (!$found) {
    Add-Check $Command "FAIL" "找不到 $Command" "安装 Node.js 后重新打开管理器。"
    return
  }

  try {
    $version = (& $found.Source @Arguments 2>$null | Select-Object -First 1)
    Add-Check $Command "OK" "$Command 可用：$version"
  } catch {
    Add-Check $Command "WARN" "$Command 找到了，但读取版本失败：$($_.Exception.Message)"
  }
}

function Test-RequiredPath {
  param(
    [string]$Name,
    [string]$Path,
    [string]$Fix
  )

  if (Test-Path -LiteralPath $Path) {
    Add-Check $Name "OK" $Path
  } else {
    Add-Check $Name "FAIL" "缺少：$Path" $Fix
  }
}

function Get-PortOwner {
  param([int]$Port)

  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if (!$listener) {
    return $null
  }

  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)" -ErrorAction SilentlyContinue
  return [PSCustomObject]@{
    Port = $Port
    ProcessId = $listener.OwningProcess
    CommandLine = if ($process) { $process.CommandLine } else { "" }
  }
}

function Test-ProjectPort {
  param([int]$Port)

  $owner = Get-PortOwner $Port
  if (!$owner) {
    Add-Check "端口 $Port" "OK" "空闲"
    return
  }

  $escapedRoot = [regex]::Escape($ProjectRoot.Path)
  if ($owner.CommandLine -match $escapedRoot -or $owner.CommandLine -match "server/index\.mjs" -or $owner.CommandLine -match "vite.*--port $Port") {
    Add-Check "端口 $Port" "OK" "校园项目正在使用，PID $($owner.ProcessId)"
    return
  }

  Add-Check "端口 $Port" "WARN" "被其他进程占用，PID $($owner.ProcessId)" "如果本地网站启动失败，先关闭占用端口的程序。"
}

New-Item -ItemType Directory -Force -Path $ProjectDesktopDir, $BackupDir, $InstallerDir, $ReportDir, $ConfigDir | Out-Null
Set-Content -Path $ConfigFile -Value $ProjectRoot.Path -Encoding UTF8

Add-Check "桌面项目目录" "OK" "已确认：$ProjectDesktopDir"
Add-Check "管理器配置" "OK" "已写入：$ConfigFile"

Test-RequiredPath "项目根目录" $ProjectRoot.Path "重新克隆或恢复项目源码。"
Test-RequiredPath "package.json" (Join-Path $ProjectRoot "package.json") "确认当前目录是 campus-match-dist。"
Test-RequiredPath "react-src/package.json" (Join-Path $ProjectRoot "react-src\package.json") "确认前端源码目录完整。"
Test-RequiredPath "netlify.toml" (Join-Path $ProjectRoot "netlify.toml") "恢复 Netlify 配置文件。"
Test-RequiredPath "Netlify Functions" (Join-Path $ProjectRoot "netlify\functions") "恢复 netlify/functions 目录。"

Test-CommandVersion "node" @("--version")
Test-CommandVersion "npm" @("--version")

if (Test-Path -LiteralPath (Join-Path $ProjectRoot "node_modules")) {
  Add-Check "根依赖" "OK" "node_modules 已存在"
} else {
  Add-Check "根依赖" "WARN" "缺少根目录 node_modules" "在项目根目录运行 npm install。"
}

if (Test-Path -LiteralPath (Join-Path $ProjectRoot "react-src\node_modules")) {
  Add-Check "前端依赖" "OK" "react-src/node_modules 已存在"
} else {
  Add-Check "前端依赖" "WARN" "缺少 react-src/node_modules" "运行 npm --prefix react-src install。"
}

if (!(Test-Path -LiteralPath $EnvFile)) {
  if (Test-Path -LiteralPath $EnvExample) {
    Copy-Item -LiteralPath $EnvExample -Destination $EnvFile -Force
    Add-Check ".env.local" "WARN" "已从 .env.example 创建 .env.local" "请补齐 MySQL、QQ SMTP 和管理员密码。"
  } else {
    Add-Check ".env.local" "FAIL" "缺少 .env.local，也找不到 .env.example" "恢复环境变量文件。"
  }
} else {
  Add-Check ".env.local" "OK" "已存在：$EnvFile"
}

$envValues = Read-EnvFile $EnvFile
$requiredEnvKeys = @("MYSQL_HOST", "MYSQL_PORT", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD")
foreach ($key in $requiredEnvKeys) {
  $value = $envValues[$key]
  if (!$value -or $value -like "replace-with-*") {
    Add-Check "环境变量 $key" "FAIL" "缺少或仍是占位值" "打开 .env.local 补齐 $key。"
  } else {
    Add-Check "环境变量 $key" "OK" "已配置"
  }
}

foreach ($key in @("SMTP_HOST", "QQ_SMTP_USER", "QQ_SMTP_AUTH_CODE")) {
  $value = $envValues[$key]
  if (!$value) {
    Add-Check "邮件配置 $key" "WARN" "未配置" "如果要真实发送 QQ 邮箱验证码，请补齐 $key。"
  } else {
    Add-Check "邮件配置 $key" "OK" "已配置"
  }
}

$mysqlPath = Get-MysqlCliPath
if (!$mysqlPath) {
  Add-Check "mysql.exe" "FAIL" "找不到 MySQL 命令行工具" "确认 MySQL Server 8.0 已安装。"
} else {
  Add-Check "mysql.exe" "OK" $mysqlPath
}

if ($mysqlPath -and $envValues["MYSQL_PASSWORD"]) {
  $previousMysqlPassword = $env:MYSQL_PWD
  $errorFile = [IO.Path]::GetTempFileName()
  try {
    $env:MYSQL_PWD = $envValues["MYSQL_PASSWORD"]
    $args = @(
      "--host=$($envValues["MYSQL_HOST"])",
      "--port=$($envValues["MYSQL_PORT"])",
      "--user=$($envValues["MYSQL_USER"])",
      "--database=$($envValues["MYSQL_DATABASE"])",
      "--batch",
      "--skip-column-names",
      "--execute=SELECT 1;"
    )
    $output = & $mysqlPath @args 2>$errorFile
    if ($LASTEXITCODE -eq 0 -and (($output -join " ").Trim() -eq "1")) {
      Add-Check "MySQL 连接" "OK" "可以连接 $($envValues["MYSQL_DATABASE"])"
    } else {
      $errorText = (Get-Content -LiteralPath $errorFile -Raw -ErrorAction SilentlyContinue).Trim()
      Add-Check "MySQL 连接" "FAIL" "连接失败：$errorText" "检查 MySQL 服务是否启动、用户密码和数据库是否存在。"
    }
  } catch {
    Add-Check "MySQL 连接" "FAIL" $_.Exception.Message "检查 .env.local 和 MySQL 服务。"
  } finally {
    if ($null -eq $previousMysqlPassword) {
      Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    } else {
      $env:MYSQL_PWD = $previousMysqlPassword
    }
    Remove-Item -LiteralPath $errorFile -Force -ErrorAction SilentlyContinue
  }
}

Test-ProjectPort 3000
Test-ProjectPort 3138

$openClaw = Get-PortOwner 18789
if ($openClaw) {
  Add-Check "OpenClaw 网关" "OK" "18789 正在独立运行，PID $($openClaw.ProcessId)"
} else {
  Add-Check "OpenClaw 网关" "WARN" "18789 未运行" "这是独立工具服务，不属于校园项目；需要时单独启动 OpenClaw。"
}

if (Test-Path -LiteralPath (Join-Path $ProjectRoot ".netlify\state.json")) {
  Add-Check "Netlify 站点链接" "OK" ".netlify/state.json 已存在"
} else {
  Add-Check "Netlify 站点链接" "WARN" "未发现 .netlify/state.json" "如需部署，运行 netlify link 或使用现有 GitHub/Netlify 绑定。"
}

if (Test-Path -LiteralPath (Join-Path $ProjectRoot "node_modules\.bin\netlify.cmd")) {
  Add-Check "Netlify CLI" "OK" "项目本地 netlify-cli 已安装"
} else {
  Add-Check "Netlify CLI" "WARN" "未发现 node_modules/.bin/netlify.cmd" "在项目根目录运行 npm install。"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = Join-Path $ReportDir "环境检查-$stamp.txt"
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("校园匹配环境检查")
$lines.Add("生成时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")")
$lines.Add("项目目录：$($ProjectRoot.Path)")
$lines.Add("")

foreach ($row in $script:Rows) {
  $lines.Add("[$($row.Level)] $($row.Name)")
  $lines.Add("  结果：$($row.Detail)")
  if ($row.Fix) {
    $lines.Add("  建议：$($row.Fix)")
  }
  $lines.Add("")
}

$failCount = @($script:Rows | Where-Object { $_.Level -eq "FAIL" }).Count
$warnCount = @($script:Rows | Where-Object { $_.Level -eq "WARN" }).Count
$okCount = @($script:Rows | Where-Object { $_.Level -eq "OK" }).Count

$lines.Add("汇总：OK $okCount / WARN $warnCount / FAIL $failCount")
Set-Content -Path $reportPath -Value $lines -Encoding UTF8

Write-Host "环境检查完成：OK $okCount / WARN $warnCount / FAIL $failCount" -ForegroundColor Cyan
Write-Host "报告文件：$reportPath" -ForegroundColor Green

if (!$NoOpen.IsPresent) {
  Start-Process notepad.exe -ArgumentList $reportPath
}

if (!$NoPause.IsPresent) {
  Write-Host ""
  Write-Host "按任意键关闭窗口..."
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
