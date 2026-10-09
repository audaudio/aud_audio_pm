# release-001: Mobile first

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's answer at the plan review on
  2026-10-08
- Open work: decide when macOS joins (it shares the Apple code path with
  iOS and is the development platform, so it may come almost for free).
  Ticket 22 gave the umbrella the platform tags iOS and Android; core,
  graph and io get theirs with S22 or their next change

## Decision

The first releases of the aud_audio packages target iOS and Android.
The core, graph and umbrella are written platform-neutral from the
start and the spikes de-risk all six platforms, but the IO backends,
the example app, the CI gates and the pub.dev platform tags of the
first `0.x` releases cover iOS and Android; macOS, Windows and Linux
follow in their own IO tickets, the web with its build pipeline ticket.

## Why

- Audanika's product runs on phones and tablets; the legacy engine
  covers exactly these two platforms, so the first releases can replace
  it.
- Two platforms keep the first IO ticket small: Oboe on Android
  (io-002) and miniaudio on iOS.

## Consequences

- S3 ships iOS and Android; the desktop backends become S3b to S3d.
- The first releases are gated by device tests on iOS and Android only;
  desktop and web join the gates as their tickets land.
