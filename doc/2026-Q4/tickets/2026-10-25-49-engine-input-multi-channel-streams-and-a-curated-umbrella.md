# 49: Engine input, multi-channel streams and a curated umbrella

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
7); awaits the user's confirmation. Phase 4 of the plan; size M; depends
on ticket 48.

## Goal

An app that records, monitors or plays more than stereo uses `AudEngine`
instead of assembling io and graph itself. `AudEngineConfig` gains the
input direction and the input channels and the engine creates the graph
with input buses; `aud_audio_io` lifts its cap of two channels per
direction (`src/aud_audio_io.h:199-200`) up to `AUD_IO_MAX_CHANNELS` where
the backends deliver them; packages can be added before `prepare`
(`addPackage`) for plugins and downloadable content; the umbrella exports
a curated surface instead of all of core, graph and io including the
test API; the platform-specific knobs of the IO API — `mixWithOthers`,
`bluetoothHfp`, `measurement`, `exclusive`, `latencyTuner` — move into
`AudIoAppleOptions` and `AudIoAndroidOptions`; an `AudIoRenderer`
abstraction (the graph, a sine, a probe) keeps `graph.pointer.cast()` out
of app code; and on Linux the platform backend reports
`AUD_ERROR_UNSUPPORTED` with a notification instead of playing silence
through the null device, until S3b Linux lands. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R14: cutting-edge
multi-channel audio IO).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_audio`: the input config, `addPackage`, the curated exports, the
  renderer; its example records a loopback; minor version.
- `aud_audio_io`: the channel cap, the option groups, the renderer
  interface, the Linux error; the macOS, Windows, iOS and Android devices
  tested with four and more channels where hardware exists; minor
  version.
- `aud_audio_graph`: input buses through the engine; patch version.

## Steps

1. Multi-channel in io, backend by backend, with the aggregate device on
   macOS as the test bed.
2. The input and duplex path of the engine; the loopback example.
3. `addPackage`, the option groups, the renderer.
4. The curated exports — a breaking change for apps that used the
   re-exported test API; the app follows in its own ticket.
5. The Linux error.

## Open questions

- Which app needs input first (the tuner, the looper)? It sets the
  acceptance test.
- Does `addPackage` after `prepare` need to be supported (hot loading)?
  Proposal: before `prepare` only, as the registry is read at prepare.
