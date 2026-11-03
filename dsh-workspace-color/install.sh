#!/usr/bin/env bash
# install.sh —— dsh-workspace-color 一键安装（macOS / Linux）
#
# 用法：
#   bash install.sh                 # 默认 profile 为 desktop
#   bash install.sh web             # 指定 profile
#
# 它做的事：
#   1. 把当前目录复制到 ~/.dsh/plugins/dsh-workspace-color
#   2. 在 profile 的 package.json 里登记 dependencies 与 dsh.profile.bundles
#   3. 用 DSH 自带的 pnpm（优先）或系统 pnpm（兜底）安装
#   4. 提示重启 DSH
#
# 依赖：bash、node（用于改 JSON 与调 pnpm）

set -euo pipefail

PROFILE="${1:-desktop}"
PLUGIN_NAME="dsh-workspace-color"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DSH_HOME="$HOME/.dsh"

step() { printf '\n==> %s\n' "$1"; }
info() { printf '  %s\n' "$1"; }
ok() { printf '  [OK] %s\n' "$1"; }
warn() { printf '  [!] %s\n' "$1"; }
fail() {
  printf '  [X] %s\n' "$1" >&2
  exit 1
}

step "检查环境"

[ -d "$DSH_HOME" ] || fail "找不到 DSH 配置目录：$DSH_HOME（请先安装并启动一次 DSH）"
ok ".dsh 目录：$DSH_HOME"

PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
if [ ! -d "$PROFILE_DIR" ]; then
  available=$(ls "$DSH_HOME/profiles" 2>/dev/null | tr '\n' ' ')
  fail "找不到 profile 目录：$PROFILE_DIR（可用：${available:-无}）"
fi
ok "profile 目录：$PROFILE_DIR"

PROFILE_PKG="$PROFILE_DIR/package.json"
[ -f "$PROFILE_PKG" ] || fail "找不到 $PROFILE_PKG"

command -v node >/dev/null 2>&1 || fail "需要 node（用于修改 package.json 和调用 pnpm）"

step "复制插件到 ~/.dsh/plugins"

TARGET_DIR="$DSH_HOME/plugins/$PLUGIN_NAME"
if [ "$SOURCE_DIR" != "$TARGET_DIR" ]; then
  mkdir -p "$DSH_HOME/plugins"
  rm -rf "$TARGET_DIR"
  cp -R "$SOURCE_DIR" "$TARGET_DIR"
  ok "已复制到 $TARGET_DIR"
else
  ok "源目录就是目标目录，跳过复制"
fi

step "登记到 profile"

BACKUP="$PROFILE_PKG.bak-$(date +%Y%m%d-%H%M%S)"
cp "$PROFILE_PKG" "$BACKUP"
ok "已备份原文件：$(basename "$BACKUP")"

FILE_SPEC="file:$TARGET_DIR"

node - "$PROFILE_PKG" "$PLUGIN_NAME" "$FILE_SPEC" <<'NODE'
const fs = require('fs')
const [pkgPath, name, spec] = process.argv.slice(2)
const raw = fs.readFileSync(pkgPath, 'utf8')
const pkg = JSON.parse(raw)

pkg.dependencies = pkg.dependencies || {}
pkg.dependencies[name] = spec

pkg.dsh = pkg.dsh || {}
pkg.dsh.profile = pkg.dsh.profile || {}
const bundles = Array.isArray(pkg.dsh.profile.bundles) ? pkg.dsh.profile.bundles : []
if (!bundles.includes(name)) bundles.push(name)
pkg.dsh.profile.bundles = bundles

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log('  [OK] dependencies 与 bundles 已更新')
NODE

step "安装依赖"

RUNTIME_PNPM="$DSH_HOME/dsh-runtimes/dsh-primary-runtime/dependencies/pnpm/bin/pnpm.cjs"

cd "$PROFILE_DIR"
if [ -f "$RUNTIME_PNPM" ]; then
  info "使用 DSH 自带的 pnpm…"
  node "$RUNTIME_PNPM" install
elif command -v pnpm >/dev/null 2>&1; then
  info "使用系统 pnpm…"
  pnpm install
else
  fail "找不到可用的 pnpm（确认 DSH 已正常运行过，或自行安装 pnpm）"
fi
ok "依赖安装完成"

step "完成"

if [ -f "$PROFILE_DIR/node_modules/$PLUGIN_NAME/client.js" ]; then
  ok "已安装到：$PROFILE_DIR/node_modules/$PLUGIN_NAME"
else
  warn "没有在 node_modules 里找到插件，请检查 pnpm 输出"
fi

printf '\n下一步：完全退出 DSH 再重新启动。\n'
printf '启动后应能看到：侧边栏工作区有颜色、当前对话标题为红色、右下角有彩虹小圆点。\n\n'
printf '本次改动的原文件备份：%s\n' "$BACKUP"
