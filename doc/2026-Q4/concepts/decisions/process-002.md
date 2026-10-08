# process-002: Claude model and effort per ticket class

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's decision at the plan review on
  2026-10-08, on the recommendation given there
- Open work: revisit when new models ship; record deviations in the
  ticket plans

## Decision

The implementation tickets are worked with Claude Code, and the model
and effort follow the class of the ticket:

| Ticket class | Model | Effort |
| --- | --- | --- |
| Real-time and cross-platform core: the spikes (S0), `aud_audio_core` (S1), `aud_audio_graph` (S2, S6), the IO backends (S3), the headless host and plugin shells (S18 to S20), Link (S15), provenance audits | Claude Fable 5.1 (`claude-fable-5-1`) | max |
| Remaining C++ and FFI work; planning of implementation tickets; reviews of core code | Claude Fable 5.1 | high |
| Well-specified Dart work: the UI package ports (S16, S17, S17a, S17b, S27), the docs site (S21), DSP ports with a given source (S9 to S13, S25, S26) | Claude Opus 5.5 (`claude-opus-5-5`) | high |
| Mechanical work: repo bootstrap and DNA, READMEs and indexes, notices files, CI configuration, test scaffolding | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | medium |
| Trivial edits and formatting | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | low |

Rule of thumb: max effort wherever a mistake is expensive or hard to see
in tests — real-time safety, the ABI, timing, licensing; high as the
default for implementation; medium for documentation and mechanical
work. The `/code-review` of core code runs at high effort on Fable 5.1.

## Why

- The core is where subtle errors cost most; the UI and docs work is
  well specified by its templates and cheaper on Opus and Sonnet.
- This plan was produced on Fable 5.1 at max effort.
