# JI-Filable

[English](README.en.md) | 中文

DSH 的文件上传插件:把**非图片**文件拖进聊天,按**原始文件名**无损落盘到会话工作区的 `sessionfiles/` 目录——用户可在资源管理器浏览,agent 用现有工具(glob/read)直接读取。

## 功能

- **拖放截胡**:在 document **capture 阶段**接管非白名单图片的拖放,先于输入栏 bubble 阶段的图片附件逻辑;白名单图片(png/jpeg/webp/gif)放行给既有视觉流程。
- **无损落盘**:原始字节流按原名写入 `<会话工作区>\sessionfiles\`,零压缩、零转换;重名自动加后缀(`name (1).ext`),绝不覆盖。
- **会话工作区权威源**:落盘位置只取会话的 `Session.header.cwd`,解析不到时 fail-closed(拒绝上传,不信任客户端上报)。
- **原子写入器(persistStream)**:宿主深模块,流式接收 + sha256 计算 + tmp+rename 原子写,错误码为契约常量(`too-large`/`sha-mismatch`),直接单测可验证。
- **chip / toast 反馈**:输入栏上方的纯展示 chip(文件名/大小/状态),会话切换自动清空;成功/失败/提示经 `shell.overlay` toast 渲染。
- **协议契约**:上传错误码由 host 抛出、client 按 code 判定(文案映射),禁止裸字符串跨文件耦合。

## 安装

JI-Filable 是一个 dsh bundle(`dsh.bundle.patch` + `dsh.client`),装入 web profile:

```bash
dsh plugin --profile web add <path-to-ji-filable>
# 重启 dsh web 生效
```

或手动:把本目录放到 profile 的 `vendor/ji-filable`,并在 profile `package.json` 中加入

```json
"dependencies": { "ji-filable": "file:./vendor/ji-filable" },
"dsh": { "profile": { "bundles": [ "...", "ji-filable" ] } }
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

- `cordis.patch.yml` — 组合层补丁(插入 `ji-filable` 行)。
- `dsh/index.js` — 宿主半:`webServer` 路由(上传落盘),导出 `persistStream` 原子写入器与错误码常量。
- `lib/drop-logic.js` — 浏览器半纯逻辑(单一事实源,单测钉住;构建时内联进 client 包)。
- `lib/client.template.js` — 浏览器半模板(内联 drop-logic 的源)。
- `lib/client.js` — 生成的浏览器半 bundle(勿手改)。
- `scripts/build-client.mjs` — 生成 `lib/client.js` 的构建脚本。
- `CONTEXT.md` — 插件领域词表(agent 可读;不参与运行时)。
- `LICENSE` — MIT 许可证全文。

## 边界

- 仅接管**非白名单图片**;白名单图片(png/jpeg/webp/gif)始终放行给既有视觉流程。
- 目录拖入被静默忽略;纯白名单图片拖入走既有流程,本插件不处理。
- 落盘目录为会话工作区(可移动),重装/升级插件不影响已落盘文件(它们属于会话,不属于插件目录)。
