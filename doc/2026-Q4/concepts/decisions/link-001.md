# link-001: Ableton Link behind a transport interface, in its own package

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/ableton-link.md (R24)
- Open work: research Link Audio (Link 4.0,
  `LinkAudio.hpp`, `ABLLinkAudioSource`) before the `Transport`
  interface is frozen, so that an audio-source role can be added
  without breaking it

## Decision

`aud_audio_graph` defines a `Transport` interface (tempo, beat and phase at a
host time, start/stop, quantum) that the sequencer and the nodes consume.
`aud_audio_link` implements it with Ableton Link 4.x on macOS, Windows, Linux
and Android (compiled from source) and with LinkKit on iOS (including the
mandatory settings UI). It registers as a transport provider through the C ABI
(time-001): capture and commit of the audio session state on the callback
thread, the app session state on the control thread, Link's callbacks
forwarded into the event ring buffer; quantum, start/stop sync,
request-beat-at-time and tempo setting are exposed on the Dart `Transport`.
Android acquires a Wi-Fi multicast lock through a small JNI shim; iOS carries
the multicast entitlement and LinkKit's settings view. Nothing of Link's
source is copied into MIT packages — the sample-to-host-time filter is our
own. The package carries Link's license terms (GPL-2.0-or-later or
Ableton's proprietary license), does not redistribute Link or LinkKit
and tells app publishers to obtain their own license (link-002); it is
never a dependency of the engine or the umbrella; apps add it
explicitly. On the web the app provides the transport.

## Why

- Link's licensing must not spread into MIT packages.
- The sequencer must work without Link (tests, web, plugins hosted in a
  DAW that already has a transport).
