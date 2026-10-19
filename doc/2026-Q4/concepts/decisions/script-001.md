# script-001: JavaScript runs in an optional node, on a worker of its own, once per audio buffer

- Status: accepted
- Date: 2026-10-18
- Canonical source: tickets/2026-10-14-31-port-soundprism-js-lfo-presets.md
  (Concept, answers 1, 2, 4, 5, 14 and 18 of the plan review, points 3 to 6
  of the plan check, Findings, Measurements, Open questions)
- Refines: [interop-001](interop-001.md) — the engine owns every worker
  thread; [process-005](process-005.md) — no lock on the audio thread
- Open work: Linux and Windows are written but not built; the late
  callbacks of the Galaxy Tab S4 (about 11 per second under dense playing)
  stay io-002's

## Decision

JavaScript runs only in the optional package `aud_audio_script`, in the node
`aud.script.modulator`. Neither the engine nor the umbrella `aud_audio`
depends on the package; an app that runs scripts adds it. The node embeds
QuickJS-ng (MIT) in its C++ backend, the one engine on every platform, behind
a thin internal engine interface. JavaScriptCore was measured beside it and
dropped (the user, 2026-10-19): in an iOS app it runs, apparently without its
JIT, and took 32–42 µs per tick of the real combis on the iPad Pro (M5) where
QuickJS-ng took 21–30 µs, it has no memory limit and no interruptible time
budget in its public API, and Android has none. Dart only configures the node:
it hands it the script as a string setting, once per load; no FFI call runs
per tick.

The node owns a worker thread, created on the control thread — an exception to
interop-001, recorded here. At the end of each block the audio thread hands
the worker a request and the block's input events through a lock-free ring and
wakes it with a semaphore signal that does not block
(`dispatch_semaphore_signal`, `sem_post`, `ReleaseSemaphore`) — the one system
call process-005 allows on the audio thread for this node. The worker runs one
tick per block for a point of a beat grid inside the block, as SoundPrism did,
and returns the values through a second ring; the audio thread sends the
changed ones as controls on the node's event outputs in that block: as a ramp
over the block (one event at its last frame) or as a step at the grid point
(the old value one frame before it), set per output, the ramp by default
(answer 18 of ticket 31: it costs nothing measurable). The worker computes
ahead: the request at the end of block n is for block n + `lookahead` (default
3, with the transport position predicted), so callbacks that come back to back
still find their values. It runs the requests in order, each once, and skips
to the newest only when it falls behind. JavaScript never runs on the audio
thread. A block whose values are late leaves the controls where they are, and
the late tick is counted. Offline, the node waits for its worker, so renders
are deterministic. A load builds a new runtime and context on the worker and
swaps it in at a tick; a failed load keeps the old one. A memory limit and a
time budget per tick stop a runaway script. On Android the worker runs on any
core with a raised priority (`worker_cores` 0; 1 binds it to the fast cores),
on Apple platforms with the user-interactive class: bound to the fast cores of
a Galaxy Tab S4, it waited behind the real-time audio thread on the core that
woke it, since Qualcomm's core control keeps idle big cores isolated.

The budget of a tick (the user, 2026-10-19): its p99 stays at most 10 % of the
device's buffer, and the densest combi of SoundPrism Link Edition plays 10
minutes on the Galaxy Tab S4 without a late tick. QuickJS-ng meets it (748 µs
of 8 ms, 0 of 159,401 ticks late).

## Why

- SoundPrism's scripts are code — products, `if`, state shared between
  channels — that sfizz's LFOs and a declarative program reproduce only in
  part; an interpreter runs them unchanged.
- QuickJS-ng is small (about 1 MB per architecture), permissive and the
  same on every platform; it was faster than JavaScriptCore on the iPad
  inside the app; JavaScriptCore is not available on Android, and a
  bundled V8 costs several megabytes.
- A thread of the node's own keeps a slow script away from the engine's
  shared workers and from the sampler's disk reads (lifecycle-002), and the
  ring keeps the audio thread free of locks and of JavaScript.
