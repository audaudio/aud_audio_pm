# aud_audio_pm

English | [Deutsch](README.de.md)

[![CI](https://github.com/audaudio/aud_audio_pm/actions/workflows/quick_check.yaml/badge.svg)](https://github.com/audaudio/aud_audio_pm/actions/workflows/quick_check.yaml)

Project management repo of the Audanika Audio Engine aud_audio: plans,
decisions, blog posts. No code: the packages of the engine live in their
own repos.

## Motivation

- The Audanika Audio Engine is an ecosystem of packages after the model of
  AudioKit — engine, DSP nodes, UI widgets, sequencer, plugin shells —
  rather than one library. Its goals, requirements, decisions and plans
  span all of them, so they need one place that belongs to no single
  package
- Every `gg` ticket belongs to exactly one project management repo; it is
  added before any code repo and carries the plan of the ticket. A ticket
  that is only planned ends here
- The decisions and the architecture stay reviewable across quarters,
  while the code repos change with every ticket

## Installation

The repo is not a package; check it out next to the code repos, or add it
to a `gg` ticket before its code repos:

```bash
git clone git@github.com:audaudio/aud_audio_pm.git
```

```bash
gg do add aud_audio_pm
```

## Usage

The repo is planned with the `gg` workflow and the planning skills of the
`dna_plan` layer: `/gg-plan-requirements` engineers the goals and the
requirements, `/gg-plan-schedule` cuts them into tickets, `/gg-plan-report`
keeps the reports of the people up to date. The
[project management repo guide](doc/guides/pm-repo-guide.md) describes
the structure and how the planning works; the current quarter is
[2026-Q4](doc/2026-Q4).

- [Issues](doc/issues.md) — the ticket numbers
- [Goals](doc/2026-Q4/goals) — what the quarter is meant to achieve
- [Requirements](doc/requirements) — what the products must do, by area
- [Tickets](doc/2026-Q4/tickets) — one plan per ticket
- [Decisions](doc/2026-Q4/concepts/decisions/000-index.md)
- [Architecture](doc/2026-Q4/architecture/architecture.md)
- [Review of the architecture](doc/2026-Q4/concepts/topics/review-2026-10-25-architecture.md)
  (ticket 40, 2026-10-25) and
  [its implementation plan](doc/2026-Q4/tickets/2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md)
- [Plan 17: Audanika Audio Engine](doc/2026-Q4/tickets/2026-10-07-17-audanika-audio-engine.md)
  (done 2026-10-08)
- [Plan 5: Spike the mobile foundation](doc/2026-Q4/tickets/2026-10-08-5-spike-the-mobile-foundation.md)

## Limitations

- No code and no API: the repo holds documents only, plus the version
  constant `gg` publishes
- The plans describe the systems of Audanika as they are; they are not
  examples

## Documentation

- The guides in [`doc/guides`](doc/guides), the
  [project management repo guide](doc/guides/pm-repo-guide.md) first
- The blog posts in [`doc/blog`](doc/blog), in German in
  [`doc/de/blog`](doc/de/blog)

## Contributing

Tickets run through the `gg` workflow: see the
[Develop Guide](doc/guides/develop-guide.md) and the
[Review Guide](doc/guides/for-ai/ai-review-guide.md).

## License

MIT — see [LICENSE](LICENSE).
