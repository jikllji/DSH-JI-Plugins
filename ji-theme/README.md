# JI-Theme

[English](README.en.md) | 中文

dsh Web UI 主题插件：精选皮肤 + 完整自定义主题编辑器 + DreamSkin / DSH v2 `.zip` 双格式导入，所有导入包由 host 侧包仓库托管。

## 功能

- **精选皮肤**:深海蓝 / 森林绿 / 落日紫(深色)、暖纸 / 樱花粉(浅色),切换即时生效、无需重启。
- **自定义主题编辑器**:设置 → 外观 →「JI 主题」,可新建/编辑/删除自己的主题。一个主题包含:名称、明暗、会话背景、表面 / 导航栏、主文字、次文字、强调色、次级表面、强调色·浅、次要色、高亮色、边框,以及三个透明度滑条(表面、背景图、遮罩);由此自动推导整套 `--dsw-alias-*` token,保证配色连贯。
- **与主题绑定的背景图**：背景图是主题的一部分。上传图片后由 host 存原始字节，主题只保留 URL；可调缩放、横向 / 纵向位置、模糊。
- **双格式导入**：一键导入 DreamSkin 包（`manifest.json` + `theme.json` + `theme.css` + 背景图）和 DSH v2 皮肤包（`skin.json` + `skin.css` + 可选 `patches.css` / `hooks.mjs` + assets）。DreamSkin 的颜色、焦点、CSS 部件与 `--ds-theme-*` 变量会翻译；v2 样式、补丁、亮暗背景媒体和经信任确认的 hooks 原样装载。
- **host 侧包仓库**：每个导入包都完整保留为 `packages/<id>/source.zip`，解包文件在 `packages/<id>/files/`。设置区可列表、选择、导出、删除；`localStorage` 只保留当前选择。
- **包覆盖编辑**：DreamSkin 包通过 host 侧覆盖层编辑，原包保持不动；DSH v2 包提供 CSS 覆盖编辑器。保存或恢复后立即重应用。
- **合并导出**：导出按钮默认重打包，把覆盖层合并进 `theme.json`（DreamSkin）或 `skin.css`（DSH v2）；在导出 URL 后加 `?raw=1` 可下载未修改的原包。
- **编辑器布局**：颜色与数值字段改为响应式多栏网格；可调项新增字体、圆角、表面模糊、阴影色/强度、错误/成功/警告/链接色、代码块/代码栏、密度与动效。
- **逐颜色行与实时编辑**：每个颜色项都是可折叠行，带启用方框、内置 HSV/RGB 调色板、单项透明度和单项重置；边框色/宽/样式/透明度，以及侧栏、面板、输入框、对话框、消息、菜单、工具行的分部件透明度都是主题参数。所有改动实时生效，并在 300ms 防抖后写回，不再依赖保存按钮。
- **样式片段复制**：编辑器里的「样式片段」段落可把当前主题的非颜色配置（边框宽 / 样式 / 透明度，整体与分部件透明度，圆角、表面模糊、阴影强度、密度、动效、字体）整体复制，再粘贴到任意其它主题并立即生效；也可命名存为预设反复套用。只搬运样式——调色板与背景图仍属于各自的主题。
- **持久化**：导入包与资产存于 host；当前选择和自定义主题仍按浏览器存储。

## 安装

插件是一个 dsh bundle(`dsh.bundle.patch` + `dsh.client`),装入 web profile:

```bash
dsh plugin --profile web add <path-to-ji-theme>
# 重启 dsh web 生效
```

或手动:把本目录放到 profile 的 `vendor/ji-theme`,并在 profile `package.json` 里加

```json
"dependencies": { "ji-theme": "file:./vendor/ji-theme" },
"dsh": { "profile": { "bundles": [ "...", "ji-theme" ] } }
```

然后 `pnpm install` 并重启 `dsh web`。

## 结构

- `cordis.patch.yml` — 组合层补丁(插入 `ji-theme` 行)。
- `lib/index.js` — host 半：壁纸路由 + `/ji-theme/packages` 包仓库路由。
- `lib/store.js` / `lib/zip.js` — 包持久化与 ZIP 解包。
- `lib/client.js` — 浏览器半(模块表 bundle:皮肤 + 自定义主题编辑器 + 导入)。
- `LICENSE` — MIT 许可证全文。

## 边界

- 内置外观行(浅色 / 深色 / 跟随系统)不受影响;JI-Theme 在设置的「外观」分节里追加「JI 主题」分组。
- 导入包存于 host；当前选择提示与自定义主题按浏览器 `localStorage` 保存，清缓存不会删包。
- 上传的背景图按 host 原始字节保存、不做重编码；删除自定义主题时会同时删除对应背景文件。
- DreamSkin CSS 经 DSH 部件映射翻译，未知部件保留原选择器；DSH 没有对应部件的位置无法做到与 Codex 完全一致。
- DSH v2 的 hooks 只在用户明确信任后执行；拒绝执行时静态样式与背景仍会生效。
- 自定义主题 id 为 `custom-<id>`,不与内置 `light`/`dark`/`system` 冲突。
