# graph-003: Graph transactions preserve node state

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/review-2026-10-08-engine-contracts.md
  (point 1); decisions/graph-001.md
- Open work: fade length defaults; the exact retirement rule for nodes
  with long tails

## Decision

Node instances and render programs are different things. A node
instance is a persistent object owned by the engine, created and
prepared on the control thread, addressed by a stable numeric handle,
and it keeps its state — voices, oscillator phases, delay contents,
reverb tails — across every program swap. A render program is an
immutable scheduling plan that only references instances. A graph edit
is a transaction with a revision number: the control thread creates and
prepares new instances, compiles the program, and publishes it; the
audio thread adopts it at block start and reports the adopted revision
through the event ring, so Dart knows which revision is running and can
wait for its acknowledgement. Instances removed by a transaction are
retired, not freed: they keep rendering into a fade-out for a short,
configurable ramp (default 5 ms) or until their reported tail has
passed, then the control thread frees them. New connections fade in
over the same ramp. Events still queued for a retired or deleted
instance are dropped with a diagnostic; note-ons already delivered to it
are closed by the engine (all notes off) before it is freed.

## Why

- Adopting a program at block start prevents a half-applied graph, but
  without persistent instances every edit would reset phases and tails
  and click.
- Revisions with acknowledgements give the UI and the OSC remote a
  truthful picture of what is running.
