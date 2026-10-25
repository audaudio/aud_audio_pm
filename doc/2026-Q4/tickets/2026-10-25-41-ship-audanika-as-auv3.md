# 41: S20 — Ship Audanika as AUv3 on macOS and iOS

Status: planned 2026-10-25 on the user's request ("Provide Audanika as an
AUV3 analog to the VST3"); platforms macOS and iOS and the requirements
`auv3` confirmed the same day; the plan confirmed by the user the same day
with the proposed answers to open questions 1, 2, 3 and 5.

## Goal

Musicians play Audanika inside the hosts that take Audio Units: Logic Pro,
GarageBand and MainStage on the Mac, Loopy Pro, GarageBand and Cubasis on
the iPhone. The Audanika app carries an AUv3 extension on macOS and
iOS, built on `aud_audio_auv3` as the VST3 is built on `aud_audio_vst3`:
the host plays Audanika's presets from its MIDI, the plugin window shows
Audanika's play surface, and a project keeps the preset and settings. The
ticket is S20 of [ticket 17](2026-10-07-17-audanika-audio-engine.md)
(milestone M3 of release-003) widened to macOS, and the AUv3 that ticket 37
left out. Serves [flutter-audio-kit](../goals/flutter-audio-kit.md) (R23)
through its first user, the app.

## Requirements

- [req-auv3-001](../../requirements/auv3.md#req-auv3-001-the-auv3-comes-with-the-app-on-macos-and-ios)
  (must): the AUv3 comes with the app on macOS and iOS
- [req-auv3-002](../../requirements/auv3.md#req-auv3-002-the-auv3-plays-audanikas-sounds-from-the-host)
  (must): the AUv3 plays Audanika's sounds from the host
- [req-auv3-003](../../requirements/auv3.md#req-auv3-003-the-auv3-shows-the-audanika-ui-as-its-editor)
  (should): the Audanika UI as the AUv3's editor
- [req-auv3-004](../../requirements/auv3.md#req-auv3-004-the-auv3-is-built-on-aud_audio_auv3)
  (must): the AUv3 is built on `aud_audio_auv3`
- [req-auv3-005](../../requirements/auv3.md#req-auv3-005-the-auv3-stays-within-an-extensions-memory-on-ios)
  (must): within an extension's memory on the iPhone

## What the code base gives

- `aud_audio_auv3` 0.1.1 is the iOS spike of ticket 24: an engine C API
  over the headless host with a hard-coded document (oscillator, filter,
  mixer, tap), no node packages, no assets; an extension `AudSpikeAU` in
  the example's iOS project with a fixed 48 kHz, a 100 MB ballast,
  parameters only (no MIDI, `fullState`, presets, transport, latency);
  Flutter in the extension from one `FlutterEngineGroup` with hard-coded
  knobs; a measurement container app; iOS only, no native tests, no
  `auval`. Pins core 0.5.4 and graph 0.5.5, as the VST3 does.
- `aud_audio_vst3` 0.3.0 is the shell of plugin-006 on macOS and Windows.
  Much of it knows nothing of VST3: the engine over the headless host with
  packages, presets and offline waits; `plugin.json`, presets and state
  (`aud_vst3_settings`); the package recipes and the generator of
  `scripts/build-plugin.js` (build-001); the host transport; the MIDI event
  builders; content lookup (`aud_vst3_bundle`); the Dart shell protocol
  (`aud_shell_*`). VST3-only: the component, parameters as normalized
  values, the factory and exports, the editor's IPlugView side, the SDK,
  the validator and the REAPER test.
- `aud_dsp_sampler` keeps one sample store per process with a budget
  (lifecycle-002, default 256 MB, preload 8192 frames, streaming): the
  instances in one extension process share their samples.
- `audanika_app` 4.6.0+171: the Mac app with the VST3 inside (ticket 37),
  `PluginBundle` exports `macos/plugin/document.json` and `presets.json`
  (app-009), the editor is the app in the profile `pluginEditor` with
  `ShellSoundEngine` (app-010), the library of bought albums reaches the
  editor through the app group's defaults. iOS ships through fastlane;
  `ios/Audanika FX` is an unused AUv3 template of the initial commit.

## Concept

### Repos (scope)

The format-agnostic core of the shells moves from `aud_audio_vst3` into
the new repo `aud_audio_plugin` (created 2026-10-25 on the user's choice):
engine, configuration, presets, state, package recipes and generator,
transport, MIDI events, content lookup and the shell protocol's messages.
`aud_audio_vst3` and `aud_audio_auv3` both build on it; CLAP (S19) will
too. Each shell keeps only its format and its editor transport.

### Bundle

```text
Audanika.app/Contents/                   (macOS; iOS: Audanika.app/)
|-PlugIns/Audanika.vst3                  macOS only, as before
|-PlugIns/AudanikaAUv3.appex             the AUv3, App Sandbox, app group
| |-Contents/MacOS/AudanikaAUv3          shell + graph + sampler + effects
| |                                      + script, entry points only
| |-Contents/Frameworks/App.framework    the Dart code of the editor
| |-Contents/Resources/aud_plugin/       plugin.json, document, presets
| |-Contents/Resources/content/sfz/      the SFZ content, once
|-Frameworks/                            Flutter (the extension loads it),
                                         App.framework of the app
```

Changed by the gate (2026-10-25): the App Sandbox lets the extension load
Flutter from the app's `Frameworks` but not read the app's resources, so
the content and the editor's Dart bundle live inside the extension; the
app and the VST3, which have no such limit, find the content there.

### The Audio Unit (aud_audio_auv3)

- **Identity** from `plugin.json`: name "Audanika", type `aumu`,
  manufacturer `Audn`, subtype `Audk`, version; extension bundle id
  `com.audanika.auv3` on both platforms (plugin-011); the build tool writes
  them into the extension's `AudioComponents` entry.
- **Render.** The `internalRenderBlock` renders the headless host at the
  host's sample rate and `maximumFramesToRender`; stereo output, no input.
- **MIDI.** MIDI 1.0 and UMP events of the render block become render
  events at their sample offsets; the document's `aud.graph.channel_split`
  routes channels 1 to 3 to bass, chord and melody and the others to
  `external` (app-009), as in the VST3.
- **Parameters** in the `AUParameterTree`: preset (indexed), delay mix,
  reverb mix, volume and the slider, with the VST3's ids (app-009).
- **Presets.** The 28 presets are the `factoryPresets`; `currentPreset` and
  the preset parameter follow each other; a preset applies its node presets
  on the engine's control thread with the crossfade of sampler-003.
- **State.** `fullState` carries the shell state of plugin-006 (preset id,
  parameter values, moved controls, editor settings), never a path.
- **Transport** from `musicalContextBlock` and `transportStateBlock`;
  free-running while the host stands (plugin-006).
- **Memory.** The sample cache budget of the extension process comes from
  `plugin.json` per platform (iOS lower than macOS), so that all instances
  of a host share one budget (req-auv3-005).
- **Build.** `aud_audio_auv3/scripts/build-plugin.js` takes the app's
  configuration and package config and builds, per platform (macOS arm64,
  iOS arm64, iOS simulator arm64), a static library of shell, graph and
  the named node packages with only the Audio Unit's classes visible, plus
  an `.xcconfig` with the identity. The app's extension target links it
  and holds no code of its own (req-auv3-004).

### Editor (in the extension, macOS and iOS)

An AUv3 already runs in a process of its own: always on iOS, and on macOS
as long as the extension ships no `AudioComponentBundle` for in-process
loading, which it does not. So the editor runs as Flutter inside the
extension on both platforms (plugin-003's iOS way, now also for macOS):
the extension's `AUViewController` shows a Flutter view of the app's own
Dart code, started from an entry point in the app's `App.framework`, in
the profile `pluginEditor` (app-010). One Flutter engine group per
extension process on iOS, an engine per view on macOS. The editor speaks
the shell protocol of the VST3 editor, carried in process through
`dart:ffi` (plugin-013) instead of the inherited socket, so
`ShellSoundEngine` gains a second transport and the editor's code stays
one. The extension
registers only the Flutter plugins the editor needs; none may touch
`UIApplication`. The bought albums come from the app group's defaults
(app-010), which the iOS app now writes too.

## Affected repos

- `aud_audio_pm`: the requirements `auv3`, this plan, the decisions the
  steps settle, the ticket in `issues.md`, the architecture; later the
  blog post.
- `aud_audio_plugin` (new, 0.1.0): the format-agnostic shell core moved out
  of `aud_audio_vst3`, its native tests, `index.jsonc` and README.
- `aud_audio_vst3`: built on `aud_audio_plugin`; keeps the VST3 component,
  its parameters, factory, editor transport, SDK, validator and the
  REAPER test; a minor version.
- `aud_audio_auv3`: from spike to shell on macOS and iOS — configuration,
  packages, MIDI, parameters, presets, state, transport, content, memory
  budget, editor bridge, build tool, test host and `auval`; spike leftovers
  removed (ballast, measurement parameters, measurement app); a minor
  version.
- `audanika_app`: the extension targets of the macOS and iOS projects, the
  configuration of the AUv3, the editor's entry point and AUv3 transport,
  the app group on iOS, the release lanes carrying the extension, `ios/
  Audanika FX` removed; a minor version.
- Added when a step needs them (process-005): `aud_audio_graph`,
  `aud_dsp_sampler`, `aud_dsp_effects`, `aud_audio_script` (iOS builds of
  their recipes, the sample cache budget through the headless host).

## Steps

Phase A — the shared core:

1. This plan, the requirements and the open questions; the user reviews
   and confirms.
2. `aud_audio_plugin`: the format-agnostic code moved from
   `aud_audio_vst3` (C++ sources, the recipes and generator of the build
   tool, the Dart shell protocol), renamed from `aud_vst3_*`; its native
   and Dart tests.
3. `aud_audio_vst3` on `aud_audio_plugin`: the native tests, the
   validator (47 of 47), the test host with the editor and the REAPER test
   pass as before on the Mac; the VST3 rebuilt and tried on the Windows
   machine of ticket 38.

Phase B — the gate:

4. Gate: the spike's Audio Unit built for macOS as well, with the sampler
   playing one preset and the app's editor in Flutter inside the
   extension: Logic Pro loads it and shows the editor; Loopy Pro on the
   iPhone plays four instances with editors for 10 minutes; the footprint
   recorded. Settles the editor in the macOS extension, the Flutter plugins
   an extension may register, and the iOS sample cache budget; a failure is
   decided with the user before the shell is built out.

Phase C — the shell:

5. `aud_audio_auv3`: the shell — identity from the configuration, packages
   compiled in, MIDI, parameters, factory presets, `fullState`, transport,
   content lookup, latency and tail, memory budget; the build tool for the
   three platforms; native tests, a test host on macOS (offline render,
   state round trip, two instances) and `auval -v aumu`.
6. `aud_audio_auv3`: the editor bridge — the view controller with the
   engine group, the shell protocol through dart:ffi (plugin-013), notes
   of the editor ended when its view goes.

Phase D — the Mac:

7. `audanika_app`: the AUv3's configuration next to the VST3's, the macOS
   extension target linking the shell, embedded and signed with the app
   group; the editor's entry point and `ShellSoundEngine` over
   `AudAuv3Shell`.
8. Logic Pro and GarageBand on the Mac: every preset from a MIDI region,
   automation, save and reopen, offline bounce, two instances, the editor;
   MainStage and Live if installed.

Phase E — iOS:

9. `audanika_app`: the iOS extension target, the app group on iOS and the
   bought albums in its defaults, the Flutter plugins of the editor.
10. Loopy Pro, GarageBand and Cubasis on the iPhone: every preset, save and
    reopen, the editor; one, two and four instances for 10 minutes each
    with the footprint recorded (req-auv3-005).

Phase F — ship:

11. `audanika_app`: the extension in the iOS lane (fastlane) and the macOS
    lane (`tool/release-mac.js`); TestFlight builds for iOS and macOS
    uploaded only on the user's go, installed and tried in the hosts of
    req-auv3-001.
12. `/code-review`, documentation (blog posts, `index.jsonc`, READMEs, the
    architecture), review, publish; the requirements set to `done`.

## Open questions

None.

## Answers of the plan review (2026-10-25)

The user confirmed the plan with the proposed answers:

1. **Component codes:** type `aumu`, manufacturer `Audn`, subtype `Audk`
   (plugin-011); hosts store them in every project, so they never change.
2. **Extension bundle id:** `com.audanika.auv3` on both platforms; its App
   ID and profiles are created by Xcode's automatic signing in the team's
   account, only on the user's go.
3. **Windows:** the VST3 is rebuilt and tried on the Windows machine of
   ticket 38 after the move (step 3).
4. **One ticket:** the iOS phases E and F may move to a follow-up ticket
   if the Mac takes longer.
5. **Hosts (later the same day):** the Mac with Logic Pro and GarageBand,
   the user's iPhone with Loopy Pro, GarageBand and Cubasis; the acceptance
   of req-auv3-001 to -005 changed accordingly (no AUM, no iPad).

## Findings

- **Step 2, the files to move (2026-10-25).** From `aud_audio_vst3` into
  `aud_audio_plugin`, renamed from `aud_vst3_*`: `src/aud_vst3_engine`,
  `_settings`, `_packages.hpp`, `_transport`, `_sync`, `_ui_thread`,
  `_bundle` (with `_bundle_mac.mm` and `_bundle_win.cpp`, the `.vst3` path
  discovery made format-neutral), the event builders of `_midi`; the
  recipes and the generator of `scripts/build-plugin.js`; the Dart
  messages and codec `lib/src/aud_shell_message.dart` and
  `aud_shell_codec.dart`; their tests in `test/native` and `test/`. Stays
  in `aud_audio_vst3`: `_plugin`, `_param`, `_factory`, `_exports.exp`,
  `_config.hpp`, the editor and its transports (`_editor.mm`,
  `_editor_win.cpp`, `_socket`, `_surfaces`, `_mach.h`, `_objc`,
  `aud_shell_client.dart`, `aud_shell_fd.dart`), the SDK, validator, test
  host and REAPER test.
- **Steps 2 and 3 (2026-10-25).** `aud_audio_plugin` holds the core in the
  namespace `aud_plugin`: engine, settings and state, packages, transport,
  MIDI event builders (with channel pressure and pitch bend), semaphore,
  and `binaryPath`/`resolvedPath` with the content locations and the log
  on macOS, iOS (no `NSWorkspace`) and Windows; `scripts/plugin-build.js`
  with the recipes, the compile cache and the generated registration;
  `doc/plugin-config.md`; the Dart messages and codec. 46 native tests
  (9 new of the engine) and 52 Dart tests pass. `aud_audio_vst3` keeps the
  hidden MIDI parameters, `bundleOf` of the `.vst3` and its editor
  transports, names the core through `aud_vst3_shared.hpp`, loads
  `plugin-build.js` through the package config and re-exports the
  protocol: 4 native test files pass, the example exports only its three
  entry points, the validator passes 47 of 47, the test host plays both
  presets and restores the state, 11 Dart tests pass. Not run: REAPER (not
  installed on this Mac) and the Windows build, which waits for the
  Windows PC. `gg one can commit` of `aud_audio_vst3` fails on the
  coverage of `aud_shell_fd.dart:44`, as it does without the move.
- **Gate, macOS (2026-10-25).** A probe app (Flutter 3.47.5, release) with
  an AUv3 extension built by a script on `plugin-build.js` - the engine of
  `aud_audio_plugin` with the graph's own nodes, host MIDI, a parameter,
  `fullState`, and an `AUViewController` that runs Flutter with the app's
  Dart code from the entry point `auEditorMain`. A Swift test host loads it
  out of process as Logic Pro does (0.7 to 0.9 s), renders offline (peak
  0.13), restores the state and opens the editor: Flutter starts inside the
  extension, its first message reaches the unit 60 ms after the view
  appears, it draws 62 frames in its first second, and its note reaches the
  unit. `auval -v aumu AGat Audn` passes. Findings for the shell: the App
  Sandbox lets the extension load FlutterMacOS from the containing app's
  `Frameworks` but not read the app's resources, so the Dart bundle
  (`App.framework`, 5.8 MB in the probe) travels inside the `.appex`; on
  macOS a Flutter engine runs only once its view controller exists; a
  read-only parameter reaches an out-of-process host only when the unit
  sets it. Open: Logic Pro by hand, and the iPhone half.
- **Gate, iOS probe built (2026-10-25).** The core, the graph and the app's
  sampler, effects and script build for iPhone (arm64, iOS 15) with
  `plugin-build.js` into a static library that an extension target of the
  probe's Xcode project links, without code of its own; the extension
  carries the app's document, 28 presets and SFZ content (112 MB) and the
  Dart bundle (3.9 MB), its binary is 5 MB. In a Flutter project the phase
  "Embed Foundation Extensions" must come before Flutter's run script, or
  Xcode reports a cycle. The probe app hosts one, two and four instances
  out of process with editors and notes, each instance on another preset,
  and logs the footprint and the sample cache (96 MB budget).
- **Gate, iOS (2026-10-25).** Signed with the user's Personal Team, iOS
  did not register the extension at all (-3000, no component of `Audn`):
  the container app needs the Inter-App Audio capability, which a Personal
  Team cannot sign - with it, under the team SAZSC68S46 (App IDs
  `com.audanika.auv3gate` and `.auv3`, created for the probe on the user's
  go; `io.audaudio.audGate` and `.auv3` stay in the Personal Team), the
  system finds the unit at once. On the iPad Pro 11-inch (M5), 60 s per
  stage, each instance on another preset of the app, editors open and a
  note every half second on channels 1 to 3:

  | Instances | Load | Footprint | Sample cache | Peak | Editor frames, 1st s |
  | --- | --- | --- | --- | --- | --- |
  | 1 | 126 ms | 122 MB | 3 MB | 0.26-0.47 | 121 |
  | 2 | 75 ms | 130 MB | 19-22 MB | 0.43-0.63 | 121-122 |
  | 4 | 134 ms | 214-220 MB | 56-64 MB | 0.22-0.81 | 121-122 |

  No instance was terminated; every one opened the app's document from
  the content inside the extension and played its preset; four instances
  stay well below the 360 MB of plugin-001. As on macOS, a read-only value
  reaches the host only when the unit sets it, so the unit reports every
  2 s. The user then stopped the iPhone run ("Skip the iphone check. It
  works"); the iPhone's numbers come with step 10. Settled: plugin-012
  (Flutter in the extension on both platforms), the content and the Dart
  bundle inside the extension, Inter-App Audio for the iOS app, a sample
  cache budget per platform. Open: the Flutter plugins the app's editor
  registers in the extension (step 7 and 9), the iPhone's footprint, Logic
  Pro by hand.
- **Steps 5 and 6 (2026-10-25).** `aud_audio_auv3` is a shell:
  `AudAuv3AudioUnit` over the engine of `aud_audio_plugin` with the
  parameters `preset`, `<node>_<param>` and `control_<id>` (an identifier
  holds no '.', the tree's delimiter), the factory presets, `fullState`
  with the shell's state under `aud_state`, the host's MIDI 1.0 and UMP
  events and scheduled parameter changes at their sample offsets, the
  musical context and transport state as the graph's transport, offline
  waits for a preset. A preset chosen on the main thread applies at once on
  the control thread, so that a parameter the host sets right after keeps
  its value; the render thread only requests one. On the user's request
  the editor talks to the unit with `dart:ffi` instead of a platform
  channel: four exported C functions (`src/aud_auv3_editor_api.h`), the
  editor started with `--aud-auv3-instance=<n>`, the unit's messages to a
  `NativeCallable.listener`, the shell protocol's JSON either way
  (`AudAuv3Shell`, pure Dart with `ffi`). `scripts/build-plugin.js` builds
  a static library for macOS, iOS and the simulator, the extension's
  `Info.plist` and an xcconfig; the example's iOS extension target has no
  code of its own. Measured: the test host loads the example out of
  process on macOS, both presets sound, the state holds, realtime blocks
  of 128 frames take at most 0.13 ms, two instances play, the editor says
  hello 58 ms after it starts, `auval -strict` passes, 13 native and 5
  Dart tests pass; on the iPad two instances load in 145 ms, the host's
  preset choice applies, both editors open and the unit answers after
  20 s. Found on the way: the extension must share the app's versions
  (`CFBundleVersion`, an xcconfig of the app takes Flutter's) and team
  (hardened runtime); the iOS engine ships an extension-safe Flutter for
  step 9.
- **Step 7 (2026-10-25).** The Mac app carries the AUv3: an extension
  target `AudanikaAUv3` (`com.audanika.auv3`) without code of its own -
  an empty source, the app's xcconfig with Flutter's and the shell's
  settings and the app's versions, the sandbox and the app group - built
  by `tool/build-auv3.js` from `macos/plugin/auv3.json` (the VST3's
  document and presets, the codes `aumu`/`Audk`/`Audn`). The extension
  copies its configuration and the SFZ content into itself; the app reads
  the content there (`SfzContent.bundleRootOf`), the VST3 through a new
  first location of its `plugin.json`; the content exists once. Runner's
  phase "Embed AUv3 Extension" embeds it after Flutter's script with the
  app's `App.framework` and signs inside out; the editor flavor carries
  none, so the editor inside the VST3 registers no second unit. The
  editor is `auv3EditorMain` of `main.dart`: `Auv3Editor` makes the same
  `AudanikaSession` as the VST3 editor from the unit's welcome. The
  target signs locally without a profile; the App ID follows with step 11.
  Measured with the shell's test host, out of process: all 28 presets
  sound (peaks 0.26 to 0.89), the state holds, realtime blocks of 128
  frames take at most 0.39 ms, two instances play, the editor's hello
  comes after 98 to 163 ms, `auval -strict` passes; the app is 232 MB
  (VST3 45 MB, AUv3 143 MB). The VST3 builds on `aud_audio_plugin` with
  the app's tool. With the screen recording the user granted, the test
  host's `--snapshot` shows the editor out of process: Audanika's play
  surface "Freies Spiel" with its chord rows, library and settings - the
  app's session runs inside the extension. A tap into it (`--tap`) needs
  the Accessibility permission, which this session lacks. Open: playing
  the surface in Logic Pro and GarageBand (step 8); the shared purchases
  in the extension, which registers no Flutter plugin - the library shows
  the free songs, bought albums stay locked.
- **Dropouts in GarageBand and Logic Pro:** the user heard dropouts
  playing the AUv3, in GarageBand without Audanika too. The cause was a
  booted iOS Simulator playing an app's audio: coreaudiod reported its
  simulated output device overloaded thousands of times an hour, on the
  headphones the hosts played through. With the simulator shut down the
  overloads and the dropouts are gone. The unit's render meter
  in GarageBand: blocks of 128 frames at 44.1 kHz (1024 while the track
  is not live), the slowest 0.30 ms of 2.90 ms, none late; in Logic Pro
  blocks of 512 frames, the slowest 1.11 ms of 11.61 ms, none late. Live in the
  test host (`--play`, realtime mode) no stream underflows, the samples
  take 12 MB of the 256 MB cache; the open editor costs the extension
  0.2 to 2 % CPU. The test host's `realtime` check renders in
  AVAudioEngine's offline mode, which sets the unit to render offline.
- **The editor's settings in Logic Pro:** Logic did not keep what the user
  changed in Audanika's UI. The unit kept the settings in fullState but
  told the host nothing, where the VST3 calls `setDirty`; AUv3 has no
  documented call for it. Since a change notifies the observers of
  `fullState` and `fullStateForDocument`, Logic saves them: the log shows
  the settings arrive (429 bytes), Logic takes the state with them and
  restores them when the project opens again.
- **Step 9, the iOS extension (2026-10-25).** The iOS app carries the
  extension target `AudanikaAUv3` (`com.audanika.auv3`) as the Mac app
  does: no code of its own, `ios/AudanikaAUv3/AudanikaAUv3.xcconfig` with
  Flutter's and the shell's settings, Runner embedding it before Flutter's
  script and putting the app's `App.framework` into it after "Thin
  Binary". The content lives once, inside the extension
  (`PlugIns/AudanikaAUv3.appex/content/sfz`); the app reads it there. The
  extension is signed with the team's wildcard development profile, the
  app with its own and Inter-App Audio. On the iPad Pro iOS lists the unit
  at once and Loopy Pro plays it. The editor first stayed empty: the app's
  setup asked `device_info_plus` whether it runs in the simulator, and
  the extension registers no Flutter plugins - found with a temporary file
  log in the extension's container, which `devicectl` copies without
  root. The app now tells the simulator by its environment
  (`SIMULATOR_DEVICE_NAME`); the editor shows in Loopy, three instances
  build their session about 0.5 s after the welcome, the editor's settings
  reach the unit. Open in step 9: the app group on iOS and the bought
  albums in the extension.
- **MIDI output (2026-10-25).** On the user's request the AUv3 offers the
  notes played on Audanika's UI as a MIDI source, as the VST3 does through
  its event output: `MIDIOutputNames` "MIDI Out", the notes at the block's
  start through the host's MIDI output block or MIDI event list block.

## Out of scope

- MIDI from the editor to the host (not required; possible later through
  `MIDIOutputEventBlock`, as app-010 does for the VST3).
- In-process loading on macOS (`AudioComponentBundle`), Intel Macs
  (release-005), visionOS.
- User presets of the AUv3 beyond what the host keeps itself, note
  expressions and MPE, the voice governor in the plugin (ticket 34).
- CLAP (S19), beyond the shared core it will use.

## Decisions

Recorded at planning:

- [plugin-010](../concepts/decisions/plugin-010.md) (accepted): the shared
  shell core in `aud_audio_plugin`.
- [plugin-011](../concepts/decisions/plugin-011.md) (accepted): the AUv3
  inside the app on macOS and iOS, its identity and build.
- [plugin-012](../concepts/decisions/plugin-012.md) (accepted with the
  gate on 2026-10-25): the AUv3 editor in the extension on both platforms,
  refines plugin-003.

Recorded on the way:

- [plugin-013](../concepts/decisions/plugin-013.md) (accepted, the user's
  request): the editor talks to its unit through dart:ffi, superseding
  the platform channel of plugin-012.

## Model and rules

Claude Opus 5.5 (process-004); the standing rules of process-005.
Measurements on the development Mac (Apple M5) and the user's iPhone; uploads to App Store Connect only on the user's go.

## Rests on

plugin-001 to plugin-007, release-003, release-005, lifecycle-002,
sampler-003, app-009, app-010, build-001, process-004, process-005;
tickets 17 (S20), 24 and 37.
