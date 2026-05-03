param(
  [string]$OutputRoot,
  [string]$ZipPath
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

if (!$OutputRoot) {
  $OutputRoot = Join-Path $ProjectRoot "output\campus-match-manager-installer"
}

if (!$ZipPath) {
  $ZipPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "校园匹配管理器安装包.zip"
}

$OutputRootFull = [IO.Path]::GetFullPath($OutputRoot)
$OutputParent = Split-Path -Parent $OutputRootFull
New-Item -ItemType Directory -Force -Path $OutputParent | Out-Null

if (Test-Path -LiteralPath $OutputRootFull) {
  $projectOutput = [IO.Path]::GetFullPath((Join-Path $ProjectRoot "output"))
  if (!$OutputRootFull.StartsWith($projectOutput, [StringComparison]::OrdinalIgnoreCase)) {
    throw "为了避免误删，只允许清理项目 output 目录内的安装包输出。"
  }
  Remove-Item -LiteralPath $OutputRootFull -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $OutputRootFull | Out-Null

$ExePath = Join-Path $OutputRootFull "校园匹配管理器.exe"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "build-campus-manager-exe.ps1") -OutputPath $ExePath

Copy-Item -LiteralPath (Join-Path $PSScriptRoot "install-campus-manager.ps1") -Destination (Join-Path $OutputRootFull "install-campus-manager.ps1") -Force

$Readme = @"
校园匹配管理器安装包

用途：
安装一个桌面入口，用来打开校园匹配的用户端、管理端、本地服务、MySQL、备份和云端管理入口。

安装方法：
1. 把源码项目放到电脑上，例如 C:\Users\你的用户名\Documents\校园项目\campus-match-dist
2. 右键 install-campus-manager.ps1，选择“使用 PowerShell 运行”
3. 如果项目不在默认目录，打开 PowerShell 后执行：
   powershell -ExecutionPolicy Bypass -File .\install-campus-manager.ps1 -ProjectRoot "你的项目根目录"

安装后：
- 程序会安装到 %LOCALAPPDATA%\CampusMatchManager
- 桌面和开始菜单会出现“校园匹配管理器”
- 项目目录会写入 %APPDATA%\CampusMatchManager\project-root.txt

说明：
这个安装包负责安装桌面管理入口。项目源码、MySQL、Node.js、Netlify 登录等仍然按项目本身的环境来运行。
"@

Set-Content -Path (Join-Path $OutputRootFull "README.txt") -Value $Readme -Encoding UTF8

if (Test-Path -LiteralPath $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

Compress-Archive -Path (Join-Path $OutputRootFull "*") -DestinationPath $ZipPath -Force

Write-Host "安装包目录：$OutputRootFull"
Write-Host "安装包压缩文件：$ZipPath"
