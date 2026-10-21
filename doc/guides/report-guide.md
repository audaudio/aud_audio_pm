<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Report guide

How the people of a project are kept informed: one report per person and
quarter collects what happened, and each point is ticked once it has been
communicated.

## Know what a report is

- One file per person and quarter: `doc/reports/<yyyy>-Q<n>/<name>.md`,
  `<name>` is the first name in lower case kebab case, as in
  `doc/team/people.md`
- A list of points to tell the person, each with a checkbox. A ticked
  point has been communicated; an open one still has to be
- It needs the team: without `doc/team/people.md` and
  `doc/team/roles.md`, set them up with the user first, see the
  [PM repo guide](pm-repo-guide.md#know-the-team)

## Collect the points

- Start from the date of the newest point in the person's report; without
  a report, from the start of the quarter
- Read what changed in the PM repo since then, e.g. with
  `git log --since=<date> --name-status -- doc`:
  - goals that were added, confirmed, reached or dropped
  - requirements that were added, accepted, changed, done or dropped
  - decisions that were accepted or superseded
  - tickets that were planned or finished, and their blog posts
  - shifts in `doc/schedule.md`: a later forecast, a missed or moved
    target date
- Report what happened, not what was filed: moves, renames, translations
  and reformatting are no news. Date each point by the file — the status
  line, the ticket date, the history — not by the commit that touched it,
  and leave out what happened before the start date
- Find the roles of the person in `doc/team/roles.md`: every role whose
  `People` lists them. Keep only what the person needs: what those roles
  hear about, and what touches their areas in `doc/team/people.md`
- Write each point as one sentence the person understands without the
  repo: what changed and what it means for them. Link the file it comes
  from
- Show the proposed points to the user; write only the ones they confirm

## Write the report

Use this template:

```markdown
# Report for Anna — 2026-Q4

- Roles: see [roles](../../team/roles.md)
- Tick a point once it is communicated

## Carried over from 2026-Q3

- [ ] 2026-09-28: The result list is planned for November
      ([schedule](../../schedule.md))

## 2026-10

- [x] 2026-10-14: The goal "results without desktop software" is confirmed
      ([goal](../../goals/results-without-desktop-software.md))
- [ ] 2026-10-20: The result list must be ready two seconds after the
      last finisher ([req-results-001](../../requirements/results.md))
```

- One section per month, the newest at the bottom; points in date order
- Each point: `- [ ] <yyyy>-<mm>-<dd>: <sentence> ([<source>](<link>))`
- Never delete a point; a point that turned out wrong gets a new point
  that corrects it

## Start a new quarter

- At the first report of a quarter, create
  `doc/reports/<yyyy>-Q<n>/<name>.md` for the person
- Copy the open points of the previous quarter into
  `## Carried over from <yyyy>-Q<n>`, unchanged and still open
- End the previous report with one line:
  `Open points carried over to [<yyyy>-Q<n>](../<yyyy>-Q<n>/<name>.md).`
  Leave the rest of the old file as it is
- A person who joined during the quarter starts with an empty report

## Keep both languages in step

- If the repo keeps German copies (see the
  [PM repo guide](pm-repo-guide.md#keep-two-languages)), every report also
  exists as `doc/de/reports/<yyyy>-Q<n>/<name>.md`
- Write each point in both files
- A tick in either file counts: when a point is ticked in one language,
  tick it in the other. Check both files before every new report
