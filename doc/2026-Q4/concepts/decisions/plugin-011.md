# plugin-011: The AUv3 is an extension of the app on macOS and iOS, built on aud_audio_auv3

- Status: accepted
- Date: 2026-10-25
- Canonical source: Gabriel Gatzsche's choices at the planning of ticket 41
  on 2026-10-25 (macOS and iOS, the requirements `auv3`, the plan with its
  proposed answers), tickets/2026-10-25-41-ship-audanika-as-auv3.md
- Refines: [plugin-001](plugin-001.md) — the AUv3 on iOS and macOS;
  [release-003](release-003.md) — M3, widened to macOS
- Related: [plugin-005](plugin-005.md) — the VST3 in the same Mac app;
  [plugin-006](plugin-006.md) — the shell's configuration;
  [plugin-010](plugin-010.md) — the shared core;
  [plugin-012](plugin-012.md) — its editor
- Open work: the identity in hosts once shipped; the memory on the iPhone
  (req-auv3-005, ticket 41 step 10)

## Decision

The Audanika app carries the AUv3 as an app extension on macOS and iOS
(`Contents/PlugIns` and `PlugIns`), shipped, signed and updated with the
app through TestFlight and the stores; it needs no consent step, the
system registers it with the app. Its identity: name "Audanika", type
`aumu`, manufacturer `Audn`, subtype `Audk`, extension bundle id
`com.audanika.auv3` on both platforms; hosts store the codes in every
project, so they never change. The Audio Unit is the shell of
`aud_audio_auv3` over `aud_audio_plugin`: its build tool turns the app's
configuration, document and presets into a static library per platform
(macOS arm64, iOS arm64, iOS simulator arm64) and an `.xcconfig` with the
identity, which the app's extension target links without code of its own.
Host MIDI, parameters, presets and state follow plugin-006 and app-009;
the 28 presets are the `factoryPresets`, the state is `fullState`. The
extension finds the content inside itself (see below) and sets the sample
cache budget of its process per platform from `plugin.json`, so all
instances of a host share one budget. No `AudioComponentBundle`: the
extension is never loaded into a host's process.

The content the unit plays and the Dart bundle of its editor travel inside
the extension, since the App Sandbox lets it read its own bundle but not
the resources of the app around it (the gate of ticket 41); the app and
the VST3 find the content there. On iOS the app's App ID carries the
Inter-App Audio capability: without it the system does not register the
extension at all.

## Why

- req-auv3-001 to req-auv3-005: the AUv3 with the app on both platforms,
  the app's sounds, its UI, the shell, the memory of an extension.
- An extension inside the app is the way Apple sanctions for Audio Units;
  Logic Pro, GarageBand and MainStage host no VST3.
- Lower-case-only codes are reserved by Apple; `Audn` keeps the spike's
  manufacturer code.
