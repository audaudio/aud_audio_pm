# 22: S4 — Build the aud_audio engine for iOS and Android

## Goal

Build step S4 of the plan of ticket 17
([2026-10-07-17-audanika-audio-engine.md](2026-10-07-17-audanika-audio-engine.md)),
mobile first (release-001, release-002). The umbrella `aud_audio` gets
`AudEngine`, which joins the graph of tickets 19 and 20 (`aud_audio_graph`
0.3.0) to the audio IO of ticket 21 (`aud_audio_io` 0.2.0). It also gets a
node registry for DSP packages and one API on native and web behind
conditional imports. Its example app plays oscillator → filter → output on
iOS and Android. The family gets its first coordinated `0.x` release with
iOS and Android as platforms. The engine exposes the first numbers of S24
(render time, xruns and command-to-sound latency). S8, the S22 matrix, S24
and S29a wait for this step. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## Scope

1. **AudEngine**:
   - Opens an `AudIoSession` and an `AudIoStream` (output, `followFormat`
     false), then creates the `AudGraph` at the stream's sample rate and
     `maxFrames`.
   - Hands the render over as `Native.addressOf(aud_graph_render)` with
     `graph.pointer` as user, as the end-to-end test of ticket 21 does.
   - Provides `start`, `stop` and `dispose`. Exposes the graph (native
     only), the format, `AudIoCounters` and `AudGraphStats`.
2. **Lifecycle** (lifecycle-001):
   - Engine states: created, prepared, running, suspended, stopped,
     disposed. Each transition is acknowledged and reported on a
     `Stream<AudEngineState>`.
   - Format changes, route changes, interruptions, device loss and
     recovery all run one sequence: suspend the graph, prepare it for the
     new rate and block size, resume it, then
     `stream.acknowledge(generation)`. The engine relies on the format
     hold; it never uses `followFormat`.
   - The transport position, the graph and the node state survive.
     Shutdown reverses start-up: stream stop, graph stop, stream close,
     graph dispose, session dispose.
   - Audio focus and the app lifecycle come from `aud_audio_io` (its
     focus handling, `interrupt(appSuspended)`). The engine adds no
     platform code of its own.
3. **Node registry**:
   - DSP packages register through `aud_<package>_register(const
     AudHostApi*)`. The engine calls the registered functions with
     `graph.hostApi` at start.
   - A package built against another ABI major is refused (abi-001); the
     engine reports which package was refused. `engine.nodeTypes` lists
     the registered types.
   - Proof: a separately built test package
     (`test_packages/aud_test_nodes`, `package_ffi` with its own build
     hook). It provides one valid node type and one with a wrong ABI major.
   - `@RecordUse` link hooks (interop-001): see open question 5.
4. **Conditional imports** (web-001): `package:aud_audio/aud_audio.dart`
   is one API on native and web. The native part sits behind
   `if (dart.library.ffi)`. On the web the engine is a stub that throws
   `UnsupportedError` until S5. A test compiles a web entry point
   (`dart compile js`) and fails if `dart:ffi` reaches it.
5. **Example app**:
   - Replaces the spike example (sampler, tremolo, `legacy_sfz`, its
     assets) with oscillator → filter → output on the reference nodes of
     S2 (`aud.graph.oscillator`, `aud.graph.filter`, `graph.io`).
   - Controls: frequency, cutoff, start/stop, the current route, the
     engine state and a copyable report with the numbers of scope 6.
   - Integration tests on the iOS simulator and the Android emulator, then
     on real devices.
6. **Numbers** (start of S24):
   - Render time (graph stats), xruns and late callbacks (IO counters).
   - Command-to-sound latency: from the host time when the command is sent
     to the presentation time (`AudStreamTime.host_time_ns`) of the first
     block that carries it. The engine stamps a probe command and reads
     back the host time of the block that applied it (see step 6 for
     where that host time comes from).
   - Measured on the reference devices (an iPhone 15 or newer, a Pixel 8
     or newer), real devices only. The same run takes the numbers ticket
     21 left open for io-001 and io-002: round trip, xruns over 10
     minutes, callback jitter, timestamp error and recovery times.
   - `aud_audio_bench` itself stays in S24.
7. **Release**:
   - The umbrella pins exact versions of core, graph and io (family-001)
     as git refs with `tag_pattern` (repos-001).
   - Its pubspec lists iOS and Android as platforms (release-001).
   - `index.jsonc` and the README (EN/DE) describe the engine, not the
     spike.
8. **Tests & proof**:
   - Engine tests run on the host with `AudIoBackend.nullDevice` and its
     manual clock (`debugProcess`).
   - They cover: oscillator → filter rendered at 48 kHz and 44.1 kHz
     against a reference render of the graph; the format-change sequence
     through injected faults (`sampleRate`, `disconnect`, `route`,
     `channels`, `failStart`); interruption and recovery; shutdown from
     every state; the registry with the test package.
   - 100 % coverage; `gg can commit` green.

## Constraints

- Mobile first. Desktop has only the null device until S3b.
- No backward compatibility with the spike umbrella and its example, as
  tickets 19 and 21 decided. `legacy_sfz` goes too (scope-002).
- The umbrella becomes a Flutter package, since `aud_audio_io` needs the
  Flutter SDK (ticket 21). Core and graph keep gate (f) of S0-mobile.
- `aud_abi.h` stays as it is unless a change is proven necessary.
- All scripts are Node.js with the license header.
- CHANGELOG.md belongs to gg: commits fill Unreleased.
- Commit per repo with `gg one do commit -m`; the user runs
  `gg do publish`.

## Affected repos

- `aud_audio_pm`: this plan, the row in `doc/issues.md`, the status of S4
  in the plan of ticket 17, the open work of lifecycle-001, interop-001,
  release-001 (and io-001, io-002 when device numbers are taken), the blog
  post.
- `aud_audio`: the engine, the registry, the conditional imports, the test
  package, the example app, tests, index.jsonc, README EN/DE. Version
  0.2.0 (minor, breaking in major 0).
- `audaudiohub.io`: the page "The engine" (getting started) with snippets
  from its spec regions, a sidebar entry under "The engine", a sentence in
  the overview and the README mirror.
- `aud_audio_graph`, `aud_audio_io`: not added now. Added only for the
  platform tags (open question 4) or for a change the engine proves
  necessary, e.g. the host time of the block that applied a command
  (step 6) or an export of `aud_graph_render` that needs no
  `implementation_imports`.
- `aud_audio_core`: added only if the ABI needs a change (then 0.4.0).

## Steps

1. Register ticket 22 in `doc/issues.md` and confirm this plan.
2. Umbrella pubspec: Flutter package; core 0.3.0, graph 0.3.0 and io 0.2.0
   pinned exactly as git refs with `tag_pattern`; the platforms; remove or
   keep `aud_audio_web` (open question 3).
3. The neutral API (`AudEngine`, `AudEngineState`, `AudEngineConfig`,
   value types for format, stats and counters) with the native
   implementation behind a conditional import and the web stub.
4. The engine glue (open question 1): open, create, prepare, start, the
   recovery sequence on the stream's notifications, stop, dispose.
5. The registry and the test package with a valid and a refused node type.
6. The numbers: render time, xruns, and the command-to-sound probe. First
   check whether the graph reports the host time of the block that applies
   a command; if not, prove it and add it to the graph (minor 0.4.0).
7. Host tests at 100 % coverage, the web compile test, the native test
   package under ASan/UBSan.
8. The example app and its integration tests on the simulator and the
   emulator.
9. Run on the reference devices; record the numbers under Measurements.
10. The docs page "The engine", index.jsonc, README EN/DE, the open work of
    the decisions, the status of S4 in ticket 17.
11. `/code-review` at high effort on the render handover and the
    lifecycle paths, then review-light. Every finding goes into Findings.
    Then `gg do review`.

## Open questions (plan review)

1. **Engine glue: Dart on the control thread, or C++ in the umbrella?**
   - (a) Dart. The notifications of `aud_audio_io` already reach Dart on
     the control thread. During a format change the stream's format hold
     plays silence and the audio thread never sees the half-prepared
     graph. The graph's `suspend`/`prepare`/`resume` already exist in
     Dart; ticket 20 and 21 proved the sequence there.
   - (b) C++. Recovery would not wait for the Dart event loop, but the
     umbrella would need a build hook, a C API and sanitizer runs of its
     own, and would duplicate the graph's state handling.
   - Recommendation: (a). The recovery budget is 500 ms; ticket 21
     measured the stream's share at a few ms, the Dart hop adds well below
     that. The test package is then the umbrella's only native code.
2. **API shape for web-001: a neutral facade in the umbrella, or a split of
   the graph's Dart API into neutral and ffi parts?**
   - (a) Facade. `aud_audio.dart` exports `AudEngine` and neutral value
     types; the native implementation wraps the graph and the io. The
     graph's full API stays reachable on native through
     `package:aud_audio/aud_audio_native.dart` (`engine.graph`).
   - (b) Split. Every class of the graph and the io gets a neutral
     interface; a minor release of graph and io now, and the web reuses
     the same types in S5.
   - Recommendation: (a) now. S5 learns which parts the web really needs;
     the split, if any, follows there. The facade starts small: nodes,
     connections, parameters, transport, state, numbers.
3. **aud_audio_web: keep the pinned dependency, or drop it until S5?**
   - Its 0.0.3 pins graph `^0.1.0` and io `^0.1.0`, so with graph 0.3.0
     and io 0.2.0 pub cannot resolve it. Keeping it costs a release of
     `aud_audio_web` that carries nothing yet.
   - Recommendation: drop it until S5, which adds it again with its first
     real content.
4. **Platform tags: in all four pubspecs (patch releases of core, graph
   and io), or in the umbrella only?**
   - Core and graph are platform-neutral and run their tests on the
     desktop host; tagging them iOS and Android only would hide that.
     pub.dev reads the tags only with the publication in S22.
   - Recommendation: the umbrella only. Core, graph and io get theirs when
     S22 publishes them, or when their next change ships anyway.
5. **`@RecordUse` link hooks (interop-001): now or with S9?**
   - They let a build drop the code of node types an app never uses. S4
     has only the reference nodes of the graph and a test package; the
     first package where it pays is the sampler.
   - Recommendation: with S9. S4 keeps the registry's entry points shaped
     so that a link hook can find them (one `const` registration per
     package).

## Decisions of the plan review

Open.

## Implementation

Open.

## Measurements

Open.

## Findings

- **Model deviation**: process-002 puts S4 in the row "Remaining C++ and
  FFI work": Claude Fable 5.1 at high effort. This ticket runs on Claude
  Opus 5.5.
- **Compensation**:
  - `/code-review` at high effort on the render handover and the
    lifecycle paths.
  - Sanitizer runs (ASan/UBSan) for any native code the umbrella adds,
    including the test package.
  - The review-light skill before `gg do review`.
