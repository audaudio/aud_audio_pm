# Topic: external review of the engine contracts (2026-10-08)

Gabriel Gatzsche forwarded an external review of the plan on 2026-10-08.
Its verdict: the Dart control layer, the C++ engine and the compiled
render graph are a sound foundation, but ownership, timing, overload
handling and platform differences lack the contracts that make them
reliable. This file records each point and the response.

| # | Point of the review | Response |
| --- | --- | --- |
| 1 | Graph swaps do not define how DSP state survives; retired resources, pending events and revisions are unspecified | Accepted: graph-003 separates persistent node instances from immutable programs, adds transactions with revision acknowledgements, fades and retirement rules |
| 2 | "Lock-free" is not a real-time contract: capacity, ownership, overflow, late events, per-block budget, note-off recovery; `NativeCallable.listener` is not bounded | Accepted: interop-002 defines the queue classes and policies and moves the Dart wake-up to a notification thread |
| 3 | Parallel rendering is an expensive default; plugin instances must not create their own pools | Accepted: sched-001 makes serial execution the baseline, parallel jobs opt-in and coarse, and uses the host's pool in plugins |
| 4 | Hosts and devices do not guarantee host timestamps; sample, musical and host time must be separated with validity and reset rules | Accepted: time-001 names the three time domains, a validity and accuracy report, reset rules and the virtual timeline |
| 5 | The transport is shaped around Link: tempo changes within a block, seeks, loops, time signatures, provider capabilities, Link's thread arbitration and drift-corrected beat progression | Accepted: time-001 turns the snapshot into per-block segments with capabilities; commits run on one thread; the beat slope comes from Link's timeline, not the nominal tempo |
| 6 | The web has no control thread | Accepted: web-002 adds the Wasm Worker control runtime and the reduced guarantees of the fallback |
| 7 | OSC does too much inside the core | Accepted: osc-001 keeps OSC as an adapter over typed, numeric engine commands with explicit timestamp domains |
| 8 | Feedback "one block" is undefined with variable blocks; latency compensation needs policies for live input | Accepted: graph-001 defines feedback delay in samples and separate policies for scheduled and live events |
| 9 | The C ABI and build composition are underspecified; caret ranges do not pin minors | Accepted: abi-001; family-001 pins exact versions and checks the ABI version at registration |
| 10 | Resource management, recovery and lifecycle are undeveloped; tempo-flexible backing tracks need treatment | Accepted: lifecycle-001; the backing-track player is open question 4 of the plan |
| 11 | Link does not fit a permissive-only policy without arrangement; record the chosen license per dependency | Already handled by link-002 (not bundled, publishers license it themselves); license-001 now records the chosen license per dependency and separates wrapper from implementation |

The review's closing advice — prove a smaller engine first (serial
rendering, state-preserving transactions, bounded queues, reliable
sample-time scheduling, lifecycle) before parallel scheduling, plugin
shells and UI — matches the phase order of the plan; S1 and S2 now
carry these contracts explicitly and the verification section gained
stress tests for them.

Sources the review cited:

- https://api.dart.dev/dart-ffi/NativeCallable/NativeCallable.listener.html
- https://github.com/free-audio/clap/blob/main/include/clap/ext/thread-pool.h
- https://steinbergmedia.github.io/vst3_doc/vstinterfaces/structSteinberg_1_1Vst_1_1ProcessContext.html
- https://google.github.io/oboe/classoboe_1_1_audio_stream.html
- https://github.com/free-audio/clap/blob/main/include/clap/events.h
- https://github.com/Ableton/link/blob/master/include/ableton/Link.hpp
- https://emscripten.org/docs/api_reference/wasm_audio_worklets.html
- https://opensoundcontrol.stanford.edu/spec-1_0.html
- https://dart.dev/tools/pub/dependencies
- https://github.com/Ableton/link/blob/master/README.md
