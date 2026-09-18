# JI-Filable

English | [中文](README.md)

A DSH file-upload plugin: drag any **non-image** file into chat and it is stored losslessly, under its original filename, in the session workspace's `sessionfiles/` directory — browsable in Explorer, and readable by the agent with its normal tools (glob/read).

Current version **0.4.1**.

## Features

- **Drop interception**: takes over non-whitelisted file drops at the document **capture** phase, ahead of the composer's bubble-phase image-attachment flow; whitelisted images (png/jpeg/webp/gif) pass through to the existing vision flow.
- **Lossless storage**: the raw byte stream is written under the original name into `<session-workspace>\sessionfiles\` — no compression, no conversion; name collisions get a `name (1).ext` suffix, never overwriting. Per-file limit **100 MB** by default, overridable with the row config `maxBytes`.
- **Session workspace as the single authority**: the destination comes only from the session's `Session.header.cwd`; when it can't be resolved the upload fails closed (no trust in client-reported paths).
- **Atomic writer (`persistStream`)**: a host deep module that streams bytes + computes sha256 + writes with tmp+rename; error codes are contract constants (`too-large` → 413, `sha-mismatch` → 400, unknown session workspace → 400), directly unit-testable.
- **Chip and its actions**: a chip above the input dock shows filename / size / status (uploading → ready / failed); the ✕ on its left removes just that entry, and **Insert @path** appends that file's native reference to the current draft. Chips clear on session switch.
- **A real reference, not text (fixed in 0.4.0)**: insertion goes through the host's scoped `slash/input-insert-reference` event, so the host inserts a genuine chip node — **`@` references already in the draft are preserved**. (0.2.0 called `conversation.input.for(actx).setDraft(...)`, and the host's `setDraft` means "replace the whole draft with plain text", which flattened every existing reference into literal text.)
- **Mixed batches and hints**: when a drop contains both whitelisted images and other files, the other files upload and the images are skipped with a hint to drop them separately; a full-screen hint layer shows for non-image drags, and a grey "open a session first" variant appears with no session.
- **Protocol contract**: upload error codes are thrown by the host and matched by code on the client (message mapping); no bare strings couple across files.

## Install

JI-Filable is a dsh bundle (`dsh.bundle.patch` + `dsh.client`) installed into the web profile:

```bash
dsh plugin --profile web add <path-to-ji-filable>
# restart dsh web to activate
```

Or manually: place this directory at the profile's `vendor/ji-filable` and add to the profile `package.json`:

```json
"dependencies": { "ji-filable": "file:./vendor/ji-filable" },
"dsh": { "profile": { "bundles": [ "...", "ji-filable" ] } }
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

- `cordis.patch.yml` — composition patch (inserts the `ji-filable` row).
- `dsh/index.js` — host half: the `/ji-filable/files` `webServer` route (upload-to-disk), row config `maxBytes`, and the exported `persistStream` atomic writer plus error-code constants.
- `lib/drop-logic.js` — browser pure logic (single source of truth, unit-tested; inlined into the client bundle at build time).
- `lib/client.template.js` — browser half template (the source that inlines drop-logic; drop listeners, chips and reference insertion live here).
- `lib/client.js` — generated browser bundle (do not edit by hand).
- `scripts/build-client.mjs` — the build script that emits `lib/client.js`.
- `CONTEXT.md` — plugin domain glossary (agent-readable; not part of the runtime).
- `LICENSE` — MIT license text.

## Boundaries

- Intercepts only **non-whitelisted images** (anything outside png/jpeg/webp/gif, including svg/tiff/heic); whitelisted images always pass through to the existing vision flow.
- **Insert @path** appends the reference at the **end of the draft** — the host exposes no "insert at caret" surface, and the insert point is computed in the host's detect coordinates (one chip occupies a single U+FFFC there).
- Directory drops are silently ignored; a pure whitelisted-image drop goes through the existing flow untouched.
- Files land in the (movable) session workspace, not the plugin dir — reinstalling/upgrading the plugin never touches already-uploaded files.

## Versions

- **0.4.1** — DSH **0.1.6-alpha.2** compatibility: that release moved "the session on screen" out of the sessions-service snapshot (`list.current`) into the view layer, so drops and Insert @path now take the Session identity from this plugin own session-scoped dock component (`props.sessionId`), fixing "open a session first" while a session is clearly open; `list.current` stays as the older-host fallback.
- **0.4.0** — fixes Insert @path destroying existing draft references (now goes through `slash/input-insert-reference`); implemented against DSH **0.1.6-alpha.1**'s composer contract; README now covers chip actions, mixed drops/hints, the size limit and `maxBytes`.
- 0.2.0 — DSH 0.1.2-rc.1 compatibility.