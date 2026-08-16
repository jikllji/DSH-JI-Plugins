# JI-Theme

中文 | [English](README.md)

dsh Web UI 主题插件:精选皮肤 + 完整自定义主题编辑器 + DreamSkin `.zip` 主题包一键导入,全部按浏览器本地持久化。

## 功能

- **精选皮肤**:深海蓝 / 森林绿 / 落日紫(深色)、暖纸 / 樱花粉(浅色),切换即时生效、无需重启。
- **自定义主题编辑器**:设置 → 外观 →「JI 主题」,可新建/编辑/删除自己的主题。一个主题包含:名称、明暗、会话背景、表面 / 导航栏、主文字、次文字、强调色、次级表面、强调色·浅、次要色、高亮色、边框,以及三个透明度滑条(表面、背景图、遮罩);由此自动推导整套 `--dsw-alias-*` token,保证配色连贯。
- **与主题绑定的背景图**:背景图是主题的一部分。上传任意图片(自动压缩成 data URL),可调缩放、横向 / 纵向位置、模糊;「对话」「设置」两个实时预览会跟随每次改动。
- **DreamSkin 导入**:一键导入 `.zip` 主题包(theme.json + theme.css + 背景图),自动映射颜色、图片、焦点与 css 字体设置;主题包未声明透明度时,背景图 / 表面透明度默认 1%,背景图默认透出。导入后立即选中生效。
- **持久化**:皮肤选择与自定义主题存于 `localStorage`,刷新自动恢复(第三方命名空间不走 host 设置线,因其只对白名单命名空间开放)。

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
- `lib/index.js` — host 半(空入口,满足 loader 挂载)。
- `lib/client.js` — 浏览器半(模块表 bundle:皮肤 + 自定义主题编辑器 + 导入)。
- `LICENSE` — MIT 许可证全文。

## 边界

- 内置外观行(浅色 / 深色 / 跟随系统)不受影响;JI-Theme 在设置的「外观」分节里追加「JI 主题」分组。
- 持久化是按浏览器的 `localStorage`,非跨设备;清缓存即丢失。
- 背景图会重编码压缩到 ≤2MB 的 data URL;主题很多时可能写满浏览器 localStorage 配额(通常约 5MB),此时保存会静默失败。
- 导入只映射 DreamSkin 包与 JI-Theme 共有的字段,字体以外的包内 CSS 细节不保留。
- 自定义主题 id 为 `custom-<id>`,不与内置 `light`/`dark`/`system` 冲突。
