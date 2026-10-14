# sampler-008: The sampler limits its voices in real time and shares one voice budget per process

- Status: accepted
- Date: 2026-10-14
- Canonical source: tickets/2026-10-13-29-limit-the-voices-by-the-cpu-power-of-the-device.md
  (decisions 2 and 5 of the plan review; Gabriel Gatzsche's answers on
  2026-10-14: "released first, then oldest", "10ms + always keep n (3-5)
  voices empty", "voices only")
- Refines: [lifecycle-001](lifecycle-001.md) — "instrument nodes bound their
  polyphony and steal voices"; [lifecycle-002](lifecycle-002.md) — the
  voice budget belongs to the process like the sample cache budget;
  [sampler-003](sampler-003.md) — the polyphony still loads the
  instrument again, the voice limit does not
- Open work: a removed node keeps its counts until the graph destroys it,
  and a suspended graph keeps them; the per-node share of the excess is
  exact only for nodes on one audio thread

## Decision

`aud.sampler.sfz` has a parameter `max_voices` (1 to 256, default 256 — no
limit beyond the polyphony) that takes effect at the next block without a
load. All sampler nodes of the process share one voice budget
(`AudDspSampler.voiceBudget`, 0 lifts it) and a reserve of free voices
(`AudDspSampler.voiceReserve`, 4 by default, 0 to 16). At the end of the
events of each block a node counts its sounding voices (playing, not
stolen) and the released ones among them (key and pedal up) over its
active and its fading synth, publishes them to atomics of the process and
steals what lies beyond `max_voices - reserve` and its share of what lies
beyond `budget - reserve`: released voices first, shared out by each
node's released voices, then held voices by each node's held voices; a
node with at least the average share steals at least one. Within a node
the released voices go first, the oldest first, and all layers of a note
go together. A stolen voice fades out linearly over 10 ms and is free at
the end of the fade — no release trigger, no note off, no 50 ms tail. New
notes are never refused. sfizz's own polyphony limits stay as they were,
so the output of an instrument within its limits does not change. The
budget holds for live renders; offline renders count no voices and steal
none for it, `max_voices` holds for both. Counters that are never reset —
the voices stolen and the voice frames rendered —
(`AudDspSampler.voiceStats`) replace a diagnostic per block: a code of its
own would need ABI 0.5 of `aud_audio_core`, and a notification per
stealing block would fill the queue. The sample quality stays where the
instrument sets it; the budget steals voices only.

## Why

- sfizz sets its voices only while it does not render; a limit that
  follows the load while a person plays must work below the allocated
  voices.
- With a reserve a new note always finds a free voice and starts at once
  while the stolen voice fades; without it the new note would cut a voice
  hard or wait.
- Released voices are dying away; the oldest held voices are the ones a
  player notices least. A linear fade of 10 ms starts gentler than sfizz's
  exponential off of 6 ms, which loses 13 dB in its first millisecond.
- Lowering the sample quality would change the sound of every note; stealing
  removes only notes that are already fading or old.
