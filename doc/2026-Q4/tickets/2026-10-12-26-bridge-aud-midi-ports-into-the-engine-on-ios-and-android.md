# 26: S8 — Bridge aud_midi ports into the engine on iOS and Android

Status: planned 2026-10-12; plan review done 2026-10-12 (decisions below).

## Goal

Build step S8 of the plan of ticket 17 (milestone M1) in `aud_audio_midi`:
the input and output ports of the `aud_midi` family (0.1.0) become event
inlets and outlets of the engine's graph, on the types of
`aud_midi_standard` (midi-001) and on the engine's timeline (time-001),
with hot-plug, so that a MIDI keyboard plays the SFZ sampler of S9 on iOS
and Android at a constant latency of one block plus the output latency.
S29a (the app plays its instruments from its MIDI stream), S29b (the app
migrates onto `aud_audio_midi`) and S17b (the keyboard shows incoming
notes) build on it. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md)
("plays the sampler through a reverb from a MIDI keyboard").

## What the code base gives

The engine (core 0.5.0, graph 0.5.0, io 0.3.1, umbrella 0.3.0):

- `aud_graph_send_event` is tagged [control, one producer]: the Dart proxy
  is the only producer of the event queue (interop-002), and the enqueue
  path is not thread-safe (a plain sequence counter, the control thread's
  table of instances). No path exists for a native thread such as
  CoreMIDI's receive thread.
- Events carry a sample offset; timestamps travel beside them
  (`AudTimestamp`: host time in ns on the clock of `aud_clock.h`,
  `CLOCK_UPTIME_RAW` = `mach_absolute_time` on Apple, `CLOCK_MONOTONIC` on
  Android). The graph resolves host times against the block's output time,
  fitted by the time filter of time-001: a late event plays at offset 0
  with a diagnostic, a later one waits in the scheduler, whose places the
  control thread reserves. `AUD_EVENT_FLAG_LIVE` skips the lead by the path
  latency (graph-001).
- The host time of a block is when its first frame reaches the output. An
  event stamped on arrival lies behind it, so without an added delay every
  MIDI event resolves as late.
- The reported output latency runs from the callback to the first frame
  out: on iOS one block plus `AVAudioSession.outputLatency`, on Android the
  presentation time of the next frame minus the callback time. Android's
  latency tuner grows the buffer after xruns; a route change changes it.
- The note trackers close the notes delivered to a node when it retires,
  stops or resets. A removed node loses its event connections at once, so
  the note offs a retiring pass-through node forwards find no route —
  ticket 20 left the notes of retired emitters to S8.
- Events that reach the graph's event input become `AUD_NOTIFY_EVENT`
  notifications that name the emitting node and carry the sample position;
  the ring is shared with the diagnostics and lossy (1024).
- The IO stream passes no events; the umbrella wires `aud_graph_render`
  straight into the stream and has no extension point.
- Measured in tickets 22 and 25 (budget = a block plus the reported output
  latency): iPhone 16 Pro Max block 256 at 48 kHz (5.3 ms), budget
  26.0 ms, so 20.7 ms reported output latency; Galaxy Tab S4 block 384
  (8 ms), budget 39.4 ms (31.4 ms); iOS simulator 16.1 ms (10.8 ms); Android
  emulator block 1920, 146.6 ms (106.6 ms), callbacks of 64 to 960 frames.
  iOS reports no xruns, only late callbacks.
- `aud_dsp_sampler` 0.2.0: the inlet `midi` takes UMP MIDI 1.0 and 2.0
  channel voice with sample-accurate starts (sfizz `delay`); per-note
  controllers other than poly pressure are counted as unsupported
  (sampler-003); note offs wait while the sustain pedal is down.
- `aud_audio_midi` 0.0.2 is the `dart` template with a stale
  `aud_audio_graph ^0.0.2`. No C parser for MIDI 1.0 byte streams exists
  (`aud_ump.h` reads packets).

The `aud_midi` family (0.1.0 on pub.dev):

- `Midi.open()` runs a MIDI isolate in the app's isolate group (it shares
  the garbage collector); inputs deliver `MidiEvent`s with a `MidiTime` in
  µs of `Timeline.now` to the app isolate in batches over a `SendPort`.
- Apple: a C shim with its own CoreMIDI client and thread, UMP input ports
  for MIDI 1.0 and 2.0, a ring buffer that Dart drains after a
  `NativeCallable.listener` signal; timestamps are host ticks (0 becomes
  the arrival time), converted in Dart. The receive blocks of the client
  arrive one after the other on CoreMIDI's thread, which Apple does not
  promise. Port ids `coremidi:<uniqueID>`; offline endpoints stay listed,
  so a re-plugged device keeps its id (not verified with hardware). The
  first CoreMIDI client of a process decides the run loop of the
  notifications.
- Android: `android.media.midi` through Java and jnigen; the Java receiver
  (one dispatcher thread per port) stamps chunks with `System.nanoTime`
  (`CLOCK_MONOTONIC`, the engine's clock) and signals Dart; AMidi only
  sends; the package has no build hook. Port ids
  `android:<deviceId>:in:<n>` change on re-plug; `replugCandidates` finds a
  port by its fingerprint. USB and BLE are untested with hardware; loopback
  services serve the emulator.
- No native consumer hook, no raw timestamps outside the backends, no note
  off on a disconnect (the streams complete); hot-plug is reported about
  290 to 330 ms after the change. The ring on Apple and the buffer on
  Android drop when full.
- aud_midi measured a macOS round trip of 155 µs median and 380 µs p99,
  Android Java to Dart 0.15 to 2.5 ms in release and 7 to 12 ms in debug on
  the emulator; `NativeCallable.listener` has no latency bound.
- `FakeMidiBackend` (aud_midi_core): fake ports, `inject` with times,
  `addPort` and `removePort` for hot-plug. `aud_midi` requires its
  backends at `^0.1.0`.

## Scope

1. **Event sources in the graph** (question 1): `aud_audio_graph` gets an
   event source per producer — a lock-free single-producer queue of UMP
   events with host timestamps, created on the control thread with a
   committed target (node, inlet) and a timing policy, fed by one thread at
   a time (CoreMIDI's receive thread, Android's receiver thread or a Dart
   isolate), drained by the audio thread.
   - The drain runs after `popScheduled` and before the host events and
     `sortBlockEvents`, so the transport snapshot and the program's
     indexes are set. It peeks and pops: an event whose target lies beyond
     the block stays in the queue and ends the drain of this source, so
     pending events never take places of the scheduler; an event that does
     not fit into the block's table stays queued, so no note off is lost.
     A producer pushes in time order; a timestamp earlier than its
     predecessor's is raised to it and counted. The push checks no
     lookahead (that reads the wall clock and would break offline
     sources). Events for a target that no longer accepts events count as
     retired.
   - `release`, an atomic flag that any thread may raise, is consumed
     once per block before the drain: the drain empties the queue at once
     — note offs and controllers at offset 0, note ons dropped and counted
     — then the target's notes close (note offs first, then sustain and
     soft pedal off on every channel that used them; the sampler holds note
     offs under the pedal). A note off that does not fit into the queue
     raises `release`, so an overflow never leaves a note on. A port node
     has exactly one source, so the target's note tracker is the source's
     note set; a tracker per source for targets with several sources waits
     for a later step.
   - Producer hand-over (the Dart path and the native tap on one source):
     a producer attaches only after the previous one detached; the detach
     returns after the last push, which orders the two threads; an atomic
     producer token catches a violation under ThreadSanitizer.
   - Lifetime: tap detached → source retired → the audio thread
     acknowledges at its next block → the target may be collected (the
     collector skips instances a live source targets) → the source is
     freed.
   - Statistics per source, readable from the control thread: events,
     late events and their lateness, delivery delay (push time − event
     timestamp), drops.
   - Retired emitters: a retiring node keeps its event routes to living
     nodes until it is done, as its audio edges do, so the note offs it
     forwards while it closes its notes arrive. Generator nodes (an
     arpeggiator) need a set of emitted notes per emitter; that waits for
     the sequencer step S14.
   - C API and Dart API (`AudEventSource`).
2. **The timing policy** per source (question 2):
   - `fixed`, the default: an event sounds at its timestamp plus a
     constant C = P + L + m. L is the output latency as the stream reports
     it (on iOS it contains a block already, it is not added twice); P the
     longest callback period since the stream started, at least the
     nominal one; m a margin for the transport inside the device, the
     filter's residual and early callbacks (default 1 ms, set in step 5).
     C is fixed when the source is created and read again after every
     reset of the time filter and restart; a growing L shows as late
     events and the bridge raises C. An event that misses its target plays
     at the start of the block and counts as late with its lateness. The
     events carry no `AUD_EVENT_FLAG_LIVE`, so the lead of the path places
     them at T + C at the output.
   - `immediate`: an event plays at the start of the block that drains it;
     the events carry `AUD_EVENT_FLAG_LIVE`.
   - Offline the renderer's virtual timeline and an explicit C keep the
     goldens deterministic.

   | Per device (ticket 25) | iPhone 16 Pro Max | Galaxy Tab S4 | iOS simulator | Android emulator |
   | --- | --- | --- | --- | --- |
   | Block, reported output latency | 5.3 ms, 20.7 ms | 8.0 ms, 31.4 ms | 5.3 ms, 10.8 ms | 40 ms, 106.6 ms |
   | `immediate`: latency, jitter | 20.7 to 26.0 ms, 5.3 ms | 31.4 to 39.4 ms, 8.0 ms | 10.8 to 16.1 ms, 5.3 ms | 106.6 to 146.6 ms, 40 ms |
   | `fixed` (m = 1 ms): latency, jitter | 27.0 ms, below 1 ms | 40.4 ms, below 1 ms | 17.1 ms, below 1 ms | 147.6 ms, below 1 ms |

   `fixed` costs half a block on average plus m and removes the jitter of
   a whole block; it is the budget of ticket 17 exactly, with m as part
   of the transport's own latency. The emulator's longest callback may
   exceed its nominal block; P follows it.
3. **Port nodes** in `aud_audio_midi`: `aud.midi.input` (event outlet
   `out`, the target of its port's source; passes the events through and
   counts the activity) and `aud.midi.output` (event inlet `in` and an
   outlet `out` connected to the graph's event input, so its events reach
   Dart as notifications that name the node; SysEx is filtered there by
   default, since the notification ring is lossy). Both carry the port id
   as string key `port_id`, persist in the graph document and register
   through `AudNativeNodePackage` (the registry of S4).
4. **The path to the audio thread**: both paths are built and measured;
   the measurement of step 5 decides which one serves CoreMIDI and
   `android.media.midi` ports by default (midi-002).
   - Dart path, for every backend: the bridge receives the packets in Dart
     and pushes them into the source through FFI.
   - Native path: the backends call a native tap on their receive thread,
     which pushes into the source without Dart.
     - `aud_midi_core`: a separate interface `MidiNativeTapBackend`, which
       a backend implements on top of `MidiBackend` (checked with `is`, so
       the backends outside the ticket stay untouched), the capability
       `nativeTap`; `FakeMidiBackend` records taps.
     - `aud_midi_apple`: tap slots in the C shim, called on CoreMIDI's
       receive thread with the UMP words, the protocol and the timestamp
       in ns of the host clock (ticks converted with `mach_timebase_info`
       in 128-bit integers). Each slot owns its count of calls in flight
       and a busy flag: a call that finds the slot busy drops and counts,
       so the adapters stay nonblocking without a lock. The detach returns
       after the last call and never frees late (a timeout leaks and logs).
       "gone" comes from the notification block when a source disappears
       or goes offline (`kMIDIMsgPropertyChanged` and a property read). A
       source stays connected while a tap exists, also without Dart
       listeners; the taps live in the existing client, so the run-loop
       rule of the first client holds.
     - `aud_midi_android`: step 4 starts with a spike of the loading: a
       C library built by a build hook (interop-001) and called by the Java
       receiver through JNI — `System.loadLibrary` if Flutter packages the
       library under its name, otherwise `RegisterNatives` through
       package:jni's environment. The receiver copies each chunk with
       `GetByteArrayRegion` into a bounded buffer and calls the tap with
       the bytes and the `System.nanoTime` stamp; "gone" from the device
       callback; the detach guarantee of Apple.
     - `aud_midi`: `MidiInput` attaches and detaches a native tap through
       the MIDI isolate; its constraints on core, apple and android rise
       to `^0.1.1`.
     - `aud_audio_midi`: the tap adapters (scope 5).
   - Measurement (step 5), in two parts:
     - m first: the native path's delivery delay at p99.9 plus the
       measured earliness of the callbacks, per device.
     - Then the same events over three paths at once — the native tap,
       Dart in the MIDI isolate (one hop; the harness hosts the MIDI
       engine in its own isolate) and Dart in the app isolate (two hops,
       today's API) — each into its own source and its own counting sink
       node (only one path audible), ten minutes per device, idle and with
       the UI animated and garbage collection forced in the app's isolate
       group. Compared: delivery delay (taken on the producer thread),
       late share and drops in the backends.
     - Rule: the native tap becomes the default when a Dart path's p99
       delivery delay exceeds m or its late share 0.1 % on any device;
       otherwise the bridge stays on the Dart path and the native taps
       leave the release. Expected: the native tap, since aud_midi's own
       Android numbers already reach 2.5 ms.
5. **Events**: MIDI 1.0 bytes and UMP become the engine's UMP events in
   the protocol they arrive in (type 2 stays type 2, type 4 stays type 4;
   the sampler reads both). Per-note controllers reach the nodes as the
   device sends them. Clock, start, stop, continue and song position pass
   as type 1 events; syncing to them belongs to the sync steps after M4.
   - The byte parser keeps running status and the SysEx state across the
     chunks of a port, emits real-time bytes inside SysEx as type 1
     packets of their own and packs SysEx7 into type 3 packets.
   - A SysEx over 64 KiB, and SysEx and clock while the queue is more than
     half full, are dropped and counted, so they never crowd out notes; a
     dropped SysEx is dropped through its end, so no torn SysEx reaches a
     node.
   - Back: events at an output node leave through
     `MidiOutput.sendUmp(words, at:)` with the host time at which their
     sample reaches the audio output (from the engine's timing on the
     control side, scope 7), so an external synth sounds with the engine;
     aud_midi translates to the port's protocol and schedules through the
     OS (question 3). A dropped notification sends the note offs the
     output holds. On the devices the output latency (20 to 31 ms) covers
     the notification path; on the simulator a pause of the garbage
     collector may send late, which M1 accepts.
6. **Hot-plug**: a binding per port id holds the input node, the source
   and the tap. A port that disappears or goes offline raises `release`
   (from the tap's "gone" or from Dart's port change), so the held notes
   end; the node and its connections stay. When the port returns — same
   id on Apple, a fingerprint match on Android (question 4) — the tap
   attaches again. A port picked in the UI re-targets the binding;
   bindings come back from the port ids in the graph document after a
   restart.
7. **Dart API** (question 5): `aud_audio_midi` offers `AudMidiBridge`:
   attach to an engine and a `Midi`; ports with their state; `input` and
   `output` bindings by port id; per input the activity, the path (native
   or Dart), the policy and the statistics (input to output time last,
   median and p99; late events; drops). `aud_audio` offers what every
   extension needs: extensions that the engine prepares, starts, stops and
   disposes with itself (a bridge detaches its taps before the graph goes),
   the engine's timing on the control side (callback period, reported
   output latency, host time to sample position and back) and the registry
   entry of the port nodes.
8. **Example** in `aud_audio`: a page "MIDI keyboard": port picker with
   offline ports, activity per port, the sampler's instruments, the policy
   switch, the input to output time (the engine's estimate from the event's
   timestamp to the output time of its frame: last, median, p99) and the
   late events; the on-screen keyboard as a second source. Integration
   test: a virtual source (a CoreMIDI virtual source on iOS, the loopback
   service on Android) replays a recorded keyboard performance — sustain
   pedal, chords, fast repeats — through the warm-up and the measured
   minutes; the report lists xruns, late callbacks, late events, delivery
   delays and the input to output time. The latency probe of ticket 21
   checks the reported output latency acoustically on the devices.
9. **Tests**:
   - Dart, `aud_audio_midi`, on `FakeMidiBackend`: enumeration, bindings,
     hot-plug during held notes (remove and add; the fingerprint rebind),
     the Dart path, outputs; 100 % line coverage as in the family.
   - Goldens: the offline renderer plays timestamped input through a
     source into the sampler's test instrument: every note starts at its
     sample (timestamp + C), under `fixed` and `immediate`, across block
     sizes and with variable callback sizes (64 to 960 frames) within one
     render; within 1e-5.
   - Native (graph, bridge, Apple shim): queue, drain, release and retire
     under ASan/UBSan, RealtimeSanitizer (the drain and the nodes on the
     audio thread; the tap adapters marked nonblocking) and ThreadSanitizer
     (producer, audio thread, `release` from a third thread, retirement,
     the hand-over from the Dart path to the native tap under traffic),
     with the watchdog of ticket 20.
   - Stress: 10,000 events/s for 10 s, 64-note chords every block, SysEx
     dumps of 64 KiB between the notes, a full queue, `release` during a
     burst with pending note ons, hot-plug every 100 ms during held notes,
     removal of the input node while a chord and the pedal are held, a
     reset of the time filter (route change) during held notes: no note
     stays on (the sampler's voices return to zero), no note off is lost.
   - aud_midi family: the macOS CoreMIDI loopback test with taps (attach
     and detach under traffic, "gone" when a virtual source goes), the
     Android loopback on the emulator, 100 % Dart coverage.
10. **Documents**: decisions midi-002 (the bridge and its path),
    midi-003 (the timing of external MIDI; refines graph-001's "as early
    as possible" for timestamped input) and interop-003 (event sources for
    native producers; refines interop-002); the open work of midi-001,
    time-001, interop-002 (the engine's own note closing lifts no sustain),
    graph-001, graph-003 (generator nodes) and lifecycle-001; S8 in ticket
    17; `issues.md`; `architecture/packages.jsonc` (`aud_audio_midi`
    depends on `aud_midi`; the deferred entry goes). In `aud_midi_pm`: a
    decision on the native taps, port identity across re-plug, the open
    work of the family (hardware checks of USB and BLE), and a link to
    this plan.

## Budgets

Ticket 17's budgets, refined for external MIDI:

- Input to output time under `fixed`: constant, one block + the reported
  output latency + m (table of scope 2), plus the transport outside the
  device (USB about 1 ms, BLE MIDI one connection interval, 7.5 to 15 ms).
- Jitter under `fixed`: at most 0.1 % late events, a p99 delivery delay
  of at most m. Under `immediate` below one block by construction.
- Disconnect: no note stays on; from the shim's "gone" to the output time
  of the block with the note offs at most 10 ms plus that block's C on the
  native path, at most 50 ms on the Dart path; the audio runs on without
  an xrun; after a re-plug the input plays again within 500 ms of the
  operating system's report.
- Zero xruns over ten minutes of playing with an animated UI after the
  twenty-minute warm-up (iOS: also the late callbacks are reported).
- Stress tests without a note left on; sanitizers clean; no violation of
  the watchdog.

## Constraints

- Dart never runs on the audio thread (interop-001). MIDI reaches the
  audio thread only through the engine's lock-free queues: the Dart queue
  of interop-002 or an event source of scope 1, each with one producer.
- Native parts run under RealtimeSanitizer, ThreadSanitizer, ASan/UBSan
  and the watchdog of ticket 20.
- Path references between the two families only through the ticket (gg
  localizes them in `pubspec_overrides.yaml` and turns them back at the
  publish). Manifests keep git references with `tag_pattern` —
  `aud_audio_midi` reaches `aud_midi` like `aud_audio_core` reaches
  `aud_midi_standard`; the switch to pub.dev belongs to S22 — and never a
  path dependency. Examples reach sibling packages through
  `pubspec_overrides.yaml`.
- Permissive licenses only. The new native code is our own (MIT);
  `NOTICES.md` and the notices check go into `aud_audio_midi`,
  `aud_midi_apple` and `aud_midi_android`, where native code comes in.
- Model: process-002 puts the C++ and FFI work and the planning of an
  implementation ticket on Claude Fable 5.1 at high effort. This plan was
  drafted on Claude Opus 5.5, the model of the session, and reviewed by
  Fable 5.1 at high effort; the review's twelve findings are in the plan.
  Deviation (question 7): the session stays on Opus 5.5 for the lead, the
  Dart work and the documents; the C++ and FFI work runs in Fable 5.1
  agents at high effort, and the `/code-review` of the core code runs on
  Fable 5.1 at high effort.
- Versions: below 1.0 a compatible addition takes the patch number (Dart's
  convention), so graph 0.5.1 keeps io, web and the sampler on `^0.5.0`;
  the umbrella moves its exact pin to 0.5.1 (family-001) and becomes
  0.3.1; `aud_audio_midi` 0.1.0; the `aud_midi` packages 0.1.1, `aud_midi`
  with its constraints at `^0.1.1`; the project management repos a minor
  each. `gg do publish` sets the references.
- Every repo of the ticket has a `.gg/publish_config.json` with
  `mergeMessage` and `versionIncrement` before `gg do review`.
- Before long unattended device runs the user unlocks the devices and
  switches off the iPhone's auto-lock.
- Scripts are Node.js with the license header.
- `CHANGELOG.md` belongs to gg. Commit per repo with `gg one do commit -m`:
  first word "Add", details as "- " bullets, no Co-Authored-By trailer.
  `/code-review` at high effort on the event path, the timing and the C
  ABI before `gg do review`; the user confirms `gg do review`; then
  review-light with parallel reviewers per repo. The user runs
  `gg do publish`.

## Questions of the plan review

1. **Where does external MIDI enter the graph?**
   - (a) Event sources in `aud_audio_graph` (scope 1): one queue per
     producer, drained with the graph's time resolution, late policy,
     budget, note tracking and diagnostics; reusable by the OSC server
     (S7) and Link (link-001). The graph joins the ticket (0.5.1).
   - (b) A private ring inside the node `aud.midi.input`: no graph change,
     but the node repeats the time resolution, the late policy and the
     note tracking, and MIDI bypasses the engine's queues.
   - Recommendation: (a).
2. **The default timing policy.**
   - (a) `fixed` with m = 1 ms (scope 2), `immediate` per input on
     request.
   - (b) `immediate` by default, `fixed` on request.
   - Recommendation: (a): a constant 27.0 ms on the iPhone instead of
     20.7 to 26.0 ms with 5.3 ms of jitter.
3. **Outlets.**
   - (a) Through the notification path into aud_midi's scheduled send,
     aligned with the audio output time; a dropped notification sends the
     note offs the output holds; a native send path stays open work.
   - (b) A native send path now: a ring from the audio thread, a sender
     thread, native send hooks in `aud_midi_apple` and `aud_midi_android`.
   - Recommendation: (a); M1 needs input, outlets serve MIDI thru and the
     sequencer after M4.
4. **Port identity on Android after a re-plug.**
   - (a) The bridge rebinds by fingerprint (`replugCandidates`); aud_midi
     keeps its ids.
   - (b) `aud_midi_android` derives stable ids from the device (USB vendor,
     product and serial number; BLE address); the ids change for every
     user of aud_midi.
   - Recommendation: (a).
5. **The bridge's Dart API and the umbrella.**
   - (a) `aud_audio_midi` holds `AudMidiBridge`; the umbrella gains the
     extension point, the timing and the registry entry; its dependencies
     stay those of ticket 17's package table, the example depends on
     `aud_audio_midi`.
   - (b) The umbrella depends on `aud_audio_midi` and offers `engine.midi`;
     every app of `aud_audio` then carries the `aud_midi` family.
   - Recommendation: (a).
6. **MIDI hardware and the runs on the devices.** Which USB MIDI keyboard
   (and adapter) is there, and a Bluetooth MIDI device? The Galaxy Tab S4
   has one USB port, so adb moves to Wi-Fi while the keyboard is plugged
   in. Recommendation: the warm-up and the measured ten minutes unattended
   with the recorded performance on a virtual source, then ten minutes of
   playing the real keyboard by the user per device, and the hot-plug
   check with a held chord.
7. **The model.**
   - (a) This session switches to Claude Fable 5.1 at high effort after
     the plan review.
   - (b) The session stays on Opus 5.5 and runs the C++ and FFI work in
     Fable 5.1 agents at high effort; the deviation is recorded.
   - Recommendation: (a).

## Decisions of the plan review (2026-10-12)

Gabriel Gatzsche decided:

- 1 → (a) event sources in `aud_audio_graph`; the graph joins the ticket
  (0.5.1); interop-003.
- 2 → (a) `fixed` with m = 1 ms by default, `immediate` per input;
  midi-003.
- 3 → (a) outlets through the notification path into aud_midi's scheduled
  send; a native send path stays open work.
- 4 → (a) the bridge rebinds Android ports by fingerprint; aud_midi keeps
  its ids.
- 5 → (a) `AudMidiBridge` in `aud_audio_midi`; the umbrella gains the
  extension point, the timing and the registry entry, and keeps its
  dependencies.
- 6 → a USB MIDI keyboard and a Bluetooth MIDI device are there (models
  named at the runs); the warm-up and the measured ten minutes run
  unattended with the recorded performance on a virtual source, then the
  user plays the real keyboard ten minutes per device, with the hot-plug
  check on a held chord.
- 7 → (b) the session stays on Opus 5.5; the C++ and FFI work runs in
  Fable 5.1 agents at high effort (deviation in Constraints).

## Affected repos

- `aud_audio_pm`: this plan; row 26 of `doc/issues.md`; the list in
  `tickets/README.md`; S8 in the plan of ticket 17; the decisions
  midi-002, midi-003 and interop-003; the open work of midi-001, time-001,
  interop-002, graph-001, graph-003 and lifecycle-001; the decisions index;
  `architecture/packages.jsonc` and `architecture.md`.
- `aud_midi_pm`: the decision on native taps and port identity, the open
  work in the decisions index, a link to this plan.
- `aud_audio_graph` 0.5.1 (question 1): event sources, the timing policy,
  `release`, the statistics, the routes of retiring emitters; C API, Dart
  API, native, stress and Dart tests.
- `aud_audio_midi` 0.1.0: the port nodes, the tap adapters and the byte
  parser (build hook), `AudMidiBridge`, tests and goldens, `NOTICES.md` and
  the notices check, README and `index.jsonc`; the stale graph constraint.
- `aud_audio` 0.3.1: the extension point, the timing, the registry entry,
  the page "MIDI keyboard", the integration test with the virtual source,
  the stale `aud_dsp_sampler ^0.1.0` of the example; README and
  `index.jsonc`.
- `aud_midi_core` 0.1.1: the native tap interface, the capability, the
  fake.
- `aud_midi_apple` 0.1.1: tap slots, "gone", ns timestamps; `NOTICES.md`
  and the notices check.
- `aud_midi_android` 0.1.1: the JNI library and its build hook, the
  receiver and the device callback; `NOTICES.md` and the notices check.
- `aud_midi` 0.1.1: the tap through the MIDI isolate, the constraints.
- Not in the ticket: `aud_audio_core` (the event and timing contracts stay;
  the parser is the bridge's own), `aud_audio_io`, `aud_audio_web`,
  `aud_dsp_sampler` (`^0.5.0` accepts graph 0.5.1), `aud_midi_standard`
  (the Dart types suffice).

## Steps

1. Ticket 26 in `doc/issues.md`, this plan, the plan review; the code repos
   added to the ticket.
2. Graph 0.5.1: event sources, the timing policy, `release`, statistics,
   the routes of retiring emitters; native tests under the sanitizers and
   the watchdog, stress tests, the Dart API at 100 %.
3. `aud_audio_midi`: the build hook, the port nodes, the byte parser and
   the tap adapters with native tests; `AudMidiBridge` on the Dart path with
   `FakeMidiBackend` tests; goldens.
4. The `aud_midi` family: the spike of the JNI loading; the tap interface
   and the fake (core), the shim (Apple), the JNI library (Android), the API
   (aud_midi); loopback tests on macOS and on the emulator.
5. Measure m, then the three paths on the simulator, the emulator, the
   iPhone and the tablet; decide midi-002; record the numbers here.
6. The bridge on the chosen path: hot-plug, outlets, statistics; the Dart
   API at 100 %.
7. Umbrella 0.3.1: the extension point, the timing, the registry entry, the
   page "MIDI keyboard", the integration test.
8. Runs on the devices: warm-up and ten measured minutes, the keyboard
   sessions, hot-plug with held notes, Bluetooth MIDI where available, the
   iPad if reachable; numbers recorded here.
9. Decisions, open work, ticket 17, the `aud_midi_pm` records, READMEs and
   `index.jsonc` of the repos.
10. `/code-review` at high effort on the event path, the timing and the C
    ABI; fixes; publish configs; commits per repo; `gg do push`; after the
    user's confirmation `gg do review`, then review-light; fixes.

## Open questions

None open.

## Rests on

midi-001, time-001, interop-001, interop-002, graph-001, graph-002,
graph-003, lifecycle-001, abi-001, osc-001, osc-002, sampler-003,
release-002, release-003, repos-001, family-001, build-001, license-001,
license-002, process-002, process-003.
