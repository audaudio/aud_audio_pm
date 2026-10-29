# midi-002: External MIDI reaches the audio thread through native taps

- Status: accepted
- Date: 2026-10-12
- Canonical source: tickets/2026-10-12-26-bridge-aud-midi-ports-into-the-engine-on-ios-and-android.md
  (scope 4, the rule of the plan review; Measurements)
- Refines: [midi-001](midi-001.md) — how `aud_audio_with_midi` bridges the ports
- Open work: the numbers of the iPad Pro M5 and a Pixel; USB and Bluetooth
  hardware on the reference devices; native taps of the desktop backends
  with S3b

## Decision

`aud_audio_with_midi` bridges an input port of `aud_midi` into the engine as an
`aud.midi.input` node fed by an event source of the graph (interop-003). On
CoreMIDI and `android.media.midi` the backend's receive thread calls a
native tap (native-001 of `aud_midi_pm`), and the tap's adapter pushes the
UMP with its host timestamp into the source; no Dart runs between the
device and the audio thread. Ports of backends without a native tap, and
inputs that ask for it, take the Dart path: the bridge receives the
packets in Dart and pushes them through the same adapter. The rule of the
plan review decided it: the native tap becomes the default when a Dart
path's p99 delivery delay exceeds the margin of 1 ms or its late share
0.1 % on any device. Both Dart paths missed it on both devices.

| Ten minutes under load (UI animation, garbage collection) | iPhone 16 Pro Max | Galaxy Tab S4 |
| --- | --- | --- |
| Native tap: delivery delay p50 / p99 / p99.9 / max | 0.1 / 0.25 / 0.35 / 6.4 ms | 0.35 / 1.4 / 5.85 / 29.8 ms |
| Dart, one hop: p50 / p99 / p99.9 / max | 0.2 / 0.55 / 4.7 / 14.5 ms | 0.95 / 5.5 / 25 / 61.7 ms |
| Dart, two hops (today's API): p50 / p99 / p99.9 / max | 0.2 / 5.25 / 12.2 / 41.3 ms | 1.7 / ≥ 25 / ≥ 25 / 144 ms |
| Late share at the same C: native / one hop / two hops | 0.35 / 0.59 / 2.4 % | 0.02 / 19.6 / 5.9 % |

Through the bridge, ten minutes after a twenty-minute warm-up, the native
tap played 0 late events on the iPhone (C 27.3 ms constant) and 0.05 % on
the tablet (C 41.7 ms, jitter below 1.5 ms).

## Why

- The Dart paths share the garbage collector and the event loop of the
  app's isolate group; their tails reach tens of milliseconds under load
  and grow with the app, while the native tap stays within a fraction of
  a block.
- The fixed latency of midi-003 hides a delivery delay only up to its
  margin; a path with a long tail turns into late events and jitter.

## Consequences

- The aud_midi family carries native code for the taps: a C shim on
  Apple, a JNI library on Android (native-001); the bridge carries the
  adapter and the MIDI 1.0 byte parser.
- An app that disposes the engine first closes the adapters
  synchronously, then detaches the taps in the background (the engine's
  extensions).
