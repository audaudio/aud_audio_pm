# 25: S9 — Build the SFZ sampler on sfizz for iOS and Android

Status: plan in review (2026-10-11).

## Goal

Grow the sfizz node of the spike S0-mobile (`aud.sampler.sfz` in
`aud_dsp_sampler` 0.1.0, still on ABI 0.1) into step S9 of the plan of
ticket 17 (milestone M1): an SFZ sampler node on the engine of S2 to S4
that loads instruments without blocking Dart or the audio thread, shares
its samples between nodes and engines within a sample cache budget, plays
notes and per-note controllers from UMP, offers sfizz's message API on node
routes and meets the M1 budgets on iOS and Android. S29a (the app plays its
first SFZ instrument), S17b (the keyboard) and S20 (AUv3 with the sampler)
wait for it. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md).

## What the code base gives

- The spike node (146 lines) loads with `sfizz_load_file` inside
  `set_string`, on the calling thread: the Dart isolate blocks for the
  whole load, and the load must not overlap a render (sfizz's CT/OFF
  tags; this sfizz has no internal guard between load and render). It
  maps note on, note off and control events, has one parameter and
  registers against ABI 0.1; the engine of tickets 19 to 22 is on ABI 0.3.
- sfizz streams: a load reads only the head of every sample (8192 frames
  plus the largest `offset`); a note on queues a background read of the
  whole file, and the voice follows the frames read so far. The full data
  stays in memory while a voice plays it and five seconds longer. Every
  synth has its own `FilePool` with two threads of its own plus a shared
  thread pool; nothing is shared between synths, there is no byte budget,
  and a read that falls behind ends the voice early without a report.
- sfizz's message API (`sfizz_send_message`, RT) reads and writes the
  synth's state over OSC-like paths — counts, key and CC labels, every
  region opcode (`/region3/ampeg_attack f 0.1`), voices — and replies
  through a client callback on the audio thread; replies carry strings.
- The ABI has no way to carry such a message or its reply, no worker
  thread, no load ids and no cache budget; `AudEvent` holds four words.
- The headless host (ticket 20) resolves `asset:<id>` strings of a
  document and treats every `set_string` result other than `AUD_OK` as a
  failure; graph documents reference files through their `assets` table.
- Flutter 3.47.5 runs link hooks in profile and release builds and
  records `@RecordUse` by default; `package:hooks` 2.2 hands the recorded
  uses to a link hook.

## Scope

1. **The node** `aud.sampler.sfz` on ABI 0.4:
   - No input; one output bus `out`, 2 to 16 channels in pairs (default
     2), one stereo pair of sfizz per pair (SFZ `output=`).
   - Event input `midi` (UMP, MIDI 1.0 and 2.0 channel voice): note on and
     off with 7- or 16-bit velocity, control change (7 or 32 bits), pitch
     bend, channel pressure, poly pressure, program change; control
     events as CCs by number; parameter events with ramps; message events
     (scope 5). Per-note controllers: question 6.
   - Parameters with stable ids: `volume` (dB, -60 to +6, a ramped output
     gain), `polyphony` (1 to 256, default 64, applied through a standby
     synth since sfizz's voice count is OFF), `sample_quality` (0 to 10,
     default 2), `oscillator_quality` (0 to 3, default 1),
     `tuning_frequency` (400 to 480 Hz, 440), `stretch_tuning` (0 to 1).
   - String keys: `sfz_file`, `sfz_virtual_path`, `sfz_text`, `scala_file`,
     `scala_text`; each starts an asynchronous load (scope 2).
   - Polyphony bound and voice stealing: sfizz's voice manager with the
     `polyphony` parameter as the bound, the SFZ polyphony opcodes and
     `hint_stealing` (default: oldest voice).
   - Tail: the longest amplitude release of the loaded instrument, capped
     by the engine's 10 s. Transport: tempo, time signature, position and
     playing state of the block reach sfizz (tempo-synced LFOs).
   - Offline: with `AUD_PROCESS_OFFLINE` sfizz renders freewheeling (waits
     for streamed data, highest quality), so offline renders repeat.
   - On the audio thread only sfizz's RT functions run; the node runs
     under RealtimeSanitizer and the watchdog of ticket 20.
2. **Loading** (sampler-001: an engine-owned worker): `set_string` starts
   a load on an engine worker thread and returns its id at once. The load
   fills a standby synth configured like the active one; when it is done,
   the audio thread adopts it at the next block start with a 5 ms
   crossfade and replays the controller state (CCs, pitch bend, pressure,
   sustain) into it; the worker frees the old synth. The node plays the
   old instrument until then; a newer load cancels a pending one; a
   failed load keeps the old instrument. Loads report progress and end
   with a result: done, failed with a message, or cancelled. A prepare
   during a load re-applies the new rate and block size to the standby
   synth before the handover (question 3).
3. **Engine resources** (`aud_audio_graph`, lifecycle-001, question 1):
   one resource manager per process, shared by every graph:
   - worker threads (default 2) with a bounded lock-free task queue that
     the control thread, the workers and the audio thread may post to;
   - loads with ids, progress, result and cancellation, reported per graph
     as notifications;
   - the sample cache budget in bytes for the process (question 2) with
     least-recently-used eviction: packages register their caches, report
     what they hold and what they could evict, and the engine asks them
     to trim when the process exceeds the budget;
   - diagnostics a node reports from the audio thread (e.g. a streaming
     underflow) as `AUD_NOTIFY_DIAGNOSTIC` with the node.
4. **Shared sample store** (`aud_dsp_sampler`, a patch of the fork's
   `FilePool`, question 5): sample data lives in one store per process,
   keyed by file and direction, shared and reference-counted by every
   synth of every node and engine. Heads stay pinned while an instrument
   uses them; streamed full data becomes evictable once no voice reads
   it. The store reports its bytes to the engine and evicts the least
   recently used data first when asked to trim. Streaming reads and
   frees run as engine tasks — sfizz's own threads and thread pool go —
   and nothing allocates or frees on the audio thread. A load whose
   pinned heads do not fit after everything evictable is gone fails with
   `AUD_ERROR_CAPACITY` and the old instrument stays; streamed data over
   the budget is read anyway and reported, a note is never cut for the
   budget. A voice that outruns the read plays silence for the missing
   frames and the node reports an underflow (lifecycle-001: never block).
5. **Message API on node routes** (osc-001, question 4): ABI 0.4 adds the
   capability `AUD_NODE_CAP_MESSAGES`, the event type
   `AUD_EVENT_MESSAGE` that carries an engine-owned OSC message (path,
   type tags, arguments) to the node at a sample offset — queued,
   scheduled, ordered and budgeted like every event — and
   `AudHostApi.emit_message` for replies, which reach Dart through the
   notification path. A node with messages answers below
   `/graph/<g>/node/<n>/msg/`: `/graph/1/node/2/msg/region0/ampeg_attack
   f 0.1` becomes sfizz's `/region0/ampeg_attack`; replies come back from
   the same prefix. Where sfizz allocates while it replies, the patch
   removes the allocation or the message is refused and documented.
6. **Presets and documents**: an SFZ instrument is a node preset of
   `aud.sampler.sfz` (`aud_node_preset.schema.json` of S1): `sfz_file`
   (usually `asset:<id>`), or `sfz_text` with `sfz_virtual_path`, plus the
   parameters; graph documents reference the files through their `assets`
   table (ticket 20). The headless host accepts load ids from
   `set_string` and waits for the loads of a document
   (`aud_host_wait_loads`). Schemas unchanged.
7. **Link hooks with `@RecordUse`** (interop-001, decision 5 of ticket
   22): the sampler's registration becomes a `@RecordUse` member; in
   profile and release builds the build hook hands the library to a link
   hook, which keeps it only when an app registers the sampler. Proof: a
   release build of an app with and without the sampler; the size saved
   is recorded.
8. **Faust audit** (sampler-001, license-002), done for the plan:
   [sfizz-faust-audit.md](../concepts/topics/sfizz-faust-audit.md). Every
   Faust-generated module of the subset was traced to the library
   functions it was generated from. Three carry substantive "LGPL with
   exception" code: the 32 RBJ filter and EQ headers (`maxmsp.lib`'s
   `filtercoeff` — the default filter `lpf_2p` and every EQ band), `fverb`
   (`de.sdelay`) and the disabled `Metronome` (`en.ar`). All others are
   STK-4.3 and the author's BSD-2 code plus one-line GRAME helpers
   (`ma.SR`, `ba.if`, ...) that are "LGPL with exception" too. cephes'
   license is a permission e-mail. What happens to them is question 7;
   the result goes into `NOTICES.md` and sampler-001.
9. **Dart API**:
   - `aud_dsp_sampler`: `AudSfzSampler` (type id, parameter and string
     ids), `AudSfzPreset` (builds node presets), the `@RecordUse`
     registration, and `testing.dart` with `AudSfzTestInstrument`, which
     writes generated samples and their SFZ.
   - `aud_audio_core`: the message event, the message routes in
     `AudOscRouter` and `AudOscAdapter`, the new constants.
   - `aud_audio_graph`: loads (`AudLoad` with progress, result, cancel),
     `waitLoads`, the cache budget and usage, `sendMessage` and the stream
     of node messages.
   - `aud_audio`: the cache budget in `AudEngineConfig`, loads and cache
     numbers in the engine's report; the registry takes the sampler as any
     `AudNativeNodePackage`. The umbrella does not depend on the sampler
     (family-001: apps depend on the umbrella and the DSP packages they
     use).
10. **Example** (`aud_audio/example`): a sampler page next to the
    oscillator page: instruments generated on the device (scope-002: no
    legacy preset), an on-screen multi-touch keyboard with velocity from
    the touch position, sustain and modulation controls, load progress,
    the numbers, a 64-voice test and an auto-play run with an animated UI;
    integration tests on the iOS simulator, the Android emulator and the
    iPad. The keyboard is a small widget of the example; the package
    `aud_audio_ui_keyboard` is S17b.
11. **Tests**:
    - Golden renders with the offline renderer of the graph on a test
      instrument with generated samples: envelopes at three velocities,
      velocity response, sustain pedal, modulation, voice stealing;
      bit-exact on one target, within 1e-5 full scale across
      architectures (ticket 17, Verification).
    - Loading: swap with crossfade, cancel, failure, prepare during a
      load, cache trims and sharing between two nodes and two graphs,
      underflow.
    - Native tests of the sampler with the engine linked in, under
      ASan/UBSan, RealtimeSanitizer (with the probe of ticket 20) and
      ThreadSanitizer, with the watchdog, which then sees sfizz too.
    - Engine: stress tests of the task queue, the message slots and the
      reply ring; Dart at 100 % per mirrored file.
12. **Numbers** (ticket 17, Verification), on the iOS simulator, the
    Android emulator and the iPad Pro M5 (team SAZSC68S46); the Pixel
    stays open unless one is connected:
    - 64 voices at 48 kHz in 128-frame blocks: render time at most 50 % of
      the block (2.67 ms) — offline on the device in 128-frame blocks, and
      live at the buffer the device grants;
    - an instrument loads in at most 2 s within the sample cache budget;
    - note to sound at most one block plus the output latency;
    - zero xruns over 10 minutes of playing with UI animation (the iPad;
      shorter runs on the simulator and the emulator).

## Constraints

- Dart never runs on the audio thread (interop-001); sfizz renders under
  its RT/CT/OFF contract and loads on an engine-owned worker
  (sampler-001); the node runs under RealtimeSanitizer and the watchdog.
- Permissive licenses only: dr_libs, never libsndfile (license-002);
  NOTICES for sfizz, Abseil and dr_libs; the notices check passes.
- No backward compatibility with the legacy app's presets or API
  (scope-002); test instruments use generated samples.
- Model: Claude Opus 5.5 (process-002: a DSP port with a given source).
  Deviation: the ABI, the realtime engine changes and the provenance
  audit belong to the Fable 5.1 max class of process-002. Compensation:
  native tests of every new realtime path under ASan/UBSan, RTSan and
  TSan with the watchdog, stress tests of the new queues, `/code-review`
  at high effort on the realtime path, the asset loading and the C ABI
  before `gg do review`, then review-light.
- Scripts are Node.js with the license header.
- Examples reach sibling packages through `pubspec_overrides.yaml`; no
  path dependency in a package manifest.
- The family's constraints after the publish of ticket 22 are consistent
  (core and graph `^0.4.0`, io `^0.3.0`, exact pins in the umbrella);
  `gg do publish` raises them again. The plugin spikes (`aud_audio_vst3`,
  `aud_audio_auv3`) stay on core and graph 0.4 until S18 and S20;
  `aud_dsp_effects` stays on core 0.1 until S10a.
- `CHANGELOG.md` belongs to gg. Commit per repo with `gg one do commit -m`:
  first word "Add", details as "- " bullets, no Co-Authored-By trailer.
  The user runs `gg do publish`.

## Questions of the plan review

1. **Where do the loads, the worker and the sample cache live?**
   - (a) An engine resource manager in `aud_audio_graph` (scope 3):
     workers, loads, the budget and the trims, reached by packages
     through ABI 0.4; the sampler's store (scope 4) is its first cache.
     Core joins the ticket for the ABI; io and web follow for their
     constraints.
   - (b) Everything inside `aud_dsp_sampler`: its own loader thread,
     store, budget and load ids; no ABI change for assets. Cheaper now,
     but every later package with assets (S23 file player, S30 stretch,
     impulse responses) builds its own, and no budget spans them.
   - (c) An engine cache that owns the memory, with decoders supplied by
     the packages; sfizz's streaming rebuilt on top of it. The most
     general, the most work and realtime risk now.
   - Recommendation: (a). The message API needs ABI 0.4 anyway
     (question 4), and lifecycle-001 puts budgets and load ids at the
     engine.
2. **The budget's scope and defaults.** lifecycle-001 says "per engine"
   but shares assets between engines. Recommendation: one budget per
   process, since the cache is shared; default 256 MB, set through
   `AudEngineConfig`; preload of 8192 frames per sample (sfizz's
   default); two worker threads. The numbers of scope 12 may move the
   defaults.
3. **Loading while the node plays.**
   - (a) A standby synth with a 5 ms crossfade (scope 2); costs the
     memory of two instruments during a switch.
   - (b) The node parked and silent during the load, like the state calls
     of ticket 20; simpler, but silent for up to the load time.
   - Recommendation: (a).
4. **The transport of the message API.**
   - (a) Message events with an engine-owned OSC payload and replies
     through the notification path (scope 5), ABI 0.4.
   - (b) Messages as a string setting without replies; most of sfizz's
     API is queries, so this keeps little of it.
   - Recommendation: (a).
5. **Changes to sfizz.**
   - (a) Patch files in `aud_dsp_sampler`, applied by
     `scripts/vendor-sfizz.js` after copying, listed in `NOTICES.md`; the
     audanika fork stays untouched.
   - (b) A branch in `audanika/sfizz` and a new vendoring from it; needs
     pushes to the audanika organization.
   - Recommendation: (a) now; (b) when the fork is maintained for itself.
6. **Per-note controllers.** sfizz knows one per-note controller, poly
   pressure; per-note pitch bend, registered and assignable per-note
   controllers and per-note management have no counterpart.
   - (a) Poly pressure of MIDI 1.0 and 2.0 reaches sfizz; the others are
     ignored, documented and counted in a diagnostic.
   - (b) The patch adds per-note pitch bend to sfizz's voices.
   - Recommendation: (a); (b) with the note expressions of S18 and S19.
7. **The Faust modules** (scope 8). Strictly read, license-002 keeps none
   of them, since nearly every module uses the trivial helpers.
   - (a) Strict: re-implement every module from the literature (RBJ
     biquads, one-pole, SV and pink filters, comp, gate, limiter, disto,
     strings, the plate) — roughly 1000 lines of DSP with tests; drop the
     metronome.
   - (b) Exempt the one-line helpers listed in the audit (they leave no
     expression of the library in the generated C++) and keep the STK-4.3
     modules with the STK-4.3 notice; re-implement the RBJ filters and EQs
     from the RBJ cookbook (about 200 lines, frequency-response tests);
     drop `fverb` (`<effect> type=fverb` is logged as unsupported and
     passes the signal through until S10a's plate reverb can serve it);
     drop the metronome; replace cephes' Bessel function by a power series
     from the literature.
   - (c) Treat Faust's compiled-code exception as permissive and keep
     everything; this revises license-002's "LGPL in no form".
   - Recommendation: (b), recorded as a decision with the exact helper
     list.

## Affected repos

- `aud_audio_pm`: this plan, the row of ticket 25 in `doc/issues.md`, S9
  in the plan of ticket 17, the open work of sampler-001, lifecycle-001,
  interop-001, osc-001 and abi-001, the decisions of this ticket, the
  sfizz topic.
- `aud_audio_core` 0.5.0 (joins the ticket, question 1): ABI 0.4 —
  `AudHostApi` with `post_task`, the loads, the caches, `report` and
  `emit_message`; `AUD_EVENT_MESSAGE`, `AudMessage`,
  `AUD_NODE_CAP_MESSAGES`, `AUD_ERROR_CANCELLED`; Dart: the message event,
  the routes, the constants.
- `aud_audio_graph` 0.5.0: the resource manager, the message slots and
  the reply ring, the C API and the host (load ids, `aud_host_wait_loads`),
  the Dart API, native and Dart tests.
- `aud_audio_io` 0.3.1 and `aud_audio_web` 0.0.5: constraints only; gg
  adds them as the repos between the umbrella and core and graph.
- `aud_dsp_sampler` 0.2.0: the node, the fork patches with the store, the
  Faust result, the Dart API, the link hook, goldens and native tests,
  `NOTICES.md`, README and `index.jsonc`.
- `aud_audio` 0.3.0: the engine's cache budget and numbers, the example
  with the sampler page and its integration tests, README and
  `index.jsonc`.
- Not in the ticket: `audaudio.github.io` (a sampler page waits for S21 or
  a ticket of its own), the plugin spikes, `aud_dsp_effects`.

## Steps

1. Ticket 25 in `doc/issues.md`, this plan, the plan review; core, io and
   web added to the ticket.
2. The consequences of the Faust audit (question 7); the vendor script
   applies the patches; the STK-4.3 notice where code stays.
3. Core 0.5.0: ABI 0.4 and the Dart parts, with tests.
4. Graph 0.5.0: the resource manager, the message transport, the C API,
   the host; native tests under the three sanitizers and stress tests;
   the Dart API at 100 %.
5. Sampler: the store patch, the node, the native tests with the engine.
6. Sampler: Dart API, presets, the test instrument, goldens, the link
   hook and its proof.
7. io and web: constraints.
8. Umbrella 0.3.0: engine config and numbers, the example with the
   keyboard, integration tests.
9. Runs on the simulator, the emulator and the iPad; numbers recorded
   below.
10. Decisions, open work, ticket 17, the sfizz topic, READMEs and
    `index.jsonc`.
11. `/code-review` at high effort on the realtime path, the asset loading
    and the C ABI; fixes; commits per repo; `gg do push`; after the
    user's confirmation `gg do review`, then review-light.

## Open questions

Questions 1 to 7 above, to be decided at the plan review.

## Rests on

sampler-001, lifecycle-001, interop-001, interop-002, osc-001, abi-001,
graph-003, license-001, license-002, scope-002, build-001, process-002,
release-002; the plan of ticket 17 (S9, Verification), the spike of
ticket 5, the host of ticket 20 and the engine of ticket 22; the topic
[sfizz](../concepts/topics/sfizz.md).
