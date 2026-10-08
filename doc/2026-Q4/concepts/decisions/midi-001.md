# midi-001: MIDI types come from aud_midi_standard

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's decision at the plan review on
  2026-10-08; the aud_midi plan (aud_midi_pm, ticket aud_midi_01)
- Open work: align the first core ticket (S1) with the release of
  `aud_midi_standard`; agree the shared major-version rule across the
  two families

## Decision

`aud_audio_core` depends on `aud_midi_standard` for every MIDI type it
needs: MIDI 1.0 messages and byte streams, UMP packets and MIDI 2.0
messages, note numbers, controller numbers and the codecs between
them. The engine defines no interim MIDI event types of its own; event
ports carry `aud_midi_standard` messages next to the OSC-typed control
messages. `aud_audio_midi` bridges `aud_midi` ports into the graph on
the same types.

## Why

- One MIDI model for the whole Audanika ecosystem; translations between
  MIDI 1.0 and 2.0 exist once, in the standard package.
- `aud_midi_standard` is dependency-free and compiles for VM, web and
  Wasm, so the core inherits no platform code from it.

## Consequences

- S1 waits for the first release of `aud_midi_standard`; the spikes
  (S0) do not.
- MIDI 2.0 and per-note expression reach the graph through the UMP
  types from the start.
