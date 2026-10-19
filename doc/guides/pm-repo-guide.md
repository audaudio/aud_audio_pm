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
| |-blog
| | |-2026
| | | |-2026-09-10-blogpost-1.md
|-README.md
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
- `blog` — one post per finished ticket; exists only if the repo has
  `doc/guides/blog-guide.md` from the `dna_blog` layer, see below

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

- `Status` — `active`, `reached` or `dropped`, plus the quarters the goal
  was worked on, e.g. `active since 2026-Q3`
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
  [requirements guide](requirements-guide.md) says how, `/plan-requirements`
  runs it
- Do it before the first ticket, whenever `doc/requirements` is empty, and
  whenever the work of a ticket is not covered by an accepted requirement
- Plan and create tickets only after that. Bug tickets are the exception:
  they name their bug file instead
- `/plan-intro` lists the planning skills and says which one comes next

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
- The [schedule guide](schedule-guide.md) says how, `/plan-schedule` runs
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
