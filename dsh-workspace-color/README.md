# dsh-workspace-color

[English](README.en.md) | 中文

给 DSH 侧边栏的工作区按**身份**上色：同一个工作区永远是同一个颜色，重排、拖拽、重启都不变。

色块按**父子包含关系**一层套一层：每个工作区的色块铺满自己整棵子树，子工作区在父块内逐层内缩、外浅内深，父子层级一眼可见。会话行保持透明，只随所在色块。

鼠标悬浮工作区行时，「⋯」左侧出现颜料板图标，可以给单个工作区固定一个颜色；其余工作区走层级自动配色（同一根分支内**同层同色、父子异色**）。

全部设置都在 **设置 → 侧边栏配色** 里。

> 版本 **0.1.0** · 目标 DSH **0.2.1-rc.2** · MIT · 纯展示层，不改动任何数据
>
> 颜色算法参考 `https://github.com/lsb0554/dsh-sidebar-color`

---

## 功能

- **嵌套层级色块**：父工作区的色块包住整棵子树，子工作区在父块内逐层内缩（左 8px / 右 4px，6 层封顶），圆角随深度收窄；块与块之间 6px 间隙，让外层的颜色露出一圈，包含关系一目了然。
- **外浅内深**：第 0 层最淡，越深越浓（默认 6% + 每层 3%），很多层也不会糊成一片。
- **层级自动配色**：同一根分支内同层同色、隔层换色 —— 兄弟工作区同色，父子不同色；根工作区按自身 id 选起始色，不同分支色序错开。
- **避背景色相**：自动配色在色相环上先让出背景色相 ±45° 的冲突弧，再在剩下 270° 里均分 6 档（45° 一档），不会挑到和侧栏背景相近的颜色。
- **12 个圆点预设**：9 个彩色预设（红、橙、黄、绿、青、蓝、靛、紫、品红）+ 白、灰、黑；彩色预设只固定色相，明暗与饱和统一由 TONE 生成（浅色 L 0.55 / C 0.11，深色 L 0.76 / C 0.095），所以块浓度和文字可读性一致。
- **系统取色器**：面板最后的彩虹圆点打开原生取色器，可挑任意颜色；默认「协调化」——只取你挑的色相、明暗与饱和按当前主题重算，让自定义色和预设观感统一（设置页可关）。
- **恢复自动**：再点一次已选中的预设，就取消该工作区的手动颜色，回到层级自动。
- **当前会话标题标红**：文件夹全部展开时也能一眼找到自己正在看的会话。
- **置顶图钉颜色可自定义**：会话行右侧的图钉可单独指定颜色，默认跟随主题。
- **浅色 / 深色两套主题**：颜色随主题自动生成；手动选色在主题切换后也会按新主题重算。

## 安装

插件在 DSH 里以 bundle 形式挂进某个 profile。下面以 `web` profile 为例，profile 目录是 `%USERPROFILE%\.dsh\profiles\web`。

### 一键脚本（Windows）

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Profile desktop
```

脚本会把当前目录复制到 `~/.dsh/plugins/dsh-workspace-color`，在 profile 的 `package.json` 里登记依赖和 `dsh.profile.bundles`，再用 DSH 自带的 pnpm 安装。

### 手动安装

1. 把插件目录放到任意固定位置（例如 `D:\plugins\dsh-workspace-color`），**不要放在会被清理的临时目录**——profile 的依赖是以路径登记的。
2. 编辑 profile 的 `package.json`，在 `dependencies` 加（路径换成你自己的）：

   ```json
   "dsh-workspace-color": "file:D:/plugins/dsh-workspace-color"
   ```

   在 `dsh.profile.bundles` 数组里加：

   ```json
   "dsh-workspace-color"
   ```

3. 在 profile 目录执行 `pnpm install`，确认 `node_modules/dsh-workspace-color` 已生成。
4. 刷新 DSH 页面（Ctrl+R）。

### 验证

- 侧边栏工作区行出现色块，鼠标悬浮时「⋯」左侧出现颜料板图标；
- **设置 → 侧边栏配色** 能打开。

## 使用

### 设置页

设置页分三段，顶部是标题和总开关：

- **预览** —— 一小棵示例侧栏（3 个根工作区，其中 `design-system` 带子工作区 `tokens`），
  用真实侧栏同一套混色公式实时渲染；右上「浅色 / 深色」切换预览哪套配色，
  同时决定下面「调色」在改哪个主题。
- **配色** —— 左列「层级色块」（最外层浓度 / 每层加深），右列「调色」（明度 L / 饱和度 C），
  底部一排是本主题自动分配出的 6 个色相槽位。
- **标记** —— 标题标红、图钉颜色、自定义色是否只取色相、单独取色的工作区与清除。

| 设置项 | 作用 | 默认 |
| --- | --- | --- |
| 启用（页头开关） | 关闭后侧栏恢复原生配色，预览同步变淡 | 开 |
| 当前会话标题标红 | 当前会话标题红色高亮 | 开 |
| 置顶图钉颜色 | 会话行右侧图钉的颜色（留空跟随主题） | 跟随主题 |
| 最外层浓度 | 第 0 层色块的混色比例 | 6% |
| 每层加深 | 每深一层多混入的比例 | 3% |
| 明度 / 饱和度（调色） | 当前主题下预设色与自动配色的 L / C（OKLCH） | L 0.55/0.76，C 0.11/0.095 |
| 自定义色只取色相 | 系统取色器挑的色只取色相，明暗饱和按主题重算 | 开 |
| 单独取色的工作区 · 清除 | 一次性清空所有工作区的手动颜色 | — |
| 恢复默认（页脚） | 所有设置回到默认值 | — |

### 给单个工作区取色

1. 鼠标悬浮到要改的工作区行上；
2. 点「⋯」左侧的颜料板图标；
3. 在圆点面板里选一个预设，或点彩虹圆点用系统取色器挑颜色；
4. 想恢复自动配色：再点一次当前选中的那个预设圆点。

手动颜色按工作区 id 记录，只影响该工作区自己的色块与图标/标题，不影响它的子工作区（子工作区继续走层级色）。

## 颜色算法

配色在 **OKLCH** 感知均匀色彩空间里生成：

- **统一明暗**：彩色预设只固定色相 H，亮度 L 和饱和 C 取同一组 TONE，于是所有预设的感知亮度一致，叠到背景上的浓度也一致；
- **避背景色相**：`buildHues(count, bgHue, 45)` 先把背景色相 ±45° 的冲突弧让出来，再在剩下的 270° 安全弧里均分，侧栏色块不会和背景撞色；
- **层级步进**：根工作区按 id 哈希得到起始色序，深度每加一层色相走 ±1 档（45°），保证同层同色、父子异色；
- **超色域处理**：转 sRGB 时若超出色域，逐步降低 C 而不是改 L 或 H，保持明暗与色相不变。

背景色相在插件挂载时各测一次（浅色/深色主题分别测），主按钮色、行悬浮底色等都由 DSH 主题变量提供。

## 开发

`client.js` 是浏览器侧静态 bundle，**改完必须刷新页面**才会加载新代码；宿主的 `patchReload: 'live'` 只覆盖 `index.js`。

插件是自包含的：设置页源码在 `src/`，构建脚本在 `scripts/`，不依赖插件目录以外的任何文件。

### 源码与构建

设置页那两段由 `src/` 生成，**不要直接改 `client.js` 里的对应区块**（下次构建会被覆盖）：

| 源文件 | 生成到 `client.js` 的位置 |
| --- | --- |
| `src/settings.css` | `const SETTINGS_CSS` 常量 |
| `src/settings-section.js` | 「设置页分区（React）」注释头到 `function apply(ctx)` 之间的区段 |

```powershell
node scripts/build.mjs          # 写入 client.js
node scripts/build.mjs --check  # 只校验是否同步（改了 src 忘了构建时退出码 1）
node --check client.js          # 语法检查
```

### 两份副本

| 位置 | 作用 |
| --- | --- |
| 本仓库 | 源文件（唯一真源） |
| `%USERPROFILE%\.dsh\profiles\web\node_modules\dsh-workspace-color\` | DSH 实际加载的副本（`file:` 依赖在 `pnpm install` 时复制） |

改完 `client.js` 后同步副本，再在页面里 Ctrl+R：

```powershell
Copy-Item .\client.js, .\package.json "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-workspace-color\" -Force
```

### 自检

- `node scripts/build.mjs --check` 通过；`node --check client.js` 通过；
- 安装副本与源文件 hash 一致；
- 刷新后「设置 → 侧边栏配色」在，色块与颜料板图标正常。

## 实现原理

- 侧边栏每个工作区 = 一个 `groupSection` 容器（内联 `--dsh-workspace-indent = depth × 12px`），子工作区递归渲染成更深一层的 `groupSection`，所以「父子工作区」是真实嵌套结构，色块可以按包含关系逐层内缩。
- 插件只做展示层：给工作区块/行打 `data-ws-*` 属性、注入一段 CSS、按需写内联 `--ws-color`，不碰数据、不改服务。
- 行外层还有 HoverCard 的 `span` 包装，所以所有选择器都用后代选择器，不依赖 DSH 的哈希类名。
- 关闭插件（或页头的「启用」开关关掉）后，所有属性与内联变量立即清除，侧栏恢复原生。

## 排错

| 现象 | 处理 |
| --- | --- |
| 没有色块 | 刷新页面；确认安装副本 `client.js` 与源文件一致、profile 的 `dsh.profile.bundles` 含 `dsh-workspace-color` |
| 改了代码不生效 | `client.js` 是静态 bundle，必须 Ctrl+R；确认改的是 profile `node_modules` 里的那份副本 |
| 悬浮没有颜料板图标 | 入口只在工作区行（文件夹行）出现，会话行没有 |
| 设置页找不到分区 | 刷新后重新打开设置；分区名是「侧边栏配色」 |
| 颜色和预期不一样 | 自动色受背景色相影响；想要固定颜色就用颜料板给工作区手动指定 |

## 目录结构

```
dsh-workspace-color/
├─ client.js               # 构建产物：浏览器侧 bundle（色块/树/取色面板 + 设置页分区）
├─ src/
│  ├─ settings.css         # 设置页样式（命名空间 ws-，只读 DSH 主题令牌）
│  └─ settings-section.js  # 设置页分区组件（React.createElement）
├─ scripts/
│  └─ build.mjs            # 把 src/ 两份源码拼进 client.js（支持 --check）
├─ index.js                # 宿主侧：空实现（只声明 name）
├─ cordis.patch.yml        # bundle 补丁：把一个插件条目插进 profile
├─ package.json            # 清单：dsh.bundle / dsh.client + scripts.build
├─ install.ps1             # Windows 一键安装
├─ install.sh              # macOS / Linux 一键安装
├─ README.md               # 中文（默认）
├─ README.en.md            # 英文
├─ LICENSE
└─ .gitattributes / .gitignore
```

## 变更记录

- **0.1.0** — 首个发布：工作区按层级自动配色（同层同色、父子异色、自动避开背景色相），12 个圆点预设 + 系统取色器，当前会话标题标红与置顶图钉颜色可改；全部设置收进官方设置页的「侧边栏配色」，带示例侧栏实时预览。

## 许可证

MIT
