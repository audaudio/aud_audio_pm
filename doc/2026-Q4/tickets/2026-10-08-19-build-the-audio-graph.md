# 19: S2 — Build the audio graph

## Goal

Replace the spike engine of `aud_audio_graph` (a serial chain on core
0.1.0) by the graph engine of step S2 of the plan of ticket 17 (milestone
M1, size XL), built on the contracts of `aud_audio_core`: typed ports and
persistent node instances with immutable render programs (graph-001),
graph transactions with revisions, fades and retirement (graph-003), the
real-time queues with their capacities and overflow rules and the
notification thread (interop-002), the engine lifecycle (lifecycle-001),
serial rendering with variable blocks and sample-accurate events
(graph-002) into host-supplied buffers through the render interface of
plugin-002, the internal transport, an offline renderer, the graph
document as JSON, the Dart graph API and the reference nodes. S3 (io),
S9 (sampler), S10a (effects) then build on a real graph instead of the
spike chain. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md).

The headless host, the stress tests and the debug watchdog are split off
into ticket 20 (S2b, see below).

## Decisions of the plan review (2026-10-08)

1. No backward compatibility: the spike API (`aud_engine_*`, `AudEngine`,
   `aud.ref.sine`, `aud.ref.gain`) is removed, not wrapped. The io, effects
   and sampler spikes stay pinned to their spike tags until S3, S9 and
   S10a move them.
2. `aud_audio_core` moves to ABI 0.3 and takes every change S2 needs,
   breaking ones included.
3. S2 is split: the headless host (plugin-002), the stress tests and the
   debug watchdog become ticket 20.
4. Fades: 5 ms for retired instances, removed and new connections; a
   retired instance with a tail renders its tail for at most 10 s, then it
   is freed anyway.
5. Queue defaults (decided by Claude, measured again in S24):
   - parameter queue 1024 entries, event queue 4096 entries; a full queue
     rejects the enqueue with `AUD_ERROR_QUEUE_FULL`
   - at most 1024 entries per queue and block are applied; the rest
     carries over in order
   - scheduler 4096 pending events, lookahead 10 s; a later event is
     refused at enqueue
   - late events play at the start of the block with a diagnostic; the
     drop policy is a per-graph option
   - immediate parameter changes coalesce per block: the latest value per
     parameter wins
   - diagnostics and taps use lossy rings that overwrite the oldest entry
6. The graph document and its JSON schema live in `aud_audio_graph`
   (recommended by Claude): every consumer — `aud_audio`, the editor,
   the web host and the plugin shells — depends on the graph already, and
   the document changes with the graph engine, not with the core
   contracts. It refers to the node preset schema of the core for the
   state of each node.

## Affected repos

- `aud_audio_pm`: this plan, the rows of tickets 19 and 20 in
  `doc/issues.md`, S2 and S2b in the plan of ticket 17, the open work of
  graph-001, graph-003, interop-002 and lifecycle-001 updated.
- `aud_audio_core` 0.3: ABI minor 3; result codes for cycles, bus format
  errors, render overloads and events beyond the lookahead, with their
  Dart names; every further gap S2 finds.
- `aud_audio_graph` 0.2, C++17 in `src/` behind the C API
  `aud_audio_graph.h` (`AudGraph`, `aud_graph_*`):
  - Model: persistent node instances with generation-checked handles,
    created on the control thread with their bus channel counts; audio
    and event connections between typed ports; the graph's own input and
    output buses and its event input as the pseudo node 0; channel
    mapping between buses of different width.
  - Compiler: topological order, cycle rejection, the feedback node
    (`aud.graph.feedback`, a delay in samples of at least the prepared
    maximum block, split into a reader and a writer job), output buffers
    reused by lifetime, fan-in summed in a fixed order, path latency from
    `get_latency`, alignment delays for the scheduled policy and the
    low-latency opt-out per connection, the fixed-block wrapper for nodes
    without `AUD_NODE_CAP_VARIABLE_BLOCK`.
  - Transactions: grouped edits applied atomically with a revision; only
    topology compiles; the audio thread adopts at block start and
    acknowledges; retired instances and removed connections fade out,
    instances with a tail render it out (at most 10 s), new connections
    fade in; running notes of a retired instance are closed; the control
    thread frees what no adopted program references.
  - Queues and scheduler (interop-002): parameter and event queues, the
    per-block budget, the late-event policy, the ordering rules, the
    time-ordered scheduler with cancellation by id or node, scheduled
    events pre-delivered by their path latency, the running-note tracker,
    lossy rings for diagnostics and taps, the notification thread that
    wakes Dart through `NativeCallable.listener`.
  - Lifecycle (lifecycle-001): created, prepared, running, suspended,
    stopped, disposed; reprepare on a new rate or block size with the
    time filter and the transport reset and the running notes closed;
    every transition acknowledged.
  - Time and transport (time-001): the sample-to-host-time filter fed by
    the stream time of each render request, synthesized host time without
    one, the internal clock as transport provider (start, stop, seek,
    tempo, time signature, loop) with segments per block, registered
    providers, the snapshot of a plugin host taking precedence.
  - Render: `aud_graph_render` as `AudRenderFunction` with host buffers;
    serial jobs; ramps and sub-block events through the core node base;
    counters and diagnostics.
  - Offline renderer: a virtual timeline, fixed or varying block
    sequences, input signals; renders to buffers and WAV files for the
    golden tests.
  - Reference nodes: test oscillator (`aud.graph.oscillator`, playable
    by notes), the core's `aud.core.gain`, mixer (`aud.graph.mixer`),
    state-variable filter (`aud.graph.filter`), the feedback node and the
    tap (`aud.graph.tap`, recent frames and meters off the audio thread).
  - Dart: `AudGraph` with its lifecycle, node types, transactions with
    awaitable revisions, typed commands (`AudCommand` of the core), the
    OSC router registration, the notification streams (states,
    revisions, node lifecycle, diagnostics), taps, the stats; the graph
    document with JSON and its schema; the offline renderer.
  - Tests: Dart tests at full coverage, golden-file renders over fixed
    and varying block sequences, native C++ tests with the sanitizers run
    by a Node.js script.
- `audaudio.github.io` (`audaudiohub.io` in the workspace): a graph
  section — instances and programs, transactions, queues and the
  lifecycle, the graph document, an example rendered offline; the README
  mirrors it.

## Steps

1. Done: ticket 19 with the four repos; this plan and the row in
   `doc/issues.md`.
2. Done: core 0.3 — the ABI minor, the result codes cycle, format,
   lookahead, capacity, retired and overload with their Dart names.
3. Done: the graph model, the transactions and the compiler
   (`aud_graph_compiler.cpp`): topological order with the smallest handle
   first, feedback nodes split into a reader and a writer, latency
   alignment with the low-latency opt-out, buffers reused by lifetime,
   event routes, the adoption lists.
4. Done: the parameter and event queues, the scheduler with one heap per
   time domain ordered by time minus lead, the running-note tracker, the
   emitted-event arena, the tap rings and meters, the notification queue
   with the wake-up thread (`aud_semaphore.hpp`).
5. Done: the realtime path (`aud_graph_render.cpp`): adoption with fades
   and retirement, the time filter feed with synthesized host time, the
   internal transport with segments per block, pending requests and the
   loop, the resets on stop and seek, the fixed-block wrapper, the
   lifecycle with the in-flight handshake (`aud_graph.cpp`).
6. Done: the reference nodes oscillator, mixer and filter on
   `AudNodeBase`, the built-in feedback and tap nodes, the offline
   renderer; the golden render `test/goldens/oscillator_filter.wav`.
7. Done: the Dart API (`AudGraph`, `AudNode`, `AudGraphTransaction`,
   `AudGraphNotification`, `AudGraphOptions`, `AudGraphStats`,
   `AudTransportState`, `AudOfflineRenderer`, `AudWavFile`), the graph
   document with its JSON schema (`doc/schemas`), the bindings over the
   core's structs, 68 Dart tests at full coverage, 27 native tests under
   the sanitizers (`scripts/test-native.js`).
8. Done: the page "The graph" on the site with the reference chain as a
   tested document; READMEs and `index.jsonc` of the graph and the site.
9. Decisions updated; S2 marked done in the plan of ticket 17;
   review-light; pull requests green.

## Findings

- The compile of the review happened on Opus 5.5, the implementation on
  Fable 5.1 at max effort, as process-002 asks for S2.
- Connections are shared edge objects between programs, so a fade and
  an alignment delay survive a recompile. A connection whose alignment
  delay changes gets a fresh object and fades in again - rare, and a
  short dip instead of a copy on the audio thread.
- A program that was published but never adopted leaves nothing behind:
  the first program the realtime thread adopts starts every connection
  at full gain; a connection removed before it was ever heard stays
  silent instead of fading in and out.
- Cancellations are applied in order with the events of their block,
  after the transport of the block is captured; applying them when they
  are popped missed the events scheduled in the same block.
- The scheduler orders events by their time minus the lead of their
  node. Two events of nodes with different leads can still be delivered
  a lead apart from their ideal order when the earlier one is pending;
  the lead is a few milliseconds, the case needs latency-reporting nodes
  on both paths.
- The engine has no "get parameter": `AudGraph.toDocument` writes the
  values set from Dart. State save and restore are ticket 20.
- Node 0 is the graph: its input buses are the outputs of node 0, its
  output buses the inputs, an event sent to node 0 leaves through the
  graph's event output to the nodes connected to it, an event emitted
  into node 0 reaches Dart as a notification. The built-in nodes feedback
  and tap have no vtable.
- A node without `AUD_NODE_CAP_VARIABLE_BLOCK` is re-blocked to the
  largest block and reports that as latency; events inside the
  re-blocked range keep their offsets.
- The notification stream of `AudGraph` delivers synchronously from
  `pump()`, so a test that renders offline reads the notifications
  without an event loop; the listener thread calls `pump()` for streams.
- The example app of the graph needs `example/pubspec_overrides.yaml` for
  the core until the core tag of the ticket exists; the override is
  committed like the one of the package.
- The graph's tests depend on `aud_midi_standard` directly to build note
  events, like the core's tests.
- The leak check of the sanitizers runs on Linux only; macOS refuses the
  option.

## Ticket 20 (S2b, split off)

The headless host of plugin-002 on top of this engine: the C++ loader of
the graph document, presets applied by the engine, state save and restore
(document, presets, asset references, node state blobs), stable parameter
ids from node id and parameter name, latency and tail reporting to plugin
hosts, events out of the graph for the host; the stress tests (queue
overflow, late events, graph swaps under load, route changes); the debug
watchdog for locks and allocations on the audio thread. The plugin shells
(S18 to S20) depend on ticket 20.

## Open questions

None. Deviations found while implementing are recorded under Findings.

## Rests on

graph-001, graph-002, graph-003, interop-002, lifecycle-001, plugin-002
(render interface only), sched-001 (serial baseline), abi-001, time-001,
osc-001, process-002; the plan of ticket 17 (S2) and the findings of
ticket 18.
