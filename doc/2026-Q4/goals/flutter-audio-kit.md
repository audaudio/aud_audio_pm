# Goal: a FlutterAudioKit — the Audanika Audio Engine

## What the quarter is meant to achieve

Audanika needs an audio engine that runs on every platform Flutter
supports: iOS, Android, macOS, Linux, Windows and Web. The model is
AudioKit: an ecosystem of packages — engine, DSP nodes, UI widgets,
sequencer, plugin shells — rather than one monolithic library. Signal
processing runs in C++, the graph is defined and controlled in Dart.

In 2026-Q4 the goal is the concept and the ticket plan (ticket 17) plus
the first implementation tickets: the engine core with graph and audio IO
on all six platforms, so that every later DSP, UI and plugin package has
a stable foundation.

## Why

- The legacy `audio_engine` plugin is iOS/Android only, Flutter-bound,
  MethodChannel plus FFI, built around one fixed sampler pipeline. It
  cannot carry desktop, web, plugin formats or third-party DSP.
- The new Audanika app family (`aud_*`) and the `aud_midi` family are
  Dart-first; the audio engine has to meet them at the same level.
- A graph engine with pluggable DSP packages lets Audanika and others
  build instruments and effects without touching the engine.

## Measures of success

- One Dart API, one graph model, six platforms, one example app that
  plays the sampler through a reverb from a MIDI keyboard on each of
  them.
- DSP packages built outside the engine repos plug into the graph
  without changes to the engine.
- Every copied line of third-party code carries a permissive license and
  its notice.

## Tickets serving this goal

See the plan of ticket 17:
[the plan of ticket 17](../tickets/2026-10-07-17-audanika-audio-engine.md).
