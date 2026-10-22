<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Requirements engineering guide

How the requirements of a project are found together with the user. Where
they are written and what a requirement looks like is in the
[PM repo guide](pm-repo-guide.md#write-the-requirements).

## Know when to engineer requirements

- Before the first ticket of a project
- Before any ticket whose work no accepted requirement covers
- When `doc/requirements` is missing or empty
- When a goal is added or changed
- When the user asks for it

Tickets come after the requirements: plan a ticket only on accepted
requirements. Bug tickets are the exception, they name their bug file.

## Work with the user, not for them

- Ask one question at a time and give the user a single input per answer
- Propose instead of asking blank: offer two to four candidate answers
  drawn from the goals, topics, code and earlier answers, and leave room
  for a free answer
- Say what each proposal rests on, so the user can correct the source
- Write nothing the user has not confirmed. Keep unconfirmed candidates as
  `proposed` only when the user wants to come back to them
- Challenge vague answers: ask for a number, an example or a check
- Stop after each area, sum up what was agreed and ask whether to go on
- Talk to the user in their language; write the files in English, plus the
  German copy if the repo keeps one, see the
  [PM repo guide](pm-repo-guide.md#keep-two-languages)

## Run the session

1. Read the PM repo: `README.md`, `doc/goals`, `doc/requirements` and the
   current quarter's topics, ux files, decisions and architecture
2. Goals: if there is no active goal, find one first — the outcome, for
   whom, and how we know it is reached — and write it to `doc/goals`. Ask
   which goals the session serves, and whether `proposed` goals are
   confirmed
3. People: who uses the product, who operates it, who pays, who else is
   affected. Confirm the list
4. Scenarios: walk through the main scenarios of each goal with the user,
   step by step. Propose them from the topics when they exist
5. Functional requirements: derive candidates from each scenario step,
   group them by area and let the user confirm, change or reject each one
6. Quality requirements: go through the list below and ask only for the
   points that matter to this product
7. Constraints: fixed technologies, platforms, deadlines, budgets, laws.
   Write them as requirements of the area `constraints`
8. Acceptance: propose the checks that prove each requirement and let the
   user confirm them
9. Priority: let the user mark each requirement `must`, `should` or
   `could`. Push back when everything is `must`
10. Check the set, see below, and raise each finding as a question
11. Write the requirement files, link them from the goals and sum up: what
    is new, what is still `proposed`, and what comes next — the tickets,
    or `/plan-schedule` for a time plan

## Ask for the quality requirements

| Area          | Ask about                                        |
| ------------- | ------------------------------------------------ |
| Performance   | Response times, volumes, peak load               |
| Availability  | Uptime, offline use, recovery after failure      |
| Security      | Who may do what, authentication, attacks         |
| Privacy       | Personal data, consent, retention, law (GDPR)    |
| Platforms     | Devices, operating systems, browsers             |
| Accessibility | Screen readers, contrast, keyboard use           |
| Languages     | Languages, formats of dates, numbers, currencies |
| Operation     | Deployment, monitoring, backups, updates         |
| Compatibility | Interfaces, data formats, migration of old data  |
| Cost          | Hosting, licences, maintenance effort            |

## Check the set

- Testable — the acceptance checks can actually be run
- One thing — no "and" that joins two needs
- What, not how — no technology unless it is a constraint
- Unambiguous — no "fast", "easy" or "user-friendly" without a number or
  a check
- Traceable — names the goal it serves and the topic it comes from
- Consistent — contradicts no other requirement and no decision
- Complete — every goal's measure and every scenario step is covered

## Change requirements later

- Change them the same way: interactively, with the user's confirmation
- Note in the requirement what changed, when and why
- Name the tickets and the schedule entries that rest on a changed
  requirement, so the user can re-plan them
