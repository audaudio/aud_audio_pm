# 60: aud_midi_core: contract suite, capability fix, one clock

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4, 5 and 7); awaits the user's confirmation. Phase 7 of the plan; size M;
depends on nothing. Numbered here; decisions in `aud_midi_pm`.

## Goal

The backend contract is proven by every backend, not only by the fake.
`aud_midi_core/lib/testing.dart` ships a parameterised contract suite —
start and stop, ports, open and close, send, cancel, hot-plug, taps,
capabilities — that the five platform backends and the network and BLE
backends run against their loopbacks; the optional interfaces
(`MidiNativeTapBackend`, `MidiBluetoothSystemPicker`) discovered with `is`
are documented in the contract file. The capability merge bug is fixed:
`MidiCompositeBackend.capabilities` reports `scheduling: hardware` only
if every active backend does, and the network and BLE backends omit the
field, so every platform with a network or BLE backend reads `software`;
every backend declares its scheduling, the merge takes the best of the
OS backends, and the `virtualPorts` merge no longer depends on the enum
order. The 10 s resync timer around `MidiClockMapper`, re-implemented in
the Apple, Android, Windows and Linux backends, becomes `MidiNativeClock`
in the core; `LinuxMidiBackend` loses its `bluetooth:` parameter, which
duplicates the umbrella's composition. Serves the audmidi goal of one
contract for every platform.

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_midi_core`: the testing library, the fix, `MidiNativeClock`, the
  contract docs; minor version.
- `aud_midi_network`, the BLE backend: declare `scheduling`; patch.
- `aud_midi_apple`, `aud_midi_android`, `aud_midi_windows`,
  `aud_midi_linux`, `aud_midi_web`: run the suite, use the clock; patch
  versions (windows and linux after ticket 59).
- `aud_midi`: `Midi.capabilities` tested per platform; patch.
- `aud_midi_pm`: decision `backend-001` (the contract suite is the
  definition of a backend).

## Steps

1. The fix with a regression test on the composite.
2. The suite; the fake runs it first.
3. The backends run it on their loopbacks (Apple on CoreMIDI, Android on
   the emulator, web on Chrome; Windows and Linux after ticket 59).
4. The clock; the Linux parameter.

## Open questions

- Do the suite's hot-plug cases need a virtual port the backend creates,
  or a fake device per platform? Proposal: the backend's own virtual
  ports where dynamic, skipped where static.
