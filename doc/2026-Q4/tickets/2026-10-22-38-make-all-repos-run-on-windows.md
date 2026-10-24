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

Later on 2026-10-24 the user added the VST3 plugin on Windows to this
ticket ("Bitte bring Audanika als VST3 unter Windows zum Laufen … Führe
alles im Rahmen von existierenden Ticket 38 aus"); its plan is
[part 2](#part-2-the-vst3-plugin-on-windows) below.

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
- The startup of the app under `flutter run` waited about 11 s (74 s on
  the first run after a build) for `aud_dsp_sampler.dll` to load; the app
  started directly showed its window in about 3 s with the engine on this
  device. Not the device: the build hook of `aud_dsp_sampler` rewrote its
  wrapper sources on every run, so every build relinked sfizz into a new
  library, whose first load stalled. Fixed in this ticket: the hook writes
  them only when they change; the library loads in 3 ms, `AudEngine()`
  takes 25 to 54 ms and a build 17.5 instead of 74 s.
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

## Part 2: the VST3 plugin on Windows

Status: planned 2026-10-24 on the user's request; the user chose the
plugin first and the Audanika editor after it, both in this ticket, and the
content in the folder of the Windows app, reached through a link; the
requirements req-windows-002 and req-windows-003 confirmed the same day.
The user confirmed this part on 2026-10-24. Implemented the same day: the
plugin plays in REAPER and Cubase 15 with Audanika's editor (see Findings);
open is one note the user heard hang after the fix of the lost mouse ups.

### Goal

Musicians play Audanika in their DAW on Windows, as on the Mac (ticket 37):
the DAW plays Audanika's presets from its MIDI tracks, a project keeps the
preset and settings, and the plugin window shows Audanika's play surface.
The plugin is the same shell of `aud_audio_vst3`, configured by the app and
built into the folder of the Windows app, which carries the content once.
The Windows part of S18. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R5 Windows, R23 plugin
formats) through its first user, the app.

### Requirements

- [req-windows-002](../../requirements/windows.md#req-windows-002-the-vst3-plugin-plays-audanikas-sounds-on-windows)
  (must): the VST3 plugin plays Audanika's sounds on Windows
- [req-windows-003](../../requirements/windows.md#req-windows-003-the-plugin-shows-the-audanika-ui-on-windows)
  (should): the plugin shows the Audanika UI on Windows

### What the code base gives

- `aud_audio_vst3` builds the shell for Apple silicon only
  (`scripts/build-plugin.js`: Apple's clang, `-bundle`, frameworks, an
  exported-symbols list, `codesign`). A probe with the clang++ of Visual
  Studio (`x86_64-pc-windows-msvc`) compiles the vendored SDK subset but
  `macmain.cpp`, and the shell's MIDI, settings and transport; engine,
  parameters, plugin and factory stop at `<dispatch/dispatch.h>`: the
  engine's control thread waits on dispatch semaphores, and a preset that
  applied reaches the UI thread through `dispatch_get_main_queue()`. macOS
  only: `aud_vst3_bundle.mm` (the bundle through `dladdr`, links through
  `realpath`, the app through `NSWorkspace`, the unified log), the editor
  (`aud_vst3_editor.mm`, IOSurfaces and Mach), the socket pair
  (`aud_vst3_socket.cpp`, POSIX), the test host (`test/host/*.mm`).
- `aud_audio_script` already has the pattern for the semaphores:
  `aud_script_sync.hpp`, a Win32 semaphore on Windows, a dispatch
  semaphore on Apple (script-001).
- Graph, core, sampler, effects and script build and test on Windows
  (ticket 38); their hooks hold the Windows flags the plugin's recipes must
  mirror (build-001).
- `audanika_app` has a Windows runner: `Audanika.exe` with `content/sfz`
  next to it (`build/windows/x64/runner/<Mode>`). The editor of the Mac is
  the flavor `editor` (`lib/main_plugin_editor.dart`), started by the
  plugin with an inherited socket (`--fd`), which `AudShellFd` refuses on
  Windows; `AudShellClient.connect` reaches a Unix domain socket on every
  platform, Windows included (the app's tests of ticket 38).
- On the development PC: REAPER 7.82 (x64) and Cubase 15; no VST3 in
  `C:\Program Files\Common Files\VST3` yet.

### Concept

**Bundle and place.** The VST3 bundle format of Windows:
`Audanika.vst3\Contents\x86_64-win\Audanika.vst3` (the DLL),
`Contents\Resources\moduleinfo.json` and `aud_plugin\` as on the Mac. The
app's build puts it next to `Audanika.exe`:

```text
<app folder>\
|-Audanika.exe                 the app, and the editor (--plugin-editor)
|-data\                        Flutter, the app's AOT code
|-content\sfz\                 the SFZ content, once
|-Audanika.vst3\Contents\
  |-x86_64-win\Audanika.vst3   shell + graph + sampler + effects + script
  |-Resources\                 moduleinfo.json, aud_plugin\, notices
```

A directory junction in a VST3 folder makes it visible to the DAWs, as the
link on the Mac does; a junction needs no administrator rights to create,
but `C:\Program Files\Common Files\VST3` does. The per-user folder
`%LOCALAPPDATA%\Programs\Common\VST3` needs none, if REAPER and Cubase scan
it (open question 1). The plugin resolves the junction
(`GetFinalPathNameByHandleW`) and finds the content through a new location
of `plugin.json`, `containing-folder:content/sfz`: the folder that holds the
bundle. No installer in this ticket.

**The shell on Windows (phase A).** x86-64 only, built by the same script
with the clang++ and lld-link of Visual Studio as a DLL that exports only
`GetPluginFactory`, `InitDll` and `ExitDll` (plugin-004; a `.def` file, no
symbol leaves otherwise), against the static runtime so that no DLL of
Visual Studio must be installed. Platform parts behind small seams:

- the semaphores of the engine's control thread as in `aud_script_sync.hpp`;
- the UI thread: a message-only window created in `initialize` (the DAW's
  UI thread), to which the control thread posts a preset's values;
- the bundle path from `GetModuleHandleExW`/`GetModuleFileNameW`, links
  resolved, logs to `OutputDebugStringW` and the file `AUD_VST3_LOG` names;
- the SDK's `dllmain.cpp` instead of `macmain.cpp`.

Without an editor the DAW shows its generic view: the presets as a program
list, delay mix, reverb mix, volume and the slider.

**The editor on Windows (phase B).** Windows lets a window of one process
be the child of a window of another, so the editor needs neither the Mac's
IOSurfaces nor its input injector:

- The plugin's view (`kPlatformTypeHWND`) is a child window in the DAW
  process. The editor draws into a child of that window: the Flutter view
  of the editor process, parented across the processes. Input, focus,
  cursor and scaling are Windows' own; the plugin sizes the child with its
  view.
- The editor is the app itself: `Audanika.exe --plugin-editor` starts the
  Dart entry point of the editor (the composition root of
  `main_plugin_editor.dart`, `@pragma('vm:entry-point')`) instead of
  `main`, so the app folder carries no second Flutter build.
- The channel: protocol 2 of ticket 37 over a Unix domain socket in
  `%TEMP%` with a random name and token, which the plugin listens on
  (Winsock `AF_UNIX`) and the editor reaches with `AudShellClient.connect`;
  no sandbox on Windows asks for a socket pair. Notes of the surface go to
  the graph and to the event output, as on the Mac (app-010); the plugin
  ends the editor's held notes when the editor ends.
- One editor process per DAW process with a view per instance, if the
  Windows embedder of Flutter takes several views; else a process per
  open view (the runner's `addView` answers -1, which the protocol knows).

### Affected repos

- `aud_audio_vst3`: the Windows build of the shell (platform seams, DLL,
  bundle, junction), the location `containing-folder:`, the native tests
  and the validator on Windows, the REAPER script on Windows; then the
  Windows editor view and the socket on Winsock; README, CHANGELOG,
  `doc/plugin-bundle.md`; minor version (0.x).
- `audanika_app`: `windows/plugin/plugin.json` (or the Mac's with a
  Windows location), `tool/build-plugin.js` on Windows with `--link`; then
  the runner's `--plugin-editor`, the editor's entry point and its native
  views on Windows, the editor on a socket path instead of `--fd`; README.
- `aud_audio_pm`: this part, req-windows-002 and -003, the decisions
  plugin-008 (the shell on Windows: bundle, place, content, threads) and
  plugin-009 (the editor on Windows: the app as editor, child windows,
  socket), release-005 and the plugin shells of the architecture.
- Added when a step needs them: a node package whose hook flags the
  recipes cannot mirror.

### Steps

Phase A — the plugin plays on Windows:

1. This part, req-windows-002 and -003; the user confirms.
2. `aud_audio_vst3`: the platform seams (semaphores, UI thread, bundle and
   logs, `dllmain.cpp`), the location `containing-folder:`; the native
   tests on Windows.
3. `aud_audio_vst3`: `build-plugin.js` and `validate.js` on Windows — the
   recipes with the hooks' Windows flags, the DLL with its three exports,
   the bundle, `--install` as a junction; the example plugin passes the
   validator.
4. `audanika_app`: `tool/build-plugin.js` on Windows: the plugin into the
   app folder (debug and release), `--link` places the junction.
5. REAPER (scripted with `scripts/reaper-test.js` on Windows): listed,
   every preset plays from a MIDI item, save and reopen, offline render
   against live playback, two instances; Cubase 15 by the user. Commit
   per repo.

Phase B — the Audanika editor on Windows:

6. `aud_audio_vst3`: the socket on Winsock `AF_UNIX`, the view for
   `kPlatformTypeHWND`, the editor started with `--plugin-editor`, the
   socket's name, token and instance; sizes, scale, close.
7. `audanika_app`: the runner's `--plugin-editor`, the editor's entry
   point, the native views as children of the plugin's windows, the
   editor on `AudShellClient.connect`.
8. REAPER and Cubase 15: the editor opens and follows the window's size;
   playing sounds and reaches a MIDI track; a preset chosen in the editor
   is kept by the project; open and close fifty times, two instances.

Phase C — documentation:

9. READMEs, CHANGELOGs, `index.jsonc`, plugin-008, plugin-009, the
   architecture; req-windows-002 and -003 to `done`.

### Findings (2026-10-24)

- **Step 2.** The shell's platform seams: `Semaphore` (`aud_vst3_sync`,
  as `aud_script_sync.hpp`), the UI thread (`aud_vst3_ui_thread`: the main
  queue, on Windows a message-only window the first instance creates and
  the last destroys, its waiting tasks run before), the bundle split into a
  shared part (`aud_vst3_bundle.cpp`: locations, `containing-folder:`,
  paths, log file) and one per platform (`aud_vst3_bundle_mac.mm`,
  `aud_vst3_bundle_win.cpp`: the module's path, junctions resolved by
  `GetFinalPathNameByHandleW`, `OutputDebugStringW`). `aud_audio_core`'s
  `AUD_EXPORT` may be defined empty by a build that links the engine into
  one binary. The native tests build on Windows with the clang++ of Visual
  Studio: 101 tests, among them a new test of the bundle's locations (15)
  and the socket's 8 on Winsock.
- **Step 3.** `scripts/vendor-vst3sdk.js` keeps the Windows sources of the
  SDK (`dllmain.cpp`, `threadchecker_win32.cpp`,
  `systemclipboard_win32.cpp`, `module_win32.cpp` for the validator), each
  source's headers scanned for its own target; the header list stays the
  same. `build-plugin.js` links a DLL with lld-link against the static C++
  runtime (it imports only system DLLs) and checks that it exports only
  `GetPluginFactory`, `InitDll` and `ExitDll`. The validator builds on
  Windows; the example plugin passes 47 of 47 tests. The sampler's recipe
  takes the hook's Windows flags (AVX, `_USE_MATH_DEFINES`, the forced
  `<cmath>`, shell32); QuickJS-ng's `_WIN32_WINNT` stays with its C files.
- **Step 4.** `tool/build-plugin.js --app release --link`: the plugin (4.6
  MB) in `build\windows\x64\runner\Release\Audanika.vst3` next to
  `audanika.exe` and `content\sfz`, put there by the app's CMake install
  step, and the junction
  `%LOCALAPPDATA%\Programs\Common\VST3\Audanika.vst3` to it. Through the
  junction the plugin finds its real folder and the content; the validator
  passes 47 of 47.
- **Step 5, REAPER.** REAPER 7.82 scans
  `%LOCALAPPDATA%\Programs\Common\VST3` by default (open question 1 for
  REAPER): "VST3i: Audanika (Audanika)". `scripts/reaper-test.js` on
  Windows renders all 28 presets offline with a note on the MIDI channels 1
  to 4 (peaks 0.21 to 0.91, 0.52 to 0.71 s each), plays live (peak 0.89)
  and reopens the saved project with its preset. The trance pattern peaks
  at 0.91 here, 0.89 on the Mac.
- **Step 5, Cubase.** Cubase 15 scans the user's folder too and plays the
  plugin (the user, 2026-10-24).
- **Steps 6 and 7, the editor.** The shell's Windows view
  (`aud_vst3_editor_win.cpp`, plugin-009) starts `audanika.exe
  --plugin-editor` for every open view, in a job object, with the socket,
  token, instance and window on its command line; `SocketServer` runs on
  Winsock `AF_UNIX` (its 8 tests pass on Windows, the socket pair stays
  POSIX). The app's runner runs the entry point `pluginEditorMain` and
  makes its Flutter view a child of the plugin's window; the Windows
  embedder of Flutter gives an engine one view (open question 2), so one
  process serves one view. In REAPER the editor shows Audanika's play
  surface in the plugin window and says hello about 1 s after it starts;
  the user played it in Cubase and REAPER.
- **Hanging notes (2026-10-24).** The user heard notes hang after dragging
  over the play surface and releasing, in Cubase, REAPER and the Windows
  app. A trace of pointers and MIDI in the editor found Flutter on Windows
  reporting a second mouse down without the up of the first (twice in one
  session): the surface took the lost pointer for a finger still down. The
  play surface's dispatcher (`PlaySpaceEventDispatcher`) now ends a pointer
  of a mouse as a cancel when the same mouse goes down again or hovers;
  widget tests cover both. After the fix one more note hung: the editor
  sent 1835 note ons and offs and the plugin received 536 of each in the
  traced part, balanced; a replay of the whole session through the plugin
  (a host on the SDK's hosting classes, all 28 presets) left no voice
  standing, every pause falling to silence within 5 s (E-Piano) to 11 s
  ("Fog in the cave", whose release holds full level for 3 s). Open:
  whether the note the user heard was such a long release.
- **State.** `getState` saved the preset of the last block, not the one the
  DAW had just set: REAPER's test saved preset 27 right after setting it
  and reopened preset 16. It now saves the controller's value; the test
  passes with the editor open.
- **Tests on Windows.** The REAPER script saves with `Main_SaveProjectEx`
  under its path (REAPER kept the new project unnamed and asked in a
  dialog), and captures the editor's window on Windows too.

### Open questions

1. **The VST3 folder.** Settled: REAPER 7.82 and Cubase 15 scan
   `%LOCALAPPDATA%\Programs\Common\VST3`.
2. **Several Flutter views.** Settled: the public API of the Windows
   embedder of Flutter 3.47 makes an engine with one view, so one editor
   process serves one view (plugin-009).
3. **The note the user heard after the fix.** A long release of a pad
   preset or a real hang; the replay of the session found no hang.

### Out of scope

- An installer, the Microsoft Store, code signing on Windows (a ticket of
  its own when Windows ships).
- Windows on ARM, 32-bit DAWs, CLAP and AAX.
- The Linux plugin.

### Rests on

plugin-001 to plugin-007, app-009, app-010, build-001, script-001,
release-005; ticket 37 (the shell, the editor and its protocol). Recorded
on the way: plugin-008 (the shell on Windows), plugin-009 (the editor on
Windows).
