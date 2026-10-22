# release-005: macOS joins with the Audanika Mac app, Apple silicon only

- Status: accepted
- Date: 2026-10-20
- Canonical source: Gabriel Gatzsche's request and answers at the planning
  of ticket 37 on 2026-10-20
- Refines: [release-001](release-001.md) — answers its open work, when
  macOS joins
- Related: [plugin-005](plugin-005.md) — the VST3 inside the Mac app
- Open work: Intel Macs (x86_64); the CI gate for macOS

## Decision

macOS joins the releases with ticket 37: the Audanika app ships as a Mac app
through TestFlight and the Mac App Store, with its VST3 plugin inside
(plugin-005). App, plugin and the native code of the family are built for
Apple silicon (arm64) only; Intel Macs may follow in a ticket of their own.
`aud_audio_io` gets its macOS device for it — the macOS part of S3b — and
the macOS part of S18 makes `aud_audio_vst3` a shell that plays Audanika.
Windows and Linux stay with S3c, S3d and S18 as planned.

## Why

- The user's priority of 2026-10-20: Audanika as a VST3 plugin, shipped
  with its Mac app.
- macOS shares the Apple code path with iOS and is the development machine
  (release-001), so the app needs mostly its device backend and its
  packaging.
- Every Mac sold since 2023 has Apple silicon; arm64 alone halves the
  native builds of sfizz, QuickJS-ng and the graph and needs no Intel Mac
  for the tests.
