# 21: S3 — Build the audio IO for iOS and Android

## Goal

Build step S3 of the plan of ticket 17
([2026-10-07-17-audanika-audio-engine.md](2026-10-07-17-audanika-audio-engine.md)),
mobile first (release-001): devices and duplex streams of `aud_audio_io` on
iOS (miniaudio, io-001) and Android (Oboe, io-002). The streams render
through the render interface of ABI 0.3 (`AudRenderFunction`,
`AudRenderRequest`, `AudStreamTime`), the interface the graph of tickets 19
and 20 renders through. Each callback carries the timing contract of
time-001. The streams recover from the lifecycle cases of lifecycle-001
without help. The umbrella (S4) wires the IO to the graph. The desktop
backends follow as S3b to S3d. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## Scope

1. **Devices**: a device model (id, name, direction, channel counts,
   sample rates, default flag, route type); enumeration and hot-plug
   notifications on iOS (AVAudioSession routes and available inputs) and
   Android (AudioManager devices, see open question 1).
2. **Streams**: output, input and full duplex. Duplex uses Oboe's
   `FullDuplexStream` on Android and miniaudio's duplex device on iOS.
   Channels per route; sample rate and buffer size negotiation (Oboe's
   latency tuner, performance and sharing modes; AVAudioSession's
   preferred sample rate and IO buffer duration); variable callback sizes
   up to a negotiated maximum. The callback de-interleaves into
   preallocated planar `AudAudioBus` buffers, fills an `AudStreamTime`,
   calls the `AudRenderFunction` with an `AudRenderRequest` and
   interleaves the result. Nothing allocates, locks or logs in the
   callback.
3. **Timing** (time-001): sample position, host time of the first frame
   at the output (input: when it was captured), source, accuracy, and
   output and input latency in every callback.
   - Android: Oboe's `getTimestamp(CLOCK_MONOTONIC)`, extrapolated to the
     block. Source `HARDWARE` when AAudio reports a timestamp, otherwise
     `ESTIMATED` from `calculateLatencyMillis`.
   - iOS: the callback time plus AVAudioSession's `outputLatency`,
     `inputLatency` and `IOBufferDuration`. Source `ESTIMATED` (open
     question 2).
   - The `mach_absolute_time` and `CLOCK_MONOTONIC` values are converted to
     the core's monotonic nanoseconds.
4. **Lifecycle** (lifecycle-001): interruptions (phone calls, Siri, audio
   focus loss), route changes and disconnects (an AAudio stream is closed
   and reopened from a control thread, never from the callback),
   sample-rate changes, backgrounding, microphone permission denied.
   - The stream recovers on its own and reports each case to the control
     thread as a lifecycle notification with the old and new format. The
     client then runs the graph's route-change sequence (suspend, prepare,
     resume; ticket 20 proved it).
   - Budget: recovery within 500 ms. The transport position is kept and no
     notes get stuck (verification section of ticket 17).
   - The sample position stays monotonic across a recovery and a
     discontinuity flag resets the time filter.
5. **Counters and diagnostics**: callbacks, block sizes (min, max), periods,
   late callbacks, xruns, disconnects, recoveries, callback time, latency
   per direction. They are read lock-free from atomics. Notifications
   (device changes, lifecycle) reach Dart through a native notification
   thread that a semaphore wakes and that invokes a
   `NativeCallable.listener`. The audio thread never calls into Dart
   (interop-001).
6. **Build**:
   - Android: the build hook compiles Oboe and links with
     `-Wl,-z,max-page-size=16384`. A Node script runs `llvm-readelf -l` on
     the built `.so` and fails on a `LOAD` alignment below `0x4000`.
   - iOS: miniaudio stays the vendored single header, compiled in an
     Objective-C++ unit with AVFoundation for the session.
   - `NOTICES.md` and the notices check pass.
7. **Dart API**:
   - `AudioDevices`: a list and a change stream.
   - `AudioStreamConfig`: direction, device ids, channels, sample rate,
     buffer frames, performance mode.
   - `AudioStream`: open, start, stop, close, the actual format, timing and
     latency, counters, and a stream of lifecycle notifications.
   - A client hands the stream a render function as a native function
     pointer plus user pointer, e.g. `aud_graph_render` with
     `graph.pointer`. A sine render function in the package serves tests
     and the example. The umbrella (S4) wires the graph in.
8. **Tests and proof**:
   - Native tests of the null backend in `scripts/test-native.js`, as in
     `aud_audio_graph`: the callback path, de-interleaving, timing fields,
     counters, simulated disconnect and recovery, the notification thread.
   - They run under ASan and UBSan, under RealtimeSanitizer with a probe
     that must be caught, and under ThreadSanitizer, and fail on any
     violation.
   - Dart tests on the null backend with 100 % coverage per mirrored test
     file.
   - The example app runs on the iOS simulator and the Android emulator.
     That proves the code runs, not that it meets a budget.
   - The reference devices supply the numbers: round-trip latency, xruns
     over 10 minutes, callback-time jitter, the timestamp error against a
     loopback measurement, and the recovery time. The numbers go into
     Findings.

Constraints:

- Mobile first: iOS and Android only; the desktop is S3b to S3d.
- No backward compatibility with the spike stream: `aud_io_open` with the
  interleaved `AudRenderCallback` goes.
- The core dependency moves from `^0.1.0` to `^0.3.0`.
- All scripts are Node.js.
- CHANGELOG.md belongs to gg.
- Stream callbacks are marked `[[clang::nonblocking]]` behind the macro
  `AUD_NONBLOCKING`.

## Affected repos

- `aud_audio_pm`: this plan, the row in `doc/issues.md`, the open work of
  io-001, io-002, time-001 and lifecycle-001, the blog post.
- `aud_audio_io`: the device model, the backends, timing, lifecycle,
  counters, notification thread, Dart API, tests, sanitizer and readelf
  scripts, example app. Version 0.2.0 (minor, breaking in major 0).
- `audaudiohub.io`: the page "Audio IO" with devices, streams, timing,
  lifecycle, the render-function handover and the measured numbers.
- `aud_audio_core`: not added. `aud_abi.h` already carries all S3 needs:
  `AudStreamTime` has the sample position, host time, source, accuracy
  and latency per direction, and `AudRenderRequest` takes planar buses.
  Lifecycle and device types live in `aud_audio_io.h`. The core is added
  only if the implementation proves otherwise (then 0.4.0).
- `aud_audio_graph`: a dev dependency of `aud_audio_io` for the
  end-to-end Dart test: the null device renders `aud_graph_render`
  through a stream and runs the graph's route-change sequence. Not added
  to the ticket; nothing in it changes.

## Steps

1. Done: register ticket 21 in `doc/issues.md` and confirm this plan.
2. Done: raise the core dependency to `^0.3.0`. Replace the spike API by
   `aud_audio_io.h` v2: device model, config, stream, `AudRenderFunction`
   handover, timing, counters, notifications, lifecycle codes.
3. Done: common C++ layer: planar bus buffers, the time builder, atomic
   counters, the notification queues plus thread, the recovery worker, the
   null backend with injectable faults.
4. Done: native tests plus `scripts/test-native.js` (ASan/UBSan, RTSan
   with a probe, TSan), with `AUD_NONBLOCKING` on the callbacks.
5. Done: Android backend: Oboe output, input and duplex; latency tuner;
   timestamps; disconnect and reopen; devices, audio focus and the
   permission through `package:jni`; the build hook with 16 KB alignment
   and `scripts/check-page-size.js`.
6. Done: iOS backend: AVAudioSession configuration, routes, interruptions,
   media-services reset, route changes; miniaudio duplex; timestamps from
   the callback block and the session latencies.
7. Done: Dart API, ffigen and jnigen bindings, notification
   `NativeCallable.listener`, Dart tests at 100 % coverage.
8. Done: example app with device list, sine, monitor and latency probe,
   live counters and timing, a copyable report; integration test on the
   iOS simulator and the Android emulator.
9. Open: run on the reference devices and record the numbers under
   Measurements.
10. Done: the docs page "Audio IO", the decisions' open work, the
    index.jsonc and the README.
11. `/code-review` at high effort on the callback paths, then review-light.
    Every finding goes into Findings. Then `gg do review`.

## Decisions of the plan review (2026-10-09)

Gabriel Gatzsche confirmed all four as recommended:

- 1 → (a) `package:jni`; 2 → `ESTIMATED` now, measure, RemoteIO in S15 if
  the error exceeds 1 ms; 3 → an iPhone 15 or newer and a Pixel 8 or
  newer; 4 → vendored.

The questions as they were asked:

1. **Android without Java in the package**: how are devices enumerated,
   audio focus followed and the microphone permission asked for?
   - (a) `package:jni` from Dart.
   - (b) A Kotlin part in a Flutter plugin.
   - (c) JNI from C++.
   - Recommendation: (a) with `jnigen` bindings for `AudioManager`.
     - `getDevices` gives the enumeration.
     - Hot-plug: re-read the devices on Oboe's disconnect and on
       `AudioManager` changes. `AudioDeviceCallback` is an abstract class
       that `package:jni` cannot implement, so a cheap poll on the
       notification thread stands in while a stream is open.
     - Focus: `OnAudioFocusChangeListener` is an interface, which
       `package:jni` implements.
     - Permission: the package checks `checkSelfPermission`, reports
       `permissionDenied` and leaves the request dialog to the app, e.g.
       with `permission_handler` in the example. The package stays free of
       Gradle and Kotlin (interop-001).
   - (b) is the fallback if `jnigen` cannot cover a case.
2. **iOS timestamps for Link (S15)**: is the miniaudio callback time plus
   the AVAudioSession latencies (`ESTIMATED`) enough, or is a RemoteIO path
   with the render callback's `AudioTimeStamp` (`HARDWARE`) needed?
   - Recommendation: ship `ESTIMATED` now and measure the jitter against
     the loopback on the reference iPhone.
   - If the error exceeds 1 ms, S15 adds a RemoteIO backend behind the same
     interface. miniaudio already runs on RemoteIO but does not pass on
     `mHostTime`, and we do not patch the vendored header.
3. **Reference devices** (open question 6 of ticket 17): which iPhone or
   iPad, and which Android phone with a low-latency AAudio (MMAP) path?
   - Proposal: an iPhone 15 or newer, and a Pixel 8 or newer (AAudio MMAP,
     `PROPERTY_LOW_LATENCY`).
   - The owner names the devices on hand.
4. **Vendored or fetched Oboe and miniaudio** (open question 1 of ticket
   5)?
   - Recommendation: vendored, as build-001 decided and the spike did.
     Pinned versions, the license files and `NOTICES.md` are in the repo,
     builds work offline and the notices check sees exactly what ships.
   - Oboe is trimmed to the files the hook needs (`SOURCES.txt`,
     `INCLUDES.txt`).

A follow-up on 1, answered on 2026-10-09: `package:jni` declares the
Flutter SDK as an environment constraint and its Android part is a Flutter
plugin; since jni 1.0 the Android context comes from `jni_flutter`, which
depends on the Flutter SDK itself. Gabriel Gatzsche decided to keep the
Java part in `aud_audio_io`: the package depends on Flutter, and the
Android part sits behind a `dart.library.ui` conditional import.

## Implementation

- **C API** (`src/aud_audio_io.h`, API version 2): a session per app
  (`aud_io_session_*`) owns the backend, lists the devices, answers the
  microphone permission and wakes one listener; streams
  (`aud_io_stream_*`) of a session open output, input or duplex with a
  render function and its user. IO results extend the ABI's codes from
  -100 down; the ABI stays 0.3.
- **The callback** (`streamProcess`, `[[clang::nonblocking]]` with
  `AUD_IO_RTSAN`): counts the callback, builds the `AudStreamTime`,
  splits the device block into blocks of at most `max_frames`,
  de-interleaves into preallocated planar buses, calls the render
  function, interleaves the result. A failing render function plays
  silence and reports once until it succeeds again.
- **Time**: the host time of the block is the output time - for an
  input-only stream the capture time - moved by the frames of every split
  block. The accuracy is the mean deviation of the host times from the
  sample clock (weight 1/16), the largest deviation a counter. After a
  start or a recovery the sample position runs on by the frames the device
  was away, at least one: the time filter of the core resets on exactly
  this discontinuity, so no ABI flag is needed.
- **The format hold**: a recovery that changes the rate or the channel
  counts raises the format generation; the stream then plays silence and
  advances the position until the client calls
  `aud_io_stream_acknowledge(generation)` after its route-change
  sequence (graph: suspend, prepare, resume). `max_frames` never changes,
  since the stream splits larger callbacks.
- **Recovery**: a worker thread per stream reopens the device after a
  loss, retrying after 0, 10, 20, 50, 100, 200 and then every 400 ms until
  the session's `recovery_timeout_ms` (default 5 s), then reports
  `failed`; `start` tries again. A requested device that is gone gives
  way to the default device. Interruptions stop the device and restart it
  when they end; a device lost meanwhile reopens then.
- **Notifications**: the audio thread posts into a lock-free queue per
  stream, every other thread into a queue of the session; a sequence number
  orders both. A notification thread wakes the Dart listener
  (`NativeCallable.listener`), which takes them; the audio thread never
  calls into Dart.
- **Android** (`aud_io_android.cpp`): Oboe with shared-pointer callbacks,
  so that Oboe's error thread keeps them alive across a close;
  `FullDuplexStream` with the input read into a buffer of our own; the
  latency tuner, or two bursts without it; AAudio timestamps moved to the
  first frame of the block (`HARDWARE`), otherwise the buffer as an
  estimate (`ESTIMATED`). The Dart side (`lib/src/android`, jnigen
  bindings of `AudioManager`, `AudioDeviceInfo`, `AudioFocusRequest`,
  `Context`, `Build`) lists the devices, polls them every second for
  hot-plugs, holds the audio focus while a stream plays - its loss
  interrupts the session, its return resumes it - and asks for the
  microphone through the activity, waiting for the app's return.
- **iOS** (`aud_io_ios.mm`): an AVAudioSession of our own (playback, or
  play-and-record with default-to-speaker and A2DP; mix-with-others, HFP
  and measurement mode as session flags); miniaudio's device on it with
  callbacks of the hardware's size; observers of route changes,
  interruptions (with app suspension and muted built-in mic), media
  services reset and the return to the foreground. The host time is the
  callback time plus the callback's block plus the session's latency per
  direction (`ESTIMATED`).
- **Desktop**: the platform backend is the null device until S3b to S3d.
- **Dart** (`AudIoSession`, `AudIoStream`, `AudIoProbe` and the value
  types): a client hands the stream `Native.addressOf` of a render
  function, e.g. `aud_graph_render`, and `graph.pointer` as user.
- **Tests**: 35 native tests on the null device under ASan/UBSan, RTSan
  with its probe and TSan; 63 Dart tests with 100 % coverage per mirrored
  file, among them the null device rendering an `AudGraph` across a
  change to 44.1 kHz; an integration test of the example on the simulator,
  the emulator and devices.

## Measurements

The simulator and the emulator prove that the code runs; the budgets need
the reference devices.

- **Null device** (macOS, arm64, 128-frame buffer): recovery from a
  disconnect with the device back at once, 50 times: 0.17 ms minimum,
  1.8 ms median, 3.3 ms maximum - the stream's own share of the 500 ms.
- **iOS simulator** (iPhone 17 Pro): 48 kHz; the session reports a 256
  frame IO buffer, the callbacks bring 512 frames every 10.67 ms; 11 µs
  mean and 16 µs maximum in the callback; estimated output latency 517
  frames; accuracy 28 µs, largest deviation 70 to 190 µs; duplex runs.
- **Android emulator** (API 36, arm64): `oboe/aaudio` without MMAP,
  48 kHz, a 1920-frame buffer, callbacks of 64 to 960 frames every
  10.3 ms on average with about 33 late ones in 2 s; output latency about
  5100 frames, input about 1300 to 1700; host times from AAudio's
  timestamps, largest deviation 20 to 42 ms; duplex with 2 in and 2 out;
  the audio focus is requested and abandoned, and a simulated call
  (`adb emu gsm call`) interrupts the stream, which resumes when the call
  ends.
- **iPad Pro 11" (M5), iOS 26.6** - a real device, not one of the
  reference devices - with its built-in speaker and microphone, 48 kHz and
  a 256-frame IO buffer (`integration_test/aud_io_measure_test.dart` of
  the example):
  - Output: a callback of 256 frames every 5.33 ms (5.10 to 5.47 ms), no
    late callback and no xrun in runs of 12 to 20 s, at most 10 µs inside
    the callback; the estimated host times deviate 10 µs on average and at
    most 50 to 230 µs from the sample clock; reported output latency 757
    frames (15.8 ms) in measurement mode, 784 (16.3 ms) without it.
  - Round trip through the air, without measurement mode: 24 of 24 clicks
    found at a peak of 0.46, 2295 to 2303 frames (47.9 ms) and later
    exactly 2299 in every click. The stream first reported 1114 frames, an
    error of 24.8 ms: miniaudio's duplex ring buffer - five periods,
    started two periods ahead - runs full and holds the input up to 1280
    frames (26.7 ms). Counting the frames still queued there, the stream
    reports 2394 frames: an error of -95 frames (-2.0 ms), which depends on
    the phase of the capture callback against the playback callback.
  - In measurement mode the speaker plays so quietly and the input gets so
    little gain that the clicks came back at a peak of 0.002 to 0.009,
    below every threshold tried.
- **Reference devices** (an iPhone 15 or newer, a Pixel 8 or newer): open.
  The example's latency probe needs a loop from the output to the input -
  a cable or the air - and its "Copy report" collects the numbers: round
  trip measured against reported, xruns over 10 minutes, callback-time
  jitter, the timestamp error and the recovery times.

## Findings

- **Model deviation**: process-002 asks Claude Fable 5.1 at max effort for
  the IO backends. This ticket runs on Claude Opus 5.5.
- **Compensation**:
  - `AUD_NONBLOCKING` on every stream callback.
  - The native tests on the null backend run under ASan/UBSan, under
    RealtimeSanitizer with a probe that must be caught, and under
    ThreadSanitizer, and fail on any violation. All three pass; the probe
    is caught.
  - `aud_abi.h` stays as it is: nothing proved a change necessary.
  - Latency, xrun and timestamp numbers come only from real devices; the
    simulator and emulator numbers above prove that the code runs.
  - `/code-review` at high effort on the callback paths, then the
    review-light skill before `gg do review`. Every finding is kept here.
- **Flutter SDK**: `package:jni` and `jni_flutter` make `aud_audio_io` a
  package that needs the Flutter SDK (follow-up of decision 1). gg now runs
  its tests with `flutter test`; the umbrella inherits the requirement.
- **Permission on Android**: the plan left the dialog to the app; the
  package asks itself, through the activity of `jni_flutter`, and takes
  the answer when the app returns to the foreground. Android cannot tell
  "not asked yet" from "denied"; before the first request in a process the
  permission reads undetermined.
- **Oboe's FullDuplexStream** sizes its input buffer by the output channel
  count: a stream with more inputs than outputs would overrun it. The
  stream overrides `readInput` and reads into a buffer of its own; the
  vendored Oboe stays unpatched.
- **miniaudio on iOS**: it sets the session's preferred rate to the rate it
  is given - 0 included, which made the simulator run at 8 kHz -, so the
  backend passes the session's hardware rate. It drops the
  `AudioTimeStamp` of the RemoteIO callback, so iOS host times stay
  estimates until a RemoteIO path (S15). It reports route changes without
  reopening and stops on an interruption without restarting, so the
  backend observes the session itself. It sets
  `kAudioUnitProperty_MaximumFramesPerSlice` to its period: with the
  screen locked iOS may ask for 4096 frames; to be checked on the device.
- **The simulator** calls back with 512 frames while its session reports
  an IO buffer of 256: the iOS time estimate uses the block of the
  callback, not the IO buffer.
- **Symbols**: the static C++ runtime was exported from the Android
  library; `-Wl,--exclude-libs,ALL` keeps it inside, and
  `--gc-sections` shrinks the library from 990 to 666 KB. Only the 29
  `aud_io_*` functions are exported. Every library of the example's
  build has 16 KB LOAD alignment (`scripts/check-page-size.js`).
- **Oboe stays complete**: the plan said Oboe would be trimmed to a
  `SOURCES.txt` and `INCLUDES.txt`; every part of it is reachable -
  AAudio, the OpenSL ES fallback, the conversions of its flow graph - so
  the hook compiles it all and the linker drops what is not called.
- **Periods across a restart**: the emulator test with a simulated call
  showed the 4 s of the interruption as a callback period and a late
  callback; a restart now resets the period, and a native test keeps it so.
- **The emulator** failed the duplex test once, on its first run after the
  microphone was granted; the output was not kept, and ten runs since
  passed. To be watched on the devices.
- **Shared headers**: `aud_semaphore.hpp` and the test harness
  `aud_test.hpp` are copies of those of `aud_audio_graph`; a home in the
  core would serve both.
- **Code review** (`/code-review` at high effort on the callback paths;
  all ten findings fixed and tested):
  - Android duplex: the output stream kept the `FullDuplexStream` helper as
    its data callback after the close and the helper kept both streams, a
    reference cycle that leaked them on every duplex close or recovery; the
    device breaks it.
  - iOS route changes told streams about them after the backend's lock was
    released, so a stream closed meanwhile was used after its deletion; the
    backend now tells them under the lock, and the stream functions it
    calls take only the worker's lock (a route change is posted by the
    worker).
  - iOS observer blocks and the permission's completion block used the
    backend and the session raw; a guard the destructor clears and waits
    for keeps a late block from using them after the session is destroyed.
  - The hold had no opt-out: a client that never acknowledges stayed
    silent after any change of rate; `AUD_IO_STREAM_FOLLOW_FORMAT`
    (`followFormat`) skips the hold for render functions that follow the
    format on their own, as those of the package do.
  - A recovery whose start failed was reported as recovered on every
    attempt; it is reported once the device runs, as format change if any
    attempt changed the format (the null backend's
    `AUD_IO_FAULT_FAIL_START` tests it).
  - The callback cleared whole planes for every split block; it clears the
    frames of the block.
  - Resetting one stream's counters reset the session's dropped
    notifications for every stream; each stream keeps its own baseline.
  - The Android lifecycle listener of a session was never disposed; the
    platform releases it on detach.
  - The commit message of the repo did not describe all the changes.
- **review-light** (the review guide of the repo): the READMEs carry the
  new API in both languages. Fixed: the callback copies between
  interleaved and planar memory are helpers instead of five nested levels,
  the two retry loops share one backoff, Android and iOS share one default
  channel count, two scripts share the package resolution, and the Dart
  files carry the landmark comments of the code guide. Kept: the
  integration test of the example prints its measurements, which are its
  purpose on a device; `routeOf` maps Android's device types by number,
  and a test checks every number against Android's constants. A second pass
  after `gg do review` found no blocker; left as they are: some Dart
  classes put their static members before their fields, and
  `AudIoSession.inject` and `AudIoStream.open` take positional
  parameters.
- **The latency probe on a real device**: its first click - 1 ms of a
  constant level - came back below every threshold through the iPad's
  speaker and microphone. The click is now a 5 ms burst of 2 kHz at 0.8
  that starts at its peak, and the probe reports the largest input level
  it saw (`input_peak`), which tells a silent input from a quiet loop.
- **iOS duplex through miniaudio** adds up to five periods of input
  latency (26.7 ms at 256 frames) through its ring buffer, and its host
  times miss the measured round trip by about 2 ms even with the queued
  frames counted - twice the 1 ms of decision 2. Both speak for the
  RemoteIO path: one unit whose render callback pulls the input and
  carries the `AudioTimeStamp`, in S15 or before an instrument needs
  live input on iOS.
- **Open work for later tickets**: the drift-tracking resampler of
  lifecycle-001 for duplex streams whose input runs on another clock (a
  USB input with the built-in output); Oboe's channel masks (API 32),
  hardware channel count (API 34) and MMAP policy (API 36) of io-002; the
  choice of the output device on iOS, which routes outputs itself.
