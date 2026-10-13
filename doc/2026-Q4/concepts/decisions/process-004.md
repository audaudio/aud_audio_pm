# process-004: Claude Opus 5.5 at extra high effort; Fable only on request

- Status: accepted
- Date: 2026-10-13
- Canonical source: Gabriel Gatzsche's instruction at the start of ticket
  28 on 2026-10-13 ("Use Opus 5.5 extra high effort. Ask me when you think
  we need to bring Fable into play"), after the switch to Opus agents for
  the C++ and FFI work during ticket 27
- Supersedes: [process-002](process-002.md) — model and effort per ticket
  class
- Refined by: [process-005](process-005.md) — the standing rules of an
  implementation ticket refer to it for model and effort
- Open work: revisit when new models ship

## Decision

Every ticket of the aud_audio family is worked with Claude Opus 5.5
(`claude-opus-5-5`) at extra high effort (`xhigh`): the session that leads
the ticket and every agent it starts — the C++ and FFI work, the Dart
work, the plans, the documents, the explorations and the reviews. The
ticket classes of process-002 no longer choose the model. Claude Fable
5.1 is not started on Claude's own judgment: when a task looks like it
needs Fable — a real-time, ABI or provenance problem that Opus keeps
failing at — Claude asks the user first and records the answer in the
ticket plan.

## Why

- The tickets 21 to 27 ran on Opus 5.5 against process-002 and delivered;
  each recorded the deviation instead of following the table.
- One model and one effort level make the plans comparable and the
  deviation notes unnecessary.
- The user keeps the decision to spend on Fable where it pays off.
