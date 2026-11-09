# DSH-Filable

English | [中文](README.md)

A DSH file-upload plugin: drag any **file** (images included) into chat and it is stored losslessly, under its original filename, in the session workspace's `sessionfiles/` directory — browsable in Explorer, and readable by the agent with its normal tools (glob/read). Per category, drops can instead be handed to DSH's native attachment flow.

Current version **0.6.1**.

## Features

- **Configurable routing (0.6.1)**: the bottom of General settings has a "Dropped file handling" block with two switches — **Images** and **Other files** — each choosing **sessionfiles** (default, store on disk) or **Native** (hand to the DSH composer's native attachment flow). A lit switch means **sessionfiles**; off means **Native**. The choice persists in browser `localStorage` (`dsh-filable:settings`) and is per browser.
- **Drop takeover**: takes over file drops at the document **capture** phase (`preventDefault + stopPropagation`), then routes each category to the plugin or the native flow. Mixed drops are split by category: the sessionfile part is stored, the native part is forwarded to the host composer as a synthetic drop event.
- **Lossless storage**: the raw byte stream is written under the original name into `<session-workspace>\sessionfiles\` — no compression, no conversion; name collisions get a `name (1).ext` suffix, never overwriting. Per-file limit **100 MB** by default, overridable with the row config `maxBytes`.
- **Session workspace as the single authority**: the destination comes only from the session's `Session.header.cwd`; when it can't be resolved the upload fails closed (no trust in client-reported paths).
- **Atomic writer (`persistStream`)**: a host deep module that streams bytes + computes sha256 + writes with tmp+rename; error codes are contract constants (`too-large` → 413, `sha-mismatch` → 400, unknown session workspace → 400), directly unit-testable.
- **File cards (redesigned in 0.6.1)**: a card above the input dock shows a type badge / filename / size + status / an indeterminate progress rail while uploading; when ready it offers **Insert ref** and a ✕ remove button, and failures get a red border. Cards clear on session switch.
- **A real reference, not text (fixed in 0.4.0)**: insertion goes through the host's scoped `slash/input-insert-reference` event, so the host inserts a genuine chip node — **`@` references already in the draft are preserved**. (0.2.0 called `conversation.input.for(actx).setDraft(...)`, and the host's `setDraft` means "replace the whole draft with plain text", which flattened every existing reference into literal text.)
- **Drop hint**: dragging a file shows a full-screen hint layer whose look and copy match dsh's built-in composer DropOverlay (same two illustrations, same CSS: `--dsw-alias-bg-mask-drop` + `blur(10px)` + `--dsw-font-l-20/s-14`); its description line shows the live routing (Images: Native · Other files: sessionfiles); with no session it shows the built-in blocked illustration plus "Open a session before dropping images or files".
- **Protocol contract**: upload error codes are thrown by the host and matched by code on the client (message mapping); no bare strings couple across files.

## Install

DSH-Filable is a dsh bundle (`dsh.bundle.patch` + `dsh.client`) installed into the web profile:

```bash
# install from the GitHub repository (recommended)
dsh plugin --profile web add "git+https://github.com/jikllji/DSH-JI-Plugins.git#dsh-filable-v0.6.1&path:/dsh-filable"

# or point at a local directory (when editing the source)
dsh plugin --profile web add "C:\path\to\dsh-filable"

# restart dsh web to activate
```

Or manually: place this directory at the profile's `vendor/dsh-filable` and add to the profile `package.json`:

```json
"dependencies": { "dsh-filable": "file:./vendor/dsh-filable" },
"dsh": { "profile": { "bundles": [ "...", "dsh-filable" ] } }
```

Then `pnpm install` and restart `dsh web`.

## Build

`lib/client.js` is **generated**: it is assembled from `lib/client.template.js` + `lib/drop-logic.js` (drop-logic inlined at the template's `__DROP_LOGIC_INLINE__` marker). Rebuild after editing the template or drop-logic, or the drift test will fail:

```bash
node scripts/build-client.mjs
```

- Running code = tested module (unit tests pin `lib/drop-logic.js`; what ships is the rebuilt `lib/client.js`).
- Verify: run the vitest cases under `tests/`; `tests/build-client.spec.ts` asserts the deployed `lib/client.js` equals the generated output.

## Layout

- `cordis.patch.yml` — composition patch (inserts the `dsh-filable` row).
- `dsh/index.js` — host half: the `/dsh-filable/files` `webServer` route (upload-to-disk), row config `maxBytes`, and the exported `persistStream` atomic writer plus error-code constants.
- `lib/drop-logic.js` — browser pure logic (single source of truth, unit-tested; inlined into the client bundle at build time).
- `lib/client.template.js` — browser half template (the source that inlines drop-logic; drop listeners, file cards, the General-settings block and reference insertion live here).
- `lib/client.js` — generated browser bundle (do not edit by hand).
- `scripts/build-client.mjs` — the build script that emits `lib/client.js`.
- `CONTEXT.md` — plugin domain glossary (agent-readable; not part of the runtime).
- `LICENSE` — MIT license text.

## Boundaries

- Routing is per **category**, not per file: images (`image/*` or an image extension) and "other files" each take one path; a mixed batch is split and both paths can apply at once.
- **Native forwarding** requires a mounted composer (`[data-composer-card]`) and `DataTransfer`/`DragEvent` constructors in the page; when forwarding is impossible (settings page open, no composer) that part of the drop falls back to sessionfiles storage.
- Files on the native path are owned by the host: images go through the host's normalization and per-message image limits, other files go through the host's attachment upload; the plugin no longer stores or cards them.
- **Insert ref** inserts the `@file` reference chip at the **caret/selection at click time**: the click captures the editor selection and draft revision through the host's public action face `InputActions.captureInsertion()` (host detect coordinates, where one chip occupies a single U+FFFC), and `slash/input-insert-reference` replaces that span. With no retained selection it falls back to the end of the draft. After a successful insert, focus returns to the composer with the caret just past the new chip, ready for more typing.
- Directory drops are silently ignored.
- Files land in the (movable) session workspace, not the plugin dir — reinstalling/upgrading the plugin never touches already-uploaded files.
- Settings live in the local browser only and do not sync across browsers.

## Versions

- **0.6.1** — General settings gained a "Dropped file handling" block at the bottom with two switches (Images / Other files), each choosing **Native** or **sessionfiles** (default; lit switch = sessionfiles, off = Native), persisted in `localStorage`; mixed drops are split by category and the native part is forwarded to the host composer as a synthetic `drop` (marker `__dshFilableForwarded`); file cards redesigned (type badge, progress rail, Insert-ref pill, round remove button, hover/failure states); **Insert ref** now inserts at the **current caret/selection** instead of the end of the draft (the card click captures the selection and `draftRev` through the public `InputActions.captureInsertion()`, and `slash/input-insert-reference` replaces that span; no retained selection falls back to the end), returning focus to the composer with the caret right after the chip; `lib/drop-logic.js` gained the pure `fileCategory` / `normalizeSettings` / `loadSettings` / `saveSettings` / `planDrops` functions; the drop hint's description line shows the live routing.
- **0.6.0** — Renamed **ji-filable → dsh-filable**: package name, profile bundle row, host route `/dsh-filable/files`, drop-hint class prefix `dsh-filable-hint-*`, docs and examples all updated (no behavior change); restored the repo conventions (`LICENSE`, bilingual `README.md` Chinese / `README.en.md` English), added `files`/`scripts` manifest fields, and removed three stale `lib/client.js.bak-*` backups.
- **0.5.0** — MIME split removed: **every** dropped file (images included) is stored under the session workspace `sessionfiles/`, and the native image-attachment flow no longer receives drops; the drop hint layer now mirrors dsh's built-in composer DropOverlay (same two illustrations, same CSS variables, `ji-filable-hint-*` class names, "Drop images or files" title); `planUploads` no longer returns `skippedImages` and the "mixed batch, images skipped" toast is gone; `lib/drop-logic.js` drops the type-classification helpers `classifyFile` / `classifyBatch` / `dragTypes` / `shouldShowDropHint`, leaving the drop pipeline as just `planUploads` (the take-over set is every file).
- **0.4.1** — DSH **0.1.6-alpha.2** compatibility: that release moved "the session on screen" out of the sessions-service snapshot (`list.current`) into the view layer, so drops and Insert @path now take the Session identity from this plugin own session-scoped dock component (`props.sessionId`), fixing "open a session first" while a session is clearly open; `list.current` stays as the older-host fallback.
- **0.4.0** — fixes Insert @path destroying existing draft references (now goes through `slash/input-insert-reference`); implemented against DSH **0.1.6-alpha.1**'s composer contract; README now covers chip actions, mixed drops/hints, the size limit and `maxBytes`.
- 0.2.0 — DSH 0.1.2-rc.1 compatibility.
