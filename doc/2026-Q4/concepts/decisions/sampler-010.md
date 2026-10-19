# sampler-010: A missing include fails the load; note_offset can keep the outer keys

- Status: accepted
- Date: 2026-10-19
- Canonical source: tickets/2026-10-14-32-share-sample-sets-between-sfz-presets.md
  (scope 4 and 7, answer 2), done in ticket 31
- Refines: [sampler-002](sampler-002.md) — changes of the fork in place;
  [sampler-003](sampler-003.md) — a failed load keeps the instrument
- Open work: a key center that `note_offset` pushes past 0 or 127 is
  still clamped (no content needs it)

## Decision

The sfizz fork of `aud_dsp_sampler` fails a load whose `#include` names a
file it cannot read, even when other regions load; the node's load message
names the missing files relative to the folder of the SFZ file (the graph
keeps 255 bytes of a message), and the old instrument plays on. A new
`<control>` opcode `note_offset_open_bounds` (`on`/`off`, default `off`)
keeps a region that reached key 0 or 127 before the shift of `note_offset`
and `octave_offset` at that key after it, pitched by its key center and
`pitch_keytrack`; without it nothing changes, and the goldens stay bit for
bit. Version 0.3.4.

## Why

- A sample set shared through `#include` must not fall silent unnoticed
  when its file moves.
- `note_offset` clamps the keys it shifts, so a transposition of +12
  silenced the keys 116 to 127, which the app's chord section reaches; the
  legacy engine played its highest root there.
