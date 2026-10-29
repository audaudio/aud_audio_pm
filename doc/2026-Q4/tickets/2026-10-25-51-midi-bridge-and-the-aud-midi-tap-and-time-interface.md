# 51: MIDI bridge and the aud_midi tap and time interface

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4, 5 and 7); awaits the user's confirmation. Phase 4 of the plan; size M;
continues step S8 (ticket 26); depends on nothing. A cross-family ticket
like 26: numbered here, its decisions recorded in `aud_midi_pm`.

## Goal

The seam between the two families is a declared interface, not a set of
copies. `aud_midi_core` ships one canonical `aud_midi_tap.h` — the C
signature of the native tap with its kind constants, versioned — that
`aud_midi_apple`, `aud_midi_android` and `aud_audio_with_midi` include instead
of their three typedefs; `aud_midi` offers the conversion between
`MidiTime` and the host clock the tap stamps with (`hostTimeNs`), so that
the bridge's `AudMidiClock`, a second copy of `MidiClockMapper`, goes;
`aud_midi` raises `MidiClosed` and `MidiHostLost` from its sealed
exception hierarchy instead of `StateError`, and `supportsNativeTap` is
answered per port as the contract says. On the bridge's side
`AudMidiAdapter` takes an `AudEventSourceFfi` instead of three raw
addresses, `AudMidiBridge` registers with an explicit `start()` instead of
in its constructor, `AudMidiOutput.close()` is idempotent, the two MIDI
1.0 parsers (`aud_midi_parser.cpp` and `midi_byte_parser.dart`) run one
shared file of conformance vectors, the package gets an `example/` and
`packages.jsonc` lists its real dependencies. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R9: MIDI reaches the
processors).

## Requirements

No accepted requirement covers it yet; the area
[framework](../../requirements/framework.md) of 2026-10-25 does not.
Engineer its requirements before the ticket is planned.

## Affected repos

- `aud_midi_core`: `aud_midi_tap.h`, the per-port tap contract; minor.
- `aud_midi`: the time conversion, the exceptions, `supportsNativeTap`
  per port; minor.
- `aud_midi_apple`, `aud_midi_android`: include the header; patch.
- `aud_audio_with_midi`: the adapter, the lifecycle, the vectors, the example;
  minor.
- `aud_midi_pm`: decisions `native-002` (the tap header) and `time-001`
  (the host-time conversion); `aud_audio_pm`: `packages.jsonc`.

## Steps

1. The tap header and the time API in audmidi, released first (the audio
   family takes audmidi from pub.dev).
2. The bridge on them; `AudMidiClock` deleted.
3. The adapter, the lifecycle, the idempotent close; the vectors shared
   through a test fixture both repos copy from `aud_midi_standard`.
4. The example, the manifest, the decisions.

## Open questions

- Where do the conformance vectors live so that both families read one
  file? Proposal: `aud_midi_standard/test/vectors`, published with the
  package, read by the bridge's native test through the package config.
