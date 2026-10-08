# interop-002: The real-time contract of the queues

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/review-2026-10-08-engine-contracts.md
  (point 2); decisions/interop-001.md
- Open work: default capacities and the per-block event budget, to be
  measured in the spike and the core ticket

## Decision

Commands are separated by class, each with its own queue, owner and
overflow rule. Graph transactions go to the control thread, never to a
realtime queue, so compiling and loading cannot delay live events.
Parameter changes and timestamped events travel in fixed-capacity,
lock-free single-producer single-consumer queues from the Dart proxy
(one producer per queue; several isolates share one proxy) to the audio
thread. Parameter changes coalesce: the latest value per parameter wins.
Events are never dropped silently: a full queue rejects the enqueue and
Dart receives an error. The audio thread processes at most a fixed
budget of events per block and carries the rest over in order. Late
events — timestamp already passed — play at the start of the block
with a diagnostic (a per-engine policy may drop them instead). Delivered
note-ons are always closed: the engine tracks running notes per node
and emits the matching note-offs on overflow, reset, stop and
retirement. Meter, analysis and diagnostic data flow through lossy ring
buffers that overwrite the oldest entry. The audio thread never calls
into Dart: it signals a semaphore, and a dedicated notification thread
invokes `NativeCallable.listener`, whose execution is neither
allocation-free nor bounded.

## Why

- "Lock-free" alone says nothing about capacity, ownership, overflow or
  lateness; dropping a meter frame is harmless, dropping a note-off is
  a stuck note.
- The listener callable posts a message to the isolate's port, which is
  not a real-time safe operation.
