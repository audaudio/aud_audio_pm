# graph-002: Variable blocks with sample-accurate events

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's answer at the plan review on
  2026-10-08; decisions/graph-001.md (the block model and the rejected
  fixed quantum)
- Open work: choose the default minimum sub-range (16 frames proposed)
  and the adapter API in the core ticket

## Decision

The engine renders exactly the frames the device callback or the plugin
host delivers, up to a maximum fixed at prepare time. Each node receives
its block and the events inside it; the node base class of
`aud_audio_core` splits the block into sub-ranges at the event offsets,
with a configurable minimum sub-range that bounds the overhead, and
advances parameter ramps per sub-range. Nodes that need constant frame
counts use the core's fixed-block adapter, which re-blocks inside the
node and reports its latency to the compiler. A fixed 64-sample quantum
was considered and rejected (graph-001).

## Consequences

- No FIFO between device and graph; no added latency or jitter.
- Every node's process function accepts any frame count up to the
  prepared maximum.
- Golden-file tests fix the block sequence they render with.
- The parallel scheduler works on whole blocks; sub-ranges stay inside a
  node's job.
