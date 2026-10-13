# 27: S29a — Play an SFZ instrument from audanika_app on the new engine on iOS and Android

Status: implemented 2026-10-13 without a plan review, as the user asked
(the defaults below answer the open questions); findings and numbers
below.

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
   `channel-<n>.sfz` per mapped MIDI channel and `external.sfz` (the
   melody sound on all channels), listed in `index.json`. Regions
   reproduce the nearest-root mapping (transposition shifts the key
   ranges, not the pitch centre), loops, linear attack and release (flex
   envelope), `linearGain` as `volume`, the legacy velocity curve as
   `amp_velcurve_N`, CC 7 after the legacy table, the legacy level and a
   limiter per node (app-001).
2. **Assets.** As with the legacy engine, nothing is copied. On iOS the
   Xcode folder reference `content` puts `content/sfz` into the app
   bundle and the sampler reads it in place. On Android the native assets
   `assets/content` carry it uncompressed, and `aud_dsp_sampler` reads
   `apk:/` paths through `AAssetManager` (new in this ticket: a file layer
   under sfizz for the SFZ, its includes and the samples).
3. **Engine.** One `AudEngine` with the sampler and the MIDI bridge; one
   sampler node per mapped channel (on-screen keys, motion sensors, play
   hints) and one node `external` (external MIDI), all into the output.
   Choosing a sound loads every node; a failed load keeps the old sound.
4. **On-screen keys.** A router turns the app's MIDI bytes into
   `AudUmpEvent`s and calls `graph.sendEvent` on the node of their
   channel; CC 64 goes to all, CC 120/123 become note offs (app-002); no
   MIDI isolate on that path.
5. **External MIDI.** `aud_midi` opens all inputs; the bridge connects
   them to `external` over the native tap (Dart path where no tap
   exists); hot-plug through the bridge.
6. **MIDI out.** `aud_midi` replaces `flutter_midi_command` for the
   outputs, the virtual ports on iOS and BLE.
7. **Removal.** `audio_engine`, `flutter_midi_command` and the bundle go;
   the Android assets and the iOS folder reference carry `content/sfz`;
   `aud_dsp_sampler` builds for `armeabi-v7a` again, so the app keeps its
   three ABIs.
8. **Numbers** on the iOS simulator and the Android emulator with an
   integration test of the app: key-to-sound latency, xruns and late
   callbacks over a played minute, process RSS before and after the
   instrument load, load time (finding the content and the sampler
   load).

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
3. Both platforms read the instruments in place, as the legacy engine
   did (the user's instruction of 2026-10-12): iOS from the bundle,
   Android from the APK through `AAssetManager`; no copy.
4. Velocity follows the legacy curve, not the sfizz default, so that the
   app sounds as before at velocity 76.

## Affected repos

- `audanika_app`: converter, SFZ content, engine service, MIDI on
  `aud_midi`, removal of the legacy engine, tests, numbers.
- `aud_audio_pm`: this plan, decisions, findings, issues.md.
- `aud_dsp_sampler`: `apk:/` paths read from the APK's assets on Android
  (sampler-004), the `armeabi-v7a` build, and the defects the integration
  found (see Findings).
- `aud_audio`, `aud_midi`: their examples override only their own
  checkout and take the family from git tags and pub.dev, so that they
  resolve outside a full ticket; patch releases (family-002).
- `aud_audio_midi`: unchanged; gg keeps it in the ticket because it
  connects the app to its other repos; not published.

## Steps

1. Write the converter and generate `content/sfz`; test it on the bundle.
2. Add the engine service; play the keys through it.
3. Move the MIDI outputs, virtual ports and BLE onto `aud_midi`; add the
   inputs over the bridge.
4. Remove `audio_engine`, `flutter_midi_command` and the bundle; fix the
   tests.
5. Build and play on the iOS simulator and the Android emulator; measure.
6. Write the findings into decisions and this plan; review; publish.

## Findings

- sfizz ignores `lochan`/`hichan` and the sampler node drops the MIDI
  channel, so a preset is one instrument per channel (app-001, app-002).
- sfizz releases exponentially; the legacy engine linearly. A flex
  envelope reproduces the legacy curves (release −6.02 dB after 1 s of
  2 s, attack −6.02 dB at half the time).
- sfizz cuts all voices on CC 120/123; the app turns them into note offs.
- Five notes at velocity 76 clipped (peak 1.0015 on iOS, 1.012 on
  Android). sfizz's `limiter` has no look-ahead (a chord reached 1.17);
  its compressor at attack 0 holds every node below −0.5 dBFS. A limiter
  on the sum of the nodes is open work for S10a.
- The sample store keyed samples by their raw path, so presets did not
  share samples; it keys them by the lexically normal path now.
- `aud_dsp_sampler` did not build for `armeabi-v7a`: the vendored Abseil
  20240116.0 lacked `int128_no_intrinsic.inc` and `int128.cc`. Both are
  added; the hook links with `--no-undefined` on Android, so a missing
  symbol fails the build instead of the app's start.
- Fixed in the fork: a text with only a comment failed to load; the gain
  effect, Rectify and Width failed on blocks shorter than the largest;
  comp and gate with stereo link read the wrong sample (upstream typo);
  `sustain_sw`/`sostenuto_sw` were swapped (upstream); a stolen voice
  with a flex envelope played its whole release; the node's tail ignored
  a flex envelope.
- The pedal releases at the frame of CC 64 = 0, like a note off. sfizz
  holds from CC 64 = 1 (`sustain_lo`), as the legacy engine did.
- The RSS rise of +146 MB during a played minute on the iOS simulator was
  the MIDI start (a CoreMIDI client and the MIDI isolate, about 760 ms)
  landing after the measurement point. With `midiReady` the minute adds
  28 MB; malloc and the cache stay flat over five minutes.
- `aud_midi_linux` 0.1.1 requires `dbus ^0.7.15`, which clashes with
  `connectivity_plus` 7.3.2 (`dbus ^0.8.0`); the app stays on
  `connectivity_plus` 7.3.1. Open for the aud_midi family:
  `dbus ">=0.7.15 <0.9.0"`.
- `aud_dsp_sampler` gained an Android plugin (a ContentProvider that hands
  the `AssetManager` to the native library); its example app needed its
  own application id.

## Code review

`/code-review` at high effort (2026-10-13) found seven points. Fixed: a
preset that loads on some nodes and fails on others now brings the
previous preset back on all of them; an unknown default preset no longer
recurses; the fade of a turned-off voice no longer computes a stage
number from the points of its flex envelope (not reachable today,
hardened). Open:

- The +7.35 dB gain effect in every SFZ file undoes sfizz's internal synth
  volume; a limiter on the sum (S10a) or a node that sets the synth volume
  would remove it, and the per-node limiters that run on idle nodes too.
- Every store key of an `apk:/` sample opens the asset once more;
  compressed assets are inflated on every open (sampler-004).
- The sounds extension waits for presets forever when the engine has no
  content; the legacy engine behaved the same.

## Measurements

Debug builds, 60 s of play on channels 0 to 2 at velocity 76
(`integration_test/sound_numbers_test.dart`), preset Welcome_Combi:

| | iOS simulator (iPhone 17 Pro) | Android emulator (API 36, arm64) |
| --- | --- | --- |
| Content found (no copy) | 15 ms | 101 ms |
| Load of the preset | 28 ms | 59 ms |
| RSS: load | +21 MB | +16 MB |
| RSS: played minute | +31 MB | +13 MB |
| Sample cache: load, end | 2.3 MB, 15.4 MB | 2.3 MB, 15.4 MB |
| Key to sound (min, mean, max) | 15.4, 18.6, 20.2 ms | 106.7, 112.7, 128.2 ms |
| Block, output latency | 256, 10.8 ms | 1920, 106.9 ms |
| Xruns, late callbacks | 0, 0 | 0, 809 |
| Render time (mean, max) | 1.45, 1.87 ms | 1.54, 7.16 ms |
| Output peak | 0.999 | 0.955 |

The emulator's block of 1920 frames sets its latency, as in tickets 22 and
26. The reference devices follow in S29b.

## Open questions

None open; see the defaults above. Open work is listed in app-001,
app-002 and sampler-004.

## Rests on

scope-002, family-001, family-002, sampler-003, lifecycle-002, midi-002,
midi-003, interop-002, interop-003, license-001, process-003.
