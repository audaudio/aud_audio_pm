# sampler-007: Optimizations of the sfizz fork may change the output within the golden tolerance

- Status: accepted
- Date: 2026-10-13
- Canonical source: Gabriel Gatzsche's instruction "Skip the bit-exact rule
  of sampler-006" on 2026-10-13, at the planning of ticket 30
- Supersedes: [sampler-006](sampler-006.md) — the rule that performance
  changes keep the output bit for bit; the optimizations of ticket 28 stay
- Open work: none

## Decision

A performance change to the sfizz fork — SIMD on ARM and x86, a reordered
or fused voice loop, approximations of transcendental functions — may
change the samples it renders, as long as the renders stay within the
golden tolerance of the family: a maximum absolute difference below 1e-5
of full scale per sample against the golden of the release before
(verification section of the plan of ticket 17). The reference copies and
the benches of sampler-006 stay as the way to prove it; a test that
compared bit for bit compares within the tolerance from now on. A change
that needs more than the tolerance takes a decision of its own and a
listening check of the app's presets.

## Why

- The fast paths that ticket 30 plans — sfizz's NEON operations, fused
  gain and pan loops — round differently from the scalar code; bit-exact
  output would rule them out.
- 1e-5 of full scale is about −100 dBFS, far below anything audible, and
  is the tolerance the family already uses for renders across
  architectures.
