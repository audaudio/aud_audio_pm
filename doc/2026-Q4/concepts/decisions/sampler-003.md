# sampler-003: The sampler loads into a standby synth and swaps with a crossfade

- Status: accepted
- Date: 2026-10-11
- Canonical source: tickets/2026-10-11-25-build-the-sfz-sampler-on-sfizz-for-ios-and-android.md
  (questions 3 and 6, Findings)
- Refines: [sampler-001](sampler-001.md) — loads and the node
- Open work: per-note pitch bend and the other per-note controllers of
  MIDI 2.0 with the note expressions of S18 and S19; a retuning that keeps
  the notes that sound; disk streaming through a small ring buffer per
  voice, so that a voice needs the same memory whatever the length of its
  sample - today a note that plays holds its whole file in memory, as in
  sfizz, which matters for samples of minutes and for the file player

## Decision

A string setting of `aud.sampler.sfz` starts a load on a worker thread of
the engine and returns its id at once. The load fills a standby synth
configured like the active one. The audio thread adopts it at a block
start and fades the old synth out over 5 ms. The new synth starts without
notes and takes over the controllers, the pitch bend, the channel pressure
and the program of the old one as restored values: no region that a
controller triggers starts, and sfizz's controller smoothers start at these
values. The node plays the old instrument until the swap; a newer load
cancels a pending one; a failed load keeps the old instrument. A load fails
when sfizz cannot parse the instrument, when it cannot read any of its
samples, or with `AUD_ERROR_CAPACITY` when the heads of its samples alone
exceed the sample cache budget (lifecycle-002); a load that ends well names
the samples it could not read and the effect types sfizz does not know,
which pass the signal through. The polyphony and the tuning - its frequency
and the stretch - apply through the same standby synth, since sfizz sets
its voices only while it does not render and its tuning tables allocate;
the virtual path of a text starts no load of its own. Of the per-note
messages of MIDI 2.0, poly pressure reaches sfizz; per-note pitch bend,
registered and assignable per-note controllers and per-note management are
counted and reported as `AUD_ERROR_UNSUPPORTED`.

## Why

- A load must neither block Dart or the audio thread (interop-001,
  lifecycle-001) nor cut the instrument that plays; the standby synth
  costs the memory of two instruments during a swap only.
- sfizz's contract marks the voice count OFF, and its tuning allocates;
  the reload keeps both away from the audio thread.
- sfizz has no per-note pitch bend; counting the rest keeps the loss
  visible.
