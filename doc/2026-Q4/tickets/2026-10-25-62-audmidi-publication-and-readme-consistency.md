# 62: audmidi publication and README consistency

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
2 and 8); awaits the user's confirmation. Phase 7 of the plan; size S;
depends on nothing. Numbered here; decisions in `aud_midi_pm`.

## Goal

pub.dev and the READMEs tell the truth about the audmidi family. The
umbrella, core, standard, rtp and network pubspecs declare `platforms:`,
so pub.dev stops tagging `aud_midi` as web-only; every pubspec gets
`documentation:` (pub.dev's API reference until the site of ticket 63)
and `issue_tracker:`; the READMEs of `aud_midi` and `aud_midi_standard`
install from pub.dev instead of a git URL and every README names pub.dev;
the umbrella README gains the per-platform feature matrix of the review
and a getting-started that is not a benchmark table; the verification logs
of the apple, android and windows READMEs move into `aud_midi_pm`; the
`aud_midi/example/README.md` template text goes; the changelogs lose
their duplicates, the wrong pin claims and the empty 0.1.3; `index.jsonc`
of `aud_midi_pm` stops promising blog posts, or the repo gets the blog
layer; the android README and native-001 agree on what was verified with
hardware; standard-001 is accepted or dropped; a lockstep check warns
when a family version drifts, as `aud_midi_android` 0.2.1 did. Serves the
audmidi goal.

## Requirements

From the area [framework](../../requirements/framework.md), accepted
2026-10-25:

- req-framework-002: Every README says the state and the platforms

## Affected repos

- The ten audmidi packages: pubspec fields, READMEs, changelogs; patch
  versions.
- `aud_midi_pm`: the verification logs as a topic, the README matrix
  source, standard-001, the blog question, a `versions.md` or the check
  script.

## Steps

1. The pubspec fields; a release of the five packages pana mis-tags;
   verify the tags on pub.dev.
2. The READMEs and the changelogs.
3. The PM repo: logs, decisions, the lockstep check.

## Open questions

- Blog posts for audmidi: add the `dna_blog` layer to `aud_midi_pm` (the
  gg workflow writes one per ticket) or drop the claim?
