# Topic: the legacy audio engine

What the current Audanika audio engine does, how it is built, and what
the new engine keeps or drops. Source: the `audio_engine` repo of the
`audanika-legacy` organization, inspected 2026-10-07.

## Shape

- A Flutter plugin `audio_engine` for iOS and Android only. Dart API:
  `init(assetDirInMainBundle)`, `playMidi(Uint8List)`, `loadPreset(id)`,
  `selectedPreset()`, `presets()`; a `StubAudioEngine` serves the other
  platforms and the tests.
- Native entry through a `MethodChannel` (`init`, paths) plus `dart:ffi`
  for the hot path (`playMidi`, presets) into `libaudio_engine.so` on
  Android and the process on iOS.
- The C++ core is the Soundprism code base (Fraunhofer IDMT 2010
  heritage, namespace `audanika::soundprism::core`): `Application`,
  `Core` with `Audio`, `Midi`, `Osc`, `Presets`, an XML data model
  (`XmlObjectCNC`); about 575 source files in `libcore`, `libsampler`,
  `libutil`, `libmacutils`, `libpostoffice` and `typedefs`.

## Sampler and effects

- `libsampler`: `CppSampler`, `Instrument`, `SampleSet` / `SampleInfo`,
  `WavFileCache`, voice limits, per-channel `AudioChannel`, the effects
  `Reverb` (Freeverb `comb` / `allpass`), `Delay`, `Compressor`, and a
  `MasterAuPipeline`.
- iOS renders through `AudioUnitSampler` (AVFoundation, Audio Units),
  Android through `AndroidSampler` on Oboe (`IRenderableAudio`, a
  latency tuning callback).
- Sounds are WAV sample sets described in XML; presets such as
  `AUD007871_Welcome_Combi.preset` are listed and selected by id.

## Sync and control

- Ableton Link is compiled in (`3rd/link`, `AbletonLink.cpp`); the iOS
  target is a "linkEdition".
- MIDI enters as raw bytes; the app adapts the engine as a `MidiTarget`
  (`AudioEngineAdapter`) that forwards `MidiEvent`s one by one.
- OSC exists in the core (`Osc`); XML is parsed with `die-xml`.

## What holds, what goes

- Holds: MIDI as the input language of instruments, presets as the
  user-facing unit, Link sync, Oboe on Android, render callbacks on a
  real-time thread, a stub engine for tests.
- Goes: the MethodChannel, the Flutter dependency of the engine, the
  fixed sampler pipeline, XML as the graph description, the iOS/Android
  limit, the single process-wide `Application`.
