# 20: S2b — Add the headless host, stress tests and watchdog

## Goal

Finish step S2 of the plan of ticket 17 on the graph engine of ticket 19:
the headless host of plugin-002 that loads, applies, saves and restores a
graph document without Dart and renders into host-supplied buffers with
stable parameter ids, latency, tail and events for the host; the stress
tests that prove the realtime contract of interop-002 and the route-change
sequence of lifecycle-001 under load; and a debug watchdog that catches
allocations on the audio thread. The plugin shells (S18 to S20) build on
the host, the sampler (S9) and the effects (S10a) on the stress-tested
engine. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md).

## Scope

1. **Headless host** in C++ (`AudHost` in `src/aud_audio_graph.h`): load a
   graph document (`aud_graph_document.schema.json`, node presets of
   `aud_node_preset.schema.json`) into a graph in one transaction; apply
   presets — parameters, strings and state blobs through `save_state` and
   `load_state` of the node vtable; resolve the assets a document references;
   save and restore the whole state (document, presets, asset references,
   node state blobs); stable parameter ids derived from node id and parameter
   id; latency and tail reporting; the events a graph emits into its event
   input handed to the host per block. Dart wrappers where useful, bindings
   by ffigen over the core's structs as in ticket 19.
2. **Stress tests**, native under the sanitizers (`scripts/test-native.js`):
   queue overflow of events and parameters, late events, graph swaps under
   load with a click detector, route changes while notes play, the scheduler
   full, the note tracker full.
3. **Debug watchdog** for the audio thread, on in the native tests and in
   builds that ask for it: allocations and host-api calls on the realtime
   thread are counted and reported as diagnostics; the native tests fail on
   any; release builds carry none of it.

Constraints: no backward compatibility with the spike or the Audanika app
(scope-002); stable handles, immutable programs, nothing allocates on the
audio thread; 100 % Dart coverage per mirrored test file; native tests
under ASan and UBSan; CHANGELOG.md belongs to gg. `aud_abi.h` stays
untouched unless the plan proves a change necessary (it does not, see
decision 1); model Fable 5.1 at max effort (process-002).

## Decisions of the plan review (2026-10-08)

Decisions 1 to 4 were confirmed by Gabriel Gatzsche as recommended, 5 to 9
stood without objection; LLVM was installed from Homebrew for decision 8.

1. **Events out of the graph without an ABI change.** `AudRenderRequest`
   of the core stays as it is. The graph header gets
   `AudHostRenderRequest` — the ABI request plus an event output buffer
   the engine fills with the events that reached node 0's event input in
   the block, in ascending offset — and `aud_graph_render_host`. A host
   that renders through it takes the events; without an event output they
   stay notifications for Dart as today. Overflow of the host's buffer
   counts as `AUD_ERROR_QUEUE_FULL` in the block's diagnostics. The core
   therefore leaves the ticket without a change.
2. **State blobs through a node park.** `save_state` and `load_state` are
   `[offline]` in the ABI: no realtime call of the instance may be in
   flight. New `aud_graph_node_save_state` and `aud_graph_node_load_state`
   obey it with the handshake the lifecycle already uses: the control
   thread marks the instance parked, waits until no render is in flight,
   calls the vtable and unparks; a block rendered meanwhile skips the node
   and clears its outputs (the node is silent for the microseconds of the
   call), events for it are dropped with a diagnostic. Not running, the
   call goes straight through. Alternative rejected: refusing the calls
   while running would force every plugin shell to suspend the whole
   graph for a host's state request.
3. **Assets as a table of the document.** The document gets an optional
   `assets` array (`id`, `path`); a string setting whose value is
   `asset:<id>` refers to one. The host resolves the path against its base
   directory, checks that the file exists before anything is applied
   (`AUD_ERROR_NOT_FOUND` with the id in the host's last error) and hands
   the absolute path to `set_string`; the node loads the file, as the ABI
   says. Saving writes the paths relative to the base directory where
   possible. The sample cache, cancellable loads and reference counting of
   lifecycle-001 stay open work for S9.
4. **Stable parameter ids.** `id = fnv1a32(node_id + "/" + param_id)`,
   a 32-bit id as VST3, CLAP and AUv3 take it - implemented with the top
   bit cleared, see Findings; the host refuses a document whose ids
   collide (`AUD_ERROR_DUPLICATE_TYPE`). Ids survive renames of
   nothing and reorderings of everything, which is what a plugin state
   needs. The host keeps the current value of every parameter, since the
   engine has no "get parameter" (finding of ticket 19).
5. **Tail of the graph.** The compiler reports, next to the output latency,
   the output tail: the largest node tail plus the path latency from that
   node to the graph output, `AUD_TAIL_INFINITE` when any contributing
   node reports an infinite tail; `aud_graph_output_tail` and
   `aud_host_tail` expose it.
6. **The watchdog on proven mechanisms only.** A thread-local guard is set
   around `renderBlock` - in `aud_graph_render`, see Findings - and
   cleared at its exit; the global `operator new` and
   `operator delete` (all forms) are replaced in a watchdog translation
   unit that counts a hit while the guard is set and then allocates
   anyway, and the host api's `alloc`, `free` and `log` count a hit when
   called under the guard. No lock detection is invented: the engine owns
   no mutex, and blocking calls are what RealtimeSanitizer is for (S22).
   The watchdog compiles in when `AUD_GRAPH_WATCHDOG` is defined: always
   in `scripts/test-native.js`, and in the build hook when the app sets
   the user define `watchdog: true` (the Dart SDK builds every hook in
   release mode, so there is no debug mode to key on). Hits are reported
   per block as a diagnostic with the graph's own code
   `AUD_GRAPH_ERROR_REALTIME_VIOLATION` (-100; codes below -99 belong to
   the graph, not the ABI) and counted in `AudGraphStats`.
7. **Note tracker full: the note-on is not delivered.** interop-002 says a
   delivered note-on is always closed; a note the tracker cannot hold could
   not be closed, so it is dropped and counted (`AUD_ERROR_CAPACITY`, the
   node in the diagnostic) instead of becoming a stuck note. The tracker's
   capacity of 256 notes per node stays a constant measured again in S24.
8. **RealtimeSanitizer when the toolchain has it.** `scripts/test-native.js`
   probes the compiler for `-fsanitize=realtime` and runs the tests a
   second time with it when it exists (`--rtsan` forces, `--no-rtsan`
   skips); `renderBlock` is marked `[[clang::nonblocking]]` behind a
   macro, which makes everything it calls checked at run time. Apple's
   clang 21 refuses the option on arm64; LLVM from Homebrew has it. The
   watchdog covers the allocation class on every toolchain.
9. **Docs: a page of its own.** "The headless host" joins "The engine" in
   the sidebar next to "The graph", with the document of the reference
   chain extended by presets and an asset as a tested snippet; the README
   mirrors it.

## Affected repos

- `aud_audio_pm`: this plan, the row of ticket 20 in `doc/issues.md`,
  S2b in the plan of ticket 17, the open work of plugin-002, interop-002
  and lifecycle-001, decisions 1 to 9 recorded as findings or decisions.
- `aud_audio_graph` 0.3 (a minor: new API, no removed one):
  - `src/aud_audio_graph.h`: `AudHostRenderRequest` and
    `aud_graph_render_host`; `aud_graph_node_save_state`,
    `aud_graph_node_load_state`; `aud_graph_output_tail`;
    `AudGraphStats.realtime_violations`; the headless host section —
    `AudHost`, `AudHostOptions` (base directory, output event capacity),
    `AudHostDocumentInfo`, `AudHostParam`, `AudHostAsset`;
    `aud_host_create` / `destroy` / `graph`, `aud_host_inspect` (buses,
    counts of a document without a graph), `aud_host_load`,
    `aud_host_save`, `aud_host_last_error`, `aud_host_node` and
    `aud_host_node_id`, `aud_host_apply_preset` and
    `aud_host_node_preset`, `aud_host_num_params`, `aud_host_param`,
    `aud_host_param_index`, `aud_host_param_id`, `aud_host_set_param`,
    `aud_host_get_param`, `aud_host_latency`, `aud_host_tail`,
    `aud_host_num_assets`, `aud_host_asset`, `aud_host_set_asset_path`,
    `aud_host_render`; `aud_graph_watchdog_enabled` and
    `aud_graph_watchdog_violations` with a reset.
  - `src/aud_json.hpp/.cpp`: a small JSON reader and writer (RFC 8259,
    UTF-8, escapes, numbers through `strtod`) and base64; the document
    schema is small and a vendored library would carry a notice for
    nothing.
  - `src/aud_graph_host.cpp`: the host — document validation up front
    (types registered, ids unique, buses equal to the graph's, parameters
    and string keys known, state versions acceptable, assets present, ids
    collision-free), then one transaction that retires the previous nodes
    and creates, presets and connects the new ones; the parameter table;
    the asset table; saving through the shadows and the node park.
  - `src/aud_graph_render.cpp`: the output event table of the block, the
    guard, the park check in the node job, the tracker-full policy.
  - `src/aud_graph_compiler.cpp`: the output tail.
  - `src/aud_graph_watchdog.cpp`: the operator replacements and the
    counters, compiled with `AUD_GRAPH_WATCHDOG`.
  - `hook/build.dart`: the new sources, the watchdog define from the
    user define.
  - `scripts/test-native.js`: the watchdog define; three builds - ASan
    with UBSan, RealtimeSanitizer with its probe, ThreadSanitizer.
  - `test/native`: the shared `aud_graph_fixture.hpp` with the test node
    types, `aud_json_test.cpp`, `aud_graph_engine_test.cpp`,
    `aud_graph_host_test.cpp`, `aud_graph_stress_test.cpp`; the harness
    checks the watchdog after every test and takes a filter; the test
    nodes reserve their vectors so that recording does not allocate under
    the guard.
  - Dart: `AudGraphDocument.assets` with `AudGraphAsset` and the schema;
    `AudGraph.outputTail`, `saveState`, `loadState`, `applyPreset` applying
    state blobs, `toDocument(includeState: true)`; `AudHost` (create,
    inspect, load, save, params by stable id, latency, tail, assets,
    dispose) over the C API with `AudHostParam`, `AudHostAsset` and
    `AudHostDocumentInfo`; `AudGraphStats.realtimeViolations`; the
    graph's own diagnostic code named in the notifications; the mirrored
    tests at full coverage; the bindings regenerated; the obsolete core
    override of the example removed.
  - `doc/schemas/aud_graph_document.schema.json`: `assets`; README and
    `index.jsonc`.
- `audaudio.github.io` (`audaudiohub.io`): the page "The headless host"
  with its spec, the sidebar entry, the README mirror, `index.jsonc`.
- `aud_audio_core`: not part of the ticket — decision 1 keeps the ABI at
  0.3.

## Steps

1. Done: ticket 20 with the three repos; this plan and the row in
   `doc/issues.md`; the plan review.
2. Done: JSON reader and writer with base64 and their native tests.
3. Done: engine additions: the output event table and `aud_graph_render_host`,
   the node park with the state calls, the output tail, the tracker-full
   policy; native tests for each.
4. Done: the watchdog: guard, operator replacements, host-api hits, the
   diagnostic and the counters; the harness check; the test with an
   allocating node; the recorder node reserved.
5. Done: the headless host: validation, load, presets and assets, the parameter
   table and ids, save and restore, latency and tail, inspect; native
   tests over the reference chain with a stateful test node and an asset
   file.
6. Done: the stress tests: overflow, late events, swaps with the click detector,
   route changes, scheduler full, tracker full, a long run; fixes they
   find go into the engine with a finding here.
7. Done: `scripts/test-native.js`: the watchdog define, the rtsan probe and the
   second run; the build hook's user define.
8. Done: Dart: the document's assets, the graph's new calls, `AudHost`, the
   stats and the diagnostic name; bindings regenerated; tests at full
   coverage; `dart analyze`, format, the DNA test.
9. Done: the docs page with its tested snippet, the README mirror, the graph's
   README and `index.jsonc`.
10. Done: findings recorded; plugin-002, interop-002 and lifecycle-001
    updated; S2 of the plan of ticket 17 marked done; `/code-review` at
    high effort on the realtime code and review-light before `gg do
    review`, their findings fixed or recorded below.
11. `gg do review` after the user confirms it; then `/gg-publish`.

## Findings

### Process and toolchain

- Model: the plan and steps 2 to 5 ran on Fable 5.1 at max effort; during
  step 5 on 2026-10-08 the session was switched to Opus 5.5, which ran the
  rest at max effort - a deviation from process-002, which asks Fable 5.1
  at max effort for S2. Compensated as the brief asked: the watchdog uses
  proven mechanisms only (a thread-local guard and the replaced allocation
  functions, no invented lock detection); every native test runs under
  ASan and UBSan, under RealtimeSanitizer with a probe and under
  ThreadSanitizer; the ABI stays at 0.3; `/code-review` at high effort on
  the realtime code and review-light ran before `gg do review`, their
  findings are below.
- Apple's clang 21 (`arm64-apple-darwin`) refuses `-fsanitize=realtime`;
  LLVM 23.1.3 from Homebrew has it and was installed for decision 8.
  `scripts/test-native.js` finds it and runs a probe that must be caught -
  an allocation on the audio thread - since a silent rtsan run would
  prove nothing otherwise.
- Beyond the plan, `scripts/test-native.js` builds a third time with
  ThreadSanitizer for the tests that render on a thread of their own. It
  found the two races below at once.
- The Dart SDK builds every native hook in release mode and the hook input
  carries no build mode, so "on in debug builds" becomes "on when the app
  asks for it" through a user define; Flutter's debug mode cannot be told
  apart inside the hook today.

### Deviations from the decisions

- Decision 4: the ids have the top bit cleared, 31 bits. VST3 hosts treat
  the top bit specially - JUCE clears it for its hashed ids - and
  0xFFFFFFFF is the invalid id of VST3 and CLAP. FNV-1a over similar names
  collides later than a random hash: over `n0`, `n1`, ... the first
  collision comes near 750,000 names; the native test pins such a pair.
- Decision 6: rtsan showed that the first access of a thread-local on a
  new thread allocates its storage - through dyld on Darwin, the dynamic
  TLS of a dlopen'ed library on Linux, emutls on older Android. The guard
  is therefore raised in `aud_graph_render`, outside the nonblocking
  `renderBlock`: once per thread, in watchdog builds only, before the
  guard is up. Release builds have no thread-local.
- Decision 8: only `renderBlock` carries `[[clang::nonblocking]]`; rtsan
  checks everything it calls at run time, the reference nodes need no mark
  of their own.

### Bugs of ticket 19 the stress tests found

- ThreadSanitizer: the tap ring and its write position were plain memory
  the control thread read while the audio thread wrote them; they are
  relaxed atomics now, the seqlock stays.
- ThreadSanitizer: the block start read the node count of the pending
  program, which the control thread frees when it publishes a newer one -
  a use after free. The node ranges are reset after the adoption, from the
  adopted program only.
- The route-change test: the transport lost its position. A prepare
  recomputed the beat of the current position with the new sample rate,
  and a stop set the transport to stopped without moving its anchor, so it
  jumped back to where the last request had put it. Both re-anchor now; a
  prepare keeps the pending transport requests (lifecycle-001: pending
  events survive a recovery).
- The ordering rule of interop-002 - a note off precedes a note on of the
  same pitch at the same time - swapped a note on and its own note off
  when both came in one block, from a fast tap or a short drum pad, and
  the note hung. A note off ranks first now only when its pitch sounds,
  so that a sounding note still retriggers; otherwise both keep the order
  they came in. The park test found it, a test of its own keeps it.
- A stop and a prepare reset the nodes and forgot their tracked notes; the
  note offs the docs promised never came. The tracked notes now get note
  offs at the start of the first block after the restart; the reset stays.
- The control thread checked the scheduler's capacity against the count
  of the last block, so a burst within one block could overrun it and lose
  events on the audio thread. An event with a time now reserves its place
  at the enqueue and gives it back when it leaves the queue or the
  scheduler: a full scheduler refuses at the enqueue, as interop-002 asks
  of every queue. Scheduled events now follow the budget per block too:
  what does not fit waits and plays a block late with a diagnostic instead
  of being dropped; the event table of a block holds two budgets and the
  note offs of one full tracker.

### The review before `gg do review`

`/code-review` at high effort on the realtime code found ten points; the
first three were real bugs of this ticket's own park:

- Fixed: the park covered only `process`; `set_param` of an immediate
  parameter change and the transport's `reset` still ran on the audio
  thread during a state call. Every realtime call of a parked node is
  gated now: its parameter changes travel as events, a reset waits for its
  next block. A test node detects any overlap; the test now changes
  parameters and seeks while the state calls run.
- Fixed: a parked node dropped its events, note offs included, and a note
  hung. Its events now wait for the next block, and one `AUD_ERROR_STATE`
  diagnostic reports a park instead of one per parked block.
- Fixed (documented): in an app the watchdog's operators serve the graph's
  own library only; a DSP package's allocations stay unseen, its calls of
  the host api do not. RealtimeSanitizer sees every library (S22).
- Fixed: a full note tracker reported one notification per refused note
  on; it reports once per block now, with the node, and the dead counter
  is used again.
- Fixed: the scheduled events' budget ignored the fan-out of the graph's
  event output; an event waits now unless the block has room for all its
  routes.
- Fixed (documented): a preset refused midway by the node or a full queue
  keeps its earlier parts; the header and `AudHost` say so.
- Fixed: a package's descriptor without parameter or string-key ids, or
  without the arrays its counts name, is refused at registration instead
  of crashing the host.
- Fixed: a loop whose end does not lie after its start is refused by the
  host and by `AudGraphDocument`; the engine would have dropped it.
- Skipped: the insertion sort of the host's event output is quadratic in
  theory; every source adds its events in order, so the cost grows with
  the events times the interleaving sources, and nothing that sorts in
  place without allocating is faster for the few dozen events of a block.

review-light then went through the changed files of the three repos:

- Fixed: the German README of the graph lacked the host and the tests;
  the site's German README is still the stub of the bootstrap, as after
  ticket 19 - the docs ticket S21 decides about German pages.
- Fixed: the README of the graph shows the new public API with a Dart
  example - `AudHost`, `AudGraph.saveState`, `loadState`, `addAsset`,
  `assetPath`, `outputTail` and the watchdog getters.
- Kept: the test guide asks for no helper module, but the native tests
  now share `test/native/aud_graph_fixture.hpp` - the test node types and
  the fixture - across four files of one test binary, like the harness
  `aud_test.hpp` of ticket 19; copying them into every file would be worse.
- Kept: `AudHost.params` and `AudHost.assets` repeat one pattern over two
  FFI struct types; the host's checks of ids and type ids repeat the
  patterns of the Dart document in C++ - two languages, no shared code.
- Kept: the host's long functions (`readNode`, `aud_host_inspect`) read
  as straight validation; the click thresholds of the stress test got
  names.
- Fixed: `AudHost.param(id)` built the whole parameter list per call; it
  looks the id up through `aud_host_param_index` now.
- Documented: asset paths are not confined to the base directory - a
  sample library lives elsewhere -, so a document names any file the
  process may read; a host that loads untrusted documents checks
  `aud_host_asset` first. No secrets, no new dependencies;
  `scripts/test-native.js` starts the compilers without a shell.

### Behaviour worth knowing

- Presets apply in the order strings, state, parameters - in the host and
  in `AudGraph.applyPreset`, which applied parameters before strings and
  no state in ticket 19. The host keeps every parameter value, so a state
  blob should not hold parameter values; `aud.core.gain` does (its state
  is its gain), which the order makes harmless.
- `aud_host_load` sends the transport settings after the commit;
  `AUD_ERROR_QUEUE_FULL` then means the document is loaded but the event
  queue refused them.
- `aud_host_set_param` refuses values outside the parameter's range, since
  a document saved with them could not be loaded again.
- A block longer than the largest block of the adopted program renders
  silence: a safety net for a prepare whose program the audio thread could
  not adopt yet.
- The node lists of `AudGraph` do not show the nodes an `AudHost` creates
  in the same graph; a graph is driven by one of the two.
- The example app's override of the core pointed at a sibling checkout
  that only existed in ticket 19; with core 0.3.0 tagged it is removed.

### Left for later tickets

- Notes that leave the graph through the host's event output are not
  tracked by the engine: a plugin shell closes them on a stop (S18 to
  S20).
- Notes a retired node had emitted to other nodes stay open in their
  trackers until those nodes stop or retire (S8, the sequencer).
- When many nodes close many notes in one block, the note offs beyond the
  block's table are dropped with a diagnostic; the nodes were reset, so
  nothing sounds on.
- The sample cache, cancellable loads and reference-counted assets of
  lifecycle-001 come with the sampler (S9).

## Open questions

None. Deviations found while implementing are recorded under Findings.

## Rests on

plugin-002, graph-001, graph-003, interop-002, lifecycle-001, scope-002,
abi-001, time-001, process-002; the plan of ticket 17 (S2, S22) and the
plan and findings of ticket 19.
