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

Added 2026-10-09 for the spike S0-plugin-ui (ticket 23):

- `flutter_vst3` does not embed its editor: its view
  (`native/src/plugin_view.cpp`) starts the Flutter UI app as an
  external window when the host attaches the view, with a fixed size and
  no IPC in the view. Its process split covers the Dart audio code.
- macOS has no public API to show a view of another process inside a
  host's view. What remains: render into IOSurfaces that the plugin's
  view shows and forward the input, or keep a window of the other
  process over the editor. AUv3 gets the remote view from the system.
- Windows allows a parent and child window in two processes, but the
  input queues of both threads are joined: a hung child can stall the
  parent's UI thread (Raymond Chen, 2013).
- Flutter 3.47 (August 2026): Impeller is the default renderer on the
  desktop; the desktop multi-window API is still experimental (main
  channel and a flag), so one engine serving several editor windows is
  not yet a stable option.
- `dart:io` supports Unix domain sockets on Windows since Dart 3.11, so
  one socket transport serves macOS and Windows.

Added 2026-10-09 by the spike S0-plugin-ui (ticket 24), on macOS 27 with
Flutter 3.47.5, VST3 SDK 3.8.1, REAPER and a test host:

- FlutterMacOS.framework exports only its Objective-C API; the embedder C
  API with a custom compositor is internal, and the stand-alone
  FlutterEmbedder.framework exists for macOS only as a debug build for
  x64. A release editor renders through `FlutterView` in a window; its
  IOSurface-backed layers are the frames another process can be given.
- Shared IOSurfaces work as the embedding across processes: the editor
  copies each frame into a pool of three surfaces, sends them as Mach
  ports (rendezvous through `bootstrap_check_in` and `bootstrap_look_up`
  under a random name), and the plugin's view shows them as layer
  contents and forwards the input over the socket. The editor's share of
  a parameter change is about 0.35 ms.
- One Flutter engine can drive several views on macOS, but turning it on
  is private in 3.47 (`enableMultiView`, which the experimental windowing
  API calls). Without it each editor needs an engine of its own.
- An agent app (`LSUIElement`) that a plugin starts with `posix_spawn`
  becomes the active app. The DAW turns inactive, and REAPER closes its
  audio device while its transport stops. A helper app must start
  background-only (`LSBackgroundOnly`) and become an accessory after
  launch, which does not activate it.
- Flutter in process works with a renamed copy of FlutterMacOS per plugin
  build (byte-replaced names of the same length, re-signed): two plugins
  with Flutter 3.47.5 and 3.44.9 run in one process, and the latency is that
  of a separate process (1.5 ms from input to the processor). But Dart runs
  on the DAW's main thread (platform and UI threads are merged), starting
  an engine there stalls the DAW's UI for up to 214 ms, the framework keeps
  about 40 MB after the last editor closes, and closing such an editor
  crashed REAPER three times inside Flutter's compositor: a present that
  `ResizeSynchronizer` scheduled for a later vsync ran after the engine
  had shut down. Keeping the view controller and the engine for 200 ms
  after the view closes avoided it in 100 cycles.
- A probe that takes the input's time stamp in a global pointer route of
  Flutter gets the previous event's: the framework runs the global routes
  after the widgets. The spike's first B numbers (18 ms) were this
  artifact; the stamp belongs into `PlatformDispatcher.onPointerDataPacket`.
- Two plugin builds in one process collide without symbol hygiene: the
  Objective-C runtime takes the class of whichever image loaded first.
  Runtime-created classes with a random suffix, hidden visibility and an
  exported-symbols list with the three VST3 entry points avoid it; the
  VST3 SDK's own host did not coalesce weak C++ symbols across bundles.
- RealtimeSanitizer cannot run inside a notarized DAW: its interceptors
  need the runtime at process start, and a hardened runtime without
  `allow-dyld-environment-variables` ignores `DYLD_INSERT_LIBRARIES`.
  A test host carries it.
- REAPER is scriptable for measurements: a ReaScript passed on the
  command line, `-cfgfile` for a resource folder of its own, `-newinst`,
  started through LaunchServices so that its windows are in front (an
  occluded window stops Flutter's frames). An empty project stops playing
  at once; a loop range keeps the transport running.

## What holds for aud_audio

- Order of formats: VST3 first (MIT, three desktop platforms), CLAP
  second (MIT, best event model, cheap once VST3 exists), AUv3 third
  (iOS and macOS, out-of-process, memory budget), LV2 only on request.
- In every format the plugin binary contains the C++ engine and a
  serialized graph; Dart runs out of process or not at all inside the
  host; a Flutter UI is a separate process or a native view — never
  Dart on the host's render thread. See decision plugin-001.
- The editor on macOS and iOS: decision plugin-003, after the spike
  S0-plugin-ui (ticket 24).

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
- Added 2026-10-09:
  https://github.com/MelbourneDeveloper/flutter_vst3/blob/main/flutter_vst3/native/src/plugin_view.cpp,
  https://devblogs.microsoft.com/oldnewthing/20130412-00/?p=4683,
  https://flutter.dev/blog/whats-new-in-flutter-3-47,
  https://flutter.dev/blog/desktop-windowing-apis,
  https://dart.dev/changelog
