# JI-Theme

[English](README.en.md) | 中文

dsh Web UI 主题插件:精选皮肤 + 完整自定义主题编辑器 + DreamSkin `.zip` 主题包一键导入。壁纸以真实文件持久化,不受 localStorage 配额限制。

## 功能

- **精选皮肤**:深海蓝 / 森林绿 / 落日紫(深色)、暖纸 / 樱花粉(浅色),切换即时生效、无需重启。
- **自定义主题编辑器**:设置 → 主题,可新建/编辑/删除自己的主题。一个主题包含:名称、明暗、会话背景、表面 / 导航栏、主文字、次文字、强调色、次级表面、强调色·浅、次要色、高亮色、边框,以及透明度滑条(表面、背景图、遮罩);由此自动推导整套 `--dsw-alias-*` token,保证配色连贯。
- **壁纸以文件落盘**:背景图是主题的一部分。选图后原始字节以真实文件存储(插件目录 `wallpapers/`),不压缩、不去重、单张上限 50MB;可调缩放、横向 / 纵向位置、模糊。「对话」「设置」两个实时预览跟随每次改动。
- **壁纸契约(单一来源)**:上传规则(媒体类型白名单、50MB 上限、命名规则、错误码)只由宿主侧 `lib/contract.js` 承载,并通过 `GET /ji-theme/wallpapers/contract` 发布;浏览器侧运行时获取、零镜像——两端永不漂移。
- **自动迁移**:升级后首次启动,旧的 `data:` 内联壁纸自动迁移为文件;单个失败则保留颜色、清空该壁纸,不阻塞其余主题。
- **DreamSkin 导入**:一键导入 `.zip` 主题包(theme.json + theme.css + 背景图),自动映射颜色、图片、焦点与 css 字体设置;壁纸原样落盘,超过 50MB 时整个 zip 拒绝导入并明确报错。
- **壁纸生命周期**:删除主题 / 更换壁纸 / 移除图片时,磁盘文件同步清理(引用归零即删);壁纸文件被外部删除时,主题卡片显示「壁纸缺失」角标,文件恢复后自动消失。
- **持久化**:皮肤选择与自定义主题存于 `localStorage`,刷新自动恢复;壁纸文件在磁盘上跨重启稳定(内容寻址命名,URL 不可变)。

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
- `lib/contract.js` — 壁纸契约模块(媒体类型 / 体积上限 / 命名规则 / 错误码;纯函数,可单测)。
- `lib/index.js` — 宿主半(`webServer` 路由:上传落盘 / 流式返回 / 删除 / 契约端点)。
- `lib/client.js` — 浏览器半(皮肤 + 自定义主题编辑器 + 导入 + 契约拉取)。
- `LICENSE` — MIT 许可证全文。

## 边界

- 内置外观行(浅色 / 深色 / 跟随系统)不受影响;JI-Theme 在设置的「主题」分节工作。
- 皮肤选择与主题元数据按浏览器存于 `localStorage`;壁纸文件存于磁盘(`<插件目录>/wallpapers/`),换浏览器/换机器后壁纸文件不随 localStorage 迁移。
- 插件重装/升级可能清空插件目录,`wallpapers/` 内的壁纸文件随之丢失——需要备份时请先导出。
- 导入只映射 DreamSkin 包与 JI-Theme 共有的字段,字体以外的包内 CSS 细节不保留。
- 自定义主题 id 为 `custom-<id>`,不与内置 `light`/`dark`/`system` 冲突。
