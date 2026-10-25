# 43: Notices and licenses in every repo

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
8, licenses); awaits the user's confirmation. Phase 1 of the plan; size S;
depends on nothing.

## Goal

Every repo that vendors third-party code checks its notices on every
commit, every `LICENSE` file grants what it says, the Link package carries
the license flow link-002 requires before its first line of code, and the
LGPL declarations in the ALSA bindings of `aud_midi_linux` are named.
Serves [flutter-audio-kit](../goals/flutter-audio-kit.md) (its measure
"every copied line of third-party code carries a permissive license and
its notice", R26, R27).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `dna_audanika`: `check-notices.js` becomes a DNA script that runs in the
  quick check of every repo with `src/third_party`; the four copies in
  core, midi, script and effects give way to it.
- `aud_audio_io`, `aud_audio_vst3`, `aud_dsp_sampler`: the check runs
  (today missing in the three largest vendor trees); fix what it finds.
- `aud_audio_link`: `LICENSE-ABLETON-LINK.md`, the README notice and the
  build-time message of link-002, before any code; the pubspec description
  stops claiming the fetch until it exists.
- `aud_midi_linux`: `NOTICES.md` naming alsa-lib 1.2.16.1, LGPL-2.1+, for
  the generated declarations in `alsa_bindings.g.dart`.
- Every repo of both families: the `LICENSE` text — "Copyright (c)
  Audanika. All Rights Reserved." under the MIT heading — replaced by the
  plain MIT copyright line, if the user confirms (open question 4 of
  ticket 40); `audaudio.github.io` gets its missing `LICENSE`.
- `aud_audio_pm`: license-001 accepted with the file name the repos use
  (`src/third_party/NOTICES.md`); a note on `LicenseRegistry` — a
  `notices` export apps can register — as open work of the node kit
  (ticket 45).

## Steps

1. The DNA script and its test; release the layer.
2. Run it in io, vst3 and sampler; fix the findings.
3. The Link license files and the description.
4. The ALSA notice.
5. The LICENSE text across both families after the user's answer.
6. license-001 accepted; patch versions.

## Open questions

- The LICENSE wording (open question 4 of ticket 40).
