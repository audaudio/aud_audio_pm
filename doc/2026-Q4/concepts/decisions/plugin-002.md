# plugin-002: A headless engine host with host-supplied buffers

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/review-2026-10-08-plan-scope.md (point 8);
  decisions/plugin-001.md
- Open work: the parameter-id derivation and the state format in ticket
  20; the render function `aud_graph_render` with host buses exists
  since ticket 19

## Decision

The C++ engine has a headless host API that works without Dart: it
loads a graph document, applies node presets, loads the assets the
document references, saves and restores state, and renders into
host-supplied buffers — `render(host buffers, events, transport
segments)` is the first-class renderer interface; `aud_audio_io` is
one client of it, the plugin shells are another. The shells build on
this API: stable parameter ids derived from the graph document (node
id and parameter name) and persisted in the state, automation gestures
mapped to parameter begin and end edits, state restoration as graph
document plus presets, asset references and node state blobs, bus
negotiation from the document's buses, latency and tail reporting from
the compiler, offline and freewheel rendering through the virtual
timeline. Shells depend on the graph, not on the IO package, and on
serial rendering only; the parallel scheduler is never a prerequisite.

## Why

- A serialized graph alone does not say who loads samples or applies
  presets when Dart is absent; the engine must.
- Host buffers as the render interface remove the device-IO dependency
  of the shells and let plugin delivery start with the serial engine.
