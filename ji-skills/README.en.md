# JI-Skills

English | [中文](README.md)

A built-in-style Skills plugin: it adds a **Skills** section to Settings that lists the skills installed on this deployment by source, read-only, with cards that match dsh's built-in plugin-inventory page.

Current version **0.2.0**.

## Features

- **Settings section**: inserts a read-only **Skills** section into Settings; there is no enable/disable switch.
- **Grouped by source**: "Global" is what lives in this deployment's user skill roots (`<DSH_HOME>/skills`, default `~/.dsh/skills`, plus `<DSH_AGENTS_HOME>/skills`, default `~/.agents/skills`) — the very roots every agent preset's `skill-filesystem` row scans. Each agent preset then gets its own group holding **only what it adds on top**, so shared skills are not repeated in every group.
- **Search and filter**: search over name / description / identity, and a dropdown that switches between "All skills" and any one source.
- **Cards**: name plus a two-line description, expanding to the full description; cards in a row share their height, and the surface / hover / expanded colours come from the same tokens as the built-in plugin-inventory page (`--dsw-alias-settings-card-fill` / `-stroke`, `--dsw-radius-xl`, `--dsw-alias-interactive-bg-hover`, expanded stroke `--dsw-alias-border-l3`), collapsing to one column in a narrow container.
- **Navigation icon**: the plugin supplies the Settings navigation icon for "Skills" itself, with no host source change.

## Install

The plugin is a dsh bundle (`dsh.bundle.patch` + `dsh.client`). Install it into the web profile:

```bash
dsh plugin --profile web add <path-to-ji-skills>
# restart dsh web to activate
```

Or manually: place this directory at the profile's `vendor/ji-skills` and add to the profile `package.json`:

```json
"dependencies": { "ji-skills": "file:./vendor/ji-skills" },
"dsh": { "profile": { "bundles": [ "...", "ji-skills" ] } }
```

Then `pnpm install` and restart `dsh web`.

## Layout

- `cordis.patch.yml` — composition patch (inserts the `ji-skills` row).
- `lib/index.js` — host half: the `/api/skills-settings/list` route; reads the user skill roots and, through each agent preset's scope lease, that preset's delta.
- `lib/client.js` — browser half: the settings section (search / source dropdown / cards) and the navigation-icon stylesheet.
- `LICENSE` — MIT license text.

## Boundaries

- **Read-only**: it never enables, disables or edits a skill file.
- "Global" is defined by the user skill roots, not by intersecting the presets: an intersection depends on how many presets exist and on the provider-supplied `path`, and collapses to nothing as soon as either changes. A skill's identity is its **name**, not its `path`.
- A skill that only some presets expose therefore lands in that preset's group; if it shares a name with a global skill it counts as global.
- Skill content comes from the host's skills registry and skill directories — the plugin only presents it.

## Versions

- **0.2.0** — first published version. Global now reads the user skill roots (`~/.dsh/skills`, `~/.agents/skills`) and preset groups hold deltas only; the cards were aligned with the built-in plugin-inventory page (equal-height rows, single column when narrow, expanded stroke and hover from the same tokens).
- 0.1.0 – 0.1.2 — local iterations (unpublished): the section landed, the source grouping was reworked twice (it intersected by `path` first, which made Global come out empty), and the cards and navigation icon went through several looks.