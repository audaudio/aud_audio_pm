# release-002: Milestone M1 — the Audanika app on iOS and Android

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/review-2026-10-08-plan-scope.md (point 1);
  decisions/release-001.md
- Open work: owners and capacity per step (open question 5); the
  reference devices for the budgets (open question 6). The minimal MIDI
  bridge held in reserve below is void: the `aud_midi` family is
  available, S8 builds on its ports (2026-10-08, ticket 19)

## Decision

The first product release is bounded: the Audanika app plays its real
instruments reliably on iOS and Android through the new engine. In scope are
the creation of all repos S00, the mobile spike gate S0-mobile, the core S1,
the graph S2 with its reference nodes, the IO S3 for iOS and Android, the
umbrella S4, the MIDI bridge S8 (or, if the `aud_midi` family is not ready, a
minimal bridge that maps the app's existing MIDI event stream into the graph),
the sampler S9, a minimal CI (S22) and benchmark (S24), and the early app
integration S29a; reverb and delay follow as milestone M2 (release-003).
Everything else — desktop and web, the parallel scheduler, sequencer, Link,
the UI packages, plugin shells, the docs site beyond the package READMEs, the
extensions of phase 7 — is conditional on M1 shipping and is planned, not
promised. The milestone is verified by the instrument reference suite and the
budgets of the verification section on the reference devices.

## Why

- The plan covered an engine, an instrument library, a sequencer,
  synchronization, editors, remote control, plugin formats and six
  platforms without a first release anyone could ship; the review named
  it and asked for scope cuts.
- Proving the engine in the actual app early finds the contracts that
  matter; the legacy engine covers exactly these two platforms.
