# 29: S9b — Limit the voices of the sampler by the CPU power of the device

Status: planned 2026-10-13 during ticket 28, on the user's request ("the
number of voices is restricted depending on the CPU power of the device;
currently I can easily create drop outs by playing heavily"). Plan review,
implementation and measurements on 2026-10-14; implemented.

## Goal

Playing hard never drops out. The engine learns how many sampler voices
the device renders within its block budget and keeps the sounding voices
below that number: voices beyond it are stolen with a short fade instead
of overloading the audio thread. The budget starts from the device's class
and follows the measured load, so a fast iPad plays more voices than a
Galaxy Tab S4. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md)
and the zero xruns of the plan of ticket 17; its callback at most 50 % of
the block budget (release-004) is not met on the Galaxy Tab S4, which the
governor holds at a mean of 0.67 to 0.82 (open work of lifecycle-003);
refines lifecycle-001 ("instrument nodes bound
their polyphony and steal voices") and lifecycle-002 (one budget per
process).

## What the code base gives

- `aud_dsp_sampler` has the parameter `polyphony` (1 to 256, default 64)
  per node. A change loads the instrument again on a worker (sampler-003):
  sfizz allocates its voices and sets them only while it does not render.
  It cannot follow the load while a person plays.
- sfizz checks its polyphony limits at each new voice — the engine's
  (`polyphony`), the groups', the regions' — and fades one voice of the
  limit out with its 6 ms `off_time`. Its stealer is the **oldest** voice
  by default; envelope and age only with `hint_stealing` (found in the
  plan review; the plan assumed envelope and age). It knows no limit below
  the allocated voices and no budget shared by several synths.
- A voice that sfizz fades out still renders about 56 ms: its release
  falls exponentially to −80 dB in the off time, then the envelope fades
  linearly over another 50 ms (`egTransitionTime`).
- The app plays four sampler nodes (three channels and `external`), each
  with 64 voices: up to 256 voices on one audio thread.
- Ticket 28 measured on the Galaxy Tab S4 (Snapdragon 835, Android 10):
  dense chords at velocity 127 with sustain overload four of the five
  presets even after the optimization of sampler-006 — 2328 xruns in 60 s
  on Welcome_Combi, a render mean of 4.35 ms in blocks of about 3.75 ms.
  The audio thread ran on the small cores. The voices themselves
  dominate: interpolation, flex envelopes, panning, `Voice::isFree`.
- The engine times whole renders (`graph.stats`: render time sum and
  maximum since `resetStats`, overloads, xruns via `engine.numbers`); it
  has no per-node time and no windowed load gauge, and the stress tests
  reset the stats they read.
- Node diagnostics (`report`) carry the result codes of the ABI of
  `aud_audio_core`; a code for stolen voices would need ABI 0.5 and new
  builds of every package. Process-wide state of a package reaches Dart
  through C exports of the package (`AudDspSampler.storeBytes`).
- `AudEffectsBench` (ticket 28) measures a node on the calling thread; on
  the tablet the audio thread was about ten times slower than the bench, so
  a bench on the main thread overestimates the device.

## Decisions of the plan review (2026-10-14)

1. **The governor lives in `aud_audio`**, as a general load governor: an
   engine extension that drives any budget through a small interface. The
   app binds it to the sampler's voice budget; `aud_audio` and
   `aud_dsp_sampler` stay independent of each other, and synthesizer
   voices can use it later.
2. **Stealing: released voices first, then the oldest; a 10 ms fade; a
   reserve of free voices.** The sampler keeps a reserve of free voices
   (4 by default, 3 to 5 meant) below each limit: when fewer are free, it
   fades out sounding voices until the reserve is back, so that a new note
   always finds a free voice and starts at once while the stolen voice
   fades. Voices that are already released (key and pedal up) go first,
   the oldest of them first, then the oldest held voices; all layers of a
   note go together. A stolen voice fades out linearly over 10 ms and is
   free at its end, without sfizz's 50 ms tail.
3. **Thresholds: a band of 40 to 70 % around the 50 % of ticket 17**,
   revised the same day after the sweeps on the Galaxy Tab S4 (Findings):
   **the mean share, down above 85 %, up below 72 %, aimed at 75 %**
   (first down above 80 %, up below 65 %, aimed at 70 %, which held the
   tablet at 25 voices).
   Every 100 ms; down at once on an xrun or a mean share above 85 % of
   the block over the last second; up in small steps only while the mean
   stays below 72 % and the budget limits; a line through the shares over
   the voices aims the mean at 75 %. The p99 (first per render, then over
   the device buffer, as the user chose in turn) stayed at 0.69 or more at
   every budget of the tablet, far above the 50 % it aimed at, and steers
   nothing now. Late callbacks do not count: the emulator and the tablet
   report hundreds of them without load.
4. **Automatic only.** Players see and set nothing; a developer setting
   shows the budget, the voices, the stolen voices and the load.
5. **Voices only.** The sample quality stays at 2 (Hermite); ticket 30
   measures the cost per voice by quality and may revisit it.

## Scope

1. **A voice limit that changes in real time** (`aud_dsp_sampler`, the
   sfizz fork): a parameter `max_voices` (1 to 256, default 256 — no limit
   beyond the polyphony) that takes effect at the next block without a
   reload. Above it the node steals as in decision 2. New notes are never
   refused: the excess goes at the end of the block that started them.
   sfizz's own polyphony limits stay as they are, so the goldens keep
   their output.
2. **One voice budget per process** (`aud_dsp_sampler`): the nodes of the
   package publish their sounding and their released voices to atomics of
   the process; Dart sets the budget and the reserve on the control thread
   (`AudDspSampler.voiceBudget`, `AudDspSampler.voiceReserve`; 0 lifts the
   budget). Each node takes its share of the excess at the end of each
   block: released voices first, shared out by the released voices of
   each node, then held voices by the held voices of each node. The budget
   holds for live renders; offline renders count no voices and steal none
   for it. Counters that are never reset — the voices stolen and the
   voice frames rendered — serve the governor and the developer setting
   (`AudDspSampler.voiceStats`), in place of a diagnostic per block.
3. **A load gauge in the engine** (`aud_audio_graph`): the share of its
   block that each of the last 1024 live renders took, kept in a lock-free
   ring on the audio thread; `AudGraph.renderLoad` (C:
   `aud_graph_render_load`; `AudGraph.load` loads graph documents)
   returns the mean, p99 and maximum over a window (one second by
   default) and the overloads and renders since the graph was created,
   without touching the stats that `resetStats` zeroes.
4. **The governor** (`aud_audio`): `AudLoadGovernor`, an engine extension
   that ticks every 100 ms on the control thread from the start of the
   engine to its stop. It reads the gauge, the xruns of the stream and the
   budget's voices, fits the share of the block a voice costs and sets
   the budget as in decision 3, never below a floor (8 voices) and never
   above a ceiling (256). It starts from the budget the app learned on
   this device before or, the first time, from `AudDeviceClass`: the iOS
   model; on Android the cores and their clocks, the SoC and the media
   performance class from the system. It reports its state (budget,
   voices, stolen voices per minute, load, settled) as a stream. No Dart on
   the audio thread.
5. **The app** turns the governor on for its sampler nodes, keeps the
   per-node polyphony at 64, stores the budget once it has settled and
   starts from it on the next launch on the same device model; a developer
   setting shows the budget, the voices, the stolen voices and the load.
6. **Measurements** on the iOS simulator, the Android emulator and the
   reference devices of release-004 (Galaxy Tab S4, iPad Pro M5, iPhone 16
   Pro Max): the dense-chord stress test of ticket 28
   (`integration_test/effects_numbers_test.dart`) with zero xruns once the
   governor has settled, the time it takes to settle, the budget it
   reaches per device, the voices stolen per minute, the render share
   before and after, and a listening check that stealing does not click.

## Affected repos

- `aud_dsp_sampler`: `max_voices`, the budget and reserve of the process,
  stealing with a fade, the counters; a patch version (0.3.1 → 0.3.2).
- `aud_audio_graph`: the load gauge; a patch version (0.5.1 → 0.5.2).
- `aud_audio`: the governor and the device class; a patch version
  (0.4.1 → 0.4.2).
- `audanika_app`: the governor switched on, the developer setting, the
  stored budget, the stress test as an acceptance test.
- `aud_audio_pm`: this plan and the decisions.

The packages take patch versions, as family-002 asks for additions in
0.x: `aud_audio_midi` asks for `aud_audio_graph ^0.5.1` and `aud_audio
^0.4.1`, and a minor version (0.6.0, 0.5.0) would leave that range and
break the app's resolution. `AudGraph.renderLoad` is a new member of an
interface that nothing outside `aud_audio_graph` implements, as
`AudGraph.timing` was in 0.5.1. gg added `aud_audio_core`,
`aud_audio_io`, `aud_audio_midi`, `aud_audio_web` and `aud_dsp_effects` to
the ticket as dependencies; they carry only tooling changes (helix ^1.12.0,
example locks of the current version) and leave it unless they change
(family-002).

## Steps

1. Plan review; settle the open questions (done 2026-10-14).
2. The voice limit, the budget and the stealing with a fade in the sfizz
   fork, with native tests (no allocation and no lock on the audio thread,
   the stolen voices fade without a step, the count stays exact across
   nodes and threads, the goldens unchanged).
3. The load gauge in the graph.
4. The governor, first as a simulation over recorded loads, then live.
5. The app; the stress test on the simulators and the reference devices;
   tuning of the thresholds and the start budgets of the device classes.
6. Decisions, review, publish.

## Findings

The implementation deviates from the plan where the code or the
measurements asked for it; the user decided the revisions of decision 3 on
2026-10-14.

- **The sampler** (sampler-008): `max_voices` is read from the node's
  parameters at the end of each block, over the active and the fading synth;
  it never enters the configuration that loads a synth. The budget of the
  process is a constant-initialized static, so that its first use on the
  audio thread allocates nothing. The voices of a synth that fades out after
  a load go first. A stolen voice also ignores note offs and pedals and
  starts no release trigger. Ties of age break by the start time, then by
  the voice. A removed node keeps its counts until the graph destroys it,
  a suspended graph keeps them (open work of sampler-008). The goldens of
  the fork stayed bit for bit.
- **No diagnostic per block:** a result code for stolen voices would need
  ABI 0.5 of `aud_audio_core`; the counters of `AudDspSampler.voiceStats`
  serve the governor and the developer panel instead.
- **The gauge** (graph-004) is `aud_graph_render_load` /
  `AudGraph.renderLoad`, since `AudGraph.load` loads graph documents. It
  also reads the runs of renders that fill the device buffer.
- **The device class** reads the system through the C library, no plugin:
  `sysctlbyname` on iOS, `/sys/devices/system/cpu` and
  `__system_property_get` on Android. The iOS simulator does not set
  `SIMULATOR_MODEL_IDENTIFIER` for the app; its `hw.machine` is the Mac's
  architecture, which marks it as virtual.
- **The p99 does not steer** (decision 3 revised). On the Galaxy Tab S4 a
  render's p99 stayed at 0.9 to 1.3 of the block from 4 to 47 voices, and
  over the runs that fill the device buffer of 384 frames (two renders) at
  0.7 to 1.05: every 250 ms the stress test starts 9 to 11 notes at once,
  and these bursts make a few renders long at any number of voices. The
  first governor, on the p99 band of the plan review, held the tablet at
  the floor of 8 voices (4 sounding) with 2100 stolen voices per minute.
- **The share without voices is no constant:** 8 % at rest, about 37 %
  while the stress test plays (the master chain, four nodes, the note-ons).
  Learned at rest, it made a voice look ten times as dear; the policy fits
  a line through the shares of the playing periods instead.
- **The emulator's jitter:** renders of up to 23 ms in blocks of 10 ms at a
  mean share of 5 to 10 %, without an xrun. A governor on the p99 cut it to
  11 voices; on the mean it does not react.
- **flutter installs over the app:** the debug build of the tests could not
  replace the installed Audanika app on the tablet (other signature) and
  uninstalled it with its data.

### The voice sweep of the Galaxy Tab S4

`integration_test/voice_budget_sweep_test.dart`, the stress test on
Welcome_Combi for 20 s per fixed budget, without the governor:

| Budget | Voices | Xruns | Mean share | p99 per render | p99 over the buffer |
| --- | --- | --- | --- | --- | --- |
| 8 | 4.4 | 0 | 0.42 | 0.96 | 0.69 |
| 16 | 12.4 | 3 | 0.67 | 1.27 | 1.05 |
| 24 | 19.8 | 0 | 0.71 | 1.29 | 1.02 |
| 32 | 27.5 | 0 | 0.72 | 1.26 | 0.97 |
| 48 | 46.6 | 0 | 0.76 | 1.29 | 0.97 |
| 64 | 69.4 | 14 | 0.89 | 1.54 | 1.16 |
| 96 | 77.8 | 1011 | 1.27 | 2.14 | 1.60 |
| none | 85.5 | 1126 | 1.35 | 2.28 | 1.69 |

The cores ran at their highest clock throughout (1.9 and 2.36 GHz).

### Listening check

On 2026-10-14 the user listened on the Galaxy Tab S4 to 45 s of the stress
test at a fixed budget of 16 (12 voices, 2000 stolen voices per minute)
and 45 s under the governor (32, 28 voices, 1900 per minute): no clicks.

## Measurements

The stress test of ticket 28 (`integration_test/effects_numbers_test.dart`,
dense chords at velocity 127 with sustain, 60 s per preset) on the final
governor (mean share, 75 / 72 / 85 %): the five presets on one engine, the
default preset without the master chain on a new engine, without the
governor (the load before this ticket) and from the budget it reached (a
learned start). Debug builds with the native code optimized, 48 kHz.
"Settled" is the time of the last lowering of the budget from the start of
the preset; the xruns after it are the acceptance of the ticket. A time in
parentheses: the budget fell less than 10 s before the end of the preset,
so the governor had not settled. The mean voices count every voice that
renders — the ones the budget steals and the ones sfizz's own limits turn
off, while they fade —; the most counts the sounding voices at the end of
each period, so the mean can exceed it even where nothing is stolen. The
p99 of a render is the median of the periods' p99 over the last second.

### Galaxy Tab S4

Buffer 384 frames, renders of 180 frames (3.75 ms); start budget of the
class 32 (the fastest cores at 2.36 GHz, no media performance class).

| Run | Xruns | After settling | Settled | Budget | Voices mean / max | Stolen / min | Mean share |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E-Piano (start 32) | 1 | 0 | 18.8 s | 32 → 45 | 23 / 50 | 657 | 0.67 |
| Welcome_Combi | 0 | 0 | 0 s | 45 → 46 | 48 / 45 | 1607 | 0.77 |
| Organ_Combi | 1 | 0 | 5.2 s | 46 → 45 | 23 / 43 | 676 | 0.70 |
| Strings | 0 | 0 | 0 s | 45 → 52 | 44 / 52 | 1042 | 0.76 |
| Vibraphone | 0 | 0 | (58.2 s) | 52 → 34 | 61 / 52 | 1232 | 0.82 |
| Without the chain (start 32) | 0 | 0 | 0 s | 32 → 42 | 38 / 41 | 1854 | 0.75 |
| Without the governor | 2318 | — | — | — | — | 0 | 1.16 |
| Learned start (34) | 0 | 0 | 0 s | 34 → 37 | 33 / 37 | 1929 | 0.76 |

The render share fell from 1.16 of
the block (4.38 ms in 3.75 ms, 2318 xruns per minute) to 0.67 to 0.82; the
p99 of a render stayed at 1.25 to 1.34, which the buffer absorbs. On the
first preset the budget rose from 32 to 51 in 13 s; an xrun at 18.8 s cut
it to three quarters of the 17 voices that sounded then (13), and it rose
back to 45 within 20 s. Vibraphone lowered the budget once more at 58 s on
a mean above 85 %, without an xrun.

### iPhone 16 Pro Max

Buffer 256 frames, renders of 256 frames (5.33 ms); start budget of the
class 96 (two performance cores).

| Run | Xruns | Budget | Voices mean / max | Stolen / min | Mean share | p99 |
| --- | --- | --- | --- | --- | --- | --- |
| E-Piano | 0 | 96 | 31 / 81 | 0 | 0.13 | 0.21 |
| Welcome_Combi | 0 | 96 | 95 / 83 | 0 | 0.21 | 0.30 |
| Organ_Combi | 0 | 96 | 31 / 81 | 0 | 0.13 | 0.21 |
| Strings | 0 | 96 | 57 / 88 | 0 | 0.18 | 0.26 |
| Vibraphone | 0 | 96 | 96 / 87 | 0 | 0.22 | 0.31 |
| Without the chain | 0 | 96 | 95 / 83 | 0 | 0.21 | 0.30 |
| Without the governor | 0 | — | — | 0 | 0.22 | — |
| Learned start (96) | 0 | 96 | 95 / 84 | 0 | 0.22 | 0.31 |

The iPhone renders the stress test at a fifth of its block: at most 88
voices sound, below the start budget less the reserve, so the governor
neither steals nor raises; the budget stays at the class's 96 and the
fitted cost of a voice (0.1 to 0.2 % of the block) puts the fit at the
ceiling of 256.

### iOS simulator and Android emulator

iPhone 17 Pro simulator (renders of 512 frames, 10.7 ms) and an Android 16
emulator (arm64, a device buffer of 1920 frames in renders of about 500),
both virtual, start budget 64:

| Run | Xruns, simulator / emulator | Budget | Stolen / min | Mean share | p99 of a render (median) |
| --- | --- | --- | --- | --- | --- |
| E-Piano (start 64) | 0 / 0 | 64 → 87 | 55 / 54 | 0.06 / 0.08 | 0.12 / 0.45 |
| Welcome_Combi | 0 / 0 | 87 → 90 | 0 / 0 | 0.11 / 0.13 | 0.21 / 0.61 |
| Organ_Combi | 0 / 0 | 90 | 0 / 0 | 0.07 / 0.09 | 0.15 / 0.38 |
| Strings | 0 / 0 | 90 → 94 | 0 / 0 | 0.11 / 0.14 | 0.22 / 0.52 |
| Vibraphone | 0 / 0 | 94 | 0 / 0 | 0.11 / 0.14 | 0.20 / 0.52 |
| Without the chain (start 64) | 0 / 0 | 64 → 89 / 90 | 60 / 60 | 0.11 / 0.14 | 0.20 / 0.53 |
| Without the governor | 0 / 0 | — | 0 / 0 | 0.12 / 0.15 | — |
| Learned start (94) | 0 / 0 | 94 | 0 / 0 | 0.13 / 0.14 | 0.22 / 0.59 |

The budget rises from the class's 64 while it limits the first chords and
stops where the stress test asks for no more (88 voices at most); the
emulator's long renders (up to 16 ms in blocks of 10 ms, the p99 of a
second up to 2.0) move nothing, as the mean stays at 0.08 to 0.14.

### iPad Pro (M5)

Not measured: the iPad was not reachable on 2026-10-14 (open work).

## Open questions

None. Questions 1 to 5 were answered in the plan review on 2026-10-14
(above); question 6 on 2026-10-13: the Galaxy Tab S4, the iPad Pro (M5)
and the iPhone 16 Pro Max (release-004). The answers and the findings went
into sampler-008, graph-004, lifecycle-003 and app-005.

## Out of scope

The speed of the voice loop itself (interpolation, envelopes, panning,
`Voice::isFree`, SIMD on ARM) and the audio thread's placement on the
small cores of the Galaxy Tab S4 (io-002): both raise the budget; both
are planned as ticket 30.

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); the standing rules of
process-005.

## Rests on

lifecycle-001, lifecycle-002, sampler-002, sampler-003, sampler-006,
sampler-007, interop-001, graph-002, app-002, family-002, process-004,
process-005,
release-004; the measurements of ticket 28.
