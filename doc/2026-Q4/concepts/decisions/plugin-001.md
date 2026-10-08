# plugin-001: VST3, then CLAP, then AUv3; Dart out of process

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/plugin-formats.md (R23)
- Open work: decide how the plugin UI is built (native, Flutter in a
  separate process, or Flutter in process with renamed frameworks);
  measure the AUv3 memory budget with the sampler loaded

## Decision

The plugin shells wrap the C++ engine through the headless host of plugin-002
— host-supplied buffers, graph document, presets and assets loaded without
Dart — independent of `aud_audio_io` and of the parallel scheduler, and expose
graph parameters, event inlets and buses as plugin parameters, MIDI and buses.
Order: `aud_audio_vst3` (SDK 3.8+, MIT; Windows, Linux, macOS), then
`aud_audio_clap` (MIT, same engine core, thread-pool extension), then
`aud_audio_auv3` (AUv3 on iOS and macOS, out of process, 360 MB budget shared
by all instances). Dart never runs on the host's render thread: the plugin's
logic lives in C++, and a Flutter UI, if any, runs as a separate process (as
flutter_vst3 does) or as a native view that talks to the engine. LV2 only on
request.

## Why

- VST3 lost its licensing hurdle on 2025-10-29; CLAP is MIT and
  supported by Bitwig, REAPER and FL Studio; AUv3 is the only route on
  iOS.
- Flutter has process-wide globals; two Flutter plugins in one DAW
  process break each other.
