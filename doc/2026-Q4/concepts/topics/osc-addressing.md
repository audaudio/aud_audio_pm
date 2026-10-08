# Topic: OSC and the addressing of graph nodes

Research for R10, sources fetched 2026-10-07.

## Facts

- OSC 1.0: messages are an address pattern (`/…`), a type tag string
  (`,…`) and arguments; atomic types int32, float32, string, blob,
  64-bit NTP timetag (1 = immediately); bundles `#bundle` + timetag +
  elements, nestable; pattern characters `?`, `*`, `[a-z]`, `{a,b}`;
  everything padded to multiples of four bytes.
- OSC 1.1 (Freed and Schmeder, NIME 2009): same encoding; required type
  tags `i f s b T F N I t`; the `//` path-traversing wildcard; SLIP
  framing for stream transports; OSC is a content format, not a
  protocol.
- Libraries: oscpack (MIT, C++), tinyosc (ISC, minimal C), liblo
  (LGPL-2.1, not used). Dart: `dart_osc` 1.0.0 (MIT, 2026; messages,
  nested bundles, pattern matching, timetags, UDP) and the older `osc`
  1.0.0 (BSD-3-Clause, 2021).
- Precedent for graph control: the SuperCollider server commands —
  `/s_new`, `/n_set`, `/n_free`, `/n_map`, `/n_before`, `/n_after`,
  `/g_new`, `/g_head`, `/g_tail`, `/b_alloc`, `/c_set`, notifications
  `/n_go`, `/n_end`, `/n_on`, `/n_off`, `/n_move`, replies `/done` and
  `/fail`, scheduling by timetagged bundles. REAPER uses user-editable
  patterns; Pd speaks OSC through `netsend`/`netreceive` with
  `oscformat`/`oscparse`. No cross-tool standard exists; SuperCollider
  is the de-facto reference.
- sfizz already exposes an OSC-like message API for its internals,
  which maps straight onto node routes.

## What holds for aud_audio

- Every node, inlet and parameter has an address:
  `/graph/<graph-id>/node/<node-id>/param/<name>`,
  `/…/inlet/<name>`, `/…/outlet/<name>`; groups and the graph itself
  answer to `/graph/<id>/…`; the engine answers with `/done` and
  `/fail`-style replies and emits notifications for node lifecycle and
  meters.
- Messages carry OSC 1.1 types and a timetag that the engine converts to
  a sample position (immediately, absolute host time, or beat time via
  the transport); the same message model serves Dart-internal calls, the
  Dart–C++ command queue and an optional UDP/WebSocket server.
- Dart side: `aud_audio_osc` builds on `dart_osc` or a small in-house
  codec; C++ side: tinyosc or oscpack for the optional network server.

## Sources

- https://opensoundcontrol.stanford.edu/spec-1_0.html
- https://opensoundcontrol.stanford.edu/spec-1_1.html, https://www.nime.org/proceedings/2009/nime2009_116.pdf
- https://github.com/RossBencina/oscpack, https://github.com/mhroth/tinyosc, https://github.com/radarsat1/liblo
- https://pub.dev/packages/dart_osc, https://pub.dev/packages/osc
- https://doc.sccode.org/Reference/Server-Command-Reference.html
- https://www.reaper.fm/sdk/osc/osc.php
- https://booki.flossmanuals.net/pure-data/ch065_osc.html
