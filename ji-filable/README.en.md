# JI-Filable

English | [中文](README.md)

A DSH file-upload plugin: drag any **non-image** file into chat and it is stored losslessly, under its original filename, in the session workspace's `sessionfiles/` directory — browsable in Explorer, and readable by the agent with its normal tools (glob/read).

## Features

- **Drop interception**: takes over non-whitelisted-image drops at the document **capture** phase, ahead of the composer's bubble-phase image-attachment flow; whitelisted images (png/jpeg/webp/gif) pass through to the existing vision flow.
- **Lossless storage**: the raw byte stream is written under the original name into `<session-workspace>\sessionfiles\` — no compression, no conversion; name collisions get a `name (1).ext` suffix, never overwriting.
- **Session workspace as the single authority**: the destination comes only from the session's `Session.header.cwd`; when it can't be resolved the upload fails closed (no trust in client-reported paths).
- **Atomic writer (`persistStream`)**: a host deep module that streams bytes + computes sha256 + writes with tmp+rename; error codes are contract constants (`too-large`/`sha-mismatch`), directly unit-testable.
- **Chip / toast feedback**: display-only chips above the input dock (filename / size / status), cleared on session switch; success/failure/hints render as `shell.overlay` toasts.
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
- `dsh/index.js` — host half: `webServer` route (upload-to-disk), exports the `persistStream` atomic writer and error-code constants.
- `lib/drop-logic.js` — browser pure logic (single source of truth, unit-tested; inlined into the client bundle at build time).
- `lib/client.template.js` — browser half template (the source that inlines drop-logic).
- `lib/client.js` — generated browser bundle (do not edit by hand).
- `scripts/build-client.mjs` — the build script that emits `lib/client.js`.
- `CONTEXT.md` — plugin domain glossary (agent-readable; not part of the runtime).
- `LICENSE` — MIT license text.

## Boundaries

- Intercepts only non-whitelisted images; whitelisted images (png/jpeg/webp/gif) always pass through to the existing vision flow.
- Directory drops are silently ignored; a pure whitelisted-image drop goes through the existing flow untouched.
- Files land in the (movable) session workspace, not the plugin dir — reinstalling/upgrading the plugin never touches already-uploaded files.
