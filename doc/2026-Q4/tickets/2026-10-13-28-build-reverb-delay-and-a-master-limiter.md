# 28: S10a — Build reverb, delay and a master limiter in aud_dsp_effects for iOS and Android

Status: in progress since 2026-10-13. Planned and implemented without a
plan review, as the user asked; the defaults below answer the open
questions.

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

## Open questions

None open; see the defaults above.

## Rests on

dsp-001, license-001, license-002, license-003, app-001, app-002,
graph-001, graph-002, graph-003, abi-001, time-001, interop-001,
family-002, process-003, process-004, process-005.
