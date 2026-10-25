# 45: Node kit and FFI helper in the core

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4 and 5); awaits the user's confirmation. Phase 3 of the plan; size M;
depends on nothing.

## Goal

A DSP package implements its node against one kit of the core instead of
copying what the effects built for themselves: `AudEffectNode` with the
clamp to the descriptor, the allocate-in-prepare with rollback, the atomic
tail, `paramAt`, `targetOf`, `stepOf`, `inputPair`, the vtable and
descriptor helpers, `flush`, `tailFrames`, the quadrature oscillator and
the smoother (`aud_dsp_effects/src/aud_effects_node.hpp:68-356`) move into
`aud_audio_core/src/aud_node_kit.hpp`; the registration prologue the
sampler and the effects repeat becomes one helper. On the Dart side one
`AudNodePackageFfi` base with one `AudNodePackageException`, a link-hook
helper and a link-test helper replace the `register`, `registerWith`,
`@RecordUse` list, `hook/link.dart`, `test/hook/link_test.dart` and
`web_compile_test` that are copied 1:1 between the two packages. The
effects adopt the kit fully, the sampler the registration and descriptor
helpers (its node keeps its own event splitting through sfizz). Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (its measure "DSP
packages built outside the engine repos plug into the graph without
changes to the engine", R11).

## Requirements

From the area [framework](../../requirements/framework.md), accepted
2026-10-25:

- req-framework-010: A DSP node needs its DSP code and one description

## Affected repos

- `aud_audio_core`: `src/aud_node_kit.hpp` (header-only, like
  `aud_node_base.hpp`), the Dart helpers in a `package.dart` library, the
  "write a node" guide of ticket 42 updated to the kit; minor version.
- `aud_dsp_effects`: the six nodes on the kit, the local header deleted;
  bit-for-bit goldens prove nothing changed; patch version.
- `aud_dsp_sampler`: the registration prologue, the descriptor assembly
  and the Dart boilerplate on the helpers; the C++14 constraint of its
  node (`aud_sfz_node.hpp:9-10`) documented or lifted by compiling the
  node apart from sfizz's C sources; patch version.
- `aud_audio_pm`: decision `dsp-004` (the kit is the way to write a node).

## Steps

1. The kit header in the core with its own native tests (the effects'
   tests moved up).
2. The Dart helpers with their tests.
3. The effects on the kit; goldens green.
4. The sampler on the helpers; goldens green.
5. The guide and the decision.

## Open questions

- Name the Dart helper library `aud_audio_core/package.dart` or
  `node_package.dart`?
- Whether the sampler's node adopts `AudEffectNode` too, once it compiles
  with C++17 apart from sfizz: proposal no, its voice handling differs.
