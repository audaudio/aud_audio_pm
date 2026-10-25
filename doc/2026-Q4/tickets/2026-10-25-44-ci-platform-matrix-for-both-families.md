# 44: CI platform matrix for both families

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), summary
point 2 and section 8); awaits the user's confirmation. Phase 2 of the
plan; size L; step S22 of ticket 17; depends on tickets 41 and 43.

## Goal

Every native and platform path of both families builds and tests in CI on
its platform, and the realtime guarantees are proven on every push, not
only on the developer's Mac. Today all 43 repos run one ubuntu job
(`npx @tssuite/ggwsm one did commit`); `aud_io_ios.mm`, `aud_io_macos.mm`,
`aud_io_windows.cpp`, `aud_io_android.cpp`, the VST3 bundle, the C++/WinRT
shim of `aud_midi_windows` and the ALSA path of `aud_midi_linux` never
compile in CI, and the sanitizer builds, the VST3 validator and the
`@TestOn` tests of the MIDI backends never run there. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R5: six platforms —
proven, not claimed).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `dna_audanika`: the workflows as DNA files, chosen per repo by a key in
  `dna/_dna.json` — `macos` (Xcode, the native tests under ASan, UBSan,
  TSan and RTSan with Homebrew LLVM, the iOS simulator build, the VST3
  validator and test host), `windows` (MSVC, the native tests, the VST3
  bundle, the WinRT shim), `linux` (with `libasound2` and `snd-seq` for
  the ALSA tests), `android` (the NDK build of the hooks, the emulator
  for the example loopback), `web` (headless Chrome for `aud_midi_web`,
  `aud_midi_standard` on dart2js and Wasm); the quick check stays the gate
  for every push, the matrix runs on pull requests and `main`.
- `aud_audio_core`, `aud_audio_graph`, `aud_audio_io`, `aud_audio`,
  `aud_audio_midi`, `aud_audio_script`, `aud_audio_vst3`, `aud_dsp_sampler`,
  `aud_dsp_effects`: adopt the matrix; vst3 gains the
  `test/scripts/test_native_test.dart` wrapper midi and script have, so
  that `dart test` reaches its native tests.
- `aud_midi_apple`, `aud_midi_android`, `aud_midi_windows`,
  `aud_midi_linux`, `aud_midi_web`, `aud_midi`, `aud_midi_standard`: adopt
  the matrix; the never-run tests of windows and linux will fail first —
  that is ticket 59.
- `aud_audio_pm`: a decision `ci-001` with the matrix, the runners, the
  gates and the cost; release-005's open macOS gate closed.

## Steps

1. The decision: which job runs where, what gates a merge, what runs
   nightly (the emulator, the sanitizers) to keep the minutes in bounds.
2. The workflows in the DNA layer, with one audio and one MIDI repo as
   pilots.
3. Roll out to the audio repos; fix what the runners find.
4. Roll out to the MIDI repos; the failures of windows and linux go to
   ticket 59.
5. The CI badge and the matrix in every README; `pana` in the quick check
   of the published audmidi packages.

## Open questions

- Self-hosted runners for the macOS and Windows jobs (the development PC,
  a Mac mini) or GitHub-hosted? Cost against the sanitizer builds that
  need Homebrew LLVM.
- Reference devices in CI (release-004) are out of scope; the bench app
  (ticket 56) measures them by hand.
