# 53: Sequencer render stage in the ABI

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
8, open decisions); awaits the user's confirmation. Phase 4 of the plan;
size S; the precondition of step S14; depends on ticket 46 (one ABI bump).

## Goal

The sequencer can be built. seq-001 puts it "on the callback thread before
the graph", but the graph has no such stage — `grep -i sequenc` over its
sources finds only sequence numbers — and the stub cannot start without an
ABI extension. The ABI gains a render-stage provider, registered through
the C ABI like the transport provider (`aud_abi.h:652-654`), that the
callback thread runs once per block before the graph with the transport
snapshot, the block's output time and a way to push timestamped events
into the graph's event sources (interop-003); the headless host and the
offline renderer run it too, so plugin shells and goldens cover it. It
ships inside ABI 0.5 (ticket 46) so that the native packages rebuild
once. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md) (R15: a
sequencer).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_audio_core`: the provider vtable and its registration in ABI 0.5;
  part of ticket 46's minor version.
- `aud_audio_graph`: the stage in the render loop, the headless host and
  the offline renderer; a test stage in the native tests; minor version.
- `aud_audio_pm`: decision `seq-002` (the stage); seq-001 refined; the
  plan of S14 names it.

## Steps

1. The decision with the user: the stage's contract (what it may touch,
   its budget, how it reports lateness).
2. The vtable in the ABI bump of ticket 46.
3. The stage in the graph with a test provider and a golden.
4. seq-001 refined; S14 planned as its own ticket.

## Open questions

- Does the stage also serve `aud_audio_link`'s quantized launches and the
  app's script modulator (which has a thread of its own today), or stays
  it sequencer-only?
