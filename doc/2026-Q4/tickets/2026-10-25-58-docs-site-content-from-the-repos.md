# 58: Docs site content from the repos

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
3); awaits the user's confirmation. Phase 6 of the plan; size L; step S21
of ticket 17; depends on tickets 56 and 57.

## Goal

The site documents every implemented package, and its code is true. The
`sync-packages` script of docs-001 copies one `doc/` page per package —
core (the ABI, the event and timing formats, the preset schema), sampler,
effects, midi, script, ui_controls, vst3 with `plugin-bundle.md`, the
shells as planned — into `guides/packages/`, so the repos stay the source
of truth. The vitest files that hold Dart as string literals give way to
the Dart test package docs-001 describes: `test/content/docs/<page>_test.
dart` pinned to the released packages, run by `dart test` before `astro
build`, rendering through the offline renderer and the fake IO, with
goldens next to the page; the drift between the engine page and the
umbrella README ends. A cookbook grows from `aud_audio/example` and
`aud_dsp_effects/example`; the benchmark page renders the JSON of ticket
56; a licensing page (license-001 to 003, the notices, Link, ASIO, the
sfizz fork), a contribution guide (the gg workflow, the review) and
release notes with the ABI version complete the site. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R16).

## Requirements

From the area [framework](../../requirements/framework.md), accepted
2026-10-25:

- req-framework-004: The exported API is documented

## Affected repos

- `audaudio.github.io`: the script, the Dart test package, the pages, the
  goldens; minor version.
- `aud_audio_core`, `aud_dsp_sampler`, `aud_dsp_effects`, `aud_audio_midi`,
  `aud_audio_script`, `aud_audio_ui_controls`, `aud_audio_vst3`: one
  `doc/<package>.md` page each, written from the README of ticket 42;
  patch versions.
- `aud_audio_bench`: the JSON the page reads (ticket 56).

## Steps

1. The Dart test package in the site; the four existing pages' snippets
   as real tests with goldens; the string specs deleted.
2. The sync script and the seven package pages.
3. The cookbook from the examples.
4. The benchmark, licensing, contributing and release-notes pages.

## Open questions

- Goldens rendered on CI: the offline renderer and the fake IO run on
  ubuntu, but the sampler needs its content — a small SFZ fixture in the
  site repo or the test instrument of `aud_dsp_sampler`?
