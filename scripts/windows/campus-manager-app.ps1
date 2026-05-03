param(
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Desktop = [Environment]::GetFolderPath("Desktop")
$ProjectDesktopDir = Join-Path $Desktop "校园项目"
$BackupDir = Join-Path $ProjectDesktopDir "数据备份"
$ArchiveDir = Join-Path $ProjectDesktopDir "归档"
$InstallerDir = Join-Path $ProjectDesktopDir "安装包"
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

function Invoke-ProjectScript {
  param(
    [string]$RelativePath,
    [string[]]$ExtraArgs = @()
  )

  $scriptPath = Join-Path $ProjectRoot $RelativePath
  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $scriptPath
  ) + $ExtraArgs

  $process = Start-Process powershell.exe -ArgumentList $arguments -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru
  $process.WaitForExit()
  return $process.ExitCode
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
  @{ Group = "本地服务"; Label = "停止本地服务"; Hint = "只关闭校园项目本地网站和接口"; Run = { Invoke-ProjectScript "scripts\windows\stop-local-services.ps1" @("-NoPause") | Out-Null; Refresh-StatusCards } },
  @{ Group = "本地服务"; Label = "一键体检"; Hint = "检查网站、数据库、备份、GitHub"; Run = { Show-HealthDialog } },
  @{ Group = "本地服务"; Label = "环境修复"; Hint = "检查 Node、MySQL、端口、Netlify 和 .env.local"; Run = { Start-ProjectScript "scripts\windows\repair-environment-desktop.ps1" } },
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
        FontFamily="Microsoft YaHei UI, Segoe UI">
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

$RefreshButton.RenderTransformOrigin = New-Object System.Windows.Point 0.5, 0.5
$RefreshScale = New-Object System.Windows.Media.ScaleTransform 1, 1
$RefreshButton.RenderTransform = $RefreshScale
$script:ActionCardStates = New-Object System.Collections.Generic.List[object]
$script:LastHealthSummaries = @()

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
    $brush.GradientStops.Add((New-GradientStop "#F8FFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#E9F8FDFF" 0.34)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#F1F0F7FF" 0.72)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#EEF7ECFF" 1.0)) | Out-Null
  } else {
    $brush.GradientStops.Add((New-GradientStop "#F4FFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#EAFBFDFF" 0.42)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#F8F7FBFF" 1.0)) | Out-Null
  }
  return $brush
}

function New-LiquidBorderBrush {
  param([switch]$Selected)

  $brush = New-Object System.Windows.Media.LinearGradientBrush
  $brush.StartPoint = New-Object System.Windows.Point 0, 0
  $brush.EndPoint = New-Object System.Windows.Point 1, 1
  if ($Selected.IsPresent) {
    $brush.GradientStops.Add((New-GradientStop "#DDFEFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#847CB9FF" 0.32)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#88FF78BA" 0.68)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#A6FFFFFF" 1.0)) | Out-Null
  } else {
    $brush.GradientStops.Add((New-GradientStop "#D9FFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#58A9DEFF" 0.36)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#45FF8BC9" 0.75)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#A8E5E5EA" 1.0)) | Out-Null
  }
  return $brush
}

function New-LiquidShineBrush {
  param([switch]$Selected)

  $brush = New-Object System.Windows.Media.LinearGradientBrush
  $brush.StartPoint = New-Object System.Windows.Point 0, 0
  $brush.EndPoint = New-Object System.Windows.Point 1, 1
  if ($Selected.IsPresent) {
    $brush.GradientStops.Add((New-GradientStop "#90FFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#24FFFFFF" 0.36)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#00FFFFFF" 0.58)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#35F2D8FF" 1.0)) | Out-Null
  } else {
    $brush.GradientStops.Add((New-GradientStop "#70FFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#16FFFFFF" 0.42)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#00FFFFFF" 0.7)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#26C5F5FF" 1.0)) | Out-Null
  }
  return $brush
}

function New-LiquidGlowBrush {
  param([switch]$Selected)

  $brush = New-Object System.Windows.Media.RadialGradientBrush
  $brush.Center = New-Object System.Windows.Point 0.18, 0.0
  $brush.GradientOrigin = New-Object System.Windows.Point 0.18, 0.0
  $brush.RadiusX = 0.95
  $brush.RadiusY = 0.9
  if ($Selected.IsPresent) {
    $brush.GradientStops.Add((New-GradientStop "#C8FFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#5EEAF7FF" 0.38)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#18FF8BC9" 0.72)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#00FFFFFF" 1.0)) | Out-Null
  } else {
    $brush.GradientStops.Add((New-GradientStop "#82FFFFFF" 0.0)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#32EAF7FF" 0.45)) | Out-Null
    $brush.GradientStops.Add((New-GradientStop "#00FFFFFF" 1.0)) | Out-Null
  }
  return $brush
}

function Animate-Opacity {
  param(
    [System.Windows.UIElement]$Element,
    [double]$Value,
    [int]$Duration = 150,
    [int]$Delay = 0
  )

  $ease = New-Object System.Windows.Media.Animation.CubicEase
  $ease.EasingMode = [System.Windows.Media.Animation.EasingMode]::EaseOut

  $animation = New-Object System.Windows.Media.Animation.DoubleAnimation
  $animation.To = $Value
  $animation.Duration = New-Object System.Windows.Duration ([TimeSpan]::FromMilliseconds($Duration))
  if ($Delay -gt 0) {
    $animation.BeginTime = [TimeSpan]::FromMilliseconds($Delay)
  }
  $animation.EasingFunction = $ease
  $Element.BeginAnimation([System.Windows.UIElement]::OpacityProperty, $animation)
}

function Animate-ScaleXY {
  param(
    [System.Windows.Media.ScaleTransform]$Scale,
    [double]$X,
    [double]$Y,
    [int]$Duration = 180,
    [int]$Delay = 0
  )

  $ease = New-Object System.Windows.Media.Animation.CubicEase
  $ease.EasingMode = [System.Windows.Media.Animation.EasingMode]::EaseOut

  $scaleX = New-Object System.Windows.Media.Animation.DoubleAnimation
  $scaleX.To = $X
  $scaleX.Duration = New-Object System.Windows.Duration ([TimeSpan]::FromMilliseconds($Duration))
  if ($Delay -gt 0) {
    $scaleX.BeginTime = [TimeSpan]::FromMilliseconds($Delay)
  }
  $scaleX.EasingFunction = $ease

  $scaleY = New-Object System.Windows.Media.Animation.DoubleAnimation
  $scaleY.To = $Y
  $scaleY.Duration = New-Object System.Windows.Duration ([TimeSpan]::FromMilliseconds($Duration))
  if ($Delay -gt 0) {
    $scaleY.BeginTime = [TimeSpan]::FromMilliseconds($Delay)
  }
  $scaleY.EasingFunction = $ease

  $Scale.BeginAnimation([System.Windows.Media.ScaleTransform]::ScaleXProperty, $scaleX)
  $Scale.BeginAnimation([System.Windows.Media.ScaleTransform]::ScaleYProperty, $scaleY)
}

function Animate-Scale {
  param(
    [System.Windows.Media.ScaleTransform]$Scale,
    [double]$Value,
    [int]$Duration = 180
  )
  Animate-ScaleXY -Scale $Scale -X $Value -Y $Value -Duration $Duration
}

function Set-SelectedActionCard {
  param([System.Windows.Controls.Button]$Button)

  if ($script:SelectedActionButton -and $script:SelectedActionButton -ne $Button) {
    $old = $script:SelectedActionButton.Tag
    $old.Card.Background = New-LiquidBrush
    $old.Card.BorderBrush = New-LiquidBorderBrush
    $old.Card.Effect = New-Shadow
    if ($old.Rim) {
      $old.Rim.BorderBrush = New-LiquidBorderBrush
      Animate-Opacity -Element $old.Rim -Value 0.34 -Duration 140
    }
    if ($old.Shine) {
      $old.Shine.Background = New-LiquidShineBrush
      Animate-Opacity -Element $old.Shine -Value 0.34 -Duration 140
    }
    if ($old.Glow) {
      $old.Glow.Background = New-LiquidGlowBrush
      Animate-Opacity -Element $old.Glow -Value 0.2 -Duration 140
    }
    Animate-Scale -Scale $old.Scale -Value 1.0 -Duration 160
  }

  $script:SelectedActionButton = $Button
  $state = $Button.Tag
  $state.Card.Background = New-LiquidBrush -Selected
  $state.Card.BorderBrush = New-LiquidBorderBrush -Selected
  $state.Card.Effect = New-Shadow -Opacity 0.2 -BlurRadius 42 -ShadowDepth 16
  if ($state.Rim) {
    $state.Rim.BorderBrush = New-LiquidBorderBrush -Selected
    Animate-Opacity -Element $state.Rim -Value 0.72 -Duration 180
  }
  if ($state.Shine) {
    $state.Shine.Background = New-LiquidShineBrush -Selected
    Animate-Opacity -Element $state.Shine -Value 0.62 -Duration 180
  }
  if ($state.Glow) {
    $state.Glow.Background = New-LiquidGlowBrush -Selected
    Animate-Opacity -Element $state.Glow -Value 0.54 -Duration 180
  }
  Animate-Scale -Scale $state.Scale -Value 1.065 -Duration 230
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
  $textBlock.FontFamily = New-Object System.Windows.Media.FontFamily "Microsoft YaHei UI, Segoe UI"
  $textBlock.LineStackingStrategy = [System.Windows.LineStackingStrategy]::BlockLineHeight
  $textBlock.LineHeight = [Math]::Ceiling($Size * 1.36)
  return $textBlock
}

function StatusAccent {
  param([string]$Level)
  if ($Level -eq "OK") { return "#34C759" }
  if ($Level -eq "FAIL") { return "#FF3B30" }
  return "#FF9F0A"
}

function StatusLabel {
  param([string]$Level)
  if ($Level -eq "OK") { return "正常" }
  if ($Level -eq "FAIL") { return "异常" }
  return "注意"
}

function Get-HealthResult {
  param(
    [array]$Summaries,
    [string]$Name
  )

  foreach ($summary in $Summaries) {
    if ($summary.Name -eq $Name) {
      return $summary.Result
    }
  }

  return @{ Level = "WARN"; Text = "还没有刷新状态" }
}

function Resolve-ActionStatus {
  param(
    [hashtable]$Action,
    [array]$Summaries
  )

  $label = $Action.Label
  $result = $null
  $short = "可打开"

  if ($label -like "*线上用户端*" -or $label -like "*线上管理端*" -or $label -like "*Netlify*" -or $label -like "*部署记录*") {
    $result = Get-HealthResult $Summaries "线上"
    $short = "线上" + (StatusLabel $result.Level)
  } elseif ($label -like "*停止本地服务*") {
    $result = Get-HealthResult $Summaries "本地"
    if ($result.Level -eq "OK") { $short = "可停止" } else { $short = "已停止" }
  } elseif ($label -like "*环境修复*") {
    $result = Get-HealthResult $Summaries "数据库"
    if ($result.Level -eq "OK") { $short = "环境可检查" } else { $short = "需要检查" }
  } elseif ($label -like "*本地用户端*" -or $label -like "*本地管理端*" -or $label -like "*启动本地网站*") {
    $result = Get-HealthResult $Summaries "本地"
    if ($result.Level -eq "OK") { $short = "本地已启动" } else { $short = "本地未启动" }
  } elseif ($label -like "*MySQL*" -or $label -like "*同步线上数据*") {
    $result = Get-HealthResult $Summaries "数据库"
    if ($result.Level -eq "OK") { $short = "数据库正常" } else { $short = "数据库需检查" }
  } elseif ($label -like "*备份数据库*" -or $label -like "*备份目录*") {
    $result = Get-HealthResult $Summaries "备份"
    if ($result.Level -eq "OK") { $short = "备份正常" } else { $short = "备份需更新" }
  } elseif ($label -like "*GitHub*") {
    $result = Get-HealthResult $Summaries "GitHub"
    if ($result.Level -eq "OK") { $short = "GitHub 已同步" } else { $short = "GitHub 需同步" }
  } elseif ($label -like "*源码文件夹*") {
    if (Test-Path -LiteralPath $ProjectRoot.Path) {
      $result = @{ Level = "OK"; Text = "源码目录可打开：$($ProjectRoot.Path)" }
      $short = "源码可打开"
    } else {
      $result = @{ Level = "FAIL"; Text = "找不到源码目录" }
      $short = "源码缺失"
    }
  } elseif ($label -like "*归档目录*") {
    if (Test-Path -LiteralPath $ArchiveDir) {
      $result = @{ Level = "OK"; Text = "归档目录可打开：$ArchiveDir" }
      $short = "归档可打开"
    } else {
      $result = @{ Level = "WARN"; Text = "归档目录还没有创建" }
      $short = "归档未创建"
    }
  } elseif ($label -like "*运营说明*") {
    $guidePath = Join-Path $ProjectRoot "OPERATOR-GUIDE.md"
    if (Test-Path -LiteralPath $guidePath) {
      $result = @{ Level = "OK"; Text = "运营说明可打开：$guidePath" }
      $short = "说明可打开"
    } else {
      $result = @{ Level = "WARN"; Text = "还没有运营说明文件" }
      $short = "说明缺失"
    }
  } else {
    $result = @{ Level = "OK"; Text = "入口可用：$($Action.Hint)" }
  }

  return @{ Level = $result.Level; Text = $short; Detail = $result.Text }
}

function Update-ActionCardStatuses {
  param([array]$Summaries)

  foreach ($state in $script:ActionCardStates) {
    $status = Resolve-ActionStatus -Action $state.Action -Summaries $Summaries
    $state.StatusDot.Fill = New-Brush (StatusAccent $status.Level)
    $state.StatusText.Text = $status.Text
    $statusColor = "#B76E00"
    if ($status.Level -eq "OK") {
      $statusColor = "#3A3A3C"
    } elseif ($status.Level -eq "FAIL") {
      $statusColor = "#D70015"
    }
    $state.StatusText.Foreground = New-Brush $statusColor
    $state.StatusText.ToolTip = $status.Detail
  }
}

function Get-ActionIcon {
  param([hashtable]$Action)

  $label = $Action.Label
  if ($label -like "*用户端*") { return "站" }
  if ($label -like "*管理端*") { return "管" }
  if ($label -like "*启动*") { return "启" }
  if ($label -like "*停止*") { return "停" }
  if ($label -like "*环境*") { return "修" }
  if ($label -like "*体检*") { return "检" }
  if ($label -like "*MySQL*") { return "SQL" }
  if ($label -like "*同步*") { return "同" }
  if ($label -like "*备份*") { return "备" }
  if ($label -like "*目录*") { return "夹" }
  if ($label -like "*源码*") { return "码" }
  if ($label -like "*GitHub*") { return "GH" }
  if ($label -like "*Netlify*") { return "云" }
  if ($label -like "*部署*") { return "发" }
  if ($label -like "*说明*") { return "文" }
  return "入"
}

function Get-GroupIcon {
  param([string]$GroupName)

  if ($GroupName -eq "网站入口") { return "站" }
  if ($GroupName -eq "本地服务") { return "服" }
  if ($GroupName -eq "数据文件") { return "数" }
  if ($GroupName -eq "云端管理") { return "云" }
  return "组"
}

function New-IconText {
  param(
    [string]$Glyph,
    [double]$Size = 17,
    [string]$Color = "#1D1D1F"
  )

  $icon = New-Object System.Windows.Controls.TextBlock
  $icon.Text = $Glyph
  $icon.FontFamily = New-Object System.Windows.Media.FontFamily "Microsoft YaHei UI, Segoe UI"
  $icon.FontSize = $Size
  $icon.Foreground = New-Brush $Color
  $icon.FontWeight = "SemiBold"
  $icon.TextAlignment = "Center"
  $icon.LineStackingStrategy = [System.Windows.LineStackingStrategy]::BlockLineHeight
  $icon.LineHeight = [Math]::Ceiling($Size * 1.2)
  $icon.HorizontalAlignment = "Center"
  $icon.VerticalAlignment = "Center"
  return $icon
}

function New-IconBadge {
  param(
    [string]$Glyph,
    [double]$Size = 36,
    [switch]$Small
  )

  $badge = New-Object System.Windows.Controls.Border
  $badge.Width = $Size
  $badge.Height = $Size
  $badge.CornerRadius = New-Object System.Windows.CornerRadius ($Size / 2.35)
  $badge.Background = New-LiquidGlowBrush
  $badge.BorderBrush = New-LiquidBorderBrush
  $badge.BorderThickness = New-Thickness "1"
  $iconSize = 17
  if ($Small.IsPresent) {
    $iconSize = 12
  } elseif ($Glyph.Length -gt 1) {
    $iconSize = 13
  }
  $badge.Child = New-IconText $Glyph $iconSize "#1D1D1F"
  return $badge
}

function Animate-StatusCardEntrance {
  param(
    [System.Windows.Controls.Border]$Card,
    [int]$Delay = 0
  )

  $Card.Opacity = 0
  $Card.RenderTransformOrigin = New-Object System.Windows.Point 0.5, 0.5
  $scale = New-Object System.Windows.Media.ScaleTransform 0.965, 0.965
  $Card.RenderTransform = $scale
  Animate-Opacity -Element $Card -Value 1 -Duration 240 -Delay $Delay
  Animate-ScaleXY -Scale $scale -X 1 -Y 1 -Duration 260 -Delay $Delay
}

function Refresh-StatusCards {
  $StatusWrap.Children.Clear()
  $summaries = @(Get-HealthSummaries)
  $script:LastHealthSummaries = $summaries
  $index = 0
  foreach ($item in $summaries) {
    $card = New-Object System.Windows.Controls.Border
    $card.Width = 248
    $card.Height = 86
    $card.Margin = New-Thickness "0,0,14,14"
    $card.Padding = New-Thickness "16,14,16,14"
    $card.CornerRadius = 20
    $card.Background = New-LiquidBrush
    $card.BorderBrush = New-LiquidBorderBrush
    $card.BorderThickness = New-Thickness "1"
    $card.Effect = New-Shadow

    $layers = New-Object System.Windows.Controls.Grid
    $glow = New-Object System.Windows.Controls.Border
    $glow.CornerRadius = 20
    $glow.Background = New-LiquidGlowBrush
    $glow.Opacity = 0.18
    $glow.IsHitTestVisible = $false
    $layers.Children.Add($glow) | Out-Null

    $shine = New-Object System.Windows.Controls.Border
    $shine.CornerRadius = 20
    $shine.Background = New-LiquidShineBrush
    $shine.Opacity = 0.28
    $shine.IsHitTestVisible = $false
    $layers.Children.Add($shine) | Out-Null

    $stack = New-Object System.Windows.Controls.StackPanel
    $stack.Margin = New-Thickness "0"
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

    $layers.Children.Add($stack) | Out-Null
    $card.Child = $layers
    $StatusWrap.Children.Add($card) | Out-Null
    Animate-StatusCardEntrance -Card $card -Delay ($index * 35)
    $index += 1
  }
  Update-ActionCardStatuses -Summaries $summaries
  $FooterText.Text = "状态已更新：" + (Get-Date).ToString("HH:mm:ss")
}

function Invoke-StatusRefresh {
  try {
    $RefreshButton.IsEnabled = $false
    $RefreshButton.Content = "刷新中"
    $FooterText.Text = "正在刷新状态..."
    Animate-Scale -Scale $RefreshScale -Value 0.94 -Duration 80
    Animate-Opacity -Element $StatusWrap -Value 0.52 -Duration 120
    $window.Dispatcher.Invoke([Action]{}, [System.Windows.Threading.DispatcherPriority]::Background)
    Refresh-StatusCards
  } finally {
    $RefreshButton.Content = "刷新状态"
    $RefreshButton.IsEnabled = $true
    Animate-Scale -Scale $RefreshScale -Value 1 -Duration 180
    Animate-Opacity -Element $StatusWrap -Value 1 -Duration 180
  }
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
  $button.Height = 128
  $button.Margin = New-Thickness "0,0,14,14"
  $button.ToolTip = $Action.Hint
  $button.RenderTransformOrigin = New-Object System.Windows.Point 0.5, 0.5
  $scale = New-Object System.Windows.Media.ScaleTransform 1, 1
  $button.RenderTransform = $scale

  $card = New-Object System.Windows.Controls.Border
  $card.CornerRadius = 24
  $card.Padding = New-Thickness "0"
  $card.Background = New-LiquidBrush
  $card.BorderBrush = New-LiquidBorderBrush
  $card.BorderThickness = New-Thickness "1.2"
  $card.Effect = New-Shadow

  $layers = New-Object System.Windows.Controls.Grid

  $glow = New-Object System.Windows.Controls.Border
  $glow.CornerRadius = 24
  $glow.Background = New-LiquidGlowBrush
  $glow.Opacity = 0.2
  $glow.IsHitTestVisible = $false
  $layers.Children.Add($glow) | Out-Null

  $shine = New-Object System.Windows.Controls.Border
  $shine.CornerRadius = 24
  $shine.Background = New-LiquidShineBrush
  $shine.Opacity = 0.34
  $shine.IsHitTestVisible = $false
  $layers.Children.Add($shine) | Out-Null

  $rim = New-Object System.Windows.Controls.Border
  $rim.CornerRadius = 24
  $rim.BorderThickness = New-Thickness "1.5"
  $rim.BorderBrush = New-LiquidBorderBrush
  $rim.Opacity = 0.34
  $rim.IsHitTestVisible = $false
  $layers.Children.Add($rim) | Out-Null

  $content = New-Object System.Windows.Controls.Grid
  $content.Margin = New-Thickness "18,17,18,15"
  $iconColumn = New-Object System.Windows.Controls.ColumnDefinition
  $iconColumn.Width = New-Object System.Windows.GridLength 42
  $textColumn = New-Object System.Windows.Controls.ColumnDefinition
  $textColumn.Width = New-Object System.Windows.GridLength 1, ([System.Windows.GridUnitType]::Star)
  $content.ColumnDefinitions.Add($iconColumn) | Out-Null
  $content.ColumnDefinitions.Add($textColumn) | Out-Null

  $iconBadge = New-IconBadge (Get-ActionIcon $Action)
  $iconBadge.VerticalAlignment = "Top"
  [System.Windows.Controls.Grid]::SetColumn($iconBadge, 0)
  $content.Children.Add($iconBadge) | Out-Null

  $stack = New-Object System.Windows.Controls.StackPanel
  $stack.Margin = New-Thickness "12,0,0,0"
  $stack.Children.Add((New-Text $Action.Label 15 "#1D1D1F" "SemiBold")) | Out-Null
  $hint = New-Text $Action.Hint 12 "#86868B" "Normal" "0,7,0,0"
  $hint.MaxHeight = 34
  $stack.Children.Add($hint) | Out-Null

  $statusRow = New-Object System.Windows.Controls.DockPanel
  $statusRow.Margin = New-Thickness "0,8,0,0"
  $statusDot = New-Object System.Windows.Shapes.Ellipse
  $statusDot.Width = 7
  $statusDot.Height = 7
  $statusDot.Fill = New-Brush "#C7C7CC"
  $statusDot.Margin = New-Thickness "0,5,7,0"
  [System.Windows.Controls.DockPanel]::SetDock($statusDot, "Left")
  $statusRow.Children.Add($statusDot) | Out-Null

  $statusText = New-Text "待刷新" 12 "#86868B" "SemiBold"
  $statusText.TextWrapping = "NoWrap"
  $statusRow.Children.Add($statusText) | Out-Null
  $stack.Children.Add($statusRow) | Out-Null

  [System.Windows.Controls.Grid]::SetColumn($stack, 1)
  $content.Children.Add($stack) | Out-Null

  $layers.Children.Add($content) | Out-Null
  $card.Child = $layers
  $button.Content = $card
  $button.Tag = [PSCustomObject]@{
    Action = $Action
    Card = $card
    Scale = $scale
    Rim = $rim
    Shine = $shine
    Glow = $glow
    StatusDot = $statusDot
    StatusText = $statusText
  }
  $script:ActionCardStates.Add($button.Tag) | Out-Null
  $button.Add_MouseEnter({
    if ($script:SelectedActionButton -ne $button) {
      $card.BorderBrush = New-LiquidBorderBrush -Selected
      $card.Effect = New-Shadow -Opacity 0.14 -BlurRadius 34 -ShadowDepth 12
      Animate-Opacity -Element $rim -Value 0.56 -Duration 140
      Animate-Opacity -Element $shine -Value 0.48 -Duration 140
      Animate-Opacity -Element $glow -Value 0.34 -Duration 140
      Animate-Scale -Scale $scale -Value 1.026 -Duration 150
    }
  }.GetNewClosure())
  $button.Add_MouseMove({
    param($sender, $eventArgs)
    if ($script:SelectedActionButton -eq $button) {
      return
    }

    if ($button.ActualWidth -le 0 -or $button.ActualHeight -le 0) {
      return
    }

    $point = $eventArgs.GetPosition($button)
    $nx = (($point.X / $button.ActualWidth) - 0.5) * 2
    $ny = (($point.Y / $button.ActualHeight) - 0.5) * 2
    $xScale = 1.024 + ([Math]::Abs($nx) * 0.018) - ([Math]::Abs($ny) * 0.008)
    $yScale = 1.024 + ([Math]::Abs($ny) * 0.018) - ([Math]::Abs($nx) * 0.008)
    Animate-ScaleXY -Scale $scale -X $xScale -Y $yScale -Duration 90
  }.GetNewClosure())
  $button.Add_MouseLeave({
    if ($script:SelectedActionButton -ne $button) {
      $card.BorderBrush = New-LiquidBorderBrush
      $card.Effect = New-Shadow
      Animate-Opacity -Element $rim -Value 0.34 -Duration 140
      Animate-Opacity -Element $shine -Value 0.34 -Duration 140
      Animate-Opacity -Element $glow -Value 0.2 -Duration 140
      Animate-Scale -Scale $scale -Value 1.0 -Duration 150
    }
  }.GetNewClosure())
  $button.Add_MouseDown({
    Animate-Scale -Scale $scale -Value 0.965 -Duration 90
    Animate-Opacity -Element $shine -Value 0.76 -Duration 90
    Animate-Opacity -Element $glow -Value 0.62 -Duration 90
  }.GetNewClosure())
  $button.Add_MouseUp({
    if ($script:SelectedActionButton -eq $button) {
      Animate-Scale -Scale $scale -Value 1.065 -Duration 170
    } else {
      Animate-Scale -Scale $scale -Value 1.026 -Duration 150
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

function Set-ActionSectionOpen {
  param(
    [object]$State,
    [bool]$Open
  )

  if ($Open) {
    $State.IsOpen = $true
    $State.Chevron.Text = "v"
    $State.Content.Visibility = [System.Windows.Visibility]::Visible
    $State.Content.Opacity = 0
    $State.Scale.ScaleX = 1
    $State.Scale.ScaleY = 0.965
    Animate-Opacity -Element $State.Content -Value 1 -Duration 170
    Animate-ScaleXY -Scale $State.Scale -X 1 -Y 1 -Duration 190
    $State.Header.BorderBrush = New-LiquidBorderBrush -Selected
    return
  }

  $State.IsOpen = $false
  $State.Chevron.Text = ">"
  $State.Header.BorderBrush = New-LiquidBorderBrush
  $fade = New-Object System.Windows.Media.Animation.DoubleAnimation
  $fade.To = 0
  $fade.Duration = New-Object System.Windows.Duration ([TimeSpan]::FromMilliseconds(140))
  $fade.Add_Completed({
    if (-not $State.IsOpen) {
      $State.Content.Visibility = [System.Windows.Visibility]::Collapsed
    }
  }.GetNewClosure())
  $State.Content.BeginAnimation([System.Windows.UIElement]::OpacityProperty, $fade)
  Animate-ScaleXY -Scale $State.Scale -X 1 -Y 0.965 -Duration 140
}

function Add-ActionSection {
  param([string]$GroupName)

  $section = New-Object System.Windows.Controls.StackPanel
  $section.Margin = New-Thickness "0,0,0,18"

  $items = @($Actions | Where-Object { $_.Group -eq $GroupName })
  $headerButton = New-Object System.Windows.Controls.Button
  $headerButton.Style = $CardButtonStyle
  $headerButton.Margin = New-Thickness "0,0,14,12"
  $headerButton.HorizontalContentAlignment = "Stretch"

  $header = New-Object System.Windows.Controls.Border
  $header.Padding = New-Thickness "13,10,13,10"
  $header.CornerRadius = 18
  $header.Background = New-LiquidBrush
  $header.BorderBrush = New-LiquidBorderBrush -Selected
  $header.BorderThickness = New-Thickness "1"

  $headerGrid = New-Object System.Windows.Controls.Grid
  $groupIconColumn = New-Object System.Windows.Controls.ColumnDefinition
  $groupIconColumn.Width = New-Object System.Windows.GridLength 34
  $groupTitleColumn = New-Object System.Windows.Controls.ColumnDefinition
  $groupTitleColumn.Width = New-Object System.Windows.GridLength 1, ([System.Windows.GridUnitType]::Star)
  $groupCountColumn = New-Object System.Windows.Controls.ColumnDefinition
  $groupCountColumn.Width = New-Object System.Windows.GridLength 58
  $groupChevronColumn = New-Object System.Windows.Controls.ColumnDefinition
  $groupChevronColumn.Width = New-Object System.Windows.GridLength 24
  $headerGrid.ColumnDefinitions.Add($groupIconColumn) | Out-Null
  $headerGrid.ColumnDefinitions.Add($groupTitleColumn) | Out-Null
  $headerGrid.ColumnDefinitions.Add($groupCountColumn) | Out-Null
  $headerGrid.ColumnDefinitions.Add($groupChevronColumn) | Out-Null

  $groupBadge = New-IconBadge (Get-GroupIcon $GroupName) 30 -Small
  [System.Windows.Controls.Grid]::SetColumn($groupBadge, 0)
  $headerGrid.Children.Add($groupBadge) | Out-Null

  $title = New-Text $GroupName 18 "#1D1D1F" "SemiBold" "10,2,0,0"
  [System.Windows.Controls.Grid]::SetColumn($title, 1)
  $headerGrid.Children.Add($title) | Out-Null

  $countText = New-Text "$($items.Count) 个入口" 12 "#86868B" "SemiBold" "0,4,8,0"
  $countText.HorizontalAlignment = "Right"
  [System.Windows.Controls.Grid]::SetColumn($countText, 2)
  $headerGrid.Children.Add($countText) | Out-Null

  $chevron = New-IconText "v" 13 "#6E6E73"
  [System.Windows.Controls.Grid]::SetColumn($chevron, 3)
  $headerGrid.Children.Add($chevron) | Out-Null

  $header.Child = $headerGrid
  $headerButton.Content = $header
  $section.Children.Add($headerButton) | Out-Null

  $wrap = New-Object System.Windows.Controls.WrapPanel
  foreach ($action in $items) {
    $wrap.Children.Add((New-ActionCard $action)) | Out-Null
  }

  $contentHost = New-Object System.Windows.Controls.Border
  $contentHost.RenderTransformOrigin = New-Object System.Windows.Point 0.5, 0.0
  $contentScale = New-Object System.Windows.Media.ScaleTransform 1, 1
  $contentHost.RenderTransform = $contentScale
  $contentHost.Child = $wrap
  $section.Children.Add($contentHost) | Out-Null

  $state = [PSCustomObject]@{
    IsOpen = $true
    Content = $contentHost
    Scale = $contentScale
    Chevron = $chevron
    Header = $header
  }
  $headerButton.Tag = $state
  $headerButton.Add_Click({
    $sectionState = $headerButton.Tag
    Set-ActionSectionOpen -State $sectionState -Open (-not $sectionState.IsOpen)
  }.GetNewClosure())
  $headerButton.Add_MouseEnter({
    $header.Effect = New-Shadow -Opacity 0.1 -BlurRadius 26 -ShadowDepth 8
  }.GetNewClosure())
  $headerButton.Add_MouseLeave({
    $header.Effect = $null
  }.GetNewClosure())

  $ActionsStack.Children.Add($section) | Out-Null
}

foreach ($groupName in @("网站入口", "本地服务", "数据文件", "云端管理")) {
  Add-ActionSection $groupName
}

$RefreshButton.Add_Click({ Invoke-StatusRefresh })
$window.Add_Loaded({ Refresh-StatusCards })

[void]$window.ShowDialog()
