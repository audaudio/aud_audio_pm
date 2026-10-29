<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# The examples carry placeholder app IDs

## Motivation

- The example apps of the families used IDs of the organization:
  `com.audanika.*`, and `io.audaudio.*` for AUv3 and VST3.
- A developer who copies an example inherits that ID; the review guide
  asks for placeholder identifiers.

## Strategy

- New requirement [req-framework-017](../../requirements/framework.md):
  the examples carry placeholder app IDs under `com.example`.
- Decisions with the user: keep each existing suffix and change only the
  prefix; move AUv3 and VST3 to `com.example` as well; include the example
  of `aud_midi_android` from the audmidi family.
- Class names of the libraries keep `com.audanika`.

## Implementation

- 22 examples: Android namespace, application ID and Kotlin folder, the
  Apple bundle IDs of app and `RunnerTests`, Linux and Windows IDs.
- `aud_audio_auv3`: app, extension and `plugin.json` become
  `com.example.audAudioAuv3Example`; `aud_audio_vst3` becomes
  `com.example.audAudioVst3Example`.
- `aud_audio_with_midi`: the web fixture uses the version constant that
  the last release renamed.
- A Node.js script did the rename once; it is not kept in a repo.

## Result

- Every example analyzes clean; the Android examples of `aud_midi_android`
  and `aud_audio_core` and the macOS AUv3 example build.

## Open Points

- Step 4 of the plan, a check that rejects IDs of the organization in an
  example, is left for later.
- Not every example was built on every platform.
- `aud_ab_space_widget` of the private family still uses `com.audanika`.
