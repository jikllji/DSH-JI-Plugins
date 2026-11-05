# dsh-theme

[English](README.en.md) | 中文

Theme skins for the dsh web UI, driven by [DreamSkin](https://dreamskin.cc/) packages. One input format only: `theme.json` + a wallpaper. The plugin's job is to turn a skin's 10 colours into the 118 design tokens dsh consumes — and to guarantee the result stays readable.

```
DreamSkin package (10 colours + wallpaper)
        │
        ├─ lib/kernel.js      derivation kernel (OKLCH surface ladder + contrast guard)
        │
        ├─ lib/client.js      browser half: settings UI, previews, theme registration, wallpaper
        └─ lib/store.js       host half: package store (zip import / list / export / delete)
```

## What changed in 0.6

| Problem | 0.5 behaviour | 0.6 behaviour |
|---|---|---|
| Inaccurate mapping | 10 colours piped straight into 69 tokens; the other 156 kept dsh defaults | 118 derived tokens; surfaces built on an OKLCH lightness ladder; text re-derived against its background |
| Panels washed out | Opacity "scraped" from the first `rgba` in `theme.css` — usually a border or hover veil — falling back to 1% | Only `background-color` alpha counts; tool surfaces (settings, dialogs, menus) are pinned opaque |
| Light skins judged dark | `appearance !== "light"` meant dark | `auto` is resolved from background luminance; the Codex light skin is now correctly light |
| Nothing to preview | A 52px swatch and a 44×30 thumbnail | Inline chat/settings duet previews with the real wallpaper and real tokens, plus a contrast and token-coverage readout |

Also new: a content-opacity dial (30–100%, default 70%), four frosted-glass levels (off / light 6px / medium 14px / heavy 26px, default medium — it blurs the wallpaper image itself, so it does not depend on the host's `backdrop-filter`), and a wallpaper-zoom dial (100–250%); the in-panel preview uses the very same parameters, so dragging any dial shows the result in place; the chosen skin survives a restart; wallpaper placement honours `art.taskMode` (`cover` / `contain`) and `art.focusX/Y`; dark and light shells.

## Install

From the repo:

```bash
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#dsh-theme-v0.6.0&path:/dsh-theme"
# restart dsh web
```

From a local checkout, mount it as a link dependency:

```jsonc
// ~/.dsh/profiles/<profile>/package.json
{
  "dependencies": { "dsh-theme": "link:Z:/path/to/dsh-theme" },
  "dsh": { "profile": { "bundles": ["dsh-theme"] } }
}
```

Then open Settings → Theme. Skins you import are kept under `packages/` inside the plugin directory — that folder is user data, not part of the repo.
## Package format

```
my-skin.zip
├── manifest.json   publisher / version / capabilities
├── theme.json      name / appearance / colors{10} / art{focusX,focusY,taskMode,safeArea}
├── theme.css       optional; used only to read background-layer alpha
└── background.jpg  wallpaper
```

- `appearance`: `light` / `dark` / `auto`. With `auto`, the decision comes from the relative luminance of `colors.background`.
- `colors.panelAlt` may be rgba (real packages ship `rgba(219,234,255,0.48)`); unparsable values degrade safely.
- Archives without `theme.json` are rejected (400 `BAD_PACKAGE`).

## In the settings pane

- Left column: installed skins — click to preview, check to apply, drop a `.zip` to import.
- Right column: chat / settings duet preview. The chat side layers the real wallpaper; the settings side stays opaque — the proof that theming never costs legibility.
- Audit row: body contrast, settings contrast, token coverage (118 / 124).
- Content opacity: only affects the main content area, never the settings pane or dialogs; 30% keeps the wallpaper sharpest, 100% hides it, default 70%.
- Frosted glass: blurs the wallpaper image itself (scaled to hide the blurred edge) in four steps; both controls apply instantly, persist, and drive the in-panel preview directly.
- Wallpaper zoom: 100–250%, scales the wallpaper around its centre so you can crop into a detail; it composes with the frosted glass.
- Restart: the selected skin and all three dials are stored locally and re-applied after the host restores its own appearance preference.
- Reset: clears the active skin and returns to the stock dsh look.

## Commands

```bash
node tools/build-client.mjs      # kernel + template -> lib/client.js
node tools/check-kernel.mjs      # 11 packages x 8 contrast assertions
node tools/check-packages.mjs    # package store contract
node tools/check-client.mjs      # bundle self-test (derive / markup / surfaceAlpha)
npm run check                    # all of the above + build freshness
```

`lib/client.js` is generated. After editing `lib/kernel.js` or `lib/client.template.js`, rebuild.

## Limitations

- DreamSkin packages only; the legacy dsh-v2 format (`skin.json` + `patches.css`) is gone.
- The contrast guard adjusts lightness only, so very saturated skins get slightly deepened.
- Wallpapers use `background-size: cover`, so ultrawide screens crop the sides.

## License

MIT
