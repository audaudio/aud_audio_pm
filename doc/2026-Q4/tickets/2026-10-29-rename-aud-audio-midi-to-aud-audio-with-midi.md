# Rename aud_audio_midi to aud_audio_with_midi

Status: implemented 2026-10-29 in ticket `rename_aud_audio_midi`.

## Goal

The name says the layer: `aud_audio_with_midi` is the Audanika Audio Engine
with MIDI, one layer above `aud_audio`, not a part of it. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## Requirements

- [req-framework-003](../../requirements/framework.md): the package graph
  names the package by its role

## Affected repos

- `aud_audio_midi`: the repo, its git remote, the package name, the
  imports, the native files and the C symbols `aud_audio_midi_*`
- `aud_audio_pm`: `packages.jsonc`, the architecture and the open tickets
  that name the package, e.g. ticket 51
- `audaudiohub.io`: the pages of the package

## Steps

1. Decide whether the C symbols and the node type IDs `aud.midi.*` keep
   their names
2. Rename the repo and the package, keep a redirect on GitHub
3. Update every reference in the family and the docs site

## Decisions

- The C symbols `aud_audio_midi_*` and the header `aud_audio_midi.h`
  follow the package name: `aud_audio_with_midi_*`,
  `aud_audio_with_midi.h` (user, 2026-10-29)
- The node type IDs `aud.midi.*` keep their names: saved graphs stay
  valid
- `audaudiohub.io` names the package nowhere; nothing to change there
