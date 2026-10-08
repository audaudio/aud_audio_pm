# Requirements: the Audanika Audio Engine brief

Canonical source: the brief Gabriel Gatzsche handed over on 2026-10-07
for ticket 17 ("Konzipiere eine neue Audio Engine"). This file keeps its
requirements in English, one bullet per requirement, so that decisions
and plans can link to them as R1 … R28.

## Project management

- R1 The project is managed in a project management repo modeled on
  `aud_midi_pm`; it exists as `aud_audio_pm` in the GitHub organization
  `audaudio`.
- R2 The plan splits the project into tickets that are as independent
  as possible or build on each other.

## Goal and model

- R3 Plan a concept for the Audanika Audio Engine `aud_audio`.
- R4 Model: AudioKit (<https://github.com/AudioKit>) — build a
  "FlutterAudioKit".

## Platforms

- R5 Run on every platform Flutter supports: iOS, Android, macOS, Linux,
  Windows, Web.

## Graph

- R6 A package `aud_audio_graph` builds signal-flow graphs. Graphs are
  defined in Dart, the signal processing runs in C++.
- R7 The graph model orients itself on Max/MSP and Pure Data; The
  Amazing Audio Engine is a further reference.
- R8 The graph can process multithreaded to spread the load.
- R9 Besides audio, MIDI and other control data reach the processors.
- R10 Every node is reachable through a route and can be fed with data;
  OSC is the model or the solution.

## DSP packages

- R11 Dart DSP packages can be built and hooked into the processing
  chain; plugging in and routing audio between plugins happens in Dart.
- R12 Plugin packages bind into the audio graph.
- R13 C++ code compiles to WebAssembly so that DSP packages run on the
  web too.

## Audio IO

- R14 A package `aud_audio_io` offers cutting-edge multi-channel audio
  IO on all platforms, including web.

## Sequencer

- R15 A sequencer, modeled on AudioKitEX.

## Documentation

- R16 A documentation site `audaudio.github.io` that describes all
  essential functions.

## UI packages

- R17 `aud_audio_ui_graph_edit`: an editor for DSP chains, modeled on
  AudioKit Flow.
- R18 `aud_audio_ui_piano_roll`: a piano roll editor, modeled on
  AudioKit PianoRoll.

## DSP packages (content)

- R19 `aud_dsp_sampler`: an SFZ sampler derived from sfizz.
- R20 `aud_dsp_guitar_amp`: a tube guitar amp simulation, model
  DevoloopAudioKit.
- R21 `aud_dsp_effects`: oscillators, effects, filters, reverbs and
  more; models SoundpipeAudioKit and DunneAudioKit.
- R22 `aud_dsp_stk`: the Stanford Synthesis Toolkit physical models,
  model STKAudioKit.

## Plugin formats

- R23 Example packages that expose the engine as plugins:
  `aud_audio_vst3` (Windows + Linux) and
  `aud_audio_audio_unit_extension` (AUv3). The engine offers AUv3 as a
  plugin format and can be built as a VST3 plugin.

## Ableton Link

- R24 A package that brings Ableton Link into the ecosystem.

## Technical constraints

- R25 Dart and C++ communicate through Dart FFI.
- R26 No code is copied from libraries whose license does not allow
  free commercial use.
- R27 Code taken from open-source libraries keeps the required license
  notices.

## Open invitation

- R28 Propose further things.

## Added at plan review (2026-10-08)

- R29 `aud_audio_ui_controls`: knobs, sliders, wheels, ribbon, joystick
  and XY pad, modeled on AudioKit Controls
  (<https://github.com/AudioKit/Controls>).
- R30 `aud_audio_ui_keyboard`: a multi-touch musical keyboard, modeled on
  AudioKit Keyboard (<https://github.com/AudioKit/Keyboard>).
- R31 The DunneAudioKit nodes Chorus, Flanger, Stereo Delay and Synth
  (<https://www.audiokit.io/DunneAudioKit/documentation/dunneaudiokit>):
  the effects by name in `aud_dsp_effects`, the Synth as the package
  `aud_dsp_synth`; the sampler stays sfizz.
- R32 Plan the further suggestions of R28 as packages and steps
  (scope-001).
- R33 `Aud` is the prefix of all classes (naming-001).
- R34 A multitrack backing player with loop capability and tempo changes
  without pitch change (backing-001).

## Readings and name corrections

- The brief writes `aud_audio_prm`, `audio_audio_graph` and
  `audio_audio_ui_piano_roll`; the plan reads them as `aud_audio_pm`,
  `aud_audio_graph` and `aud_audio_ui_piano_roll`.
- The AUv3 shell of R23 is named `aud_audio_auv3` instead of
  `aud_audio_audio_unit_extension` (decided 2026-10-08).
- R11 reads as: a Dart DSP package is a Dart package that bundles C or
  C++ node code with a Dart API. Signal processing happens only in C or
  C++, never in Dart (confirmed at plan review, 2026-10-07;
  interop-001).
- Answers at plan review, 2026-10-07: all packages are MIT; LGPL code is
  not used in any form, alternatives are found instead (license-002).
