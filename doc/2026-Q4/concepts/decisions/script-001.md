# script-001: JavaScript runs in an optional node, on a worker of its own, once per audio buffer

- Status: accepted
- Date: 2026-10-18
- Canonical source: tickets/2026-10-14-31-port-soundprism-js-lfo-presets.md
  (Concept, answers 1, 2, 4, 5, 14 and 18 of the plan review, points 3 to 6
  of the plan check)
- Refines: [interop-001](interop-001.md) — the engine owns every worker
  thread; [process-005](process-005.md) — no lock on the audio thread
- Open work: the budget of a tick (open question 1 of ticket 31) and the
  default of ramp or step (answer 18) are decided after the measurements;
  Linux and Windows are written but not built yet

## Decision

JavaScript runs only in the optional package `aud_audio_script`, in the node
`aud.script.modulator`. Neither the engine nor the umbrella `aud_audio`
depends on the package; an app that runs scripts adds it. The node embeds
QuickJS-ng (MIT) in its C++ backend behind a thin engine interface;
JavaScriptCore through its public C API is a second engine on Apple
platforms, for comparisons and as a fallback (no memory limit and no time
budget there). Dart only configures the node: it hands it the script as a
string setting, once per load; no FFI call runs per tick.

The node owns a worker thread, created on the control thread — an exception
to interop-001, recorded here. At the end of each block the audio thread
hands the worker the next block's transport position and the block's input
events through a lock-free ring and wakes it with a semaphore signal that
does not block (`dispatch_semaphore_signal`, `sem_post`, `ReleaseSemaphore`)
— the one system call process-005 allows on the audio thread for this node.
The worker runs one tick per block for a point of a beat grid inside the
next block, as SoundPrism did, and returns the values through a second
ring; the audio thread sends the changed ones as controls on the node's
event outputs in the next block: as a ramp over the block (one event at its
last frame) or as a step at the grid point (the old value one frame before
it), set per output. JavaScript never runs on the audio thread. A worker
that is late leaves the values where they are, and the late tick is
counted; the worker always computes the newest request. Offline, the node
waits for its worker, so renders are deterministic. A load builds a new
runtime and context on the worker and swaps it in at a tick; a failed load
keeps the old one. A memory limit and a time budget per tick stop a runaway
script. On Android the worker runs on the fast cores with a raised
priority, on Apple platforms with the user-interactive class.

## Why

- SoundPrism's scripts are code — products, `if`, state shared between
  channels — that sfizz's LFOs and a declarative program reproduce only in
  part; an interpreter runs them unchanged.
- QuickJS-ng is small (about 1 MB per architecture), permissive and the
  same on every platform; JavaScriptCore is not available on Android, and a
  bundled V8 costs several megabytes.
- A thread of the node's own keeps a slow script away from the engine's
  shared workers and from the sampler's disk reads (lifecycle-002), and the
  ring keeps the audio thread free of locks and of JavaScript.
