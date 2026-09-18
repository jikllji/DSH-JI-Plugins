# JI-Theme

[中文](README.md) | English

A theme plugin for the dsh Web UI: curated skins, a full custom-theme editor, and one-click import of DreamSkin and DSH v2 `.zip` packages, with every package kept in a host-side store.

## Features

- **Curated skins**: Ocean / Forest / Sunset (dark) and Paper / Sakura (light). Switching applies instantly — no restart.
- **Custom theme editor**: create, edit, and delete your own themes in Settings → Appearance → "JI Theme". A theme bundles: name, light/dark scheme, session background, surface / sidebar, primary text, secondary text, accent, surface alt, accent alt, secondary, highlight, and border colors, plus three opacity sliders (surface, background image, mask). The full `--dsw-alias-*` token map is derived from these fields so the palette stays coherent.
- **Theme-bound wallpaper**: the background image is part of the theme. Upload any image; the host stores its original bytes and the theme keeps only the URL, then tune zoom, horizontal / vertical position, and blur with live "chat" and "settings" previews.
- **Dual-format import**: import DreamSkin `.zip` packages (`manifest.json` + `theme.json` + `theme.css` + art) and DSH v2 skin packages (`skin.json` + `skin.css` + optional `patches.css` / `hooks.mjs` + assets) in one click. DreamSkin colors, art focus, CSS parts, and `--ds-theme-*` variables are translated; v2 stylesheets, patches, light/dark background media, and trusted hooks install as-is.
- **Host package store**: every imported ZIP is kept intact as `packages/<id>/source.zip` with extracted files under `packages/<id>/files/`. The settings section lists, selects, exports, and deletes packages; `localStorage` only keeps the active selection.
- **Package overrides**: DreamSkin packages edit through a host-side override layer (the original package stays untouched); DSH v2 packages expose a CSS override editor. Save or reset re-applies the package immediately; export still returns the original ZIP.
- **Persistence**: imported packages and their assets live on the host; the active selection and custom themes stay in `localStorage`.

## Install

JI-Theme is a dsh bundle (`dsh.bundle.patch` + `dsh.client`) installed into the web profile:

```bash
dsh plugin --profile web add <path-to-ji-theme>
# restart dsh web to activate
```

Or manually: place this directory at the profile's `vendor/ji-theme` and add to the profile `package.json`:

```json
"dependencies": { "ji-theme": "file:./vendor/ji-theme" },
"dsh": { "profile": { "bundles": [ "...", "ji-theme" ] } }
```

Then `pnpm install` and restart `dsh web`.

## Layout

- `cordis.patch.yml` — composition patch (inserts the `ji-theme` row).
- `lib/index.js` — host half: wallpaper routes plus the `/ji-theme/packages` store routes.
- `lib/store.js` / `lib/zip.js` — package persistence and ZIP extraction.
- `lib/client.js` — browser half (module-table bundle: skins + custom theme editor + import).
- `LICENSE` — MIT license text.

## Boundaries

- The built-in Appearance row (Light / Dark / System) is untouched; JI-Theme adds the "JI Theme" group to the Appearance section of Settings.
- Imported packages live in the host store; the active-selection hint and custom themes stay in per-browser `localStorage`, so clearing browser data does not delete packages.
- Uploaded wallpaper bytes are stored as host files without re-encoding; deleting a custom theme removes its wallpaper file.
- DreamSkin CSS is translated through the DSH part map and keeps unknown parts under their original selector; exact Codex layout parity is not possible where DSH has no equivalent part.
- DSH v2 hooks execute package code only after explicit trust confirmation; declined hooks leave the static stylesheet and background active.
- Custom theme ids are `custom-<id>`, never colliding with the built-in `light`/`dark`/`system`.
