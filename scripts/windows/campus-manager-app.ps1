param(
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Desktop = [Environment]::GetFolderPath("Desktop")
$BackupDir = Join-Path $Desktop "campus-match-db-backups"
$ArchiveDir = Join-Path $Desktop "校园项目\归档"
$OnlineBase = "https://campus-match-sansui.netlify.app"
$LocalBase = "http://127.0.0.1:3138"

function Open-Url {
  param([string]$Url)
  Start-Process $Url
}

function Open-Folder {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
  Start-Process explorer.exe -ArgumentList $Path
}

function Start-ProjectScript {
  param([string]$RelativePath)
  $scriptPath = Join-Path $ProjectRoot $RelativePath
  Start-Process powershell.exe -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $scriptPath
  ) -WorkingDirectory $ProjectRoot -WindowStyle Hidden
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

function Format-FileSize {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return "{0:N2} GB" -f ($Bytes / 1GB) }
  if ($Bytes -ge 1MB) { return "{0:N2} MB" -f ($Bytes / 1MB) }
  if ($Bytes -ge 1KB) { return "{0:N1} KB" -f ($Bytes / 1KB) }
  return "$Bytes B"
}

function Get-LocalSiteSummary {
  try {
    $response = Invoke-RestMethod -Uri "$LocalBase/api/health" -TimeoutSec 2
    if ($response.success -eq $true -and $response.data.status -eq "ok") {
      return @{ Level = "OK"; Text = "本地网站正常运行：127.0.0.1:3138" }
    }
    return @{ Level = "WARN"; Text = "本地网站返回异常" }
  } catch {
    return @{ Level = "WARN"; Text = "本地网站未启动：127.0.0.1:3138" }
  }
}

function Get-OnlineSiteSummary {
  try {
    $response = Invoke-RestMethod -Uri "$OnlineBase/api/health" -TimeoutSec 6
    if ($response.success -eq $true -and $response.data.status -eq "ok") {
      return @{ Level = "OK"; Text = "线上网站正常：campus-match-sansui.netlify.app" }
    }
    return @{ Level = "WARN"; Text = "线上网站返回异常" }
  } catch {
    return @{ Level = "WARN"; Text = "线上网站暂时无法访问：$($_.Exception.Message)" }
  }
}

function Get-DatabaseSummary {
  $envValues = Read-EnvFile -Path (Join-Path $ProjectRoot ".env.local")
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
    return @{ Level = "FAIL"; Text = "本地 .env.local 缺少 MySQL 密码" }
  }

  $mysqlPath = Get-MysqlCliPath
  if (!$mysqlPath) {
    return @{ Level = "FAIL"; Text = "找不到 mysql.exe" }
  }

  $errorFile = [IO.Path]::GetTempFileName()
  $previousMysqlPassword = $env:MYSQL_PWD
  try {
    $env:MYSQL_PWD = $password
    $query = "SELECT (SELECT COUNT(*) FROM users), (SELECT COUNT(*) FROM matches), (SELECT COUNT(*) FROM messages);"
    $args = @(
      "--host=$hostName",
      "--port=$port",
      "--user=$user",
      "--database=$database",
      "--batch",
      "--skip-column-names",
      "--execute=$query"
    )
    $output = & $mysqlPath @args 2>$errorFile
    if ($LASTEXITCODE -ne 0) {
      $errorText = (Get-Content -LiteralPath $errorFile -Raw -ErrorAction SilentlyContinue).Trim()
      if (!$errorText) { $errorText = "Exit code $LASTEXITCODE" }
      return @{ Level = "FAIL"; Text = "数据库连接失败：$errorText" }
    }

    $values = (($output -join " ").Trim() -split "\s+") | Where-Object { $_ -ne "" }
    if ($values.Count -lt 3) {
      return @{ Level = "WARN"; Text = "数据库已连接，但统计读取异常" }
    }

    return @{ Level = "OK"; Text = "MySQL 正常：用户 $($values[0]) / 匹配 $($values[1]) / 消息 $($values[2])" }
  } catch {
    return @{ Level = "FAIL"; Text = "数据库连接失败：$($_.Exception.Message)" }
  } finally {
    if ($null -eq $previousMysqlPassword) {
      Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    } else {
      $env:MYSQL_PWD = $previousMysqlPassword
    }
    Remove-Item -LiteralPath $errorFile -Force -ErrorAction SilentlyContinue
  }
}

function Get-LatestBackupSummary {
  if (!(Test-Path -LiteralPath $BackupDir)) {
    return @{ Level = "WARN"; Text = "还没有备份目录" }
  }

  $latest = Get-ChildItem -LiteralPath $BackupDir -Filter "*.sql" -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (!$latest) {
    return @{ Level = "WARN"; Text = "还没有数据库备份文件" }
  }

  $age = New-TimeSpan -Start $latest.LastWriteTime -End (Get-Date)
  $text = "最近备份：$($latest.LastWriteTime.ToString("yyyy-MM-dd HH:mm"))  $($latest.Name)  $(Format-FileSize $latest.Length)"
  if ($age.TotalDays -gt 7) {
    return @{ Level = "WARN"; Text = $text }
  }
  return @{ Level = "OK"; Text = $text }
}

function Get-GitSummary {
  try {
    $status = (& git -C $ProjectRoot status --short 2>$null) -join "`n"
    if ($LASTEXITCODE -ne 0) {
      return @{ Level = "WARN"; Text = "无法读取 Git 状态" }
    }
    if ($status.Trim()) {
      return @{ Level = "WARN"; Text = "本地有未提交改动" }
    }

    & git -C $ProjectRoot fetch --quiet origin netlify-current-source 2>$null
    $localHead = (& git -C $ProjectRoot rev-parse HEAD).Trim()
    $remoteHead = (& git -C $ProjectRoot rev-parse origin/netlify-current-source).Trim()
    if ($localHead -ne $remoteHead) {
      return @{ Level = "WARN"; Text = "本地和 GitHub 当前分支不一致" }
    }
    return @{ Level = "OK"; Text = "GitHub 已同步：netlify-current-source" }
  } catch {
    return @{ Level = "WARN"; Text = "无法检查 GitHub：$($_.Exception.Message)" }
  }
}

function Get-HealthSummaries {
  return @(
    @{ Name = "线上"; Result = Get-OnlineSiteSummary },
    @{ Name = "本地"; Result = Get-LocalSiteSummary },
    @{ Name = "数据库"; Result = Get-DatabaseSummary },
    @{ Name = "备份"; Result = Get-LatestBackupSummary },
    @{ Name = "GitHub"; Result = Get-GitSummary }
  )
}

$Actions = @(
  @{ Group = "网站入口"; Label = "线上用户端"; Hint = "$OnlineBase/login"; Run = { Open-Url "$OnlineBase/login" } },
  @{ Group = "网站入口"; Label = "线上管理端"; Hint = "$OnlineBase/admin.html"; Run = { Open-Url "$OnlineBase/admin.html" } },
  @{ Group = "网站入口"; Label = "本地用户端"; Hint = "$LocalBase/login"; Run = { Open-Url "$LocalBase/login" } },
  @{ Group = "网站入口"; Label = "本地管理端"; Hint = "$LocalBase/admin.html"; Run = { Open-Url "$LocalBase/admin.html" } },
  @{ Group = "本地服务"; Label = "启动本地网站"; Hint = "启动 Vite + 本地 API"; Run = { Start-ProjectScript "scripts\windows\start-local-mysql-site.ps1" } },
  @{ Group = "本地服务"; Label = "一键体检"; Hint = "检查网站、数据库、备份、GitHub"; Run = { Show-HealthDialog } },
  @{ Group = "本地服务"; Label = "打开 MySQL"; Hint = "使用 HeidiSQL 查看本地数据库"; Run = { Start-ProjectScript "scripts\windows\open-mysql-viewer.ps1" } },
  @{ Group = "本地服务"; Label = "同步线上数据"; Hint = "把线上数据同步到本地 MySQL"; Run = { Start-ProjectScript "scripts\windows\sync-mysql-desktop.ps1" } },
  @{ Group = "数据文件"; Label = "备份数据库"; Hint = "生成新的 .sql 备份"; Run = { Start-ProjectScript "scripts\windows\backup-mysql-desktop.ps1" } },
  @{ Group = "数据文件"; Label = "打开备份目录"; Hint = $BackupDir; Run = { Open-Folder $BackupDir } },
  @{ Group = "数据文件"; Label = "打开归档目录"; Hint = $ArchiveDir; Run = { Open-Folder $ArchiveDir } },
  @{ Group = "数据文件"; Label = "源码文件夹"; Hint = $ProjectRoot.Path; Run = { Open-Folder $ProjectRoot.Path } },
  @{ Group = "云端管理"; Label = "GitHub 当前分支"; Hint = "netlify-current-source"; Run = { Open-Url "https://github.com/L230373797/campus-match/tree/netlify-current-source" } },
  @{ Group = "云端管理"; Label = "Netlify 后台"; Hint = "campus-match-sansui"; Run = { Open-Url "https://app.netlify.com/projects/campus-match-sansui" } },
  @{ Group = "云端管理"; Label = "线上部署记录"; Hint = "Netlify deploys"; Run = { Open-Url "https://app.netlify.com/projects/campus-match-sansui/deploys" } },
  @{ Group = "云端管理"; Label = "运营说明"; Hint = "OPERATOR-GUIDE.md"; Run = { Start-Process notepad.exe -ArgumentList (Join-Path $ProjectRoot "OPERATOR-GUIDE.md") } }
)

if ($CheckOnly.IsPresent) {
  Write-Host "Campus manager app OK."
  Write-Host "Project root: $ProjectRoot"
  Write-Host "Actions: $($Actions.Count)"
  foreach ($item in Get-HealthSummaries) {
    Write-Host "[$($item.Result.Level)] $($item.Name): $($item.Result.Text)"
  }
  exit 0
}

if ([Threading.Thread]::CurrentThread.ApartmentState -ne "STA") {
  Start-Process powershell.exe -ArgumentList @(
    "-NoProfile",
    "-STA",
    "-ExecutionPolicy", "Bypass",
    "-File", $PSCommandPath
  ) -WorkingDirectory $ProjectRoot
  exit 0
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object System.Windows.Forms.Form
$form.Text = "校园匹配管理器"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object System.Drawing.Size(960, 760)
$form.MinimumSize = New-Object System.Drawing.Size(900, 700)
$form.BackColor = [System.Drawing.Color]::FromArgb(9, 17, 30)

$fontTitle = New-Object System.Drawing.Font("Microsoft YaHei UI", 22, [System.Drawing.FontStyle]::Bold)
$fontBody = New-Object System.Drawing.Font("Microsoft YaHei UI", 10)
$fontSmall = New-Object System.Drawing.Font("Microsoft YaHei UI", 9)
$fontButton = New-Object System.Drawing.Font("Microsoft YaHei UI", 10, [System.Drawing.FontStyle]::Bold)
$fontGroup = New-Object System.Drawing.Font("Microsoft YaHei UI", 12, [System.Drawing.FontStyle]::Bold)

$title = New-Object System.Windows.Forms.Label
$title.Text = "校园匹配管理器"
$title.Font = $fontTitle
$title.ForeColor = [System.Drawing.Color]::White
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(28, 24)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "把线上后台、本地服务、MySQL、备份、源码和云端入口都收在这里。"
$subtitle.Font = $fontBody
$subtitle.ForeColor = [System.Drawing.Color]::FromArgb(190, 205, 225)
$subtitle.AutoSize = $true
$subtitle.Location = New-Object System.Drawing.Point(32, 70)
$form.Controls.Add($subtitle)

$refreshButton = New-Object System.Windows.Forms.Button
$refreshButton.Text = "刷新状态"
$refreshButton.Font = $fontButton
$refreshButton.Size = New-Object System.Drawing.Size(106, 34)
$refreshButton.Location = New-Object System.Drawing.Point(810, 30)
$refreshButton.BackColor = [System.Drawing.Color]::FromArgb(218, 234, 255)
$refreshButton.ForeColor = [System.Drawing.Color]::FromArgb(5, 15, 28)
$refreshButton.FlatStyle = "Flat"
$form.Controls.Add($refreshButton)

$statusPanel = New-Object System.Windows.Forms.FlowLayoutPanel
$statusPanel.Location = New-Object System.Drawing.Point(30, 108)
$statusPanel.Size = New-Object System.Drawing.Size(886, 132)
$statusPanel.BackColor = [System.Drawing.Color]::Transparent
$statusPanel.FlowDirection = "LeftToRight"
$statusPanel.WrapContents = $true
$form.Controls.Add($statusPanel)

$contentPanel = New-Object System.Windows.Forms.Panel
$contentPanel.Location = New-Object System.Drawing.Point(30, 260)
$contentPanel.Size = New-Object System.Drawing.Size(886, 398)
$contentPanel.BackColor = [System.Drawing.Color]::Transparent
$contentPanel.Anchor = "Top,Bottom,Left,Right"
$form.Controls.Add($contentPanel)

$footer = New-Object System.Windows.Forms.Label
$footer.Text = "Ready."
$footer.Font = $fontSmall
$footer.ForeColor = [System.Drawing.Color]::FromArgb(160, 175, 198)
$footer.AutoSize = $false
$footer.Size = New-Object System.Drawing.Size(880, 26)
$footer.Location = New-Object System.Drawing.Point(34, 682)
$footer.Anchor = "Bottom,Left,Right"
$form.Controls.Add($footer)

$toolTip = New-Object System.Windows.Forms.ToolTip
$toolTip.AutoPopDelay = 10000
$toolTip.InitialDelay = 350
$toolTip.ReshowDelay = 150

function StatusColor {
  param([string]$Level)
  if ($Level -eq "OK") { return [System.Drawing.Color]::FromArgb(50, 210, 145) }
  if ($Level -eq "FAIL") { return [System.Drawing.Color]::FromArgb(255, 98, 116) }
  return [System.Drawing.Color]::FromArgb(255, 198, 85)
}

function Refresh-StatusCards {
  $statusPanel.Controls.Clear()
  foreach ($item in Get-HealthSummaries) {
    $card = New-Object System.Windows.Forms.Panel
    $card.Size = New-Object System.Drawing.Size(276, 58)
    $card.Margin = New-Object System.Windows.Forms.Padding(0, 0, 16, 14)
    $card.BackColor = [System.Drawing.Color]::FromArgb(25, 37, 54)
    $statusPanel.Controls.Add($card)

    $dot = New-Object System.Windows.Forms.Label
    $dot.Text = "●"
    $dot.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 11, [System.Drawing.FontStyle]::Bold)
    $dot.ForeColor = StatusColor $item.Result.Level
    $dot.AutoSize = $true
    $dot.Location = New-Object System.Drawing.Point(12, 10)
    $card.Controls.Add($dot)

    $name = New-Object System.Windows.Forms.Label
    $name.Text = "$($item.Name)  [$($item.Result.Level)]"
    $name.Font = $fontButton
    $name.ForeColor = [System.Drawing.Color]::White
    $name.AutoSize = $true
    $name.Location = New-Object System.Drawing.Point(34, 9)
    $card.Controls.Add($name)

    $detail = New-Object System.Windows.Forms.Label
    $detail.Text = $item.Result.Text
    $detail.Font = $fontSmall
    $detail.ForeColor = [System.Drawing.Color]::FromArgb(180, 196, 218)
    $detail.AutoEllipsis = $true
    $detail.AutoSize = $false
    $detail.Size = New-Object System.Drawing.Size(226, 22)
    $detail.Location = New-Object System.Drawing.Point(34, 31)
    $toolTip.SetToolTip($detail, $item.Result.Text)
    $card.Controls.Add($detail)
  }
  $footer.Text = "状态已更新：" + (Get-Date).ToString("HH:mm:ss")
}

function Show-HealthDialog {
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("体检结果")
  $lines.Add("")
  foreach ($item in Get-HealthSummaries) {
    $lines.Add("[$($item.Result.Level)] $($item.Name) - $($item.Result.Text)")
  }

  [System.Windows.Forms.MessageBox]::Show(
    ($lines -join [Environment]::NewLine),
    "校园匹配体检",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  ) | Out-Null
  Refresh-StatusCards
}

function Add-Group {
  param([string]$GroupName, [int]$Column, [int]$Row)

  $panel = New-Object System.Windows.Forms.Panel
  $panel.Size = New-Object System.Drawing.Size(426, 178)
  $panel.Location = New-Object System.Drawing.Point(($Column * 458), ($Row * 204))
  $panel.BackColor = [System.Drawing.Color]::FromArgb(18, 29, 45)
  $contentPanel.Controls.Add($panel)

  $label = New-Object System.Windows.Forms.Label
  $label.Text = $GroupName
  $label.Font = $fontGroup
  $label.ForeColor = [System.Drawing.Color]::White
  $label.AutoSize = $true
  $label.Location = New-Object System.Drawing.Point(16, 14)
  $panel.Controls.Add($label)

  return $panel
}

function Add-ActionButton {
  param(
    [System.Windows.Forms.Panel]$Panel,
    [hashtable]$Action,
    [int]$Index
  )

  $column = $Index % 2
  $row = [Math]::Floor($Index / 2)
  $button = New-Object System.Windows.Forms.Button
  $button.Text = $Action.Label
  $button.Font = $fontButton
  $button.ForeColor = [System.Drawing.Color]::FromArgb(4, 15, 28)
  $button.BackColor = [System.Drawing.Color]::FromArgb(226, 239, 255)
  $button.FlatStyle = "Flat"
  $button.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(118, 200, 255)
  $button.Size = New-Object System.Drawing.Size(184, 38)
  $button.Location = New-Object System.Drawing.Point((16 + $column * 206), (52 + $row * 48))
  $toolTip.SetToolTip($button, $Action.Hint)
  $button.Add_Click({
    try {
      $footer.Text = "正在执行：" + $Action.Label
      & $Action.Run
      $footer.Text = "已打开：" + $Action.Label
    } catch {
      $footer.Text = "执行失败：" + $_.Exception.Message
      [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "执行失败", "OK", "Error") | Out-Null
    }
  }.GetNewClosure())
  $Panel.Controls.Add($button)
}

$groupOrder = @("网站入口", "本地服务", "数据文件", "云端管理")
$groupPanels = @{}
for ($i = 0; $i -lt $groupOrder.Count; $i++) {
  $groupPanels[$groupOrder[$i]] = Add-Group -GroupName $groupOrder[$i] -Column ($i % 2) -Row ([Math]::Floor($i / 2))
}

foreach ($groupName in $groupOrder) {
  $items = @($Actions | Where-Object { $_.Group -eq $groupName })
  for ($i = 0; $i -lt $items.Count; $i++) {
    Add-ActionButton -Panel $groupPanels[$groupName] -Action $items[$i] -Index $i
  }
}

$refreshButton.Add_Click({ Refresh-StatusCards })
$form.Add_Shown({ Refresh-StatusCards })

[void]$form.ShowDialog()
