# lifecycle-001: Engine lifecycle and resource policies

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/review-2026-10-08-engine-contracts.md
  (point 10)
- Open work: default budgets, the sample cache, cancellable and
  reference-counted asset loads (with the sampler, S9); the recovery
  numbers on the reference devices; the drift-tracking resampler for
  duplex streams on two clocks. The states, the handshake with the audio
  thread and the reprepare sequence are implemented in ticket 19; ticket
  20 proved the route change under load - the transport keeps its
  position across a new sample rate and a stop, tracked notes get note
  offs with the first block after the restart, pending events survive -
  and added asset references to graph documents; ticket 21 built the
  behaviour per platform - interruptions, the audio focus, disconnects,
  route and rate changes, the reset of the media services - with a stream
  that recovers on its own and holds the renderer until the client
  acknowledges a new format

## Decision

The engine has explicit states — created, prepared, running, suspended,
stopped, disposed — and every transition is acknowledged through the event
ring. Phone calls and audio-focus changes, backgrounding, Bluetooth and route
changes, permission denial, stream disconnects (an AAudio stream disconnects
when a headset changes and must be reopened), stream loss and new sample rates
all follow one sequence: stop the callbacks safely, reprepare all node
instances for the new rate and block size, reset the timing filter and the
transport snapshot, restart, acknowledge. What survives a recovery: the
transport position, the graph and the node state, and pending events whose
time has not passed; active notes are closed with note-offs, and the clock
mapping is reset and converges again. Duplex streams on different clocks are
reclocked: the input is resampled to the output clock by a drift-tracking
resampler and the drift is reported as a diagnostic. Shutdown reverses
start-up: stop IO, drain the queues, close running notes, dispose instances,
free memory. Resources have budgets and policies: a sample cache budget in
bytes per engine with least-recently-used eviction; streaming nodes output
silence and raise a diagnostic on underflow, never block; instrument nodes
bound their polyphony and steal voices; asset loads have ids and can be
cancelled; loaded assets are reference-counted and shared between nodes and
engine instances in one process.

## Why

- Devices change routes, phones interrupt audio and hosts change block
  sizes; without a defined sequence each case is a bug of its own.
- Budgets keep the engine alive on the long tail of devices.
