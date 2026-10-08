# sched-001: Work-stealing parallel rendering with real-time workers

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/graph-engines-and-audiokit.md,
  topics/audio-io-platforms.md (R8)
- Open work: measure speed-up and jitter per platform in the spike;
  define the cost model that switches parallel rendering on

## Decision

Serial execution on the audio callback thread is the baseline: every engine
starts single-threaded, and the parallel scheduler is switched on per engine
instance when the compiler's cost estimate of the program exceeds a measured
share of the block budget. Jobs are coarse — fused chains and independent
subgraphs, not single nodes. When enabled, the render program is executed per
block by a pool of real-time worker threads plus the audio callback thread
itself: each job holds an atomic count of unfinished inputs; a finished job
decrements its successors and pushes those reaching zero onto the finishing
worker's lock-free deque, idle workers steal from neighbours, and the cycle
ends when all terminal jobs are done. Workers default to cores minus one, are
created by the engine, run at real-time priority and join the platform's
mechanism (Apple audio workgroup, Windows MMCSS "Pro Audio", Linux SCHED_FIFO,
Android high priority). Summation order is fixed in the program, so the result
is bit-identical for any thread count. The callback thread finishes the
remaining jobs itself when a worker is late, so one delayed worker never
misses the deadline on its own. Inside plugin shells the engine never creates
its own pool: it uses the host's thread pool where the format offers one
(CLAP) and stays serial otherwise. One thread is the fallback on single-core
devices and in the web worklet.

## Why

- Proven in AudioKit v6 and Ardour; the DAG from graph-001 provides the
  dependencies for free.
- For small graphs the synchronization costs more than the DSP, and
  plugin instances with private pools oversubscribe a DAW (external
  review, 2026-10-08).
- Deterministic output keeps golden-file tests valid across machines.
