# ji-filable — 领域词汇表（CONTEXT.md）

> 插件级领域语言。架构讨论（模块/接口/深度/seam/适配器/杠杆/局部性）见 codebase-design 词汇；本表只定义 ji-filable 自己的概念。改词先改这里。

## 领域概念

- **拖放截胡（drop interception）** — 浏览器半在 document **capture 阶段**接管非白名单图片的拖放（`preventDefault + stopPropagation`），先于输入栏 bubble 阶段的图片附件逻辑。白名单图片（png/jpeg/webp/gif）**放行**给既有流程。
- **sessionfiles** — 每个会话工作区下的落盘文件夹（`<会话工作区>\sessionfiles\`），拖入文件以**原始文件名**落在这里；用户可在资源管理器浏览，agent 用现有工具（glob/read）直接读取。
- **会话工作区（session workspace）** — 会话创建时记录的绝对工作目录（`Session.header.cwd`）。上传落盘位置的唯一权威来源；解析不到时 **fail-closed**（拒绝上传，不信任客户端上报）。
- **chip** — 输入栏上方 dock 行的展示条目（文件名/大小/状态：上传中→已就绪/失败），会话切换时清空；左侧带一个**关闭（✕）**按钮可单独移除该 chip（仅隐藏展示，不影响已在途的上传/落盘，上传完成后仍会 toast）；「已就绪」chip 额外带一个**插入 @地址**按钮（点击把该文件的原生 `@sessionfiles/<名>` 追加进 composer 草稿）。
- **文件引用插入（@file reference insert）** — 在「已就绪」chip 上点击后，把该文件的原生 `@文件引用`（`@sessionfiles/<名>`，含空格用 `@"..."`）追加进当前会话 composer 草稿。纯函数 `sessionfilesRef(name)`（按原生 grammar 产出 `@path`/`@"path"`，不可表示返回 null）与 `appendRef(draft, ref)`（仅在草稿非空且末尾无空格时补一个空格）承载生成与拼接；触发经 `conversation.input.for(actx).setDraft`（对齐 QueueDock 先例），仅当 `phase === 'plain'` 时生效，失败静默。
- **toast** — 瞬时反馈（成功/失败/提示），经 `shell.overlay` 槽渲染，React state 驱动。
- **白名单图片** — `image/png|jpeg|webp|gif` 四类；拖放时放行给既有视觉流程，其余类型（含 svg/tiff/heic 等）一律由本插件接管。
- **混拖（mixed batch）** — 一批里既有白名单图片又有其它文件：非图片上传，图片跳过并提示"请单独拖入"。
- **原子写入器（persistStream）** — 宿主内部深模块：接收字节流 + 目标目录 + 文件名 + 大小上限 + 期望哈希 → 原子写盘（tmp+rename）输出 `{path, size, sha256}`；负责流接收/哈希/临时文件清理/Windows 句柄关闭竞态/命名去重（`name (1).ext`）。
- **drop 管线（planUploads）** — 浏览器半纯函数：输入文件列表 → 输出 `{takeOver, skippedImages}`（接管集与跳过的白名单图片数）；handleDrop 做薄编排。
- **subscribeStore** — 浏览器半微型订阅 store（get/set/subscribe），toasts 与 chips 共用同一机制；定时器由插件 fiber 生命周期清理。
- **拖放提示（drop hint）** — 拖入**非图片**文件时显示的全屏毛玻璃提示层（仿 DSH 图片 DropOverlay；`pointer-events: none` 装饰、经 `shell.overlay` 条目渲染、文件+上传箭头图标）。纯图片批次不显示（composer 图片提示覆盖）。**无会话**时显示 disabled 灰色变体"先打开一个会话"。显示/隐藏由 dragDepth 计数 + dragleave 出视口/成功 drop 触发；`shouldShowDropHint(types)` 纯函数判定是否显示。

## 协议契约

- 上传错误码：`too-large`（413）、`sha-mismatch`（400）、`session workspace unknown`（400）——host 抛出、client 按 code 判定（文案映射），禁止裸字符串跨文件耦合。
- 上传请求：`POST /ji-filable/files?session=<id>&name=<原名>`，body = 原始字节流，头 `x-sha256`（客户端预计算）。响应 `{ok, file:{name,size,sha256}}`。
