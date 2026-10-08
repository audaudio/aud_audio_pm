# 17: Audanika Audio Engine

## Goal

Give Audanika an audio engine that runs on every platform Flutter
supports — iOS, Android, macOS, Linux, Windows and Web — as an
ecosystem of Dart packages modeled on AudioKit: a signal-flow graph
defined in Dart and processed in C++, multi-channel audio IO, DSP
packages that plug into the graph, a sequencer, Ableton Link, UI
editors, plugin shells and a documentation site. This ticket delivers
the concept, the decisions and the split into implementation tickets;
it serves the quarter goal
[flutter-audio-kit](../goals/flutter-audio-kit.md). The requirements
are listed as R1 to R28 in
[requirements.md](../concepts/topics/requirements.md).

## Affected repos

- `aud_audio_pm` — this plan, the topics, the decisions and the
  architecture. The only repo of ticket 17.
- Repos created by the implementation tickets, all in the GitHub
  organization `audaudio` (see "Package family").

## Concept in short

- **Dart defines, C++ renders.** The graph model, the parameters and
  the events are Dart objects; every edit compiles into a render
  program that the C++ engine adopts at the next block boundary. Dart
  never runs on the audio thread. The transport between them is
  `dart:ffi` natively and `dart:js_interop` on the web (interop-001,
  web-001).
- **Typed ports, sample-accurate events, OSC addresses.** Audio buses,
  event ports for MIDI, UMP and control messages, ramped parameters;
  every node, port and parameter has an OSC 1.1 address and the same
  message model serves API, command queue, sequencer and network; blocks
  are variable with sample-accurate events (graph-001, graph-002,
  osc-001).
- **Parallel by construction.** The render program is a DAG executed by
  work-stealing real-time workers with deterministic summation
  (sched-001).
- **DSP packages are Dart packages with C or C++ nodes.** Signal
  processing happens only in C or C++, compiled by build hooks per
  platform and linked into one WebAssembly module on the web; Dart holds
  descriptors, parameters and presets; the C ABI of `aud_audio_core` is
  the contract (interop-001).
- **Audio IO** through miniaudio's device layer on the desktop and
  Apple platforms, Oboe on Android, native escape hatches and an own
  AudioWorklet host (io-001, io-002).
- **Content**: sfizz as the sampler, the AudioKit family, STK, Freeverb,
  Signalsmith and chowdsp as effect sources — Dunne's Chorus, Flanger,
  StereoDelay and TransientShaper by name —, Rhino and DynaRage as the
  amp, Dunne's Synth as the first synthesizer instrument — only with
  clear provenance (sampler-001, dsp-001).
- **Host time is the clock.** Streams deliver presentation timestamps
  and latencies, the transport is a per-block snapshot behind the C ABI,
  and the internal clock, Ableton Link and plugin hosts share the same
  conversions (time-001).
- **Sequencer on the render thread**, synchronized through a `Transport`
  that Ableton Link implements in a separately licensed package, with
  quantized launches and start/stop sync (seq-001, link-001).
- **Extensions** (scope-001): file decoding, streaming and recording,
  analysis taps, spatial audio, Mutable Instruments ports, a waveform
  view, a benchmark app, and the migration of the Audanika app onto the
  engine.
- **Plugin shells** VST3, CLAP, AUv3 with the engine inside and Dart out
  of process (plugin-001); **UI packages** as Flutter widgets over models
  ported from Flow and PianoRoll (ui-001) plus controls and keyboard
  after AudioKit Controls and Keyboard (ui-002); **docs** on
  `audaudio.github.io`, built with Astro and Starlight after
  rljson.github.io, with tested Dart snippets (docs-001).

The target picture is in
[architecture.md](../architecture/architecture.md).

## Package family

| Package | Platforms | Contents | Native code | Depends on |
| --- | --- | --- | --- | --- |
| `aud_audio_core` | all | C ABI (node vtable, buffers, events, descriptors), C++ utilities (ring buffers, atomics, ramps), Dart contracts (node descriptors, ports, parameters, OSC message model, `Transport`), notices tooling | C headers, C++ | `aud_midi_standard` for MIDI 1.0 and UMP types (midi-001) |
| `aud_audio_graph` | all | C++ graph engine (programs, scheduler, workers, taps), Dart graph API (`Graph`, `Node`, `Param`, `Route`), offline renderer, fake IO for tests | C++ via hooks | core |
| `aud_audio_io` | all | device enumeration, hot-plug, duplex multi-channel streams with timestamps; miniaudio backend (macOS, iOS, Windows, Linux), Oboe backend (Android), AUHAL and IAudioClient3 backends, web worklet host | C/C++ via hooks | core |
| `aud_audio_web` | web | Emscripten toolchain, JS glue, worklet processor, build step that links the app's DSP packages into one module, fallback path | C++ to Wasm | graph, io |
| `aud_audio` | all | `Engine` = io + graph + node registry, conditional imports (ffi / js_interop), example and cookbook app | none | graph, io, web, core |
| `aud_audio_midi` | all | `aud_midi` ports as event inlets and outlets; MIDI 1.0 and UMP mapping | none | graph, `aud_midi` |
| `aud_audio_osc` | all | OSC 1.1 codec, address router, pattern matching, replies and notifications, optional UDP and WebSocket server | optional (tinyosc) | graph |
| `aud_audio_sequencer` | all | render-thread sequencer: tracks, clips, events, loops, transport commands; Dart model `Sequence`, `Track`, `Clip`, `Event` | C++ via hooks | graph |
| `aud_audio_link` | macOS, Windows, Linux, Android, iOS | transport provider on Ableton Link / LinkKit, multicast lock shim, settings UI; fetches Link and LinkKit at build time, app publishers need their own Ableton license | C++ (Link), LinkKit, JNI shim | graph |
| `aud_dsp_sampler` | all | SFZ sampler node on the sfizz fork, dr_libs loaders, message API on routes | C++ via hooks | core |
| `aud_dsp_effects` | all | oscillators, filters, delays, dynamics, modulation, distortion, reverbs, analysis taps | C++ via hooks | core |
| `aud_dsp_stk` | all | STK physical models (clarinet, flute, mandolin, Rhodes, shakers, bells and more) | C++ via hooks | core |
| `aud_dsp_guitar_amp` | all | Rhino amp head and cabinet, DynaRage compressor | C++ via hooks | core |
| `aud_dsp_synth` | all | polyphonic subtractive synthesizer ported from DunneAudioKit's Synth: wave-stack oscillators, filters, envelopes, sustain pedal; the first instrument node | C++ via hooks | core |
| `aud_dsp_analysis` | all | amplitude, FFT and pitch taps, meters, scope and spectrum buffers for the UI; pitch tracking from the literature | C++ via hooks | core |
| `aud_dsp_spatial` | all | ambisonics encoding and decoding up to third order, binaural decoding with Resonance Audio's HRTF renderers, panners | C++ via hooks | core |
| `aud_dsp_mi` | all | Mutable Instruments STM32 ports under neutral names: macro oscillator, modal resonator, granular processor | C++ via hooks | core |
| `aud_audio_file` | all | decoders (dr_libs, WavPack, Vorbis, Opus), FLAC encoding, disk-streaming player node, recorder node, offline bounce | C via hooks | graph |
| `aud_audio_ui_graph_edit` | all | node graph editor widget; patch model (nodes, typed ports, wires) ported from Flow; adapter to `Graph` | none | `aud_audio` |
| `aud_audio_ui_piano_roll` | all | piano roll widget; note model ported from PianoRoll; adapter to `Sequence` | none | sequencer |
| `aud_audio_ui_controls` | all | knobs, sliders, wheels, ribbon, joystick, XY pad on one single-value and one two-value control with geometry mappings, ported from AudioKit Controls; `ParamBinding` to graph parameters by OSC address | none | `aud_audio` |
| `aud_audio_ui_keyboard` | all | multi-touch keyboard with piano, isomorphic, guitar and vertical layouts, latching, externally activated keys and a monitor view, ported from AudioKit Keyboard; `NoteBinding` to event inlets and the sequencer | none | `aud_audio` |
| `aud_audio_ui_waveform` | all | waveform view after AudioKit Waveform: peaks computed off the UI thread, multi-resolution cache, zoom and selection | none | `aud_audio`, file |
| `aud_audio_bench` | all | benchmark app: loopback latency, CPU per node type, xruns per device; publishes its numbers to the docs site | none | `aud_audio` |
| `aud_audio_vst3` | Windows, Linux, macOS | VST3 shell: engine + serialized graph, parameters, MIDI, buses | C++ (VST3 SDK, MIT) | graph, io |
| `aud_audio_clap` | Windows, Linux, macOS | CLAP shell with note expressions and the thread-pool extension | C++ (CLAP, MIT) | graph |
| `aud_audio_auv3` | iOS, macOS | AUv3 extension: `AUAudioUnit` subclass over the engine, native view | C++, Swift | graph |
| `audaudio.github.io` | — | documentation site on Astro and Starlight after rljson.github.io: landing page, guides, one page per package synced from the repos, tested Dart snippets, API docs of all packages under `/api/` | Node (Astro), Dart (snippet tests, `dart doc`) | all |
| `aud_audio_pm` | — | this project management repo | — | — |

```mermaid
flowchart BT
  core[aud_audio_core]
  graph[aud_audio_graph] --> core
  io[aud_audio_io] --> core
  web[aud_audio_web] --> graph & io
  umbrella[aud_audio] --> graph & io & web
      dsp[aud_dsp_* packages] --> core
  file[aud_audio_file] --> graph
  midi[aud_audio_midi] --> graph
  osc[aud_audio_osc] --> graph
  seq[aud_audio_sequencer] --> graph
  link[aud_audio_link] --> graph
  uig[aud_audio_ui_graph_edit] --> umbrella
    uip[aud_audio_ui_piano_roll] --> seq
  uic[aud_audio_ui_controls] --> umbrella
    uik[aud_audio_ui_keyboard] --> umbrella
  uiw[aud_audio_ui_waveform] --> umbrella & file
  bench[aud_audio_bench] --> umbrella
  vst3[aud_audio_vst3] --> graph & io
  clap[aud_audio_clap] --> graph
  auv3[aud_audio_auv3] --> graph
  app[App] --> umbrella & dsp & midi & seq
```

Rules of the family (family-001): one repo per package in `audaudio`,
`dna_audanika` in every repo, shared major version, released together
per gg ticket, the umbrella pins caret ranges of the same minor, apps
depend on `aud_audio` plus the DSP packages they use.

## Steps (each a later gg ticket)

The steps are grouped in phases. A step names the steps it depends on;
steps without a dependency inside a phase run in parallel. Every step
becomes a GitHub issue in `aud_audio_pm` whose number is its ticket ID
(process-001) and gets its own plan file in `tickets/` before it
starts.

### Phase 0: spikes (one ticket, binding before the core grows)

- S0 Spikes: (a) a C++ sine reaches the device on all five native platforms
  through a `package_ffi` hook build, controlled from Dart, with measured
  callback period and command latency; (b) an Emscripten Wasm Audio Worklet
  driven from Dart web (dart2js and dart2wasm), with and without cross-origin
  isolation; (c) parallel block processing with workers joined to the audio
  workgroup / MMCSS / SCHED_FIFO / Android high priority, with xrun counts; (d)
  the sfizz fork builds for iOS, Android and Wasm (clang-19 fix); (e) two
  separately built DSP packages register nodes through the C ABI into one engine
  natively and link into one Wasm module; (f) the core packages install and test
  with the Dart SDK alone, no Flutter; (g) Link alignment: the sine example
  joins a Link session with LinkHut on a second machine and a loopback recording
  of both clicks measures the alignment error per platform, with timestamps from
  the native APIs and from the miniaudio shim.

### Phase 1: foundation

- S1 `aud_audio_core`: C ABI, buffer and event formats, descriptors,
  Dart contracts, the OSC message model, the UMP event model with
  per-note controllers for MPE and MIDI 2.0, the node preset schema
  (JSON), the timing contract (time-001: timestamp filter, transport
  snapshot and conversions, provider vtable), the notices file
  convention and its check. Depends on S0 and on the first release of
  `aud_midi_standard` (midi-001).
- S2 `aud_audio_graph`: engine with typed ports, program compiler,
  single-threaded scheduler, parameter ramps, sub-block events, feedback
  nodes, latency alignment, taps; the graph document (JSON) that the
  editor, the presets and the plugin shells share; xrun and diagnostics
  counters as events; a debug watchdog for locks and allocations on the
  audio thread; Dart graph API; offline renderer and fake IO;
  golden-file tests. Depends on S1.
- S3 `aud_audio_io`: device model, enumeration, hot-plug, duplex
  streams with presentation timestamps and latency per direction —
  mobile first (release-001): the Oboe backend for Android (io-002,
  compiled in the build hook with 16 KB page alignment) and the
  miniaudio backend on iOS. The desktop backends follow as S3b
  (miniaudio on macOS, Windows and Linux), S3c (AUHAL, workgroups,
  aggregate devices) and S3d (IAudioClient3), each with native
  timestamps. Depends on S1.
- S4 `aud_audio` umbrella: `Engine`, node registry, conditional
  imports, example app (oscillator → filter → output on iOS and
  Android, the desktop platforms as S3b lands), first `0.x` release of
  core, graph, io and umbrella with iOS and Android platform tags.
  Depends on S2, S3.
- S5 `aud_audio_web`: Emscripten build, worklet processor, JS glue,
  shared-memory ring buffers with fallback, web example; the same
  example app runs in Chrome, Firefox and Safari. Depends on S4.
- S6 Parallel scheduler in `aud_audio_graph`: work-stealing workers,
  platform priorities, deterministic summation, benchmark and jitter
  measurements. Depends on S4.
- S7 `aud_audio_osc`: address router, pattern matching, replies and
  notifications, UDP and WebSocket server, service discovery and remote
  sessions; remote control of a running engine from another device,
  shown with the example app. Depends on S4.
- S8 `aud_audio_midi`: `aud_midi` input and output ports as event
  inlets and outlets, MIDI 1.0 and UMP mapping, keyboard-to-synth demo.
  Depends on S4 and on the `aud_midi` family (risk: schedule).

### Phase 2: DSP content

- S9 `aud_dsp_sampler`: sfizz node, loaders, presets, the message API
  on routes, the legacy presets of the Audanika app playing through it.
  Depends on S4, S0d.
- S10 `aud_dsp_effects`, in two tickets: S10a oscillators, filters,
  delays (StereoDelay) and dynamics (compressor, TransientShaper); S10b
  modulation (Chorus, Flanger), distortion and reverbs. S10c
  `aud_dsp_analysis` as its own package: amplitude, FFT and pitch taps,
  meters, scope and spectrum buffers, pitch tracking from the literature
  (YIN, McLeod). Depends on S4; provenance per dsp-001.
- S11 `aud_dsp_stk`: STK instruments as nodes. Depends on S4.
- S12 `aud_dsp_guitar_amp`: Rhino and DynaRage after the provenance
  question is settled. Depends on S4.
- S13 `aud_dsp_synth`: a polyphonic subtractive synthesizer instrument
  ported from DunneAudioKit's Synth — wave-stack oscillators with
  ensemble and drawbar modes, multi-stage and resonant filters, ADSR and
  AHDSHR envelopes, sustain pedal logic — as the first instrument node
  of the family, with presets and a cookbook page; the resonant filter
  adapted from an Apple code sample is re-implemented unless its license
  is confirmed. Depends on S4.

### Phase 3: sequencing and sync

- S14 `aud_audio_sequencer`: render-thread sequencer, Dart model, loop
  and transport semantics, MIDI file import. Depends on S4, S8.
- S15 `aud_audio_link`: transport provider on Link (desktop, Android
  with the multicast lock shim) and LinkKit (iOS, settings view,
  entitlement), start/stop sync, quantized launches, alignment test
  against LinkHut, Link Audio research, the build-time fetch of Link and
  LinkKit with the license notice for app publishers (link-002). Depends
  on S14.

### Phase 4: UI

- S16 `aud_audio_ui_graph_edit`: patch model, canvas, wiring, node
  palette from the registry, adapter to `Graph`, a remote mode that
  edits a graph running on another device through `aud_audio_osc`.
  Depends on S4, S7.
- S17 `aud_audio_ui_piano_roll`: note model, canvas, editing, adapter
  to `Sequence`. Depends on S14.
- S17a `aud_audio_ui_controls`: the `Control` and `TwoParameterControl`
  primitives with their geometries and the pointer-averaging gesture
  layer, the eight implementations of AudioKit Controls, `ControlsTheme`,
  `ParamBinding` with parameter gestures, golden tests, cookbook page.
  Depends on S4.
- S17b `aud_audio_ui_keyboard`: `Keyboard` with the five layouts,
  `KeyboardModel` with multi-touch, latching and external activation,
  `KeyboardKey`, `MidiMonitorKeyboard`, `NoteBinding` into event inlets
  and the sequencer, the music-theory choice of ui-002, golden tests,
  cookbook page with the sampler. Depends on S4, S9.

### Phase 5: plugin shells

- S18 `aud_audio_vst3`: shell with the graph document, parameter and
  bus mapping, note expressions from the per-note controllers (MPE,
  MIDI 2.0), the host transport as transport provider, validator run,
  test in REAPER on Windows and Linux. Depends on S6.
- S19 `aud_audio_clap`: shell reusing S18's mapping, note expressions
  from the per-note controllers, thread-pool extension. Depends on S18.
- S20 `aud_audio_auv3`: AUv3 extension with host app,
  memory measurement with the sampler loaded, native view. Depends on
  S6.

### Phase 6: documentation and tooling (starts with S4)

- S21 `audaudio.github.io`: create the repo from rljson.github.io
  (Astro 7, Starlight 0.42, pnpm, DNA layers, quick check), Audanika
  theme and landing page, Dart snippet tests with regions and goldens on
  the offline renderer, the `sync-packages` script, `dart doc` over a
  synthetic umbrella into `/api/` in the deploy workflow, the ecosystem
  page; grows with every step. Depends on S4.
- S22 Tooling: CI matrix (macOS, Windows, Linux runners, Android
  emulator, headless Chrome), the notices check in the DNA layer,
  Clang's RealtimeSanitizer and the watchdog in CI, a supply-chain repo
  like `aud_sc`. Depends on S4.

### Phase 7: extensions (R28, scope-001)

- S23 `aud_audio_file`: decoders (dr_libs for WAV, FLAC and MP3,
  WavPack, stb_vorbis or libvorbis, libopus), libFLAC encoding, platform
  decoders for AAC and ALAC later, a disk-streaming player node with a
  read-ahead worker and ring buffer, a recorder node, offline bounce of
  a graph to a file. Depends on S4.
- S24 `aud_audio_bench`: loopback latency measurement, CPU per node
  type, xrun counts and memory per device; results as JSON published on
  the docs site. Depends on S4, S22.
- S25 `aud_dsp_spatial`: ambisonics encoding and decoding up to third
  order, binaural decoding with Resonance Audio's HRTF renderers
  (Apache-2.0, NOTICE), VBAP and stereo panners from the literature,
  head-tracking input as parameters. Depends on S4, S10a.
- S26 `aud_dsp_mi`: the Mutable Instruments STM32 ports — macro
  oscillator, modal resonator, granular processor — under neutral node
  names with MIT notices and the trademark rule. Depends on S4.
- S27 `aud_audio_ui_waveform`: waveform view with peaks computed in an
  isolate, a multi-resolution cache, zoom and selection, rendering with
  CustomPainter or fragment shaders, model after AudioKit Waveform.
  Depends on S4, S23.
- S28 Faust pipeline for `aud_dsp_effects`: generate C++ from `.dsp`
  files that use only functions declared STK-4.3 or MIT, a license gate
  that reads every `declare license`, generated code checked in with
  notices; the LGPL compiler runs at development time only. Depends on
  S10a and on open question 3.
- S29 Audanika app migration: `aud_app` replaces the legacy
  `audio_engine` with `aud_audio`, `aud_audio_midi` and
  `aud_dsp_sampler`; the legacy presets move to SFZ and JSON; the
  acceptance test of the verification section passes on iOS and
  Android (release-001). The code repo lives in `audanika-private`; the
  plan file lives here. Depends on S4, S8, S9.

## Verification

- Every package: unit tests, `dart analyze`, format, the DNA test, and
  golden-file offline renders that must match for any thread count.
- Platform proof per step: mobile first — iOS and Android gate the
  first releases (emulators in CI, real devices before a release);
  desktop and web join the gates as their tickets land; latency and
  xrun numbers are recorded in the benchmark pages.
- The legacy acceptance test: the Audanika app's presets play through
  `aud_dsp_sampler` from a MIDI keyboard on iOS and Android with no
  audible difference to the legacy engine.
- Provenance: the notices check passes in every repo; no file without
  a license entry.
- Link alignment: beats align with LinkHut within one millisecond on
  every native platform, measured by loopback recording; the same
  measurement passes with the internal clock against a plugin host's
  transport.
- Benchmarks: `aud_audio_bench` publishes latency, CPU and xrun numbers
  per device with every release.

## Open questions

1. Plugin UI in v1: native view, Flutter in a separate process, or no
   UI (parameters only)?
2. Is `aud_audio_clap` wanted in the first round of plugin shells, or
   after VST3 and AUv3 ship?
3. Faust: is the LGPL Faust compiler acceptable as a development-time
   tool whose generated code (from STK-4.3 and MIT functions only) is
   checked in under MIT? Nothing of the compiler is shipped (S28).

## Answered at plan review

2026-10-07:

- License of the packages: MIT for every package, Audanika as the
  copyright holder (license-002).
- LGPL: not used in any form; permissive alternatives or
  re-implementations instead (license-002, dsp-001, sampler-001).
- Pure-Dart DSP: none. Signal processing happens only in C or C++; a
  "Dart DSP package" bundles C or C++ node code with a Dart API
  (interop-001).
- Soundpipe: the Csound- and Zita-derived modules are never copied;
  their algorithms are re-implemented from the literature or replaced
  by permissive alternatives (dsp-001).

2026-10-08:

- Block model: variable blocks with sample-accurate events; a
  fixed-block adapter for nodes that need constant frame counts
  (graph-002).
- Documentation site: Astro and Starlight, created from
  rljson.github.io as the template (docs-001).
- UI packages `aud_audio_ui_controls` (after AudioKit Controls) and
  `aud_audio_ui_keyboard` (after AudioKit Keyboard) join the family
  (R29, R30, ui-002).
- DunneAudioKit: Chorus, Flanger, StereoDelay and TransientShaper are
  named nodes of `aud_dsp_effects`; `aud_dsp_synth` ports Dunne's Synth
  as the first instrument; sfizz stays the sampler and CoreSampler is
  deferred (R31, dsp-001, sampler-001).
- Android IO: Oboe directly as the backend; miniaudio serves macOS,
  iOS, Windows and Linux (io-002).
- MIDI types: `aud_audio_core` depends on `aud_midi_standard`; no
  interim event types (midi-001).
- Ableton Link license: Audanika holds none; `aud_audio_link` fetches
  Link and LinkKit at build time and tells app publishers to obtain
  their own license (link-002).
- Package name: the AUv3 shell is `aud_audio_auv3` (family-001).
- Platform order: mobile first — iOS and Android gate the first
  releases, desktop and web follow (release-001).
- Ticket IDs: GitHub issue numbers of `aud_audio_pm`, status on an
  organization Projects board; 17 stays the exception (process-001).
- Further suggestions (R28): all planned — six new packages in phase 7,
  the cross-cutting ones folded into existing steps (scope-001).

## Suggestions taken into the plan (R28)

All suggestions were planned on 2026-10-08 (scope-001):

- `aud_audio_clap`: planned as S19; whether it joins the first round of
  shells is open question 2.
- `aud_dsp_analysis`: its own package, S10c.
- `aud_audio_file`: S23.
- `aud_audio_ui_waveform`: S27.
- `aud_dsp_mi`: S26.
- The Faust pipeline: S28, pending open question 3.
- `aud_dsp_spatial`: S25.
- MIDI 2.0 and MPE: per-note controllers in the core's UMP event model
  (S1) and note expressions in the plugin shells (S18, S19).
- Real-time safety tooling: the watchdog and the counters in S2,
  RealtimeSanitizer in CI in S22.
- The benchmark app: `aud_audio_bench`, S24.
- Remote control: service discovery and remote sessions in S7, the
  remote mode of the graph editor in S16.
- Presets as JSON: the node preset schema in S1, the graph document in
  S2, SFZ for the sampler in S9.
- The Audanika app migration: S29.

## Sources

The research behind this plan is in `../concepts/topics`: requirements,
legacy engine, AudioKit and graph engines, audio IO per platform, Dart
interop and the web, plugin formats, licenses and DSP sources, sfizz,
Ableton Link, OSC, docs site. All sources were fetched on 2026-10-07.
