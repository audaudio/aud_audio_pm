# 30: S9c — Render the sampler voices faster and on the big cores

Status: planned 2026-10-13 during ticket 28, on the user's request (the
two costs that remained after the optimization of sampler-006). Plan
review on 2026-10-14; in progress.

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

## Affected repos (expected)

- `aud_dsp_sampler`: SIMD, the voice loop, benches and tests; a patch or
  minor version.
- `aud_audio_io`: the performance hint and the affinity on Android; a
  minor version.
- `aud_audio`: the start budgets of `AudDeviceClass`, which rise with the
  faster voices.
- `aud_audio_pm`: this plan and the decisions (io-003; the tolerance is
  sampler-007).
- `audanika_app`: the measurements run in its integration tests; it stays
  in the ticket only with changes of its own — the tests' new numbers, or
  an opt-in such as the sustained performance mode of its window.
- `aud_audio_midi` and `aud_audio_web`: added by gg as dependencies
  between the ticket's repos; they leave it unless they change
  (family-002).

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

## Open questions

1. Answered on 2026-10-13: SIMD and the other changes may change the
   output within 1e-5 of full scale (sampler-007).
2. Answered on 2026-10-13: pinning the audio thread to the big cores is
   accepted on Android 10 and 11, where the performance hint does not
   exist; Android 12 and later use the performance hint (to be recorded in
   io-003).
3. Answered on 2026-10-13: more battery drain on the big cores while the
   app plays is accepted.
4. Decided on 2026-10-13 (the user left it to Claude): ticket 29 first —
   the voice budget ends the drop-outs on every device — then this ticket,
   whose faster voices the governor of ticket 29 turns into more voices.
5. Answered on 2026-10-13: the Galaxy Tab S4, the iPad Pro (M5) and the
   iPhone 16 Pro Max (release-004).

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); ask the user before
bringing in Fable 5.1 for the scheduling work if Opus gets stuck there.
The standing rules of process-005.

## Rests on

io-001, io-002, sampler-002, sampler-006, sampler-007, lifecycle-001, interop-001,
process-004, process-005; the measurements of ticket 28.
