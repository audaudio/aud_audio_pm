# Placeholder app IDs in every example

Status: proposed 2026-10-29 by the review of ticket
`decouple_aud_audio_with_midi`; no ID yet.

## Goal

The example apps carry placeholder identifiers, as the review guide asks:
`com.example.<app>` instead of the organization's own IDs. An app
developer who copies an example does not inherit an ID of Audanika, and the
examples no longer claim IDs in the stores and on the devices of the
organization. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md).

## Requirements

No accepted requirement covers it yet; the rule comes from
`doc/guides/for-ai/ai-review-guide.md`, section "Placeholder identifiers".
Decide with the user whether it becomes a requirement of the area
[framework](../../requirements/framework.md).

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

## Open questions

- Does the AUv3 example keep `io.audaudio.*` for its app group and the
  extension, which the host and the signing need to agree on?
- Does the example of `aud_midi_android` in the audmidi family, still at
  `com.audanika.aud_midi_android_example`, follow in a ticket of
  `aud_midi_pm`?
