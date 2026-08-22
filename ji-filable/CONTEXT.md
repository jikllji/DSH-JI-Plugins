# ji-filable — 领域词汇表（CONTEXT.md）

> 插件级领域语言。架构讨论（模块/接口/深度/seam/适配器/杠杆/局部性）见 codebase-design 词汇；本表只定义 ji-filable 自己的概念。改词先改这里。

## 领域概念

- **拖放截胡（drop interception）** — 浏览器半在 document **capture 阶段**接管非白名单图片的拖放（`preventDefault + stopPropagation`），先于输入栏 bubble 阶段的图片附件逻辑。白名单图片（png/jpeg/webp/gif）**放行**给既有流程。
- **sessionfiles** — 每个会话工作区下的落盘文件夹（`<会话工作区>\sessionfiles\`），拖入文件以**原始文件名**落在这里；用户可在资源管理器浏览，agent 用现有工具（glob/read）直接读取。
- **会话工作区（session workspace）** — 会话创建时记录的绝对工作目录（`Session.header.cwd`）。上传落盘位置的唯一权威来源；解析不到时 **fail-closed**（拒绝上传，不信任客户端上报）。
- **chip** — 输入栏上方 dock 行的**纯展示**条目（文件名/大小/状态：上传中→已就绪/失败），会话切换时清空；无操作按钮。
- **toast** — 瞬时反馈（成功/失败/提示），经 `shell.overlay` 槽渲染，React state 驱动。
- **白名单图片** — `image/png|jpeg|webp|gif` 四类；拖放时放行给既有视觉流程，其余类型（含 svg/tiff/heic 等）一律由本插件接管。
- **混拖（mixed batch）** — 一批里既有白名单图片又有其它文件：非图片上传，图片跳过并提示"请单独拖入"。
- **原子写入器（persistStream）** — 宿主内部深模块：接收字节流 + 目标目录 + 文件名 + 大小上限 + 期望哈希 → 原子写盘（tmp+rename）输出 `{path, size, sha256}`；负责流接收/哈希/临时文件清理/Windows 句柄关闭竞态/命名去重（`name (1).ext`）。
- **drop 管线（planUploads）** — 浏览器半纯函数：输入文件列表 → 输出 `{takeOver, skippedImages}`（接管集与跳过的白名单图片数）；handleDrop 做薄编排。
- **subscribeStore** — 浏览器半微型订阅 store（get/set/subscribe），toasts 与 chips 共用同一机制；定时器由插件 fiber 生命周期清理。

## 协议契约

- 上传错误码：`too-large`（413）、`sha-mismatch`（400）、`session workspace unknown`（400）——host 抛出、client 按 code 判定（文案映射），禁止裸字符串跨文件耦合。
- 上传请求：`POST /ji-filable/files?session=<id>&name=<原名>`，body = 原始字节流，头 `x-sha256`（客户端预计算）。响应 `{ok, file:{name,size,sha256}}`。
