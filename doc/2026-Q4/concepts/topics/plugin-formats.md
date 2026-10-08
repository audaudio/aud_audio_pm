# Topic: plugin formats

Research for R23, sources fetched 2026-10-07. Which formats the engine
can be wrapped in, what each costs in licensing and architecture, and
what is known about Flutter inside a plugin.

## VST3

- Licensing changed on 2025-10-29: "Since version 3.8, VST 3 is
  licensed under the MIT license"; GPLv3 and the proprietary Steinberg
  license are no longer offered; no agreement to sign. VSTGUI and the
  mda example files stay under a BSD-like license. SDK 3.8.0 (2025-10-20),
  3.8.1 (2026-08-11).
- Trademark rules still apply: first use of "VST" carries ®, docs state
  "VST is a registered trademark of Steinberg Media Technologies GmbH.",
  no derivatives such as "VSTi", logo sizes when the logo is used.
- Platforms: Windows 8.1 to 11 (x86, x64, arm64), macOS 10.14 to 26,
  iOS 13 to 26, Linux (Ubuntu 24.04, GCC 13.3+).
- Model: processor and controller are separate objects; parameters are
  normalized doubles with 32-bit ids and reach the processor only inside
  the process call as sample-accurate queues; MIDI arrives as note
  events, CCs are mapped to parameters (`IMidiMapping2` for MIDI 2.0 in
  3.8); note expression per note; dynamic bus arrangements and
  side-chains.

## Audio Unit v3 (App Extensions)

- An AUv3 is an app extension with an `AUAudioUnit` subclass; the host
  loads it out of process (always on iOS, optionally in process on
  macOS with an `AudioComponentBundle` entry and host opt-in); XPC costs
  about 40 µs per render cycle. UI through `requestViewController`;
  MIDI through `scheduleMIDIEventBlock`, MPE supported; `osWorkgroup`
  for render threads. AUv2 is in maintenance mode.
- Memory: Apple staff named 360 MB for a 64-bit extension process
  (2015); developers measured more in GarageBand, but nothing is
  published — plan with 360 MB shared by all instances in one host.
- Extensions cannot use `UIApplication`, run no background tasks and
  talk to their container app only through App Groups.
- Flutter in app extensions: Flutter documents extension UI only where
  at least 100 MB are available, debuggable only in the simulator; no
  prior art of Flutter inside an AUv3 was found. Apple's own template
  pairs a SwiftUI view with a C++ DSP kernel.

## CLAP

- MIT, version 1.2.10 (2026-07-13), ABI-stable across 1.x. Events: note
  on/off/choke/end, per-note expressions, parameter value and
  modulation (per note), gestures, transport, MIDI 1 and 2, SysEx.
  Extensions: thread pool (`request_exec` inside `process`, host runs
  tasks, plugin needs a single-threaded fallback), surround, ambisonic,
  remote controls, preset load, undo, UIKit GUI (1.2.8), transport
  control and background activation (1.2.9).
- Hosts: Bitwig (initiator), REAPER (6.71+), FL Studio (2024.1+);
  Ableton Live has none; Studio One unverified.

## LV2

- ISC, Turtle metadata plus C headers, extensible; last tag v1.18.10
  (2022-09). Stable, slow, Linux-centric.

## Flutter and Dart inside a plugin

- `flutter_vst3` (BSD-3-Clause, 2025): a VST3 wrapper that runs the
  Dart part as a separate AOT process and talks to it over binary IPC —
  Dart never touches the host's audio thread, a plugin crash does not
  take the DAW down. macOS, Windows, Linux.
- `juce_flutter` (2026-03): embeds Flutter UIs in JUCE plugins; two
  in-process plugins with the same Flutter version show only the UI of
  the first one loaded, because Flutter has process-wide globals and
  fixed Objective-C names. Flutter issue 104144 (framework name
  collisions in one DAW process) was closed "not planned".

## What holds for aud_audio

- Order of formats: VST3 first (MIT, three desktop platforms), CLAP
  second (MIT, best event model, cheap once VST3 exists), AUv3 third
  (iOS and macOS, out-of-process, memory budget), LV2 only on request.
- In every format the plugin binary contains the C++ engine and a
  serialized graph; Dart runs out of process or not at all inside the
  host; a Flutter UI is a separate process or a native view — never
  Dart on the host's render thread. See decision plugin-001.

## Sources

- https://steinbergmedia.github.io/vst3_dev_portal/pages/VST+3+Licensing/Index.html
- https://steinbergmedia.github.io/vst3_dev_portal/pages/VST+3+Licensing/Usage+guidelines.html
- https://steinbergmedia.github.io/vst3_dev_portal/pages/FAQ/Licensing.html
- https://github.com/steinbergmedia/vst3sdk (LICENSE.txt, README, tags)
- https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Parameters+Automation/Index.html
- https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/About+MIDI/Index.html
- https://developer.apple.com/documentation/audiotoolbox/auaudiounit
- https://developer.apple.com/documentation/audiotoolbox/hosting-audio-unit-extensions-using-the-auv2-api
- https://asciiwwdc.com/2015/sessions/508
- https://developer.apple.com/forums/thread/8237, https://developer.apple.com/forums/thread/727732
- https://docs.flutter.dev/platform-integration/ios/app-extensions
- https://developer.apple.com/documentation/avfaudio/creating-an-audio-unit-extension
- https://github.com/free-audio/clap (LICENSE, ChangeLog.md, include/clap/events.h, ext/thread-pool.h)
- https://u-he.com/community/clap/, https://www.kvraudio.com/news/56611
- https://lv2plug.in/, https://github.com/lv2/lv2
- https://pub.dev/packages/flutter_vst3, https://github.com/MelbourneDeveloper/flutter_vst3
- https://forum.juce.com/t/juce-flutter-an-experimental-juce-flutter-bridge/68390
- https://github.com/flutter/flutter/issues/104144
