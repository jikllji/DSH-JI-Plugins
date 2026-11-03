# dsh-workspace-color

English | [中文](README.md)

Colours the workspaces in the DSH sidebar by **identity**: one workspace always keeps one colour — reordering, dragging and restarts don't change it.

Colour blocks nest by **containment**: each workspace's block covers its whole subtree, child workspaces inset one level inside the parent's block, lighter outside and deeper inside, so the hierarchy is visible at a glance. Session rows stay transparent and simply follow the block they sit in.

Hover a workspace row and a palette icon appears left of the "⋯" — pin any colour to that one workspace. Everything else falls back to automatic hierarchy colouring (same depth = same colour, parent ≠ child, within one branch).

All settings live in **Settings → Sidebar colours**.

> Version **0.10.0** · Targets DSH **0.2.1-rc.2** · MIT · presentation layer only, never touches data
>
> Colour algorithm inspired by `https://github.com/lsb0554/dsh-sidebar-color`

---

## Features

- **Nested hierarchy blocks**: a parent workspace's block wraps its entire subtree, children inset one level per depth (8px left / 4px right, capped at 6 levels) with the corner radius shrinking as depth grows; 6px gaps between blocks let the outer colour peek through, so containment is obvious.
- **Lighter outside, deeper inside**: depth 0 is the faintest, each level adds more colour (6% + 3% per level by default), so even many levels never turn into mush.
- **Automatic hierarchy colours**: within one branch the same depth shares a colour and adjacent depths differ — siblings match, parents don't. Root workspaces pick their starting hue from their own id, so different branches are offset.
- **Background-aware hues**: automatic colours first give up a ±45° conflict arc around the background hue, then split the remaining 270° into 6 steps (45° each), so nothing lands too close to the sidebar background.
- **12 dot presets**: 9 coloured presets (red, orange, yellow, green, cyan, blue, indigo, purple, magenta) plus white, grey and black. Coloured presets fix only the hue; lightness and chroma come from one shared TONE (light L 0.55 / C 0.11, dark L 0.76 / C 0.095), so block opacity and text legibility stay consistent.
- **System colour picker**: the last rainbow dot opens the native picker for any colour; by default it is *harmonised* — only your hue is kept while lightness and chroma are recomputed for the current theme, so custom colours match the presets (can be turned off in Settings).
- **Back to automatic**: click the already-selected preset again to drop the manual colour for that workspace.
- **Current session title in red**: find the conversation you are reading even with every folder expanded.
- **Custom pinned-pin colour**: the pin on session rows can get its own colour; follows the theme by default.
- **Light and dark themes**: colours are generated per theme, and manual picks are recomputed when the theme switches.

## Install

The plugin is a dsh bundle attached to a profile. The examples below use the `web` profile at `C:\Users\Jikll\.dsh\profiles\web`.

### One-shot script (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Profile desktop
```

The script copies this directory to `~/.dsh/plugins/dsh-workspace-color`, registers the dependency and `dsh.profile.bundles` entry in the profile's `package.json`, then installs with DSH's bundled pnpm.

### Manual install

1. Put the source directory anywhere stable.
2. In the profile's `package.json`, add to `dependencies`:

   ```json
   "dsh-workspace-color": "file:<path-to-dsh-workspace-color>"
   ```

   and add to the `dsh.profile.bundles` array:

   ```json
   "dsh-workspace-color"
   ```

3. Run `pnpm install` in the profile directory and confirm `node_modules/dsh-workspace-color` exists.
4. Reload the DSH page (Ctrl+R).

### Verify

- Workspace rows in the sidebar get colour blocks, and hovering one shows the palette icon left of "⋯";
- **Settings → Sidebar colours** opens.

## Usage

### Settings page

Three sections, with the title and a master switch on top:

- **Preview** — a small sample sidebar (3 root workspaces, `design-system` carrying a child workspace `tokens`) rendered live with the very same colour-mix formula as the real sidebar. The light/dark switch in the corner picks which palette you are previewing, and therefore which theme the tuning pills below apply to.
- **Colours** — left column *hierarchy blocks* (outermost strength / per-level step), right column *tuning* (lightness L / chroma C); the row underneath shows the 6 hue slots this theme ended up with.
- **Marks** — red title, pin colour, whether custom colours keep only their hue, and the count of manually-coloured workspaces with a clear button.

| Setting | Effect | Default |
| --- | --- | --- |
| Enable (header switch) | Off restores the native sidebar palette; the preview dims with it | on |
| Current session title in red | Highlights the current session title in red | on |
| Pinned-pin colour | Colour of the pin on session rows (empty = follow theme) | follow theme |
| Outermost strength | Mix ratio of the depth-0 block | 6% |
| Per-level step | Extra mix ratio added per level | 3% |
| Lightness / chroma | L / C (OKLCH) for presets and automatic colours in the current theme | L 0.55/0.76, C 0.11/0.095 |
| Custom colours keep only hue | Manual picks keep their hue only; lightness and chroma are recomputed | on |
| Manually-coloured workspaces · Clear | Drops every manual workspace colour at once | — |
| Restore defaults (footer) | Back to factory settings | — |

### Colour one workspace

1. Hover the workspace row you want to change;
2. Click the palette icon left of "⋯";
3. Pick a preset dot, or click the rainbow dot and use the system picker;
4. To go back to automatic colours, click the currently selected dot again.

Manual colours are stored per workspace id and only affect that workspace's own block, icon and title — child workspaces keep following the hierarchy.

## Colour algorithm

Colours are generated in **OKLCH**, a perceptually uniform space:

- **Shared lightness**: coloured presets fix only hue H, while lightness L and chroma C come from one shared TONE, so every preset has the same perceived brightness and the same opacity over the background;
- **Background-aware**: `buildHues(count, bgHue, 45)` first gives up a ±45° arc around the background hue, then splits the remaining 270° safe arc, so blocks never clash with the background;
- **Hierarchy stepping**: a root workspace hashes its id into a starting slot; each further level walks ±1 slot (45°), which keeps same-depth colours equal and parent/child colours apart;
- **Out-of-gamut handling**: when an sRGB conversion falls outside the gamut, chroma is lowered step by step rather than changing L or H, preserving brightness and hue.

The background hue is measured once per theme when the plugin mounts; primary button colours, row hover fills and friends all come from DSH theme variables.

## Development

`client.js` is a static browser bundle — **reload the page** to load new code; the host's `patchReload: 'live'` only covers `index.js`.

### Two copies

| Location | Role |
| --- | --- |
| This repository (`dsh-workspace-color/`) | development source |
| `C:\Users\Jikll\.dsh\profiles\web\node_modules\dsh-workspace-color\` | the copy DSH actually loads |

After editing `client.js`:

```powershell
node --check client.js
Copy-Item .\client.js   "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-workspace-color\client.js" -Force
Copy-Item .\package.json "$env:USERPROFILE\.dsh\profiles\web\node_modules\dsh-workspace-color\package.json" -Force
```

Then press Ctrl+R in the page.

### Self-check

- `node --check client.js` passes;
- the installed copy hashes the same as the source;
- after reload, **Settings → Sidebar colours** is there, blocks and palette icon behave.

## How it works

- Every sidebar workspace is a `groupSection` container (inline `--dsh-workspace-indent = depth × 12px`), and child workspaces render recursively as a deeper `groupSection` — parent/child is real nesting, which is why blocks can inset by containment.
- The plugin is presentation only: it tags blocks/rows with `data-ws-*` attributes, injects one stylesheet and writes inline `--ws-color` as needed. It never touches data or the server.
- Rows are wrapped in an extra HoverCard `span`, so every selector is a descendant selector and never depends on DSH's hashed class names.
- Disabling the plugin (or the "Enable" switch) immediately clears all attributes and inline variables and restores the native sidebar.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| No colour blocks | Reload the page; make sure the installed `client.js` matches the source and the profile's `dsh.profile.bundles` contains `dsh-workspace-color` |
| Code changes do nothing | `client.js` is a static bundle — Ctrl+R is required; confirm you edited the copy under the profile's `node_modules` |
| No palette icon on hover | The entry only appears on workspace (folder) rows, not session rows |
| Settings section missing | Reload, then reopen Settings; the section is called "Sidebar colours" |
| Colours differ from expectations | Automatic colours depend on the background hue; use the palette to pin a workspace colour if you want it fixed |

## Layout

```
dsh-workspace-color/
├─ client.js          # browser side: blocks / tree / colour panel + settings section (~2.0k lines)
├─ index.js           # host side: empty (declares the name only)
├─ cordis.patch.yml   # bundle patch: inserts one plugin entry into the profile
├─ package.json       # manifest: dsh.bundle / dsh.client + deps
├─ install.ps1        # one-shot install for Windows
├─ install.sh         # one-shot install for macOS / Linux
├─ README.md          # Chinese (default)
├─ README.en.md       # English
├─ LICENSE
└─ .gitattributes / .gitignore
```

## Changelog

- **0.10.0** — Settings page redesign: page title + master switch, live sample-sidebar preview (light/dark switch also selects which theme "tuning" edits), hierarchy and tuning side by side, all controls hand-drawn on DSH theme tokens (light/dark follow automatically), and the settings page keeps its styling while the plugin is disabled. Setting semantics unchanged.
- **0.9.1** — Metadata and docs cleanup: rewrote the README, removed early screenshots and stray repository links.
- **0.9.0** — Preset panel rework: 12 dots = 9 hue anchors (shared lightness/chroma) + white/grey/black; the system picker is harmonised by default (can be turned off); automatic colours now avoid the background hue and split 6 slots; old manual colours are migrated.
- **0.8.x** — Hover palette entry (left of "⋯"), dot colour panel, pinned-pin colour, palette icon in the Settings navigation, separate parent/child text colours.
- **0.8.0** — Colour entry appears on hover; popover replaced by dots + system picker.
- **0.7.0** — Fixed preset colours replace hue sliders; inline colour square on rows.
- **0.6.x** — Settings moved into the built-in Settings page; nested parent/child blocks; hierarchy colouring became same-depth-same-colour, parent ≠ child.

## License

MIT
