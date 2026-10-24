# Requirements: the Audanika app on Windows

Area `windows`. Source: the user's choice for ticket 38 on 2026-10-24, the
Windows audio device inside the ticket that makes all repos run on Windows;
then the user's request of the same day ("Bitte bring Audanika als VST3
unter Windows zum Laufen"), also inside ticket 38, with req-windows-002 and
req-windows-003 confirmed the same day. The plan:
[ticket 38](../2026-Q4/tickets/2026-10-22-38-make-all-repos-run-on-windows.md).

## req-windows-001: The app plays its sounds through the default output

- Status: done (ticket 38, 2026-10-24)
- Priority: must
- Statement: The Audanika app plays its sounds on Windows through the
  default output device and follows it when it changes
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5,
  Windows; R14, `aud_audio_io`), the choice of 2026-10-24
- Acceptance:
  - every preset sounds on the development PC at the device's rate with
    the smallest period the device grants in shared mode (480 frames there)
    — changed on 2026-10-24 from "a buffer of 256 frames", which the
    drivers of the development PC do not grant in shared mode; shorter
    periods come with exclusive mode (S3d)
  - changing the default output in the Windows settings, or unplugging
    the device in use, moves the sound to the new default within 1 s
  - 100 notes play without an xrun

## req-windows-002: The VST3 plugin plays Audanika's sounds on Windows

- Status: done (ticket 38, 2026-10-24)
- Priority: must
- Statement: On Windows the Audanika VST3 plugin, built with
  `aud_audio_vst3` into the folder of the Windows app, plays the app's
  presets from the DAW's MIDI and restores its preset and settings with the
  project
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5,
  Windows; R23, plugin formats), the request of 2026-10-24
- Acceptance:
  - the plugin of the built app, linked into a VST3 folder, is listed as
    "Audanika" VST3 instrument by REAPER and Cubase 15
  - a MIDI clip plays each preset with its effects and script LFOs
  - a saved project reopens with the same preset and parameters
  - an offline render sounds like the real-time playback
  - the plugin passes the VST3 SDK validator

## req-windows-003: The plugin shows the Audanika UI on Windows

- Status: accepted; built in ticket 38 (2026-10-24): the editor opens in
  REAPER and Cubase 15 and plays the plugin; the size, the MIDI track and
  the preset kept by the project are still to be checked
- Priority: should
- Statement: The plugin's editor on Windows is Audanika's play surface with
  its sound selection
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R23),
  the request of 2026-10-24
- Acceptance:
  - in REAPER and Cubase 15 the editor opens in the plugin window and
    follows its size
  - playing the surface sounds in the plugin and reaches the DAW's MIDI
    track; choosing a preset there changes the plugin's preset and the
    project keeps it
