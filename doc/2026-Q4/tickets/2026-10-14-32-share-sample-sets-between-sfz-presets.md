# 32: S29d — Share the sample sets between the SFZ presets with #include

Status: planned 2026-10-14 during ticket 31, on the user's request ("The
SoundPrism sample concept distinguishes between sample sets and presets
… plan a ticket where some kind of #include directive is added to SFZ
files to include the loop points of sample sets"). On 2026-10-18 the user
decided to do it as part of ticket 31; its results are recorded there.

## Goal

A sample set — its samples with their roots, key ranges and loop points —
exists once in the app's content, and every preset that plays it includes
it instead of copying it, as in SoundPrism and the legacy engine, where
presets reference sample sets by ID. A loop point fixed in a sample set
reaches every preset; a preset file shows only what makes it a preset:
the transposition, the gain, the envelope and, from ticket 31, the
modulation targets. The samples switch from WAV to FLAC (the user's answer
in the review of ticket 31). The converters of app-001 and of ticket 31
write this layout. Refines app-001; serves the app integration of S29a.

## What the code base gives

- `content/sfz` (app-001) holds 6 sample sets with 71 regions. The 20
  preset files (channels 0 to 2 and `external` of 5 presets) copy the
  regions of their set: 309 regions in 26 files, 238 of them copies.
- A copy differs from its set only in the path prefix
  (`../../samplesets/<id>/`) and, in 9 files, in the keys, shifted by ±12
  for the preset's transposition; the converter keeps the outer bounds
  open (the lowest region starts at key 0, the highest ends at 127).
  Samples, roots, loop modes and loop points are identical.
- Every file also repeats the same blocks: the CC 7 curve and the
  velocity curve (128 points each) and the global level.
- SFZ already has the directive: `#include "file.sfz"` and
  `#define $NAME value`. The sfizz fork parses both. An include resolves
  relative to the directory of the root file, `$` variables expand in its
  path, virtual paths (`apk:/`, sampler-004) go through the fork's file
  backends, the include depth is limited and a file included twice is
  skipped. No new directive is needed.
- Sample paths in an included file resolve against the root file and
  `default_path` (`<control>`), not against the included file.
- `note_offset` (`<control>`) shifts the keys of every region — the
  transposition of the legacy engine — but clamps at 0 and 127
  (`Region::offsetAllKeys`): shifted by −12, the E-Piano's highest region
  ends at key 115 instead of 127, so keys 116 to 127 fall silent.
- The samples are WAV files (`samples/NNN.wav`, 28 MB of content in all).
  The fork reads FLAC through dr_flac, whose shared CPU detection ticket
  28 made thread-safe (sampler-005); a FLAC file keeps the frames, so the
  loop points stay. FLAC has not played in the app yet.

## Scope

1. **The sample set**: `samplesets/<id>/regions.sfz` holds only the
   `<region>` lines (`sample=samples/NNN.wav`, keys, root, loop). The
   set's `instrument.sfz` includes it and stays playable alone.
2. **The preset** names its set once (`#define $SET <id>`), then:
   `<control>` with `default_path=../../samplesets/$SET/` and
   `note_offset` for the transposition, the shared blocks, the `<group>`
   with the envelope and the gain, and
   `#include "../../samplesets/$SET/regions.sfz"`. sfizz expands `$`
   variables in include paths and in opcode values.
3. **The shared blocks**: `common/legacy-engine.sfz` with the CC 7 curve,
   the velocity curve and the global level, included by every set and
   every preset. The order of the headers (a second `<control>` resets
   `default_path`) is settled by the tests of step 2.
4. **The bounds under a transposition**: standard `note_offset`, without
   a change of the fork. The 12 keys that fall silent — 0 to 11 under a
   transposition of −12, 116 to 127 under +12 — lie outside an 88-key
   keyboard (21 to 108); a test checks that the app's play modes never
   send them. The render comparison leaves them out. Only if that test
   fails, the fork gets an opt-in that keeps the bounds open.
5. **FLAC**: the converter stores every sample as FLAC
   (`samples/NNN.flac`); the WAVs leave the app.
6. **The converters**: `tool/convert-content-bundle.js` writes the new
   layout; `tool/convert-soundprism-link-edition.js` of ticket 31 uses it
   from the start (46 sets, 69 channel presets).
7. **Tests**: every preset renders the same before and after (an offline
   render of a set of notes per preset, within sampler-007), FLAC
   included; loads through `apk:/` on Android and from the bundle on iOS;
   an `sfz_text` load with `sfz_virtual_path` resolves its includes; a
   missing include fails the load with a message that names it.
8. **Measurements**: the size of the content and of the app before and
   after, and the load time of a preset with FLAC decoding on the Galaxy
   Tab S4 and the iOS simulator.

## Affected repos (expected)

- `audanika_app`: the converter, the regenerated content as FLAC (no
  audible change), the render comparison, the measurements.
- `aud_dsp_sampler`: tests of includes, `$` variables, `default_path`
  and `note_offset` over virtual paths and text loads; a patch version,
  or a minor one if the opt-in for the bounds is needed.
- `aud_audio_pm`: this plan; a decision that refines app-001.

## Steps

1. Plan review (done 2026-10-14).
2. Includes, `$` variables, `default_path` and `note_offset` in
   `aud_dsp_sampler`'s tests, on the iOS simulator and the Android
   emulator (`apk:/`), and in text loads.
3. The note range of the app's play modes; the opt-in for the bounds
   only if they reach the silent keys.
4. The converter; the content regenerated with FLAC; the render
   comparison of every preset before and after.
5. The app on both platforms; sizes and load times measured; decision,
   review, publish.

## Answers of the plan review (2026-10-14)

The user left these questions to Claude:

1. The shared blocks move into an include too: the same 256 lines of
   curves stand in all 26 files today, and one file is one place to
   change them.
2. The outer keys: standard `note_offset`, no change of the fork. The
   silent keys lie outside an 88-key keyboard; a test of the app's note
   range guards it, and the fork's opt-in follows only if the test
   fails.
3. A preset names its set once with `#define $SET <id>`, so its
   `default_path` and its include cannot point to different sets.
4. This ticket runs before the converter of ticket 31, so that the 69
   channel presets of SoundPrism Link Edition are written once, in the
   shared layout and as FLAC. The other steps of ticket 31 (the package,
   the node, the measurements) do not wait for it.

## Open questions

None.

## Out of scope

Any change of sound; a sample-set format other than SFZ; sharing sample
sets between apps or packages.

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); the standing rules of
process-005.

## Rests on

app-001, app-002, sampler-001, sampler-003, sampler-004, sampler-007,
process-003, process-004, process-005; topics sfizz,
soundprism-link-edition.
