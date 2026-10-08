# Topic: external review of the plan's scope and sequence (2026-10-08)

Gabriel Gatzsche forwarded a second external review on 2026-10-08. Its
verdict: Dart for control and C++ for rendering is sensible; the
shortcomings are excessive scope, underspecified runtime contracts and
a delivery sequence that postpones proof in the actual Audanika app.
This file records each point and the response.

| # | Point of the review | Response |
| --- | --- | --- |
| 1 | No bounded first release; no estimates, owners, capacity or scope cuts | Accepted: release-002 defines milestone M1 with explicit cuts; the plan gained size estimates, the early integration step S29a and open questions on owners, capacity and reference devices |
| 2 | Graph replacement needs a state and ownership contract; topology changes versus parameter updates; atomic batches | Largely covered by graph-003; it now states that transactions batch edits atomically and that only topology changes compile |
| 3 | Sample accuracy says nothing about delivery: capacity, ordering, lookahead, late events, cancellation, overflow; keep string parsing out of the callback | Covered by interop-002 and osc-001; interop-002 now defines ordering at equal timestamps, the lookahead scheduler and cancellation |
| 4 | Parallel rendering committed before its benefit is shown | Already opt-in (sched-001); it now stays off by default until benchmarks on representative workloads prove better deadline reliability |
| 5 | Web needs a capability contract; the fallback is a distinct path; the worklet has no `fetch`; S0 must test a real workload | Accepted: web-003 and the split spike gate S0-web |
| 6 | The package contract needs version negotiation, lifecycle, visibility, discovery, a compatibility policy and a web contribution manifest | Covered by abi-001; it now carries the compatibility policy and the manifest |
| 7 | Lifecycle and clock recovery need acceptance criteria: calls, focus, backgrounding, Bluetooth, permissions, disconnects, new rates; what survives; duplex drift | Accepted: lifecycle-001 names the cases, what survives and the duplex policy; the verification section gained recovery criteria |
| 8 | Plugin shells are more than adapters; what works without Dart; host buffers as the renderer interface; no dependency on IO or the parallel scheduler | Accepted: plugin-002; S18 to S20 depend on S4 instead of S6, the VST3 shell no longer depends on `aud_audio_io` |
| 9 | Verification lacks pass/fail thresholds; refine "no audible difference", golden tolerances and the Link criterion; define feedback semantics | Accepted: budgets and thresholds in the verification section; graph-001 states that one-sample feedback lives inside nodes |
| 10 | Audanika's musical requirements (multitrack backing, tempo changes, transitions, gapless song loading) have no deliverable; licensing boundaries for Link binaries and the Faust exception | Musical requirements are open question 4 for the owner; link-002 gained the distribution policy for CI and examples; Faust stays blocked on open question 3 |

Dependency changes the review suggested, all taken: S0 split into
decision gates per phase (mobile, desktop, web, parallel, Link); S2
delivers reference nodes so the S4 example does not wait for S10a; S14
depends on the event types, not on MIDI device integration; S18 to S20
depend on the serial engine and plugin-002, not on S6; S22, S24 and S29
start in small versions with the foundation.

Sources the review cited:

- https://github.com/free-audio/clap/blob/main/include/clap/ext/thread-pool.h
- https://emscripten.org/docs/api_reference/wasm_audio_worklets.html
- https://dart.dev/tools/hooks
- https://github.com/google/oboe/wiki/TechNote_Disconnect
- https://github.com/Ableton/link
