# lifecycle-002: The engine's resources belong to the process

- Status: accepted
- Date: 2026-10-11
- Canonical source: tickets/2026-10-11-25-build-the-sfz-sampler-on-sfizz-for-ios-and-android.md
  (questions 1 and 2, Findings; Gabriel Gatzsche confirmed the deviations
  of the Findings at the review, 2026-10-12)
- Supersedes in part: [lifecycle-001](lifecycle-001.md) — one sample cache
  budget per process instead of per engine
- Refined by: [sampler-005](sampler-005.md) — the state all synths of a
  process share is thread-safe, since loads run on several workers at
  once (ticket 28)
- Open work: the defaults against the numbers of S24 (budget, workers,
  preload); a share of the budget per cache if packages compete; a
  capacity rule that also counts the heads of the other instruments, but
  not those of the instrument a load replaces, so that the budget bounds
  what all instruments pin; a smaller budget that a worker trims when one
  runs, on the calling thread only without one

## Decision

The resources of lifecycle-001 that span engines exist once per process in
`aud_audio_graph` and reach the packages through ABI 0.4. Two worker
threads run tasks from a bounded lock-free queue that the control thread,
the workers and the audio thread may post to. Loads have ids, progress, a
result and cancellation; each graph reports them as notifications and
keeps the running ones and the last 64. One sample cache budget holds for
the process: 256 MB by default, set through `AudEngineConfig` or
`AudGraph.cacheBudget`. Packages register their caches and report their
bytes; when the process holds more than the budget, a worker asks the
largest cache to free what nobody uses, the least recently used first, and
counts off what it freed; a smaller budget trims at once on the calling
thread. What a cache pins - the heads of the instruments that are loaded -
stays; a package refuses to pin more than the budget alone
(`AUD_ERROR_CAPACITY`), and streamed data over the budget is read anyway, a
note is never cut for it. Nodes report diagnostics from the audio thread,
summed per block, e.g. a stream that fell behind. The budget replaces the
one per engine of lifecycle-001: the samples are shared between engines,
so their budget is the process's.

## Why

- Every package with assets - the sampler now, the file player, impulse
  responses and time stretching later - needs workers, load ids and a
  budget; one manager in the engine serves all of them and spans them.
- A budget per engine cannot bound a store that two engines share.
