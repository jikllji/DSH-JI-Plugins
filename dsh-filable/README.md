# DSH-Filable

[English](README.en.md) | 中文

DSH 的文件上传插件:把**图片和文件**拖进聊天,按**原始文件名**无损落盘到会话工作区的 `sessionfiles/` 目录——用户可在资源管理器浏览,agent 用现有工具(glob/read)直接读取;也可以按类别把拖入文件交给 DSH 的原生附件流程。

当前版本 **0.6.1**。

## 功能

- **可配置路由(0.6.1)**:通用设置底部新增「拖入文件的处理方式」,「图片」「其他文件」各一个开关,分别选择 **sessionfiles**(默认,落盘)或 **原生附件**(交给 DSH composer 的原生附件流程);开关**亮起 = sessionfiles**,关闭 = 原生附件。设置持久化在浏览器 `localStorage`(`dsh-filable:settings`),只影响当前浏览器。
- **拖放接管**:在 document **capture 阶段**接管文件拖放(`preventDefault + stopPropagation`),按当前路由把文件交给插件或原生流程;混拖时按类别拆分——sessionfile 部分落盘,原生部分以合成 drop 事件转交宿主 composer。
- **无损落盘**:原始字节流按原名写入 `<会话工作区>\sessionfiles\`,零压缩、零转换;重名自动加后缀(`name (1).ext`),绝不覆盖。单文件默认上限 **100 MB**,可用行配置 `maxBytes` 改写。
- **会话工作区权威源**:落盘位置只取会话的 `Session.header.cwd`,解析不到时 fail-closed(拒绝上传,不信任客户端上报)。
- **原子写入器(persistStream)**:宿主深模块,流式接收 + sha256 计算 + tmp+rename 原子写;错误码为契约常量(`too-large` → 413、`sha-mismatch` → 400、会话工作区未知 → 400),直接单测可验证。
- **文件卡片(0.6.1 重设计)**:输入栏上方显示卡片(类型徽标 / 文件名 / 大小+状态 / 上传中进度条),已就绪时提供「**插入引用**」与移除 ✕;失败态红边并显示错误。会话切换自动清空。
- **插入的是真引用(0.4.0 修复)**:插入走宿主的 scoped 事件 `slash/input-insert-reference`,由宿主在编辑器里插入一个真正的 chip 节点——**草稿里已有的 `@` 引用不会被破坏**。(0.2.0 走 `conversation.input.for(actx).setDraft(...)`,而宿主的 `setDraft` 语义是「整份草稿按纯文本重建」,会把已有引用拉平成字面文本。)
- **拖放提示**:拖入文件时显示全屏提示层,视觉与文案对齐 dsh 内置 composer DropOverlay(同一套两张插图、同一份 CSS 变量:`--dsw-alias-bg-mask-drop` + `blur(10px)` + `--dsw-font-l-20/s-14`);描述行实时显示当前路由(图片:原生附件 · 其他文件:sessionfiles);无会话时显示内置 blocked 变体插图 + 「先打开一个会话」。
- **协议契约**:上传错误码由 host 抛出、client 按 code 判定(文案映射),禁止裸字符串跨文件耦合。

## 安装

DSH-Filable 是一个 dsh bundle(`dsh.bundle.patch` + `dsh.client`),装入 web profile:

```bash
# 从 GitHub 仓库安装（推荐）
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#dsh-filable-v0.6.1&path:/dsh-filable"

# 或指向本地目录（改完源码后）
dsh plugin --profile web add "C:\path\to\dsh-filable"

# 重启 dsh web 生效
```

或手动:把本目录放到 profile 的 `vendor/dsh-filable`,并在 profile `package.json` 中加入

```json
"dependencies": { "dsh-filable": "file:./vendor/dsh-filable" },
"dsh": { "profile": { "bundles": [ "...", "dsh-filable" ] } }
```

然后 `pnpm install` 并重启 `dsh web`。

## 构建

`lib/client.js` 是**生成物**,由 `lib/client.template.js` + `lib/drop-logic.js` 拼装(把 drop-logic 内联进模板的 `__DROP_LOGIC_INLINE__`)。改了模板或 drop-logic 后**必须重建**,否则防漂移测试会失败:

```bash
node scripts/build-client.mjs
```

- 运行代码 = 测试模块(单测钉住 `lib/drop-logic.js`,部署的是重建后的 `lib/client.js`)。
- 校验:跑 `tests/` 下的 vitest 用例;`tests/build-client.spec.ts` 断言部署的 `lib/client.js` 与生成的输出一致。

## 结构

- `cordis.patch.yml` — 组合层补丁(插入 `dsh-filable` 行)。
- `dsh/index.js` — 宿主半:`webServer` 路由 `/dsh-filable/files`(上传落盘)、行配置 `maxBytes`,导出 `persistStream` 原子写入器与错误码常量。
- `lib/drop-logic.js` — 浏览器半纯逻辑(单一事实源,单测钉住;构建时内联进 client 包)。
- `lib/client.template.js` — 浏览器半模板(内联 drop-logic 的源;拖放监听、文件卡片、通用设置行、引用插入都在这里)。
- `lib/client.js` — 生成的浏览器半 bundle(勿手改)。
- `scripts/build-client.mjs` — 生成 `lib/client.js` 的构建脚本。
- `CONTEXT.md` — 插件领域词表(agent 可读;不参与运行时)。
- `LICENSE` — MIT 许可证全文。

## 边界

- 路由按**类别**而非逐个文件选择:图片(`image/*` 或图片扩展名)与「其他文件」各走一条路径;混拖批次按类别拆分,两类可同时生效。
- **原生转发**依赖当前页面已挂载 composer(`[data-composer-card]`),且浏览器支持 `DataTransfer`/`DragEvent` 构造;转发失败(如设置页打开、首页无输入栏)时该部分文件回退为 sessionfiles 落盘。
- 原生附件路径的文件由宿主处理:图片会走宿主的尺寸/格式规范化与单条消息图片数量上限,其他文件走宿主的附件上传;插件不再对它们落盘或展示卡片。
- 「插入引用」把 `@文件引用` chip 插入到**点击时的光标/选区处**:经宿主的公开 action 面 `InputActions.captureInsertion()` 取当前选区与草稿版本(宿主 detect 坐标,一个 chip 在 detect 文本里占 1 个 U+FFFC),由 `slash/input-insert-reference` 替换该 span;若编辑器从未获得选区则回退到草稿末尾。插入成功后焦点回到 composer,光标停在新 chip 之后,可继续输入。
- 目录拖入被静默忽略。
- 落盘目录为会话工作区(可移动),重装/升级插件不影响已落盘文件(它们属于会话,不属于插件目录)。
- 设置只存本机浏览器,不跨浏览器同步。

## 版本

- **0.6.1** — 通用设置底部新增「拖入文件的处理方式」:「图片」「其他文件」两个开关,分别决定走 **原生附件** 还是 **sessionfiles**(默认;开关亮起 = sessionfiles,关闭 = 原生附件),设置存 `localStorage`;混拖按类别拆分,原生部分以合成 `drop`(带 `__dshFilableForwarded` 标记)转交宿主 composer;卡片重设计(类型徽标、上传进度条、「插入引用」药丸、圆形移除按钮、悬停/失败态);`lib/drop-logic.js` 新增 `fileCategory` / `normalizeSettings` / `loadSettings` / `saveSettings` / `planDrops` 纯函数;拖放提示描述行实时展示当前路由;「插入引用」改为插入到**当前光标/选区**而不是草稿末尾(经 `InputActions.captureInsertion()` 捕获选区与 `draftRev`,`slash/input-insert-reference` 替换该 span;无选区时回退末尾),插入成功后焦点回到 composer、光标停在新 chip 之后。
- **0.6.0** — 改名 **ji-filable → dsh-filable**：包名、profile bundle 行名、宿主路由 `/dsh-filable/files`、拖放提示类名 `dsh-filable-hint-*`、文档与示例全部同步（行为逻辑未改）；按仓库约定补回 `LICENSE` 与双语 README（`README.md` 中文 / `README.en.md` 英文），补齐 `files`/`scripts` 字段，删除 3 个遗留 `lib/client.js.bak-*`。
- **0.5.0** — 取消 MIME 分流:**所有**拖入文件(图片也一视同仁)落盘到会话工作区的 `sessionfiles/`,原生图片附件流程不再接收拖放;拖放提示层对齐 dsh 内置 composer DropOverlay(同一套两张插图与 CSS 变量,类名 `ji-filable-hint-*`,标题「拖入图片或文件」);`planUploads` 不再产出 `skippedImages`,移除「混拖跳过图片」提示;`lib/drop-logic.js` 删掉类型判定纯函数 `classifyFile` / `classifyBatch` / `dragTypes` / `shouldShowDropHint`,拖放管线只剩 `planUploads`(接管集 = 全部文件)。
- **0.4.1** — 适配 DSH **0.1.6-alpha.2**:该版本把「当前会话」从 sessions 服务的快照(`list.current`)移交给视图层,拖放与「插入 @地址」改为从插件自己的会话作用域 dock 组件(`props.sessionId`)取会话身份,修掉「明明开着会话却提示『先打开一个会话』」;`list.current` 仍作为老宿主的兜底保留。
- **0.4.0** — 修复「插入 @地址」破坏草稿已有引用的问题(改走 `slash/input-insert-reference`);按 DSH **0.1.6-alpha.1** 的输入框契约核对实现;README 补齐 chip 动作、混拖/提示、上限与 `maxBytes`。
- 0.2.0 — 适配 DSH 0.1.2-rc.1。
