# backing-001: aud_audio_backing on aud_dsp_stretch

- Status: proposed
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's requirement at the plan review on
  2026-10-08 (R34): a multitrack backing player with loops and tempo
  changes without pitch change
- Open work: the song document schema; stem groups versus per-stem
  stretching on the reference devices; whether transitions beyond
  quantized song switching (crossfades, fills) are wanted

## Decision

Two packages carry the requirement. `aud_dsp_stretch` is a time-stretch
and pitch-shift node on Signalsmith Stretch (MIT, header-only C++,
real-time capable): a continuous stretch ratio, an independent pitch
shift in semitones, a shared block configuration so that several
instances stay phase-coherent, latency reported to the compiler. It is
reusable on its own (sampler, files, live input).

`aud_audio_backing` is the multitrack backing player built on it and on
`aud_audio_file`: a song document (JSON) names the stems, the song's
original tempo and time signature, its bars and loop regions; a
`BackingPlayer` node group streams every stem from disk through a
read-ahead worker, runs each stem (or stem group, to save CPU on
mobile) through a stretch node and a per-stem gain, mute and solo into
a mixer; the transport drives the read position — the song's beat maps
to source samples at the original tempo, and the stretch ratio is the
song tempo over the transport tempo, so a tempo change from Link or
from the user changes the speed and keeps the pitch; a global pitch
shift transposes the song. Loops are musical regions, sample-accurate
at the source tempo and crossfaded at the seam; start, stop and loop
jumps are quantized to the transport's quantum; the next song is
preloaded and switched in at a quantum boundary, so songs follow each
other without a gap. Dart API: `AudBackingPlayer`, `AudSong`,
`AudStem`, `AudLoopRegion`.

## Why

- The owner's requirement; a sequencer or a file player alone provides
  neither coherent multi-stem stretching nor transport-driven loops.
- Signalsmith Stretch is the only high-quality stretch library under a
  permissive license: Rubber Band is GPL or commercial, SoundTouch is
  LGPL, élastique is commercial (license-002).
- Stretching stems individually keeps mute and solo per stem; stem
  groups bound the CPU cost where the budget demands it.
