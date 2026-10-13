# sampler-002: aud_dsp_sampler is the audaudio fork of sfizz

- Status: accepted
- Date: 2026-10-11
- Canonical source: tickets/2026-10-11-25-build-the-sfz-sampler-on-sfizz-for-ios-and-android.md
  (question 5; question 9, the license of Audanika's code, answered by
  Gabriel Gatzsche at the review, 2026-10-12)
- Refines: [sampler-001](sampler-001.md) — the fork is the package;
  [build-001](build-001.md) — sfizz is no longer refreshed as a subset
- Refined by: [sampler-005](sampler-005.md) — the state the fork shares
  across the process is made thread-safe in place (ticket 28);
  [sampler-006](sampler-006.md) — optimizations keep the output bit for
  bit (ticket 28), superseded by [sampler-007](sampler-007.md) — within
  the golden tolerance
- Open work: none; a branch in `audanika/sfizz` only if the fork is ever
  shared outside the package

## Decision

`aud_dsp_sampler` is the audaudio fork of sfizz. Its copy under
`src/third_party/sfizz` started on 2026-10-08 (ticket 5) as the subset of
`audanika/sfizz` at `824afdc` that the linker pulls, and has been changed in
place since ticket 25: no patch files and no new vendoring -
`scripts/vendor-sfizz.js` is gone, so that nothing overwrites the fork. The
git history of the package is the history of the fork. sfizz's files keep
their BSD-2-Clause headers; every changed file says what changed in a
"Modified by Audanika" note below its header, and
`src/third_party/NOTICES.md` names the origin and the changes. Audanika's
code in the fork - those changes and new files such as `RbjFilters.hpp` -
is BSD-2-Clause like sfizz, so that the fork has one license and its fixes
can go upstream. The decision
refines sampler-001, which named the audanika fork as the source, and
build-001, whose subset is no longer refreshed for sfizz.

## Why

- The rework of ticket 25 - one sample store per process, streams as
  engine tasks, no allocation on the audio thread, the license audit -
  changes sfizz's core files; patch files over a vendored copy would have
  to be rebased with every change.
- The upstream is archived; the maintenance is ours either way
  (sampler-001).
