# install.ps1 —— dsh-workspace-color 一键安装（Windows）
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
#   powershell -ExecutionPolicy Bypass -File .\install.ps1 -Profile desktop
#
# 它做的事：
#   1. 把当前目录复制到 ~/.dsh/plugins/dsh-workspace-color
#   2. 在 profile 的 package.json 里登记 dependencies 与 dsh.profile.bundles
#   3. 用 DSH 自带的 pnpm 安装（优先）或系统 pnpm（兜底）
#   4. 提示重启 DSH
#
# 安全性：只改 ~/.dsh 下的文件；改 package.json 前会备份；已存在的条目不会重复添加。

param(
  [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'

function Info($m) { Write-Host "  $m" }
function Step($m) { Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m) { Write-Host "  [OK] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  [!] $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "  [X] $m" -ForegroundColor Red; exit 1 }

$PluginName = 'dsh-workspace-color'
$SourceDir = $PSScriptRoot
$DshHome = Join-Path $env:USERPROFILE '.dsh'

Step "检查环境"

if (-not (Test-Path $DshHome)) {
  Fail "找不到 DSH 配置目录：$DshHome`n请先安装并启动一次 DSH。"
}
Ok ".dsh 目录：$DshHome"

$ProfileDir = Join-Path $DshHome "profiles\$Profile"
if (-not (Test-Path $ProfileDir)) {
  $available = @()
  if (Test-Path (Join-Path $DshHome 'profiles')) {
    $available = Get-ChildItem (Join-Path $DshHome 'profiles') -Directory | Select-Object -ExpandProperty Name
  }
  Fail "找不到 profile 目录：$ProfileDir`n可用的 profile：$($available -join ', ')`n用 -Profile <名字> 指定，例如 -Profile web"
}
Ok "profile 目录：$ProfileDir"

$ProfilePkg = Join-Path $ProfileDir 'package.json'
if (-not (Test-Path $ProfilePkg)) {
  Fail "找不到 $ProfilePkg"
}

Step "复制插件到 ~/.dsh/plugins"

$TargetDir = Join-Path $DshHome "plugins\$PluginName"
if ((Resolve-Path $SourceDir).Path -ne (Resolve-Path (Split-Path $TargetDir -Parent) -ErrorAction SilentlyContinue).Path) {
  New-Item -ItemType Directory -Force -Path (Split-Path $TargetDir -Parent) | Out-Null
  if (Test-Path $TargetDir) {
    Remove-Item -Recurse -Force $TargetDir
  }
  Copy-Item -Recurse -Force $SourceDir $TargetDir
  Ok "已复制到 $TargetDir"
}
else {
  Ok "源目录就是目标目录，跳过复制"
}

Step "登记到 profile"

$Backup = "$ProfilePkg.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $ProfilePkg $Backup
Ok "已备份原文件：$(Split-Path $Backup -Leaf)"

$fileSpec = 'file:' + ($TargetDir -replace '\\', '/')

# 用 node 写回 JSON：ConvertTo-Json 会把所有缩进都展开成很宽的格式，且会改变
# 数字/布尔的表现形式。node 的 JSON.stringify 与 profile 原有格式一致（2 空格缩进）。
$tmpJs = Join-Path ([System.IO.Path]::GetTempPath()) "dsh-ws-color-patch-$([guid]::NewGuid().ToString('N')).mjs"
@'
import fs from 'node:fs'
const [pkgPath, name, spec] = process.argv.slice(2)
// 去掉可能存在的 UTF-8 BOM（Windows PowerShell 5.1 的 Set-Content/Out-File 会写入）
const raw = fs.readFileSync(pkgPath, 'utf8').replace(/^\uFEFF/, '')
const pkg = JSON.parse(raw)
pkg.dependencies = pkg.dependencies || {}
pkg.dependencies[name] = spec
pkg.dsh = pkg.dsh || {}
pkg.dsh.profile = pkg.dsh.profile || {}
const bundles = Array.isArray(pkg.dsh.profile.bundles) ? pkg.dsh.profile.bundles : []
if (!bundles.includes(name)) bundles.push(name)
pkg.dsh.profile.bundles = bundles
// 不写 BOM：DSH 侧按 UTF-8 解析，BOM 会导致 JSON 解析失败
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
'@ | Set-Content -Path $tmpJs -Encoding UTF8

$nodeExe = Join-Path $DshHome 'dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path $nodeExe)) {
  $nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodeExe) {
  Remove-Item $tmpJs -Force -ErrorAction SilentlyContinue
  Fail "找不到 node，无法安全改写 package.json。原文件未改动。"
}

& $nodeExe $tmpJs $ProfilePkg $PluginName $fileSpec
$nodeExit = $LASTEXITCODE
Remove-Item $tmpJs -Force -ErrorAction SilentlyContinue
if ($nodeExit -ne 0) {
  Copy-Item $Backup $ProfilePkg -Force
  Fail "改写 package.json 失败，已自动恢复备份。"
}
Ok "profile 的 package.json 已更新（dependencies + dsh.profile.bundles）"

Step "安装依赖"

$runtimePnpm = Join-Path $DshHome 'dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.cjs'
$runtimeNode = Join-Path $DshHome 'dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe'

Push-Location $ProfileDir
try {
  if ((Test-Path $runtimePnpm) -and (Test-Path $runtimeNode)) {
    Info "使用 DSH 自带的 pnpm…"
    & $runtimeNode $runtimePnpm install
  }
  elseif (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Info "使用系统 pnpm…"
    pnpm install
  }
  else {
    Pop-Location
    Fail "找不到可用的 pnpm。请确认 DSH 已正常运行过（它会自带一份 pnpm），或自行安装 pnpm。"
  }
  if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Fail "pnpm install 失败（退出码 $LASTEXITCODE）。原 package.json 备份在：$Backup"
  }
}
finally {
  if ((Get-Location).Path -eq $ProfileDir) { Pop-Location }
}
Ok "依赖安装完成"

Step "完成"

$installed = Join-Path $ProfileDir "node_modules\$PluginName\client.js"
if (Test-Path $installed) {
  Ok "已安装到：$installed"
}
else {
  Warn "没有在 node_modules 里找到插件，请检查 pnpm 输出"
}

Write-Host ""
Write-Host "下一步：完全退出 DSH（含托盘图标）再重新启动。" -ForegroundColor Cyan
Write-Host "启动后应能看到：侧边栏工作区有颜色、当前对话标题为红色、右下角有彩虹小圆点。"
Write-Host ""
Write-Host "如需卸载，从 profile 的 package.json 移除 $PluginName 后重新 install 即可。"
Write-Host "本次改动的原文件备份：$Backup"
