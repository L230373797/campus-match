param(
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

function Decode-Text {
  param([string]$Base64)
  return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Base64))
}

function Start-ProjectScript {
  param([string]$RelativePath)
  $scriptPath = Join-Path $ProjectRoot $RelativePath
  Start-Process powershell.exe -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $scriptPath
  ) -WorkingDirectory $ProjectRoot
}

function Open-Url {
  param([string]$Url)
  Start-Process $Url
}

function Open-Folder {
  param([string]$Path)
  Start-Process explorer.exe -ArgumentList $Path
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
  if ($Bytes -ge 1GB) {
    return "{0:N2} GB" -f ($Bytes / 1GB)
  }
  if ($Bytes -ge 1MB) {
    return "{0:N2} MB" -f ($Bytes / 1MB)
  }
  if ($Bytes -ge 1KB) {
    return "{0:N1} KB" -f ($Bytes / 1KB)
  }
  return "$Bytes B"
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
    return Decode-Text "5pyq6YWN572uIE15U1FMIOWvhueggQ=="
  }

  $mysqlPath = Get-MysqlCliPath
  if (!$mysqlPath) {
    return Decode-Text "5pyq5om+5YiwIE15U1FMIOWRveS7pOihjOW3peWFtw=="
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
      return "$(Decode-Text "5pWw5o2u5bqT6L+e5o6l5aSx6LSl"): $errorText"
    }

    $values = (($output -join " ").Trim() -split "\s+") | Where-Object { $_ -ne "" }
    if ($values.Count -lt 3) {
      return Decode-Text "5pWw5o2u5bqT6L+e5o6l5q2j5bi4"
    }

    return "$(Decode-Text "5pWw5o2u5bqT6L+e5o6l5q2j5bi4")  $(Decode-Text "55So5oi3") $($values[0]) $(Decode-Text "5p2h") / $(Decode-Text "5Yy56YWN") $($values[1]) $(Decode-Text "5p2h") / $(Decode-Text "5raI5oGv") $($values[2]) $(Decode-Text "5p2h")"
  } catch {
    return "$(Decode-Text "5pWw5o2u5bqT6L+e5o6l5aSx6LSl"): $($_.Exception.Message)"
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
  $backupDir = Join-Path ([Environment]::GetFolderPath("Desktop")) "campus-match-db-backups"
  if (!(Test-Path -LiteralPath $backupDir)) {
    return "$(Decode-Text "5aSH5Lu955uu5b2V"): $backupDir"
  }

  $latest = Get-ChildItem -LiteralPath $backupDir -Filter "*.sql" -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (!$latest) {
    return Decode-Text "5pqC5peg5aSH5Lu9"
  }

  return "$(Decode-Text "5pyA6L+R5aSH5Lu977ya") $($latest.LastWriteTime.ToString("yyyy-MM-dd HH:mm"))  $($latest.Name)  $(Decode-Text "5aSn5bCP") $(Format-FileSize $latest.Length)"
}

function Get-LocalSiteSummary {
  $url = "http://127.0.0.1:3138/api/health"
  try {
    $response = Invoke-RestMethod -Uri $url -TimeoutSec 2
    if ($response.success -eq $true -and $response.data.status -eq "ok") {
      return "$(Decode-Text "5pys5Zyw572R56uZ5q2j5bi46L+Q6KGM")  127.0.0.1:3138"
    }

    return "$(Decode-Text "5pys5Zyw572R56uZ6L+e5o6l5aSx6LSl"): unexpected response"
  } catch {
    return "$(Decode-Text "5pys5Zyw572R56uZ5pyq5ZCv5Yqo")  127.0.0.1:3138"
  }
}

$actions = @(
  @{
    Label = "5omT5byA5pys5Zyw572R56uZ"
    Hint = "5ZCv5Yqo5pys5ZywIE15U1FMIOeJiOe9keermQ=="
    Run = { Start-ProjectScript "scripts\windows\start-local-mysql-site.ps1" }
  },
  @{
    Label = "5omT5byA5pys5Zyw566h55CG5ZGY56uv"
    Hint = "6L+b5YWl5pys5Zyw566h55CG6aG16Z2i"
    Run = { Open-Url "http://127.0.0.1:3138/admin" }
  },
  @{
    Label = "5omT5byA5pWw5o2u5bqT"
    Hint = "55SoIEhlaWRpU1FMIOafpeeci+agoeWbremhueebruaVsOaNruW6kw=="
    Run = { Start-ProjectScript "scripts\windows\open-mysql-viewer.ps1" }
  },
  @{
    Label = "5ZCM5q2l572R56uZ5pWw5o2u5YiwIE15U1FM"
    Hint = "5LuO57q/5LiK5ZCM5q2l5pWw5o2u5Yiw5pys5ZywIE15U1FM"
    Run = { Start-ProjectScript "scripts\windows\sync-mysql-desktop.ps1" }
  },
  @{
    Label = "5aSH5Lu95pWw5o2u5bqT"
    Hint = "5a+85Ye65LiA5Lu95pys5Zyw5pWw5o2u5bqT5aSH5Lu9"
    Run = { Start-ProjectScript "scripts\windows\backup-mysql-desktop.ps1" }
  },
  @{
    Label = "5Yid5aeL5YyWIE15U1FMIOeUqOaItw=="
    Hint = "6YeN5paw5Yib5bu6L+S/ruWkjSBjYW1wdXNfYXBwIOeUqOaItw=="
    Run = { Start-ProjectScript "scripts\windows\setup-mysql-user-desktop.ps1" }
  },
  @{
    Label = "5omT5byA6aG555uu5paH5Lu25aS5"
    Hint = "5p+l55yL6aG555uu5rqQ56CB5ZKM6ISa5pys"
    Run = { Open-Folder $ProjectRoot }
  },
  @{
    Label = "5omT5byA57q/5LiK572R56uZ"
    Hint = "5omT5byA5b2T5YmN55So5oi356uv572R5Z2A"
    Run = { Open-Url "https://campus-match-sansui.netlify.app/login" }
  },
  @{
    Label = "5omT5byA566h55CG5ZGY56uv"
    Hint = "6L+b5YWl572R56uZ566h55CG6aG16Z2i"
    Run = { Open-Url "https://campus-match-sansui.netlify.app/admin" }
  },
  @{
    Label = "5omT5byAIE5ldGxpZnkg5ZCO5Y+w"
    Hint = "6L+b5YWlIE5ldGxpZnkg6aG555uu5ZCO5Y+w"
    Run = { Open-Url "https://app.netlify.com/projects/campus-match-sansui" }
  },
  @{
    Label = "5omT5byAIEdpdEh1YiDku5PlupM="
    Hint = "5omT5byAIEdpdEh1YiDmupDnoIHku5PlupM="
    Run = { Open-Url "https://github.com/L230373797/campus-match" }
  }
)

if ($CheckOnly.IsPresent) {
  Write-Host "Campus project console OK."
  Write-Host "Project root: $ProjectRoot"
  Write-Host "Actions: $($actions.Count)"
  Write-Host "Local site: $(Get-LocalSiteSummary)"
  Write-Host "Database: $(Get-DatabaseSummary)"
  Write-Host "Latest backup: $(Get-LatestBackupSummary)"
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
$form.Text = Decode-Text "5qCh5Zut6aG555uu5o6n5Yi25Y+w"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object System.Drawing.Size(780, 735)
$form.MinimumSize = New-Object System.Drawing.Size(720, 680)
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 250, 252)

$fontTitle = New-Object System.Drawing.Font("Microsoft YaHei UI", 20, [System.Drawing.FontStyle]::Bold)
$fontBody = New-Object System.Drawing.Font("Microsoft YaHei UI", 10)
$fontButton = New-Object System.Drawing.Font("Microsoft YaHei UI", 11, [System.Drawing.FontStyle]::Bold)
$fontHint = New-Object System.Drawing.Font("Microsoft YaHei UI", 9)
$fontCardTitle = New-Object System.Drawing.Font("Microsoft YaHei UI", 10, [System.Drawing.FontStyle]::Bold)

$title = New-Object System.Windows.Forms.Label
$title.Text = Decode-Text "5qCh5Zut6aG555uu5o6n5Yi25Y+w"
$title.Font = $fontTitle
$title.ForeColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(32, 28)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = Decode-Text "5pys5Zyw572R56uZ44CB5pWw5o2u5bqT44CB5ZCM5q2l44CB5aSH5Lu95ZKM57q/5LiK5YWl5Y+j6YO95pS+5Zyo6L+Z6YeM44CC"
$subtitle.Font = $fontBody
$subtitle.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$subtitle.AutoSize = $true
$subtitle.Location = New-Object System.Drawing.Point(34, 72)
$form.Controls.Add($subtitle)

$siteValue = $null
$databaseValue = $null
$backupValue = $null

function Add-InfoCard {
  param(
    [int]$X,
    [int]$Width,
    [string]$TitleBase64,
    [ref]$ValueLabelRef
  )

  $panel = New-Object System.Windows.Forms.Panel
  $panel.Size = New-Object System.Drawing.Size($Width, 74)
  $panel.Location = New-Object System.Drawing.Point($X, 108)
  $panel.BackColor = [System.Drawing.Color]::White
  $panel.BorderStyle = "FixedSingle"
  $form.Controls.Add($panel)

  $label = New-Object System.Windows.Forms.Label
  $label.Text = Decode-Text $TitleBase64
  $label.Font = $fontCardTitle
  $label.ForeColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
  $label.AutoSize = $true
  $label.Location = New-Object System.Drawing.Point(14, 10)
  $panel.Controls.Add($label)

  $value = New-Object System.Windows.Forms.Label
  $value.Text = Decode-Text "5q2j5Zyo5qOA5p+lLi4u"
  $value.Font = $fontHint
  $value.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
  $value.AutoEllipsis = $true
  $value.AutoSize = $false
  $value.Size = New-Object System.Drawing.Size(($Width - 28), 34)
  $value.Location = New-Object System.Drawing.Point(14, 34)
  $panel.Controls.Add($value)

  $ValueLabelRef.Value = $value
}

Add-InfoCard -X 34 -Width 220 -TitleBase64 "5pys5Zyw572R56uZ54q25oCB" -ValueLabelRef ([ref]$siteValue)
Add-InfoCard -X 274 -Width 220 -TitleBase64 "5pWw5o2u5bqT54q25oCB" -ValueLabelRef ([ref]$databaseValue)
Add-InfoCard -X 514 -Width 220 -TitleBase64 "5pyA6L+R5aSH5Lu9" -ValueLabelRef ([ref]$backupValue)

$refreshButton = New-Object System.Windows.Forms.Button
$refreshButton.Text = Decode-Text "5Yi35paw54q25oCB"
$refreshButton.Font = $fontHint
$refreshButton.Size = New-Object System.Drawing.Size(92, 28)
$refreshButton.Location = New-Object System.Drawing.Point(636, 72)
$refreshButton.BackColor = [System.Drawing.Color]::FromArgb(226, 232, 240)
$refreshButton.FlatStyle = "Flat"
$form.Controls.Add($refreshButton)

$status = New-Object System.Windows.Forms.Label
$status.Font = $fontHint
$status.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$status.AutoSize = $false
$status.TextAlign = "MiddleLeft"
$status.Size = New-Object System.Drawing.Size(680, 28)
$status.Location = New-Object System.Drawing.Point(34, 660)
$status.Text = "Ready."
$form.Controls.Add($status)

$toolTip = New-Object System.Windows.Forms.ToolTip
$toolTip.AutoPopDelay = 8000
$toolTip.InitialDelay = 400
$toolTip.ReshowDelay = 200

function Add-ActionButton {
  param(
    [int]$Index,
    [hashtable]$Action
  )

  $column = $Index % 2
  $row = [Math]::Floor($Index / 2)
  $x = 34 + ($column * 360)
  $y = 210 + ($row * 72)

  $panel = New-Object System.Windows.Forms.Panel
  $panel.Size = New-Object System.Drawing.Size(336, 58)
  $panel.Location = New-Object System.Drawing.Point($x, $y)
  $panel.BackColor = [System.Drawing.Color]::White
  $panel.BorderStyle = "FixedSingle"
  $form.Controls.Add($panel)

  $button = New-Object System.Windows.Forms.Button
  $button.Text = Decode-Text $Action.Label
  $button.Font = $fontButton
  $button.ForeColor = [System.Drawing.Color]::FromArgb(15, 23, 42)
  $button.BackColor = [System.Drawing.Color]::FromArgb(239, 246, 255)
  $button.FlatStyle = "Flat"
  $button.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(191, 219, 254)
  $button.Size = New-Object System.Drawing.Size(136, 34)
  $button.Location = New-Object System.Drawing.Point(12, 12)
  $panel.Controls.Add($button)

  $hint = New-Object System.Windows.Forms.Label
  $hint.Text = Decode-Text $Action.Hint
  $hint.Font = $fontHint
  $hint.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
  $hint.AutoEllipsis = $true
  $hint.AutoSize = $false
  $hint.Size = New-Object System.Drawing.Size(172, 40)
  $hint.Location = New-Object System.Drawing.Point(154, 11)
  $panel.Controls.Add($hint)

  $toolTip.SetToolTip($button, $hint.Text)
  $toolTip.SetToolTip($panel, $hint.Text)

  $scriptBlock = $Action.Run
  $button.Add_Click({
    try {
      $status.Text = "Running: " + $this.Text
      & $scriptBlock
      $status.Text = "Done: " + $this.Text
    } catch {
      $status.Text = "Failed: " + $_.Exception.Message
      [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Campus Project Console") | Out-Null
    }
  }.GetNewClosure())
}

for ($i = 0; $i -lt $actions.Count; $i += 1) {
  Add-ActionButton -Index $i -Action $actions[$i]
}

function Update-InfoCards {
  $siteValue.Text = Decode-Text "5q2j5Zyo5qOA5p+lLi4u"
  $databaseValue.Text = Decode-Text "5q2j5Zyo5qOA5p+lLi4u"
  $backupValue.Text = Decode-Text "5q2j5Zyo5qOA5p+lLi4u"
  $form.Refresh()
  $siteValue.Text = Get-LocalSiteSummary
  $databaseValue.Text = Get-DatabaseSummary
  $backupValue.Text = Get-LatestBackupSummary
}

$refreshButton.Add_Click({
  try {
    $status.Text = "Refreshing status..."
    Update-InfoCards
    $status.Text = "Status refreshed."
  } catch {
    $status.Text = "Failed: " + $_.Exception.Message
  }
})

$closeButton = New-Object System.Windows.Forms.Button
$closeButton.Text = Decode-Text "5YWz6Zet"
$closeButton.Font = $fontButton
$closeButton.Size = New-Object System.Drawing.Size(120, 36)
$closeButton.Location = New-Object System.Drawing.Point(606, 610)
$closeButton.BackColor = [System.Drawing.Color]::FromArgb(226, 232, 240)
$closeButton.FlatStyle = "Flat"
$closeButton.Add_Click({ $form.Close() })
$form.Controls.Add($closeButton)

$form.Add_Shown({ Update-InfoCards })
[void]$form.ShowDialog()
