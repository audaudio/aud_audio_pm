# family-002: Every package has a version of its own

- Status: accepted
- Date: 2026-10-12
- Canonical source: Gabriel Gatzsche's instruction at the review of ticket
  26 on 2026-10-12
- Supersedes: the versioning of [family-001](family-001.md) — shared major
  version, released together, the umbrella pins exact versions
- Open work: none

## Decision

The packages of the `aud_audio` and the `aud_midi` family are versioned
independently. A ticket publishes only the packages it changes, and each
gets the increment of its own change: in `0.x` a patch for additions and
fixes, a minor for a break, for example a new abstract member of an
exported interface. A package that would change only its references or
constraints because a sibling changed stays out of the ticket; when gg
keeps it in the ticket because it sits between two of the ticket's repos,
its branch is reset to `main`. Dependents keep caret constraints at the
lowest version they need (`^0.1.1`), so that unchanged siblings still
resolve; the umbrella pins no exact versions. The C ABI version checked at
registration stays the compatibility gate between native packages
(abi-001).

## Why

- Releasing every package of a family per ticket publishes versions
  without a change and forces constraint bumps through packages that did
  not change.
- Caret constraints at the needed version let each package evolve at its
  own pace, which family-001 named as the strength of the ecosystem cut.

## Consequences

- Ticket 26 publishes `aud_midi_core`, `aud_midi_apple` and `aud_midi` as
  patches, `aud_midi_android` and `aud_audio` as minors; the backends of
  Linux, Windows, the web and the network, `aud_audio_io`, `aud_audio_web`
  and `aud_dsp_sampler` stay unpublished.
