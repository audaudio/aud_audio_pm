# 28: S10a — Build reverb, delay and a master limiter in aud_dsp_effects for iOS and Android

Status: implemented 2026-10-13 without a plan review, as the user asked
(the defaults below answer the open questions); findings, code review and
numbers below.

## Goal

Build step S10a of the plan of ticket 17 (milestone M2): `aud_dsp_effects`
offers effect nodes for the `aud_audio` graph on iOS and Android — a
reverb on Freeverb (public domain), a plate reverb re-implemented from
the literature (dsp-001), DunneAudioKit's StereoDelay (MIT), a
tempo-synced delay and a master limiter with look-ahead for the sum of
the nodes. The Audanika app routes its sampler nodes through a master
delay, a master reverb and the master limiter, with moderate defaults that
each of its presets can adjust; the limiter works in addition to the
per-node limiters and the +7.35 dB gain effect of its SFZ files (open
work of app-001). Findings go back into the contracts as decisions.
Serves [flutter-audio-kit](../goals/flutter-audio-kit.md).

## What the code base gives

- `aud_dsp_effects` 0.1.0 is the spike of ticket 5: one tremolo node
  against ABI 0.1 (`aud_audio_core` ^0.1.0), a hook without flags, no
  notices, no native tests. Nothing depends on it; `aud_audio`'s example
  dropped it in ticket 22.
- `aud_audio_core` 0.5.1 is ABI 0.4. `AudNodeBase` and
  `AudNodeVTableFor<T>` (`aud_node_base.hpp`) split a block at its events
  and ramp parameters; `AudCoreGain` is the reference node.
- `aud_audio_graph` 0.5.1: connections into one input sum; parallel paths
  are aligned by the node latencies; `get_latency` is read once after
  `prepare`, `get_tail` after `prepare` and at every commit. Scheduled
  events are pre-delivered by the latency of their path, live events
  sound later by it, and `graph.outputLatency` reports it. The internal
  transport runs at 120 BPM by default and fills the tempo of every
  segment, also while stopped. `graph.stats.outputPeak` holds the
  largest output sample since `resetStats`; the engine times only whole
  blocks — no per-node render time exists.
- `aud_dsp_sampler` 0.3.0 is the model of a DSP package: the hook, the
  link hook with `@RecordUse`, the neutral and the ffi library, ids as
  constants, golden renders on the offline renderer within 1e-5, native
  tests under ASan/UBSan, RealtimeSanitizer and TSan. The notices check
  is `scripts/check-notices.js` of `aud_audio_midi`.
- The app (ticket 27) connects one sampler node per MIDI channel and the
  node `external` straight to the output and loads presets from
  `content/sfz/index.json`, which `tool/convert-content-bundle.js`
  writes. The app has no tempo. The legacy engine ran Apple's reverb and
  delay on iOS only and off by default; its reverb presets used wet 0.05
  to 0.2 with 2 to 3 s decay and a delay of 0.4 s, feedback 0.15, wet
  0.02 to 0.08.
- Sources: Freeverb by Jezar at Dreampoint, public domain
  (`sinshu/freeverb`, commit `cfcea55`); DunneAudioKit, MIT, Copyright
  (c) 2021 AudioKit (commit `be581d0`): `StereoDelay` and
  `AdjustableDelayLine`; its dry/wet mix is inverted (mix 1 is dry).

## Scope

1. **The package on ABI 0.4.** `aud_dsp_effects` 0.2.0 depends on
   `aud_audio_core` ^0.5.1 and follows the sampler: hook flags after
   `aud_audio_io` (C++17, hidden visibility, 16 KB pages, static C++
   runtime on Android, `--no-undefined`), a link hook with `@RecordUse`,
   `aud_dsp_effects.dart` without `dart:ffi`, `aud_dsp_effects_ffi.dart`
   with `AudDspEffects.name`, `.register` and `.registerWith`, ids as
   constants. The tremolo moves onto `AudNodeBase`.
2. **Nodes** (stereo out; mono or stereo in; variable blocks, in place,
   ramped parameters; buffers allocated in `prepare`; `mix` is a linear
   crossfade, 0 dry, 1 wet):
   - `aud.effects.freeverb` — Jezar's comb and allpass model with the
     tunings scaled from 44.1 kHz to the sample rate: `room_size`,
     `damping`, `width`, `mix`; tail from the longest comb's decay.
   - `aud.effects.plate` — Dattorro's plate (J. Dattorro, "Effect Design,
     Part 1", JAES 45(9), 1997), written from the paper with the delays
     scaled from 29 761 Hz: `pre_delay`, `bandwidth`, `decay`,
     `damping`, `mix`; tail from the decay.
   - `aud.effects.stereo_delay` — the port of Dunne's StereoDelay:
     `time` (s, up to 2), `feedback`, `mix`, `ping_pong`; the mix fixed
     to 0 dry, 1 wet; tail until −60 dB.
   - `aud.effects.tempo_delay` — the same delay lines with the time from
     the transport's tempo (`AUD_NODE_CAP_TRANSPORT`): `division` (note
     values with dotted and triplet ones), `feedback`, `mix`,
     `ping_pong`; the time ramps when the tempo changes.
   - `aud.effects.limiter` — a look-ahead peak limiter of our own: the
     signal is delayed by the look-ahead, the gain follows a peak hold
     over the look-ahead and a smoothing that reaches the needed gain
     before the peak leaves the delay, linked over all channels, so that
     no sample exceeds `ceiling` (dBFS); `release`, `gain` (dB). The
     look-ahead is 1.5 ms and reported as the latency.
3. **Licenses.** `src/third_party/{freeverb,dunne_audio_kit}` with the
   original headers, "Modified by Audanika" notes and
   `src/third_party/NOTICES.md`; `scripts/check-notices.js`. The audit of
   license-003 for every ported source.
4. **Tests.** Dart tests per file at 100 % coverage, golden renders per
   node, native tests through the vtable under the sanitizers, a test that
   an impulse leaves the limiter after exactly its latency and that no
   output sample exceeds the ceiling for signals up to +24 dB over full
   scale.
5. **Render time per node.** `package:aud_dsp_effects/testing.dart` gets
   `AudEffectsBench`: it runs a node through its vtable on the calling
   thread, block by block, and returns the mean, p99 and maximum time per
   block and the share of the block's duration.
6. **Example.** A page that plays a chord through delay, plate, Freeverb
   and limiter with their parameters; `integration_test/effects_test.dart`
   measures the bench of every node, the chain on the engine (xruns, late
   callbacks, render time with and without the effects), the peak of the
   output with a dense chord pushed 12 dB over full scale, and the latency
   the limiter adds.
7. **The app.** The channel nodes and `external` sum into the master
   chain `delay` (stereo delay) → `reverb` (plate) → `limiter` →
   output. Every preset in `index.json` carries `effects` with the reverb
   and delay parameters, written by the converter from one table of
   defaults and per-preset overrides; the engine applies them with a ramp
   after a preset loaded and restores them with the previous preset.
   `sound_numbers_test.dart` measures the chain: render time with and
   without the effects, xruns, the output peak with dense chords on every
   preset (≤ 1.0), the latency of the limiter.

Out of scope: a reverb or delay switch in the app's settings, sends per
channel, per-node render time in the engine (`aud_audio_graph`), a
look-ahead that changes after `prepare` (the engine reads the latency
once), the reference devices (S29b), the oscillators, filters, dynamics,
modulation and distortion of S10b.

## Affected repos

- `aud_dsp_effects`: the nodes, the package around them, tests, bench,
  example; 0.2.0 (minor: the Dart API of the spike breaks).
- `audanika_app`: the master chain, the effects per preset, the converter,
  tests and numbers; a minor version.
- `aud_audio_pm`: this plan, process-004 and process-005, the decisions of
  the findings, `issues.md`.
- `aud_dsp_sampler`: joined on 2026-10-13 with the user's consent after
  the app crashed in the measurement: a lock for the shared curves of the
  flex envelopes (see Findings); 0.3.1 (patch). The app requires it.

`aud_audio`, `aud_audio_graph` and `aud_audio_core` stay unchanged and out
of the ticket (family-002).

## Constraints

The standing rules of process-005 hold: no Dart on the audio thread and no
allocation there; permissive licenses with notices and the check;
Node.js scripts with the license header; independent versions; commits
with `gg one do commit -m`, first word "Add", "- " bullets, no
Co-Authored-By trailer, no name of a repo of `audanika-legacy` or
`audanika-private` in commit, merge or changelog lines; publish configs
before `gg do review`. Model and effort: Claude Opus 5.5 at extra high
effort for the lead and every agent (process-004); Fable only after
asking the user.

## Defaults for the open questions

1. **Master reverb: the plate.** Denser than Freeverb's combs with fewer
   filters per sample; Freeverb stays available as a node.
2. **Master delay: the stereo delay in seconds.** The app has no tempo;
   the tempo-synced delay serves apps with a transport.
3. **Chain order: delay before reverb**, so that the echoes are
   reverberated; the limiter last.
4. **Moderate defaults after the legacy "medium" settings:** reverb mix
   0.15, decay for about 2 s, pre-delay 20 ms; delay 0.4 s, feedback 0.15,
   mix 0.06, ping-pong. Per preset: Strings more and longer reverb, the
   E-Piano more delay, the organ less of both — starting values to be
   tuned by ear on the reference devices in S29b.
5. **Per-preset values live in `index.json`**, written by the converter,
   so that a new conversion keeps them; a missing field falls back to the
   defaults in the app.
6. **Limiter: ceiling −1 dBFS, release 100 ms, look-ahead 1.5 ms.** The
   ceiling keeps room for inter-sample peaks; 1.5 ms (72 frames at
   48 kHz) is small against the output latency of the devices.
7. **The per-node limiters and the gain effect stay** in the SFZ files,
   as the user asked; whether they can go is open work of app-001.

## Steps

1. Plan, process-004, process-005, `issues.md` (this file).
2. `aud_dsp_effects`: package on ABI 0.4, the five nodes, notices,
   native and Dart tests, goldens, bench, README.
3. `audanika_app`, in parallel with step 2: effects per preset in the
   converter, `index.json` and the content model.
4. `aud_dsp_effects` example and its integration test; the app's master
   chain and its numbers test.
5. Measure on the iOS simulator and the Android emulator.
6. Findings into decisions and this plan; `/code-review` at high effort;
   publish configs; `gg do review`; review-light per repo; fixes.

## Findings

- **A data race in the sampler crashed the app.** sfizz keeps the curves
  of flex envelopes in a process-wide map (`FlexEGs::getShapeCurve`,
  `clearUnusedCurves`) without a lock. The engine loads the app's four
  sampler nodes on parallel workers (lifecycle-002), so every preset
  change can corrupt the heap; the measurement's preset changes hit it on
  the iOS simulator (`pointer being freed was not allocated`). It dates
  from ticket 27, whose flex envelopes first reached that map. The audit
  of all state the process shares found five more races — the silence
  wavetable (a second crash candidate at the start), the Faust table of
  the distortion, the CRC table of stb_vorbis, the CPU detection of
  dr_flac and dr_mp3. All are fixed in `aud_dsp_sampler` 0.3.1 with tests
  that fail under ThreadSanitizer, or crash, without the fixes
  (sampler-005).
- **DunneAudioKit's StereoDelay mixes inverted:** `(1 - mix) * wet +
  mix * dry`, so mix 1 is dry. The port renders 0 dry, 1 wet (dsp-002).
- **Denormals.** Freeverb's `undenormalise` reads a float through an
  integer pointer, undefined behaviour under strict aliasing; the
  add-and-subtract trick kept the plate's feedback cycling at about 1e-25
  for ever. Every feedback path flushes values below 1e-15 to zero.
- **The engine reads a node's latency once, after `prepare`.** The
  look-ahead is therefore fixed at 1.5 ms (dsp-003); a look-ahead the app
  can choose is open work. Live notes sound 1.5 ms later; scheduled
  events are pre-delivered.
- **The engine has no per-node render time.** `AudEffectsBench` measures
  a node on the calling thread. On the simulators the chain costs about
  8 times the bench sum on the audio thread (113 µs against 14 µs per
  512 frames on iOS): the bench runs warm on the test's thread, the audio
  thread meets cold caches between callbacks. Devices decide (S29b).
- **The iOS simulator renders 512-frame blocks** while it reports a
  buffer of 256; the example computes shares from the frames it rendered.
- **Dense chords reach +7.1 to +7.6 dBFS on the sum** without the chain,
  although every node is limited at −0.5 dBFS; the master limiter holds
  −1 dBFS exactly on every preset.
- **The app did not build for Android:** `permission_handler_android`
  14.1.0 in the lock of ticket 27 is compiled against SDK 37, the app
  against 36. The app compiles against SDK 37 now; targetSdk is unchanged.
- **`gg do add` commits uncommitted work** of every repo with the ticket
  title as the message. The three commits were redone with proper
  messages; process-005 now asks to commit before adding a repo.
- The delay time is a float parameter: 0.1 s is 4800.00007 frames, an
  interpolated echo of 0.99993. The engine caps tails at 10 s; the
  reverbs report up to 30 s.

## Code review

`/code-review` at high effort (2026-10-13) over `aud_dsp_effects`,
`aud_dsp_sampler` and the app found six points. Fixed: the app plays
without effects when the master chain cannot be created (a refused
effects package no longer silences it, a half-built chain is removed);
the tempo delay's 4 s limit is documented. Wrong: the point that the
race fix changed the sample-rate constants of the sampler's distortion —
the original set them already; the note written for it was corrected in
review-light, but the changelog line of that commit (owned by gg) still
says otherwise and the next line corrects it. Left as they are, for a
gain below a microsecond each: the delays set their parameters every
frame, the nodes flush their output mix and not only their feedback, and
a loader waiting for stb_vorbis's CRC table spins without a pause.

## Review

`gg do review` opened the pull requests on 2026-10-13; review-light ran
with one reviewer per repo, each fixing what it found:

- `aud_dsp_effects`: one interpolated read for the plate's delays, the
  stereo delay's longest time from its descriptor, the bench split into
  smaller functions, the comment landmarks of the code guide, the Dart
  API in both READMEs, a test of the tempo delay's 4 s limit.
- `aud_dsp_sampler`: the corrected distortion notes, named states of the
  once guards, a redundant flag of dr_flac dropped, the TSan symbolizer
  and the shared-state audit in both READMEs.
- The app: the parameter ids of `SfzEffects.defaults` from the effects
  package, the fallback documented, the converter's options documented.
- `aud_audio_pm`: this status, the numbers of the peak without the chain,
  the back links of the refined decisions, the steps S10a and S29a in the
  plan of ticket 17.

Left: the effect defaults live in the converter and in the app, tied
together by a test; a spinning wait in dr_flac as in stb_vorbis; the
experimental `record_use` package, as in the sampler.

## Measurements

Debug builds on the iOS simulator (iPhone 17 Pro) and the Android emulator
(API 36.1, arm64), 48 kHz.

Render time per node (`AudEffectsBench` on the device's thread, mean per
block; p99 in brackets):

| Node | iOS, 512 frames | iOS, 256 | Android, 540 frames | Android, 256 |
| --- | --- | --- | --- | --- |
| freeverb | 8.2 µs (10.5) | 4.1 µs | 9.3 µs (24.8) | 4.4 µs |
| plate | 7.4 µs (12.3) | 3.6 µs | 7.8 µs (23.4) | 3.6 µs |
| stereo_delay | 3.8 µs (4.3) | 2.0 µs | 4.7 µs (6.0) | 2.3 µs |
| tempo_delay | 3.9 µs (4.9) | 1.9 µs | 4.8 µs (11.3) | 2.4 µs |
| limiter | 2.3 µs (2.9) | 1.2 µs | 2.6 µs (3.3) | 1.3 µs |
| tremolo | 1.2 µs (1.6) | 0.6 µs | 1.3 µs (1.6) | 0.6 µs |

Every node takes less than 0.1 % of its block.

The example: an eight-voice saw chord through delay → plate → limiter at
+12 dB drive against the chord straight to the output, 60 s each:

| | iOS simulator | Android emulator |
| --- | --- | --- |
| Output peak, effects (ceiling 0.891251) | 0.891251 | 0.891251 |
| Output peak, dry | 0.937 | 0.937 |
| Xruns, effects / dry | 0 / 0 | 0 / 0 |
| Late callbacks, effects / dry | 0 / 0 | 1041 / 1032 |
| Render mean, effects / dry | 187 / 73 µs | 137 / 51 µs |
| Render max, effects / dry | 279 / 118 µs | 7956 / 2857 µs |
| Limiter latency (reported, impulse offline) | 72 / 72 frames, 1.5 ms | 72 / 72 frames, 1.5 ms |
| Device output latency | 517 frames | 5142 frames |

The app on the fixed sampler (0.3.1): dense chords (bass, an eight-note
chord, melody at velocity 127, sustain part of the time) for 30 s per
preset, then without the chain:

| | iOS simulator | Android emulator |
| --- | --- | --- |
| Output peak, every preset | 0.891251 (−1.0 dBFS) | 0.891251 (−1.0 dBFS) |
| Output peak without the chain | 2.409 (+7.6 dBFS) | 2.256 (+7.1 dBFS) |
| Xruns, every preset | 0 | 0 |
| Late callbacks per preset | 0 (0 without the chain) | 346 to 414 (331 without the chain) |
| Render mean per preset | 1.46 to 2.50 ms | 1.54 to 2.22 ms |
| Render max per preset | 3.76 to 4.05 ms | 7.15 to 9.61 ms |
| Render mean, Welcome_Combi with / without the chain | 2.12 / 2.49 ms | 2.21 / 2.28 ms |
| Limiter latency | 72 frames, 1.5 ms | 72 frames, 1.5 ms |
| Block, device output latency | 256 (512 rendered), 10.8 ms | 1920 frames, 119.8 ms |

The chain's share — about 0.1 ms per block by the example — is below the
spread of the sampler's render time between two runs, so the difference
with and without the chain is noise on both platforms.

The emulator's late callbacks come with and without the effects, as in
tickets 22 to 27. The reference devices follow in S29b.

## Open questions

None open; see the defaults above. The findings went into dsp-002,
dsp-003, app-003 and sampler-005; open work is listed there.

## Rests on

dsp-001, license-001, license-002, license-003, app-001, app-002,
graph-001, graph-002, graph-003, abi-001, time-001, interop-001,
lifecycle-002, sampler-002, family-002, process-003, process-004,
process-005.
