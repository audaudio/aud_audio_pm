# 27: S29a — Play an SFZ instrument from audanika_app on the new engine on iOS and Android

Status: planned 2026-10-12; implemented without a plan review, as the
user asked (the defaults below answer the open questions).

## Goal

Build step S29a of the plan of ticket 17 (milestone M1) in
`audanika-legacy/audanika_app`: the app plays its previous sounds through
`aud_audio`, `aud_audio_midi` and `aud_dsp_sampler` on iOS and Android.
The on-screen keys go into the engine directly from Dart (never on the
audio thread), external MIDI goes over the native tap of ticket 26
(midi-002, midi-003), the legacy `audio_engine` plugin and
`flutter_midi_command` leave the app, and the findings go back into the
contracts as decisions. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) and is the first user
of the family outside its own examples.

S29a of ticket 17 named an integration branch of `aud_app` in
`audanika-private`. The user moved it to `audanika_app` in the
`audanika-legacy` organization and widened it: the legacy engine is
removed here, not in S29b. S29b keeps the reverb and delay of S10a, the
instrument reference suite and the reference devices.

## What the code base gives

The app (`audanika_app`, Flutter 3.47.5, iOS 15, Android minSdk 24):

- `audio_engine` (legacy, C++ on Oboe and AudioUnits) loads the content
  package `content/AUD007870_audanika_default.contentpackage.bundle` and
  plays MIDI bytes through FFI `playMidi`
  (`lib/src/audio/audio_engine_adapter.dart`). Two adapters wrap one
  engine: one fed by the app's `MidiManager`, one by the MIDI extension
  (`lib/src/application/application.dart:830-872`).
- The on-screen keys become MIDI in `sml`: bass on channel 0, chord on 1,
  melody on 2, velocity always 76; the motion sensors send CC 7; stop
  sends CC 123.
- `flutter_midi_command` serves outputs only: external devices, BLE and
  the virtual ports "Audanika Bass/Chord/Melody" on iOS. **The app reads
  no external MIDI today**; S29a adds the input.
- The bundle: 7 sample sets of 16-bit stereo 44.1 kHz WAVs, one per root
  note (`NNN.wav`), no key ranges, no velocity layers. Each note plays
  the nearest root (a tie takes the higher one), shifted in pitch. Loops
  come from `44kHz/sampleInfo.xml` (frames, `loopEnd` inclusive).
- Presets map MIDI channels to sample sets with `attack`, `release` (ms),
  `linearGain` and `transposition`. The UI offers the sound group
  `AUD001999_audanika_sound.group`: Welcome_Combi (bass, warm pad, piano;
  the default), E-Piano, Organ_Combi, Strings and Vibraphone.
- Velocity: −16 dB at 0 to 0 dB at 100, linear in dB (+4.3 dB at 127).
  CC 64 holds, CC 7 is the channel volume, CC 120/123 end the notes.
- Reverb and delay ran on iOS only, the default setting turned them off,
  and the sound list does not offer them. Android never had them.

The engine (aud_audio 0.4.0, aud_dsp_sampler 0.2.0, aud_audio_midi 0.1.0,
aud_midi 0.1.1 on pub.dev) — see tickets 22, 25 and 26:

- `AudEngine(packages: [sampler, AudMidiBridge.package])`, a sampler node
  `aud.sampler.sfz`, `graph.setString(node, sfz_file, path)` loads on a
  worker into a standby synth (sampler-003), `graph.sendEvent` for the
  keys, `AudMidiBridge.openInput` plus `connectEvents` for the native tap.
- sfizz reads real files only; the Flutter assets of Android live inside
  the APK.
- `aud_dsp_sampler` does not build for `armeabi-v7a` (ticket 26).
- Numbers: `engine.numbers` (xruns, late callbacks, cache bytes, load
  times), `engine.measureCommandToSound()`, `AudLoad.duration`.

## Scope

1. **SFZ folders.** A Node.js script `tool/convert-content-bundle.js`
   turns the bundle once into `content/sfz`; the output is committed and
   the bundle leaves the app. The app never reads the legacy format at
   run time. Per sample set one folder with its WAVs and an
   `instrument.sfz`; per preset of the sound group one folder with
   `main.sfz` (the channel mapping of the preset with `lochan`/`hichan`)
   and `external.sfz` (the melody sound on all channels). Regions
   reproduce the nearest-root mapping (transposition shifts the key
   ranges, not the pitch centre), loops, attack and release
   (`ampeg_*`, sustain 100 %), `linearGain` as `volume`, the legacy
   velocity curve as `amp_velcurve_N` plus a volume offset.
2. **Assets.** `content/sfz` ships as Flutter assets and is copied once
   per content version into the application support directory on a
   background isolate; the sampler loads from there.
3. **Engine.** One `AudEngine` with the sampler and the MIDI bridge; two
   sampler nodes into the output: `main` (on-screen keys, motion
   sensors, play hints) and `external` (external MIDI). Choosing a sound
   loads both presets; a failed load keeps the old sound.
4. **On-screen keys.** The adapter turns the app's MIDI bytes into
   `AudUmpEvent`s and calls `graph.sendEvent` on `main`; no MIDI isolate
   on that path.
5. **External MIDI.** `aud_midi` opens all inputs; the bridge connects
   them to `external` over the native tap (Dart path where no tap
   exists); hot-plug through the bridge.
6. **MIDI out.** `aud_midi` replaces `flutter_midi_command` for the
   outputs, the virtual ports on iOS and BLE.
7. **Removal.** `audio_engine`, `flutter_midi_command`, the bundle, the
   asset symlinks of Android and the folder reference of iOS go;
   `abiFilters` arm64-v8a and x86_64 on Android.
8. **Numbers** on the iOS simulator and the Android emulator with an
   integration test of the app: key-to-sound latency, xruns and late
   callbacks over a played minute, process RSS before and after the
   instrument load, load time (copy and sampler load).

Out of scope: reverb and delay (S10a, S29b), the instrument reference
suite and the reference devices (S29b), macOS and the web (no sound
there, as before).

## Constraints

- Dart never runs on the audio thread.
- Only permissive licenses; `NOTICES.md` and `node tool/check-notices.js`
  in every repo that changes code.
- Scripts are Node.js (CommonJS) with the license header.
- Packages version independently (family-002): only repos with changes of
  their own stay in the ticket and are published.
- No path dependencies in manifests; gg's `pubspec_overrides.yaml` for
  local development.
- Commits per repo with `gg one do commit -m`, first word "Add", "- "
  bullets, no Co-Authored-By trailer; CHANGELOG.md belongs to gg.

## Defaults for the open questions

The user asked for an implementation without a review of the plan; these
defaults decide the questions and become decisions where they hold:

1. Converter, not hand-made SFZ — the instruments are rebuilt as SFZ once
   (scope-002 keeps holding: no legacy format at run time).
2. External MIDI plays the melody sound of the current preset on every
   channel, on its own node, so that a keyboard on channel 1 does not play
   the contra bass.
3. Assets are copied, not read from the iOS bundle in place: one path for
   both platforms.
4. Velocity follows the legacy curve, not the sfizz default, so that the
   app sounds as before at velocity 76.

## Affected repos

- `audanika_app`: converter, SFZ content, engine service, MIDI on
  `aud_midi`, removal of the legacy engine, tests, numbers.
- `aud_audio_pm`: this plan, decisions, findings, issues.md.
- `aud_audio`, `aud_audio_midi`, `aud_dsp_sampler`, `aud_midi`: only if
  the integration finds a defect; otherwise they leave the ticket.

## Steps

1. Write the converter and generate `content/sfz`; test it on the bundle.
2. Add the engine service and the asset copy; play the keys through it.
3. Move the MIDI outputs, virtual ports and BLE onto `aud_midi`; add the
   inputs over the bridge.
4. Remove `audio_engine`, `flutter_midi_command` and the bundle; fix the
   tests.
5. Build and play on the iOS simulator and the Android emulator; measure.
6. Write the findings into decisions and this plan; review; publish.

## Open questions

None open; see the defaults above.

## Rests on

scope-002, family-001, family-002, sampler-003, lifecycle-002, midi-002,
midi-003, interop-002, interop-003, license-001, process-003.
