# 52: OSC: the split decision, one notification type, the server

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), section
4); awaits the user's confirmation. Phase 4 of the plan; size M; step S7 of
ticket 17; depends on ticket 47.

## Goal

It is decided what the core holds of OSC and what `aud_audio_osc` adds,
before the stub gets its first line and duplicates the router. Proposal:
the core keeps the message model, the typed commands and the addresses
(osc-001); the router (`aud_osc_adapter.dart`, today in the core), the
replies `AudReply`, `AudDone`, `AudFail`, `AudMeter`, `AudNodeCreated` and
`AudOscVocabulary` (today produced and consumed by nothing outside core's
tests) and the UDP and WebSocket servers with service discovery live in
`aud_audio_osc`. The two notification hierarchies — `AudNotification` of
the core and `AudGraphNotification` of the graph, bridged by `toOsc()`
with duplicated fields — become one engine notification type with an OSC
encoder in the OSC package. Then S7 is built: pattern matching, replies
and notifications, the servers, remote control of a running engine from
another device shown with the example app. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R10: every node is
reachable through a route).

## Requirements

None accepted yet; see open question 1 of ticket 40.

## Affected repos

- `aud_audio_pm`: decision `osc-003` (the split); the architecture
  section "Events and addressing".
- `aud_audio_core`: the router and the reply types out, the one
  notification type; minor version.
- `aud_audio_graph`: `AudGraphNotification` replaced; minor version.
- `aud_audio_osc`: the router, the replies, the servers, discovery, the
  example; first real release.

## Steps

1. The decision with the user.
2. The one notification type through core and graph.
3. The router and the replies into `aud_audio_osc`; its tests move with
   them.
4. The servers and discovery (S7); the remote-control example.

## Open questions

- Security of the network server: a token, a local network only, or
  nothing in the first release?
- WebSocket on the web through `aud_audio_web` (S5) or later?
