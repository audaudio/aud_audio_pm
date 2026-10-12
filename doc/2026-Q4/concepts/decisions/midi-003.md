# midi-003: External MIDI sounds at a fixed latency

- Status: accepted
- Date: 2026-10-12
- Canonical source: tickets/2026-10-12-26-bridge-aud-midi-ports-into-the-engine-on-ios-and-android.md
  (scope 2, question 2)
- Refines: [graph-001](graph-001.md) — "live events are delivered as early
  as possible" holds for `immediate`; timestamped external input waits for
  its constant latency
- Open work: the margin m and the late share on the reference devices
  (ticket 26, step 5 and 8); the Pixel and the iPad Pro M5

## Decision

Every event source has a timing policy. `fixed`, the default for external
MIDI, lets an event sound at its timestamp plus a constant
C = P + L + m: L the output latency as the stream reports it (callback to
first frame out; on iOS it contains a block already); P the 99.9th
percentile of the gaps between two renders since the last reset of the
time filter, the stream's period before there are any; m a margin for the
delivery inside the device, the residual of the time filter and early
callbacks: at least 1 ms, and the input's own 99.9th percentile of the
delivery delay once a thousand events measured it. C is set when the
source is created and again after every reset of the time filter and
every restart; in between it only grows. The measurements of ticket 26
replaced the first rule of the plan review - P as the longest gap since
the start, m fixed at 1 ms: a single start-up gap of 177 ms held the
iPhone's C at 214 ms, and the Galaxy Tab S4 delivers with a p99.9 of
5.85 ms where the iPhone needs 0.35 ms. An event that misses
its target plays at the start of the block and counts as late with its
lateness. `fixed` events carry no `AUD_EVENT_FLAG_LIVE`, so the lead of the
path places them at T + C at the output. `immediate` plays an event at the
start of the block that drains it, with `AUD_EVENT_FLAG_LIVE` (graph-001).
Offline the virtual timeline and an explicit C keep the renders
deterministic.

## Why

- With the numbers of ticket 25, `fixed` sounds 27.0 ms after a key on
  the iPhone 16 Pro Max, every time; `immediate` sounds 20.7 to 26.0 ms
  after it, a jitter of a whole block (5.3 ms). On the Galaxy Tab S4 it is
  40.4 ms against 31.4 to 39.4 ms with 8 ms of jitter.
- `fixed` is ticket 17's budget exactly — one block plus the output
  latency plus the transport's own latency, with m as part of the
  transport — and removes the jitter at the cost of half a block on
  average plus m.

## Consequences

- The MIDI bridge (midi-002) creates its sources with `fixed` and C from
  the engine's timing; an input can switch to `immediate`.
- The example and the statistics report the input to output time: the
  engine's estimate from an event's timestamp to the output time of its
  frame.
