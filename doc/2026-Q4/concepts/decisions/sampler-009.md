# sampler-009: The voice loop of the sfizz fork visits only busy voices and renders four frames at once

- Status: accepted
- Date: 2026-10-15
- Canonical source: tickets/2026-10-13-30-render-the-sampler-voices-faster-on-the-big-cores.md
  (scope 2 and 3, decision 1 of the plan review; Findings)
- Refines: [sampler-007](sampler-007.md) — the optimizations it allows
  kept the renders bit for bit, below its tolerance
- Open work: hand-written NEON for the gain operations of armv7, where
  clang does not vectorize them (no reference device runs armv7); the
  windowed-sinc interpolation, which gained least (1.6 times)

## Decision

The voice loop of the fork is made faster in six steps, each with renders
that stay the same bit for bit against the fork of release 0.3.2:

1. **Busy voices only.** The voice manager keeps a bit per voice that is
   not idle; the render loop and the loops of note-offs, controllers,
   pitch bend, aftertouch, off groups and all notes off visit only those,
   in the order of the list, and a free voice is found without a walk.
2. **Fused passes.** The gains of the amplitude stage take one pass; gain,
   pan, width, position and the pan compensation take one more when they
   hold over the block, with the NEON and scalar gains of `pan()` and
   `width()` on the frames each treated before. A region without crossfade
   controllers skips the crossfade; the power follower runs only for the
   stealer that reads it; a modulation target with a single source at depth
   1 hands out the source's buffer, unless a cycle reads it while it
   computes; the stages of a voice are no longer timed.
3. **Positions and interpolation.** A pitch that holds converts once; the
   positions are summed and split in one pass; a block that ends before its
   loop or sample end skips the walks that wrap and end; on arm64 the
   Hermite interpolation computes four frames in a vector with the products
   and sums of a frame.
4. **Whole envelope stages.** A flex-EG sustain past its stage time fills
   its level; the other stages sum their times first (`stepSum()`, bit for
   bit the serial sum) and then take their levels; the ADSR sustain fills
   its level.
5. **Voice start.** A polyphony check over fewer candidates than its limit
   steals nothing without a walk; a layer keeps the modulation targets of
   its region; a file identifier hashes its name once; the callback
   breakdown times blocks and events only once it was asked for — the node
   never asks.
6. **Four frames of envelope.** On arm64 the levels of a timed flex-EG stage
   are computed four frames at once; a block that ends before its stage
   skips the search for the end.

sfizz's NEON detection was already on (`SIMDConfig.h` reads `__ARM_NEON`);
on arm64 clang vectorizes the scalar gain operations itself, so the
single-operation NEON of the dispatch table was not worth writing.

## Why

- Ticket 28's and ticket 30's profiles of the audio thread showed the
  voices dominating on every device: interpolation, the flex envelope,
  panning, the gain passes and `Voice::isFree` over all 64 voices of four
  nodes.
- The native bench of ticket 30 (180 frames, the app's case: Hermite, flex
  EG, mono) on the Galaxy Tab S4: 12.2 → 3.6 µs per voice on the big cores,
  29.2 → 8.4 µs on the small ones; an idle synth 4.5 → 2.0 µs; four synths
  of which three play 742 → 371 µs; a note-on of a burst over 22 held notes
  4.4 → 2.4 µs. On the Mac (M5) 1.48 → 0.40 µs per voice.
- Bit-exact renders need no listening check and leave sampler-007's
  tolerance for later changes.
