<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Jira export guide

How the next tickets of one person are exported from the PM repo as a CSV
file that Jira imports: one sprint's worth, in the order of the plan.

## Know what the export is

- One CSV file per export: `doc/exports/<yyyy>-<mm>-<dd>-<name>-sprint.csv`,
  `<name>` is the first name in lower case kebab case
- It holds only tickets that are not in Jira yet, see below
- It assigns tickets at export time only: who works on a ticket is never
  written into the ticket file
- It needs the team: without `doc/team/people.md`, set it up with the
  user first, see the [PM repo guide](pm-repo-guide.md#know-the-team)
- The CSV is data: it is never translated

## Set the frame with the user

Ask one question at a time and propose a default each time:

- Person — required; one of `doc/team/people.md`
- Sprint length — default: the one in `doc/team/people.md`, else two weeks
- Capacity — default: the sprint length times the person's days per week;
  minus holidays, vacations and other work the user names
- Jira name of the person — default: the `Jira` field in
  `doc/team/people.md`; ask when it is missing. It is the user name on
  Jira Data Center or Server, the e-mail address on Jira Cloud
- Jira — Data Center or Server, or Cloud; default: Data Center
- Jira project — the key the issues go to; default: the prefix of the
  ticket keys the repo already uses
- Priorities — the names the project offers; default: `High`, `Normal`
  and `Low`. Take the names exactly as Jira writes them, spaces included
- Sprint — a sprint the issues go into, by its numeric ID; default: none
- Hours per day — default: the one in `doc/team/people.md`, else 8

If a Jira connection is available, e.g. the Atlassian MCP server, read
the user names, issue types, priorities and sprints of the project from
it instead of asking for them.

## Find the open tickets

- Take the ticket files in `doc/<quarter>/tickets` of all quarters and the
  planned tickets of `doc/schedule.md` that have no file yet
- Leave out finished tickets: marked `done` in `doc/schedule.md`, or all
  their requirements are `done`
- Leave out tickets that are in Jira already: their ID is a Jira key,
  letters, a dash and a number, e.g. `cdm-1317` in
  `2026-09-10-cdm-1317-infrastructure-discovery-server.md`. Numbers alone,
  e.g. `14`, are local IDs, not Jira keys
- Order them as `doc/schedule.md` does; without a schedule, by what they
  wait for, then by the priority of their requirements: `must` before
  `should` before `could`

## Match the tickets to the person

- Compare each open ticket with the areas of every person in
  `doc/team/people.md`: the repos it changes, the requirements and goals
  it serves, the words of its goal and steps
- Keep the tickets whose best match is the person; a ticket that matches
  several people equally goes to the person the user names
- Show a table — ticket, matched person, the area that decided it — and
  let the user move tickets between people. Write nothing back

## Fill the sprint

- Take each ticket's expected duration from the `Tickets` table of
  `doc/schedule.md`. Without one, estimate it as the
  [schedule guide](schedule-guide.md#estimate-each-ticket) says and show
  the numbers first
- Add the person's tickets in order until the next one does not fit the
  capacity; stop there, do not skip ahead to smaller ones
- A ticket bigger than the whole capacity: offer to split it first
- Show the sprint — tickets, days, the capacity left — and let the user
  confirm or change it

## Write the CSV

Use these columns, in this order:

```csv
Summary,Issue Type,Priority,Assignee,Labels,Original Estimate,Sprint,Description
"Import race data",Story,High,anna,results-without-desktop-software,158400,1840,"Goal: ...
Requirements: req-results-002
Steps:
* ...
Plan: {{doc/2026-Q4/tickets/2026-11-02-import-race-data.md}}"
```

- `Summary` — the ticket title in words, not in kebab case
- `Issue Type` — `Story`; `Bug` for a bug ticket. Both must exist in the
  project
- `Priority` — from the highest priority of its requirements: `must` →
  the high one, `should` → the middle one, `could` → the low one of the
  names agreed above
- `Assignee` — the Jira name of the person
- `Labels` — the goal the ticket serves, in kebab case without spaces.
  For a second label add another column, also headed `Labels`
- `Original Estimate` — the expected duration in whole seconds: days ×
  hours per day × 3600. With 8 hours, 5.5 days → `158400`; with 7.5
  hours → `148500`. Jira shows it in its own length of a working day
- `Sprint` — the numeric sprint ID, never the name; leave the column out
  without a sprint
- `Description` — the goal, the requirements by ID, the steps and the
  path of the plan file; without a plan file, the line of
  `doc/schedule.md`. Jira Data Center and Server render wiki markup:
  write list items as `* `, and put paths, file names and IDs with `_`
  or braces into `{{…}}`
- Leave out `Issue Key`: with it Jira would update existing issues
- Encode in UTF-8 without BOM, separate by commas, end lines with `\n`;
  quote every field that holds a comma, a quote or a line break, and
  double the quotes inside it; give every row the same number of fields

## Tell the user how to import it

- Jira Data Center or Server: Issues → Import Issues from CSV; it needs
  the permissions to create issues and to bulk change
- Jira Cloud: Filters → Search work items → ••• → Import work items from
  CSV; at most 250 work items per file
- Choose the project, the encoding UTF-8 and the comma as separator
- Map each column to the field of the same name
- Tick "Map field value" for `Priority`, `Issue Type` and `Assignee` only
  when their values differ from the names in Jira; never for
  `Description`, or Jira drops its line breaks
- Validate first, then import

## Take the keys back

When the user has imported the file and asks for it, write the Jira keys
back:

- Rename each exported ticket file from `<date>-<title>.md` to
  `<date>-<key>-<title>.md`, key in lower case, and put the key into its
  title line: `# CDM-1800: Import race data`
- A ticket that had no file gets one now, see the
  [PM repo guide](pm-repo-guide.md#write-the-ticket-file)
- Use the key as the ticket name in `doc/schedule.md`
- Do the same in the German copies, if the repo keeps them
