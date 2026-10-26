# 65: S20b — Finish the AUv3 for the stores

Status: planned 2026-10-25 as the follow-up of
[ticket 64](2026-10-25-64-ship-audanika-as-auv3.md), which moved its open
steps here when it went to review (answer 4 of its plan review).

## Goal

The AUv3 of ticket 64 reaches the users: the editor shows the albums they
bought, the iPhone keeps it within an extension's memory, the hosts of the
acceptance play it from their projects, and the app's release lanes carry
the extension on macOS and iOS.

## Requirements

- [req-auv3-001](../../requirements/auv3.md#req-auv3-001-the-auv3-comes-with-the-app-on-macos-and-ios)
  (must): the AUv3 comes with the app - through the release lanes
- [req-auv3-003](../../requirements/auv3.md#req-auv3-003-the-auv3-shows-the-audanika-ui-as-its-editor)
  (should): the Audanika UI as the editor - with the bought albums
- [req-auv3-005](../../requirements/auv3.md#req-auv3-005-the-auv3-stays-within-an-extensions-memory-on-ios)
  (must): within an extension's memory on the iPhone

## What ticket 64 leaves

The app carries the extension `AudanikaAUv3` (`com.audanika.auv3`) on
macOS and iOS, built on `aud_audio_auv3` and `aud_audio_plugin`; Logic Pro,
GarageBand and Loopy Pro (iPad) play it, its editor is the app's UI, a
project keeps its preset, parameters and the editor's settings, and the
notes played on the UI are its MIDI output. The extension registers no
Flutter plugins: the editor reaches none, and the library shows the free
songs only. On iOS the extension is signed with the team's wildcard
development profile; the gate's probe apps and App IDs still exist.

## Affected repos

- `audanika_app`: the app group on iOS, the purchases the app shares with
  the extension on both platforms, the release lanes
- `aud_audio_auv3`, `aud_audio_plugin`: only if a host shows a fault
- `aud_audio_vst3`: the Windows build after the move to `aud_audio_plugin`
- `aud_audio_pm`: this plan and its findings

## Steps

1. Logic Pro and GarageBand on the Mac by hand: every preset from a MIDI
   region, automation, offline bounce, two instances; MainStage and Live
   if installed (step 8 of ticket 64).
2. The purchases in the editor: the app group on iOS, the bought albums in
   its defaults as on macOS, read by the editor inside the extension on
   both platforms; no other Flutter plugin reachable from the editor (the
   motion sensors only with their extension switched on) (step 9).
3. Loopy Pro, GarageBand and Cubasis on the iPhone: every preset, save and
   reopen, the editor, the MIDI output; one, two and four instances for 10
   minutes each with the footprint recorded (req-auv3-005, step 10).
4. The release lanes: the extension in the iOS lane (fastlane) and the
   macOS lane (`tool/release-mac.js`), the App ID `com.audanika.auv3` with
   its profiles; TestFlight builds uploaded only on the user's go (step 11).
5. Windows: the VST3 rebuilt on `aud_audio_plugin` and tried on the Windows
   machine of ticket 38 (answer 3 of ticket 64).
6. Clean up, only on the user's go: the probe apps of the gate on the Mac,
   the iPad and the iPhone, the App IDs `com.audanika.auv3gate*` (team
   SAZSC68S46) and `io.audaudio.audGate*` (Personal Team).
7. Review, documentation, publish; the requirements set to `done`.

## Findings

- **Step 4, TestFlight (2026-10-26).** Audanika 4.7.0 (172) with its AUv3
  went to TestFlight on the user's go: the Mac build through
  `tool/release-mac.js`, whose archive check now covers the extension,
  the iOS build through the new fastlane lane `beta`. An iOS extension may
  carry no `Frameworks` folder (ITMS-90206), so on iOS the AUv3 takes the
  app's `App.framework` from the app's `Frameworks`, as it takes Flutter;
  the editor shows in Loopy Pro with it. `upload_to_testflight` needs a
  full Apple ID session; the lane uploads with `altool` and the
  app-specific password instead. The AUv3 editor still shows only the free
  songs (step 2).

## Open questions

1. Is the MIDI output of the AUv3 a requirement of its own (proposed
   req-auv3-006, should: the notes played on Audanika's UI reach the host
   as MIDI, as the VST3 sends them)?
