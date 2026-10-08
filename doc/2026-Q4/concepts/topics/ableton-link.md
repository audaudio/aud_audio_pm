# Topic: Ableton Link

Research for R24, sources fetched 2026-10-07.

## Facts

- License: GPL-2.0-or-later with a proprietary option on request
  ("please contact link-devs@ableton.com"); the price is unpublished.
  The legacy Audanika engine ships Link ("linkEdition"), so a license
  relationship exists — to be confirmed.
- Releases: Link 4.1 (2026-09-23, asio-standalone 1.38.2), 4.0
  (2026-05-04, "Link Audio"), 3.1.5 (2025-12). Header-only C++, CMake
  target `Ableton::Link`, platforms macOS, Windows, Linux; `abl_link` C
  API including Link Audio since 4.0.
- iOS: LinkKit (`LinkKit.xcframework`, 4.1.2 of 2026-09-23, iOS 15+)
  under the Link SDK license: free of charge, no redistribution of the
  SDK, no Link as in-app purchase, mandatory preference pane UI, the
  `com.apple.developer.multicast` entitlement; GPL Link "is not
  compatible with the iOS App Store".
- Android: no official SDK; developers build the cross-platform source
  themselves. Web: no official build; browsers lack the UDP multicast
  Link needs.
- API: session state is beat, time and tempo plus start/stop;
  `captureAudioSessionState` / `commitAudioSessionState` only from the
  audio thread, `captureAppSessionState` / `commitAppSessionState`
  never from it (they may block); quantum, peer count, tempo, peer and
  start/stop callbacks; `HostTimeFilter` maps sample clock to host time.

## What the engine must provide for Link

From the Link API documentation (ableton.github.io/link) and its example
app LinkHut:

- A host clock: Link measures time with the platform's monotonic clock
  (`Link::clock().micros()`); beats are mapped to this clock, never to
  sample counts.
- The output time of each buffer: LinkHut maps the buffer's sample time
  to host time with `HostTimeFilter` (a linear regression over the
  callback times) and adds the device's output latency; every sample's
  beat is `beatAtTime(outputTime + i * sampleDuration, quantum)`.
  Without the latency term the sync is off by the buffer size.
- Exactly one realtime capture per block: `captureAudioSessionState`
  and `commitAudioSessionState` are lock-free but belong on the audio
  thread only, once per callback; `captureAppSessionState` and
  `commitAppSessionState` may block and are for the app thread.
- A quantum per app (beats per phase cycle, usually one bar) and phase
  alignment: `requestBeatAtTime(beat, time, quantum)` aligns a local
  beat with the session's phase (quantized launch); `forceBeatAtTime`
  only when alone, because it disrupts peers.
- Start/stop sync (opt-in, `enableStartStopSync`): `isPlaying`,
  `setIsPlaying(bool, atTime)`, `setIsPlayingAndRequestBeatAtTime`.
- Callbacks for tempo, peer count and start/stop arrive on Link's own
  threads; the engine must hand them over asynchronously.
- Platform duties: Android needs a Wi-Fi multicast lock and is built
  from the Linux platform sources; iOS uses LinkKit with the multicast
  entitlement and the settings view; browsers cannot run Link (no UDP
  multicast).
- Link 4.0 added "Link Audio" (`LinkAudio.hpp`, `ABLLinkAudioSource` in
  LinkKit 4.1); its semantics are not researched yet.

## What holds for aud_audio_link

- Its own package with its own license terms; the engine depends on an
  abstract `Transport` / `Clock` interface in `aud_audio_graph`, and
  `aud_audio_link` is one implementation. Apps that cannot accept GPL
  and have no proprietary license simply leave the package out.
- Audanika holds no Link license (2026-10-08). The package does not
  redistribute Link or LinkKit; its build hook fetches them at build
  time, and the package tells app publishers that they need their own
  license from Ableton or must comply with the GPL (link-002).
- Desktop and Android through the C++ library, iOS through LinkKit with
  the required UI, web without Link (a fallback that reads tempo from
  the app).
- The sequencer (R15) consumes the transport interface, not Link
  directly.

## Sources

- https://github.com/Ableton/link (LICENSE.md, README.md, releases)
- https://ableton.github.io/link/
- https://ableton.github.io/linkkit/, https://github.com/Ableton/LinkKit (LICENSE.md, releases)
- https://cdm.link/2016/09/ableton-opening-link-everyone-starting-today/
