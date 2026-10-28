<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Project management repo guide

## Know what a PM repo is

- A project management (PM) repo holds the goals, requirements, concepts,
  plans, schedule, decisions and blog posts of a project — no code
- Every ticket belongs to exactly one PM repo. Add it to the ticket before
  any code repo (see the `gg` development guide)
- A ticket that is only planned ends with the PM repo alone
- Requirements come before tickets: engineer them with the user first, see
  [Engineer the requirements first](#engineer-the-requirements-first)
- Write the repo in English. If it has `doc/guides/translate-guide.md`
  from the `dna_translate` layer, keep a German copy of every file as
  well, see [Keep two languages](#keep-two-languages)

## Structure the repo like this

```text
root
|-doc
| |-goals
| | |-results-without-desktop-software.md
| |-requirements
| | |-results.md
| |-schedule.md
| |-2026-Q3
| | |-concepts
| | | |-topics
| | | |-decisions
| | | | |-000-index.md
| | | |-ux
| | |-architecture
| | | |-architecture.md
| | | |-img
| | |    |-diagram.mmd
| | |-tickets
| | | |-2026-09-10-cdm-1317-infrastructure-discovery-server.md
| | |-bugs
| |-team
| | |-people.md
| | |-roles.md
| |-reports
| | |-2026-Q3
| | | |-anna.md
| |-exports
| | |-2026-09-10-anna-sprint.csv
| |-prompts
| | |-README.md
| | |-anna                 (on the branch prompts)
| | | |-2026-09
| | | | |-2026-09-10_timing_app_3f2a91c0.md
| |-blog
| | |-2026
| | | |-2026-09-10-blogpost-1.md
| |-de
| | |-goals
| | |-...
|-README.md
|-README.de.md
```

- `README.md` names the project and links to the current quarter, the
  active goals and the requirements
- `goals` — what the project wants to achieve and for whom; one file per
  goal, kept across quarters, see below
- `requirements` — what the product must do or be; one file per area,
  kept across quarters, see below
- `schedule.md` — the time plan as a Gantt chart, kept across quarters;
  optional, see [Plan the time](#plan-the-time)
- `doc/<yyyy>-Q<n>` holds one folder per quarter; start a new one at the
  start of a quarter, do not move old files
- `concepts` — what the product is and why, see below
- `architecture` — the target picture of the system: `architecture.md`
  plus diagrams in `img` as mermaid `.mmd` files
- `tickets` — one plan file per ticket
- `bugs` — one file per bug; a bug turns into a ticket once it is planned
- `team` — who works on the project and in which roles, kept across
  quarters, see [Know the team](#know-the-team)
- `reports` — one report per person and quarter with the points to tell
  them, see [Report to the people](#report-to-the-people)
- `exports` — CSV files of tickets for Jira, see
  [Export tickets to Jira](#export-tickets-to-jira)
- `prompts` — the prompts the people wrote to Claude Code, one file per
  session, on the branch `prompts`; on the main branch only its
  `README.md`, see [Keep the prompts](#keep-the-prompts)
- `blog` — one post per finished ticket; exists only if the repo has
  `doc/guides/blog-guide.md` from the `dna_blog` layer, see below
- `de` and `README.de.md` — the German copy; exist only if the repo keeps
  two languages, see [Keep two languages](#keep-two-languages)

## Tell goals and requirements apart

- A goal says **why** and **for whom**: an outcome the project wants, e.g.
  "clubs evaluate their races without desktop software". It leaves open how
  it is reached and is done when the outcome is there
- A requirement says **what** the product must do or be: a testable
  statement about the system, e.g. "the result list is ready two seconds
  after the last finisher". It says nothing about how it is built and holds
  until it is changed or dropped
- A ticket says **how** and **when**: one step that fulfils requirements in
  service of a goal
- Topics hold the problem space — evidence and user needs. Requirements are
  the commitments derived from them; do not write requirements into topics
- Goals and requirements outlive quarters: a goal may take several quarters,
  a requirement holds for as long as the product does. That is why they do
  not live in the quarter folders

## Write the goals

- Create `doc/goals/<title>.md`, title in English kebab case
- Use these sections, in this order:

```markdown
# <Title>

## Status

## Outcome

## Measure

## Requirements
```

- `Status` — `proposed`, `active`, `reached` or `dropped`, plus the
  quarters the goal was worked on, e.g. `active since 2026-Q3`. A goal is
  `proposed` until the team confirms it
- `Outcome` — one paragraph: what changes, for whom, and why it matters
- `Measure` — how we know the goal is reached
- `Requirements` — links to the requirements derived from the goal
- Never delete a goal; set it to `reached` or `dropped` and say why

## Write the requirements

- Group requirements by area of the product, one file per area:
  `doc/requirements/<area>.md`, area in English kebab case
- Give each requirement an ID `req-<area>-<nnn>`, e.g. `req-results-001`;
  the prefix keeps it apart from decision IDs. Never reuse or renumber an
  ID
- Write each requirement as its own section:

```markdown
## req-results-001: Result list right after the race

- Status: accepted
- Priority: must
- Statement: The result list is ready two seconds after the last finisher
- Why: [results without desktop software](../goals/results-without-desktop-software.md),
  topic `timing`
- Acceptance: a race with 500 finishers shows the list within two seconds
```

- `Status` — `proposed`, `accepted`, `done` or `dropped`
- `Priority` — `must`, `should` or `could`; what is not wanted at all is
  `dropped`
- `Statement` — one sentence on what the product must do or be, never how
- `Why` — the goal it serves and the topic it comes from
- `Acceptance` — the checks that prove it; one bullet per check if needed
- Change a requirement in place and say what changed and when; a requirement
  that is replaced is set to `dropped` and links its successor
- A broken `done` requirement is a bug, not a new requirement

## Engineer the requirements first

- Find the goals and requirements together with the user, one question at
  a time and with proposals: the
  [requirements guide](requirements-guide.md) says how, `/gg-plan-requirements`
  runs it
- Do it before the first ticket, whenever `doc/requirements` is empty, and
  whenever the work of a ticket is not covered by an accepted requirement
- Plan and create tickets only after that. Bug tickets are the exception:
  they name their bug file instead
- `/gg-plan-intro` lists the planning skills and says which one comes next

## Know the team

- Write down who works on the project in `doc/team/people.md`, one
  section per person:

```markdown
# People

- Sprint length: 2 weeks
- Hours per day: 8

## Anna

- Areas: result list, import of race data, the `timing_app` repo
- Days per week: 4
- Jira: anna
- Git: anna@example.com
```

- The section title is the first name; the file names of the person use
  it in lower case kebab case: `anna`
- `Areas` — what the person takes care of: features, topics, repos. The
  Jira export matches tickets to people by them
- `Days per week` — how much of the week the person works on the project
- `Jira` — the name Jira knows the person by: the user name on Jira Data
  Center or Server, e.g. `anna`, the e-mail address on Jira Cloud;
  optional
- `Git` — the e-mail addresses the person commits with, separated by
  commas. The prompts of the person are filed under their first name by
  them, see [Keep the prompts](#keep-the-prompts)
- `Sprint length` — once, at the top; default two weeks
- `Hours per day` — once, at the top: the working hours of one day, used
  to turn estimates in days into hours; default 8
- Write down the roles in `doc/team/roles.md`, one section per role. Start
  with Developer, Product Owner, Management, Sales and Customer, and add
  the ones the project needs:

```markdown
# Roles

## Product Owner

- Responsible for: goals, requirements and their priority
- People: Anna
- Hears about: goals, requirements, decisions, schedule shifts
```

- `People` — the first names of `doc/team/people.md` who have the role.
  This is the only place that says who has which role; `people.md` does
  not repeat it
- `Hears about` decides what lands in the reports of the people in that
  role. Customers and sales hear about outcomes and dates, never about
  internals such as code, open decisions or estimates
- One person may have several roles, so may be listed under several of
  them; their report covers all of them
- Ask the user for the team before the first report or export; never
  guess people or roles
- Keep only first names, areas and roles in `doc/team`; no contact data
  besides the Jira account and the git e-mail addresses

## Fill the concepts folder

- `topics` — one file per product topic: evidence, use cases, user needs,
  what was tried and what holds; the place for problem-space knowledge
- `decisions` — one file per decision, `<area>-<nnn>.md`, e.g.
  `design-001.md`; `000-index.md` lists all decisions with ID, status,
  date, one line and open work
- `ux` — accepted statements about the product's surface and flows: which
  objects, places and words the user meets, and why
- Write a decision file with: title, status (proposed / accepted /
  superseded), date, canonical source, open work, the decision in one
  paragraph
- Never rewrite a decision; supersede it with a new one and link both ways

## Write blog posts

- Write a post only if `doc/guides/blog-guide.md` exists; it comes from the
  `dna_blog` layer. Without it, write no post and skip the rest of this
  section
- Follow the blog guide for content and template
- Put the post into `doc/blog/<yyyy>` of the PM repo, one folder per year
- Name it `<yyyy>-<mm>-<dd>-<title>.md`, title in English kebab case
- One post may cover all repos of the ticket that belong to the
  organization of the PM repo
- Write only knowledge of the organization of the PM repo
- Leave out repos of other organizations in the ocean, even when they took
  part in the ticket. Name them only as updated dependencies: public package
  name, version and what the update means for this organization's repos;
  never their tickets, plans or internals

## Name the files

- Prefix ticket and bug files with the date: `<yyyy>-<mm>-<dd>-`
- Add the ticket ID in lower case: `cdm-1317`
- Finish with the title in English kebab case:
  `2026-09-10-cdm-1317-infrastructure-discovery-server.md`
- Name goals, requirement areas, topics, ux files, architecture files and diagrams by their
  topic, in English kebab case
- Name reports `<name>.md` and exports `<yyyy>-<mm>-<dd>-<name>-sprint.csv`,
  `<name>` being the first name in lower case kebab case
- Keep the English file names in the German copy

## Keep two languages

- English is the leading language of a PM repo: every file exists in
  English, under `doc` and as `README.md`
- If the repo has `doc/guides/translate-guide.md` from the `dna_translate`
  layer, every file also exists in German, under `doc/de` with the same
  path and file name, and as `README.de.md`. Without that guide, write
  English only
- Write the English file first, even when the user talks German, then the
  German copy; change both in the same commit
- Translate headings and prose. Keep IDs, file names, links, the status
  and priority values and the field names of requirements as they are, so
  both copies stay readable for tools
- Keep both copies equal in content and structure; a ticked point in a
  report is ticked in both
- Do not translate the guides, the templates, the CSV exports or the
  prompts; the guides come from the DNA layers

## Report to the people

- Keep one report per person and quarter in
  `doc/reports/<yyyy>-Q<n>/<name>.md`: the points the person needs to
  hear, each with a checkbox to tick once it is communicated
- The [report guide](report-guide.md) says how, `/gg-plan-report` runs it: it
  collects what changed for the roles and areas of the person, appends it
  and starts the file of a new quarter with the open points carried over

## Export tickets to Jira

- Export the next tickets of one person as a CSV file Jira imports:
  `doc/exports/<yyyy>-<mm>-<dd>-<name>-sprint.csv`
- The [Jira export guide](jira-export-guide.md) says how,
  `/gg-plan-jira-export` runs it: it matches the open tickets without a Jira
  key to the person by their areas, fills one sprint by the estimates and
  writes the file
- The person is assigned at export time only, never in the ticket file

## Keep the prompts

- Every prompt the people write to Claude Code in a repo of the project
  lands here, on the branch `prompts`:
  `doc/prompts/<name>/<yyyy>-<mm>/<yyyy>-<mm>-<dd>_<repo>_<session>.md`,
  one file per session, the time of each prompt as its heading
- The `dna_gg` layer does it: a Claude Code hook in every repo whose
  variable `` names this repo. The hook commits to the branch
  `prompts` directly, so the main branch and its checks stay untouched
- The name is the first name in `doc/team/people.md` whose `Git` line
  lists the e-mail the session's repo commits with. An e-mail that is not
  listed goes to `doc/prompts/_unknown`; add it to `people.md`, the next
  sessions are filed under the name
- Only prompts are kept, never the answers. Tokens and passwords are
  replaced by `[redacted]` before they leave the computer
- Never edit, move or delete the prompt files, and never merge the branch
  `prompts` into the main branch. Read them with
  `git fetch origin prompts` and `git show origin/prompts:<path>`
- On the main branch, `doc/prompts/README.md` says where the prompts are,
  in German in `doc/de/prompts/README.md`

## Use the design layers

- Plan with the seven layers of product design; the `dna_design_layers`
  layer ships the [layers guide](layers-guide.md), one guide per layer and
  the `/layers-*` skills
- Run `/layers-orient` before planning a ticket that changes the product;
  it names the layer that needs attention first
- Write the residue of each layer into the PM repo:

| Layer                                     | Lands in                      |
| ----------------------------------------- | ----------------------------- |
| Observed behaviour, domain, user needs    | `concepts/topics`             |
| Product strategy                          | `goals`                       |
| What the needs and the strategy commit to | `requirements`                |
| Conceptual model, interaction flow        | `concepts/ux`, `architecture` |
| Surface                                   | `concepts/ux`                 |
| Every decision made on the way            | `concepts/decisions`          |

- Do not plan a ticket on a layer whose foundations are weak; plan the
  foundation first, or say plainly that the ticket is a bet

## Plan a ticket

Set the goal: one paragraph on what is achieved and for whom, and which
goal of the project it serves.

List the requirements the ticket fulfils by ID. If no accepted requirement
covers the work, stop and engineer the requirements with the user first,
see [Engineer the requirements first](#engineer-the-requirements-first).

Name the affected repos and what changes in each one.

List the rough steps in order; one line per step.

Collect the open questions; decide them with the user before implementing.

Link the goals, requirements, decisions and topics the plan rests on.

Let the user review the plan and revise it until they confirm it.

## Write the ticket file

- Create `doc/<quarter>/tickets/<date>-<id>-<title>.md`
- Use these sections, in this order:

```markdown
# <ID>: <Title>

## Goal

## Requirements

## Affected repos

## Steps

## Open questions
```

- Keep the plan short; write more only for complex tickets
- Wrap lines at 80 characters
- Embed mermaid diagrams when a picture says more than text

## Keep the plan alive

- Update the plan when the implementation deviates from it
- Move answered questions from `Open questions` into the plan or into a
  decision file
- Set the requirements the ticket fulfilled to `done` when it is finished
- Mark the ticket `done` in `doc/schedule.md`, if the project has one
- Reference the plan from the blog post that closes the ticket
- Keep the file: the plan documents why things are the way they are

## Plan the time

- A time plan is optional; make one when the user wants it or names a
  target date for the project
- The [schedule guide](schedule-guide.md) says how, `/gg-plan-schedule` runs
  it: it asks for the target date and the capacity, cuts the accepted
  requirements into tickets, estimates each one and draws the plan as a
  Gantt chart in `doc/schedule.md`
- Plan the time only on accepted requirements

## Plan a quarter

Choose the goals the quarter works on: add new ones to `doc/goals`, add
the quarter to the status of goals carried over, and set goals to
`reached` or `dropped` when they are.

Derive the requirements from the goals and the topics together with the
user; add new ones and change the ones the goals change.

Update `architecture/architecture.md` when a goal changes the target
picture.

Derive tickets from the requirements; each ticket names the goal it serves
and the requirements it fulfils.

Update `doc/schedule.md`, if the project has one, and check the forecast
against the target date.

Check `doc/team` and start the reports of the quarter with `/gg-plan-report`;
it carries the open points of the last quarter over.
