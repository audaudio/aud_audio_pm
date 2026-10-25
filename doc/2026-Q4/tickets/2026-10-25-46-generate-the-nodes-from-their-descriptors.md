# 46: Generate the nodes from their descriptors, ABI 0.5

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4, 5 and 7); awaits the user's confirmation. Phase 3 of the plan; size M;
depends on ticket 45.

## Goal

A node type is described once, in a JSON descriptor
(`AudNodeDescriptor.fromJson` exists,
`aud_audio_core/lib/src/aud_node_descriptor.dart:506`), and a Node.js
generator in `aud_audio_core/scripts` writes everything that today is
kept in step by hand: the C header enum and tables, the Dart mirror class
with its dartdoc (ranges, units, defaults), the preset builder with its
named parameters, the README parameter table and a test that fails when a
generated file is stale. Parameters get typed ids in the public Dart and
JSON layer — `AudParamId` emitted by the generator, `String` ids in
commands, events and documents — and indices stay inside the engine, so a
reordered descriptor no longer breaks saved commands and `setParam(node,
Object param)` loses its `Object`. ABI 0.5 adds value labels for stepped
parameters (`AudTempoDelay.division` keeps its labels only in Dart today)
and bundles the other ABI changes that are due — the render stage of
ticket 53 and the host API member ticket 34 avoided — into one rebuild of
the native packages. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R11) and what
architecture.md promises: "a descriptor … generates the Dart node class".

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_audio_core`: the generator, the descriptor schema
  (`doc/schemas`), `AudParamId`, the value labels in `AudParamDescriptor`
  and ABI 0.5; minor version.
- `aud_audio_graph`: `setParam` and `setString` by id, `setParamAt(int)`
  for the index, ids in `AudSetParamCommand` and `AudParamEvent`, the
  graph document schema; minor version.
- `aud_dsp_effects`, `aud_dsp_sampler`: descriptors as JSON, generated
  files checked in, the hand-written tables deleted; the sampler gains
  `paramDescriptors`; minor versions (ABI 0.5).
- `aud_audio_pm`: abi-001 updated for 0.5 and for the policy of bundling
  ABI changes; decision `dsp-005` (descriptor-driven generation).

## Steps

1. The descriptor schema and the generator with the effects as the first
   consumer; the stale-file test.
2. The sampler's descriptor; its `paramDescriptors`.
3. Typed ids through core and graph; the document schema; the app's
   documents migrated by a script.
4. ABI 0.5 with the value labels and the bundled changes; every native
   package rebuilt and released together.
5. The decisions.

## Open questions

- Keep the generated files in git (proposal: yes, with the stale test) or
  generate in the build hook?
- Does the Audanika app's graph document carry parameter indices that
  need migration?
