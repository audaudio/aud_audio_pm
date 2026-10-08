# Decisions

| ID | Status | Date | Decision | Open work |
| --- | --- | --- | --- | --- |
| [repos-001](repos-001.md) | accepted | 2026-10-08 | All repos created up front (S00), wired by git references with tag_pattern per the package graph, initial tags, ocean refreshed | Initial version; switch to pub.dev |
| [family-001](family-001.md) | proposed | 2026-10-07 | One repo per package, the aud_audio family, shared major version; the AUv3 shell is aud_audio_auv3 | none |
| [interop-001](interop-001.md) | proposed | 2026-10-07 | Dart never runs on the audio thread; FFI command queue, ring buffers, build hooks, C ABI | Measure queue and event latency in the spike |
| [interop-002](interop-002.md) | proposed | 2026-10-08 | Real-time contract: queue classes, capacities, overflow and late-event policies, note-off recovery, notification thread for Dart wake-ups | Defaults of ticket 19; measured in S24 |
| [web-001](web-001.md) | proposed | 2026-10-07 | One Wasm module per AudioContext in an AudioWorklet, Dart on the main thread | Prebuilt per-package Wasm vs. generated build |
| [web-002](web-002.md) | proposed | 2026-10-08 | Web control runtime as a Wasm Worker; reduced guarantees without shared memory | Measure the fallback latency |
| [web-003](web-003.md) | proposed | 2026-10-08 | Web capability contract per environment; the non-isolated path is a distinct implementation | Memory ceilings; when the fallback ships |
| [io-001](io-001.md) | proposed | 2026-10-07 | miniaudio device layer on macOS, iOS, Windows, Linux plus native escape hatches; own web host; ASIO separate; timestamps per backend | Spike duplex and hot-plug; timestamp shim |
| [io-002](io-002.md) | accepted | 2026-10-08 | Oboe is the Android backend: AAudio, latency tuner, channel masks, MMAP, timestamps | Oboe in the Android build hook; timestamp mapping |
| [time-001](time-001.md) | proposed | 2026-10-08 | Three time domains with validity; streams deliver timestamps and latency; transport as per-block segments with provider capabilities behind the C ABI | Segment struct, capabilities, conversions; timestamp quality |
| [graph-001](graph-001.md) | proposed | 2026-10-07 | Typed ports, compiled render programs swapped at block start, feedback through a delay node | none; implemented in tickets 18 and 19 |
| [graph-002](graph-002.md) | accepted | 2026-10-08 | Variable blocks with sample-accurate events; fixed-block adapter for nodes that need constant frame counts | Minimum sub-range and adapter API |
| [graph-003](graph-003.md) | accepted | 2026-10-08 | Persistent node instances, immutable programs, transactions with revision acknowledgements, fades and retirement | none; fades 5 ms, tail limit 10 s (ticket 19) |
| [abi-001](abi-001.md) | proposed | 2026-10-08 | Versioned C ABI with capabilities, allocator ownership, thread affinity, state, latency and tail reporting | Header in the core ticket; shared vs static engine |
| [lifecycle-001](lifecycle-001.md) | proposed | 2026-10-08 | Engine states, route-change sequence, shutdown order, cache budgets, polyphony bounds, cancellable loads | Default budgets; interruptions per platform (S3) |
| [sched-001](sched-001.md) | proposed | 2026-10-07 | Serial rendering as the baseline; opt-in coarse work-stealing parallelism, off until benchmarks prove it; host pools in plugins | Cost model for switching on |
| [seq-001](seq-001.md) | proposed | 2026-10-07 | Sequencer on the render thread over the transport snapshot; quantized launches; events pre-scheduled by path latency | Tempo map; clip launching semantics |
| [osc-001](osc-001.md) | proposed | 2026-10-07 | Every node, inlet, outlet and parameter has an OSC 1.1 address; OSC is an adapter over typed numeric engine commands | Grammar, replies, timetag conversion |
| [license-001](license-001.md) | proposed | 2026-10-07 | Permissive sources only, no LGPL in any form, notices in every package, dual-licensed SDKs isolated | Notices check in the DNA layer |
| [license-002](license-002.md) | accepted | 2026-10-07 | All aud_audio packages are MIT; LGPL is neither copied nor linked | none |
| [dsp-001](dsp-001.md) | proposed | 2026-10-07 | DSP code only with clear provenance; Dunne's Chorus, Flanger, StereoDelay, TransientShaper and Synth by name; Csound-derived modules re-implemented, Devoloop after audit | Ask AudioKit maintainers; list re-implementations; license of the Apple-sample filter |
| [sampler-001](sampler-001.md) | proposed | 2026-10-07 | sfizz from the audanika fork as the SFZ sampler core, dr_libs only | iOS/Android builds, effects per license |
| [midi-001](midi-001.md) | accepted | 2026-10-08 | MIDI types come from aud_midi_standard; no interim event types in the core | Align S1 with the release of aud_midi_standard |
| [link-001](link-001.md) | proposed | 2026-10-07 | Ableton Link as a transport provider in its own package; LinkKit on iOS; multicast lock on Android | Research Link Audio |
| [link-002](link-002.md) | accepted | 2026-10-08 | No Audanika Link license; the package fetches Link and LinkKit at build time and tells app publishers to obtain their own | Notice wording; pinned tag and release |
| [plugin-001](plugin-001.md) | proposed | 2026-10-07 | VST3, then CLAP, then AUv3; engine in the plugin through the headless host, Dart out of process | Plugin UI technology; AUv3 memory measurement |
| [plugin-002](plugin-002.md) | proposed | 2026-10-08 | Headless engine host with host-supplied buffers; stable parameter ids, state, buses, latency, offline rendering; shells need neither IO nor the parallel scheduler | Parameter ids and state format in ticket 20 |
| [ui-001](ui-001.md) | proposed | 2026-10-07 | UI packages are Flutter widgets over Dart models ported from Flow and PianoRoll | Canvas approach |
| [ui-002](ui-002.md) | accepted | 2026-10-08 | aud_audio_ui_controls after AudioKit Controls, aud_audio_ui_keyboard after AudioKit Keyboard | Music-theory dependency for labels and scales; shared theming |
| [release-001](release-001.md) | accepted | 2026-10-08 | Mobile first: the first releases cover iOS and Android; desktop and web follow in their own tickets | When macOS joins |
| [release-002](release-002.md) | proposed | 2026-10-08 | Milestone M1: the sampler plays Audanika's instruments on iOS and Android; everything else conditional | Owners and capacity; reference devices |
| [release-003](release-003.md) | accepted | 2026-10-08 | Delivery order: sampler, reverb and delay, AUv3, then the backing player with time stretching; iOS and Android | none |
| [naming-001](naming-001.md) | accepted | 2026-10-08 | Aud is the prefix of all classes in Dart and C++; aud_ for C symbols | none |
| [process-002](process-002.md) | accepted | 2026-10-08 | Claude model and effort per ticket class: Fable 5.1 max for the real-time core, high as default, Opus 5.5 for Dart ports, Sonnet 5.5 for mechanical work | Revisit with new models |
| [backing-001](backing-001.md) | proposed | 2026-10-08 | aud_dsp_stretch (Signalsmith Stretch) and aud_audio_backing: transport-driven multitrack loops with pitch-preserving tempo changes | Song schema; stem groups; transitions |
| [process-001](process-001.md) | superseded | 2026-10-08 | Ticket IDs are the GitHub issue numbers of aud_audio_pm; status on an organization Projects board | superseded by process-003 |
| [scope-002](scope-002.md) | accepted | 2026-10-08 | No backward compatibility with the existing Audanika app: no legacy preset is loaded, converted or emulated; the instruments are rebuilt on SFZ and graph documents | none |
| [scope-001](scope-001.md) | accepted | 2026-10-08 | The R28 suggestions become six packages (analysis, file, spatial, mi, waveform, bench), cross-cutting additions and the app migration | Faust compiler as a tool; HRTF data license |
| [docs-001](docs-001.md) | accepted | 2026-10-08 | audaudio.github.io on Astro and Starlight after rljson.github.io: tested Dart snippets, one dartdoc run under /api, sync from the packages | Brand assets; API docs in the workflow; German locale |
| [build-001](build-001.md) | proposed | 2026-10-08 | Third-party C and C++ is vendored as the linker's subset with SOURCES and INCLUDES manifests and compiled by the hook; the core is included, never linked | Build-time fetch where a license asks; per-file flags; shared hook helper |
| [process-003](process-003.md) | accepted | 2026-10-08 | Ticket numbers come from doc/issues.md of the project management repo; no GitHub issues | none |
