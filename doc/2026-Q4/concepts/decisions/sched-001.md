# sched-001: Work-stealing parallel rendering with real-time workers

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/graph-engines-and-audiokit.md,
  topics/audio-io-platforms.md (R8)
- Open work: measure speed-up and jitter per platform in the spike;
  choose the job granularity (node or fused chain)

## Decision

The render program is executed per block by a pool of real-time worker
threads plus the audio callback thread itself: each job holds an atomic
count of unfinished inputs; a finished job decrements its successors and
pushes those reaching zero onto the finishing worker's lock-free deque,
idle workers steal from neighbours, and the cycle ends when all terminal
jobs are done. Workers default to cores minus one, are created by the
engine, run at real-time priority and join the platform's mechanism
(Apple audio workgroup, Windows MMCSS "Pro Audio", Linux SCHED_FIFO,
Android high priority). Summation order is fixed in the program, so the
result is bit-identical for any thread count. One thread is the
fallback (single-core devices, the web worklet). Render-ahead of
non-interactive branches (REAPER style) is a later option.

## Why

- Proven in AudioKit v6 and Ardour; the DAG from graph-001 provides the
  dependencies for free.
- Deterministic output keeps golden-file tests valid across machines.
