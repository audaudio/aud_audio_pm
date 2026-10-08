# naming-001: Aud is the prefix of all classes

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's instruction at the plan review on
  2026-10-08 (R33)
- Open work: none

## Decision

Every public class of the aud_audio family carries the prefix `Aud`, in
Dart (`AudEngine`, `AudGraph`, `AudNode`, `AudParam`, `AudTransport`,
`AudSequence`, `AudKeyboard`, `AudArcKnob`) and in C++ (`AudEngine`,
`AudNode`, `AudProgram`, inside the namespace `aud`). C symbols of the
ABI and the build hooks use the prefix `aud_`. The plan and the
decisions write class names without the prefix for brevity — `Engine`
means `AudEngine` — and the implementation tickets use the prefixed
names.

## Why

- One recognizable prefix across packages, like AudioKit's former `AK`,
  avoids collisions with Flutter, the SDKs and the apps that use the
  engine, and makes the family's types searchable.
