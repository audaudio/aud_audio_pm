# process-005: The standing rules of an implementation ticket

- Status: accepted
- Date: 2026-10-13
- Canonical source: Gabriel Gatzsche's instructions for ticket 28 on
  2026-10-13 ("Update these settings in pm repo"), which repeat the rules
  given for the tickets 25 to 27
- Refines: [process-003](process-003.md) — the ticket number;
  [family-002](family-002.md) — which repos a ticket publishes;
  [process-004](process-004.md) — model and effort
- Refined by: [script-001](script-001.md) — a semaphore signal that does
  not block wakes the worker of `aud.script.modulator` from the audio
  thread (ticket 31)
- Open work: none

## Decision

Every implementation ticket of the aud_audio family follows these rules
unless its plan records a deviation the user asked for:

- **Number and plan.** The ticket takes the next number of
  `doc/issues.md` (process-003) and its plan file in `tickets/` before the
  implementation starts. Findings go back into the contracts as decisions.
- **Real time.** Dart never runs on the audio thread; nodes allocate
  nothing, lock nothing and do no I/O on the audio thread (interop-001,
  abi-001).
- **Licenses.** Only permissive licenses; every repo that changes code
  keeps its notices and passes its notices check
  (`node scripts/check-notices.js` in the packages, `node
  tool/check-notices.js` in the app). Every Faust or ported source passes
  the audit of license-003 before it is copied.
- **Scripts** are Node.js (CommonJS) with the license header.
- **Versions.** Packages version independently (family-002): only repos
  with changes of their own stay in the ticket and are published; no path
  dependencies in manifests, gg's `pubspec_overrides.yaml` for local
  development.
- **Commits** per repo with `gg one do commit -m`: the first word is
  "Add", details as "- " bullets, no Co-Authored-By trailer. Commit
  messages, merge messages and changelog lines name no repo of
  `audanika-legacy` or `audanika-private`. `CHANGELOG.md` belongs to gg.
- **Adding a repo.** Every repo is committed before `gg do add` adds
  another one: its localize step commits the uncommitted work of every
  repo with the ticket title as the message (found in ticket 28).
- **Publish config.** Every repo of the ticket has
  `.gg/publish_config.json` with `mergeMessage` and `versionIncrement`
  before `gg do review`.
- **Measurements** run on the iOS simulator and the Android emulator
  unless the plan names devices; Claude asks the user to unlock the
  devices before long unattended runs.
- **Review.** `/code-review` at high effort runs before `gg do review`;
  `gg do review` follows without asking the user; then review-light runs
  with parallel reviewers per repo and the findings that can be fixed are
  fixed. The user runs `gg do publish` themselves.
- **Model and effort** follow process-004.

## Why

- The same rules were repeated in every ticket's instructions; one
  decision makes them the default and lets a plan list only its
  deviations.
- Commit and merge messages of the published packages are public; the
  repos of the legacy and private organizations are not.
