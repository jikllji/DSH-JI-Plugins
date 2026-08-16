# JI-Theme

[中文](README.zh.md) | English

A theme plugin for the dsh Web UI: curated skins, a full custom-theme editor, and one-click import of DreamSkin `.zip` packages — all persisted per browser.

## Features

- **Curated skins**: Ocean / Forest / Sunset (dark) and Paper / Sakura (light). Switching applies instantly — no restart.
- **Custom theme editor**: create, edit, and delete your own themes in Settings → Appearance → "JI Theme". A theme bundles: name, light/dark scheme, session background, surface / sidebar, primary text, secondary text, accent, surface alt, accent alt, secondary, highlight, and border colors, plus three opacity sliders (surface, background image, mask). The full `--dsw-alias-*` token map is derived from these fields so the palette stays coherent.
- **Theme-bound wallpaper**: the background image is part of the theme. Upload any image (auto-compressed to a data URL), then tune zoom, horizontal / vertical position, and blur — with live "chat" and "settings" previews that follow every edit.
- **DreamSkin import**: import `.zip` theme packages (theme.json + theme.css + background image) in one click. Colors, image, art focus, and css font settings are mapped automatically; when the package declares no opacity, background/surface opacity default to 1% so the wallpaper shows through by default. The imported theme is selected immediately.
- **Persistence**: skin choice and custom themes live in `localStorage` and restore on reload (third-party namespaces are not served over the host settings wire, which only exposes an allowlisted set).

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
- `lib/index.js` — host half (no-op entry so the loader can mount the package).
- `lib/client.js` — browser half (module-table bundle: skins + custom theme editor + import).
- `LICENSE` — MIT license text.

## Boundaries

- The built-in Appearance row (Light / Dark / System) is untouched; JI-Theme adds the "JI Theme" group to the Appearance section of Settings.
- Persistence is per-browser `localStorage`, not cross-device; clearing browser data drops it.
- Background images are re-encoded and compressed to at most ~2 MB data URLs; with many themes the browser's localStorage quota (typically ~5 MB) can fill up, in which case saves silently fail.
- Import maps the fields DreamSkin packages share with JI-Theme; package-specific CSS beyond fonts is not preserved.
- Custom theme ids are `custom-<id>`, never colliding with the built-in `light`/`dark`/`system`.
