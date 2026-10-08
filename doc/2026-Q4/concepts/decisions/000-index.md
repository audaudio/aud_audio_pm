# Decisions

| ID | Status | Date | Decision | Open work |
| --- | --- | --- | --- | --- |
| [family-001](family-001.md) | proposed | 2026-10-07 | One repo per package, the aud_audio family, shared major version; the AUv3 shell is aud_audio_auv3 | none |
| [interop-001](interop-001.md) | proposed | 2026-10-07 | Dart never runs on the audio thread; FFI command queue, ring buffers, build hooks, C ABI | Measure queue and event latency in the spike |
| [web-001](web-001.md) | proposed | 2026-10-07 | One Wasm module per AudioContext in an AudioWorklet, Dart on the main thread | Prebuilt per-package Wasm vs. generated build |
| [io-001](io-001.md) | proposed | 2026-10-07 | miniaudio device layer on macOS, iOS, Windows, Linux plus native escape hatches; own web host; ASIO separate; timestamps per backend | Spike duplex and hot-plug; timestamp shim |
| [io-002](io-002.md) | accepted | 2026-10-08 | Oboe is the Android backend: AAudio, latency tuner, channel masks, MMAP, timestamps | Oboe in the Android build hook; timestamp mapping |
| [time-001](time-001.md) | proposed | 2026-10-08 | Host time is the reference clock; streams deliver presentation timestamps and latency; transport as a per-block snapshot behind the C ABI | Snapshot struct and conversions; timestamp quality per backend |
| [graph-001](graph-001.md) | proposed | 2026-10-07 | Typed ports, compiled render programs swapped at block start, feedback through a delay node | Port and buffer formats |
| [graph-002](graph-002.md) | accepted | 2026-10-08 | Variable blocks with sample-accurate events; fixed-block adapter for nodes that need constant frame counts | Minimum sub-range and adapter API |
| [sched-001](sched-001.md) | proposed | 2026-10-07 | Work-stealing parallel rendering with real-time workers, deterministic summation | Measure speed-up; job granularity |
| [seq-001](seq-001.md) | proposed | 2026-10-07 | Sequencer on the render thread over the transport snapshot; quantized launches; events pre-scheduled by path latency | Tempo map; clip launching semantics |
| [osc-001](osc-001.md) | proposed | 2026-10-07 | Every node, inlet, outlet and parameter has an OSC 1.1 address | Fix grammar and reply vocabulary |
| [license-001](license-001.md) | proposed | 2026-10-07 | Permissive sources only, no LGPL in any form, notices in every package, dual-licensed SDKs isolated | Notices check in the DNA layer |
| [license-002](license-002.md) | accepted | 2026-10-07 | All aud_audio packages are MIT; LGPL is neither copied nor linked | none |
| [dsp-001](dsp-001.md) | proposed | 2026-10-07 | DSP code only with clear provenance; Dunne's Chorus, Flanger, StereoDelay, TransientShaper and Synth by name; Csound-derived modules re-implemented, Devoloop after audit | Ask AudioKit maintainers; list re-implementations; license of the Apple-sample filter |
| [sampler-001](sampler-001.md) | proposed | 2026-10-07 | sfizz from the audanika fork as the SFZ sampler core, dr_libs only | iOS/Android builds, effects per license |
| [midi-001](midi-001.md) | accepted | 2026-10-08 | MIDI types come from aud_midi_standard; no interim event types in the core | Align S1 with the release of aud_midi_standard |
| [link-001](link-001.md) | proposed | 2026-10-07 | Ableton Link as a transport provider in its own package; LinkKit on iOS; multicast lock on Android | Research Link Audio |
| [link-002](link-002.md) | accepted | 2026-10-08 | No Audanika Link license; the package fetches Link and LinkKit at build time and tells app publishers to obtain their own | Notice wording; pinned tag and release |
| [plugin-001](plugin-001.md) | proposed | 2026-10-07 | VST3, then CLAP, then AUv3; engine in the plugin, Dart out of process | Plugin UI technology; AUv3 memory measurement |
| [ui-001](ui-001.md) | proposed | 2026-10-07 | UI packages are Flutter widgets over Dart models ported from Flow and PianoRoll | Canvas approach |
| [ui-002](ui-002.md) | accepted | 2026-10-08 | aud_audio_ui_controls after AudioKit Controls, aud_audio_ui_keyboard after AudioKit Keyboard | Music-theory dependency for labels and scales; shared theming |
| [release-001](release-001.md) | accepted | 2026-10-08 | Mobile first: the first releases cover iOS and Android; desktop and web follow in their own tickets | When macOS joins |
| [process-001](process-001.md) | accepted | 2026-10-08 | Ticket IDs are the GitHub issue numbers of aud_audio_pm; status on an organization Projects board | Create the board; open issues per step |
| [scope-001](scope-001.md) | accepted | 2026-10-08 | The R28 suggestions become six packages (analysis, file, spatial, mi, waveform, bench), cross-cutting additions and the app migration | Faust compiler as a tool; HRTF data license |
| [docs-001](docs-001.md) | accepted | 2026-10-08 | audaudio.github.io on Astro and Starlight after rljson.github.io: tested Dart snippets, one dartdoc run under /api, sync from the packages | Brand assets; API docs in the workflow; German locale |
