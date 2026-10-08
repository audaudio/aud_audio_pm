# process-001: Ticket IDs are the issue numbers of aud_audio_pm

- Status: superseded by [process-003](process-003.md) on 2026-10-08
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's decision at the plan review on
  2026-10-08
- Open work: none — the numbering moved into `doc/issues.md` of this
  repo (process-003)

## Decision

Every ticket of the aud_audio family is a GitHub issue in
`audaudio/aud_audio_pm`, and the issue number is the gg ticket ID:
`gg do create ticket <number>`, the plan file
`doc/<quarter>/tickets/<date>-<number>-<title>.md`, the pull requests
of the code repos referencing `audaudio/aud_audio_pm#<number>`, and the
blog post of the ticket linking the issue. The issue carries the
discussion; its status lives on an organization-level GitHub Projects
board. Ticket 17 predates the issues and keeps its number as the one
exception.

## Why

- Tickets span several code repos, so they need one numbering per
  family, and the project management repo is where plan, decisions and
  blog post of a ticket already live.
- gg takes any string as a ticket ID, so plain numbers work as they do
  for 17.

## Consequences

- No Jira-style prefix, no issues in the code repos, no tracker-less
  sequence like `aud_midi_01`.
- The implementation steps S0 to S22 become issues when they start and
  get their plan files under the issue number.
