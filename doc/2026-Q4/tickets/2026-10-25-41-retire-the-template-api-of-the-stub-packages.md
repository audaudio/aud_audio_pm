# 41: Retire the template API of the stub packages

Status: planned 2026-10-25. Proposed by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
1 and 6); revised after a look at the stubs and confirmed by the user on
2026-10-25 in ticket 41, which only plans it; the implementation follows
in a later ticket. Phase 1 of the plan; size S; depends on nothing.

## Goal

Every repo of the audaudio family says what it is. The 18 stub packages
and the bench app no longer publish template API, and their READMEs say
that they are planned and on which platforms they will run. Their
pubspecs carry only the dependencies of the package graph (the UI stubs
none on the engine, ui-003), and the umbrella no longer pins
`aud_audio_web` 0.0.10, which it never imports. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R35: the repos exist
from the start — and tell the truth about their state).

## Requirements

From the area [framework](../../requirements/framework.md), accepted
2026-10-25:

- req-framework-001: No API without an implementation
- req-framework-002: Every README says the state and the platforms
- req-framework-003: The dependencies follow the package graph

## Affected repos

The stubs are in three states (checked on 2026-10-25):

- 11 `package_ffi` templates — `aud_audio_sequencer`, `aud_audio_link`,
  `aud_audio_file`, `aud_audio_clap`, `aud_dsp_analysis`, `aud_dsp_stk`,
  `aud_dsp_guitar_amp`, `aud_dsp_synth`, `aud_dsp_spatial`, `aud_dsp_mi`,
  `aud_dsp_stretch`: they export `sum` and `sumAsync` over generated
  bindings, build `src/<name>.c` through `hook/build.dart`, and carry
  `ffigen.yaml`, an example with six runner folders and the template
  test. They lose all of it and export their version only; the example
  shrinks to one that prints the version; the pubspec drops
  `code_assets`, `hooks`, `native_toolchain_c`, `logging`, `ffi` and
  `ffigen` and keeps the dependency of the package graph.
- 4 Flutter templates — `aud_audio_ui_graph_edit`,
  `aud_audio_ui_keyboard`, `aud_audio_ui_piano_roll`,
  `aud_audio_ui_waveform`: they export the template's `Calculator` with
  its test. They lose it and drop `aud_audio`, `aud_audio_sequencer` and
  `aud_audio_file` (ui-003, accepted 2026-10-25).
- 3 Dart packages and the app — `aud_audio_osc`, `aud_audio_web`,
  `aud_audio_backing`, `aud_audio_bench`: already version only, no
  template API.

All 19: a state line ("Planned: step Sx of ticket 17, no code yet") and
the platforms of `packages.jsonc` in `README.md` and `README.de.md`, the
state also in the `summary` of `index.jsonc`; patch version each.

- `aud_audio`: drop the dependency on `aud_audio_web` until it has code;
  patch version.
- `aud_audio_pm`: the script, `packages.jsonc` and
  `img/package-graph.mmd` follow ui-003 for the UI packages and lose
  `aud_audio_web` from the umbrella's dependencies; this plan; the row in
  `issues.md`.

## Steps

1. A Node.js script in `aud_audio_pm/scripts`, next to
   `create-family-repos.js`, that strips a template package — removes
   the template sources, bindings, native build, test and ffigen config,
   replaces the example by one that prints the version, writes the
   version-only library and the state line, and trims the pubspec — and
   that checks req-framework-001 to 003 over the family with `--check`.
2. Run it over the 18 stubs and the bench app; review the diffs; run
   `dart analyze` and the tests of each.
3. `aud_audio`: remove the `aud_audio_web` dependency and its comment.
4. `packages.jsonc` and the package graph: the UI packages depend on
   nothing of the engine (ui-003); `aud_audio_web` leaves the umbrella.
5. `--check` passes over the family; publish the 20 code repos as patches.

## Open questions

None. Answered by the user on 2026-10-25:

- ui-003 is accepted; the UI stubs drop their engine dependencies.
- The FFI stubs keep a minimal `example/` that prints the version; the
  implementation ticket of each package grows it.
