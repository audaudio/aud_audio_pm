# 38: Make all repos run on Windows — the Windows audio device

Status: ticket 38 makes the repos of the family build and test on Windows
and gives `audanika_app` a Windows runner; the app starts the real engine
there (`SoundEngine.isSupported`), but `aud_audio_io` has only the null
device on Windows, so it stays silent. On 2026-10-24 the user added the
Windows audio device to this ticket instead of a ticket of its own. This
file holds its plan; confirmed by the user on 2026-10-24 with the answers
below. Implemented the same day: the app plays on the earphones of the
development PC and follows the default output (see Findings), at the one
period of 480 frames its drivers grant in shared mode.

## Goal

Players hear the Audanika app on Windows. `aud_audio_io` gets a real
Windows output device — miniaudio on WASAPI, as macOS got miniaudio on the
HAL in ticket 37 (io-004) — so that the engine's blocks reach the default
output and follow it when it changes. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R5 Windows, R14
`aud_audio_io`) through its first user, the app.

## Requirements

- [req-windows-001](../../requirements/windows.md#req-windows-001-the-app-plays-its-sounds-through-the-default-output)
  (must): the app plays its sounds through the default output and follows
  it

## What the code base gives

- `aud_audio_io` vendors miniaudio 0.11.25, today compiled only into the
  Apple backends. Its WASAPI backend already opens shared-mode streams
  through `IAudioClient3::InitializeSharedAudioStream` — the low-latency
  periods io-001 wanted from a dedicated backend — when the stream runs at
  the mix format's rate or `wasapi.noAutoConvertSRC` is set, and the
  period asked for is not above the engine's maximum.
- The macOS device (`src/aud_io_macos.mm`, io-004) is the pattern: devices
  listed by the platform API, always opened by id so that miniaudio never
  switches devices on its own, a stream without an id follows the default
  by reopening, listeners on a queue of the backend report losses through
  `streamDeviceLost`, estimated host times (time-001). Its decisions live in
  `hal::` of `aud_io_internal.hpp`, tested on every platform.
- The hook builds the null device on Windows; the native tests compile
  every `src/*.cpp` with the clang++ of Visual Studio (ticket 38) and keep
  the null device. `aud_clock.h` reads QueryPerformanceCounter on Windows.
- The development PC (GEEKOM A7, Realtek and AMD HDMI audio) is reached
  over Remote Desktop: its session sees one endpoint, "Remoteaudio". The
  local endpoints appear at the console or with the client's "play on
  remote computer".

## Concept

- **Backend**: `src/aud_io_windows.cpp`, miniaudio with only WASAPI, shared
  mode. The hook builds it for Windows with `AUD_IO_WINDOWS_DEVICE` and
  links `ole32`; the native tests compile it empty and keep the null
  device, as with macOS.
- **Devices**: the active render and capture endpoints of
  `IMMDeviceEnumerator`. Id: the endpoint id (UTF-8). Name:
  `PKEY_Device_FriendlyName`. Channels and the one rate: the mix format
  (`PKEY_AudioEngine_DeviceFormat`); other rates are resampled. Route:
  the form factor (`PKEY_AudioEndpoint_FormFactor`: speakers, headphones,
  headset, line, S/PDIF, HDMI, microphone), USB and Bluetooth by the
  endpoint's bus where Windows tells it. Defaults: the console role. An
  endpoint has one direction, so a headset lists as two devices.
- **Open**: always by endpoint id, also for the default, with automatic
  stream routing off; a stream without an id follows the default by
  reopening (io-004). At the mix rate with `noAutoConvertSRC`, so that
  `IAudioClient3` takes the period; 256 frames by default as on macOS,
  rounded by Windows to its fundamental period. The audio thread joins
  MMCSS "Pro Audio" in the low-latency mode.
- **Changes**: an `IMMNotificationClient` hands every event to a thread of
  the backend (COM, multithreaded), which does what the HAL queue does on
  macOS: a removed or disabled endpoint reopens its streams, a new default
  reopens the streams that follow it, a new mix format reopens for its
  rate or channels as `hal::lossOf` weighs them, and the device list
  reaches the session. A miniaudio device that stops without being asked
  (`AUDCLNT_E_DEVICE_INVALIDATED`: a new format, a driver reset, another
  app in exclusive mode) is a loss too. These decisions go to `wasapi::`
  in `aud_io_internal.hpp`, with native tests on every platform.
- **Time**: estimated host times as on macOS — callback time plus the block
  and the stream latency of the audio client. An xrun counts when the
  output queue was empty at a callback.
- **Microphone**: desktop apps get no prompt on Windows; the permission is
  denied when the privacy setting denies desktop apps the microphone, else
  granted, and a request answers at once.

## Affected repos

- `aud_audio_io`: the device, the hook, the `wasapi::` decisions and their
  native tests, the comments that still say "null device on Windows",
  README and CHANGELOG; minor version.
- `audanika_app`: no code change expected; the comment on
  `SoundEngine.isSupported`, and the check that the app sounds.
- `aud_audio`: the Windows line of its README.
- `aud_audio_pm`: this plan, req-windows-001, decision io-005, the engine
  plan (S3b to S3d) and io-001's open work.
- `audaudio.github.io`: the platforms of the Audio IO page.

## Steps

1. This plan, req-windows-001, the answers of the review and decision
   io-005; confirmed 2026-10-24.
2. `aud_audio_io`: the `wasapi::` decisions and their native tests.
3. `aud_audio_io`: `aud_io_windows.cpp` — enumeration, open and close,
   notifications, permission, time; the hook builds it for Windows.
4. `aud_audio_io`: `node scripts/test-native.js` and `flutter test` on
   Windows; a sine through the example on the Remote Desktop endpoint.
5. `audanika_app`: `flutter run -d windows`, every preset sounds; the
   stream's format, latency, xruns and late callbacks of 100 notes.
6. The acceptance on the earphones in the Realtek jack: switch the default
   output, unplug the earphones; the user does what needs hands at the PC.
7. The engine plan, io-001's open work and the docs (READMEs, CHANGELOG,
   the Audio IO page); blog posts in the review of ticket 38.

## Answers of the plan review (2026-10-24)

1. **Name of the step:** the Windows part of S3b, as the engine plan and
   io-004 have it (S3c is AUHAL with workgroups on macOS, S3d
   `IAudioClient3`); the READMEs, release-005 and the comments that say
   "Windows and Linux follow with S3c and S3d" are corrected. Through
   miniaudio the step also brings the `IAudioClient3` periods of S3d; S3d
   keeps the native timestamps (`IAudioClock`) and exclusive mode.
2. **Exclusive mode:** later, with S3d. `AUD_IO_STREAM_EXCLUSIVE` stays
   shared on Windows in this ticket.
3. **Acceptance:** the user plugged earphones into the Realtek jack of the
   development PC; the checks run on that local device. The Remote Desktop
   client plays the session's audio on the remote computer for it, so that
   the session sees the local endpoints instead of "Remoteaudio".

## Findings (2026-10-24)

- Tests on Windows: 69 native tests under ASan/UBSan, the 9 of `wasapi::`
  among them (no RealtimeSanitizer or ThreadSanitizer in the LLVM of
  Visual Studio); 83 Dart tests; the example's device test plays a sine.
  Its duplex test now skips without an input endpoint.
- Remote Desktop: the session sees one endpoint, "Remoteaudio" (form
  factor remote network device, route virtual), 44.1 kHz, a period of 441
  frames, 970 frames of buffer, 20 ms of output latency, no xrun. The
  client's "play on remote computer" did not reach the running session;
  `tscon 2 /dest:console` moved it to the console, which sees the local
  endpoints.
- Earphones in the front jack ("Realtek HD Audio 2nd output", headphones),
  a sine for four minutes: 48 kHz, a period of 480 frames, 1056 frames of
  buffer, 960 frames (20 ms) of estimated output latency, 23992 callbacks,
  no xrun, one late callback. The default switched to "Speakers" and back
  reopened the stream in 67 and 80 ms, the earphones unplugged moved it to
  "Speakers" in 93 ms (removed endpoint), plugged in back in 64 ms (new
  default).
- The app on the earphones: every preset sounds, about 100 notes without
  an xrun (the user, by ear and the voice budget panel). That build may
  have run the stub engine (`SoundEngine.isSupported` left out Windows for
  a while), so the user listened again with the engine on Windows
  restored: the app plays.
- The startup of the app under `flutter run` waits about 11 s (74 s on
  the first run after a build) for `aud_dsp_sampler.dll` to load; the app
  started directly shows its window in about 3 s with the engine on this
  device. Not the device: investigated apart.
- The engines of all three outputs (Realtek, AMD HDMI) grant shared
  streams one period only: default, fundamental, minimum and maximum 480
  frames (`IAudioClient3::GetSharedModeEnginePeriod`). The 256 frames the
  stream asks for round up to 480; a shorter period needs exclusive mode
  (S3d) or a driver with smaller periods, such as Microsoft's inbox
  HDAudio driver (128 to 480 frames).

## Open questions

None. The user changed the first check of req-windows-001 on 2026-10-24
from 256 frames to the smallest period the device grants in shared mode,
and req-windows-001 is done.

## Out of scope

- Native timestamps from `IAudioClock`, exclusive mode, ASIO (S3d,
  io-001).
- A device choice in the app; input in the app.
- Linux (its part of S3b).

## Rests on

io-001, io-004, time-001, lifecycle-001, release-005;
[audio-io-platforms](../concepts/topics/audio-io-platforms.md) (Windows);
tickets 21 (S3) and 37 (the macOS device).
