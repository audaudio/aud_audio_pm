# 29: S9b — Limit the voices of the sampler by the CPU power of the device

Status: planned 2026-10-13 during ticket 28, on the user's request ("the
number of voices is restricted depending on the CPU power of the device;
currently I can easily create drop outs by playing heavily"). Not started.

## Goal

Playing hard never drops out. The engine learns how many sampler voices
the device renders within its block budget and keeps the sounding voices
below that number: voices beyond it are stolen with a short fade instead
of overloading the audio thread. The budget starts from the device's class
and follows the measured load, so a fast iPad plays more voices than a
Galaxy Tab S4. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md)
and the budgets of the plan of ticket 17 (the callback at most 50 % of the
block budget, zero xruns); refines lifecycle-001 ("instrument nodes bound
their polyphony and steal voices") and lifecycle-002 (one budget per
process).

## What the code base gives

- `aud_dsp_sampler` has the parameter `polyphony` (1 to 256, default 64)
  per node. A change loads the instrument again on a worker (sampler-003):
  sfizz allocates its voices and sets them only while it does not render.
  It cannot follow the load while a person plays.
- sfizz steals a voice only when all its voices sound (`VoiceManager`,
  stealing by envelope and age); it knows no limit below the allocated
  voices and no budget shared by several synths.
- The app plays four sampler nodes (three channels and `external`), each
  with 64 voices: up to 256 voices on one audio thread.
- Ticket 28 measured on the Galaxy Tab S4 (Snapdragon 835, Android 10):
  dense chords at velocity 127 with sustain overload two presets even after
  the optimization of sampler-006 — 2328 xruns in 60 s on Welcome_Combi,
  a render mean of 4.35 ms in blocks of about 3.75 ms. The audio thread ran
  on the small cores. The voices themselves dominate: interpolation, flex
  envelopes, panning, `Voice::isFree`.
- The engine times whole blocks (`graph.stats`: render time sum and
  maximum since `resetStats`, overloads, xruns via `engine.numbers`); it
  has no per-node time and no windowed load gauge.
- `AudEffectsBench` (ticket 28) measures a node on the calling thread; on
  the tablet the audio thread was about ten times slower than the bench, so
  a bench on the main thread overestimates the device.

## Scope

1. **A voice limit that changes in real time** (`aud_dsp_sampler`, the
   sfizz fork): a parameter `max_voices` (1 to `polyphony`) that takes
   effect at the next block without a reload. Above it the node steals:
   a new note takes the voice sfizz would steal first, and when the limit
   falls, the excess voices release with a fade of a few milliseconds.
   Stolen voices are reported as a diagnostic of the block (`report`).
2. **One voice budget per process** (`aud_dsp_sampler`): the nodes of the
   package share an atomic count of sounding voices and a budget that Dart
   sets on the control thread (`AudDspSampler.voiceBudget`); a node that
   would start a voice above the budget steals one of its own or, when it
   has none, drops the note's oldest layer. The per-node `max_voices`
   stays for instruments that want less.
3. **A load gauge in the engine** (`aud_audio_graph`): the render time of
   the last blocks as a ratio of their duration — mean, p99 and maximum
   over a sliding window — readable from Dart without resetting the stats
   the measurements use.
4. **The governor** (`aud_audio` or `aud_dsp_sampler`, decided in the
   plan review): on the control thread, every 100 ms, it reads the gauge,
   the xruns, late callbacks and the sounding voices, estimates the cost
   of a voice on this device and sets the budget: down at once on an
   overload or above 70 % of the block (p99), up slowly below 40 %, never
   below a floor (e.g. 8 voices). It starts from a class of the device —
   Android's media performance class, the count and clock of the big
   cores, the iOS device model — and from the budget it learned on this
   device before (stored by the app). No Dart on the audio thread.
5. **The app** turns the governor on, keeps the per-node polyphony at 64
   and shows nothing new; a developer setting shows the budget and the
   stolen voices.
6. **Measurements** on the Galaxy Tab S4, the iOS simulator and the
   Android emulator, the reference devices when named: the stress test of
   ticket 28 with zero xruns after the governor settles, the time it takes
   to settle, the budget it reaches per device, voices stolen per minute,
   and a listening check that stealing is not audible as clicks.

## Affected repos (expected)

- `aud_dsp_sampler`: `max_voices`, the process-wide budget and count,
  stealing with a fade, the diagnostics; a minor version.
- `aud_audio_graph`: the load gauge; a minor version.
- `aud_audio`: the governor if it lives there; a minor version.
- `audanika_app`: the governor switched on, the developer setting, the
  stored budget, the stress test as an acceptance test.
- `aud_audio_pm`: this plan and the decisions.

## Steps

1. Plan review; settle the open questions.
2. The voice limit and the stealing with a fade in the sfizz fork, with
   native tests (no allocation and no lock on the audio thread, the stolen
   voices fade, the count stays exact across nodes and threads).
3. The load gauge in the graph.
4. The governor, first as a simulation over recorded loads, then live.
5. The app; the stress test on the tablet; tuning of the thresholds.
6. Decisions, review, publish.

## Open questions

1. Where does the governor live: in `aud_audio` as a general load
   governor that drives any budget (sampler voices now, synthesizer voices
   later), or in `aud_dsp_sampler` next to the budget it sets?
2. Stealing: sfizz's order (envelope and age) or the quietest voice
   first; fade length 5 or 10 ms?
3. Thresholds: 70 % p99 down, 40 % up, 100 ms period — or the budgets of
   ticket 17 (50 % of the block)?
4. Should players see or set a limit (a "performance" setting), or stays
   it automatic?
5. Does the budget also lower the sample quality (sfizz's interpolation)
   before it steals voices?
6. Answered on 2026-10-13: the Galaxy Tab S4, the iPad Pro (M5) and the
   iPhone 16 Pro Max (release-004).

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
interop-001, graph-002, process-004, process-005; the measurements of
ticket 28.
