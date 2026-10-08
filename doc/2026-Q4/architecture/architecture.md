# Architecture

Target picture of the Audanika Audio Engine `aud_audio`. Diagrams live
in `img` as mermaid `.mmd` files; the decisions behind each section are
in `../concepts/decisions`.

## Layers

```text
Apps, plugin shells, docs cookbook
  └─ aud_audio (umbrella: Engine = graph + io + node registry)
       ├─ aud_audio_graph   C++ graph engine, Dart graph API
       ├─ aud_audio_io      device IO per platform, web worklet host
       └─ aud_audio_core    C ABI, buffers, events, contracts, OSC model
            ▲
            └─ aud_dsp_*     DSP packages: C++ nodes + Dart descriptors
Integration: aud_audio_midi, aud_audio_osc, aud_audio_sequencer,
             aud_audio_link, aud_audio_web, aud_audio_file,
             aud_audio_backing
UI:          aud_audio_ui_graph_edit, aud_audio_ui_piano_roll,
             aud_audio_ui_controls, aud_audio_ui_keyboard,
             aud_audio_ui_waveform
Formats:     aud_audio_vst3, aud_audio_clap, aud_audio_auv3
Tooling:     aud_audio_bench
```

Apps depend on `aud_audio` and on the DSP packages they use. The
packages below the umbrella are usable on their own (tests, servers,
plugin shells). See `img/package-graph.mmd` and decision family-001.

## Runtime on the native platforms

`img/runtime-native.mmd`. Three kinds of threads:

- The Dart isolate(s): hold the graph model, compile edits into
  commands, read events and meters. Never on the audio thread
  (interop-001).
- The control thread (C++): compiles graph edits into render programs,
  loads samples and files, frees retired programs and buffers. May
  block.
- The audio callback thread and the worker pool (C++): run the current
  render program block by block; no allocation, no locks, no I/O
  (sched-001).

Dart and C++ exchange data through `dart:ffi`: graph transactions go
to the control thread; parameter changes and timestamped events travel
in fixed-capacity lock-free queues with defined overflow and late-event
policies (interop-002); events and meters come back through ring
buffers (`asTypedList` views); a notification thread, woken by the
audio thread through a semaphore, invokes `NativeCallable.listener`.
Node instances are persistent and keep their state across program
swaps; every edit is a transaction with a revision the engine
acknowledges (graph-003). Every DSP package compiles its
C++ with a build hook and registers its node types through the C ABI of
`aud_audio_core` at engine start.

## Runtime on the web

`img/runtime-web.mmd`. The engine and every DSP node of the app are linked
by Emscripten into one WebAssembly module that runs inside an
`AudioWorkletGlobalScope`. Dart runs on the main thread and uses the same
API; the transport below it is `dart:js_interop`: commands over a
`MessagePort`, audio and event data through `SharedArrayBuffer` ring buffers
when the page is cross-origin isolated, `MessagePort` only otherwise.
`aud_audio_web` owns the Emscripten build and the JS glue (web-001). A Wasm
Worker sharing the module's heap takes the role of the control thread —
compiling, loading, freeing — and publishes prepared plans to the worklet;
without shared memory it transfers them by message with reduced timing
guarantees (web-002). The capabilities of the native, the isolated and the
non-isolated web environment are stated as a contract (web-003).

## Graph model

- Nodes have typed ports: audio buses (N float channels), event ports
  (MIDI 1.0, UMP, OSC-typed control messages with sample offsets) and
  parameters (ramped values, OSC-addressable).
- Every graph edit compiles into a render program: topologically sorted
  jobs, preallocated and reused buffers, summed fan-in, latency
  alignment delays. The audio thread adopts the newest program at block
  start; the old one is freed on the control thread.
- Blocks are variable, as the device or host delivers them, up to a
  prepared maximum; events split a block into sub-ranges at their
  sample offsets. (graph-002)
- Direct cycles are rejected; feedback runs through a feedback node
  pair with a delay defined in samples; latency compensation
  pre-schedules sequenced events and reports, never hides, the latency
  of live input. (graph-001)
- Rendering is serial by default; when the program's cost justifies it,
  coarse jobs run in parallel with atomic input counters and work
  stealing between real-time workers joined to the platform's audio
  workgroup or priority class, with a fixed summation order for
  deterministic output; plugins use the host's pool. (sched-001)

## Events and addressing

Every graph, node, inlet, outlet and parameter has an OSC 1.1 address
at the Dart API and on the network (`aud_audio_osc`). Inside the engine
commands are typed and numeric; the Dart-side router resolves addresses
to handles before a command enters a realtime queue, and OSC timetags
are converted into the engine's time domains — now, host time, or beat
time through the transport — at the adapter. The engine replies with
`/done` and `/fail` and notifies about node lifecycle and meters.
(osc-001)

MIDI enters through `aud_audio_midi`, which turns `aud_midi` ports into
event inlets and outlets; all MIDI types come from `aud_midi_standard`
(midi-001), and per-note controllers of MPE and MIDI 2.0 travel as UMP
to the nodes and to the note expressions of the plugin shells.

## Time, transport and sequencing

The engine's reference clock is the platform's monotonic host time in
microseconds (`mach_absolute_time`, `CLOCK_MONOTONIC`, the Windows performance
counter, `performance.now` on the web) — the clock Ableton Link and the plugin
hosts measure against. Every stream of `aud_audio_io` delivers with each
callback the sample position of the block, the host time at which its first
frame reaches the output (for input: was captured), and the current output and
input latency. A least-squares filter in `aud_audio_core` — our own code, not
Link's `HostTimeFilter` — smooths the jitter of the callback times into a
stable sample-to-host-time mapping. From these the callback thread computes
the output time of every block once, before the render program runs. Sample
time, musical time and host time stay distinct domains; host time carries a
validity flag and an accuracy estimate, because devices estimate and hosts
provide it only optionally (time-001).

`Transport` is a provider registered through the C ABI, like a node type, so
the engine never links against Link. At the start of each block the callback
thread captures a snapshot from the provider — a list of transport segments
with position, tempo, tempo increment, time signature and flags for playing,
looping and seeks, plus the quantum — and shares it read-only with the
sequencer stage and all jobs; providers declare their capabilities.
Conversions between beat, phase, host time and sample position are engine
functions over the snapshot; no job calls the provider. Commits go to the
provider only from the callback thread (realtime path, Link's audio session
state) or from the control thread (app path, Link's app session state);
provider callbacks from foreign threads — peers joined, a peer changed the
tempo, start/stop — land in the event ring buffer and reach Dart
asynchronously. Three providers: the internal clock (default, deterministic
under the offline renderer), `aud_audio_link` with Ableton Link on desktop and
Android and LinkKit on iOS (link-001), and the host transport that a plugin
shell feeds from the VST3, CLAP or AUv3 process context. The web uses the
internal clock.

The sequencer runs on the callback thread before the graph. It derives
clip positions from the snapshot's session beat (position = session
beat minus launch beat, modulo clip length), converts event beats to
host times with the snapshot and to sample offsets with the block's
output time, handles a block that spans a loop point, keeps the set of
running notes for note-offs, and launches and stops clips on quantum
boundaries requested through the transport (Link's request-beat-at-time
and start/stop sync). Events for nodes behind latency-adding paths are
scheduled early by the path latency the compiler reports. The Dart model
(`Sequence`, `Track`, `Clip`, `Event`) is what the piano roll edits
(seq-001).

## DSP packages

A DSP package is a Dart package with a C or C++ node implementation;
signal processing happens only there, Dart holds the descriptor, the
parameters, the presets and the API. The C ABI of `aud_audio_core` — a
versioned contract with sized structs, capability negotiation,
allocator ownership, thread-affinity tags, state serialization and
latency and tail reporting around the node vtable (abi-001) — is the
contract, and the same ABI carries transport providers (time-001); a
descriptor (ports, parameters with ranges and units, presets) generates the
Dart node class. Native platforms build through hooks and register at run
time; the web links all nodes statically into the app's module. Content:
`aud_dsp_sampler` (sfizz, sampler-001), `aud_dsp_effects` (oscillators,
filters, delays, dynamics, modulation, reverbs, taps), `aud_dsp_stk` (physical
models), `aud_dsp_guitar_amp` (amp and cabinet), `aud_dsp_synth` (a polyphonic
subtractive synthesizer after DunneAudioKit's Synth), `aud_dsp_analysis` (taps
and meters), `aud_dsp_spatial` (ambisonics and binaural rendering), `aud_dsp_mi`
(Mutable Instruments ports), `aud_dsp_stretch` (time stretch and pitch
shift on Signalsmith Stretch, the core of the backing player
`aud_audio_backing`, backing-001); provenance per dsp-001 and scope-001.

## Audio IO

`aud_audio_io` enumerates devices, reports hot-plug and route changes, and
opens full-duplex multi-channel streams. miniaudio's low-level device API
serves macOS, iOS, Windows and Linux; Android uses Oboe directly (io-002) for
AAudio with the latency tuner, channel masks, MMAP and presentation
timestamps; dedicated backends on Apple and Windows add AUHAL with workgroups
and aggregate devices and `IAudioClient3` low-latency periods; the web backend
is the worklet host. ASIO stays optional and separately licensed (io-001).
Every backend fulfils the timing contract of time-001: presentation timestamps
per callback and latency per direction, taken from the native APIs where they
exist (`AudioTimeStamp` on Apple, `AAudioStream_getTimestamp`, `IAudioClock`
with the performance counter, `snd_pcm_status` or `pw_time`,
`getOutputTimestamp` and `outputLatency` on the web) and, where miniaudio
hides them, from the platform clock read in the callback plus the device
latency queried through platform APIs.

## Plugin shells

A plugin shell contains the C++ engine behind its headless host API: the
engine loads the graph document, presets and assets without Dart and renders
into host-supplied buffers, which is the first-class renderer interface that
`aud_audio_io` uses as well (plugin-002). The shell exposes graph parameters
with stable ids and automation gestures, event inlets as MIDI, buses from the
document, latency and tail from the compiler, and offline rendering through
the virtual timeline; it needs neither the IO package nor the parallel
scheduler. Order: VST3 (MIT since SDK 3.8), CLAP (MIT), AUv3 (out of process,
360 MB budget). Dart never runs on the host's render thread; a Flutter UI runs
in a separate process or is replaced by a native view (plugin-001).

## Cross-cutting

- Licenses: the packages are MIT; permissive sources only, no LGPL in
  any form, notices in every package, GPL-dual SDKs isolated
  (license-001, license-002).
- Lifecycle: explicit engine states, one sequence for route, rate and
  block-size changes and interruptions, acknowledged transitions, cache
  budgets, bounded polyphony, cancellable loads (lifecycle-001).
- Presets: JSON node presets and one graph document that the editor,
  the presets and the plugin shells share; SFZ for the sampler.
- Naming: every public class carries the prefix `Aud` in Dart and C++,
  C symbols the prefix `aud_`; this document omits the prefix for
  brevity (naming-001).
- Versioning: all packages share the major version and release together
  per gg ticket; the umbrella pins exact versions and the ABI version
  is the compatibility gate (abi-001).
- Testing: offline rendering with a fake IO backend, golden-file renders
  that must match for any thread count, latency and xrun measurements
  on real devices, a debug watchdog for unsafe calls on the audio
  thread and Clang's RealtimeSanitizer in CI; `aud_audio_bench`
  publishes latency, CPU and xrun numbers per device on the docs site.
- Documentation: `audaudio.github.io` on Astro and Starlight, created
  from rljson.github.io: tested Dart snippets on every page, pages
  synced from the packages, one dartdoc run over all packages under
  `/api/` (docs-001).
