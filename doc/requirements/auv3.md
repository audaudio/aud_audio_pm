# Requirements: the Audanika AUv3 on macOS and iOS

Area `auv3`. Source: Gabriel Gatzsche's request for ticket 41 on 2026-10-25
("Provide Audanika as an AUV3 analog to the VST3"), the platforms macOS and
iOS chosen and the requirements confirmed the same day. The VST3
counterparts are [req-mac-002 to req-mac-005](mac.md). Changed on
2026-10-25 on the user's request: the iOS hosts of the acceptance are those
installed on the user's iPhone - Loopy Pro, GarageBand and Cubasis - in
place of AUM and the iPad. The plan:
[ticket 41](../2026-Q4/tickets/2026-10-25-41-ship-audanika-as-auv3.md).

## req-auv3-001: The AUv3 comes with the app on macOS and iOS

- Status: accepted
- Priority: must
- Statement: The Audanika app carries the AUv3 on macOS and iOS; no
  separate download or installer is needed
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R23,
  plugin formats), [release-003](../2026-Q4/concepts/decisions/release-003.md)
  (M3, AUv3 on iOS), the request of 2026-10-25
- Acceptance:
  - after the app is installed from TestFlight and opened once, Logic Pro
    and GarageBand on the Mac and Loopy Pro, GarageBand and Cubasis on the
    iPhone list "Audanika" as an AUv3 instrument
  - an update of the app updates the AUv3 without another step

## req-auv3-002: The AUv3 plays Audanika's sounds from the host

- Status: accepted
- Priority: must
- Statement: In an AUv3 host the plugin plays Audanika's presets from the
  host's MIDI and restores its preset and settings with the project
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R23),
  the request of 2026-10-25
- Acceptance:
  - in Logic Pro and GarageBand on the Mac and in Loopy Pro, GarageBand and
    Cubasis on the iPhone a MIDI region plays each preset of the app with
    its effects and script LFOs
  - a saved project reopens with the same preset and parameter values
  - an offline bounce in Logic Pro sounds like the real-time playback

## req-auv3-003: The AUv3 shows the Audanika UI as its editor

- Status: accepted
- Priority: should
- Statement: The AUv3's editor is Audanika's play surface with its sound
  selection and library, on macOS and iOS
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R23),
  the request of 2026-10-25
- Acceptance:
  - in Logic Pro on the Mac and in Loopy Pro on the iPhone the editor opens
    in the plugin window
  - playing the surface sounds in the AUv3; choosing a preset there changes
    the AUv3's preset and the host's project keeps it

## req-auv3-004: The AUv3 is built on aud_audio_auv3

- Status: accepted
- Priority: must
- Statement: The AUv3 is built with the family's shell `aud_audio_auv3`
- Why: the request of 2026-10-25; R23 of the
  [engine brief](../2026-Q4/concepts/topics/requirements.md)
- Acceptance: the Audio Unit code - the `AUAudioUnit`, its render block,
  parameters, presets, state and editor bridge - comes from
  `aud_audio_auv3`, configured by the app's `plugin.json`, document and
  presets; the app holds only the extension target that embeds it

## req-auv3-005: The AUv3 stays within an extension's memory on iOS

- Status: accepted
- Priority: must
- Statement: On iOS the AUv3 with the sampler and its editor stays within
  the memory a host grants an extension
- Why: [plugin-001](../2026-Q4/concepts/decisions/plugin-001.md) (360 MB
  shared by all instances of a host), S20 of
  [ticket 17](../2026-Q4/tickets/2026-10-07-17-audanika-audio-engine.md),
  the request of 2026-10-25
- Acceptance: on the user's iPhone, one, two and four instances with
  presets loaded and editors open play in Loopy Pro for 10 minutes each
  without being terminated by the system; the footprint of the extension is
  recorded
