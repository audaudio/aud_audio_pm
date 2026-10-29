# 30: S9c — Render the sampler voices faster and on the big cores

Status: planned 2026-10-13 during ticket 28, on the user's request (the
two costs that remained after the optimization of sampler-006). Plan
review on 2026-10-14, implementation and measurements on 2026-10-14 and
2026-10-15; implemented.

## Goal

The sampler renders each voice in less time, and the audio thread runs on
the device's fast cores, so that the voice budget of ticket 29 grows and
dense playing stays within the block on slow devices like the Galaxy Tab
S4. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md) and the
budgets of the plan of ticket 17; complements ticket 29, which limits the
voices to what the device renders.

## What the code base gives

From the profile of the audio thread on the Galaxy Tab S4 (ticket 28,
`simpleperf`, dense chords at velocity 127 on four sampler nodes, after
sampler-006 and app-004):

- **The voices dominate.** Their hot spots are
  `Voice::Impl::fillInterpolatedWithQuality` (interpolation),
  `FlexEnvelope::Impl::process` (the flex envelopes of app-001),
  `sfz::pan`, the gain loops `gainScalar` and `gain1Scalar`, and
  `Voice::isFree` at 6.8 %, which walks every voice of every node each
  block.
- **sfizz runs its scalar code on ARM.** `SIMDConfig.h` enables NEON only
  when `SFIZZ_HAVE_NEON` or `SFIZZ_DETECT_NEON` is defined; the build
  hook of `aud_dsp_sampler` defines neither, so `SIMDDispatch` picks the
  scalar operations on every ARM device.
- **The audio thread runs on the small cores.** The callback thread
  (`AudioTrack`, SCHED_FIFO 2, cpuset top-app, cores 0 to 7 allowed) ran
  on cores 0 to 3 — the 1.9 GHz in-order cores of the Snapdragon 835 — in
  every sample; the same nodes took about ten times longer there than in
  `AudEffectsBench` on the test's thread (io-002 open work). Oboe 1.11
  offers `setPerformanceHintEnabled` (ADPF), which needs Android 12; the
  tablet runs Android 10.
- sampler-007 (2026-10-13, superseding sampler-006): performance changes
  to the fork may change its output within the golden tolerance of 1e-5
  of full scale.

## Decisions of the plan review (2026-10-14)

What ticket 29 found, taken in:

- **The fixed cost weighs as much as the voices.** On the Galaxy Tab S4
  the share without voices is about 37 % while the stress test plays (the
  master chain, four nodes, the bursts of note-ons) and each voice adds
  about 0.8 %; at the governor's 75 % that leaves room for about 47
  voices. The ticket lowers both: the cost per voice and the fixed cost
  per block.
- **The bursts of note-ons** make a few renders long at any number of
  voices (the p99 of ticket 29); a cheaper voice start belongs to the
  voice loop.
- The governor (lifecycle-003) steers the mean share, down above 85 %, up
  below 72 %, aimed at 75 %; the tablet held 34 to 52 voices. The 50 % of
  release-004 is not met on the tablet. The cut after an xrun by the voices
  of that moment stays open work of lifecycle-003; it is measured, and it
  matters less once xruns are rarer. The iPad Pro (M5) was not measured.

What the code shows, and what the plan does with it (confirmed by the
user on 2026-10-14):

1. **NEON is already on; the dispatch has no NEON operations.**
   `SIMDConfig.h` detects NEON from `__ARM_NEON`, so the hook needs no
   define. The ARM branch of `SIMDDispatch` assigns no operation; only
   `Panning.cpp` has NEON code. On arm64, clang at `-O3` vectorizes the
   scalar gain, gain1 and multiply-add loops by itself (`fmul` and `fmla`
   on four lanes in the NDK's output); on armv7 it does not, since NEON
   there flushes denormals. The costs are the passes: a voice walks its
   block about twelve times (fill, copy, gain1, modulation, smoother,
   crossfades, gain, copy to the right, pan, two gain1) and interpolates
   and envelopes per sample. SIMD therefore means NEON for the
   interpolation's inner loop and fused passes; NEON for single operations
   only where the disassembly shows scalar code. x86_64 keeps sfizz's SSE.
2. **The big cores come right after the baseline**: the largest lever,
   and profiles on the in-order small cores would steer the voice loop
   wrongly.
3. **The affinity on Android 10 and 11** is set from the first callback of
   each stream and set again when a check once a second finds it lost:
   Linux resets a thread's affinity when Android moves the app between
   cpusets (background and foreground). When the system refuses it, the
   system's placement stays and the backend reports it.
4. **The performance hint of Android 12 and later** can only be checked for
   function on the emulator (Android 16); no reference device runs Android
   12 or later, so its effect stays open work of io-003.
5. **The iOS audio workgroup** only matters for helper threads: the engine
   renders serially on the IO thread itself (sched-001), which Core Audio
   already schedules in the device's workgroup. It is added only if the
   profile shows the thread scheduled badly.
6. **aud_dsp_effects** joins the ticket only if the profile shows that the
   master chain dominates the fixed cost (every repo committed first,
   process-005).
7. **Measurements**: the full set (the voice sweep and the stress test, the
   render time per voice and the fixed cost, the cores, battery and heat,
   the listening check) on the five devices before and after the ticket;
   per step the native bench and the voice sweep on the tablet.
8. **release-004**: if the tablet's mean share under the governor stays
   above 50 % after this ticket, a new decision supersedes the 50 %: the
   acceptance is zero xruns after settling at a governed mean of at most
   75 %; the 50 % stays a goal for fast devices.

## Scope

1. **A symbolized baseline.** Profiles of the audio thread with the
   unstripped libraries on the tablet, the iOS simulator and an iPhone or
   iPad, cost per voice by interpolation quality and envelope type; a
   native bench of the voice loop (`scripts/test-native.js --bench`).
2. **SIMD on ARM** (`aud_dsp_sampler`): turn on sfizz's NEON operations in
   the hook for arm64 and armv7 (and SSE where they exist on x86_64),
   check which operations have NEON code and which are worth writing
   (gain, gain1, multiply-add, pan, the interpolation's inner loop).
   SIMD changes the rounding, which sampler-007 allows within 1e-5 of full
   scale against the golden of the release before.
3. **The voice loop** (`aud_dsp_sampler`, the sfizz fork): a list of the
   sounding voices so that `isFree` and the per-block loops visit only
   those; the flex envelope rendered per segment instead of per sample
   where its shape allows; panning and the gains of a voice fused into one
   pass; the interpolation's common case — no pitch modulation within the
   block — with a constant step. Each with the reference tests of
   sampler-006, compared within the tolerance of sampler-007.
4. **The audio thread on the big cores** (`aud_audio_io`, the Oboe
   backend): on Android 12 and later the performance hint of Oboe (ADPF)
   with the work of each callback reported; on Android 10 and 11 (accepted
   by the user on 2026-10-13) an affinity of the callback thread to the
   fastest cluster, found from
   `cpuinfo_max_freq` of every core and set once from inside the first
   callback, with a fallback when the system refuses it; measured against
   battery and heat. On iOS the audio workgroup of the stream, if the
   thread is not already scheduled well. A decision io-003 records what
   each Android version gets.
5. **Measurements**: the stress test of ticket 28 on the tablet before and
   after each step, the render time per voice, the cores the audio thread
   runs on, the battery drain over ten minutes, and the reference devices
   once named.

## Affected repos

- `aud_dsp_sampler`: the voice loop of the fork (sampler-009), the native
  bench by interpolation, envelope and voice start, on the Mac and on the
  CPU clusters of an Android device; a patch version (0.3.2 → 0.3.3).
- `aud_audio_io`: the audio thread on the fast cores of Android (io-003),
  its placement in the counters (API 3); a patch version (0.3.3 → 0.3.4),
  since the counters only gain fields with defaults.
- `aud_audio`: the start budgets of `AudDeviceClass` (lifecycle-004); a
  patch version (0.4.2 → 0.4.3).
- `audanika_app`: the measurements print the placement of the audio thread;
  `tool/measure-voices.js` and `tool/profile-audio-thread.js` measure and
  profile the voices on a device. No opt-in of the app was needed: the
  sustained performance mode caps the clocks, and no xrun asked for more.
- `aud_audio_pm`: this plan and the decisions io-003, sampler-009 and
  lifecycle-004.
- `aud_audio_core`, `aud_audio_graph`, `aud_audio_with_midi`, `aud_audio_web`
  and `aud_dsp_effects`: added by gg as dependencies between the ticket's
  repos (the example of `aud_audio_io` resolves the graph and the core by
  path); they leave the ticket without a change of their own (family-002).

## Steps

1. Plan review; settle the open questions (done 2026-10-14).
2. The symbolized baseline and the benches; the full measurement set.
3. The audio thread on the big cores (io-003).
4. NEON for the interpolation and the fused gain and pan passes.
5. The voice loop: the sounding voices only, flex envelopes per segment,
   a constant step without pitch modulation, a cheaper voice start.
6. The start budgets of `AudDeviceClass`; the full measurement set, the
   battery and heat check.
7. Decisions, review, publish.

## Findings

The implementation deviates from the plan where the code or the
measurements asked for it.

- **The audio thread on the big cores** (io-003). Before, the callback
  thread of the Galaxy Tab S4 (`AudioTrack`, SCHED_FIFO 2) ran on the small
  cores in 99.3 to 99.7 % of the samples; after, on the big cores in all of
  them. Oboe's own performance hint aims at the whole burst, so the system
  would slow the thread until each callback fills its period and the
  governor would answer with fewer voices; the backend opens its own hint
  session aimed at half a burst and reports the work of every callback,
  without the mutex Oboe's report takes. On the Android emulator (Android
  16) the session opens; no reference device runs Android 12 or later, so
  its effect is open work of io-003.
- **Qualcomm's core control isolates idle big cores**, and the kernel
  leaves them out of the affinity it returns: the first check, which
  compared the masks exactly, bound the thread anew every second (157
  times in a sweep). It now accepts a mask within the fast cores (0 resets
  after).
- **NEON was already on**: `SIMDConfig.h` reads `__ARM_NEON`, the ARM branch
  of `SIMDDispatch` assigns no operation, and on arm64 clang vectorizes the
  scalar gain operations itself. The costs were the passes and the walks
  of the voice loop; the six steps of sampler-009 took them out with
  renders that stay the same bit for bit against the fork of 0.3.2 (all
  bench renders, and a differential driver over 48 instruments and 3000
  blocks of random events).
- **The fixed cost was mostly the small cores and the walks**: 36 % of the
  block without voices while the stress test plays. The big cores halved it
  (17.8 %), the busy-voice walk and the fused passes took it to 10 %, the
  rest of the loop to 7.2 % (7.4 % in the final measurement set). The master
  chain is 8 to 14 % of the audio thread on every device and stays in
  `aud_dsp_effects` (decision 6 of the plan review); `aud_dsp_effects`
  joined the ticket only as a dependency gg added.
- **The governor no longer limits the stress test on any device**: the
  Galaxy Tab S4 plays it at a mean of 0.19 to 0.46 of its block from the new
  start budget of 96 without stealing a voice and without an xrun, also
  without the governor (2160 xruns before). The 50 % of release-004 is met
  there in the mean; the p99 of a render reaches 0.34 to 0.75 of the block
  on the dense presets, which the buffer of two renders absorbs. release-004
  therefore stays (decision 8 of the plan review); the governor still lets a
  denser play rise to a mean of 75 % (lifecycle-003).
- **iOS needs no workgroup**: Core Audio's IO thread runs on the
  efficiency cores of the iPhone 16 Pro Max in 94 % of the samples at a
  budget of 48 and meets its deadline at a fifth of the block; the system
  moves it when the load asks. The engine has no helper threads
  (sched-001).
- **Battery on iOS**: `flutter test` reaches an iPhone or iPad only by
  cable, which charges it; Instruments reports no power of a process on a
  device it cannot attach to (xctrace finds a device's processes neither by
  name nor by id). The thermal state and the audio thread's time on a core
  per second stand for the drain there.
- **Tools**: `tool/measure-voices.js` and `tool/profile-audio-thread.js` of
  the app run the measurements and the symbolized profiles on every device;
  the libraries of the build keep their symbols, which `simpleperf` reads
  on Android and `atos` resolves for the Time Profiler on iOS. adb over
  Wi-Fi failed with "No route to host" until the adb server was started
  again from a shell with macOS's Local Network access.

### The steps on the Galaxy Tab S4

The voice sweep (fixed budgets, the stress test, 20 s each) after each
step, and the native bench of the voice loop on the big cores (180 frames,
Hermite, flex EG, mono; the fork of 0.3.2 before):

| Step | Without voices | Per voice | Voices at a mean of 75 % | Bench per voice |
| --- | --- | --- | --- | --- |
| Before | 36.2 % (1363 µs) | 0.84 % (31.6 µs) | 46 | 12.2 µs |
| The big cores (io-003) | 17.8 % (669 µs) | 0.60 % (22.4 µs) | 96 | 12.2 µs |
| 1 Busy voices only | 17.1 % (643 µs) | 0.60 % (22.5 µs) | 97 | 12.1 µs |
| 2 Fused passes | 10.1 % (379 µs) | 0.53 % (20.1 µs) | 122 | 7.6 µs |
| 3 Four frames of interpolation | 8.3 % (312 µs) | 0.44 % (16.5 µs) | 152 | 5.2 µs |
| 4 Whole envelope stages | 7.6 % (286 µs) | 0.48 % (18.2 µs) | 140 | 3.7 µs |
| 5 Voice start | 7.2 % (272 µs) | 0.47 % (17.8 µs) | 143 | 3.7 µs |
| 6 Four frames of envelope | 7.2 % (269 µs) | 0.41 % (15.3 µs) | 167 | 3.6 µs |

The line through the shares over the voices moves by about 0.04 % from run
to run; the bench is steadier. On the small cores the bench fell from 29.2
to 8.4 µs per voice; an idle synth from 9.3 to 5.2 µs (big cores 4.5 to
2.0 µs), four synths of which three play from 1.82 to 0.84 ms (0.74 to 0.37
ms), a note-on of a burst over 22 held notes from 10.5 to 5.9 µs (4.4 to
2.4 µs).

### The audio thread of the Galaxy Tab S4 by function

`simpleperf` (task-clock, 15 s at a budget of 48), the self time of the
audio thread; 45,593 samples before, 20,624 after:

| Function | Before | After |
| --- | --- | --- |
| `Voice::Impl::fillInterpolatedWithQuality` | 13.3 % | 26.7 % |
| `FlexEnvelope::Impl::process` | 10.4 % | 9.2 % |
| `AudPlateNode::renderFrames` (master chain) | 5.7 % | 7.5 % |
| `panStereo` (before `pan`, `width`) | 7.3 % | 7.0 % |
| `stepSum` | - | 6.4 % |
| `Voice::Impl::fillWithData` | 7.0 % | 6.4 % |
| `gain1Scalar`, `gainScalar` | 11.6 % | - |
| `Voice::isFree`, `offedOrFree` | 6.5 % | - |
| `clock_gettime` (vdso) | 1.3 % | - |

## Measurements

The full set before the ticket (the fork of 0.3.2, the audio thread where
the system placed it, the start budgets of ticket 29) and after it, with
`tool/measure-voices.js` and `tool/profile-audio-thread.js` of the app:
debug builds with the native code optimized, 48 kHz. The voice sweep plays
the stress test at fixed budgets without the governor, 20 s each
(`integration_test/voice_budget_sweep_test.dart`); a line through the mean
shares over the voices gives the share without voices and the share of a
voice, turned into times by the render. The stress test plays 60 s per
preset under the governor (`integration_test/effects_numbers_test.dart`).

| Device | Render | Without voices | Per voice | Voices at a mean of 75 % | Mean share of the presets | Budget reached | Stolen / min, most | Without the governor: xruns (mean share) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Galaxy Tab S4 | 3.76 ms | 1363 → 279 µs | 31.6 → 14.6 µs | 46 → 174 | 0.60–0.83 → 0.19–0.46 | 32–66 → 96 | 1370 → 0 | 2160 → 0 (1.11 → 0.47) |
| iPhone 16 Pro Max | 5.33 ms | 417 → 207 µs | 7.7 → 5.0 µs | 465 → 758 | 0.13–0.22 → 0.07–0.13 | 96 → 128 | 0 → 0 | 0 → 0 (0.22 → 0.13) |
| iPad Pro (M5) | 5.33 ms | 45 → 34 µs | 5.0 → 1.6 µs | 788 → 2427 | 0.04–0.10 → 0.01–0.04 | 96 → 192 | 0 → 0 | 0 → 0 (0.10 → 0.04) |
| iOS simulator | 10.67 ms | 234 → 184 µs | 20.6 → 6.9 µs | 376 → 1125 | 0.08–0.13 → 0.04–0.06 | 87–94 → 128 | 43 → 0 | 0 → 0 (0.13 → 0.06) |
| Android emulator | 10.37 ms | 261 → 193 µs | 17.6 → 6.5 µs | 427 → 1162 | 0.08–0.15 → 0.04–0.06 | 87–94 → 128 | 49 → 0 | 0 → 0 (0.16 → 0.06) |

After the ticket no preset of any device made an xrun under the governor
(the Galaxy Tab S4 made one on E-Piano before), and the governor settled
at once: the stress test keeps at most about 90 voices sounding, below
every new start budget less the reserve. The mean voices count every voice
that renders, also the ones sfizz's own limits fade out (up to 120 when
nothing limits them), the most only the sounding voices at the end of each
period of the governor, so the mean can exceed the most. The voices that
sound are the same before and after on the iOS devices and the virtual
ones; on the tablet more of them sound now, since nothing is stolen.

### Galaxy Tab S4, the stress test

| Run | Xruns | Settled | Budget | Voices mean / max | Stolen / min | Mean share |
| --- | --- | --- | --- | --- | --- | --- |
| E-Piano | 1 → 0 | 18.3 → 0 s | 32→61 / 96 | 26/60 → 31/81 | 502 → 0 | 0.60 → 0.19 |
| Welcome_Combi | 0 → 0 | 44.7 → 0 s | 61→41 / 96 | 62/58 → 94/83 | 1370 → 0 | 0.83 → 0.46 |
| Organ_Combi | 0 → 0 | 0 → 0 s | 41→66 / 96 | 28/62 → 31/81 | 354 → 0 | 0.66 → 0.19 |
| Strings | 0 → 0 | 13.2 → 0 s | 66→54 / 96 | 48/62 → 57/88 | 786 → 0 | 0.76 → 0.30 |
| Vibraphone | 0 → 0 | (60.0) → 0 s | 54→32 / 96 | 62/53 → 94/87 | 1211 → 0 | 0.81 → 0.44 |
| Without the chain | 1 → 0 | (52.4) → 0 s | 32→42 / 96 | 60/50 → 95/83 | 1289 → 0 | 0.79 → 0.42 |
| Without the governor | 2160 → 0 | - | - | - | - | 1.11 → 0.47 |
| Learned start | 0 → 0 | 0.1 → 0 s | 32→47 / 96 | 48/47 → 95/83 | 1582 → 0 | 0.75 → 0.46 |

The p99 of a render (the median of the seconds) fell from 1.21 to 1.38 of
the block to 0.34 to 0.75; the voice sweep without a budget plays 121
voices at a mean of 0.54 without an xrun (87 at 1.36 with 1157 before).

### The cores

- **Galaxy Tab S4**: `AudioTrack` (SCHED_FIFO 2) ran on the small cores in
  99.3 to 99.7 % of the samples before, on the big cores in all of them
  after; the backend's own samples put 99.5 % of the callbacks on a fast
  core (the first ones run before the binding), with no reset of the
  affinity and no refusal. The big cores reach their 2.36 GHz and average
  1.2 GHz under the stress test (1.3 GHz before, when they did not carry
  the audio thread); the small cores average 1.65 instead of 1.8 GHz.
- **Android emulator**: one cluster; the hint session opens (placement
  `hint`), the thread has no real-time policy there.
- **iPhone 16 Pro Max**: Core Audio's IO thread ran on the efficiency cores
  in 94 % of the samples before and 98 % after, 177 and 98 ms on a core per
  second at a budget of 48.
- **iPad Pro (M5)**: on the cores Instruments calls S cores, 55 ms on a
  core per second before and after, while the sweep puts the render at a
  third: the system appears to lower the clock as the work shrinks, so the
  time on a core is no measure of the drain there.

### Battery and heat

- **Galaxy Tab S4**, off the cable over adb on Wi-Fi, the stress test under
  the governor for 10.1 minutes from 100 %: the drain the system computes
  fell from 231 to 101 mAh, the level from 100 to 98 % both times, the CPU
  warmed by 2.6 °C before (20.3 to 22.9 °C) and 0.7 °C after (20.7 to
  21.4 °C).
- **iPhone 16 Pro Max and iPad Pro (M5)**: `flutter test` needs the cable,
  which charges them, and Instruments reports no power of a device's
  process it cannot attach to; the thermal state stayed nominal for the
  ten minutes before and after on both.

### Listening check

On 2026-10-15 the user listened on the Galaxy Tab S4 to the stress test
after the ticket, 20 s per preset and the three runs after them: "clean,
as before" — no clicks, no drop-outs; 0 xruns and 0 stolen voices, mean
shares of 0.17 to 0.33. The renders of the fork are the same bit for bit
as before (sampler-009), so the presets sound the same by construction.

## Open questions

1. Answered on 2026-10-13: SIMD and the other changes may change the
   output within 1e-5 of full scale (sampler-007).
2. Answered on 2026-10-13: pinning the audio thread to the big cores is
   accepted on Android 10 and 11, where the performance hint does not
   exist; Android 12 and later use the performance hint (recorded in
   io-003).
3. Answered on 2026-10-13: more battery drain on the big cores while the
   app plays is accepted.
4. Decided on 2026-10-13 (the user left it to Claude): ticket 29 first —
   the voice budget ends the drop-outs on every device — then this ticket,
   whose faster voices the governor of ticket 29 turns into more voices.
5. Answered on 2026-10-13: the Galaxy Tab S4, the iPad Pro (M5) and the
   iPhone 16 Pro Max (release-004).

None is open. The answers and the findings went into io-003, sampler-009
and lifecycle-004, and into the open work of io-002, sampler-007,
lifecycle-003 and release-004.

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); ask the user before
bringing in Fable 5.1 for the scheduling work if Opus gets stuck there.
The standing rules of process-005.

## Rests on

io-001, io-002, sampler-002, sampler-006, sampler-007, sampler-008,
lifecycle-001, lifecycle-003, interop-001, release-004, family-002,
process-004, process-005; the measurements of tickets 28 and 29.
