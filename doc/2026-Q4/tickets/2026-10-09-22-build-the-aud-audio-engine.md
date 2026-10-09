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
   - Provides `start`, `stop` and `dispose`. Exposes the graph (the neutral
     API), the format, `AudIoCounters` and `AudGraphStats`.
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
4. **Conditional imports** (web-001, decision 2): the Dart APIs of core,
   graph and io split into a platform-neutral part and an ffi part.
   - `package:aud_audio_core/aud_audio_core.dart`,
     `package:aud_audio_graph/aud_audio_graph.dart` and
     `package:aud_audio_io/aud_audio_io.dart` export only neutral
     interfaces and value types; they import no `dart:ffi`, `dart:io`
     or `package:ffi`.
   - The ffi parts (`aud_audio_core_ffi.dart`, `aud_audio_graph_ffi.dart`,
     `aud_audio_io_ffi.dart`) hold the bindings, the pointer-backed
     implementations and the render entry (`aud_graph_render`, so that no
     client needs `implementation_imports`).
   - Factories (`AudGraph(...)`, `AudIoSession(...)`) pick the
     implementation through `if (dart.library.ffi)`; on the web they throw
     `UnsupportedError` until S5.
   - `package:aud_audio/aud_audio.dart` is one API on native and web; the
     engine's native glue sits behind the same conditional import.
   - Each of the four packages has a test that compiles a web entry point
     (`dart compile js`) of its neutral barrel and fails if `dart:ffi`
     reaches it.
   - `aud_abi.h` and the ABI version stay as they are.
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
   - The umbrella pins exact versions of core, graph, io and web
     (family-001) as git refs with `tag_pattern` (repos-001).
   - Releases: core 0.4.0, graph 0.4.0, io 0.3.0 (minor, the split is
     breaking in major 0), web 0.0.4 (patch, new pins), umbrella 0.2.0.
   - Only the umbrella's pubspec lists iOS and Android as platforms
     (release-001, decision 4).
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
- `aud_audio_core`: the Dart API split into neutral and ffi parts;
  `aud_abi.h` unchanged. 0.4.0.
- `aud_audio_graph`: the Dart API split; `aud_graph_render` exported from
  the ffi part; the host time of the block that applied a command if step
  6 finds it missing. 0.4.0.
- `aud_audio_io`: the Dart API split. 0.3.0.
- `aud_audio_web`: pins of core, graph and io raised to the new versions.
  0.0.4.

## Steps

1. Done: register ticket 22 in `doc/issues.md` and confirm this plan.
2. Done: split core's Dart API into neutral and ffi parts, with the web compile
   test; then graph's, then io's, each with its tests at 100 %.
3. Done: `aud_audio_web`: raise the pins. Umbrella pubspec: Flutter package;
   core, graph, io and web pinned exactly as git refs with `tag_pattern`;
   iOS and Android as platforms. The neutral `AudEngine` API with the
   native glue behind a conditional import and the web stub.
4. Done: the engine glue (open question 1): open, create, prepare, start, the
   recovery sequence on the stream's notifications, stop, dispose.
5. Done: the registry and the test package with a valid and a refused node type.
6. Done: the numbers: render time, xruns, and the command-to-sound probe. First
   check whether the graph reports the host time of the block that applies
   a command; if not, prove it and add it to the graph (minor 0.4.0).
7. Done: host tests at 100 % coverage, the web compile test, the native test
   package under ASan/UBSan.
8. Done: the example app and its integration tests on the simulator and the
   emulator.
9. Partly done: run on the reference devices; record the numbers under Measurements.
10. Done: the docs page "The engine", index.jsonc, README EN/DE, the open work of
    the decisions, the status of S4 in ticket 17.
11. Done: `/code-review` at high effort on the render handover and the
    lifecycle paths, then review-light. Every finding goes into Findings.
    Then `gg do review`.

## Questions of the plan review

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

## Decisions of the plan review (2026-10-09)

Gabriel Gatzsche decided:

- 1 → (a) Dart on the control thread.
- 2 → (b) split, not the recommended facade. A follow-up showed that core's
  Dart value types (transport, events, time, node descriptors) import
  `dart:ffi` too; Gabriel Gatzsche decided to split core's Dart API as
  well (core 0.4.0, `aud_abi.h` unchanged).
- 3 → keep `aud_audio_web`, released with new pins (0.0.4).
- 4 → the umbrella only.
- 5 → `@RecordUse` with S9.
- Core, graph, io and web were added to the ticket.

## Implementation

- **The split (web-001, decision 2)**: core, graph and io each have a
  platform-neutral barrel and an `_ffi` barrel.
  - Constants: `scripts/generate-abi-constants.js` copies the `AUD_*`
    constants of the ffigen bindings into a Dart file without imports
    (`aud_abi_constants.dart`, `aud_graph_constants.dart`,
    `aud_io_constants.dart`); a test checks that the copy is current.
  - Value types keep everything but their struct conversions: the
    `fromNative` factories became `toDart()` extensions on the structs,
    `writeTo` and `toNative` extensions on the types, in a
    `*_native_conversions.dart` of each package. New neutral constructors
    take the struct fields (`AudEvent.fromWords`, `AudTimestamp.fromCodes`).
  - `AudGraph`, `AudIoSession` and `AudIoStream` are interfaces;
    their factories pick `AudGraphFfi` and `AudIoSessionFfi` through
    `if (dart.library.ffi)` and throw `UnsupportedError` on the web.
    `AudGraphTransaction` applies its edits through `AudGraphEdits`.
    `AudClock` picks the native clock the same way. What stays native
    only: pointers, `hostApi`, `AudIoSessionFfi.open` with its render
    function, the headless host, the offline renderer, WAV files, the
    probe, `AudAbiNative`, the time filter, ramp, adapter and gain.
  - `aud_audio_graph_ffi.dart` exports `aud_graph_render`; no client
    needs `implementation_imports` for the handover any more.
  - Each package and the umbrella compile a web entry point of their
    neutral barrel with `dart compile js` in a test; the ffi barrel fails
    that compile.
- **AudEngine** (`aud_audio`, Dart on the control thread, decision 1):
  `AudEngineFfi` opens an `AudIoSessionFfi`, creates an `AudGraphFfi`
  and opens an output stream with `aud_graph_render` and
  `graph.pointer`. `prepare` registers the packages and prepares the
  graph at the stream's rate and block size; `start`, `stop` and
  `dispose` run start-up and its reverse. The states are acknowledged on
  `engine.states`.
- **The one sequence**: interrupted and disconnected suspend the graph;
  formatChanged, routeChanged, resumed and recovered resume it. The graph
  is prepared again only while the stream holds it - its format generation
  is new and not yet acknowledged - then the engine resumes it and
  acknowledges the generation. Without a new format the graph just resumes,
  so the audio thread never renders a graph that is being prepared.
  `start()` restarts a stream whose recovery failed.
- **The registry**: `AudNativeNodePackage(name, Native.addressOf(aud_<package>_register))`;
  the engine calls it with `graph.hostApi` at `prepare` and keeps an
  `AudPackageRegistration` per package. The graph refuses a descriptor of
  another ABI major with `AUD_ERROR_ABI_MAJOR`. `test_packages/aud_test_nodes`
  is a `package_ffi` package with a build hook of its own: `aud.test.invert`
  and a second register function that claims the next ABI major.
- **Numbers**: render time from the graph stats, callbacks, xruns and late
  callbacks from the IO counters; command to sound is the host time of an
  empty transaction against the presentation time of the first block that
  renders it - the graph's revision notification gives the block's sample
  position, the stream's last `AudStreamTime` maps it to its output time.
  No change to the graph was needed for it. `engine.report()` collects
  them for the example's "Copy report".
- **Example**: oscillator -> filter -> output with frequency, cutoff,
  start/stop, route, numbers, "Measure latency" and "Copy report"; the
  spike example, `legacy_sfz`, its assets and the macOS runner are gone.
  `integration_test/engine_test.dart` plays for `AUD_MEASURE_SECONDS`,
  measures command to sound 50 times and prints the report.
- **Release**: the umbrella is a Flutter package with `platforms: android,
  ios` and exact pins of core, graph, io and web; web 0.0.4 raises its
  pins. Only the umbrella carries the platform tags (decision 4).
- **Tests**: core, graph, io and umbrella at 100 % per mirrored file;
  the umbrella's engine tests run on the null device with its manual clock:
  oscillator -> filter at 48 and 44.1 kHz against the offline renderer, a
  new rate, disconnect, route, a failing start, an interruption, changes
  while prepared and stopped, shutdown from every state, the registry, a
  failing open, pump without listening and command to sound.

## Measurements

The example's integration test (`integration_test/engine_test.dart`):
oscillator -> filter -> output, 50 measurements of command to sound.

| Device | Backend | Rate, buffer | Callbacks | Render mean / max | Callback max | Xruns, late | Output latency | Command to sound min / mean / max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iOS simulator (iPhone 17 Pro), 3 s | miniaudio | 48 kHz, 256 | 439 | 24.5 µs / 162 µs | 168 µs | 0, 0 | 517 frames (10.8 ms) | 11.0 / 19.9 / 21.4 ms |
| Android emulator (API 36), 3 s | oboe/aaudio | 48 kHz, 1920 | 471 | 32.8 µs / 808 µs | 2.13 ms | 0, 84 | 5300 frames (110 ms) | 107.6 / 117.4 / 129.6 ms |
| iPad Pro 11" (M5), iOS 26.6, speaker, 10 min | miniaudio | 48 kHz, 256 | 112762 | 10.4 µs / 2.25 ms | 2.26 ms | 0, 2 | 784 frames (16.3 ms) | 17.1 / 20.4 / 21.6 ms |

- Command to sound is the output latency plus up to one period plus the
  wait for the next block boundary: on the iPad 16.3 ms + 5.3 ms at most,
  measured 17.1 to 21.6 ms.
- The iPad is a real device but not one of the reference devices. The
  iPhone 15+ ("iPhone von Gabriel", over Wi-Fi only) and a Pixel 8+ are
  open, as are the numbers ticket 21 left open for io-001 and io-002
  (round trip, timestamp error, recovery times on the reference devices).
- The longest render (2.25 ms) stays below the period (5.33 ms); the two
  late callbacks fall into the start of the run.

## Findings

- **Model deviation**: process-002 puts S4 in the row "Remaining C++ and
  FFI work": Claude Fable 5.1 at high effort. This ticket runs on Claude
  Opus 5.5.
- **Compensation**:
  - `/code-review` at high effort on the render handover and the
    lifecycle paths: seven findings, six fixed and tested, one without
    need (below).
  - The only native code of the umbrella is the test package:
    `scripts/test-native.js` runs its native test under ASan/UBSan and the
    RealtimeSanitizer, with a probe allocation on the audio path that RTSan
    must catch; all pass, the probe is caught.
  - The review-light skill before `gg do review`.
- **The split reached the core**: decision 2 chose the split of graph and
  io; core's value types import `dart:ffi` too, so the core was split as
  well (minor 0.4.0, `aud_abi.h` unchanged).
- **gg's coverage check** only sees files a test loads: a test file emptied
  by moving its tests passed `gg can commit`. Every lib file was checked
  against lcov by hand; the files no test loads have no executable lines
  (barrels, constants, interfaces).
- **Dependency constraints**: the family stays on the published
  constraints (`^0.3.0`, exact `0.3.0` in the umbrella) while the
  ticket's pubspec_overrides point at the siblings; `gg do publish` sets
  each dependent's ref version to the version it published before
  (`SetRefVersion`). To check after the publish. The examples of graph,
  io and the umbrella override the siblings by path, as the spike example
  did.
- **Code review** (high effort, engine):
  - The graph was prepared again on every route change, resume or recovery,
    also while the stream renders: a data race. It is prepared only while
    the format hold is on.
  - `start()` did nothing while suspended, so a failed recovery could not
    be restarted; it restarts the stream.
  - `presentationTimeNs` divided by a zero rate before the first callback.
  - A failing open leaked the session and the graph.
  - Without `listen` nobody took the notifications: `engine.pump()`.
  - The route was read from the devices on every access; it is cached until
    a route, format or device change.
  - Not needed: a channel count that changes under a fixed graph - the
    stream keeps the requested channel count and converts.
- **The test package's register functions** need `extern "C"`; without it
  `@Native` cannot find the mangled symbols.
- **Signing**: the umbrella example carried team YLBA2UXG4Z, for which this
  Mac has no account; it now uses SAZSC68S46 as the io example does.
- **Wireless iPhone**: `flutter test` cannot start an app on an iPhone
  connected over Wi-Fi, and `flutter drive --publish-port` did not find
  the built bundle; the device runs used the iPad by cable.
- **`@RecordUse`** stays with S9 (decision 5).
