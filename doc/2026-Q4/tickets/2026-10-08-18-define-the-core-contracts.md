# 18: S1 — Define the core contracts of aud_audio_core

## Goal

Turn the spike seed of `aud_audio_core` into the contracts the family
builds on — step S1 of the plan of ticket 17 (milestone M1, size L): the
versioned C ABI of abi-001 with capabilities, allocator ownership, thread
affinity tags, state serialization and latency and tail reporting; the
buffer and event formats with the UMP event model of midi-001 and per-note
controllers for MPE and MIDI 2.0; the descriptors and their Dart contracts;
the typed command model with the OSC adapter over it (osc-001); the node
preset schema as JSON; the timing contract of time-001 — three time domains
with validity, the sample-to-host-time filter with its reset rules,
transport segments and capabilities, the provider vtable; and the notices
file convention of license-001 with its check. S2 (graph), S3 (io) and the
DSP tickets then implement against a fixed contract instead of the spike's
subset. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md).

`audaudio.github.io` joins the ticket: its main page broke on 2026-10-08
and is repaired, and its README follows the documentation instead of the
README rules the DNA layers carry.

## Affected repos

- `aud_audio_pm`: this plan; S1 marked in the plan of ticket 17; the open
  work of abi-001, time-001, osc-001, graph-002 and license-001 updated.
- `aud_audio_core`: ABI 0.2 in `src/aud_abi.h` — in major 0 the minors must
  match exactly, from major 1 an engine accepts older package minors and
  reports the oldest it still accepts; result codes, capabilities (state,
  latency, tail, transport, event output, resets on stop and seek), thread
  tags (control, realtime, offline); bus, event port, parameter and string
  key descriptors; `AudEvent` as four UMP words or a numeric control or
  parameter event with a sample offset and a port; `AudProcessContext` with
  planar buses, the block's events and the transport snapshot;
  `AudTimestamp` with the domains immediate, sample, host and beat (beats
  as fixed point, factor 2^31 as CLAP does) and the source of a host time;
  `AudStreamTime`, `AudTransportSegment`, `AudTransportSnapshot`,
  `AudTransportRequest` and `AudTransportProviderVTable`; the node vtable
  with `reset(reason)`, `get_latency`, `get_tail`, `save_state` and
  `load_state`; `AudRenderRequest` and `AudRenderFunction` as the renderer
  interface of plugin-002. Header-only C: `aud_time_filter.h` (least
  squares over a window of callback timestamps, resets on discontinuities),
  `aud_transport.h` (beat, sample and host time conversions over the
  segments), `aud_ump.h` (packet sizes, status, note and per-note controller
  fields, MIDI 1.0 bytes into UMP). Header-only C++: `aud_param_ramp.hpp`,
  `aud_node_base.hpp` (splits the block at event offsets with a minimum
  sub-range of 16 frames, advances the ramps, delivers events; graph-002)
  and `aud_fixed_block_adapter.hpp` (re-blocks and reports its latency).
  The native library grows from the version and size functions into the
  handle APIs of the filter, the conversions, the ramp and the adapter and
  registers the reference node `aud.core.gain` built on the base class.
  Dart: `AudAbi`, `AudTimestamp`, `AudTransportSnapshot` with the same
  conversions, `AudTimeFilter`, `AudEvent` from `aud_midi_standard`
  messages, the descriptors with JSON, `AudOscAddress` and patterns,
  `AudOscMessage` and bundles, the typed commands and replies, the
  `AudOscRouter` and `AudOscAdapter` with the timetag rules, and
  `AudNodePreset` with its JSON schema. `scripts/check-notices.js` (Node.js)
  checks the notices convention; `doc/guides/notices-guide.md` describes it.
- `audaudio.github.io` (`audaudiohub.io` in the workspace): the Pages
  source is set back to GitHub Actions and the site redeployed;
  `scripts/check-pages-source.js` keeps it there from the deploy workflow;
  `AGENTS.md` exempts the README from the DNA README rules and lets the
  documentation feed it; the README is rewritten from the landing page and
  the overview.

## Steps

1. Done: ticket 18 with the three repos; this plan and the row in
   `doc/issues.md`.
2. Done: the docs site — the Pages source was found on the branch build
   (Jekyll served the README, `/overview/` answered 404); set back to
   GitHub Actions through the API and redeployed on 2026-10-08; the check
   script runs before every deploy; `AGENTS.md` carries the README rule
   and the README mirrors the landing page and the overview.
3. Done: ABI 0.2 and the header-only utilities; every header compiles as
   C and as C++17.
4. Done: the native library as C++17 with the handle APIs and
   `aud.core.gain`; the bindings regenerated; 18 struct sizes agree
   between Dart and C.
5. Done: the Dart contracts, 17 files in `lib/src`.
6. Done: the notices guide, `scripts/check-notices.js` with fixtures and a
   Dart test; the core passes its own check.
7. Done: 110 tests at full coverage of the Dart sources; `dart analyze`,
   `dart format` and the DNA test clean; README and `index.jsonc`.
8. Done: the open work of abi-001, time-001, osc-001, graph-002 and
   license-001 updated; S1 is marked done in the plan of ticket 17.
9. Done: review-light with four fixes (inlet port of OSC events, nominal
   rate on a backwards host clock, frame checks of the adapter wrapper,
   slug validation of the Pages check); pull requests green.

## Findings

- The native core had to become C++17 for the node base class and the
  adapter; the hook links `c++_static` on Android like the spike packages.
- ffigen skips the static inline helpers of the headers; the Dart side has
  its own (`AudEvent.bitsOfFloat`, `AudAbi.isCompatible`).
- The Dart contracts reuse the struct names of the ABI; the barrel hides
  the native structs and `aud_audio_core_bindings.dart` exports them raw.
- The node base delivers an event inside a sub-range at the sub-range end
  (at most 16 frames late) and events at or beyond the block end after the
  last range, so no event is lost.
- The spike packages (graph, io, effects, sampler) stay on core 0.1.0 by
  tag until S2, S3, S9 and S10a move them to ABI 0.2.

## Open questions

1. ABI versioning before 1.0: this ticket lets major 0 require an exact
   minor match, so every spike package has to move to 0.2 with its own
   ticket (S2, S3, S9, S10a). Alternatively 1.0 could be declared now; the
   plan keeps 0.x until the graph (S2) has rendered through the full
   contract once.
2. The OSC adapter converts a timetag into host time through the offset
   between the wall clock and the host clock measured at adapter creation;
   a remote sender with a different clock needs a session offset
   (`aud_audio_osc`, S7).
3. Beat-time scheduling over OSC: the adapter accepts an explicit beat
   argument on `/graph/<id>/transport/...` requests, but events over OSC are
   scheduled in host time only; the sequencer schedules in beats through
   the Dart command API.
