# interop-003: Native producers feed the graph through event sources

- Status: accepted
- Date: 2026-10-12
- Canonical source: tickets/2026-10-12-26-bridge-aud-midi-ports-into-the-engine-on-ios-and-android.md
  (scope 1, question 1)
- Refines: [interop-002](interop-002.md) — a queue per producer for
  threads other than the Dart proxy
- Open work: a note set per source for targets with several sources; the
  notes of generator nodes that retire (S14); the network server of S7 and
  Link (link-001) as further producers

## Decision

A thread other than the control thread that delivers events — CoreMIDI's
receive thread, Android's MIDI receiver, a Dart isolate, later the OSC
server — gets an event source of `aud_audio_graph`: a lock-free
single-producer queue of UMP events with host timestamps, created on the
control thread for one committed target (node, inlet) and a timing policy
(midi-003). One producer feeds a source at a time; a producer attaches
before its first push and detaches after its last, and the next one
attaches only after that. The audio thread drains the sources after the
scheduled events and before the host's events, within the per-block budget
of interop-002: it peeks and pops, so an event whose target lies beyond the
block waits in its queue and never takes a place of the scheduler, and an
event that does not fit into the block waits too, so no note off is lost.
Any thread may raise `release`, an atomic flag: before the next drain the
queue empties — note offs and controllers at once, note ons dropped — and
the target's notes close, followed by sustain and soft pedal off on every
channel that used them. A note off that does not fit into the queue raises
`release`, so an overflow never leaves a note on. A source retires like a
node (graph-003): the audio thread acknowledges before its memory goes, and
the graph keeps its target until then. A retiring node keeps its event
routes to living nodes until it is done, so the note offs it forwards while
it closes its notes arrive.

## Why

- interop-002 allows one producer per queue; the enqueue of the Dart proxy
  is not thread-safe, and a lock would put a native MIDI thread behind the
  control thread.
- The graph already resolves timestamps, orders, budgets and tracks notes;
  a private ring in a node would repeat all of it and bypass the engine's
  queues.
- Dropping a note off is a stuck note; dropping a note on is a missing one.

## Consequences

- The MIDI bridge of `aud_audio_midi` pushes from CoreMIDI's and Android's
  receive threads without Dart (midi-002).
- Statistics per source — delivered, late, lateness, delivery delay,
  drops — are readable from the control thread.
- The engine's timing (the fitted output time of the last block, the
  reported output latency, the longest time between two renders) is
  readable from the control thread too, for the latency of midi-003.
