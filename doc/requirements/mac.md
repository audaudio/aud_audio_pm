# Requirements: the Audanika Mac app and its VST3 plugin

Area `mac`. Source: Gabriel Gatzsche's request for ticket 37 on 2026-10-20
("Als nächstes soll Audanika als VST Plugin zur Verfügung gestellt
werden"), the requirements confirmed the same day. The plan:
[ticket 37](../2026-Q4/tickets/2026-10-20-37-ship-audanika-as-a-mac-app-with-its-vst3-plugin.md).

## req-mac-001: Mac app on TestFlight and the Mac App Store

- Status: accepted
- Priority: must
- Statement: Audanika is available as a Mac app through TestFlight and the
  Mac App Store
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5,
  macOS), the request of 2026-10-20
- Acceptance:
  - a build installed from TestFlight starts on an Apple silicon Mac and
    plays all presets of the app
  - the build passes the validation of App Store Connect and can be
    submitted for review

## req-mac-002: The VST3 plugin comes with the Mac app

- Status: accepted
- Priority: must
- Statement: The Mac app carries the VST3 plugin; no separate download or
  installer is needed
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R23,
  plugin formats), the request of 2026-10-20
- Acceptance:
  - after the app is installed from TestFlight and the user agrees once in
    the app, Cubase 15 and REAPER list "Audanika" as a VST3 instrument
  - an update of the app updates the plugin without another step

## req-mac-003: The plugin plays Audanika's sounds from the DAW

- Status: accepted
- Priority: must
- Statement: In a DAW the plugin plays Audanika's presets from the DAW's
  MIDI and restores its preset and settings with the project
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R23),
  the request of 2026-10-20
- Acceptance:
  - in REAPER and Cubase a MIDI clip plays each preset of the app with its
    effects and script LFOs
  - a saved project reopens with the same preset and parameter values
  - an offline render sounds like the real-time playback

## req-mac-004: The plugin shows the Audanika UI as its editor

- Status: accepted
- Priority: should
- Statement: The plugin's editor is Audanika's play surface with its sound
  selection
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R23),
  the request of 2026-10-20
- Acceptance:
  - in REAPER and Cubase the editor opens in the plugin window
  - playing the surface sounds in the plugin; choosing a preset there
    changes the plugin's preset and the DAW's project keeps it

## req-mac-005: The plugin is built on aud_audio_vst3

- Status: accepted
- Priority: must
- Statement: The VST3 plugin is built with the family's shell
  `aud_audio_vst3`
- Why: the request of 2026-10-20; R23 of the
  [engine brief](../2026-Q4/concepts/topics/requirements.md)
- Acceptance: the plugin binary comes out of the build of `aud_audio_vst3`,
  configured by the app; the app holds no VST3 code of its own
