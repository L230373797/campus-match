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

Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="校园匹配管理器"
        Width="1080"
        Height="760"
        MinWidth="960"
        MinHeight="700"
        WindowStartupLocation="CenterScreen"
        Background="#F5F5F7"
        FontFamily="Segoe UI Variable, Microsoft YaHei UI, Segoe UI">
  <Window.Resources>
    <Style x:Key="CardButtonStyle" TargetType="Button">
      <Setter Property="Background" Value="Transparent"/>
      <Setter Property="BorderThickness" Value="0"/>
      <Setter Property="Padding" Value="0"/>
      <Setter Property="Cursor" Value="Hand"/>
      <Setter Property="Template">
        <Setter.Value>
          <ControlTemplate TargetType="Button">
            <ContentPresenter/>
          </ControlTemplate>
        </Setter.Value>
      </Setter>
    </Style>
  </Window.Resources>

  <Grid>
    <Grid.ColumnDefinitions>
      <ColumnDefinition Width="272"/>
      <ColumnDefinition Width="*"/>
    </Grid.ColumnDefinitions>

    <Border Grid.Column="0" Background="#FFFFFF" BorderBrush="#E5E5EA" BorderThickness="0,0,1,0">
      <Grid Margin="28,28,24,28">
        <Grid.RowDefinitions>
          <RowDefinition Height="Auto"/>
          <RowDefinition Height="Auto"/>
          <RowDefinition Height="*"/>
          <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <StackPanel>
          <TextBlock Text="校园匹配" FontSize="28" FontWeight="SemiBold" Foreground="#1D1D1F"/>
          <TextBlock Text="管理中心" Margin="0,4,0,0" FontSize="15" Foreground="#6E6E73"/>
        </StackPanel>

        <Border Grid.Row="1" Margin="0,28,0,0" Padding="16" CornerRadius="18" Background="#F5F5F7">
          <StackPanel>
            <TextBlock Text="生产环境" FontSize="13" FontWeight="SemiBold" Foreground="#1D1D1F"/>
            <TextBlock Text="campus-match-sansui.netlify.app" Margin="0,6,0,0" FontSize="12" Foreground="#6E6E73" TextWrapping="Wrap"/>
            <TextBlock Text="当前分支：netlify-current-source" Margin="0,10,0,0" FontSize="12" Foreground="#86868B" TextWrapping="Wrap"/>
          </StackPanel>
        </Border>

        <StackPanel Grid.Row="2" Margin="0,30,0,0">
          <TextBlock Text="常用入口" FontSize="12" FontWeight="SemiBold" Foreground="#86868B"/>
          <TextBlock Text="线上用户端" Margin="0,18,0,0" FontSize="15" Foreground="#1D1D1F"/>
          <TextBlock Text="线上管理端" Margin="0,16,0,0" FontSize="15" Foreground="#1D1D1F"/>
          <TextBlock Text="本地网站" Margin="0,16,0,0" FontSize="15" Foreground="#1D1D1F"/>
          <TextBlock Text="MySQL 数据库" Margin="0,16,0,0" FontSize="15" Foreground="#1D1D1F"/>
          <TextBlock Text="备份与归档" Margin="0,16,0,0" FontSize="15" Foreground="#1D1D1F"/>
        </StackPanel>

        <TextBlock Grid.Row="3" Text="所有入口只做打开和检查，不会自动处理真实用户资料。"
                   FontSize="12" Foreground="#86868B" TextWrapping="Wrap"/>
      </Grid>
    </Border>

    <Grid Grid.Column="1" Margin="34,30,38,30">
      <Grid.RowDefinitions>
        <RowDefinition Height="Auto"/>
        <RowDefinition Height="Auto"/>
        <RowDefinition Height="*"/>
        <RowDefinition Height="Auto"/>
      </Grid.RowDefinitions>

      <Grid>
        <StackPanel>
          <TextBlock Text="今天要管理什么？" FontSize="34" FontWeight="SemiBold" Foreground="#1D1D1F"/>
          <TextBlock Text="网站、后台、数据库和部署入口都在这里。" Margin="0,8,0,0" FontSize="15" Foreground="#6E6E73"/>
        </StackPanel>
        <Button x:Name="RefreshButton" Content="刷新状态" Width="108" Height="36" HorizontalAlignment="Right" VerticalAlignment="Top"
                Background="#1D1D1F" Foreground="#FFFFFF" BorderThickness="0" FontWeight="SemiBold"/>
      </Grid>

      <WrapPanel x:Name="StatusWrap" Grid.Row="1" Margin="0,28,0,10"/>

      <ScrollViewer Grid.Row="2" VerticalScrollBarVisibility="Auto" Padding="0,0,8,0">
        <StackPanel x:Name="ActionsStack"/>
      </ScrollViewer>

      <TextBlock x:Name="FooterText" Grid.Row="3" Text="Ready." Margin="0,18,0,0" FontSize="12" Foreground="#86868B"/>
    </Grid>
  </Grid>
</Window>
"@

[xml]$xamlDocument = $xaml
$reader = New-Object System.Xml.XmlNodeReader $xamlDocument
$window = [Windows.Markup.XamlReader]::Load($reader)

$RefreshButton = $window.FindName("RefreshButton")
$StatusWrap = $window.FindName("StatusWrap")
$ActionsStack = $window.FindName("ActionsStack")
$FooterText = $window.FindName("FooterText")
$CardButtonStyle = $window.Resources["CardButtonStyle"]

function New-Brush {
  param([string]$Color)
  return New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.ColorConverter]::ConvertFromString($Color))
}

function New-Thickness {
  param([string]$Value)
  $converter = New-Object System.Windows.ThicknessConverter
  return $converter.ConvertFromString($Value)
}

function New-Shadow {
  param(
    [double]$Opacity = 0.08,
    [double]$BlurRadius = 24,
    [double]$ShadowDepth = 8
  )

  return New-Object System.Windows.Media.Effects.DropShadowEffect -Property @{
    Color = [System.Windows.Media.ColorConverter]::ConvertFromString("#1D1D1F")
    BlurRadius = $BlurRadius
    ShadowDepth = $ShadowDepth
    Opacity = $Opacity
  }
}

function New-GradientStop {
  param(
    [string]$Color,
    [double]$Offset
  )

  $stop = New-Object System.Windows.Media.GradientStop
  $stop.Color = [System.Windows.Media.ColorConverter]::ConvertFromString($Color)
  $stop.Offset = $Offset
  return $stop
}

function New-LiquidBrush {
  param([switch]$Selected)

  $brush = New-Object System.Windows.Media.LinearGradientBrush
  $brush.StartPoint = New-Object System.Windows.Point 0, 0
  $brush.EndPoint = New-Object System.Windows.Point 1, 1
  if ($Selected.IsPresent) {
    $brush.GradientStops.Add((New-GradientStop "#FAFFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#EAF4FAFF" 0.42)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#F4F0F6FF" 1.0)) | Out-Null
  } else {
    $brush.GradientStops.Add((New-GradientStop "#FFFFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#FBFBFDFF" 1.0)) | Out-Null
  }
  return $brush
}

function Animate-Scale {
  param(
    [System.Windows.Media.ScaleTransform]$Scale,
    [double]$Value,
    [int]$Duration = 180
  )

  $ease = New-Object System.Windows.Media.Animation.CubicEase
  $ease.EasingMode = [System.Windows.Media.Animation.EasingMode]::EaseOut

  $scaleX = New-Object System.Windows.Media.Animation.DoubleAnimation
  $scaleX.To = $Value
  $scaleX.Duration = New-Object System.Windows.Duration ([TimeSpan]::FromMilliseconds($Duration))
  $scaleX.EasingFunction = $ease

  $scaleY = New-Object System.Windows.Media.Animation.DoubleAnimation
  $scaleY.To = $Value
  $scaleY.Duration = New-Object System.Windows.Duration ([TimeSpan]::FromMilliseconds($Duration))
  $scaleY.EasingFunction = $ease

  $Scale.BeginAnimation([System.Windows.Media.ScaleTransform]::ScaleXProperty, $scaleX)
  $Scale.BeginAnimation([System.Windows.Media.ScaleTransform]::ScaleYProperty, $scaleY)
}

function Set-SelectedActionCard {
  param([System.Windows.Controls.Button]$Button)

  if ($script:SelectedActionButton -and $script:SelectedActionButton -ne $Button) {
    $old = $script:SelectedActionButton.Tag
    $old.Card.Background = New-LiquidBrush
    $old.Card.BorderBrush = New-Brush "#E5E5EA"
    $old.Card.Effect = New-Shadow
    Animate-Scale -Scale $old.Scale -Value 1.0 -Duration 160
  }

  $script:SelectedActionButton = $Button
  $state = $Button.Tag
  $state.Card.Background = New-LiquidBrush -Selected
  $state.Card.BorderBrush = New-Brush "#7CB9FF"
  $state.Card.Effect = New-Shadow -Opacity 0.18 -BlurRadius 34 -ShadowDepth 14
  Animate-Scale -Scale $state.Scale -Value 1.055 -Duration 210
}

function New-Text {
  param(
    [string]$Text,
    [double]$Size,
    [string]$Color,
    [string]$Weight = "Normal",
    [string]$Margin = "0"
  )

  $textBlock = New-Object System.Windows.Controls.TextBlock
  $textBlock.Text = $Text
  $textBlock.FontSize = $Size
  $textBlock.Foreground = New-Brush $Color
  $textBlock.FontWeight = $Weight
  $textBlock.Margin = New-Thickness $Margin
  $textBlock.TextWrapping = "Wrap"
  return $textBlock
}

function StatusAccent {
  param([string]$Level)
  if ($Level -eq "OK") { return "#34C759" }
  if ($Level -eq "FAIL") { return "#FF3B30" }
  return "#FF9F0A"
}

function Refresh-StatusCards {
  $StatusWrap.Children.Clear()
  foreach ($item in Get-HealthSummaries) {
    $card = New-Object System.Windows.Controls.Border
    $card.Width = 248
    $card.Height = 86
    $card.Margin = New-Thickness "0,0,14,14"
    $card.Padding = New-Thickness "16,14,16,14"
    $card.CornerRadius = 18
    $card.Background = New-Brush "#FFFFFF"
    $card.BorderBrush = New-Brush "#E5E5EA"
    $card.BorderThickness = New-Thickness "1"
    $card.Effect = New-Shadow

    $stack = New-Object System.Windows.Controls.StackPanel
    $top = New-Object System.Windows.Controls.DockPanel

    $dot = New-Object System.Windows.Shapes.Ellipse
    $dot.Width = 9
    $dot.Height = 9
    $dot.Fill = New-Brush (StatusAccent $item.Result.Level)
    $dot.Margin = New-Thickness "0,5,8,0"
    [System.Windows.Controls.DockPanel]::SetDock($dot, "Left")
    $top.Children.Add($dot) | Out-Null

    $title = New-Text "$($item.Name)  $($item.Result.Level)" 13 "#1D1D1F" "SemiBold"
    $top.Children.Add($title) | Out-Null
    $stack.Children.Add($top) | Out-Null

    $detail = New-Text $item.Result.Text 12 "#6E6E73" "Normal" "0,9,0,0"
    $detail.MaxHeight = 34
    $detail.ToolTip = $item.Result.Text
    $stack.Children.Add($detail) | Out-Null

    $card.Child = $stack
    $StatusWrap.Children.Add($card) | Out-Null
  }
  $FooterText.Text = "状态已更新：" + (Get-Date).ToString("HH:mm:ss")
}

function Show-HealthDialog {
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("体检结果")
  $lines.Add("")
  foreach ($item in Get-HealthSummaries) {
    $lines.Add("[$($item.Result.Level)] $($item.Name) - $($item.Result.Text)")
  }

  [System.Windows.MessageBox]::Show(
    ($lines -join [Environment]::NewLine),
    "校园匹配体检",
    [System.Windows.MessageBoxButton]::OK,
    [System.Windows.MessageBoxImage]::Information
  ) | Out-Null
  Refresh-StatusCards
}

function New-ActionCard {
  param([hashtable]$Action)

  $button = New-Object System.Windows.Controls.Button
  $button.Style = $CardButtonStyle
  $button.Width = 246
  $button.Height = 96
  $button.Margin = New-Thickness "0,0,14,14"
  $button.ToolTip = $Action.Hint
  $button.RenderTransformOrigin = New-Object System.Windows.Point 0.5, 0.5
  $scale = New-Object System.Windows.Media.ScaleTransform 1, 1
  $button.RenderTransform = $scale

  $card = New-Object System.Windows.Controls.Border
  $card.CornerRadius = 20
  $card.Padding = New-Thickness "18"
  $card.Background = New-LiquidBrush
  $card.BorderBrush = New-Brush "#E5E5EA"
  $card.BorderThickness = New-Thickness "1"
  $card.Effect = New-Shadow

  $stack = New-Object System.Windows.Controls.StackPanel
  $stack.Children.Add((New-Text $Action.Label 15 "#1D1D1F" "SemiBold")) | Out-Null
  $hint = New-Text $Action.Hint 12 "#86868B" "Normal" "0,9,0,0"
  $hint.MaxHeight = 36
  $stack.Children.Add($hint) | Out-Null

  $card.Child = $stack
  $button.Content = $card
  $button.Tag = [PSCustomObject]@{
    Card = $card
    Scale = $scale
  }
  $button.Add_MouseEnter({
    if ($script:SelectedActionButton -ne $button) {
      $card.BorderBrush = New-Brush "#D1D1D6"
      $card.Effect = New-Shadow -Opacity 0.12 -BlurRadius 28 -ShadowDepth 10
      Animate-Scale -Scale $scale -Value 1.018 -Duration 150
    }
  }.GetNewClosure())
  $button.Add_MouseLeave({
    if ($script:SelectedActionButton -ne $button) {
      $card.BorderBrush = New-Brush "#E5E5EA"
      $card.Effect = New-Shadow
      Animate-Scale -Scale $scale -Value 1.0 -Duration 150
    }
  }.GetNewClosure())
  $button.Add_Click({
    try {
      Set-SelectedActionCard -Button $button
      $FooterText.Text = "正在打开：" + $Action.Label
      & $Action.Run
      $FooterText.Text = "已打开：" + $Action.Label
    } catch {
      $FooterText.Text = "执行失败：" + $_.Exception.Message
      [System.Windows.MessageBox]::Show($_.Exception.Message, "执行失败", "OK", "Error") | Out-Null
    }
  }.GetNewClosure())
  return $button
}

function Add-ActionSection {
  param([string]$GroupName)

  $section = New-Object System.Windows.Controls.StackPanel
  $section.Margin = New-Thickness "0,0,0,24"
  $section.Children.Add((New-Text $GroupName 19 "#1D1D1F" "SemiBold" "0,0,0,12")) | Out-Null

  $wrap = New-Object System.Windows.Controls.WrapPanel
  $items = @($Actions | Where-Object { $_.Group -eq $GroupName })
  foreach ($action in $items) {
    $wrap.Children.Add((New-ActionCard $action)) | Out-Null
  }
  $section.Children.Add($wrap) | Out-Null
  $ActionsStack.Children.Add($section) | Out-Null
}

foreach ($groupName in @("网站入口", "本地服务", "数据文件", "云端管理")) {
  Add-ActionSection $groupName
}

$RefreshButton.Add_Click({ Refresh-StatusCards })
$window.Add_Loaded({ Refresh-StatusCards })

[void]$window.ShowDialog()
