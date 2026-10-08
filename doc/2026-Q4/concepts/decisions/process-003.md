# process-003: Ticket numbers are kept in the project management repo

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's decision on 2026-10-08 at the end
  of ticket 5; supersedes [process-001](process-001.md)
- Open work: none

## Decision

Every ticket of the aud_audio family takes its number from
`doc/issues.md` of `aud_audio_pm`: the file holds the next number and one
row per ticket with title, status and plan file. A new ticket takes the
next number, raises the counter and appends its row; the number is the gg
ticket ID (`gg do create ticket <number>`), the name of the ticket
branches and the number in the plan file
`doc/<quarter>/tickets/<date>-<number>-<title>.md`. GitHub issues are not
created for tickets; the discussion of a ticket happens in its plan file
and in the pull requests of its repos. The numbers given so far stay: 2,
5 and 17.

## Why

- Creating issues on GitHub is an extra step outside the repo that the
  tooling cannot take for the developer, and the plan file already holds
  what an issue would.
- A file in the project management repo versions the numbering together
  with the plans and needs no further permissions.

## Consequences

- process-001 is superseded; its organization Projects board is not
  created.
- The open issue 2 on GitHub may be closed by hand; nothing refers to it.
