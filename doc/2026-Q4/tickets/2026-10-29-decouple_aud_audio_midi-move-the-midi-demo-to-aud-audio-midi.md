# decouple_aud_audio_midi: Move the MIDI demo to aud_audio_midi

Status: implemented 2026-10-29. Follows ticket `maintain`, which could not
put the example of `aud_audio` into a pub workspace.

## Goal

Every example shows only what its own package provides. The example of
`aud_audio` showed the MIDI bridge of `aud_audio_midi`, a package one layer
above `aud_audio`, and so depended on its own dependent. That cycle kept the
example out of the pub workspace of `aud_audio`. The MIDI demo moves into a
new example of `aud_audio_midi`; both examples join the pub workspace of
their package. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md).

The package graph stays as it is: `aud_audio_midi` keeps depending on
`aud_audio`. The original idea, moving the engine extension points into
`aud_audio_graph`, is dropped: the dependency direction is right, only the
example was in the wrong package.

## Requirements

- [req-framework-003](../../requirements/framework.md): the dependencies
  follow the package graph; the example of `aud_audio` no longer depends on
  `aud_audio_midi`

## Affected repos

- `aud_audio`: the example keeps the oscillator and the sampler pages, loses
  the MIDI page, its integration tests, the MIDI permissions and the
  loopback service; `workspace: [example]`, `resolution: workspace`, no
  `example/pubspec_overrides.yaml`; patch
- `aud_audio_midi`: a new example app with the MIDI keyboard page, its
  integration tests, the MIDI permissions and the Android loopback service;
  `workspace: [example]`; patch

## Steps

1. Copy the example of `aud_audio` to `aud_audio_midi/example`, rename it to
   `aud_audio_midi_example` and keep only the MIDI page
2. Remove the MIDI page and everything only it needs from the example of
   `aud_audio`
3. Put both examples into the pub workspace of their package
4. Analyze, run the unit tests, build both examples
5. Update README, `index.jsonc` and the publish config of both repos

## Open questions

None.

## Follow-ups

- [Rename aud_audio_midi to aud_audio_with_midi](2026-10-29-rename-aud-audio-midi-to-aud-audio-with-midi.md)
- [Placeholder app IDs in every example](2026-10-29-placeholder-app-ids-in-every-example.md):
  the new example keeps `com.audanika.*` like all examples of the family
  until then
- [Move the example keyboard to aud_audio_ui_keyboard](2026-10-29-move-the-example-keyboard-to-aud-audio-ui-keyboard.md):
  removes the copy of `keyboard.dart` this ticket adds
