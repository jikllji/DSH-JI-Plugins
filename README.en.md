# DSH-JI-Plugins

English | [中文](README.md)

Personal plugins for DSH.

## Plugins

| Plugin | Description |
| --- | --- |
| [dsh-workspace-color](dsh-workspace-color/README.md) | A sidebar hierarchy-colour plugin: workspaces are coloured by parent/child depth automatically (or pinned individually), the current session title turns red, and the pinned-pin colour is customisable |
| [dsh-theme](dsh-theme/README.md) | A skinning plugin: takes DreamSkin skin packages, derives dsh's 118 design tokens from the pack's 10 colours (OKLCH lightness ramp plus a contrast guard), then registers the theme and applies the wallpaper |
| [dsh-filable](dsh-filable/README.md) | A file-upload plugin: drag images and files into chat and they land losslessly, under their original names, in the session workspace `sessionfiles/` dir, readable by the agent with existing tools |
| [dsh-skills](dsh-skills/README.md) | A built-in-style Skills plugin: lists the skills installed on this deployment by source in Settings, read-only, with cards matching dsh's built-in plugin-inventory page |

## Installing a plugin

Each plugin is a dsh bundle. The quickest way is straight from a tag (the sub-directory is picked automatically):

```powershell
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#<plugin>-v<version>&path:/<plugin>"
```

For example:

```powershell
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#dsh-theme-v0.6.0&path:/dsh-theme"
```

You can also unzip the release `.zip` and point at the directory, or install the `.tgz`. Restart `dsh web` afterwards (or press Ctrl+R in the page). See each plugin's README for details.

## License

MIT — see [LICENSE](LICENSE).
