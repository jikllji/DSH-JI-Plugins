# DSH-JI-Plugins

[English](README.en.md) | 中文

DSH 个人插件集合。

## 插件

| 插件 | 描述 |
| --- | --- |
| [ji-theme](ji-theme/README.md) | DSH-DreamSkin 主题适配插件:使 DSH 能够使用 Codex 主题,主题库:https://dreamskin.cc/ |
| [ji-filable](ji-filable/README.md) | 文件上传插件:把非图片文件拖进聊天,按原始文件名无损落盘到会话工作区的 `sessionfiles/`,agent 可直接读取 |

## 安装插件

每个插件都是一个 dsh bundle。完整说明见插件各自的 README,简要如下:

```bash
dsh plugin --profile web add <插件目录路径>
# 重启 dsh web 生效
```

## License

MIT — 见 [LICENSE](LICENSE)。
