# family-001: One repo per package, the aud_audio family

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/requirements.md (R1, R2, R6, R11 to R24),
  the plan of ticket 17
- Open work: none — the names are confirmed, the AUv3 shell is
  `aud_audio_auv3` (decided 2026-10-08)

## Decision

The Audanika Audio Engine is a family of Dart packages in the GitHub
organization `audaudio`, one repo per package, like the `aud_midi` family:
`aud_audio_core` (C ABI and contracts), `aud_audio_graph` (engine),
`aud_audio_io` (devices), `aud_audio` (umbrella the apps depend on),
`aud_audio_web` (web build), `aud_audio_midi`, `aud_audio_osc`,
`aud_audio_sequencer`, `aud_audio_link`, the DSP packages `aud_dsp_*`, the UI
packages `aud_audio_ui_*`, the plugin shells `aud_audio_vst3`,
`aud_audio_clap` and `aud_audio_auv3`, and the docs repo `audaudio.github.io`.
All packages share the major version and are released together per gg ticket;
the umbrella pins exact versions of the family (caret ranges would admit later
minors), and the C ABI version checked at registration is the real
compatibility gate (abi-001). Each repo gets the `dna_audanika` layer and is
planned in `aud_audio_pm`.

## Why

- AudioKit's strength is the ecosystem cut: engine, DSP, UI and formats
  evolve at their own pace (R4).
- Platform-bound code (build hooks, Emscripten, Xcode extensions) stays
  in the package that needs it; pub.dev platform tags stay honest.
- The `aud_midi` plan established the same rules; one convention for
  both families.
