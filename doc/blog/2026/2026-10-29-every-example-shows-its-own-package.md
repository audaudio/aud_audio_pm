<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Every example shows its own package

## Motivation

- Ticket `maintain` moved the repos with examples to pub workspaces. The
  example of `aud_audio` could not follow: it depended on `aud_audio_midi`,
  which depends on `aud_audio`.
- The first idea was to break that loop in the library: move
  `AudEngineExtension`, the engine interface and `AudNativeNodePackage`
  into `aud_audio_graph`, so `aud_audio_midi` no longer depends on
  `aud_audio`.
- The review of that idea found the real fault: the example of `aud_audio`
  showed a feature of `aud_audio_midi`, a package one layer above it. The
  dependency direction of the libraries was right.

## Strategy

- Keep the package graph as it is: `aud_audio_midi` depends on
  `aud_audio` ([req-framework-003](../../requirements/framework.md)).
- Move the MIDI demo from the example of `aud_audio` to a new example of
  `aud_audio_midi`.
- Put both examples into the pub workspace of their repo.
- Leave the rename of `aud_audio_midi` to a follow-up ticket.

```mermaid
graph TD
  ex1[aud_audio example] --> aud_audio
  ex2[aud_audio_midi example] --> aud_audio_midi
  aud_audio_midi --> aud_audio
  aud_audio_midi --> aud_midi
  aud_audio --> graph[aud_audio_graph + core]
```

## Implementation 1: aud_audio

- The example keeps the oscillator and the sampler pages and loses the
  MIDI page, its integration tests, permissions and loopback service.
- `workspace: [example]`, `resolution: workspace`; the committed
  `example/pubspec_overrides.yaml` and `example/pubspec.lock` are gone.

## Implementation 2: aud_audio_midi

- `example/` is a new app: a MIDI keyboard plays the SFZ sampler through
  `AudMidiBridge`, with the integration tests of midi-002 and midi-003.
- `workspace: [example]`.

## Implementation 3: Plans

- [Ticket decouple_aud_audio_midi](../../2026-Q4/tickets/2026-10-29-decouple_aud_audio_midi-move-the-midi-demo-to-aud-audio-midi.md)
  records the decision.
- [The follow-up](../../2026-Q4/tickets/2026-10-29-rename-aud-audio-midi-to-aud-audio-with-midi.md)
  proposes the name `aud_audio_with_midi`, which says the layer.

## Result

- Both repos resolve as one workspace; analyzer and unit tests are green,
  the new example builds for the iOS simulator.
- Both workspace repos need `test: ^1.31.1`: Flutter 3.47 pins `test_api`
  0.7.12 through `flutter_test`.

## Open Points

- The MIDI integration tests ran on no device in this ticket.
- The rename waits for its ticket.
