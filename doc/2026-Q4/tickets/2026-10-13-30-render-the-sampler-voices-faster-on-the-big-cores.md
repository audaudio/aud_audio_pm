# 30: S9c — Render the sampler voices faster and on the big cores

Status: planned 2026-10-13 during ticket 28, on the user's request (the
two costs that remained after the optimization of sampler-006). Not
started.

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
the optimization of sampler-006; app-004 then removed the per-node
compressors):

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
   fastest cluster, found from `cpuinfo_max_freq` of every core and set
   once from inside the first callback, with a fallback when the system
   refuses it; measured against battery and heat. On iOS the audio
   workgroup of the stream, if the thread is not already scheduled well.
   A decision io-003 records what each Android version gets.
5. **Measurements**: the stress test of ticket 28 on the tablet before and
   after each step, the render time per voice, the cores the audio thread
   runs on, the battery drain over ten minutes, and the other reference
   devices of release-004 (the iPad Pro (M5), the iPhone 16 Pro Max).

## Affected repos

Expected; the plan review confirms them.

- `aud_dsp_sampler`: SIMD, the voice loop, benches and tests; a patch or
  minor version.
- `aud_audio_io`: the performance hint and the affinity on Android; a
  minor version.
- `aud_audio_pm`: this plan and the decisions (io-003; the tolerance is
  sampler-007).
- `audanika_app`: only if the app must opt in (e.g. sustained performance
  mode of its window).

## Steps

1. Plan review; settle the open questions.
2. The symbolized baseline and the benches.
3. SIMD on ARM, within the tolerance of sampler-007.
4. The voice loop, step by step, each measured.
5. The audio thread on the big cores; the battery and heat check.
6. Decisions, review, publish.

## Open questions

None open; answered on 2026-10-13:

1. SIMD and the other changes may change the output within 1e-5 of full
   scale (sampler-007).
2. Pinning the audio thread to the big cores is accepted on Android 10
   and 11, where the performance hint does not exist; Android 12 and later
   use the performance hint (to be recorded in io-003).
3. More battery drain on the big cores while the app plays is accepted.
4. Decided by Claude, as the user left it open: ticket 29 first — the
   voice budget ends the drop-outs on every device — then this ticket,
   whose faster voices the governor of ticket 29 turns into more voices.
5. The reference devices are the Galaxy Tab S4, the iPad Pro (M5) and the
   iPhone 16 Pro Max (release-004).

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); ask the user before
bringing in Fable 5.1 for the scheduling work if Opus gets stuck there.
The standing rules of process-005.

## Rests on

io-001, io-002, sampler-002, sampler-006, sampler-007, app-004,
release-004, lifecycle-001, interop-001, process-004, process-005; the
measurements of ticket 28.
