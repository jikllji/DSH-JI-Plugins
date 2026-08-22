# JI-Theme

English | [中文](README.md)

A DSH-DreamSkin theme adapter plugin: brings Codex themes to DSH, theme library: https://dreamskin.cc/. Curated skins, a full custom-theme editor, and one-click import of DreamSkin `.zip` packages; wallpapers persist as real files, free of the localStorage quota.

## Features

- **Curated skins**: Ocean / Forest / Sunset (dark) and Paper / Sakura (light). Switching applies instantly — no restart.
- **Custom theme editor**: create, edit, and delete your own themes in Settings → Theme. A theme bundles: name, light/dark scheme, session background, surface / sidebar, primary text, secondary text, accent, surface alt, accent alt, secondary, highlight, and border colors, plus opacity sliders (surface, background image, mask). The full `--dsw-alias-*` token map is derived from these fields so the palette stays coherent.
- **Wallpapers as files**: the background image is part of the theme. Picked images are stored as real files (plugin `wallpapers/` dir) with original bytes — no compression, no dedup, 50 MB per-image cap — then tune zoom, horizontal / vertical position, and blur, with live "chat" and "settings" previews that follow every edit.
- **Wallpaper contract (single source)**: upload rules (media-type whitelist, 50 MB cap, naming rules, error codes) live only in the host-side `lib/contract.js` and are published via `GET /ji-theme/wallpapers/contract`; the browser fetches them at runtime and mirrors nothing — the two halves can never drift.
- **Auto-migration**: on first boot after upgrade, legacy `data:` inline wallpapers are migrated to files; a failing one keeps its colors and drops only the wallpaper, without blocking the rest.
- **DreamSkin import**: import `.zip` packages (theme.json + theme.css + background image) in one click; colors, image, art focus, and css font settings map automatically. The wallpaper is stored as-is; a wallpaper over 50 MB rejects the entire zip with a clear error.
- **Wallpaper lifecycle**: deleting a theme / replacing or removing its image synchronously removes the file (delete when the reference is gone); if a wallpaper file disappears externally, the theme card shows a "wallpaper missing" badge that clears itself once the file returns.
- **Persistence**: skin choice and custom themes live in `localStorage`; wallpaper files live on disk (content-addressed names → immutable URLs, stable across restarts).

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
- `lib/contract.js` — wallpaper contract module (media types / size cap / naming rules / error codes; pure functions, unit-testable).
- `lib/index.js` — host half (`webServer` routes: upload-to-disk / stream / delete / contract endpoint).
- `lib/client.js` — browser half (skins + custom theme editor + import + contract fetch).
- `LICENSE` — MIT license text.

## Boundaries

- The built-in Appearance row (Light / Dark / System) is untouched; JI-Theme works in the "Theme" section of Settings.
- Skin choice and theme metadata persist per-browser in `localStorage`; wallpaper files live on disk (`<plugin-dir>/wallpapers/`). Switching browsers/machines does not move wallpaper files with the localStorage data.
- A plugin reinstall/upgrade may wipe the plugin directory, taking the `wallpapers/` files with it — back them up (export) first if you need them.
- Import maps the fields DreamSkin packages share with JI-Theme; package-specific CSS beyond fonts is not preserved.
- Custom theme ids are `custom-<id>`, never colliding with the built-in `light`/`dark`/`system`.
