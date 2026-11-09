# dsh-filable — 领域词汇表（CONTEXT.md）

> 插件级领域语言。架构讨论（模块/接口/深度/seam/适配器/杠杆/局部性）见 codebase-design 词汇；本表只定义 dsh-filable 自己的概念。改词先改这里。

## 领域概念

- **拖放接管（drop takeover）** — 浏览器半在 document **capture 阶段**接管文件拖放（`preventDefault + stopPropagation`），随后按当前**处理方式**路由；纯拖目录的物品被静默忽略。拖放提示层的显示/隐藏由 dragDepth 计数 + dragleave 出视口/成功 drop 触发。
- **处理方式（routing mode）** — 每个类别（`images` / `files`）独立取 `'sessionfile'` 或 `'native'`，默认都是 `'sessionfile'`。类别由 `fileCategory(file)` 判定（`image/*` 或图片扩展名 → `images`，其余 → `files`）。设置经 `normalizeSettings` 校验后存 `localStorage`。
- **拖放路由（planDrops）** — 浏览器半纯函数：输入 settings + 文件列表 → 输出 `{native, sessionfile}` 两组（顺序保留）；`handleDrop` 据此薄编排：sessionfile 组逐条上传落盘并显示卡片，native 组交给**原生转发**。
- **原生转发（forwardToNative）** — 把 native 组文件构造成合成 `drop`（`DataTransfer` + `DragEvent`，事件带 `__dshFilableForwarded` 标记，插件 capture 监听器见到标记直接放行），派发到 `[data-composer-card]`，让 DSH composer 的原生 bubble 监听器接管（浏览器版宿主把上传文件放进原生附件 rail）。转发不可用（无 composer / 无构造器 / 异常）时返回 false，调用方把该组回退为 sessionfile。
- **sessionfiles** — 每个会话工作区下的落盘文件夹（`<会话工作区>\sessionfiles\`），拖入文件以**原始文件名**落在这里；用户可在资源管理器浏览，agent 用现有工具（glob/read）直接读取。
- **会话工作区（session workspace）** — 会话创建时记录的绝对工作目录（`Session.header.cwd`）。上传落盘位置的唯一权威来源；解析不到时 **fail-closed**（拒绝上传，不信任客户端上报）。
- **文件卡片（file card）** — 输入栏上方 dock 行的展示条目（类型徽标 / 文件名 / 大小·状态：上传中→已就绪/失败 / 上传中进度条），会话切换时清空；已就绪时带「插入引用」按钮与**移除（✕）**按钮（仅隐藏展示，不影响已在途的上传/落盘，上传完成后仍会 toast）。会话身份取自 dock 组件的 `props.sessionId`，`list.current` 作为老宿主兜底。
- **文件引用插入（@file reference insert）** — 在「已就绪」卡片上点击后，把该文件的原生 `@文件引用`（`@sessionfiles/<名>`，含空格用 `@"..."`）插入到**点击时的光标/选区处**。纯函数 `sessionfilesRef(name)`（按原生 grammar 产出 `@path`/`@"path"`，不可表示返回 null）承载生成；插入点由宿主的公开 action 面 `InputActions.captureInsertion()` 捕获（detect 坐标 + `draftRev`，一个 chip 在 detect 文本里占 1 个 U+FFFC），再经 scoped 事件 `slash/input-insert-reference`（`actx.bail(actx, …)`）替换该 span；仅当 `phase === 'plain'` 时生效。无保留选区时回退到草稿末尾。插入成功后焦点回到 composer（`input.focus()`），光标停在新 chip 之后，失败静默。
- **通用设置行（General settings item）** — 通过 `settings.general.item` 槽注册的偏好行（`id: 'dsh-filable-settings'`, `order: 200`，落在通用设置页最底部）；行自绘标题/描述/内容，自带底部分隔线。内容为两张类别开关：图片 / 其他文件；开关**亮起 = sessionfiles**，熄灭 = 原生附件。
- **设置存储（settings storage）** — 浏览器 `localStorage` 键 `dsh-filable:settings`，值 `{images, files}`；`loadSettings` / `saveSettings` 容错（不可用/坏 JSON → 默认值），`normalizeSettings` 只把恰好 `'native'` 视为 native，其余一律 `sessionfile`。
- **toast** — 瞬时反馈（成功/失败/提示），经 `shell.overlay` 槽渲染，React state 驱动。
- **原子写入器（persistStream）** — 宿主内部深模块：接收字节流 + 目标目录 + 文件名 + 大小上限 + 期望哈希 → 原子写盘（tmp+rename）输出 `{path, size, sha256}`；负责流接收/哈希/临时文件清理/Windows 句柄关闭竞态/命名去重（`name (1).ext`）。
- **subscribeStore** — 浏览器半微型订阅 store（get/set/subscribe），toasts、chips 与 settings 共用同一机制；定时器由插件 fiber 生命周期清理。
- **拖放提示（drop hint）** — 拖入文件时显示的全屏提示层，视觉与文案对齐 dsh 内置的 composer DropOverlay（同一套两张插图、同一份 CSS：`--dsw-alias-bg-mask-drop` + `blur(10px)` + `--dsw-font-l-20/s-14`，本插件用 `dsh-filable-hint-*` 类名承载）；描述行实时显示当前路由（图片：{mode} · 其他文件：{mode}）。`pointer-events: none` 装饰、经 `shell.overlay` 条目渲染。**无会话**时显示内置的 blocked 变体插图 + 「先打开一个会话」。

## 协议契约

- 上传错误码：`too-large`（413）、`sha-mismatch`（400）、`session workspace unknown`（400）——host 抛出、client 按 code 判定（文案映射），禁止裸字符串跨文件耦合。
- 上传请求：`POST /dsh-filable/files?session=<id>&name=<原名>`，body = 原始字节流，头 `x-sha256`（客户端预计算）。响应 `{ok, file:{name,size,sha256}}`。
