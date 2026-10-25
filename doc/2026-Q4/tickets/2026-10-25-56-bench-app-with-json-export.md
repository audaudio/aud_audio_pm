# 56: Bench app with JSON export

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
1 and 3); awaits the user's confirmation. Phase 6 of the plan; size M;
step S24 of ticket 17; depends on nothing.

## Goal

The numbers of the reference devices (release-004) come from one app and
land on the docs site. `aud_audio_bench` — today the Flutter template —
takes the measurement pages and the six integration tests of the
umbrella's example (callback time, xruns, command-to-sound latency, the
voice budgets, the MIDI paths), adds a loopback latency measurement, CPU
per node type and memory per device, writes one JSON per device and run,
and a script publishes the JSON into the docs site's benchmark page.
`AudEngine.report()` and `numbers` stay the source. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R14, R16) and
sched-001, whose default the numbers gate.

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_audio_bench`: the app, the JSON schema, the runs on the Galaxy Tab
  S4, the iPad Pro, the iPhone 16 Pro Max, the Mac and the Windows PC;
  first real release.
- `aud_audio`: its example keeps the guided keyboard test and the demo
  pages, loses the measurement pages; patch version.
- `audaudio.github.io`: `benchmarks/<device>.json` and the page that
  renders them (ticket 58 builds the page; this ticket delivers the
  data).

## Steps

1. The JSON schema and the pages moved.
2. The loopback measurement (a cable from output to input, the audio
   input of ticket 49 where it exists, else the device's own loopback).
3. The runs; the JSON committed to the site repo by a script.
4. The reference-device table in the engine page replaced by the data.

## Open questions

- Loopback needs the input path of ticket 49 on the engine or the raw io
  session; proposal: the raw session, so the bench does not wait.
