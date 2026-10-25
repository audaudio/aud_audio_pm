# 41: Retire the template API of the stub packages

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
1 and 6); awaits the user's confirmation. Phase 1 of the plan; size S;
depends on nothing.

## Goal

Every repo of the audaudio family says what it is. The 18 packages that
are still the untouched `dart create`, `package_ffi` or Flutter template —
`aud_audio_sequencer`, `aud_audio_link`, `aud_audio_file`,
`aud_audio_clap`, `aud_audio_osc`, `aud_audio_web`, `aud_audio_backing`,
`aud_audio_ui_graph_edit`, `aud_audio_ui_keyboard`,
`aud_audio_ui_piano_roll`, `aud_audio_ui_waveform`, `aud_dsp_analysis`,
`aud_dsp_stk`, `aud_dsp_guitar_amp`, `aud_dsp_synth`, `aud_dsp_spatial`,
`aud_dsp_mi`, `aud_dsp_stretch` — and the bench app no longer publish a
`sum()` API, a template example with six runner folders and a 5 s
`sum_long_running` test, and no longer promise sequencers, decoders and
Ableton Link in their READMEs. Their pubspecs carry only the dependencies
they will need (the UI stubs none on the engine, ui-003), and the umbrella
no longer pins `aud_audio_web` 0.0.10, which it never imports. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R35: the repos exist
from the start — and tell the truth about their state).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- The 18 stubs and `aud_audio_bench`: an empty library that exports the
  version only, a README and an `index.jsonc` that say "planned, step Sx
  of ticket 17, no code yet", no template example, test or `ffigen.yaml`,
  only the dependencies of the package graph (the DSP stubs keep
  `aud_audio_core`; the UI stubs drop `aud_audio`, `aud_audio_sequencer`
  and `aud_audio_file`); patch version each.
- `aud_audio`: drop the dependency on `aud_audio_web` until it has code;
  patch version.
- `aud_audio_pm`: `packages.jsonc` and `img/package-graph.mmd` follow
  ui-003 for the UI packages and lose `aud_audio_web` from the umbrella's
  dependencies; the empty releases that family-002 forbids are named in
  the plan as closed.

## Steps

1. One script in `aud_audio_pm/scripts` (Node.js) that strips a template
   package: it removes the template sources, example, test and ffigen
   config, writes the empty library, the README and the `index.jsonc`
   from a template with the step label, and trims the pubspec.
2. Run it over the 18 stubs and the bench app; review the diffs.
3. `aud_audio`: remove the `aud_audio_web` dependency and the comment.
4. `packages.jsonc` and the package graph: the UI packages depend on
   nothing of the engine (ui-003); `aud_audio_web` leaves the umbrella.
5. Publish the 19 repos as patches in one ticket — the one exception to
   "only changed repos" is not needed, every repo changes.

## Open questions

- Keep the `example/` folders empty or remove them? Proposal: remove; the
  implementation ticket of each package creates its own.
