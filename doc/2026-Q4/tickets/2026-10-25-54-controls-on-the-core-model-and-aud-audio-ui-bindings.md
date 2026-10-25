# 54: Controls on the core model and aud_audio_ui_bindings

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4 and 5); awaits the user's confirmation. Phase 4 of the plan; size M; step
S17a of ticket 17; depends on tickets 41 and 46.

## Goal

The UI packages speak the engine's model without depending on the engine.
`aud_audio_ui_controls` depends on the platform-neutral
`aud_audio_core.dart` (no `dart:ffi`): `AudParamSpec` becomes
`AudParamSpec.fromDescriptor(AudParamDescriptor)` instead of a copy of its
fields, `AudParamAddress` builds on `AudOscAddress` instead of its own
`/<node>/<param>` scheme, and the value labels of ticket 46 reach the
knobs. The binding package `aud_audio_ui_bindings` of ui-003 is created
with the parameter sink over `AudEngine`; apps depend on it, plugin
editors keep their socket and parameter-tree sinks. The remaining seven
widgets of ui-002 (`TwoParameterControl`, sliders, wheels, ribbon,
joystick, XY pad) follow in S17a's own scope. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R29).

## Requirements

No accepted requirement covers it yet; the area
[framework](../../requirements/framework.md) of 2026-10-25 does not.
Engineer its requirements before the ticket is planned.

## Affected repos

- `aud_audio_ui_controls`: the core dependency, the converters, the
  labels; the index entry stops claiming `aud_audio_vst3` as a user;
  minor version.
- `aud_audio_core`: whatever the neutral library lacks for the widgets
  (the address builder); patch.
- `aud_audio_ui_bindings` (new repo): the sink over the engine, the
  example that binds a knob to a node; `packages.jsonc` and the package
  graph gain it; first release.
- `aud_audio_pm`: ui-003 accepted; the package manifest.

## Steps

1. The controls on the core model; the goldens unchanged.
2. The bindings repo from the template of ticket 41 (empty library, then
   the sink).
3. The example app of the umbrella binds its knobs through the package.
4. ui-003 accepted; the manifest and the graph.

## Open questions

- Does the AUv3 example's editor move to the bindings package's pattern
  now or with ticket 55?
