# 61: aud_midi API consistency

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4, 5 and 7); awaits the user's confirmation. Phase 7 of the plan; size M;
depends on ticket 60. Numbered here; decisions in `aud_midi_pm`.

## Goal

The audmidi API follows one set of rules. Naming: naming-001 of
aud_midi_pm ("all public types carry the Midi prefix") is either amended
to allow the platform-first names the backends use (`AppleMidiBackend`,
`WindowsMidi*`, `WebMidi*`, `Alsa*`) or the backends rename; decided once,
applied everywhere, and the relation to the audio family's `Aud*` stated.
Exports: the backends export their public surface only — the backend
class, the advertiser, the picker — and move `*_native.dart`, the setup
code, the shim records and the JNI platform tables behind a `testing`
library (apple 15, android 24, windows 13 exported files today); the
Android jnigen bindings (26.9k lines, Wi-Fi and NSD classes wholesale)
are restricted to the used members. The umbrella composes two network
session backends so that an app offers AppleMIDI and Network MIDI 2.0 at
once instead of choosing one process-wide (network-001); `withBackend` is
marked experimental; the backend names that route everything as strings
become an enum or typed keys; transport detection on Apple reads the
device properties instead of the driver-owner string, and the fingerprint
gains the serial number where the OS gives one. Serves the audmidi goal.

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_midi_pm`: naming-001 amended or confirmed; network-001 refined.
- `aud_midi`: the two network backends, `withBackend`, the typed backend
  keys; minor version.
- `aud_midi_core`: the keys; patch.
- `aud_midi_apple`, `aud_midi_android`, `aud_midi_windows`,
  `aud_midi_linux`, `aud_midi_web`: the exports, the names, the jnigen
  allowlist, the transport detection; minor versions (a rename breaks).
- `aud_midi_network`: two instances per process; patch.

## Steps

1. The naming decision with the user.
2. The exports and the testing libraries; the jnigen allowlist.
3. The two network backends in the composite; the interop test of the
   network package run once against an Apple driver.
4. The typed keys; the transport detection; the fingerprint.

## Open questions

- Rename the backends (a breaking change for every consumer of a backend
  class, which only the umbrella and tests are) or amend the decision?
  Proposal: amend — platform-first names read better for backend types.
