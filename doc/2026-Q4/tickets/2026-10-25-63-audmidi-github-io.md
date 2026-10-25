# 63: audmidi.github.io

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
3); awaits the user's confirmation. Phase 7 of the plan; size M; depends
on tickets 57 and 62. Numbered here; the decision in `aud_midi_pm`.

## Goal

The audmidi family has the site its organization profile already links
to. The repo `audmidi/audmidi.github.io` is created from
`audaudio.github.io` — the same stack, deploy workflow and
`check-pages-source.js` — with a decision `docs-001` in `aud_midi_pm`, and
holds: start and overview; getting started (`Midi.open()`, the pub.dev
install, the entitlements and permissions per platform); concepts — the
MIDI isolate and proxies (isolate-001), ports, hot-plug and fingerprints
(ports-001), timing and scheduling (scheduling-001, the `midi_bench`
numbers), MIDI 1.0, 2.0 and UMP with the translation rules
(translation-001, standard-001), network MIDI (network-001), Bluetooth LE,
native taps and the bridge into the audio engine (native-001); one page
per package synced from the READMEs with the verification matrix; the API
as links to pub.dev; references and licensing from
`doc/references/README.md`; contributing; release notes. Until the site
is live, the organization's website field points at pub.dev. Serves the
audmidi goal and [flutter-audio-kit](../goals/flutter-audio-kit.md)
(R16: one documentation standard for both families).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `audmidi.github.io` (new repo): the site; `scripts/setup-github-repo.js`
  of the template creates it with the Pages deployment.
- `aud_midi_pm`: decision `docs-001`, the site in the architecture, the
  verification matrix as the page's source.
- The ten audmidi packages: `documentation:` points at the site (patch
  versions, bundled with the next release of each).

## Steps

1. The decision; the website field set to pub.dev.
2. The repo from the audio site; the theme shared.
3. The pages, in the order above; the package pages synced.
4. The `documentation:` fields; the website field set to the site.

## Open questions

- Tested snippets for MIDI pages: the fake backend of `aud_midi_core`
  renders nothing — the snippets run as plain Dart tests against
  `FakeMidiBackend`; confirm that this is enough.
- Share the theme and the components with the audio site through a
  package, or copy once? Proposal: copy once, share when the third site
  comes.
