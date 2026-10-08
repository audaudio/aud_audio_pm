# license-002: All aud_audio packages are MIT; no LGPL anywhere

- Status: accepted
- Date: 2026-10-07
- Canonical source: Gabriel Gatzsche's answers at the plan review on
  2026-10-07; topics/licenses-and-dsp-sources.md
- Open work: none

## Decision

Every package of the aud_audio family is published under the MIT
license with Audanika as the copyright holder — the LICENSE the
`dna_audanika` layer ships is this MIT text. LGPL code is not used in
any form: not copied, not linked, not as an optional backend. Where a
candidate is LGPL, a permissive alternative is used or the algorithm is
re-implemented from the published literature. Dual-licensed SDKs with a
proprietary option (Ableton Link, ASIO) remain possible only in their
separate packages under that proprietary license.

## Consequences

- Csound-derived Soundpipe modules, libsndfile and liblo are out;
  dr_libs, tinyosc or oscpack and re-implemented algorithms take their
  place (dsp-001, sampler-001, osc-001).
- Faust-generated code is taken only from functions declared STK-4.3 or
  MIT, not from LGPL-with-exception ones.
- The notices file of every package names MIT as the package license
  and lists the permissive licenses of the copied code.
