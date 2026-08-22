# DSH-JI-Plugins

English | [中文](README.md)

Personal plugins for DSH.

## Plugins

| Plugin | Description |
| --- | --- |
| [ji-theme](ji-theme/README.md) | A DSH-DreamSkin theme adapter plugin: brings Codex themes to DSH, theme library: https://dreamskin.cc/ |
| [ji-filable](ji-filable/README.md) | A file-upload plugin: drag any non-image file into chat and it is stored losslessly under its original name in the session workspace's `sessionfiles/`, readable by the agent |

## Installing a plugin

Each plugin is a dsh bundle. See the plugin's own README for full instructions; in short:

```bash
dsh plugin --profile web add <path-to-plugin-dir>
# restart dsh web to activate
```

## License

MIT — see [LICENSE](LICENSE).
