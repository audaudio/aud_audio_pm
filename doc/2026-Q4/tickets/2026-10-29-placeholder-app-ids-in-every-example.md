# Placeholder app IDs in every example

Status: implemented 2026-10-29 in ticket `placeholder_app_ids`.

## Goal

The example apps carry placeholder identifiers, as the review guide asks:
`com.example.<app>` instead of the organization's own IDs. An app
developer who copies an example does not inherit an ID of Audanika, and the
examples no longer claim IDs in the stores and on the devices of the
organization. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md).

## Requirements

- [req-framework-017](../../requirements/framework.md): the examples
  carry placeholder app IDs

## Affected repos

Every example with an ID of the organization, as of 2026-10-29:

- `com.audanika.*`: `aud_audio`, `aud_audio_with_midi`, `aud_audio_clap`,
  `aud_audio_core`, `aud_audio_file`, `aud_audio_graph`, `aud_audio_io`,
  `aud_audio_link`, `aud_audio_script`, `aud_audio_sequencer`,
  `aud_audio_ui_controls`, `aud_dsp_analysis`, `aud_dsp_effects`,
  `aud_dsp_guitar_amp`, `aud_dsp_mi`, `aud_dsp_sampler`,
  `aud_dsp_spatial`, `aud_dsp_stk`, `aud_dsp_stretch`, `aud_dsp_synth`
- `io.audaudio.*`: `aud_audio_auv3`, including its extension
  `io.audaudio.auv3.example.auv3`

Per example: the Android `namespace`, `applicationId` and the Kotlin
package folder, the iOS and macOS `PRODUCT_BUNDLE_IDENTIFIER` of the app
and its `RunnerTests`, and the IDs of Linux and Windows where present; a
patch each.

## Steps

1. Agree on the scheme: `com.example.<package>` for Android,
   `com.example.<packageInCamelCase>` for Apple platforms
2. Script the rename in Node.js, run it over every example and keep the
   class names of the libraries, e.g. the loopback service
   `com.audanika.aud_midi_android.AudMidiLoopbackService`
3. Build every example once per platform in CI and run its tests
4. Add a check that fails on an ID of the organization in an example

## Decisions

- Scheme as planned; the existing suffixes stay, only the prefix changes:
  `com.audanika.<id>` becomes `com.example.<id>` (user, 2026-10-29)
- The AUv3 example and its extension move to
  `com.example.audAudioAuv3Example`, the VST3 example to
  `com.example.audAudioVst3Example` (user)
- The example of `aud_midi_android` follows in this ticket (user)
- Class names of the libraries keep `com.audanika`, e.g.
  `com.audanika.aud_midi_android.AudMidiLoopbackService`
- Step 4, a check against IDs of the organization, is left for later
