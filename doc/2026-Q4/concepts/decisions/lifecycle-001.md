# lifecycle-001: Engine lifecycle and resource policies

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/review-2026-10-08-engine-contracts.md
  (point 10)
- Open work: default budgets; the interruption behaviour per platform

## Decision

The engine has explicit states — created, prepared, running, suspended,
stopped, disposed — and every transition is acknowledged through the
event ring. A route change, a sample-rate or buffer-size change and an
interruption follow one sequence: stop the callbacks safely, reprepare
all node instances for the new rate and block size, reset the timing
filter and the transport snapshot, restart, acknowledge. Shutdown
reverses start-up: stop IO, drain the queues, close running notes,
dispose instances, free memory. Resources have budgets and policies: a
sample cache budget in bytes per engine with least-recently-used
eviction; streaming nodes output silence and raise a diagnostic on
underflow, never block; instrument nodes bound their polyphony and
steal voices; asset loads have ids and can be cancelled; loaded assets
are reference-counted and shared between nodes and engine instances in
one process.

## Why

- Devices change routes, phones interrupt audio and hosts change block
  sizes; without a defined sequence each case is a bug of its own.
- Budgets keep the engine alive on the long tail of devices.
