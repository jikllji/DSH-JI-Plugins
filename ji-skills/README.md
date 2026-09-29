# JI-Skills

[English](README.en.md) | 中文

追求原版风格的「技能」插件:在设置页新增一个「技能」分区,按来源分块只读列出本机已安装的技能,卡片视觉对齐 dsh 内置的「内置插件」页。

当前版本 **0.2.0**。

## 功能

- **设置分区**:在设置页插入「技能」分区,只读展示,不提供开关。
- **来源分块**:「全局技能」= 本部署用户技能根里的技能(`<DSH_HOME>/skills`,默认 `~/.dsh/skills`;以及 `<DSH_AGENTS_HOME>/skills`,默认 `~/.agents/skills`)——正是每个 Agent 预设的 `skill-filesystem` 行都会扫到的用户根;每个 Agent 预设再各自成组,**只列它自己的增量**,避免把共享技能在每组里重复一遍。
- **搜索与筛选**:按名称 / 描述 / 标识搜索;右上角下拉在「全部技能」与任一来源之间切换。
- **卡片**:名称 + 描述(两行截断),点开看完整描述;同排卡片等高,底色 / 悬停 / 展开态用与内置插件页同一套 token(`--dsw-alias-settings-card-fill` / `-stroke`、`--dsw-radius-xl`、`--dsw-alias-interactive-bg-hover`、展开描边 `--dsw-alias-border-l3`),窄容器回落单列。
- **导航图标**:左侧导航的「技能」图标由插件自己提供,不改宿主源码。

## 安装

插件是一个 dsh bundle(`dsh.bundle.patch` + `dsh.client`),装入 web profile:

```bash
dsh plugin --profile web add <path-to-ji-skills>
# 重启 dsh web 生效
```

或手动:把本目录放到 profile 的 `vendor/ji-skills`,并在 profile `package.json` 里加

```json
"dependencies": { "ji-skills": "file:./vendor/ji-skills" },
"dsh": { "profile": { "bundles": [ "...", "ji-skills" ] } }
```

然后 `pnpm install` 并重启 `dsh web`。

## 结构

- `cordis.patch.yml` — 组合层补丁(插入 `ji-skills` 行)。
- `lib/index.js` — host 半:`/api/skills-settings/list` 路由;读用户技能根,并经各 Agent 预设的 scope 租约读它们的增量。
- `lib/client.js` — 浏览器半:设置分区(搜索 / 来源下拉 / 卡片)与导航图标样式。
- `LICENSE` — MIT 许可证全文。

## 边界

- **只读**:不启用 / 停用技能,也不改动任何技能文件。
- 「全局技能」只认用户技能根,不去猜「各预设的交集」:交集依赖预设数量与 provider 给出的 `path`,数量一变就整体归零。技能的身份是**名字**,不是 `path`。
- 因此某个只出现在个别预设里的技能会归到该预设组;若它的名字与全局某项相同,则仍算全局。
- 技能内容来自宿主的 skills 注册表与技能目录,插件只负责展示。

## 版本

- **0.2.0** — 首个发布版本。全局技能改为直接读用户技能根(`~/.dsh/skills`、`~/.agents/skills`),预设组只列增量;卡片视觉对齐内置插件页(同排等高、窄容器单列、展开描边与悬停同源)。
- 0.1.0 – 0.1.2 — 本地迭代(未发布):分区落地,来源分组返工两次(原先按 `path` 求交集,会把全局算成空),卡片与导航图标若干版视觉。