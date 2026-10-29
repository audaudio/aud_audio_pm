# Move the example keyboard to aud_audio_ui_keyboard

Status: proposed 2026-10-29 by ticket `decouple_aud_audio_midi`; no ID
yet. A first part of step S17b of
[ticket 17](2026-10-07-17-audanika-audio-engine.md).

## Goal

The on-screen keyboard is a widget of the family, not a file every example
copies. Today `Keyboard` lives in `example/lib/keyboard.dart` of
`aud_audio` and, since ticket `decouple_aud_audio_midi`, as a copy in the
example of `aud_audio_midi`; its own doc comment says that S17b builds the
real one in `aud_audio_ui_keyboard`. Moving it there gives app developers
the keyboard as a package, removes the copies and starts S17b on a widget
that already plays the sampler on devices. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## Requirements

- [req-framework-003](../../requirements/framework.md): the dependencies
  follow the package graph; the keyboard depends on no engine package
- No accepted requirement covers the keyboard widget itself yet; engineer
  it with the user before S17b goes beyond the move

## Affected repos

- `aud_audio_ui_keyboard`: `Keyboard` from the example becomes the first
  public widget - multi-touch, velocity from the touch height, sliding
  between keys, notes held from outside shown pressed; widget and golden
  tests; the dependency on `aud_audio` goes
  ([ui-003](../concepts/decisions/ui-003.md)): the widget reports notes and
  velocities through callbacks; minor
- `aud_audio`: the example uses the keyboard of `aud_audio_ui_keyboard`
  and deletes `keyboard.dart`; patch
- `aud_audio_midi`: the example uses the keyboard of
  `aud_audio_ui_keyboard` and deletes `keyboard.dart`; patch
- `aud_audio_pm`: `packages.jsonc` drops the edge from
  `aud_audio_ui_keyboard` to `aud_audio`

## Steps

1. Drop `aud_audio` from `aud_audio_ui_keyboard`; it depends on Flutter
   only
2. Move `Keyboard` and its painter into `aud_audio_ui_keyboard`, export
   them, write widget and golden tests, document them in the README
3. Replace `keyboard.dart` in both examples by the package and keep both
   examples in their pub workspace
4. Run the sampler and MIDI integration tests on a device once

## Open questions

- Does the widget keep the name `Keyboard`, or take the names of S17b now
  (`Keyboard` with `KeyboardModel` and `KeyboardKey`)?
- Does `NoteBinding` to the engine wait for `aud_audio_ui_bindings` of
  [ticket 54](2026-10-25-54-controls-on-the-core-model-and-aud-audio-ui-bindings.md),
  or do the examples keep their own callbacks until then?
- Without the edge to `aud_audio`, the example of `aud_audio` may depend on
  `aud_audio_ui_keyboard` without a cycle. Is a dependency of an example on
  a UI package fine for
  [req-framework-003](../../requirements/framework.md)?
