# Requirements: the audaudio and audmidi packages as a framework

Area `framework`. Source: open question 1 of
[ticket 40](../2026-Q4/tickets/2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md)
and the
[architecture review of 2026-10-25](../2026-Q4/concepts/topics/review-2026-10-25-architecture.md);
engineered with the user and accepted on 2026-10-25, before ticket 41.

The requirements hold for the packages of both families, audaudio and
audmidi, unless a requirement names one. They serve app developers who
build on the packages, authors of DSP packages outside the engine repos,
the maintainers of the families and the users of the plugins.

## req-framework-001: No API without an implementation

- Status: accepted
- Priority: must
- Statement: A package exports no API that it does not implement
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R35),
  review sections 1 and 6
- Acceptance:
  - no package of the families exports a symbol of the `dart create`,
    `package_ffi` or Flutter templates (`sum`, `sumAsync`,
    `sum_long_running`)
  - a package without code exports its version only
- Tickets: 41

## req-framework-002: Every README says the state and the platforms

- Status: accepted
- Priority: must
- Statement: The README of every package says whether the package is
  planned or implemented and on which platforms it runs
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5,
  R35), review sections 1 and 2
- Acceptance:
  - every README has a state line and a list of platforms
  - both match the entry of the package in `packages.jsonc`
- Tickets: 41, 42, 62

## req-framework-003: The dependencies follow the package graph

- Status: accepted
- Priority: should
- Statement: A package depends only on the packages of the families that
  the package graph gives it
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R35),
  review sections 1 and 4, decision ui-003
- Acceptance: the `aud_*` dependencies of every `pubspec.yaml` equal the
  edges of the package in `packages.jsonc`
- Tickets: 41

## req-framework-004: The exported API is documented

- Status: accepted
- Priority: should
- Statement: Every exported symbol of a published package has API
  documentation
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R16),
  review section 2
- Acceptance: the lint `public_member_api_docs` reports nothing in any
  published package
- Tickets: 42, 58

## req-framework-005: The platform setup is documented

- Status: accepted
- Priority: should
- Statement: A package with native code documents the setup each of its
  platforms needs
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5,
  R16), review section 2
- Acceptance: the README names, for every platform the package lists, the
  permissions, the build settings and the minimum OS version
- Tickets: 42

## req-framework-006: Native code compiles in CI on its platforms

- Status: accepted
- Priority: must
- Statement: Every native source of a package compiles in CI on every
  platform the package lists
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5),
  review section 8, CI
- Acceptance: a pull request cannot be merged while the build of one
  listed platform fails
- Tickets: 44, 59

## req-framework-007: Platform tests run in CI on their platform

- Status: accepted
- Priority: should
- Statement: The platform-specific tests of a package run in CI on their
  platform
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5),
  review section 8, CI
- Acceptance: every test file with `@TestOn` runs in the CI matrix
- Tickets: 44, 59

## req-framework-008: The realtime checks run in CI

- Status: accepted
- Priority: could
- Statement: The realtime checks of the native code run in CI
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R8,
  R23), review section 8, CI
- Acceptance: the RTSan and TSan builds and the VST3 validator run on
  every pull request
- Tickets: 44

## req-framework-009: Every package resolves without SSH keys

- Status: accepted
- Priority: must
- Statement: Every package of the families resolves on a machine without
  GitHub SSH keys
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R35),
  review section 8, versioning, decision repos-001
- Acceptance: `dart pub get` succeeds for every package in a CI job
  without SSH keys
- Tickets: none planned yet

## req-framework-010: A DSP node needs its DSP code and one description

- Status: accepted
- Priority: should
- Statement: Adding a node to a DSP package needs only its DSP code and
  one description of its ports and parameters
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R11,
  R12, measure "DSP packages built outside the engine repos"), review
  sections 4 and 7
- Acceptance: a new node in `aud_dsp_effects` changes no hand-written
  file besides its DSP code and its description
- Tickets: 45, 46

## req-framework-011: One exception type for every failure

- Status: accepted
- Priority: should
- Statement: An app catches every failure of the audaudio packages with
  one exception type
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md),
  review section 8, errors and logging
- Acceptance: every error the audaudio packages throw extends one base
  type
- Tickets: 50

## req-framework-012: The log output reaches the app's sink

- Status: accepted
- Priority: could
- Statement: An app can route the log output of every package to its own
  log sink
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md),
  review section 8, errors and logging
- Acceptance: one call redirects the log output of every package
- Tickets: 50

## req-framework-013: A member's patch needs no umbrella release

- Status: accepted
- Priority: should
- Statement: A patch release of a member package reaches the apps without
  a release of the umbrella package
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md),
  review section 8, versioning, decision family-002
- Acceptance: the umbrella depends on its members with caret ranges
- Tickets: none planned yet

## req-framework-014: CI checks the third-party notices

- Status: accepted
- Priority: must
- Statement: CI fails when a vendored file is not covered by the notices
  of its repo
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R27,
  measure "every copied line of third-party code carries its notice"),
  review section 8, licenses
- Acceptance: the notice check runs in CI in every repo with third-party
  code
- Tickets: 43

## req-framework-015: The notices reach the app's license page

- Status: accepted
- Priority: should
- Statement: An app built on the packages shows the notices of all their
  third-party code on Flutter's license page
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R27),
  review section 8, licenses
- Acceptance: `showLicensePage` of an app on `aud_audio` lists miniaudio,
  Oboe, sfizz, QuickJS-ng and every other vendored library
- Tickets: 43

## req-framework-016: Every repo carries the plain MIT text

- Status: accepted
- Priority: must
- Statement: Every repo of the families carries the plain MIT license text
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md),
  the answers at plan review of 2026-10-07 (all packages are MIT), the
  user's answer to open question 4 of ticket 40 on 2026-10-25
- Acceptance: no `LICENSE` file of the families contains "All Rights
  Reserved"
- Tickets: 43
