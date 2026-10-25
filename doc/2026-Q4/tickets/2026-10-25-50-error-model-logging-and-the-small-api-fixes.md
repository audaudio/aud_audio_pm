# 50: Error model, logging and the small API fixes

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
7); awaits the user's confirmation. Phase 4 of the plan; size M; depends on
nothing.

## Goal

Errors and logs of the audio family have one shape. An `AudException`
base with code, name and message under `AudCoreException`,
`AudOscException`, `AudGraphException` and `AudIoException`; result-code
ranges allocated per package in `aud_abi.h` (today graph and io both take
-100) and one name registry; a Dart log sink `Stream<AudLogRecord>` that
carries `AudHostApi.log` and the io logs instead of stderr and logcat
only; `NativeFinalizer`s on `AudTimeFilter`, `AudParamRamp`,
`AudFixedBlockAdapter` and `AudNativeTransportSnapshot`. And the small
findings of the review fixed in one pass: the thread-tag enum carries
worker and any; `AudEvent.fromWords` knows `AUD_EVENT_MESSAGE`;
`AudGraphOptions.==` and `AudNode.==` compare values and graphs; the
documented lifecycle of `aud_graph_start` matches the code; the
sampler's `setString` returns the real error instead of
`AUD_ERROR_OUT_OF_MEMORY` and `max_voices` loses its 256 sentinel; the
effects hook gains its MSVC branch; the script modulator reports its
statistics per node through a node message (osc-002) and derives
`mode0` to `mode15` from `AUD_SCRIPT_NUM_OUTPUTS`; the `ffigen.yaml` files
include the core through the package config, not the sibling checkout;
the `dependency_overrides` of the script package move into its example.
Serves [flutter-audio-kit](../goals/flutter-audio-kit.md) (R4: an
ecosystem apps can rely on).

## Requirements

From the area [framework](../../requirements/framework.md), accepted
2026-10-25:

- req-framework-011: One exception type for every failure
- req-framework-012: The log output reaches the app's sink

## Affected repos

- `aud_audio_core`: the exception base, the code ranges and registry, the
  finalizers, the thread tags, the message event; minor version.
- `aud_audio_graph`: the log sink, the equality fixes, the lifecycle
  docs; minor version.
- `aud_audio_io`: its codes in the range, its logs in the sink; patch.
- `aud_dsp_sampler`, `aud_dsp_effects`, `aud_audio_script`: the fixes
  named above; patch versions.

## Steps

1. The code ranges and the exception base; every package maps its codes.
2. The log sink through graph, io and the umbrella; the example shows
   it.
3. The finalizers with a leak test.
4. The small fixes, package by package, each with a test.

## Open questions

- Log levels and the realtime path: the audio thread must not format; the
  sink reads a ring the notification thread drains, as events do. Confirm
  that `AudHostApi.log` is control-thread only today.
