# 47: Graph housekeeping: DSP out, runtime handle, facets

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4 and 7); awaits the user's confirmation. Phase 3 of the plan; size L;
starts step S10b of ticket 17; depends on ticket 45.

## Goal

The graph package holds the graph and nothing else. Its oscillator and
state-variable filter (`src/aud_graph_nodes.cpp`), registered into every
graph by `aud_graph_create`, move into `aud_dsp_effects` as the first
nodes of S10b on the kit of ticket 45; the graph keeps the structural
nodes (mixer, feedback, tap, channel split) and gains `aud.test.*` nodes
that only the contract tests register. `AudWavFile` and `AudWavData` move
to a `testing.dart` library until `aud_audio_file` exists, the JSON reader
and writer (`src/aud_json.cpp`) to the core where the shells will need it.
The process-global state that hides behind instance members of `AudGraph`
— the cache budget, `waitTasks`, the leaked worker pool
(`src/aud_graph_resources.cpp:16`), the watchdog statics — gets an
explicit runtime handle, `AudRuntime` in Dart and `aud_runtime_*` in C,
owned by the umbrella and the headless host; the C names `aud_cache_*` and
`aud_tasks_*` follow. The one interface of more than 60 members
(`lib/src/aud_graph.dart:103-470`) is cut into facets — `graph.loads`,
`graph.transport`, `graph.osc`, `graph.stats` — and `waitLoads` and
`waitTasks` leave the main interface for the offline renderer and the
testing library. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R6, R21).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_audio_graph`: the nodes out, the test nodes in, the runtime
  handle, the facets, the testing library; the lifecycle documentation of
  `aud_graph_start` matched to the code; minor version.
- `aud_audio_core`: the JSON reader and writer; patch version.
- `aud_dsp_effects`: `aud.effects.oscillator` and `aud.effects.filter`
  with goldens that equal the graph's; minor version.
- `aud_audio`: owns the runtime; its example and the controls example
  register the effects; minor version.
- `aud_audio_pm`: decision `graph-005` (the reference nodes), the
  architecture section "Graph model", open question 3 of ticket 40.

## Steps

1. The decision on the reference nodes (open question 3 of ticket 40).
2. The runtime handle in C and Dart; the umbrella and the headless host
   own it; the statics gone.
3. The facets; the testing library with the WAV helpers and the waits.
4. The nodes into the effects; the test nodes; the goldens.
5. The JSON code into the core.
6. The examples and the docs site page of the graph updated.

## Open questions

- Open question 3 of ticket 40: move or declare stable.
- Does the Audanika app use `aud.graph.oscillator` or `aud.graph.filter`
  in a document? Then the move needs a migration.
