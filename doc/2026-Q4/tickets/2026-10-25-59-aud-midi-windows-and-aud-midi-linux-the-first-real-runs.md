# 59: aud_midi_windows and aud_midi_linux: the first real runs

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
1 and 8); awaits the user's confirmation. Phase 7 of the plan; size M;
depends on ticket 44. Numbered here as tickets 26 and 39 were; decisions
in `aud_midi_pm`.

## Goal

The two backends that were written but never ran do run. `aud_midi_windows`
(3.1k lines of C++/WinRT compiled so far only against stand-in headers)
builds against the real Windows SDK through its hook, its
`@TestOn('windows')` tests pass on the development PC and in the Windows
job of ticket 44, loopback through a virtual cable plays, the Windows MIDI
Services path is tried where the service exists, and the UDP loss of
ticket 39 is settled on the way, since network MIDI on Windows depends on
it. `aud_midi_linux` runs on a Linux machine or VM: the ALSA sequencer
loopback through `snd-seq`, the `@TestOn('linux')` FFI tests, BlueZ and
Avahi against the real daemons, UMP on a kernel 6.5 or later. The
architecture's verification matrix and the READMEs say what was verified.
Serves the goal of the audmidi family (MIDI on six platforms) and
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R5, R9).

## Requirements

From the area [framework](../../requirements/framework.md), accepted
2026-10-25:

- req-framework-006: Native code compiles in CI on its platforms
- req-framework-007: Platform tests run in CI on their platform

## Affected repos

- `aud_midi_windows`: the fixes the real build finds, the shim build test
  no longer skipped where vcvars is found, `tool/test_native_core.sh`
  ported to Node.js; minor version.
- `aud_midi_linux`: the fixes the real run finds; minor version.
- `aud_midi_network`: ticket 39's fix or workaround; patch.
- `aud_midi_pm`: the verification matrix, the decisions the runs produce.

## Steps

1. Windows: the hook build on the development PC; the tests; the
   loopback; the CI job green.
2. Ticket 39 (the UDP loss) decided: the cause or the workaround.
3. Linux: a VM with `snd-seq`, BlueZ and Avahi; the tests; the loopback;
   the CI job with ALSA green.
4. The matrix and the READMEs.

## Open questions

- Which Linux: a VM on the Mac, the development PC in dual boot, or a
  cloud runner? The BLE part needs real Bluetooth hardware.
