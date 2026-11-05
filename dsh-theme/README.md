# dsh-theme

[English](README.en.md) | 中文

给 dsh Web 界面换肤的插件。输入只认一种格式：[DreamSkin](https://dreamskin.cc/) 皮肤包（`theme.json` + 壁纸）。插件的活是把包里的 10 个颜色，映射成 dsh 需要的 118 个设计 token —— 并且保证结果一定读得清。

```
DreamSkin 包 (10 色 + 壁纸)
        │
        ├─ lib/kernel.js      派生内核（OKLCH 明度阶梯 + 对比度守卫）
        │
        ├─ lib/client.js      浏览器半：设置区 UI、预览、注册主题、贴壁纸
        └─ lib/store.js       宿主半：包仓库（zip 导入 / 列表 / 导出 / 删除）
```

## v0.6 改了什么

| 问题 | v0.5 的做法 | v0.6 的做法 |
|---|---|---|
| 映射不准 | 10 个颜色直通 69 个 token，其余 156 个仍吃 dsh 自带色 | 派生 118 个 token，表面按 OKLCH 明度阶梯生成，正文按背景重算 |
| 面板透明到看不清 | 从 `theme.css` 里"抓第一个 rgba"当不透明度，抓到的其实是边框/hover 蒙版，抓不到就兜底 1% | 只认 `background-color` 的 alpha；工具型表面（设置面板、弹层、菜单）保底不透明 |
| 亮色包判反 | `appearance !== "light"` 一律当深色 | `auto` 按背景明度判定；实测把 Codex 这个亮色包从深色纠回亮色 |
| 难以预览 | 只有 52px 色卡 + 44×30 缩略图 | 设置区里直接出「对话 / 设置面板」双联预览，带壁纸、带真实 token 配色，外加正文对比度与 token 覆盖率体检 |

新增：内容区不透明度滑杆（30–100%，默认 70%）、四档「毛玻璃」（关 / 轻 6px / 中 14px / 重 26px，默认「中」）与「壁纸缩放」滑杆（100–250%）；设置区里的预览与真实窗口同一套参数，调滑杆时就地可见；皮肤选择会跨重启保留；壁纸条按 `art.taskMode` 选 `cover` / `contain` 并跟随 `art.focusX/Y`；深色/浅色两套外壳。

## 安装

从仓库装：

```bash
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#dsh-theme-v0.6.0&path:/dsh-theme"
# 重启 dsh web
```

从本地目录装（开发时）挂 link 依赖：

```jsonc
// ~/.dsh/profiles/<profile>/package.json
{
  "dependencies": { "dsh-theme": "link:Z:/path/to/dsh-theme" },
  "dsh": { "profile": { "bundles": ["dsh-theme"] } }
}
```

改完重启 `dsh web`。设置 → 主题 里能看到「dsh-theme」区块。导入的皮肤存在插件目录的 `packages/` 下——那是用户数据，不进仓库。
## 皮肤包格式

```
my-skin.zip
├── manifest.json   包元数据（publisher / version / capabilities）
├── theme.json      name / appearance / colors{10} / art{focusX,focusY,taskMode,safeArea}
├── theme.css       可选，只用于解析背景层透明度
└── background.jpg  壁纸
```

- `appearance`：`light` / `dark` / `auto`。`auto` 时按 `colors.background` 的相对亮度判定。
- `colors.panelAlt` 允许 rgba（真实包里见过 `rgba(219,234,255,0.48)`），解析失败会安全降落。
- 不提供 `theme.json` 的压缩包会被拒绝（400 `BAD_PACKAGE`）。

## 设置区里能做什么

- 左列：已安装皮肤，点击即预览，勾选即应用；支持拖入 `.zip` 直接导入。
- 右列：对话 / 设置面板双联预览。**对话**会叠真实壁纸，**设置面板**恒不透明 —— 这就是"换了皮肤也不会看不清设置"的证据。
- 体检行：正文对比度、设置面板对比度、token 覆盖（118 / 124）。
- 内容区不透明度：只影响主内容区，不影响设置面板与弹层；30% 时壁纸最清楚，100% 完全遮住，默认 70%。
- 毛玻璃：直接模糊壁纸本身（放大镜像遮虚边），关 / 轻 / 中 / 重四档；两个控件都即时生效、可持久化，且设置区里的预览用的就是同一组参数。
- 恢复默认：清掉当前皮肤，回到 dsh 原生外观。

## 命令

```bash
node tools/build-client.mjs      # kernel + template → lib/client.js
node tools/check-kernel.mjs      # 11 个包 × 8 项对比度断言
node tools/check-packages.mjs    # 包仓库契约
node tools/check-client.mjs      # bundle 自检（derive / markup / surfaceAlpha 语义）
npm run check                    # 以上全部 + build 是否过期
```

改了 `lib/kernel.js` 或 `lib/client.template.js` 之后必须重新 `build-client.mjs`，`lib/client.js` 是产物。

## 已知限制

- 只支持 DreamSkin 包；旧版 dsh-v2 皮肤包（`skin.json` + `patches.css`）不再支持。
- 对比度守卫只调明度、不动色相，所以极端饱和的包会被压暗一点点颜色。
- 壁纸按 CSS `background-size: cover` 铺，超宽屏两侧会被裁切。

## 许可

MIT
