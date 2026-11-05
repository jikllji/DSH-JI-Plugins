# DSH-JI-Plugins

[English](README.en.md) | 中文

DSH 个人插件集合。

## 插件

| 插件 | 描述 |
| --- | --- |
| [dsh-workspace-color](dsh-workspace-color/README.md) | 侧边栏工作区分层配色：工作区按父子层级自动上色、也可单个固定颜色，当前会话标题标红，置顶图钉颜色可改 |
| [dsh-theme](dsh-theme/README.md) | 换肤插件：只认 DreamSkin 皮肤包，把包里的 10 个颜色派生成 dsh 的 118 个设计 token（带 OKLCH 明度阶梯与对比度守卫），注册主题并贴壁纸 |
| [dsh-filable](dsh-filable/README.md) | 文件上传插件：把图片和文件拖进聊天，按原始文件名无损落盘到会话工作区的 `sessionfiles/`，agent 用现有工具直接可读 |
| [dsh-skills](dsh-skills/README.md) | 追求原版风格的「技能」插件：在设置页按来源分块只读列出已安装技能，卡片视觉对齐内置插件页 |

## 安装插件

每个插件都是一个 dsh bundle。最简单是从 tag 直接装（自动取仓库里的子目录）：

```powershell
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#<插件>-v<版本>&path:/<插件>"
```

例如：

```powershell
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#dsh-theme-v0.6.0&path:/dsh-theme"
```

也可以下载 Release 里的 `.zip` 解压后指向目录，或直接用 `.tgz`。装完重启 `dsh web`（页面内按 Ctrl+R 亦可）。完整说明见各插件自己的 README。

## License

MIT — 见 [LICENSE](LICENSE)。
