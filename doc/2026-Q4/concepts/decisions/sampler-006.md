# sampler-006: Optimizations of the sfizz fork keep its output bit for bit

- Status: accepted
- Date: 2026-10-13
- Canonical source: tickets/2026-10-13-28-build-reverb-delay-and-a-master-limiter.md
  (Measurements, Galaxy Tab S4: the user's request to make the MIDI flush
  and the compressor much faster); `src/third_party/NOTICES.md` and
  `scripts/test-native.js --bench` of `aud_dsp_sampler`
- Refines: [sampler-002](sampler-002.md) — changes in place with
  "Modified by Audanika" notes; [sampler-005](sampler-005.md) — the
  shared state stays thread-safe
- Open work: the voice loop (interpolation, flex envelopes, panning,
  `Voice::isFree`), which now dominates on small cores

## Decision

A performance change to the sfizz fork renders the same samples as the
release before it, bit for bit, unless its own decision says otherwise.
Every such change keeps a reference copy of the original code in a native
test and compares them on random and edge-case input, and the render of
an app-like instrument stays equal to its golden from the previous
release. `node scripts/test-native.js --bench` measures each optimized
spot against the previous release. Ticket 28 applied this to the MIDI
flush (only the event vectors that received events), the compressor
(`log10` above the threshold only, `pow` only for a gain other than 0 dB,
silence passed through at rest), the effect bus (a silent bus whose
effects are at rest skips them), the gain effect and a voice's pitch and
volume conversions (once per run of equal values).

## Why

- The instruments of the app are tuned by ear and by golden renders
  (app-001); an optimization that moved a sample would need a new
  listening check on every preset.
- A reference copy in the test proves equality for the inputs that
  matter more cheaply than reasoning about every branch.
