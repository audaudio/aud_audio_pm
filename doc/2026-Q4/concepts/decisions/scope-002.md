# scope-002: No backward compatibility with the existing Audanika app

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's instruction during ticket 19;
  topics/legacy-audio-engine.md
- Open work: none

## Decision

The Audanika Audio Engine owes the existing Audanika app and its legacy
`audio_engine` plugin nothing: no preset format is loaded, converted or
emulated, no parameter set or API of the legacy engine is carried over,
and no ticket has "the legacy presets play through it" as a goal. The
sampler (S9) plays SFZ instruments stored as node presets; the app
migration (S29b) rebuilds the instruments of the app as SFZ files and
graph documents on the new engine; the instrument reference suite is
defined against those new instruments. The legacy engine remains a source
of knowledge — its findings on Oboe, on the platforms and on what the
instruments need live in `topics/legacy-audio-engine.md` — but not a
contract.

## Why

- Carrying the legacy preset semantics into the sampler and the effects
  would bind the new contracts (node presets, graph documents, parameter
  ids) to a format that the plan replaces anyway.
- The migration of the app is a rewrite of its audio layer; rebuilding
  the instruments on SFZ is cheaper than a converter that has to match
  the old engine note for note.

## Consequences

- S9, S10a, S29a and S29b of the plan of ticket 17 lose their legacy
  clauses; the verification section measures instrument loads and the
  reference suite on the new instruments.
- The spike of ticket 5 played a legacy preset through the sfizz fork to
  prove the build; that proof stands, the preset does not become a
  requirement.
