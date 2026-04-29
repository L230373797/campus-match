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

$actions = @(
  @{
    Label = "5omT5byA5pys5Zyw572R56uZ"
    Hint = "5ZCv5Yqo5pys5ZywIE15U1FMIOeJiOe9keermQ=="
    Run = { Start-ProjectScript "scripts\windows\start-local-mysql-site.ps1" }
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
$form.Size = New-Object System.Drawing.Size(720, 590)
$form.MinimumSize = New-Object System.Drawing.Size(660, 540)
$form.BackColor = [System.Drawing.Color]::FromArgb(248, 250, 252)

$fontTitle = New-Object System.Drawing.Font("Microsoft YaHei UI", 20, [System.Drawing.FontStyle]::Bold)
$fontBody = New-Object System.Drawing.Font("Microsoft YaHei UI", 10)
$fontButton = New-Object System.Drawing.Font("Microsoft YaHei UI", 11, [System.Drawing.FontStyle]::Bold)
$fontHint = New-Object System.Drawing.Font("Microsoft YaHei UI", 9)

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

$status = New-Object System.Windows.Forms.Label
$status.Font = $fontHint
$status.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$status.AutoSize = $false
$status.TextAlign = "MiddleLeft"
$status.Size = New-Object System.Drawing.Size(630, 28)
$status.Location = New-Object System.Drawing.Point(34, 512)
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
  $x = 34 + ($column * 326)
  $y = 118 + ($row * 76)

  $panel = New-Object System.Windows.Forms.Panel
  $panel.Size = New-Object System.Drawing.Size(296, 60)
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
  $button.Size = New-Object System.Drawing.Size(124, 34)
  $button.Location = New-Object System.Drawing.Point(12, 12)
  $panel.Controls.Add($button)

  $hint = New-Object System.Windows.Forms.Label
  $hint.Text = Decode-Text $Action.Hint
  $hint.Font = $fontHint
  $hint.ForeColor = [System.Drawing.Color]::FromArgb(100, 116, 139)
  $hint.AutoEllipsis = $true
  $hint.AutoSize = $false
  $hint.Size = New-Object System.Drawing.Size(142, 40)
  $hint.Location = New-Object System.Drawing.Point(146, 11)
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

$closeButton = New-Object System.Windows.Forms.Button
$closeButton.Text = Decode-Text "5YWz6Zet"
$closeButton.Font = $fontButton
$closeButton.Size = New-Object System.Drawing.Size(120, 36)
$closeButton.Location = New-Object System.Drawing.Point(540, 462)
$closeButton.BackColor = [System.Drawing.Color]::FromArgb(226, 232, 240)
$closeButton.FlatStyle = "Flat"
$closeButton.Add_Click({ $form.Close() })
$form.Controls.Add($closeButton)

[void]$form.ShowDialog()
