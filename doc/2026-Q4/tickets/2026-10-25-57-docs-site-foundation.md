# 57: Docs site foundation

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
3); awaits the user's confirmation. Phase 6 of the plan; size M; step S21
of ticket 17; depends on ticket 42.

## Goal

audaudio.github.io becomes the place a developer starts. The repo gets
its `LICENSE`, a `README.de.md` or none, a changelog that records 0.1 to
0.4.1 and the engine page, a current `index.jsonc`; the site gets a
getting-started and installation page per platform as its first sidebar
entry, an ecosystem page generated from `packages.jsonc` with the state
of all 31 packages, the API reference under `/api/` from one `dart doc`
run over a synthetic umbrella in the deploy workflow with the Dart SDK,
and every pubspec of the family points at its page through
`documentation:`. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R16) and closes the
open work of docs-001 except the snippets (ticket 58).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `audaudio.github.io`: the repo hygiene, the two pages, the API build,
  the sidebar; the Audanika theme and logo if the brand assets exist
  (docs-001 open work); minor version.
- Every audaudio package: `documentation:` in the pubspec (patch
  versions, or bundled into the next release of each).
- `aud_audio_pm`: docs-001's open work updated; the ecosystem page reads
  `packages.jsonc`, which gains a `state` per package.

## Steps

1. The repo hygiene.
2. The getting-started page from the per-OS sections of the io, midi and
   sampler READMEs; the install with `tag_pattern` until pub.dev.
3. The ecosystem page and the `state` key.
4. `dart doc` in the deploy workflow; the sidebar link; the
   `documentation:` fields.
5. The theme, if assets exist.

## Open questions

- Brand assets (logo, palette) — do they exist? Else the theme waits.
- One `dart doc` over a synthetic umbrella (docs-001) or the per-package
  pages on pub.dev once the family is published? Proposal: the synthetic
  umbrella now, pub.dev later.
