# 42: Documentation hygiene of the audaudio repos

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
2); awaits the user's confirmation. Phase 1 of the plan; size M; depends on
ticket 41.

## Goal

A developer who opens any implemented package of the audaudio family finds
a README that starts with what the package is, how to install it on each
platform and a first example, and only then how it works; a changelog
without empty sections; an `index.jsonc` whose `uses` and `usedBy` mirror
each other across both families; a pubspec with `documentation:`,
`issue_tracker:`, `topics:` and an honest `platforms:` list; and a lint
that keeps every public symbol documented. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R16: the docs describe
all packages).

## Requirements

From the area [framework](../../requirements/framework.md), accepted
2026-10-25:

- req-framework-002: Every README says the state and the platforms
- req-framework-004: The exported API is documented
- req-framework-005: The platform setup is documented

## Affected repos

- `aud_audio_core`, `aud_audio_graph`, `aud_audio_vst3`, `aud_audio_auv3`:
  READMEs restructured by concept instead of by ticket (install, getting
  started, platforms, how it works, state), the ticket and decision ids
  kept as references; core gains the "write a node" guide around
  `aud_node_base.hpp`; vst3 gains the installation section and the
  `build-plugin.js` wiring, and loses the stale `editor/` reference.
- `aud_audio_io`, `aud_audio`: current install versions; the umbrella's
  `platforms:` and description name Windows; the io example resolves
  without sibling overrides.
- `aud_dsp_sampler`: the parameter table and one "where may an instrument
  live" section; `aud_dsp_effects`: the platform list.
- `aud_audio_with_midi`: an `example/`; the four empty changelog sections.
- All implemented packages: the 21 empty changelog sections filled from
  the git history, the 16 template `example/README.md` files replaced,
  `documentation:`, `issue_tracker:`, `topics:` in the pubspecs,
  `README.de.md` brought in line or removed where no translate guide
  exists (core, the PM repo, the site).
- `dna_audanika` (the DNA layer): `public_member_api_docs` in the lint
  set of every repo; a script that checks the `uses`/`usedBy` mirror of
  the `index.jsonc` files across the ocean and reports the 29 broken
  pairs.
- `aud_audio_pm`: `README.de.md`; the index check in the develop guide.

## Steps

1. The index mirror script in the DNA layer, run over both families; fix
   the 29 pairs, one key per repo.
2. The lint in the DNA layer; fix what it reports.
3. READMEs: core, graph, vst3, auv3 restructured; io and umbrella install
   blocks; sampler and effects additions; the "write a node" guide.
4. Changelogs, example READMEs, the midi example, pubspec fields.
5. German copies: in line or removed, per the PM guide.
6. Patch versions for every repo that changes; the DNA layer as its own
   release.

## Open questions

- Remove `README.de.md` from repos without a translate guide, or keep
  them in sync by hand? Proposal: remove in the code repos, keep in the
  PM repo.
