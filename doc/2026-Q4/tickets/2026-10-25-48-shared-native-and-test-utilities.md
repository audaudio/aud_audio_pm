# 48: Shared native and test utilities

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4 and 5); awaits the user's confirmation. Phase 3 of the plan; size M;
depends on nothing; before ticket 55.

## Goal

What several packages need exists once. `aud_semaphore.hpp` — copied from
graph to io and to vst3 — joins `aud_spsc_queue.hpp` in the header-only
core; the native test harness `test/native/aud_test.hpp`, which graph, io,
midi and script carry with drift, becomes one header the core ships for
tests; `scripts/test-native.js` (four variants), `scripts/
generate-abi-constants.js` (three identical copies) and the hook helper
(`packageSrcDirectory`, the C++17 flags, hidden visibility, the Windows
branch, the 16 KB pages) move into the DNA layer or a dev package the
hooks import; vst3's own harness goes. Test-only members leave the
production interfaces into `testing.dart` libraries: `inject`,
`setBlockSizes`, `debugProcess` and `manualClock` of `aud_audio_io`, the
null device as `AudIoNullSession`, the waits and WAV helpers of the graph
(ticket 47). Serves [flutter-audio-kit](../goals/flutter-audio-kit.md)
(R11: packages share one toolchain).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_audio_core`: the semaphore, the test harness header; `aud_clock.h`
  stops pulling `<windows.h>` into every translation unit (`profileapi.h`
  under `WIN32_LEAN_AND_MEAN`) and uses `#ifdef _WIN32`; patch version.
- `dna_audanika` or a new dev package `aud_audio_tools`: the scripts and
  the hook helper, with tests; open question below.
- `aud_audio_graph`, `aud_audio_io`, `aud_audio_midi`, `aud_audio_script`,
  `aud_audio_vst3`: the copies deleted, the helpers used, the testing
  libraries; patch versions.

## Steps

1. The headers into the core; the copies deleted; native tests green in
   every repo.
2. The scripts and the hook helper into their home; the hooks of the
   five repos on it.
3. The testing libraries of io and graph; the examples and the docs that
   used the test-only members updated.
4. `aud_clock.h`.

## Open questions

- Home of the scripts and the hook helper: the DNA layer (files copied
  into each repo, versioned by the layer) or a dev package `aud_audio_tools`
  the hooks import (versioned by pub)? Proposal: the hook helper as a
  package — hooks are Dart —, the scripts in the DNA layer.
