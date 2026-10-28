<!-- helix:claude_md:start -->

# gg workflow

This repo is developed ticket by ticket with the `gg` CLI. Follow the
development guide, it tells you when to ask the user and which command
comes next:

@doc/guides/for-ai/ai-dev-guide.md

The steps are also available as skills: `/gg-ticket`, `/gg-commit`,
`/gg-push`, `/gg-review`, `/gg-publish`, `/gg-cleanup`. `/gg` lists them
and says which one comes next.

# Planning

Projects are planned in a project management repo; its structure and the
planning rules are in `doc/guides/pm-repo-guide.md`. When you plan in one:

- Engineer the requirements before the tickets. If `doc/requirements` is
  empty or no accepted requirement covers the work, run
  `/gg-plan-requirements` with the user first, and plan or create tickets
  only after that
- Engineer requirements interactively: one question at a time, with
  proposals the user confirms, changes or rejects. Never write a
  requirement the user has not confirmed
- When the user names a target date or asks how long the work takes,
  offer `/gg-plan-schedule`: it cuts the requirements into tickets, estimates
  them and draws the plan as a Gantt chart in `doc/schedule.md`
- Write the PM repo in English. If it has
  `doc/guides/translate-guide.md`, keep a German copy of every file under
  `doc/de` and in `README.de.md`, and change both in the same commit
- The people and their roles are in `doc/team`. When the user asks what to
  tell someone, offer `/gg-plan-report`; when they want tickets in Jira or
  plan the next sprint of a person, offer `/gg-plan-jira-export`
- The prompts of the people are kept on the branch `prompts` under
  `doc/prompts`. Never edit them and never merge that branch into main

`/gg-plan-intro` lists the planning skills and says which one comes next.

<!-- helix:claude_md:end -->
